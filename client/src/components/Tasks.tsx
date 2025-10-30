import { useState, useEffect } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Plus, Calendar, User, CheckCircle2, Circle, Clock, XCircle, Search, Filter } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { apiRequest, queryClient } from '@/lib/queryClient';
import { format } from 'date-fns';

interface User {
  id: number;
  name: string;
  email?: string;
  role: string;
  avatar?: string;
}

interface TaskWithDetails {
  id: number;
  title: string;
  description?: string;
  startDate?: string;
  targetDate?: string;
  status: 'pending' | 'in_progress' | 'completed' | 'cancelled';
  remark?: string;
  createdBy: number;
  assignedTo?: number;
  conversationId?: number;
  createdAt: string;
  updatedAt: string;
  creatorName: string;
  assigneeName?: string;
}

interface TasksProps {
  currentUser: User;
  allUsers: User[];
  ws?: {
    isConnected: boolean;
    send: (message: any) => void;
    on: (type: string, callback: (data: any) => void) => () => void;
  };
}

const taskFormSchema = z.object({
  title: z.string().min(1, 'Title is required').max(200),
  description: z.string().optional(),
  startDate: z.string().optional(),
  targetDate: z.string().optional(),
  assignedTo: z.string().optional(),
  remark: z.string().optional(),
});

type TaskFormValues = z.infer<typeof taskFormSchema>;

const statusConfig = {
  pending: { label: 'Pending', icon: Circle, color: 'bg-purple-500/20 text-purple-700 dark:text-purple-300' },
  in_progress: { label: 'In Progress', icon: Clock, color: 'bg-blue-500/20 text-blue-700 dark:text-blue-300' },
  completed: { label: 'Completed', icon: CheckCircle2, color: 'bg-teal-500/20 text-teal-700 dark:text-teal-300' },
  cancelled: { label: 'Cancelled', icon: XCircle, color: 'bg-gray-500/20 text-gray-700 dark:text-gray-400' },
};

