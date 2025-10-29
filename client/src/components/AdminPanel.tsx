import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import * as api from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { useToast } from '@/hooks/use-toast';
import { Users, UserPlus, Shield, User, KeyRound, CheckCircle, XCircle, Trash2 } from 'lucide-react';

interface AdminPanelProps {
  token: string;
  currentUserId: number;
}

export default function AdminPanel({ token, currentUserId }: AdminPanelProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [newUser, setNewUser] = useState({
    name: '',
    loginId: '',
    email: '',
    password: '',
    role: 'user' as 'admin' | 'user',
  });

  const [credentialTest, setCredentialTest] = useState({
    loginId: '',
    password: '',
  });
  const [testResult, setTestResult] = useState<{ success: boolean; message: string; user?: any } | null>(null);

  const { data: users = [], isLoading } = useQuery({
    queryKey: ['admin-users'],
    queryFn: () => api.getAdminUsers(token),
  });

  const createUserMutation = useMutation({
    mutationFn: (data: typeof newUser) => api.createUserAsAdmin(token, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-users'] });
      queryClient.invalidateQueries({ queryKey: ['/api/users'] });
      setNewUser({ name: '', loginId: '', email: '', password: '', role: 'user' });
      toast({
        title: 'Success',
        description: 'User created successfully',
      });
    },
    onError: (error: Error) => {
      toast({
        title: 'Error',
        description: error.message || 'Failed to create user',
        variant: 'destructive',
      });
    },
  });

  const deleteUserMutation = useMutation({
    mutationFn: (userId: number) => api.deleteUser(token, userId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-users'] });
      queryClient.invalidateQueries({ queryKey: ['/api/users'] });
      toast({
        title: 'Success',
        description: 'User deleted successfully',
      });
    },
    onError: (error: Error) => {
      toast({
        title: 'Error',
        description: error.message || 'Failed to delete user',
        variant: 'destructive',
      });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newUser.name || !newUser.loginId || !newUser.password) {
      toast({
        title: 'Error',
        description: 'Please fill in all required fields',
        variant: 'destructive',
      });
      return;
    }
    createUserMutation.mutate(newUser);
  };

  const handleTestCredentials = async (e: React.FormEvent) => {
    e.preventDefault();
    setTestResult(null);

    if (!credentialTest.loginId || !credentialTest.password) {
      toast({
        title: 'Error',
        description: 'Please enter both login ID and password',
        variant: 'destructive',
      });
      return;
    }

    try {
      const response = await api.login(credentialTest.loginId, credentialTest.password);
      setTestResult({
        success: true,
        message: `✅ Credentials are VALID! User: ${response.user.name}`,
        user: response.user,
      });
      toast({
        title: 'Credentials Valid',
        description: `${response.user.name} can login successfully`,
      });
    } catch (error: any) {
      setTestResult({
        success: false,
        message: `❌ Login Failed: ${error.message}`,
      });
      toast({
        title: 'Credentials Invalid',
        description: error.message || 'These credentials do not work',
        variant: 'destructive',
      });
    }
  };

  return (
    <div className="h-full overflow-y-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight" data-testid="text-admin-title">Team Management</h1>
          <p className="text-muted-foreground mt-1">Create and manage team member accounts</p>
        </div>
        <Users className="w-8 h-8 text-muted-foreground" />
      </div>

      <Card data-testid="card-create-user">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <UserPlus className="w-5 h-5" />
            Create New User
          </CardTitle>
          <CardDescription>Add a new team member to the platform</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="name">Full Name *</Label>
                <Input
                  id="name"
                  data-testid="input-admin-name"
                  placeholder="John Doe"
                  value={newUser.name}
                  onChange={(e) => setNewUser({ ...newUser, name: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="loginId">Login ID *</Label>
                <Input
                  id="loginId"
                  data-testid="input-admin-loginid"
                  placeholder="john123 or employee001"
                  value={newUser.loginId}
                  onChange={(e) => setNewUser({ ...newUser, loginId: e.target.value })}
                />
                <p className="text-xs text-muted-foreground">
                  Simple username for login (letters, numbers, dashes, underscores only)
                </p>
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="email">Email Address (Optional)</Label>
                <Input
                  id="email"
                  data-testid="input-admin-email"
                  type="email"
                  placeholder="john@supremotraders.com"
                  value={newUser.email}
                  onChange={(e) => setNewUser({ ...newUser, email: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="password">Password *</Label>
                <Input
                  id="password"
                  data-testid="input-admin-password"
                  type="password"
                  placeholder="Enter password"
                  value={newUser.password}
                  onChange={(e) => setNewUser({ ...newUser, password: e.target.value })}
                />
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="role">Role</Label>
                <Select
                  value={newUser.role}
                  onValueChange={(value: 'admin' | 'user') => setNewUser({ ...newUser, role: value })}
                >
                  <SelectTrigger data-testid="select-admin-role">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="user" data-testid="option-role-user">User</SelectItem>
                    <SelectItem value="admin" data-testid="option-role-admin">Admin</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <Button
              type="submit"
              data-testid="button-create-user"
              disabled={createUserMutation.isPending}
            >
              {createUserMutation.isPending ? 'Creating...' : 'Create User'}
            </Button>
          </form>
        </CardContent>
      </Card>

      <Card data-testid="card-credential-tester">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <KeyRound className="w-5 h-5" />
            Credential Tester
          </CardTitle>
          <CardDescription>
            Test user credentials to help troubleshoot login issues. This shows the current valid passwords.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="p-4 bg-muted/50 rounded-md border">
            <h3 className="font-medium mb-2 flex items-center gap-2">
              <Shield className="w-4 h-4" />
              Current Standard Passwords
            </h3>
            <div className="text-sm space-y-1 text-muted-foreground">
              <div><span className="font-mono">admin</span> → <span className="font-mono font-semibold">admin123</span></div>
              <div><span className="font-mono">user</span> → <span className="font-mono font-semibold">user123</span></div>
              <div><span className="font-mono">shubham</span> → <span className="font-mono font-semibold">shubham123</span></div>
              <div><span className="font-mono">ravi</span> → <span className="font-mono font-semibold">ravi123</span></div>
            </div>
          </div>

          <form onSubmit={handleTestCredentials} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="test-loginid">Login ID to Test</Label>
                <Input
                  id="test-loginid"
                  data-testid="input-test-loginid"
                  placeholder="shubham or ravi"
                  value={credentialTest.loginId}
                  onChange={(e) => setCredentialTest({ ...credentialTest, loginId: e.target.value })}
                  autoComplete="off"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="test-password">Password to Test</Label>
                <Input
                  id="test-password"
                  data-testid="input-test-password"
                  type="text"
                  placeholder="shubham123"
                  value={credentialTest.password}
                  onChange={(e) => setCredentialTest({ ...credentialTest, password: e.target.value })}
                  autoComplete="off"
                />
              </div>
            </div>

            {testResult && (
              <div
                className={`p-4 rounded-md border flex items-start gap-3 ${
                  testResult.success
                    ? 'bg-green-500/10 border-green-500/50 text-green-700 dark:text-green-400'
                    : 'bg-red-500/10 border-red-500/50 text-red-700 dark:text-red-400'
                }`}
                data-testid={testResult.success ? 'alert-test-success' : 'alert-test-failure'}
              >
                {testResult.success ? (
                  <CheckCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
                ) : (
                  <XCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
                )}
                <div className="flex-1">
                  <div className="font-medium">{testResult.message}</div>
                  {testResult.user && (
                    <div className="text-sm mt-1 opacity-80">
                      Role: {testResult.user.role} | Email: {testResult.user.email || 'Not provided'}
                    </div>
                  )}
                </div>
              </div>
            )}

            <Button
              type="submit"
              data-testid="button-test-credentials"
              variant="outline"
              className="w-full md:w-auto"
            >
              Test These Credentials
            </Button>
          </form>

          <div className="pt-4 border-t">
            <h4 className="text-sm font-medium mb-2">How to help users with login issues:</h4>
            <ol className="text-sm text-muted-foreground space-y-1 list-decimal list-inside">
              <li>Ask them to clear their browser password autofill</li>
              <li>Have them manually type the password (no copy-paste from old messages)</li>
              <li>Verify no extra spaces before or after the password</li>
              <li>Try in incognito/private mode to rule out browser cache</li>
              <li>Use this tester to confirm the correct credentials work</li>
            </ol>
          </div>
        </CardContent>
      </Card>

      <Card data-testid="card-users-list">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="w-5 h-5" />
            All Team Members ({users.length})
          </CardTitle>
          <CardDescription>Manage existing team member accounts</CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="text-center py-8 text-muted-foreground">Loading users...</div>
          ) : users.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">No users found</div>
          ) : (
            <div className="space-y-2">
              {users.map((user: any) => (
                <div
                  key={user.id}
                  data-testid={`user-row-${user.id}`}
                  className="flex items-center justify-between p-4 rounded-md border bg-card hover-elevate"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                      {user.role === 'admin' ? (
                        <Shield className="w-5 h-5 text-primary" />
                      ) : (
                        <User className="w-5 h-5 text-muted-foreground" />
                      )}
                    </div>
                    <div>
                      <div className="font-medium flex items-center gap-2" data-testid={`text-user-name-${user.id}`}>
                        {user.name}
                        {user.id === currentUserId && (
                          <span className="text-xs text-muted-foreground">(You)</span>
                        )}
                      </div>
                      <div className="text-sm text-muted-foreground" data-testid={`text-user-loginid-${user.id}`}>
                        Login ID: {user.loginId}
                      </div>
                      {user.email && (
                        <div className="text-xs text-muted-foreground" data-testid={`text-user-email-${user.id}`}>
                          {user.email}
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span
                      className={`px-2 py-1 text-xs rounded-md ${
                        user.role === 'admin'
                          ? 'bg-primary/10 text-primary'
                          : 'bg-muted text-muted-foreground'
                      }`}
                      data-testid={`badge-user-role-${user.id}`}
                    >
                      {user.role === 'admin' ? 'Admin' : 'User'}
                    </span>
                    {user.id !== currentUserId && (
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-destructive hover:text-destructive hover:bg-destructive/10"
                            data-testid={`button-delete-user-${user.id}`}
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>Delete User</AlertDialogTitle>
                            <AlertDialogDescription>
                              Are you sure you want to delete <strong>{user.name}</strong> ({user.loginId})? 
                              This action cannot be undone and will remove all their conversations and messages.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel data-testid={`button-cancel-delete-${user.id}`}>Cancel</AlertDialogCancel>
                            <AlertDialogAction
                              onClick={() => deleteUserMutation.mutate(user.id)}
                              className="bg-destructive hover:bg-destructive/90"
                              data-testid={`button-confirm-delete-${user.id}`}
                            >
                              Delete
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
