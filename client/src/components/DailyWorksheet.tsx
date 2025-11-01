import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { useQuery, useMutation } from '@tanstack/react-query';
import { apiRequest, queryClient } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';
import { Plus, Trash2, Save, Send, Menu, Calendar, Clock, Settings } from 'lucide-react';
import { format } from 'date-fns';

interface User {
  id: number;
  name: string;
  role: string;
}

interface Todo {
  id: string;
  task: string;
  priority: 'low' | 'medium' | 'high' | 'urgent';
  completed: boolean;
}

interface HourlyLog {
  hour: string;
  activity: string;
}

interface Worksheet {
  id: number;
  userId: number;
  date: string;
  todos: string;
  hourlyLogs: string;
  status: string;
  submittedAt?: string;
}

interface DailyWorksheetProps {
  currentUser: User;
  onOpenMobileMenu?: () => void;
}

const ALL_HOURS = [
  '00:00', '01:00', '02:00', '03:00', '04:00', '05:00', '06:00', '07:00', 
  '08:00', '09:00', '10:00', '11:00', '12:00', '13:00', '14:00', '15:00', 
  '16:00', '17:00', '18:00', '19:00', '20:00', '21:00', '22:00', '23:00'
];

const PRIORITY_COLORS = {
  low: 'bg-blue-500/10 text-blue-700 dark:text-blue-400',
  medium: 'bg-yellow-500/10 text-yellow-700 dark:text-yellow-400',
  high: 'bg-orange-500/10 text-orange-700 dark:text-orange-400',
  urgent: 'bg-red-500/10 text-red-700 dark:text-red-400',
};

const generateWorkHours = (startHour: number, endHour: number): string[] => {
  const hours: string[] = [];
  for (let i = startHour; i <= endHour; i++) {
    hours.push(`${i.toString().padStart(2, '0')}:00`);
  }
  return hours;
};