export default function Tasks({ currentUser, allUsers, ws }: TasksProps) {
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [filterView, setFilterView] = useState<'all' | 'created' | 'assigned'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTask, setSelectedTask] = useState<TaskWithDetails | null>(null);
  
  const isAdmin = currentUser.role === 'admin';

  // Listen for WebSocket task updates
  useEffect(() => {
    if (!ws || !ws.isConnected) return;

    const unsubscribeCreated = ws.on('task_created', (taskData) => {
      // Invalidate all task queries to refresh the list
      queryClient.invalidateQueries({ queryKey: ['/api/tasks'] });
    });

    const unsubscribeUpdated = ws.on('task_updated', (taskData) => {
      // Invalidate all task queries to refresh the list
      queryClient.invalidateQueries({ queryKey: ['/api/tasks'] });
      // Update selected task if it's the one being updated
      if (selectedTask && taskData.id === selectedTask.id) {
        setSelectedTask(taskData);
      }
    });

    const unsubscribeDeleted = ws.on('task_deleted', (data) => {
      // Invalidate all task queries to refresh the list
      queryClient.invalidateQueries({ queryKey: ['/api/tasks'] });
      // Clear selected task if it was deleted
      if (selectedTask && data.id === selectedTask.id) {
        setSelectedTask(null);
      }
    });

    return () => {
      unsubscribeCreated();
      unsubscribeUpdated();
      unsubscribeDeleted();
    };
  }, [ws, selectedTask]);

  const { data: tasks = [], isLoading } = useQuery<TaskWithDetails[]>({
    queryKey: ['/api/tasks', filterView],
    queryFn: async () => {
      // For admins, pass 'all' filter to get all tasks from everyone
      // For regular users, no filter shows their involved tasks
      const filterParam = filterView === 'all' && isAdmin ? '?filter=all' : 
                          filterView !== 'all' ? `?filter=${filterView}` : '';
      const response = await fetch(`/api/tasks${filterParam}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('auth_token')}`,
        },
      });
      if (!response.ok) throw new Error('Failed to fetch tasks');
      return response.json();
    },
  });

  const createTaskMutation = useMutation({
    mutationFn: async (data: TaskFormValues) => {
      return apiRequest('POST', '/api/tasks', {
        ...data,
        assignedTo: data.assignedTo ? parseInt(data.assignedTo) : undefined,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/tasks'] });
      setIsCreateDialogOpen(false);
      form.reset();
    },
  });

  const updateTaskStatusMutation = useMutation({
    mutationFn: async ({ id, status }: { id: number; status: string }) => {
      return apiRequest('PATCH', `/api/tasks/${id}`, { status });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/tasks'] });
      setSelectedTask(null);
    },
  });

  const form = useForm<TaskFormValues>({
    resolver: zodResolver(taskFormSchema),
    defaultValues: {
      title: '',
      description: '',
      startDate: '',
      targetDate: '',
      assignedTo: '',
      remark: '',
    },
  });

  const onSubmit = (data: TaskFormValues) => {
    createTaskMutation.mutate(data);
  };

  const filteredTasks = tasks.filter(task =>
    task.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    task.description?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const getStatusBadge = (status: string) => {
    const config = statusConfig[status as keyof typeof statusConfig];
    if (!config) return null;
    const Icon = config.icon;
    return (
      <Badge variant="secondary" className={`${config.color} flex items-center gap-1`} data-testid={`badge-status-${status}`}>
        <Icon className="w-3 h-3" />
        {config.label}
      </Badge>
    );
  };

  return (
    <div className="flex flex-col h-full bg-gradient-to-br from-purple-50 via-blue-50 to-teal-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
      <div className="p-3 md:p-4 border-b bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm">
        <div className="flex items-center justify-between gap-2 mb-3">
          <h1 className="text-xl md:text-2xl font-bold bg-gradient-to-r from-purple-600 via-blue-600 to-teal-600 bg-clip-text text-transparent" data-testid="text-tasks-title">
            <span className="hidden sm:inline">Task Management</span>
            <span className="sm:hidden">Tasks</span>
          </h1>
          
          <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
            <DialogTrigger asChild>
              <Button 
                size="sm" 
                className="bg-gradient-to-r from-purple-600 to-blue-600 hover-elevate active-elevate-2"
                data-testid="button-create-task"
              >
                <Plus className="w-4 h-4 md:mr-1" />
                <span className="hidden md:inline">New Task</span>
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-[calc(100vw-2rem)] sm:max-w-2xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Create New Task</DialogTitle>
              </DialogHeader>
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                  <FormField
                    control={form.control}
                    name="title"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Task Title</FormLabel>
                        <FormControl>
                          <Input placeholder="Enter task title" {...field} data-testid="input-task-title" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="description"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Description</FormLabel>
                        <FormControl>
                          <Textarea 
                            placeholder="Enter task description" 
                            {...field} 
                            className="min-h-[100px]"
                            data-testid="input-task-description"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <div className="grid grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="startDate"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Start Date</FormLabel>
                          <FormControl>
                            <Input type="date" {...field} data-testid="input-task-start-date" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="targetDate"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Target Date</FormLabel>
                          <FormControl>
                            <Input type="date" {...field} data-testid="input-task-target-date" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                  <FormField
                    control={form.control}
                    name="assignedTo"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Assign To (Optional)</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value}>
                          <FormControl>
                            <SelectTrigger data-testid="select-assignee">
                              <SelectValue placeholder="Select team member" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {allUsers.filter(u => u.id !== currentUser.id).map(user => (
                              <SelectItem key={user.id} value={user.id.toString()}>
                                {user.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="remark"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Remarks (Optional)</FormLabel>
                        <FormControl>
                          <Textarea 
                            placeholder="Add any additional notes" 
                            {...field}
                            data-testid="input-task-remark"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <div className="flex justify-end gap-2 pt-4">
                    <Button 
                      type="button" 
                      variant="outline" 
                      onClick={() => setIsCreateDialogOpen(false)}
                      data-testid="button-cancel"
                    >
                      Cancel
                    </Button>
                    <Button 
                      type="submit" 
                      disabled={createTaskMutation.isPending}
                      data-testid="button-submit-task"
                    >
                      {createTaskMutation.isPending ? 'Creating...' : 'Create Task'}
                    </Button>
                  </div>
                </form>
              </Form>
            </DialogContent>
          </Dialog>
        </div>

        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
          <div className="relative flex-1 min-w-0">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Search tasks..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
              data-testid="input-search-tasks"
            />
          </div>
          <div className="flex gap-1.5 sm:gap-2">
            <Button
              size="sm"
              variant={filterView === 'all' ? 'default' : 'outline'}
              onClick={() => setFilterView('all')}
              className="flex-1 sm:flex-none text-xs sm:text-sm px-2 sm:px-3"
              data-testid="button-filter-all"
            >
              <span className="hidden sm:inline">{isAdmin ? 'All Tasks' : 'My Tasks'}</span>
              <span className="sm:hidden">{isAdmin ? 'All' : 'Mine'}</span>
            </Button>
            <Button
              size="sm"
              variant={filterView === 'created' ? 'default' : 'outline'}
              onClick={() => setFilterView('created')}
              className="flex-1 sm:flex-none text-xs sm:text-sm px-2 sm:px-3"
              data-testid="button-filter-created"
            >
              <span className="hidden sm:inline">Created by Me</span>
              <span className="sm:hidden">Created</span>
            </Button>
            <Button
              size="sm"
              variant={filterView === 'assigned' ? 'default' : 'outline'}
              onClick={() => setFilterView('assigned')}
              className="flex-1 sm:flex-none text-xs sm:text-sm px-2 sm:px-3"
              data-testid="button-filter-assigned"
            >
              <span className="hidden sm:inline">Assigned to Me</span>
              <span className="sm:hidden">Assigned</span>
            </Button>
          </div>
        </div>
      </div>

      <ScrollArea className="flex-1">
        <div className="p-4 space-y-4">
          {isLoading ? (
            <div className="flex items-center justify-center h-64" data-testid="loading-tasks">
              <p className="text-muted-foreground">Loading tasks...</p>
            </div>
          ) : filteredTasks.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-64 gap-4" data-testid="empty-tasks">
              <p className="text-muted-foreground">No tasks found</p>
              {searchQuery && (
                <Button variant="outline" onClick={() => setSearchQuery('')}>
                  Clear Search
                </Button>
              )}
            </div>
          ) : (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {filteredTasks.map((task) => (
                <Card 
                  key={task.id} 
                  className="hover-elevate cursor-pointer transition-all shadow-lg shadow-purple-100/50 dark:shadow-purple-900/20"
                  onClick={() => setSelectedTask(task)}
                  data-testid={`card-task-${task.id}`}
                >
                  <CardHeader className="space-y-2 pb-3">
                    <div className="flex items-start justify-between gap-2">
                      <CardTitle className="text-lg line-clamp-2" data-testid={`text-task-title-${task.id}`}>
                        {task.title}
                      </CardTitle>
                    </div>
                    {getStatusBadge(task.status)}
                  </CardHeader>
                  <CardContent className="space-y-3">
                    {task.description && (
                      <p className="text-sm text-muted-foreground line-clamp-2" data-testid={`text-task-description-${task.id}`}>
                        {task.description}
                      </p>
                    )}
                    <div className="space-y-2">
                      {task.startDate && (
                        <div className="flex items-center gap-2 text-sm" data-testid={`text-task-start-date-${task.id}`}>
                          <Calendar className="w-3 h-3 text-purple-600 dark:text-purple-400" />
                          <span className="text-muted-foreground">Start:</span>
                          <span>{format(new Date(task.startDate), 'MMM dd, yyyy')}</span>
                        </div>
                      )}
                      {task.targetDate && (
                        <div className="flex items-center gap-2 text-sm" data-testid={`text-task-target-date-${task.id}`}>
                          <Calendar className="w-3 h-3 text-teal-600 dark:text-teal-400" />
                          <span className="text-muted-foreground">Target:</span>
                          <span>{format(new Date(task.targetDate), 'MMM dd, yyyy')}</span>
                        </div>
                      )}
                      <div className="flex items-center gap-2 text-sm" data-testid={`text-task-creator-${task.id}`}>
                        <User className="w-3 h-3 text-blue-600 dark:text-blue-400" />
                        <span className="text-muted-foreground">Created by:</span>
                        <span>{task.creatorName}</span>
                      </div>
                      {task.assigneeName && (
                        <div className="flex items-center gap-2 text-sm" data-testid={`text-task-assignee-${task.id}`}>
                          <User className="w-3 h-3 text-indigo-600 dark:text-indigo-400" />
                          <span className="text-muted-foreground">Assigned to:</span>
                          <span>{task.assigneeName}</span>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      </ScrollArea>

      {selectedTask && (
        <Dialog open={!!selectedTask} onOpenChange={() => setSelectedTask(null)}>
          <DialogContent className="max-w-[calc(100vw-2rem)] sm:max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="text-base sm:text-lg">{selectedTask.title}</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                {getStatusBadge(selectedTask.status)}
              </div>
              
              {selectedTask.description && (
                <div>
                  <h4 className="font-semibold mb-2 text-sm">Description</h4>
                  <p className="text-sm text-muted-foreground whitespace-pre-wrap">{selectedTask.description}</p>
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {selectedTask.startDate && (
                  <div>
                    <h4 className="font-semibold mb-2 text-sm">Start Date</h4>
                    <p className="text-sm">{format(new Date(selectedTask.startDate), 'MMMM dd, yyyy')}</p>
                  </div>
                )}
                {selectedTask.targetDate && (
                  <div>
                    <h4 className="font-semibold mb-2 text-sm">Target Date</h4>
                    <p className="text-sm">{format(new Date(selectedTask.targetDate), 'MMMM dd, yyyy')}</p>
                  </div>
                )}
              </div>

              <div>
                <h4 className="font-semibold mb-2 text-sm">Created By</h4>
                <p className="text-sm">{selectedTask.creatorName}</p>
              </div>

              {selectedTask.assigneeName && (
                <div>
                  <h4 className="font-semibold mb-2 text-sm">Assigned To</h4>
                  <p className="text-sm">{selectedTask.assigneeName}</p>
                </div>
              )}

              {selectedTask.remark && (
                <div>
                  <h4 className="font-semibold mb-2 text-sm">Remarks</h4>
                  <p className="text-sm text-muted-foreground whitespace-pre-wrap">{selectedTask.remark}</p>
                </div>
              )}

              {(selectedTask.createdBy === currentUser.id || selectedTask.assignedTo === currentUser.id) && (
                <div className="pt-4 border-t">
                  <h4 className="font-semibold mb-3 text-sm">Update Status</h4>
                  <div className="grid grid-cols-2 sm:flex gap-2">
                    {Object.entries(statusConfig).map(([status, config]) => {
                      const Icon = config.icon;
                      return (
                        <Button
                          key={status}
                          size="sm"
                          variant={selectedTask.status === status ? 'default' : 'outline'}
                          onClick={() => updateTaskStatusMutation.mutate({ id: selectedTask.id, status })}
                          disabled={updateTaskStatusMutation.isPending}
                          data-testid={`button-status-${status}`}
                        >
                          <Icon className="w-3 h-3 mr-1" />
                          {config.label}
                        </Button>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}
