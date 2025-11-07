import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useQuery, useMutation } from '@tanstack/react-query';
import { apiRequest, queryClient } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';
import { Plus, Trash2, Check, Menu } from 'lucide-react';
import type { Todo } from '@shared/schema';

interface User {
  id: number;
  name: string;
  role: string;
}

interface TodoListProps {
  currentUser: User;
  onOpenMobileMenu?: () => void;
}

const PRIORITY_COLORS = {
  low: 'bg-blue-500/10 text-blue-700 dark:text-blue-400',
  medium: 'bg-yellow-500/10 text-yellow-700 dark:text-yellow-400',
  high: 'bg-orange-500/10 text-orange-700 dark:text-orange-400',
  urgent: 'bg-red-500/10 text-red-700 dark:text-red-400',
};

export default function TodoList({ currentUser, onOpenMobileMenu }: TodoListProps) {
  const [newTodoText, setNewTodoText] = useState('');
  const [newTodoPriority, setNewTodoPriority] = useState<'low' | 'medium' | 'high' | 'urgent'>('medium');
  const { toast } = useToast();

  const { data: todos = [], isLoading } = useQuery<Todo[]>({
    queryKey: ['/api/todos'],
  });

  const createTodoMutation = useMutation({
    mutationFn: async (data: { task: string; priority: string }) => {
      return await apiRequest('POST', '/api/todos', data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/todos'] });
      setNewTodoText('');
      setNewTodoPriority('medium');
      toast({
        title: 'Success',
        description: 'To-do item added successfully',
      });
    },
    onError: () => {
      toast({
        title: 'Error',
        description: 'Failed to add to-do item',
        variant: 'destructive',
      });
    },
  });

  const updateTodoMutation = useMutation({
    mutationFn: async ({ id, updates }: { id: number; updates: Partial<Todo> }) => {
      return await apiRequest('PATCH', `/api/todos/${id}`, updates);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/todos'] });
    },
    onError: () => {
      toast({
        title: 'Error',
        description: 'Failed to update to-do item',
        variant: 'destructive',
      });
    },
  });

  const deleteTodoMutation = useMutation({
    mutationFn: async (id: number) => {
      return await apiRequest('DELETE', `/api/todos/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/todos'] });
      toast({
        title: 'Success',
        description: 'To-do item deleted',
      });
    },
    onError: () => {
      toast({
        title: 'Error',
        description: 'Failed to delete to-do item',
        variant: 'destructive',
      });
    },
  });

  const handleAddTodo = () => {
    if (!newTodoText.trim()) {
      toast({
        title: 'Validation Error',
        description: 'Please enter a task description',
        variant: 'destructive',
      });
      return;
    }

    createTodoMutation.mutate({
      task: newTodoText,
      priority: newTodoPriority,
    });
  };

  const handleToggleTodo = (todo: Todo) => {
    updateTodoMutation.mutate({
      id: todo.id,
      updates: { completed: !todo.completed },
    });
  };

  const handleDeleteTodo = (id: number) => {
    deleteTodoMutation.mutate(id);
  };

  const sortedTodos = [...todos].sort((a, b) => {
    if (a.completed !== b.completed) return a.completed ? 1 : -1;
    const priorityOrder = { urgent: 0, high: 1, medium: 2, low: 3 };
    return priorityOrder[a.priority] - priorityOrder[b.priority];
  });

  return (
    <div className="flex flex-col h-screen bg-background">
      <div className="flex items-center justify-between p-4 border-b bg-card">
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="icon"
            className="lg:hidden"
            onClick={onOpenMobileMenu}
            data-testid="button-mobile-menu"
          >
            <Menu className="h-5 w-5" />
          </Button>
          <h1 className="text-xl font-semibold">My To-Do List</h1>
        </div>
      </div>

      <ScrollArea className="flex-1 p-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-2">
            <CardTitle>Personal Tasks</CardTitle>
            <Badge variant="secondary">
              {todos.filter(t => !t.completed).length} pending
            </Badge>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex gap-2">
              <Input
                placeholder="Add a new task..."
                value={newTodoText}
                onChange={(e) => setNewTodoText(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleAddTodo()}
                className="flex-1"
                data-testid="input-new-todo"
              />
              <Select
                value={newTodoPriority}
                onValueChange={(value: 'low' | 'medium' | 'high' | 'urgent') => setNewTodoPriority(value)}
              >
                <SelectTrigger className="w-[130px]" data-testid="select-priority">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="low">Low</SelectItem>
                  <SelectItem value="medium">Medium</SelectItem>
                  <SelectItem value="high">High</SelectItem>
                  <SelectItem value="urgent">Urgent</SelectItem>
                </SelectContent>
              </Select>
              <Button
                onClick={handleAddTodo}
                disabled={createTodoMutation.isPending}
                data-testid="button-add-todo"
              >
                <Plus className="h-4 w-4 mr-1" />
                Add
              </Button>
            </div>

            {isLoading ? (
              <div className="text-center py-8 text-muted-foreground">Loading...</div>
            ) : sortedTodos.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                No to-do items yet. Add one to get started!
              </div>
            ) : (
              <div className="space-y-2">
                {sortedTodos.map((todo) => (
                  <div
                    key={todo.id}
                    className={`flex items-center gap-3 p-3 rounded-md border ${
                      todo.completed ? 'bg-muted/50' : 'bg-card'
                    }`}
                    data-testid={`todo-item-${todo.id}`}
                  >
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-6 w-6 shrink-0"
                      onClick={() => handleToggleTodo(todo)}
                      data-testid={`button-toggle-${todo.id}`}
                    >
                      <div
                        className={`h-5 w-5 rounded border-2 flex items-center justify-center ${
                          todo.completed
                            ? 'bg-primary border-primary'
                            : 'border-muted-foreground'
                        }`}
                      >
                        {todo.completed && <Check className="h-3 w-3 text-primary-foreground" />}
                      </div>
                    </Button>
                    <div className="flex-1 min-w-0">
                      <p
                        className={`text-sm ${
                          todo.completed
                            ? 'line-through text-muted-foreground'
                            : 'text-foreground'
                        }`}
                      >
                        {todo.task}
                      </p>
                    </div>
                    <Badge
                      className={`${PRIORITY_COLORS[todo.priority]} shrink-0`}
                      data-testid={`badge-priority-${todo.id}`}
                    >
                      {todo.priority}
                    </Badge>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 shrink-0 text-destructive hover:text-destructive"
                      onClick={() => handleDeleteTodo(todo.id)}
                      data-testid={`button-delete-${todo.id}`}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </ScrollArea>
    </div>
  );
}