export default function DailyWorksheet({ currentUser, onOpenMobileMenu }: DailyWorksheetProps) {
  const [workStartHour, setWorkStartHour] = useState<number>(8);
  const [workEndHour, setWorkEndHour] = useState<number>(18);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [tempStartHour, setTempStartHour] = useState<number>(8);
  const [tempEndHour, setTempEndHour] = useState<number>(18);
  
  const [todos, setTodos] = useState<Todo[]>([]);
  const [hourlyLogs, setHourlyLogs] = useState<HourlyLog[]>([]);
  const [newTodoText, setNewTodoText] = useState('');
  const [newTodoPriority, setNewTodoPriority] = useState<'low' | 'medium' | 'high' | 'urgent'>('medium');
  const { toast } = useToast();

  // Load work hours from localStorage on mount
  useEffect(() => {
    const savedStartHour = localStorage.getItem('workStartHour');
    const savedEndHour = localStorage.getItem('workEndHour');
    
    if (savedStartHour) setWorkStartHour(parseInt(savedStartHour));
    if (savedEndHour) setWorkEndHour(parseInt(savedEndHour));
  }, []);

  // Generate hourly logs when work hours change, preserving existing entries
  useEffect(() => {
    const workHours = generateWorkHours(workStartHour, workEndHour);
    setHourlyLogs(prevLogs => {
      // Create a map of existing entries for quick lookup
      const existingMap = new Map(prevLogs.map(log => [log.hour, log.activity]));
      
      // Generate new logs, preserving activities for overlapping hours
      return workHours.map(hour => ({
        hour,
        activity: existingMap.get(hour) || ''
      }));
    });
  }, [workStartHour, workEndHour]);

  const { data: worksheet, isLoading } = useQuery<Worksheet | null>({
    queryKey: ['/api/worksheets/today'],
    refetchInterval: 30000, // Refresh every 30 seconds
  });

  useEffect(() => {
    if (worksheet) {
      try {
        const parsedTodos = JSON.parse(worksheet.todos || '[]');
        const parsedLogs = JSON.parse(worksheet.hourlyLogs || '[]');
        setTodos(parsedTodos);
        
        // Merge saved logs with current work hours template AND current in-memory state
        if (parsedLogs.length > 0) {
          setHourlyLogs(prevLogs => {
            const workHours = generateWorkHours(workStartHour, workEndHour);
            const savedMap = new Map(parsedLogs.map((log: HourlyLog) => [log.hour, log.activity]));
            const currentMap = new Map(prevLogs.map(log => [log.hour, log.activity]));
            
            // For each hour in the new range, prioritize: current unsaved > saved > empty
            return workHours.map(hour => ({
              hour,
              activity: currentMap.get(hour) || savedMap.get(hour) || ''
            }));
          });
        }
      } catch (error) {
        console.error('Failed to parse worksheet data:', error);
      }
    }
  }, [worksheet, workStartHour, workEndHour]);

  const createWorksheetMutation = useMutation({
    mutationFn: async () => {
      return await apiRequest('POST', '/api/worksheets', {
        todos: JSON.stringify(todos),
        hourlyLogs: JSON.stringify(hourlyLogs),
      });
    },
    onSuccess: (data) => {
      queryClient.setQueryData(['/api/worksheets/today'], data);
      queryClient.invalidateQueries({ queryKey: ['/api/worksheets/today'] });
      toast({
        title: 'Worksheet created',
        description: 'Your daily worksheet has been saved',
      });
    },
  });

  const updateWorksheetMutation = useMutation({
    mutationFn: async () => {
      if (!worksheet) return;
      return await apiRequest('PATCH', `/api/worksheets/${worksheet.id}`, {
        todos: JSON.stringify(todos),
        hourlyLogs: JSON.stringify(hourlyLogs),
      });
    },
    onSuccess: (data) => {
      queryClient.setQueryData(['/api/worksheets/today'], data);
      queryClient.invalidateQueries({ queryKey: ['/api/worksheets/today'] });
      toast({
        title: 'Worksheet updated',
        description: 'Your changes have been saved',
      });
    },
  });

  const submitWorksheetMutation = useMutation({
    mutationFn: async () => {
      if (!worksheet) return;
      return await apiRequest('POST', `/api/worksheets/${worksheet.id}/submit`, {});
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/worksheets/today'] });
      toast({
        title: 'Worksheet submitted',
        description: 'Your daily worksheet has been submitted',
      });
    },
  });

  const handleAddTodo = () => {
    if (!newTodoText.trim()) return;

    const newTodo: Todo = {
      id: Date.now().toString(),
      task: newTodoText,
      priority: newTodoPriority,
      completed: false,
    };

    setTodos([...todos, newTodo]);
    setNewTodoText('');
    setNewTodoPriority('medium');
  };

  const handleToggleTodo = (id: string) => {
    setTodos(todos.map(todo => 
      todo.id === id ? { ...todo, completed: !todo.completed } : todo
    ));
  };

  const handleDeleteTodo = (id: string) => {
    setTodos(todos.filter(todo => todo.id !== id));
  };

  const handleUpdateHourlyLog = (hour: string, activity: string) => {
    setHourlyLogs(hourlyLogs.map(log => 
      log.hour === hour ? { ...log, activity } : log
    ));
  };

  const handleOpenSettings = () => {
    setTempStartHour(workStartHour);
    setTempEndHour(workEndHour);
    setIsSettingsOpen(true);
  };

  const handleSaveSettings = () => {
    if (tempStartHour >= tempEndHour) {
      toast({
        title: 'Invalid hours',
        description: 'Start hour must be before end hour',
        variant: 'destructive',
      });
      return;
    }

    setWorkStartHour(tempStartHour);
    setWorkEndHour(tempEndHour);
    localStorage.setItem('workStartHour', tempStartHour.toString());
    localStorage.setItem('workEndHour', tempEndHour.toString());
    setIsSettingsOpen(false);
    
    toast({
      title: 'Settings saved',
      description: `Work hours set to ${tempStartHour}:00 - ${tempEndHour}:00`,
    });
  };

  const handleSave = () => {
    // Prevent multiple saves while mutation is in progress
    if (createWorksheetMutation.isPending || updateWorksheetMutation.isPending) {
      return;
    }
    
    if (worksheet) {
      updateWorksheetMutation.mutate();
    } else {
      createWorksheetMutation.mutate();
    }
  };

  const isSaving = createWorksheetMutation.isPending || updateWorksheetMutation.isPending;

  const handleSubmit = async () => {
    // If there's no worksheet yet, save it first
    if (!worksheet) {
      try {
        const newWorksheet = await createWorksheetMutation.mutateAsync();
        // Now submit the newly created worksheet
        if (newWorksheet && newWorksheet.id) {
          await apiRequest('POST', `/api/worksheets/${newWorksheet.id}/submit`, {});
          queryClient.invalidateQueries({ queryKey: ['/api/worksheets/today'] });
          toast({
            title: 'Worksheet submitted',
            description: 'Your daily worksheet has been submitted',
          });
        }
      } catch (error) {
        toast({
          title: 'Failed to submit',
          description: 'Please try saving and submitting again',
          variant: 'destructive',
        });
      }
      return;
    }
    
    // If worksheet exists, just submit it
    submitWorksheetMutation.mutate();
  };

  const isSubmitted = worksheet?.status === 'submitted';

  return (
    <div className="h-screen flex flex-col bg-background">
      <div className="border-b p-4 flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <Button
            variant="ghost"
            size="icon"
            onClick={onOpenMobileMenu}
            className="md:hidden"
            data-testid="button-mobile-menu"
          >
            <Menu className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="text-xl font-semibold text-foreground">Daily Worksheet</h1>
            <p className="text-sm text-muted-foreground flex items-center gap-2 mt-1">
              <Calendar className="h-4 w-4" />
              {format(new Date(), 'EEEE, MMMM d, yyyy')}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {isSubmitted && (
            <Badge variant="default" className="bg-green-500/10 text-green-700 dark:text-green-400">
              Submitted
            </Badge>
          )}
          <Dialog open={isSettingsOpen} onOpenChange={setIsSettingsOpen}>
            <DialogTrigger asChild>
              <Button
                onClick={handleOpenSettings}
                size="sm"
                variant="outline"
                data-testid="button-worksheet-settings"
              >
                <Settings className="h-4 w-4" />
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Working Hours Settings</DialogTitle>
                <DialogDescription>
                  Choose your daily working hours. This will update the hourly activity log section.
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Start Hour</label>
                  <Select
                    value={tempStartHour.toString()}
                    onValueChange={(value) => setTempStartHour(parseInt(value))}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {Array.from({ length: 24 }, (_, i) => (
                        <SelectItem key={i} value={i.toString()}>
                          {i.toString().padStart(2, '0')}:00
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">End Hour</label>
                  <Select
                    value={tempEndHour.toString()}
                    onValueChange={(value) => setTempEndHour(parseInt(value))}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {Array.from({ length: 24 }, (_, i) => (
                        <SelectItem key={i} value={i.toString()}>
                          {i.toString().padStart(2, '0')}:00
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex items-center gap-2 text-sm text-muted-foreground bg-muted p-3 rounded-lg">
                  <Clock className="h-4 w-4" />
                  <span>Current: {workStartHour}:00 - {workEndHour}:00 ({workEndHour - workStartHour + 1} hours)</span>
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setIsSettingsOpen(false)}>
                  Cancel
                </Button>
                <Button onClick={handleSaveSettings}>
                  Save Settings
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
          <Button
            onClick={handleSave}
            disabled={isSubmitted || isSaving}
            size="sm"
            data-testid="button-save-worksheet"
          >
            <Save className="h-4 w-4 mr-2" />
            {isSaving ? 'Saving...' : 'Save'}
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={isSubmitted || !worksheet || submitWorksheetMutation.isPending}
            size="sm"
            variant="default"
            data-testid="button-submit-worksheet"
          >
            <Send className="h-4 w-4 mr-2" />
            Submit
          </Button>
        </div>
      </div>

      <ScrollArea className="flex-1">
        <div className="max-w-6xl mx-auto p-4 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Today's To-Do List</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {!isSubmitted && (
                <div className="flex gap-2">
                  <Input
                    placeholder="Add a task..."
                    value={newTodoText}
                    onChange={(e) => setNewTodoText(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleAddTodo()}
                    disabled={isSubmitted}
                    data-testid="input-new-todo"
                  />
                  <Select
                    value={newTodoPriority}
                    onValueChange={(value: any) => setNewTodoPriority(value)}
                    disabled={isSubmitted}
                  >
                    <SelectTrigger className="w-32" data-testid="select-priority">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="low">Low</SelectItem>
                      <SelectItem value="medium">Medium</SelectItem>
                      <SelectItem value="high">High</SelectItem>
                      <SelectItem value="urgent">Urgent</SelectItem>
                    </SelectContent>
                  </Select>
                  <Button onClick={handleAddTodo} disabled={isSubmitted} data-testid="button-add-todo">
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>
              )}

              <div className="space-y-2">
                {todos.length === 0 ? (
                  <p className="text-sm text-muted-foreground text-center py-8">
                    No tasks added yet. Start planning your day!
                  </p>
                ) : (
                  todos.map((todo) => (
                    <div
                      key={todo.id}
                      className="flex items-center gap-3 p-3 rounded-md border bg-card"
                      data-testid={`todo-${todo.id}`}
                    >
                      <input
                        type="checkbox"
                        checked={todo.completed}
                        onChange={() => handleToggleTodo(todo.id)}
                        disabled={isSubmitted}
                        className="h-5 w-5 rounded border-2"
                        data-testid={`checkbox-todo-${todo.id}`}
                      />
                      <span
                        className={`flex-1 ${todo.completed ? 'line-through text-muted-foreground' : 'text-foreground'}`}
                      >
                        {todo.task}
                      </span>
                      <Badge className={PRIORITY_COLORS[todo.priority]}>
                        {todo.priority}
                      </Badge>
                      {!isSubmitted && (
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleDeleteTodo(todo.id)}
                          className="h-8 w-8"
                          data-testid={`button-delete-todo-${todo.id}`}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Clock className="h-5 w-5" />
                Hourly Activity Log
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {hourlyLogs.map((log) => (
                <div key={log.hour} className="flex items-center gap-3">
                  <div className="w-20 text-sm font-medium text-muted-foreground">
                    {log.hour}
                  </div>
                  <Textarea
                    placeholder="What did you work on?"
                    value={log.activity}
                    onChange={(e) => handleUpdateHourlyLog(log.hour, e.target.value)}
                    disabled={isSubmitted}
                    className="flex-1 min-h-[60px] resize-none"
                    data-testid={`textarea-log-${log.hour}`}
                  />
                </div>
              ))}
            </CardContent>
          </Card>
        </div>
      </ScrollArea>
    </div>
  );
}
