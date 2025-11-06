import { useState, useEffect } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { queryClient, apiRequest } from '@/lib/queryClient';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Plus, Menu, Pencil, Trash2, Calendar as CalendarIcon, FileText, AlertCircle, Clock } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { useToast } from '@/hooks/use-toast';
import { format } from 'date-fns';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';

interface User {
  id: number;
  name: string;
  loginId: string;
  role: string;
}

interface Project {
  id: number;
  projectId: string;
  projectName: string;
  description?: string;
  startDate: string;
  endDate: string;
  actualEndDate?: string;
  status: 'not_started' | 'in_progress' | 'on_hold' | 'completed' | 'delayed';
  progress: number;
  responsiblePersonId: number;
  responsiblePersonName: string;
  supportTeam?: string;
  tasksToDo?: string;
  issues?: string;
  dependencies?: string;
  nextSteps?: string;
  targetCompletionDate?: string;
  remarks?: string;
  attachmentUrl?: string;
  priority: 'low' | 'medium' | 'high';
  duration: number;
  statusColor: 'green' | 'yellow' | 'red';
  createdAt: string;
  updatedAt: string;
}

interface ProjectsProps {
  currentUser: User;
  allUsers: User[];
  onOpenMobileMenu: () => void;
}

const projectFormSchema = z.object({
  projectName: z.string().min(1, 'Project name is required'),
  description: z.string().optional(),
  startDate: z.string().min(1, 'Start date is required'),
  endDate: z.string().min(1, 'End date is required'),
  actualEndDate: z.string().optional(),
  status: z.enum(['not_started', 'in_progress', 'on_hold', 'completed', 'delayed']).default('not_started'),
  progress: z.number().min(0).max(100).default(0),
  responsiblePersonId: z.number().min(1, 'Responsible person is required'),
  supportTeam: z.string().optional(),
  tasksToDo: z.string().optional(),
  issues: z.string().optional(),
  dependencies: z.string().optional(),
  nextSteps: z.string().optional(),
  targetCompletionDate: z.string().optional(),
  remarks: z.string().optional(),
  priority: z.enum(['low', 'medium', 'high']).default('medium'),
});

type ProjectFormValues = z.infer<typeof projectFormSchema>;

