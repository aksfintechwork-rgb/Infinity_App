import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Eye, EyeOff, Info } from 'lucide-react';
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
    <div className="min-h-screen flex items-center justify-center bg-background p-4 md:p-6" style={{ backgroundColor: '#F5F0E8', minHeight: '100vh' }}>
      <div className="w-full max-w-md" style={{ maxWidth: '28rem' }}>
        <div className="flex flex-col items-center justify-center mb-6 md:mb-8">
          <img src={logoImage} alt="SUPREMO TRADERS" className="w-40 md:w-48 h-auto mb-3 md:mb-4" style={{ width: '12rem', height: 'auto' }} />
          <h1 className="text-lg md:text-xl font-semibold text-center text-foreground" style={{ color: '#333', fontSize: '1.25rem', fontWeight: 600 }}>Team Communication Platform</h1>
        </div>

        <Card className="border-2" style={{ backgroundColor: 'white', padding: '1.5rem', borderRadius: '0.5rem', border: '2px solid #ddd' }}>
          <CardHeader className="space-y-1 pb-4">
            <CardTitle className="text-xl md:text-2xl" style={{ color: '#333', fontSize: '1.5rem', fontWeight: 600 }}>Welcome Back</CardTitle>
            <CardDescription className="text-sm md:text-base" style={{ color: '#666', fontSize: '0.875rem' }}>Sign in to the SUPREMO TRADERS team platform</CardDescription>
          </CardHeader>
          <CardContent>
            <Alert className="mb-4 bg-accent/50 border-accent">
              <Info className="h-4 w-4 text-primary" />
              <AlertDescription className="text-sm">
                <strong>First time logging in?</strong> Contact your administrator for your login credentials.
              </AlertDescription>
            </Alert>
            <form onSubmit={handleSubmit} className="space-y-5">
              <div className="space-y-2">
                <Label htmlFor="login-id" className="text-base">Login ID</Label>
                <Input
                  id="login-id"
                  type="text"
                  placeholder="Enter your login ID"
                  value={loginId}
                  onChange={(e) => setLoginId(e.target.value)}
                  required
                  data-testid="input-login-id"
                  autoComplete="username"
                  autoCapitalize="none"
                  autoCorrect="off"
                  spellCheck="false"
                  className="h-12 text-base"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="login-password" className="text-base">Password</Label>
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
                    className="pr-12 h-12 text-base"
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="absolute right-0 top-0 h-12 w-12 hover:bg-transparent"
                    onClick={() => setShowPassword(!showPassword)}
                    data-testid="button-toggle-password"
                  >
                    {showPassword ? (
                      <EyeOff className="h-5 w-5 text-muted-foreground" />
                    ) : (
                      <Eye className="h-5 w-5 text-muted-foreground" />
                    )}
                  </Button>
                </div>
              </div>
              <Button type="submit" className="w-full h-12 text-base font-semibold mt-6" data-testid="button-login" style={{ width: '100%', height: '3rem', backgroundColor: '#C54E1F', color: 'white', fontSize: '1rem', fontWeight: 600, borderRadius: '0.5rem', border: 'none', cursor: 'pointer' }}>
                Sign In
              </Button>
            </form>
          </CardContent>
        </Card>
        
        <div className="text-center text-sm text-muted-foreground mt-4 md:mt-6 space-y-2">
          <p>Don't have login credentials yet?</p>
          <p className="text-xs">Contact your system administrator to get started</p>
        </div>
      </div>
    </div>
  );
}
