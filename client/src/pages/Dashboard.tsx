import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { TrendingUp, TrendingDown, Users, CheckCircle, Clock, AlertTriangle, Briefcase } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';

const COLORS = ['#C54E1F', '#F5A623', '#7ED321', '#4A90E2', '#9013FE', '#50E3C2'];

export default function Dashboard() {
  const [period, setPeriod] = useState('week');

  const { data: analytics, isLoading } = useQuery({
    queryKey: ['/api/dashboard/analytics', period],
    queryFn: async () => {
      const response = await fetch(`/api/dashboard/analytics?period=${period}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('auth_token')}`
        }
      });
      if (!response.ok) throw new Error('Failed to fetch analytics');
      return response.json();
    },
  });

  if (isLoading) {
    return (
      <div className="p-6 space-y-6">
        <div className="flex items-center justify-between">
          <Skeleton className="h-8 w-64" />
          <Skeleton className="h-10 w-32" />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map(i => <Skeleton key={i} className="h-32" />)}
        </div>
      </div>
    );
  }

  const overall = analytics?.overall || {};
  const userStats = analytics?.userStats || [];
  const trends = analytics?.trends || [];
  const projectStats = analytics?.projectStats || [];

  // Prepare data for user performance pie chart
  const userPieData = userStats
    .filter((u: any) => u.periodTasks > 0)
    .map((u: any) => ({
      name: u.userName,
      value: u.periodCompleted,
    }));

  return (
    <div className="flex-1 overflow-auto bg-background">
      <div className="p-6 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-foreground" data-testid="heading-dashboard">Performance Dashboard</h1>
            <p className="text-muted-foreground mt-1">Track team performance, tasks, and project progress</p>
          </div>
          <Select value={period} onValueChange={setPeriod}>
            <SelectTrigger className="w-40" data-testid="select-period">
              <SelectValue placeholder="Select period" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="week">Last Week</SelectItem>
              <SelectItem value="month">Last Month</SelectItem>
              <SelectItem value="quarter">Last Quarter</SelectItem>
              <SelectItem value="year">Last Year</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Overview Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Tasks</CardTitle>
              <Briefcase className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{overall.totalTasks || 0}</div>
              <p className="text-xs text-muted-foreground mt-1">Across all users</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Completion Rate</CardTitle>
              <CheckCircle className="h-4 w-4 text-green-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{overall.completionRate || 0}%</div>
              <p className="text-xs text-muted-foreground mt-1">
                {overall.completedTasks || 0} of {overall.totalTasks || 0} tasks
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Active Projects</CardTitle>
              <TrendingUp className="h-4 w-4 text-primary" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{overall.activeProjects || 0}</div>
              <p className="text-xs text-muted-foreground mt-1">
                Out of {overall.totalProjects || 0} total
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Team Size</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{userStats.length}</div>
              <p className="text-xs text-muted-foreground mt-1">Active team members</p>
            </CardContent>
          </Card>
        </div>

        {/* Task Completion Trends */}
        <Card>
          <CardHeader>
            <CardTitle>Task Completion Trends</CardTitle>
            <CardDescription>Daily task completion over the selected period</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={trends}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" tick={{ fontSize: 12 }} />
                <YAxis />
                <Tooltip />
                <Legend />
                <Line type="monotone" dataKey="completedTasks" stroke="#22c55e" name="Completed" strokeWidth={2} />
                <Line type="monotone" dataKey="totalTasks" stroke="#C54E1F" name="Total" strokeWidth={2} />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* User Performance */}
          <Card>
            <CardHeader>
              <CardTitle>User Performance</CardTitle>
              <CardDescription>Tasks completed per team member in selected period</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={userStats}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="userName" tick={{ fontSize: 11 }} />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="periodCompleted" fill="#C54E1F" name="Completed" />
                  <Bar dataKey="pendingTasks" fill="#F5A623" name="Pending" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* Task Distribution Pie Chart */}
          <Card>
            <CardHeader>
              <CardTitle>Task Distribution</CardTitle>
              <CardDescription>Completed tasks per user in selected period</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={userPieData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {userPieData.map((entry: any, index: number) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </div>

        {/* User Statistics Table */}
        <Card>
          <CardHeader>
            <CardTitle>Detailed User Statistics</CardTitle>
            <CardDescription>Comprehensive breakdown of each team member's performance</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b">
                    <th className="text-left p-3 font-semibold">User</th>
                    <th className="text-center p-3 font-semibold">Total Tasks</th>
                    <th className="text-center p-3 font-semibold">Completed</th>
                    <th className="text-center p-3 font-semibold">Pending</th>
                    <th className="text-center p-3 font-semibold">Overdue</th>
                    <th className="text-center p-3 font-semibold">Completion Rate</th>
                  </tr>
                </thead>
                <tbody>
                  {userStats.map((user: any) => (
                    <tr key={user.userId} className="border-b hover:bg-accent/50">
                      <td className="p-3 font-medium">{user.userName}</td>
                      <td className="p-3 text-center">{user.totalTasks}</td>
                      <td className="p-3 text-center text-green-600">{user.completedTasks}</td>
                      <td className="p-3 text-center text-blue-600">{user.pendingTasks}</td>
                      <td className="p-3 text-center">
                        {user.overdueTasks > 0 ? (
                          <Badge variant="destructive" className="gap-1">
                            <AlertTriangle className="w-3 h-3" />
                            {user.overdueTasks}
                          </Badge>
                        ) : (
                          <span className="text-muted-foreground">0</span>
                        )}
                      </td>
                      <td className="p-3 text-center">
                        <Badge variant={user.completionRate >= 70 ? "default" : "secondary"}>
                          {user.completionRate}%
                        </Badge>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>

        {/* Project Performance */}
        <Card>
          <CardHeader>
            <CardTitle>Project Performance</CardTitle>
            <CardDescription>Status and progress of all projects</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {projectStats.map((project: any) => (
                <div key={project.projectId} className="border rounded-lg p-4">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex-1">
                      <h4 className="font-semibold text-lg">{project.projectName}</h4>
                      <p className="text-sm text-muted-foreground">
                        Managed by: {project.responsiblePerson || 'Unassigned'}
                      </p>
                    </div>
                    <Badge variant="outline" className={
                      project.statusColor === 'green' ? 'border-green-600 text-green-600' :
                      project.statusColor === 'blue' ? 'border-blue-600 text-blue-600' :
                      project.statusColor === 'yellow' ? 'border-yellow-600 text-yellow-600' :
                      ''
                    }>
                      {project.status}
                    </Badge>
                  </div>
                  <div className="grid grid-cols-3 gap-4 text-sm">
                    <div>
                      <p className="text-muted-foreground">Project Progress</p>
                      <p className="text-lg font-semibold">{project.progress}%</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Tasks Completed</p>
                      <p className="text-lg font-semibold">{project.completedTasks}/{project.totalTasks}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Task Completion</p>
                      <p className="text-lg font-semibold">{project.taskCompletion}%</p>
                    </div>
                  </div>
                  <div className="mt-3">
                    <div className="w-full bg-secondary rounded-full h-2">
                      <div 
                        className="bg-primary h-2 rounded-full transition-all"
                        style={{ width: `${project.progress}%` }}
                      />
                    </div>
                  </div>
                </div>
              ))}
              {projectStats.length === 0 && (
                <div className="text-center py-8 text-muted-foreground">
                  No projects available
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