export default function Projects({ currentUser, allUsers, onOpenMobileMenu }: ProjectsProps) {
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [editingProject, setEditingProject] = useState<Project | null>(null);
  const { toast } = useToast();

  const form = useForm<ProjectFormValues>({
    resolver: zodResolver(projectFormSchema),
    defaultValues: {
      projectName: '',
      description: '',
      status: 'not_started',
      progress: 0,
      priority: 'medium',
      responsiblePersonId: currentUser.id,
    },
  });

  const { data: projects = [], isLoading } = useQuery<Project[]>({
    queryKey: ['/api/projects'],
  });

  const createMutation = useMutation({
    mutationFn: async (data: ProjectFormValues) => {
      return await apiRequest('POST', '/api/projects', data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/projects'] });
      toast({ title: 'Project created successfully' });
      setIsCreateDialogOpen(false);
      form.reset();
    },
    onError: () => {
      toast({ title: 'Failed to create project', variant: 'destructive' });
    },
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: number; data: Partial<ProjectFormValues> }) => {
      return await apiRequest('PUT', `/api/projects/${id}`, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/projects'] });
      toast({ title: 'Project updated successfully' });
      setEditingProject(null);
      setIsCreateDialogOpen(false);
      form.reset();
    },
    onError: () => {
      toast({ title: 'Failed to update project', variant: 'destructive' });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: number) => {
      return await apiRequest('DELETE', `/api/projects/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/projects'] });
      toast({ title: 'Project deleted successfully' });
    },
    onError: () => {
      toast({ title: 'Failed to delete project', variant: 'destructive' });
    },
  });

  const onSubmit = (data: ProjectFormValues) => {
    if (editingProject) {
      updateMutation.mutate({ id: editingProject.id, data });
    } else {
      createMutation.mutate(data);
    }
  };

  const handleEdit = (project: Project) => {
    setEditingProject(project);
    form.reset({
      projectName: project.projectName,
      description: project.description || '',
      startDate: format(new Date(project.startDate), 'yyyy-MM-dd'),
      endDate: format(new Date(project.endDate), 'yyyy-MM-dd'),
      actualEndDate: project.actualEndDate ? format(new Date(project.actualEndDate), 'yyyy-MM-dd') : '',
      status: project.status,
      progress: project.progress,
      responsiblePersonId: project.responsiblePersonId,
      supportTeam: project.supportTeam || '',
      tasksToDo: project.tasksToDo || '',
      issues: project.issues || '',
      dependencies: project.dependencies || '',
      nextSteps: project.nextSteps || '',
      targetCompletionDate: project.targetCompletionDate ? format(new Date(project.targetCompletionDate), 'yyyy-MM-dd') : '',
      remarks: project.remarks || '',
      priority: project.priority,
    });
    setIsCreateDialogOpen(true);
  };

  const handleDelete = (id: number) => {
    if (confirm('Are you sure you want to delete this project?')) {
      deleteMutation.mutate(id);
    }
  };

  const handleOpenCreateDialog = () => {
    setEditingProject(null);
    form.reset({
      projectName: '',
      description: '',
      status: 'not_started',
      progress: 0,
      priority: 'medium',
      responsiblePersonId: currentUser.id,
    });
    setIsCreateDialogOpen(true);
  };

  const getStatusBadgeVariant = (status: Project['status']) => {
    switch (status) {
      case 'completed':
        return 'default';
      case 'in_progress':
        return 'secondary';
      case 'delayed':
      case 'on_hold':
        return 'destructive';
      default:
        return 'outline';
    }
  };

  const getPriorityBadgeVariant = (priority: Project['priority']) => {
    switch (priority) {
      case 'high':
        return 'destructive';
      case 'medium':
        return 'secondary';
      case 'low':
        return 'outline';
      default:
        return 'outline';
    }
  };

  const getProgressColor = (progress: number) => {
    if (progress >= 71) return 'bg-green-500';
    if (progress >= 26) return 'bg-yellow-500';
    return 'bg-red-500';
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-muted-foreground">Loading projects...</div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center justify-between p-4 border-b">
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="icon"
            className="md:hidden"
            onClick={onOpenMobileMenu}
            data-testid="button-open-mobile-menu"
          >
            <Menu className="w-5 h-5" />
          </Button>
          <h1 className="text-xl font-semibold" data-testid="text-project-tracker-title">Project Tracker</h1>
        </div>
        <Dialog open={isCreateDialogOpen} onOpenChange={(open) => {
          setIsCreateDialogOpen(open);
          if (!open) {
            setEditingProject(null);
            form.reset();
          }
        }}>
          <DialogTrigger asChild>
            <Button onClick={handleOpenCreateDialog} data-testid="button-create-project">
              <Plus className="w-4 h-4 mr-2" />
              New Project
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>{editingProject ? 'Edit Project' : 'Create New Project'}</DialogTitle>
            </DialogHeader>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <FormField
                  control={form.control}
                  name="projectName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Project Name</FormLabel>
                      <FormControl>
                        <Input {...field} data-testid="input-project-name" placeholder="Enter project name" />
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
                        <Textarea {...field} data-testid="input-project-description" placeholder="Enter project description" rows={3} />
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
                          <Input {...field} type="date" data-testid="input-start-date" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="endDate"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>End Date</FormLabel>
                        <FormControl>
                          <Input {...field} type="date" data-testid="input-end-date" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="status"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Status</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value}>
                          <FormControl>
                            <SelectTrigger data-testid="select-project-status">
                              <SelectValue placeholder="Select status" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="not_started">Not Started</SelectItem>
                            <SelectItem value="in_progress">In Progress</SelectItem>
                            <SelectItem value="on_hold">On Hold</SelectItem>
                            <SelectItem value="completed">Completed</SelectItem>
                            <SelectItem value="delayed">Delayed</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="priority"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Priority</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value}>
                          <FormControl>
                            <SelectTrigger data-testid="select-project-priority">
                              <SelectValue placeholder="Select priority" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="low">Low</SelectItem>
                            <SelectItem value="medium">Medium</SelectItem>
                            <SelectItem value="high">High</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="responsiblePersonId"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Responsible Person</FormLabel>
                        <Select onValueChange={(value) => field.onChange(parseInt(value))} value={field.value.toString()}>
                          <FormControl>
                            <SelectTrigger data-testid="select-responsible-person">
                              <SelectValue placeholder="Select person" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {allUsers.map((user) => (
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
                    name="progress"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Progress (%)</FormLabel>
                        <FormControl>
                          <Input
                            {...field}
                            type="number"
                            min="0"
                            max="100"
                            data-testid="input-project-progress"
                            onChange={(e) => field.onChange(parseInt(e.target.value) || 0)}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
                <FormField
                  control={form.control}
                  name="supportTeam"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Support Team / Escalation POC</FormLabel>
                      <FormControl>
                        <Input {...field} data-testid="input-support-team" placeholder="Enter support team or POC" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="tasksToDo"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Tasks To Do</FormLabel>
                      <FormControl>
                        <Textarea {...field} data-testid="input-tasks-todo" placeholder="List pending tasks" rows={3} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="issues"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Issues / Risks</FormLabel>
                      <FormControl>
                        <Textarea {...field} data-testid="input-issues" placeholder="Describe problems or risks" rows={3} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="dependencies"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Dependencies</FormLabel>
                      <FormControl>
                        <Textarea {...field} data-testid="input-dependencies" placeholder="List dependencies" rows={2} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="nextSteps"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Next Steps</FormLabel>
                      <FormControl>
                        <Textarea {...field} data-testid="input-next-steps" placeholder="Describe next actions" rows={2} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="targetCompletionDate"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Target Completion Date</FormLabel>
                      <FormControl>
                        <Input {...field} type="date" data-testid="input-target-completion-date" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="remarks"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Remarks / Notes</FormLabel>
                      <FormControl>
                        <Textarea {...field} data-testid="input-remarks" placeholder="Additional comments" rows={2} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <div className="flex justify-end gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => {
                      setIsCreateDialogOpen(false);
                      setEditingProject(null);
                      form.reset();
                    }}
                    data-testid="button-cancel-project"
                  >
                    Cancel
                  </Button>
                  <Button type="submit" data-testid="button-submit-project">
                    {editingProject ? 'Update' : 'Create'} Project
                  </Button>
                </div>
              </form>
            </Form>
          </DialogContent>
        </Dialog>
      </div>

      <ScrollArea className="flex-1">
        <div className="p-4 space-y-4">
          {projects.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground" data-testid="text-no-projects">
              No projects yet. Create your first project to get started.
            </div>
          ) : (
            projects.map((project) => (
              <Card key={project.id} data-testid={`card-project-${project.id}`}>
                <CardHeader className="flex flex-row items-center justify-between gap-1 space-y-0 pb-2">
                  <div className="flex items-center gap-2 flex-1 min-w-0">
                    <Badge variant="outline" className="flex-shrink-0">{project.projectId}</Badge>
                    <CardTitle className="text-lg truncate">{project.projectName}</CardTitle>
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleEdit(project)}
                      data-testid={`button-edit-project-${project.id}`}
                    >
                      <Pencil className="w-4 h-4" />
                    </Button>
                    {currentUser.role === 'admin' && (
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleDelete(project.id)}
                        data-testid={`button-delete-project-${project.id}`}
                      >
                        <Trash2 className="w-4 h-4 text-destructive" />
                      </Button>
                    )}
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  {project.description && (
                    <p className="text-sm text-muted-foreground">{project.description}</p>
                  )}
                  <div className="flex flex-wrap gap-2">
                    <Badge variant={getStatusBadgeVariant(project.status)}>
                      {project.status.replace('_', ' ').toUpperCase()}
                    </Badge>
                    <Badge variant={getPriorityBadgeVariant(project.priority)}>
                      {project.priority.toUpperCase()} PRIORITY
                    </Badge>
                    <Badge variant="outline">
                      <Clock className="w-3 h-3 mr-1" />
                      {project.duration} days
                    </Badge>
                  </div>
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Progress</span>
                      <span className="font-medium">{project.progress}%</span>
                    </div>
                    <div className="relative">
                      <div className="h-2 w-full bg-muted rounded-full overflow-hidden">
                        <div
                          className={`h-full transition-all ${getProgressColor(project.progress)}`}
                          style={{ width: `${project.progress}%` }}
                        />
                      </div>
                    </div>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                    <div>
                      <div className="text-muted-foreground mb-1">Responsible Person</div>
                      <div className="font-medium">{project.responsiblePersonName}</div>
                    </div>
                    <div>
                      <div className="text-muted-foreground mb-1">Duration</div>
                      <div className="font-medium">
                        {format(new Date(project.startDate), 'MMM dd, yyyy')} - {format(new Date(project.endDate), 'MMM dd, yyyy')}
                      </div>
                    </div>
                  </div>
                  {project.supportTeam && (
                    <div className="text-sm">
                      <div className="text-muted-foreground mb-1">Support Team</div>
                      <div>{project.supportTeam}</div>
                    </div>
                  )}
                  {project.issues && (
                    <div className="text-sm">
                      <div className="flex items-center gap-1 text-destructive mb-1">
                        <AlertCircle className="w-3 h-3" />
                        <span className="font-medium">Issues / Risks</span>
                      </div>
                      <div className="text-muted-foreground">{project.issues}</div>
                    </div>
                  )}
                  {project.nextSteps && (
                    <div className="text-sm">
                      <div className="text-muted-foreground mb-1">Next Steps</div>
                      <div>{project.nextSteps}</div>
                    </div>
                  )}
                  {project.remarks && (
                    <div className="text-sm">
                      <div className="text-muted-foreground mb-1">Remarks</div>
                      <div>{project.remarks}</div>
                    </div>
                  )}
                </CardContent>
              </Card>
            ))
          )}
        </div>
      </ScrollArea>
    </div>
  );
}
