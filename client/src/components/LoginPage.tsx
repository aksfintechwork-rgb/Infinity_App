import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import logoImage from '@assets/generated_images/SUPREMO_TRADERS_LLP_logo_12753d7f.png';

interface LoginPageProps {
  onLogin: (loginId: string, password: string) => void;
}

export default function LoginPage({ onLogin }: LoginPageProps) {
  const [loginId, setLoginId] = useState('');
  const [password, setPassword] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onLogin(loginId, password);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <div className="w-full max-w-md">
        <div className="flex items-center justify-center gap-3 mb-8">
          <img src={logoImage} alt="SUPREMO TRADERS LLP" className="w-12 h-12" />
          <div>
            <h1 className="text-2xl font-bold text-foreground">SUPREMO TRADERS LLP</h1>
            <p className="text-sm text-muted-foreground">Team Communication</p>
          </div>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Welcome Back</CardTitle>
            <CardDescription>Sign in with your credentials provided by your administrator</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="login-id">Login ID</Label>
                <Input
                  id="login-id"
                  type="text"
                  placeholder="admin or user123"
                  value={loginId}
                  onChange={(e) => setLoginId(e.target.value)}
                  required
                  data-testid="input-login-id"
                  autoComplete="username"
                />
                <p className="text-xs text-muted-foreground">
                  Use the login ID provided by your administrator
                </p>
              </div>
              <div className="space-y-2">
                <Label htmlFor="login-password">Password</Label>
                <Input
                  id="login-password"
                  type="password"
                  placeholder="Enter your password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  data-testid="input-login-password"
                  autoComplete="current-password"
                />
              </div>
              <Button type="submit" className="w-full" data-testid="button-login">
                Sign In
              </Button>
            </form>
          </CardContent>
        </Card>
        
        <p className="text-center text-sm text-muted-foreground mt-4">
          Need an account? Contact your administrator.
        </p>
      </div>
    </div>
  );
}
