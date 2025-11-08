import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { TrendingUp, TrendingDown, Users, CheckCircle2, Clock, AlertCircle, Briefcase, BarChart3, Award, Target, Activity } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';

const PIE_COLORS = ['#C54E1F', '#B864E6']; // Orange and Purple only per design guidelines

export default function Dashboard() {
  const [period, setPeriod] = useState('week');

  const { data: analytics, isLoading } = useQuery({
    queryKey: [`/api/dashboard/analytics?period=${period}`],
  });

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background via-background to-accent/5 p-6 space-y-6">
        <div className="flex items-center justify-between">
          <Skeleton className="h-10 w-72" />
          <Skeleton className="h-11 w-40" />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {[1, 2, 3, 4].map(i => <Skeleton key={i} className="h-36" />)}
        </div>
      </div>
    );
  }

  const overall = (analytics as any)?.overall || {};
  const userStats = (analytics as any)?.userStats || [];
  const trends = (analytics as any)?.trends || [];
  const projectStats = (analytics as any)?.projectStats || [];

  const userPieData = userStats
    .filter((u: any) => u.periodCompleted > 0)
    .map((u: any) => ({
      name: u.userName,
      value: u.periodCompleted,
    }));

  const getCompletionTrend = () => {
    if (trends.length < 2) return 0;
    const recent = trends.slice(-3);
    const older = trends.slice(0, 3);
    const recentAvg = recent.reduce((acc: number, t: any) => acc + (t.completedTasks || 0), 0) / recent.length;
    const olderAvg = older.reduce((acc: number, t: any) => acc + (t.completedTasks || 0), 0) / older.length;
    return olderAvg > 0 ? Math.round(((recentAvg - olderAvg) / olderAvg) * 100) : 0;
  };

  const completionTrend = getCompletionTrend();

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-accent/5">
      <div className="p-6 space-y-8 max-w-[1800px] mx-auto">
        {/* Enhanced Header */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-3">
              <div className="p-2.5 bg-primary/10 rounded-xl">
                <BarChart3 className="w-7 h-7 text-primary" />
              </div>
              <div>
                <h1 className="text-4xl font-bold bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text" data-testid="heading-dashboard">
                  Performance Dashboard
                </h1>
                <p className="text-muted-foreground mt-0.5 text-sm">Real-time insights into team performance and project progress</p>
              </div>
            </div>
          </div>
          <Select value={period} onValueChange={setPeriod}>
            <SelectTrigger className="w-44 h-11 border-2 shadow-sm" data-testid="select-period">
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

        {/* Enhanced Overview Cards with Gradients */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <Card className="border-2 shadow-lg hover-elevate active-elevate-2 transition-all">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-semibold text-muted-foreground">Total Tasks</CardTitle>
              <div className="p-2 bg-primary/10 rounded-lg">
                <Briefcase className="h-5 w-5 text-primary" />
              </div>
            </CardHeader>
            <CardContent className="space-y-2">
              <div className="text-3xl font-bold">{overall.totalTasks || 0}</div>
              <div className="flex items-center gap-2">
                <Badge variant="secondary" className="text-xs gap-1">
                  <Activity className="w-3 h-3" />
                  All Users
                </Badge>
                <p className="text-xs text-muted-foreground">Across organization</p>
              </div>
            </CardContent>
          </Card>

          <Card className="border-2 shadow-lg hover-elevate active-elevate-2 transition-all">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-semibold text-muted-foreground">Completion Rate</CardTitle>
              <div className="p-2 bg-green-500/10 rounded-lg">
                <CheckCircle2 className="h-5 w-5 text-green-600" />
              </div>
            </CardHeader>
            <CardContent className="space-y-2">
              <div className="flex items-baseline gap-2">
                <div className="text-3xl font-bold">{overall.completionRate || 0}%</div>
                {completionTrend !== 0 && (
                  <Badge variant={completionTrend > 0 ? "default" : "secondary"} className="gap-1">
                    {completionTrend > 0 ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
                    {Math.abs(completionTrend)}%
                  </Badge>
                )}
              </div>
              <p className="text-xs text-muted-foreground">
                {overall.completedTasks || 0} of {overall.totalTasks || 0} tasks completed
              </p>
            </CardContent>
          </Card>

          <Card className="border-2 shadow-lg hover-elevate active-elevate-2 transition-all">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-semibold text-muted-foreground">Active Projects</CardTitle>
              <div className="p-2 bg-blue-500/10 rounded-lg">
                <Target className="h-5 w-5 text-blue-600" />
              </div>
            </CardHeader>
            <CardContent className="space-y-2">
              <div className="text-3xl font-bold">{overall.activeProjects || 0}</div>
              <p className="text-xs text-muted-foreground">
                Out of {overall.totalProjects || 0} total projects
              </p>
            </CardContent>
          </Card>

          <Card className="border-2 shadow-lg hover-elevate active-elevate-2 transition-all">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-semibold text-muted-foreground">Team Size</CardTitle>
              <div className="p-2 bg-primary/10 rounded-lg">
                <Users className="h-5 w-5 text-primary" />
              </div>
            </CardHeader>
            <CardContent className="space-y-2">
              <div className="text-3xl font-bold">{userStats.length}</div>
              <Badge variant="outline" className="text-xs">
                Active Members
              </Badge>
            </CardContent>
          </Card>
        </div>

        {/* Enhanced Task Completion Trends with Bar Chart */}
        <Card className="border-2 shadow-lg">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-xl font-bold">Task Completion Trends</CardTitle>
                <CardDescription className="mt-1">Performance over the selected period</CardDescription>
              </div>
              <Badge variant="outline" className="gap-2">
                <Activity className="w-4 h-4" />
                {trends.length} Days
              </Badge>
            </div>
          </CardHeader>
          <CardContent>
            {trends.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-20 text-center">
                <div className="p-4 bg-muted/50 rounded-2xl mb-4">
                  <BarChart3 className="w-16 h-16 text-muted-foreground" />
                </div>
                <p className="text-sm font-medium text-muted-foreground">No trend data available for this period</p>
                <p className="text-xs text-muted-foreground mt-1">Data will appear as tasks are completed</p>
              </div>
            ) : (
              <ResponsiveContainer width="100%" height={380}>
                <BarChart data={trends} barGap={8} barCategoryGap="20%">
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" opacity={0.3} vertical={false} />
                  <XAxis 
                    dataKey="date" 
                    tick={{ fontSize: 12, fill: 'hsl(var(--muted-foreground))' }}
                    tickLine={false}
                    axisLine={{ stroke: 'hsl(var(--border))' }}
                  />
                  <YAxis 
                    tick={{ fontSize: 12, fill: 'hsl(var(--muted-foreground))' }}
                    tickLine={false}
                    axisLine={{ stroke: 'hsl(var(--border))' }}
                  />
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: 'hsl(var(--card))', 
                      border: '2px solid hsl(var(--border))',
                      borderRadius: '10px',
                      boxShadow: '0 10px 25px -5px rgb(0 0 0 / 0.1)',
                      padding: '12px'
                    }}
                    cursor={{ fill: 'hsl(var(--accent))', opacity: 0.1 }}
                  />
                  <Legend 
                    wrapperStyle={{ paddingTop: '24px' }} 
                    iconType="circle"
                    iconSize={10}
                  />
                  <Bar 
                    dataKey="totalTasks" 
                    fill="#C54E1F"
                    stroke="#C54E1F"
                    name="Total" 
                    radius={[8, 8, 0, 0]}
                    maxBarSize={50}
                  />
                  <Bar 
                    dataKey="completedTasks" 
                    fill="#B864E6"
                    stroke="#B864E6"
                    name="Completed"
                    radius={[8, 8, 0, 0]}
                    maxBarSize={50}
                  />
                </BarChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>

        {/* Enhanced User-Wise Performance Cards */}
        <div className="space-y-5">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-primary/10 rounded-lg">
              <Award className="w-6 h-6 text-primary" />
            </div>
            <div>
              <h2 className="text-2xl font-bold">User-Wise Performance</h2>
              <p className="text-sm text-muted-foreground">Individual performance metrics for each team member</p>
            </div>
          </div>
          {userStats.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 text-center border-2 border-dashed rounded-xl">
              <div className="p-4 bg-muted/50 rounded-2xl mb-4">
                <Users className="w-16 h-16 text-muted-foreground" />
              </div>
              <p className="text-sm font-medium text-muted-foreground">No user performance data available</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
              {userStats.map((user: any) => (
                <Card 
                  key={user.userId} 
                  className="border-2 shadow-md hover-elevate active-elevate-2 transition-all relative overflow-hidden"
                  data-testid={`card-user-${user.userId}`}
                >
                  {/* Decorative color bar */}
                  <div className={`absolute top-0 left-0 right-0 h-1.5 ${
                    user.completionRate >= 70 ? 'bg-green-500' : 
                    user.completionRate >= 40 ? 'bg-primary' : 
                    'bg-yellow-500'
                  }`} />
                  
                  <CardHeader className="pb-3 pt-5">
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1 min-w-0">
                        <CardTitle className="text-base font-bold truncate">{user.userName}</CardTitle>
                      </div>
                      <Badge 
                        variant={user.completionRate >= 70 ? "default" : user.completionRate >= 40 ? "secondary" : "outline"}
                        className="shrink-0 font-bold"
                        data-testid={`badge-completion-${user.userId}`}
                      >
                        {user.completionRate}%
                      </Badge>
                    </div>
                  </CardHeader>
                  
                  <CardContent className="space-y-4">
                    {/* Stats Grid with Icons */}
                    <div className="grid grid-cols-2 gap-3">
                      <div className="space-y-1 p-2.5 bg-muted/30 rounded-lg">
                        <div className="flex items-center gap-1.5">
                          <Briefcase className="w-3.5 h-3.5 text-muted-foreground" />
                          <p className="text-xs text-muted-foreground font-medium">Total</p>
                        </div>
                        <p className="text-xl font-bold" data-testid={`text-total-${user.userId}`}>{user.totalTasks}</p>
                      </div>
                      <div className="space-y-1 p-2.5 bg-green-500/10 rounded-lg">
                        <div className="flex items-center gap-1.5">
                          <CheckCircle2 className="w-3.5 h-3.5 text-green-600" />
                          <p className="text-xs text-green-700 font-medium">Done</p>
                        </div>
                        <p className="text-xl font-bold text-green-600" data-testid={`text-completed-${user.userId}`}>{user.completedTasks}</p>
                      </div>
                      <div className="space-y-1 p-2.5 bg-blue-500/10 rounded-lg">
                        <div className="flex items-center gap-1.5">
                          <Clock className="w-3.5 h-3.5 text-blue-600" />
                          <p className="text-xs text-blue-700 font-medium">Pending</p>
                        </div>
                        <p className="text-xl font-bold text-blue-600" data-testid={`text-pending-${user.userId}`}>{user.pendingTasks}</p>
                      </div>
                      <div className="space-y-1 p-2.5 bg-red-500/10 rounded-lg">
                        <div className="flex items-center gap-1.5">
                          <AlertCircle className="w-3.5 h-3.5 text-red-600" />
                          <p className="text-xs text-red-700 font-medium">Overdue</p>
                        </div>
                        <p className="text-xl font-bold text-red-600" data-testid={`text-overdue-${user.userId}`}>{user.overdueTasks}</p>
                      </div>
                    </div>
                    
                    {/* Enhanced Progress Bar */}
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-medium text-muted-foreground">Completion Progress</span>
                        <span className="text-xs font-bold">{user.completionRate}%</span>
                      </div>
                      <div className="relative w-full bg-secondary/20 rounded-full h-2.5 overflow-hidden">
                        <div 
                          className={`h-full rounded-full transition-all duration-500 ${
                            user.completionRate >= 70 ? 'bg-green-500' : 
                            user.completionRate >= 40 ? 'bg-primary' : 
                            'bg-yellow-500'
                          }`}
                          style={{ width: `${user.completionRate}%` }}
                          data-testid={`progress-bar-${user.userId}`}
                        />
                      </div>
                    </div>

                    {/* Period Stats */}
                    {user.periodTasks > 0 && (
                      <div className="pt-3 border-t space-y-2">
                        <div className="flex items-center gap-2">
                          <Activity className="w-3.5 h-3.5 text-primary" />
                          <p className="text-xs font-semibold text-muted-foreground">Period Activity</p>
                        </div>
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-muted-foreground">{user.periodTasks} tasks</span>
                          <Badge variant="default" className="gap-1">
                            <CheckCircle2 className="w-3 h-3" />
                            {user.periodCompleted} done
                          </Badge>
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>

        {/* Enhanced Charts Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* User Performance Chart */}
          <Card className="border-2 shadow-xl transition-all overflow-hidden">
            <CardHeader className="bg-gradient-to-br from-background to-accent/5 pb-4">
              <div className="flex items-center gap-3">
                <div className="p-2.5 bg-primary/10 rounded-xl">
                  <BarChart3 className="w-6 h-6 text-primary" />
                </div>
                <div>
                  <CardTitle className="text-xl font-bold">User Performance Chart</CardTitle>
                  <CardDescription className="mt-0.5">Comparative view of team member contributions</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="pt-6">
              {userStats.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-16 text-center">
                  <div className="p-5 bg-gradient-to-br from-primary/10 to-primary/5 rounded-2xl mb-4">
                    <Users className="w-16 h-16 text-primary" />
                  </div>
                  <p className="text-sm font-medium text-muted-foreground">No performance data available</p>
                  <p className="text-xs text-muted-foreground mt-1">Data will appear as users complete tasks</p>
                </div>
              ) : (
                <ResponsiveContainer width="100%" height={380}>
                  <BarChart data={userStats} barGap={6} barCategoryGap="15%">
                    <CartesianGrid 
                      strokeDasharray="3 3" 
                      stroke="hsl(var(--border))" 
                      opacity={0.2} 
                      vertical={false}
                    />
                    <XAxis 
                      dataKey="userName" 
                      tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }}
                      tickLine={false}
                      angle={-45}
                      textAnchor="end"
                      height={90}
                      axisLine={{ stroke: 'hsl(var(--border))' }}
                    />
                    <YAxis 
                      tick={{ fontSize: 12, fill: 'hsl(var(--muted-foreground))' }}
                      tickLine={false}
                      axisLine={{ stroke: 'hsl(var(--border))' }}
                      label={{ value: 'Tasks', angle: -90, position: 'insideLeft', style: { fontSize: 12, fill: 'hsl(var(--muted-foreground))' } }}
                    />
                    <Tooltip 
                      contentStyle={{ 
                        backgroundColor: 'hsl(var(--card))', 
                        border: '2px solid hsl(var(--border))',
                        borderRadius: '10px',
                        boxShadow: '0 10px 25px -5px rgb(0 0 0 / 0.15)',
                        padding: '12px'
                      }}
                      cursor={{ fill: 'hsl(var(--accent))', opacity: 0.1 }}
                    />
                    <Legend 
                      wrapperStyle={{ paddingTop: '20px' }} 
                      iconType="circle"
                      iconSize={10}
                    />
                    <Bar 
                      dataKey="periodCompleted" 
                      fill="#B864E6"
                      stroke="#B864E6"
                      name="Completed" 
                      radius={[8, 8, 0, 0]}
                      maxBarSize={50}
                    />
                    <Bar 
                      dataKey="pendingTasks" 
                      fill="#C54E1F"
                      stroke="#C54E1F"
                      name="Pending" 
                      radius={[8, 8, 0, 0]}
                      maxBarSize={50}
                    />
                  </BarChart>
                </ResponsiveContainer>
              )}
            </CardContent>
          </Card>

          {/* Task Distribution Pie Chart */}
          <Card className="border-2 shadow-xl transition-all overflow-hidden">
            <CardHeader className="bg-gradient-to-br from-background to-accent/5 pb-4">
              <div className="flex items-center gap-3">
                <div className="p-2.5 bg-primary/10 rounded-xl">
                  <Target className="w-6 h-6 text-primary" />
                </div>
                <div>
                  <CardTitle className="text-xl font-bold">Task Distribution</CardTitle>
                  <CardDescription className="mt-0.5">Workload distribution across team members</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="pt-6">
              {userPieData.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-16 text-center">
                  <div className="p-5 bg-gradient-to-br from-primary/10 to-primary/5 rounded-2xl mb-4">
                    <CheckCircle2 className="w-16 h-16 text-primary" />
                  </div>
                  <p className="text-sm font-medium text-muted-foreground">No completed tasks in this period</p>
                  <p className="text-xs text-muted-foreground mt-1">Complete tasks to see distribution</p>
                </div>
              ) : (
                <div className="relative">
                  <ResponsiveContainer width="100%" height={380}>
                    <PieChart>
                      <Pie
                        data={userPieData}
                        cx="50%"
                        cy="50%"
                        labelLine={{
                          stroke: 'hsl(var(--muted-foreground))',
                          strokeWidth: 1.5
                        }}
                        label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                        outerRadius={120}
                        innerRadius={50}
                        fill="#8884d8"
                        dataKey="value"
                        strokeWidth={3}
                        stroke="hsl(var(--background))"
                        paddingAngle={2}
                      >
                        {userPieData.map((entry: any, index: number) => (
                          <Cell 
                            key={`cell-${index}`} 
                            fill={PIE_COLORS[index % PIE_COLORS.length]}
                          />
                        ))}
                      </Pie>
                      <Tooltip 
                        contentStyle={{ 
                          backgroundColor: 'hsl(var(--card))', 
                          border: '2px solid hsl(var(--border))',
                          borderRadius: '10px',
                          boxShadow: '0 10px 25px -5px rgb(0 0 0 / 0.15)',
                          padding: '12px'
                        }} 
                      />
                    </PieChart>
                  </ResponsiveContainer>
                  {/* Center Label */}
                  <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                    <div className="text-center">
                      <p className="text-xs font-medium text-muted-foreground">Total</p>
                      <p className="text-2xl font-bold text-foreground">
                        {userPieData.reduce((acc: number, item: any) => acc + item.value, 0)}
                      </p>
                      <p className="text-xs text-muted-foreground">Tasks</p>
                    </div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Enhanced User Statistics Table */}
        <Card className="border-2 shadow-lg">
          <CardHeader>
            <div className="flex items-center gap-3">
              <div className="p-2 bg-primary/10 rounded-lg">
                <Users className="w-5 h-5 text-primary" />
              </div>
              <div>
                <CardTitle className="text-xl font-bold">Detailed User Statistics</CardTitle>
                <CardDescription className="mt-0.5">Comprehensive performance breakdown</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {userStats.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-16 text-center">
                <div className="p-4 bg-muted/50 rounded-2xl mb-4">
                  <Users className="w-14 h-14 text-muted-foreground" />
                </div>
                <p className="text-sm font-medium text-muted-foreground">No user statistics available</p>
              </div>
            ) : (
              <div className="overflow-x-auto rounded-lg border">
                <table className="w-full">
                  <thead className="bg-muted/50">
                    <tr className="border-b-2">
                      <th className="text-left p-4 font-bold text-sm">User</th>
                      <th className="text-center p-4 font-bold text-sm">Total Tasks</th>
                      <th className="text-center p-4 font-bold text-sm">Completed</th>
                      <th className="text-center p-4 font-bold text-sm">Pending</th>
                      <th className="text-center p-4 font-bold text-sm">Overdue</th>
                      <th className="text-center p-4 font-bold text-sm">Completion Rate</th>
                    </tr>
                  </thead>
                  <tbody>
                    {userStats.map((user: any, index: number) => (
                      <tr 
                        key={user.userId} 
                        className={`border-b hover-elevate transition-all ${index % 2 === 0 ? 'bg-background' : 'bg-muted/20'}`}
                      >
                        <td className="p-4">
                          <div className="flex items-center gap-2">
                            <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                              <span className="text-xs font-bold text-primary">{user.userName.charAt(0)}</span>
                            </div>
                            <span className="font-semibold">{user.userName}</span>
                          </div>
                        </td>
                        <td className="p-4 text-center font-semibold">{user.totalTasks}</td>
                        <td className="p-4 text-center">
                          <Badge variant="outline" className="bg-green-500/10 text-green-700 border-green-300 font-bold">
                            {user.completedTasks}
                          </Badge>
                        </td>
                        <td className="p-4 text-center">
                          <Badge variant="outline" className="bg-blue-500/10 text-blue-700 border-blue-300 font-bold">
                            {user.pendingTasks}
                          </Badge>
                        </td>
                        <td className="p-4 text-center">
                          {user.overdueTasks > 0 ? (
                            <Badge variant="destructive" className="gap-1.5 font-bold">
                              <AlertCircle className="w-3.5 h-3.5" />
                              {user.overdueTasks}
                            </Badge>
                          ) : (
                            <span className="text-muted-foreground font-medium">—</span>
                          )}
                        </td>
                        <td className="p-4 text-center">
                          <Badge 
                            variant={user.completionRate >= 70 ? "default" : user.completionRate >= 40 ? "secondary" : "outline"}
                            className="font-bold text-sm px-3"
                          >
                            {user.completionRate}%
                          </Badge>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Enhanced Project Performance */}
        <Card className="border-2 shadow-lg">
          <CardHeader>
            <div className="flex items-center gap-3">
              <div className="p-2 bg-primary/10 rounded-lg">
                <Target className="w-5 h-5 text-primary" />
              </div>
              <div>
                <CardTitle className="text-xl font-bold">Project Performance</CardTitle>
                <CardDescription className="mt-0.5">Status and progress tracking</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {projectStats.map((project: any) => (
                <div key={project.projectId} className="border-2 rounded-xl p-5 hover-elevate active-elevate-2 transition-all bg-card">
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-4">
                    <div className="flex-1">
                      <h4 className="font-bold text-lg mb-1">{project.projectName}</h4>
                      <div className="flex items-center gap-2 flex-wrap">
                        <Badge variant="outline" className="gap-1.5">
                          <Users className="w-3 h-3" />
                          {project.responsiblePerson || 'Unassigned'}
                        </Badge>
                        <Badge 
                          variant="outline" 
                          className={
                            project.statusColor === 'green' ? 'border-green-500 text-green-700 bg-green-50' :
                            project.statusColor === 'blue' ? 'border-blue-500 text-blue-700 bg-blue-50' :
                            project.statusColor === 'yellow' ? 'border-yellow-500 text-yellow-700 bg-yellow-50' :
                            ''
                          }
                        >
                          {project.status}
                        </Badge>
                      </div>
                    </div>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-4">
                    <div className="p-3 bg-muted/30 rounded-lg">
                      <p className="text-xs text-muted-foreground font-medium mb-1">Project Progress</p>
                      <p className="text-2xl font-bold text-primary">{project.progress}%</p>
                    </div>
                    <div className="p-3 bg-green-500/10 rounded-lg">
                      <p className="text-xs text-green-700 font-medium mb-1">Tasks Completed</p>
                      <p className="text-2xl font-bold text-green-600">{project.completedTasks}/{project.totalTasks}</p>
                    </div>
                    <div className="p-3 bg-primary/10 rounded-lg">
                      <p className="text-xs text-primary/80 font-medium mb-1">Task Completion</p>
                      <p className="text-2xl font-bold text-primary">{project.taskCompletion}%</p>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-sm">
                      <span className="font-medium text-muted-foreground">Overall Progress</span>
                      <span className="font-bold">{project.progress}%</span>
                    </div>
                    <div className="relative w-full bg-secondary/20 rounded-full h-3 overflow-hidden">
                      <div 
                        className="h-full rounded-full transition-all duration-500 bg-primary"
                        style={{ width: `${project.progress}%` }}
                      />
                    </div>
                  </div>
                </div>
              ))}
              {projectStats.length === 0 && (
                <div className="text-center py-12 border-2 border-dashed rounded-xl">
                  <div className="p-4 bg-muted/50 rounded-2xl mb-4 inline-block">
                    <Briefcase className="w-12 h-12 text-muted-foreground" />
                  </div>
                  <p className="text-sm font-medium text-muted-foreground">No projects available</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
