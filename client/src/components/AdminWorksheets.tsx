import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useQuery } from '@tanstack/react-query';
import { Menu, Clock, Calendar } from 'lucide-react';
import { format } from 'date-fns';

interface User {
  id: number;
  name: string;
  role: string;
}

interface HourlyLog {
  hour: string;
  activity: string;
}

interface Worksheet {
  id: number;
  userId: number;
  userName: string;
  date: string;
  todos: string;
  hourlyLogs: string;
  status: string;
  submittedAt?: string;
  createdAt: string;
}

interface AdminWorksheetsProps {
  allUsers: User[];
  onOpenMobileMenu?: () => void;
}

export default function AdminWorksheets({ allUsers, onOpenMobileMenu }: AdminWorksheetsProps) {
  const [selectedDate, setSelectedDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [selectedUserId, setSelectedUserId] = useState<string>('all');

  const { data: worksheets = [], isLoading } = useQuery<Worksheet[]>({
    queryKey: ['/api/worksheets/all', selectedDate],
    refetchInterval: 30000,
  });

  const filteredWorksheets = worksheets.filter(ws => {
    const dateMatch = ws.date.startsWith(selectedDate);
    const userMatch = selectedUserId === 'all' || ws.userId === parseInt(selectedUserId);
    return dateMatch && userMatch;
  });

  const submittedWorksheets = filteredWorksheets.filter(ws => ws.status === 'submitted');

  const parseHourlyLogs = (logsJson: string): HourlyLog[] => {
    try {
      return JSON.parse(logsJson || '[]');
    } catch {
      return [];
    }
  };

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
            <h1 className="text-xl font-semibold text-foreground">Team Daily Worksheets</h1>
            <p className="text-sm text-muted-foreground">
              View submitted work logs from your team
            </p>
          </div>
        </div>
      </div>

      <div className="p-4 border-b bg-muted/30 flex flex-wrap gap-3">
        <div className="flex items-center gap-2">
          <Calendar className="h-4 w-4 text-muted-foreground" />
          <input
            type="date"
            value={selectedDate}
            onChange={(e) => setSelectedDate(e.target.value)}
            className="h-9 rounded-md border border-input bg-background px-3 py-1 text-sm"
            data-testid="input-date-filter"
          />
        </div>
        <Select value={selectedUserId} onValueChange={setSelectedUserId}>
          <SelectTrigger className="w-48" data-testid="select-user-filter">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Users</SelectItem>
            {allUsers
              .filter(u => u.role !== 'admin')
              .map(user => (
                <SelectItem key={user.id} value={user.id.toString()}>
                  {user.name}
                </SelectItem>
              ))}
          </SelectContent>
        </Select>
        <div className="ml-auto flex items-center gap-2">
          <Badge variant="outline" className="text-sm">
            {submittedWorksheets.length} Submitted
          </Badge>
        </div>
      </div>

      <ScrollArea className="flex-1">
        <div className="max-w-6xl mx-auto p-4 space-y-4">
          {isLoading ? (
            <div className="text-center py-12">
              <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
              <p className="text-sm text-muted-foreground">Loading worksheets...</p>
            </div>
          ) : submittedWorksheets.length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center">
                <p className="text-muted-foreground">
                  No submitted worksheets found for the selected date and user
                </p>
              </CardContent>
            </Card>
          ) : (
            submittedWorksheets.map((worksheet) => {
              const hourlyLogs = parseHourlyLogs(worksheet.hourlyLogs);

              return (
                <Card key={worksheet.id} data-testid={`worksheet-${worksheet.id}`}>
                  <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                      <div>
                        <CardTitle className="text-lg">{worksheet.userName}</CardTitle>
                        <p className="text-sm text-muted-foreground mt-1">
                          {format(new Date(worksheet.date), 'EEEE, MMMM d, yyyy')}
                        </p>
                      </div>
                      <div className="flex flex-col items-end gap-1">
                        <Badge className="bg-green-500/10 text-green-700 dark:text-green-400">
                          Submitted
                        </Badge>
                        {worksheet.submittedAt && (
                          <span className="text-xs text-muted-foreground">
                            {format(new Date(worksheet.submittedAt), 'h:mm a')}
                          </span>
                        )}
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">

                    <div>
                      <h3 className="font-semibold text-sm mb-2 flex items-center gap-2">
                        <Clock className="h-4 w-4" />
                        Hourly Activity Log
                      </h3>
                      <div className="space-y-2">
                        {hourlyLogs
                          .filter(log => log.activity && log.activity.trim())
                          .map((log) => (
                            <div
                              key={log.hour}
                              className="flex gap-3 p-2 rounded-md border bg-card/50"
                            >
                              <div className="w-16 text-sm font-medium text-muted-foreground flex-shrink-0">
                                {log.hour}
                              </div>
                              <p className="text-sm text-foreground flex-1">
                                {log.activity}
                              </p>
                            </div>
                          ))}
                        {hourlyLogs.every(log => !log.activity || !log.activity.trim()) && (
                          <p className="text-sm text-muted-foreground">No activities logged</p>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })
          )}
        </div>
      </ScrollArea>
    </div>
  );
}
