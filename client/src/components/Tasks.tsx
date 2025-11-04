import { useState, useEffect, useRef } from 'react';
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
import { Plus, Calendar, User, CheckCircle2, Circle, Clock, XCircle, Search, Filter, TrendingUp, AlertCircle, Target, Zap, ArrowUpDown, Edit, Menu, Download, Upload, Trash2 } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { apiRequest, queryClient } from '@/lib/queryClient';
import { format } from 'date-fns';
import * as XLSX from 'xlsx';
import { useToast } from '@/hooks/use-toast';

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
  completionPercentage?: number;
  statusUpdateReason?: string;
  remark?: string;
  createdBy: number;
  assignedTo?: number;
  conversationId?: number;
  reminderFrequency?: string;
  lastReminderSent?: string;
  createdAt: string;
  updatedAt: string;
  creatorName: string;
  assigneeName?: string;
  updatedBy?: string;
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
  reminderFrequency: z.string().optional(),
  remark: z.string().optional(),
});

type TaskFormValues = z.infer<typeof taskFormSchema>;

const editTaskFormSchema = z.object({
  assignedTo: z.string().optional(),
  remark: z.string().optional(),
});

type EditTaskFormValues = z.infer<typeof editTaskFormSchema>;

const statusUpdateFormSchema = z.object({
  status: z.string(),
  completionPercentage: z.string(),
  statusUpdateReason: z.string().optional(),
});

type StatusUpdateFormValues = z.infer<typeof statusUpdateFormSchema>;

const statusConfig = {
  pending: { label: 'Pending', icon: Circle, color: 'bg-purple-500/20 text-purple-700 dark:text-purple-300' },
  in_progress: { label: 'In Progress', icon: Clock, color: 'bg-blue-500/20 text-blue-700 dark:text-blue-300' },
  completed: { label: 'Completed', icon: CheckCircle2, color: 'bg-teal-500/20 text-teal-700 dark:text-teal-300' },
  cancelled: { label: 'Cancelled', icon: XCircle, color: 'bg-gray-500/20 text-gray-700 dark:text-gray-400' },
};

