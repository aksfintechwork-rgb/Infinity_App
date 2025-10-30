import { useState, useEffect } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogDescription } from '@/components/ui/dialog';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Plus, Calendar, User, CheckCircle2, Circle, Clock, XCircle, Search, Filter, TrendingUp, AlertCircle, Target, Zap, ArrowUpDown, Edit, Menu } from 'lucide-react';
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
  onOpenMobileMenu?: () => void;
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

const editTaskFormSchema = z.object({
  assignedTo: z.string().optional(),
  remark: z.string().optional(),
});

type EditTaskFormValues = z.infer<typeof editTaskFormSchema>;

const statusConfig = {
  pending: { label: 'Pending', icon: Circle, color: 'bg-purple-500/20 text-purple-700 dark:text-purple-300' },
  in_progress: { label: 'In Progress', icon: Clock, color: 'bg-blue-500/20 text-blue-700 dark:text-blue-300' },
  completed: { label: 'Completed', icon: CheckCircle2, color: 'bg-teal-500/20 text-teal-700 dark:text-teal-300' },
  cancelled: { label: 'Cancelled', icon: XCircle, color: 'bg-gray-500/20 text-gray-700 dark:text-gray-400' },
};

export default function Tasks({ currentUser, allUsers, ws, onOpenMobileMenu }: TasksProps) {
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [filterView, setFilterView] = useState<'all' | 'created' | 'assigned'>('all');
  const [filterUserId, setFilterUserId] = useState<string>('');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTask, setSelectedTask] = useState<TaskWithDetails | null>(null);
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [sortBy, setSortBy] = useState<'recent' | 'dueDate' | 'status'>('recent');
  
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
    queryKey: ['/api/tasks', filterView, filterUserId],
    queryFn: async () => {
      let queryParams = '';
      
      // Admin filtering by specific user (ensure filterUserId is a valid number, not "all")
      if (isAdmin && filterUserId && filterUserId !== "all" && !isNaN(Number(filterUserId))) {
        queryParams = `?userId=${filterUserId}`;
      }
      // For admins, pass 'all' filter to get all tasks from everyone
      else if (filterView === 'all' && isAdmin) {
        queryParams = '?filter=all';
      }
      // Regular filter views
      else if (filterView !== 'all') {
        queryParams = `?filter=${filterView}`;
      }
      
      const response = await fetch(`/api/tasks${queryParams}`, {
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

  const updateTaskMutation = useMutation({
    mutationFn: async ({ id, data }: { id: number; data: EditTaskFormValues }) => {
      return apiRequest('PATCH', `/api/tasks/${id}`, {
        assignedTo: data.assignedTo && data.assignedTo !== 'unassigned' ? parseInt(data.assignedTo) : null,
        remark: data.remark || '',
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/tasks'] });
      setIsEditDialogOpen(false);
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

  const editForm = useForm<EditTaskFormValues>({
    resolver: zodResolver(editTaskFormSchema),
    defaultValues: {
      assignedTo: '',
      remark: '',
    },
  });

  const onSubmit = (data: TaskFormValues) => {
    createTaskMutation.mutate(data);
  };

  const onEditSubmit = (data: EditTaskFormValues) => {
    if (selectedTask) {
      updateTaskMutation.mutate({ id: selectedTask.id, data });
    }
  };

  // Effect to populate edit form when selectedTask changes
  useEffect(() => {
    if (selectedTask && isEditDialogOpen) {
      editForm.reset({
        assignedTo: selectedTask.assignedTo?.toString() || '',
        remark: selectedTask.remark || '',
      });
    }
  }, [selectedTask, isEditDialogOpen]);

  // Calculate statistics
  const statistics = {
    total: tasks.length,
    completed: tasks.filter(t => t.status === 'completed').length,
    inProgress: tasks.filter(t => t.status === 'in_progress').length,
    todo: tasks.filter(t => t.status === 'pending').length,
    overdue: tasks.filter(t => {
      if (t.status === 'completed' || !t.targetDate) return false;
      return new Date(t.targetDate) < new Date();
    }).length,
  };

  // Filter and sort tasks
  let filteredTasks = tasks.filter(task => {
    const matchesSearch = task.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      task.description?.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesStatus = statusFilter === 'all' || task.status === statusFilter;
    
    return matchesSearch && matchesStatus;
  });

  // Sort tasks
  filteredTasks = [...filteredTasks].sort((a, b) => {
    if (sortBy === 'recent') {
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    } else if (sortBy === 'dueDate') {
      if (!a.targetDate) return 1;
      if (!b.targetDate) return -1;
      return new Date(a.targetDate).getTime() - new Date(b.targetDate).getTime();
    } else if (sortBy === 'status') {
      const statusOrder = { pending: 0, in_progress: 1, completed: 2, cancelled: 3 };
      return statusOrder[a.status] - statusOrder[b.status];
    }
    return 0;
  });

  // Helper to check if task is overdue
  const isTaskOverdue = (task: TaskWithDetails) => {
    if (task.status === 'completed' || !task.targetDate) return false;
    return new Date(task.targetDate) < new Date();
  };

  // Helper to check if task is due soon (within 3 days)
  const isTaskDueSoon = (task: TaskWithDetails) => {
    if (task.status === 'completed' || !task.targetDate) return false;
    const daysUntilDue = Math.ceil((new Date(task.targetDate).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24));
    return daysUntilDue > 0 && daysUntilDue <= 3;
  };

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
          <div className="flex items-center gap-2">
            {onOpenMobileMenu && (
              <Button
                variant="ghost"
                size="icon"
                onClick={onOpenMobileMenu}
                data-testid="button-mobile-menu-tasks"
                className="md:hidden"
              >
                <Menu className="w-5 h-5" />
              </Button>
            )}
            <h1 className="text-xl md:text-2xl font-bold bg-gradient-to-r from-purple-600 via-blue-600 to-teal-600 bg-clip-text text-transparent" data-testid="text-tasks-title">
              <span className="hidden sm:inline">Task Management</span>
              <span className="sm:hidden">Tasks</span>
            </h1>
          </div>
          
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

        {/* Statistics Cards */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-2 md:gap-3 mb-4">
          <Card className="bg-gradient-to-br from-purple-500/10 to-purple-600/10 border-purple-200 dark:border-purple-800 hover-elevate" data-testid="card-stat-total">
            <CardContent className="p-3 md:p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-muted-foreground font-medium">Total Tasks</p>
                  <p className="text-2xl md:text-3xl font-bold text-purple-600 dark:text-purple-400">{statistics.total}</p>
                </div>
                <Target className="w-8 h-8 text-purple-600/20 dark:text-purple-400/20" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-blue-500/10 to-blue-600/10 border-blue-200 dark:border-blue-800 hover-elevate" data-testid="card-stat-todo">
            <CardContent className="p-3 md:p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-muted-foreground font-medium">To Do</p>
                  <p className="text-2xl md:text-3xl font-bold text-blue-600 dark:text-blue-400">{statistics.todo}</p>
                </div>
                <Circle className="w-8 h-8 text-blue-600/20 dark:text-blue-400/20" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-cyan-500/10 to-cyan-600/10 border-cyan-200 dark:border-cyan-800 hover-elevate" data-testid="card-stat-inprogress">
            <CardContent className="p-3 md:p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-muted-foreground font-medium">In Progress</p>
                  <p className="text-2xl md:text-3xl font-bold text-cyan-600 dark:text-cyan-400">{statistics.inProgress}</p>
                </div>
                <Zap className="w-8 h-8 text-cyan-600/20 dark:text-cyan-400/20" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-teal-500/10 to-teal-600/10 border-teal-200 dark:border-teal-800 hover-elevate" data-testid="card-stat-completed">
            <CardContent className="p-3 md:p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-muted-foreground font-medium">Completed</p>
                  <p className="text-2xl md:text-3xl font-bold text-teal-600 dark:text-teal-400">{statistics.completed}</p>
                </div>
                <CheckCircle2 className="w-8 h-8 text-teal-600/20 dark:text-teal-400/20" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-rose-500/10 to-rose-600/10 border-rose-200 dark:border-rose-800 hover-elevate" data-testid="card-stat-overdue">
            <CardContent className="p-3 md:p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-muted-foreground font-medium">Overdue</p>
                  <p className="text-2xl md:text-3xl font-bold text-rose-600 dark:text-rose-400">{statistics.overdue}</p>
                </div>
                <AlertCircle className="w-8 h-8 text-rose-600/20 dark:text-rose-400/20" />
              </div>
            </CardContent>
          </Card>
        </div>

        {isAdmin && (
          <div className="mb-3">
            <label className="text-sm font-medium mb-2 block">Filter by Team Member</label>
            <Select value={filterUserId || "all"} onValueChange={(value) => {
              setFilterUserId(value === "all" ? '' : value);
              setFilterView('all');
            }}>
              <SelectTrigger className="w-full sm:w-64" data-testid="select-filter-user">
                <SelectValue placeholder="All team members" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All team members</SelectItem>
                {allUsers.map(user => (
                  <SelectItem key={user.id} value={user.id.toString()}>
                    {user.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )}

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
              variant={filterView === 'all' && !filterUserId ? 'default' : 'outline'}
              onClick={() => {
                setFilterView('all');
                setFilterUserId('');
              }}
              className="flex-1 sm:flex-none text-xs sm:text-sm px-2 sm:px-3"
              data-testid="button-filter-all"
            >
              <span className="hidden sm:inline">{isAdmin ? 'All Tasks' : 'My Tasks'}</span>
              <span className="sm:hidden">{isAdmin ? 'All' : 'Mine'}</span>
            </Button>
            <Button
              size="sm"
              variant={filterView === 'created' ? 'default' : 'outline'}
              onClick={() => {
                setFilterView('created');
                setFilterUserId('');
              }}
              className="flex-1 sm:flex-none text-xs sm:text-sm px-2 sm:px-3"
              data-testid="button-filter-created"
            >
              <span className="hidden sm:inline">Created by Me</span>
              <span className="sm:hidden">Created</span>
            </Button>
            <Button
              size="sm"
              variant={filterView === 'assigned' ? 'default' : 'outline'}
              onClick={() => {
                setFilterView('assigned');
                setFilterUserId('');
              }}
              className="flex-1 sm:flex-none text-xs sm:text-sm px-2 sm:px-3"
              data-testid="button-filter-assigned"
            >
              <span className="hidden sm:inline">Assigned to Me</span>
              <span className="sm:hidden">Assigned</span>
            </Button>
          </div>
        </div>

        {/* Status Filter and Sort Controls */}
        <div className="flex flex-wrap items-center gap-2 mt-3 pt-3 border-t">
          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4 text-muted-foreground" />
            <span className="text-sm font-medium text-muted-foreground">Status:</span>
            <div className="flex gap-1">
              <Button
                size="sm"
                variant={statusFilter === 'all' ? 'default' : 'outline'}
                onClick={() => setStatusFilter('all')}
                className="text-xs px-2"
                data-testid="button-status-all"
              >
                All
              </Button>
              <Button
                size="sm"
                variant={statusFilter === 'pending' ? 'default' : 'outline'}
                onClick={() => setStatusFilter('pending')}
                className="text-xs px-2 bg-purple-100/50 dark:bg-purple-900/20"
                data-testid="button-status-pending"
              >
                To Do
              </Button>
              <Button
                size="sm"
                variant={statusFilter === 'in_progress' ? 'default' : 'outline'}
                onClick={() => setStatusFilter('in_progress')}
                className="text-xs px-2 bg-cyan-100/50 dark:bg-cyan-900/20"
                data-testid="button-status-inprogress"
              >
                In Progress
              </Button>
              <Button
                size="sm"
                variant={statusFilter === 'completed' ? 'default' : 'outline'}
                onClick={() => setStatusFilter('completed')}
                className="text-xs px-2 bg-teal-100/50 dark:bg-teal-900/20"
                data-testid="button-status-completed"
              >
                Done
              </Button>
            </div>
          </div>

          <div className="flex items-center gap-2 ml-auto">
            <ArrowUpDown className="w-4 h-4 text-muted-foreground" />
            <span className="text-sm font-medium text-muted-foreground">Sort:</span>
            <Select value={sortBy} onValueChange={(value: any) => setSortBy(value)}>
              <SelectTrigger className="w-32 h-8 text-xs" data-testid="select-sort">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="recent">Recent</SelectItem>
                <SelectItem value="dueDate">Due Date</SelectItem>
                <SelectItem value="status">Status</SelectItem>
              </SelectContent>
            </Select>
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
              {filteredTasks.map((task) => {
                const overdue = isTaskOverdue(task);
                const dueSoon = isTaskDueSoon(task);
                
                return (
                  <Card 
                    key={task.id} 
                    className={`hover-elevate cursor-pointer transition-all shadow-lg ${
                      overdue 
                        ? 'border-rose-300 dark:border-rose-700 shadow-rose-100/50 dark:shadow-rose-900/20' 
                        : dueSoon 
                        ? 'border-amber-300 dark:border-amber-700 shadow-amber-100/50 dark:shadow-amber-900/20'
                        : 'shadow-purple-100/50 dark:shadow-purple-900/20'
                    }`}
                    onClick={() => setSelectedTask(task)}
                    data-testid={`card-task-${task.id}`}
                  >
                    {(overdue || dueSoon) && (
                      <div className={`h-1.5 rounded-t-md ${overdue ? 'bg-gradient-to-r from-rose-500 to-pink-500' : 'bg-gradient-to-r from-amber-500 to-orange-500'}`} />
                    )}
                    <CardHeader className="space-y-2 pb-3">
                      <div className="flex items-start justify-between gap-2">
                        <CardTitle className="text-base sm:text-lg line-clamp-2" data-testid={`text-task-title-${task.id}`}>
                          {task.title}
                        </CardTitle>
                      </div>
                      <div className="flex items-center gap-2 flex-wrap">
                        {getStatusBadge(task.status)}
                        {overdue && (
                          <Badge variant="secondary" className="bg-rose-500/20 text-rose-700 dark:text-rose-300 flex items-center gap-1">
                            <AlertCircle className="w-3 h-3" />
                            Overdue
                          </Badge>
                        )}
                        {dueSoon && !overdue && (
                          <Badge variant="secondary" className="bg-amber-500/20 text-amber-700 dark:text-amber-300 flex items-center gap-1">
                            <Clock className="w-3 h-3" />
                            Due Soon
                          </Badge>
                        )}
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      {task.description && (
                        <p className="text-sm text-muted-foreground line-clamp-2" data-testid={`text-task-description-${task.id}`}>
                          {task.description}
                        </p>
                      )}
                      <div className="space-y-2">
                        {task.targetDate && (
                          <div className={`flex items-center gap-2 text-sm p-2 rounded-md ${
                            overdue 
                              ? 'bg-rose-50 dark:bg-rose-950/30' 
                              : dueSoon 
                              ? 'bg-amber-50 dark:bg-amber-950/30'
                              : 'bg-gray-50 dark:bg-gray-900/30'
                          }`} data-testid={`text-task-target-date-${task.id}`}>
                            <Calendar className={`w-4 h-4 ${
                              overdue 
                                ? 'text-rose-600 dark:text-rose-400' 
                                : dueSoon 
                                ? 'text-amber-600 dark:text-amber-400'
                                : 'text-teal-600 dark:text-teal-400'
                            }`} />
                            <span className="text-muted-foreground font-medium">Due:</span>
                            <span className={overdue ? 'font-semibold text-rose-700 dark:text-rose-400' : dueSoon ? 'font-semibold text-amber-700 dark:text-amber-400' : ''}>
                              {format(new Date(task.targetDate), 'MMM dd, yyyy')}
                            </span>
                          </div>
                        )}
                        <div className="flex items-center gap-2 text-xs text-muted-foreground" data-testid={`text-task-creator-${task.id}`}>
                          <User className="w-3 h-3" />
                          <span>By {task.creatorName}</span>
                          {task.assigneeName && (
                            <>
                              <span>•</span>
                              <span>Assigned to {task.assigneeName}</span>
                            </>
                          )}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
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

              {(isAdmin || selectedTask.createdBy === currentUser.id) && (
                <div className="pt-4 border-t">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => {
                      setIsEditDialogOpen(true);
                      editForm.reset({
                        assignedTo: selectedTask.assignedTo?.toString() || '',
                        remark: selectedTask.remark || '',
                      });
                    }}
                    className="w-full sm:w-auto"
                    data-testid="button-edit-task"
                  >
                    <Edit className="w-3 h-3 mr-1" />
                    Edit Task Assignment & Remarks
                  </Button>
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

      {/* Edit Task Dialog for Task Creators and Admins */}
      {(isAdmin || (selectedTask && selectedTask.createdBy === currentUser.id)) && selectedTask && (
        <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
          <DialogContent className="max-w-[calc(100vw-2rem)] sm:max-w-md">
            <DialogHeader>
              <DialogTitle>Edit Task Assignment & Remarks</DialogTitle>
              <DialogDescription>
                Change the task assignee or add/update remarks for this task.
              </DialogDescription>
            </DialogHeader>
            <Form {...editForm}>
              <form onSubmit={editForm.handleSubmit(onEditSubmit)} className="space-y-4">
                <FormField
                  control={editForm.control}
                  name="assignedTo"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Assign To</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value || ""}>
                        <FormControl>
                          <SelectTrigger data-testid="select-edit-assignee">
                            <SelectValue placeholder="Select team member" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="unassigned">Unassigned</SelectItem>
                          {allUsers.map(user => (
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
                  control={editForm.control}
                  name="remark"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Remarks</FormLabel>
                      <FormControl>
                        <Textarea 
                          placeholder="Add or update remarks" 
                          {...field}
                          className="min-h-[100px]"
                          data-testid="input-edit-remark"
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
                    onClick={() => setIsEditDialogOpen(false)}
                    data-testid="button-cancel-edit"
                  >
                    Cancel
                  </Button>
                  <Button 
                    type="submit" 
                    disabled={updateTaskMutation.isPending}
                    data-testid="button-submit-edit"
                  >
                    {updateTaskMutation.isPending ? 'Saving...' : 'Save Changes'}
                  </Button>
                </div>
              </form>
            </Form>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}
