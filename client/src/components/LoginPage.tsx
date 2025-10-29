import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Eye, EyeOff } from 'lucide-react';
import logoImage from '@assets/image_1761743625103.png';

interface LoginPageProps {
  onLogin: (loginId: string, password: string) => void;
}

export default function LoginPage({ onLogin }: LoginPageProps) {
  const [loginId, setLoginId] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Mobile-safe normalization: Remove hidden chars and normalize Unicode
    const nfkc = (s: string) => (s || '').normalize('NFKC');
    const sanitize = (s: string) => nfkc(s).replace(/[\u0000-\u001F\u007F\u200B\u00A0]/g, '').trim();
    
    const cleanLoginId = sanitize(loginId);
    const cleanPassword = nfkc(password);
    
    // Diagnostic logging to verify submission
    console.log('🔐 [LOGIN v2.0] Submitting login:', {
      original: { loginId, passwordLength: password.length },
      cleaned: { loginId: cleanLoginId, passwordLength: cleanPassword.length },
      hiddenCharsRemoved: loginId !== cleanLoginId || password !== cleanPassword,
      timestamp: new Date().toISOString()
    });
    
    onLogin(cleanLoginId, cleanPassword);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <div className="w-full max-w-md">
        <div className="flex flex-col items-center justify-center mb-8">
          <img src={logoImage} alt="SUPREMO TRADERS" className="w-48 h-auto mb-4" />
          <h1 className="text-xl font-semibold text-center text-foreground">Team Communication Platform</h1>
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
                  autoCapitalize="none"
                  autoCorrect="off"
                  spellCheck="false"
                />
                <p className="text-xs text-muted-foreground">
                  Use the login ID provided by your administrator
                </p>
              </div>
              <div className="space-y-2">
                <Label htmlFor="login-password">Password</Label>
                <div className="relative">
                  <Input
                    id="login-password"
                    type={showPassword ? "text" : "password"}
                    placeholder="Enter your password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    data-testid="input-login-password"
                    autoComplete="current-password"
                    autoCapitalize="none"
                    autoCorrect="off"
                    className="pr-10"
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="absolute right-0 top-0 h-full hover:bg-transparent"
                    onClick={() => setShowPassword(!showPassword)}
                    data-testid="button-toggle-password"
                  >
                    {showPassword ? (
                      <EyeOff className="h-4 w-4 text-muted-foreground" />
                    ) : (
                      <Eye className="h-4 w-4 text-muted-foreground" />
                    )}
                  </Button>
                </div>
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