export default function Tasks({ currentUser, allUsers, ws, onOpenMobileMenu }: TasksProps) {
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isStatusUpdateDialogOpen, setIsStatusUpdateDialogOpen] = useState(false);
  const [filterView, setFilterView] = useState<'all' | 'created' | 'assigned'>('all');
  const [filterUserId, setFilterUserId] = useState<string>('');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTask, setSelectedTask] = useState<TaskWithDetails | null>(null);
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [sortBy, setSortBy] = useState<'recent' | 'dueDate' | 'status'>('recent');
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();
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

    const unsubscribeStatusUpdated = ws.on('task_status_updated', (taskData) => {
      // Invalidate all task queries to refresh the list
      queryClient.invalidateQueries({ queryKey: ['/api/tasks'] });
      
      // Show notification to admin when team member updates task status
      if (isAdmin && taskData.updatedBy) {
        // Browser notification
        if ('Notification' in window && Notification.permission === 'granted') {
          new Notification(`Task Status Updated`, {
            body: `${taskData.updatedBy} updated "${taskData.title}" to ${taskData.completionPercentage}% complete`,
            icon: '/favicon.ico',
          });
        }
      }
      
      // Update selected task if it's the one being updated
      if (selectedTask && taskData.id === selectedTask.id) {
        setSelectedTask(taskData);
      }
    });

    return () => {
      unsubscribeCreated();
      unsubscribeUpdated();
      unsubscribeDeleted();
      unsubscribeStatusUpdated();
    };
  }, [ws, selectedTask, isAdmin]);

  const { data: tasks = [], isLoading } = useQuery<TaskWithDetails[]>({
    queryKey: isAdmin ? ['/api/tasks', filterView, filterUserId] : ['/api/tasks'],
    queryFn: async () => {
      let queryParams = '';
      
      if (isAdmin) {
        // Admin filtering by specific user (ensure filterUserId is a valid number, not "all")
        if (filterUserId && filterUserId !== "all" && !isNaN(Number(filterUserId))) {
          queryParams = `?userId=${filterUserId}`;
        }
        // For admins, pass 'all' filter to get all tasks from everyone
        else if (filterView === 'all') {
          queryParams = '?filter=all';
        }
        // Regular filter views (created or assigned)
        else {
          queryParams = `?filter=${filterView}`;
        }
      }
      // Regular users: no query params needed, backend returns only assigned tasks
      
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
      const response = await apiRequest('POST', '/api/tasks', {
        ...data,
        assignedTo: data.assignedTo ? parseInt(data.assignedTo) : undefined,
      });
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/tasks'] });
      setIsCreateDialogOpen(false);
      form.reset();
      toast({
        title: 'Task created successfully',
        description: 'Your task has been created and team members have been notified.',
      });
    },
    onError: (error: Error) => {
      toast({
        title: 'Failed to create task',
        description: error.message || 'Please try again.',
        variant: 'destructive',
      });
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
      const response = await apiRequest('PATCH', `/api/tasks/${id}`, {
        assignedTo: data.assignedTo && data.assignedTo !== 'unassigned' ? parseInt(data.assignedTo) : null,
        remark: data.remark || '',
      });
      return response.json();
    },
    onSuccess: (updatedTask: TaskWithDetails) => {
      // Update all possible cache entries for tasks with different filter combinations
      queryClient.setQueriesData(
        { queryKey: ['/api/tasks'] },
        (oldTasks: TaskWithDetails[] | undefined) => {
          if (!oldTasks) return oldTasks;
          return oldTasks.map(task => task.id === updatedTask.id ? updatedTask : task);
        }
      );
      // Close both the edit dialog and the task details dialog
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
      reminderFrequency: 'none',
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

  const statusUpdateForm = useForm<StatusUpdateFormValues>({
    resolver: zodResolver(statusUpdateFormSchema),
    defaultValues: {
      status: 'pending',
      completionPercentage: '0',
      statusUpdateReason: '',
    },
  });

  const updateStatusMutation = useMutation({
    mutationFn: async ({ id, data }: { id: number; data: StatusUpdateFormValues }) => {
      const response = await apiRequest('PATCH', `/api/tasks/${id}`, {
        status: data.status,
        completionPercentage: parseInt(data.completionPercentage),
        statusUpdateReason: data.statusUpdateReason || '',
      });
      return response.json();
    },
    onSuccess: (updatedTask: TaskWithDetails) => {
      // Update all possible cache entries for tasks with different filter combinations
      queryClient.setQueriesData(
        { queryKey: ['/api/tasks'] },
        (oldTasks: TaskWithDetails[] | undefined) => {
          if (!oldTasks) return oldTasks;
          return oldTasks.map(task => task.id === updatedTask.id ? updatedTask : task);
        }
      );
      // Close both the status update dialog and the task details dialog
      setIsStatusUpdateDialogOpen(false);
      setSelectedTask(null);
    },
  });

  const deleteTaskMutation = useMutation({
    mutationFn: async (taskId: number) => {
      // Use admin endpoint if user is admin, otherwise use regular endpoint
      const endpoint = isAdmin ? `/api/admin/tasks/${taskId}` : `/api/tasks/${taskId}`;
      return apiRequest('DELETE', endpoint);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/tasks'] });
      setSelectedTask(null);
      toast({
        title: 'Task deleted',
        description: 'The task has been removed successfully.',
      });
    },
    onError: (error: Error) => {
      toast({
        title: 'Failed to delete task',
        description: error.message || 'Please try again.',
        variant: 'destructive',
      });
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

  const onStatusUpdateSubmit = (data: StatusUpdateFormValues) => {
    if (selectedTask) {
      updateStatusMutation.mutate({ id: selectedTask.id, data });
    }
  };

  // Excel Export Function
  const handleExportToExcel = () => {
    try {
      // Get all tasks from the current view
      const tasksToExport = filteredTasks.map(task => ({
        'Task ID': task.id,
        'Title': task.title,
        'Description': task.description || '',
        'Start Date': task.startDate ? format(new Date(task.startDate), 'yyyy-MM-dd') : '',
        'Target Date': task.targetDate ? format(new Date(task.targetDate), 'yyyy-MM-dd') : '',
        'Status': task.status,
        'Completion %': task.completionPercentage || 0,
        'Created By': task.creatorName,
        'Assigned To': task.assigneeName || '',
        'Reminder Frequency': task.reminderFrequency || 'none',
        'Remarks': task.remark || '',
        'Status Update Reason': task.statusUpdateReason || '',
        'Created At': format(new Date(task.createdAt), 'yyyy-MM-dd HH:mm'),
        'Updated At': format(new Date(task.updatedAt), 'yyyy-MM-dd HH:mm'),
      }));

      // Create worksheet
      const worksheet = XLSX.utils.json_to_sheet(tasksToExport);
      
      // Create workbook
      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, 'Tasks');
      
      // Generate filename with timestamp
      const filename = `tasks_export_${format(new Date(), 'yyyy-MM-dd_HHmmss')}.xlsx`;
      
      // Download file
      XLSX.writeFile(workbook, filename);
      
      toast({
        title: "Export Successful",
        description: `${tasksToExport.length} tasks exported to ${filename}`,
      });
    } catch (error) {
      console.error('Export error:', error);
      toast({
        title: "Export Failed",
        description: "Failed to export tasks to Excel",
        variant: "destructive",
      });
    }
  };

  // Helper function to convert Excel date serial to ISO date string
  const excelDateToISO = (serial: any): string => {
    if (!serial) return '';
    
    // If already a string, return as-is
    if (typeof serial === 'string') return serial;
    
    // If it's a number (Excel serial date)
    if (typeof serial === 'number') {
      // Excel serial date starts from 1900-01-01, but Excel incorrectly treats 1900 as leap year
      // so we need to account for that
      const excelEpoch = new Date(1900, 0, 1);
      const daysOffset = serial > 59 ? serial - 2 : serial - 1; // Account for Excel's leap year bug
      const date = new Date(excelEpoch.getTime() + daysOffset * 24 * 60 * 60 * 1000);
      return format(date, 'yyyy-MM-dd');
    }
    
    return '';
  };

  // Excel Import Function
  const handleImportFromExcel = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    try {
      const reader = new FileReader();
      
      reader.onload = async (e) => {
        try {
          const data = new Uint8Array(e.target?.result as ArrayBuffer);
          const workbook = XLSX.read(data, { type: 'array', cellDates: true });
          
          // Get first sheet
          const sheetName = workbook.SheetNames[0];
          const worksheet = workbook.Sheets[sheetName];
          
          // Convert to JSON with raw data to handle dates properly
          const jsonData = XLSX.utils.sheet_to_json(worksheet, { raw: false, dateNF: 'yyyy-mm-dd' }) as any[];
          
          if (jsonData.length === 0) {
            toast({
              title: "Import Failed",
              description: "The Excel file is empty",
              variant: "destructive",
            });
            return;
          }

          let successCount = 0;
          const failedRows: { row: number; title: string; reason: string }[] = [];

          // Import each task
          for (let i = 0; i < jsonData.length; i++) {
            const row = jsonData[i];
            const rowNumber = i + 2; // +2 because Excel rows start at 1 and we have a header row
            
            try {
              const title = row['Title'] || row['title'];
              
              // Validate required fields first
              if (!title || title.trim() === '') {
                failedRows.push({
                  row: rowNumber,
                  title: '(no title)',
                  reason: 'Missing title'
                });
                continue;
              }

              // Convert Excel dates to ISO format
              const startDateRaw = row['Start Date'] || row['start_date'] || '';
              const targetDateRaw = row['Target Date'] || row['target_date'] || '';
              
              const taskData = {
                title: title.trim(),
                description: (row['Description'] || row['description'] || '').toString().trim(),
                startDate: excelDateToISO(startDateRaw),
                targetDate: excelDateToISO(targetDateRaw),
                reminderFrequency: (row['Reminder Frequency'] || row['reminder_frequency'] || 'none').toLowerCase(),
                remark: (row['Remarks'] || row['remarks'] || '').toString().trim(),
                assignedTo: undefined as number | undefined,
              };

              // Try to find assignee by name
              const assigneeName = row['Assigned To'] || row['assigned_to'];
              if (assigneeName && typeof assigneeName === 'string') {
                const assignee = allUsers.find(u => 
                  u.name.toLowerCase() === assigneeName.trim().toLowerCase()
                );
                if (assignee) {
                  taskData.assignedTo = assignee.id;
                } else {
                  failedRows.push({
                    row: rowNumber,
                    title: title,
                    reason: `Assignee "${assigneeName}" not found`
                  });
                  continue;
                }
              }

              // Validate reminder frequency
              const validFrequencies = ['none', 'hourly', 'every_3_hours', 'every_6_hours', 'daily', 'every_2_days'];
              if (!validFrequencies.includes(taskData.reminderFrequency)) {
                taskData.reminderFrequency = 'none';
              }

              await apiRequest('POST', '/api/tasks', taskData);
              successCount++;
            } catch (error) {
              console.error('Error importing task:', error);
              failedRows.push({
                row: rowNumber,
                title: row['Title'] || row['title'] || '(no title)',
                reason: error instanceof Error ? error.message : 'Unknown error'
              });
            }
          }

          // Refresh task list
          queryClient.invalidateQueries({ queryKey: ['/api/tasks'] });

          // Show detailed results
          if (failedRows.length === 0) {
            toast({
              title: "Import Successful",
              description: `Successfully imported all ${successCount} tasks`,
            });
          } else {
            const failureDetails = failedRows.slice(0, 5).map(f => 
              `Row ${f.row} (${f.title}): ${f.reason}`
            ).join('\n');
            
            const moreFailures = failedRows.length > 5 ? `\n...and ${failedRows.length - 5} more` : '';
            
            toast({
              title: "Import Completed with Errors",
              description: `Imported ${successCount} tasks, ${failedRows.length} failed:\n${failureDetails}${moreFailures}`,
              variant: failedRows.length > successCount ? "destructive" : "default",
            });
          }
        } catch (error) {
          console.error('Import error:', error);
          toast({
            title: "Import Failed",
            description: "Failed to parse Excel file. Please ensure it's a valid .xlsx or .xls file.",
            variant: "destructive",
          });
        }
      };

      reader.readAsArrayBuffer(file);
    } catch (error) {
      console.error('File read error:', error);
      toast({
        title: "Import Failed",
        description: "Failed to read Excel file",
        variant: "destructive",
      });
    }

    // Reset file input
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
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

  // Effect to populate status update form when selectedTask changes
  useEffect(() => {
    if (selectedTask && isStatusUpdateDialogOpen) {
      statusUpdateForm.reset({
        status: selectedTask.status,
        completionPercentage: (selectedTask.completionPercentage || 0).toString(),
        statusUpdateReason: selectedTask.statusUpdateReason || '',
      });
    }
  }, [selectedTask, isStatusUpdateDialogOpen]);

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
    <div className="flex flex-col h-full bg-background">
      <div className="p-3 md:p-4 border-b bg-secondary/50">
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
            <h1 className="text-xl md:text-2xl font-bold text-foreground" data-testid="text-tasks-title">
              <span className="hidden sm:inline">Task Management</span>
              <span className="sm:hidden">Tasks</span>
            </h1>
          </div>
          
          <div className="flex items-center gap-2">
            {isAdmin && (
              <>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={handleExportToExcel}
                  data-testid="button-export-excel"
                  title="Download tasks as Excel file"
                >
                  <Download className="w-4 h-4 md:mr-1" />
                  <span className="hidden md:inline">Export</span>
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => fileInputRef.current?.click()}
                  data-testid="button-import-excel"
                  title="Import tasks from Excel file"
                >
                  <Upload className="w-4 h-4 md:mr-1" />
                  <span className="hidden md:inline">Import</span>
                </Button>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".xlsx,.xls"
                  onChange={handleImportFromExcel}
                  style={{ display: 'none' }}
                  data-testid="input-file-excel"
                />
              </>
            )}
            <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
              <DialogTrigger asChild>
                <Button 
                  size="sm" 
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
                    name="reminderFrequency"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Reminder Frequency</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value}>
                          <FormControl>
                            <SelectTrigger data-testid="select-reminder-frequency">
                              <SelectValue placeholder="Select reminder frequency" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="none">No reminders</SelectItem>
                            <SelectItem value="hourly">Every hour</SelectItem>
                            <SelectItem value="every_3_hours">Every 3 hours</SelectItem>
                            <SelectItem value="every_6_hours">Every 6 hours</SelectItem>
                            <SelectItem value="daily">Daily</SelectItem>
                            <SelectItem value="every_2_days">Every 2 days</SelectItem>
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
        </div>

        {/* Statistics Cards */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-2 md:gap-3 mb-4">
          <Card className="hover-elevate" data-testid="card-stat-total">
            <CardContent className="p-3 md:p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-muted-foreground font-medium">Total Tasks</p>
                  <p className="text-2xl md:text-3xl font-bold text-primary">{statistics.total}</p>
                </div>
                <Target className="w-8 h-8 text-primary/20" />
              </div>
            </CardContent>
          </Card>

          <Card className="hover-elevate" data-testid="card-stat-todo">
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

          <Card className="hover-elevate" data-testid="card-stat-inprogress">
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

          <Card className="hover-elevate" data-testid="card-stat-completed">
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

          <Card className="hover-elevate" data-testid="card-stat-overdue">
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
          {isAdmin && (
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
                <span className="hidden sm:inline">All Tasks</span>
                <span className="sm:hidden">All</span>
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
          )}
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
                      <div className={`h-1.5 rounded-t-md ${overdue ? 'bg-rose-500' : 'bg-amber-500'}`} />
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
                      
                      {/* Completion Progress */}
                      <div className="space-y-1.5">
                        <div className="flex items-center justify-between text-xs">
                          <span className="text-muted-foreground font-medium">Progress</span>
                          <span className="font-semibold text-blue-600 dark:text-blue-400">
                            {task.completionPercentage || 0}%
                          </span>
                        </div>
                        <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                          <div 
                            className="bg-blue-500 h-2 rounded-full transition-all duration-300" 
                            style={{ width: `${task.completionPercentage || 0}%` }}
                          />
                        </div>
                      </div>

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

              <div>
                <h4 className="font-semibold mb-2 text-sm">Completion Status</h4>
                <div className="flex items-center gap-3">
                  <div className="flex-1 bg-gray-200 dark:bg-gray-700 rounded-full h-3">
                    <div 
                      className="bg-blue-500 h-3 rounded-full transition-all duration-300" 
                      style={{ width: `${selectedTask.completionPercentage || 0}%` }}
                    />
                  </div>
                  <span className="text-sm font-semibold text-blue-600 dark:text-blue-400 min-w-[3rem]">
                    {selectedTask.completionPercentage || 0}%
                  </span>
                </div>
              </div>

              {selectedTask.statusUpdateReason && (
                <div>
                  <h4 className="font-semibold mb-2 text-sm">Status Update Reason</h4>
                  <p className="text-sm text-muted-foreground whitespace-pre-wrap">{selectedTask.statusUpdateReason}</p>
                </div>
              )}

              {selectedTask.remark && (
                <div>
                  <h4 className="font-semibold mb-2 text-sm">Remarks</h4>
                  <p className="text-sm text-muted-foreground whitespace-pre-wrap">{selectedTask.remark}</p>
                </div>
              )}

              <div className="pt-4 border-t flex flex-col sm:flex-row gap-2">
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
                  Edit Assignment & Remarks
                </Button>
                <Button
                  size="sm"
                  variant="default"
                  onClick={() => {
                    setIsStatusUpdateDialogOpen(true);
                    statusUpdateForm.reset({
                      status: selectedTask.status,
                      completionPercentage: (selectedTask.completionPercentage || 0).toString(),
                      statusUpdateReason: selectedTask.statusUpdateReason || '',
                    });
                  }}
                  className="w-full sm:w-auto"
                  data-testid="button-update-status"
                >
                  <Target className="w-3 h-3 mr-1" />
                  Update Status & Progress
                </Button>
                
                {/* Delete button - visible to task creator or admin */}
                {(isAdmin || selectedTask.createdBy === currentUser.id) && (
                  <Button
                    size="sm"
                    variant="destructive"
                    onClick={() => {
                      if (window.confirm('Are you sure you want to delete this task? This action cannot be undone.')) {
                        deleteTaskMutation.mutate(selectedTask.id);
                      }
                    }}
                    disabled={deleteTaskMutation.isPending}
                    className="w-full sm:w-auto"
                    data-testid="button-delete-task"
                  >
                    <Trash2 className="w-3 h-3 mr-1" />
                    {deleteTaskMutation.isPending ? 'Deleting...' : 'Delete Task'}
                  </Button>
                )}
              </div>
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

      {/* Status Update Dialog */}
      {selectedTask && (
        <Dialog open={isStatusUpdateDialogOpen} onOpenChange={setIsStatusUpdateDialogOpen}>
          <DialogContent className="max-w-[calc(100vw-2rem)] sm:max-w-md">
            <DialogHeader>
              <DialogTitle>Update Task Status & Progress</DialogTitle>
              <DialogDescription>
                Update the completion percentage, status, and provide a reason for the update.
              </DialogDescription>
            </DialogHeader>
            <Form {...statusUpdateForm}>
              <form onSubmit={statusUpdateForm.handleSubmit(onStatusUpdateSubmit)} className="space-y-4">
                <FormField
                  control={statusUpdateForm.control}
                  name="status"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Status</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger data-testid="select-status">
                            <SelectValue placeholder="Select status" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {Object.entries(statusConfig).map(([status, config]) => (
                            <SelectItem key={status} value={status}>
                              {config.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={statusUpdateForm.control}
                  name="completionPercentage"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Completion Percentage</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger data-testid="select-completion-percentage">
                            <SelectValue placeholder="Select percentage" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="0">0% - Not Started</SelectItem>
                          <SelectItem value="25">25% - Just Started</SelectItem>
                          <SelectItem value="50">50% - Half Way</SelectItem>
                          <SelectItem value="75">75% - Almost Done</SelectItem>
                          <SelectItem value="100">100% - Completed</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={statusUpdateForm.control}
                  name="statusUpdateReason"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Status Update Reason (Optional)</FormLabel>
                      <FormControl>
                        <Textarea 
                          placeholder="Explain why you're updating the status or what progress has been made..." 
                          {...field}
                          className="min-h-[100px]"
                          data-testid="input-status-reason"
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
                    onClick={() => setIsStatusUpdateDialogOpen(false)}
                    data-testid="button-cancel-status-update"
                  >
                    Cancel
                  </Button>
                  <Button 
                    type="submit" 
                    disabled={updateStatusMutation.isPending}
                    data-testid="button-submit-status-update"
                  >
                    {updateStatusMutation.isPending ? 'Updating...' : 'Update Status'}
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
