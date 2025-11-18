import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Eye, EyeOff, MapPin, Clock, Phone } from 'lucide-react';
import logoImage from '@assets/image_1763461605012.png';

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
    
    onLogin(cleanLoginId, cleanPassword);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background via-accent/5 to-background p-4">
      <div className="w-full max-w-6xl grid lg:grid-cols-2 gap-8 items-center">
        {/* Left Side - Company Info */}
        <div className="hidden lg:flex flex-col space-y-8 p-8">
          {/* Logo Section with Background Effect */}
          <div className="relative">
            <div className="absolute -inset-4 bg-gradient-to-r from-primary/20 to-accent/20 rounded-2xl blur-xl"></div>
            <div className="relative glass-strong rounded-2xl p-8 border border-border/50">
              <img 
                src={logoImage} 
                alt="Infinity Technology Logo" 
                className="w-full h-auto object-contain"
              />
            </div>
          </div>

          {/* Company Details */}
          <div className="space-y-6">
            <h2 className="text-3xl font-bold text-foreground">
              Welcome to Infinity Technology
            </h2>
            <p className="text-muted-foreground text-lg">
              Your trusted partner in innovative technology solutions
            </p>

            {/* Contact Details Cards */}
            <div className="space-y-4">
              {/* Address */}
              <div className="glass rounded-lg p-4 border border-border/30 hover-elevate transition-all">
                <div className="flex items-start gap-3">
                  <div className="mt-1 p-2 rounded-lg bg-primary/10">
                    <MapPin className="w-5 h-5 text-primary" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-foreground mb-1">Address</h3>
                    <p className="text-sm text-muted-foreground">
                      J-446, Off Anukul Circle<br />
                      MIDC Bhosari, Pune - 411026
                    </p>
                  </div>
                </div>
              </div>

              {/* Work Hours */}
              <div className="glass rounded-lg p-4 border border-border/30 hover-elevate transition-all">
                <div className="flex items-start gap-3">
                  <div className="mt-1 p-2 rounded-lg bg-primary/10">
                    <Clock className="w-5 h-5 text-primary" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-foreground mb-1">Work Hours</h3>
                    <p className="text-sm text-muted-foreground">
                      Monday - Saturday<br />
                      9:00 AM to 7:00 PM
                    </p>
                  </div>
                </div>
              </div>

              {/* Phone Numbers */}
              <div className="glass rounded-lg p-4 border border-border/30 hover-elevate transition-all">
                <div className="flex items-start gap-3">
                  <div className="mt-1 p-2 rounded-lg bg-primary/10">
                    <Phone className="w-5 h-5 text-primary" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-foreground mb-1">Contact</h3>
                    <div className="text-sm text-muted-foreground space-y-1">
                      <p>8600100720</p>
                      <p>8600100721</p>
                      <p>8600100725</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Right Side - Login Form */}
        <div className="flex flex-col space-y-6">
          {/* Mobile Logo */}
          <div className="lg:hidden relative mb-4">
            <div className="absolute -inset-2 bg-gradient-to-r from-primary/20 to-accent/20 rounded-xl blur-lg"></div>
            <div className="relative glass-strong rounded-xl p-6 border border-border/50">
              <img 
                src={logoImage} 
                alt="Infinity Technology Logo" 
                className="w-full h-auto object-contain"
              />
            </div>
          </div>

          {/* Login Card */}
          <Card className="border-border/50 shadow-xl">
            <CardHeader className="space-y-1 pb-4">
              <CardTitle className="text-2xl font-bold text-center">
                Sign In
              </CardTitle>
              <CardDescription className="text-center">
                Enter your credentials to access the platform
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="loginId" className="text-foreground font-medium">
                    Login ID
                  </Label>
                  <Input
                    id="loginId"
                    type="text"
                    value={loginId}
                    onChange={(e) => setLoginId(e.target.value)}
                    required
                    placeholder="Enter your login ID"
                    className="h-11"
                    data-testid="input-loginid"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="password" className="text-foreground font-medium">
                    Password
                  </Label>
                  <div className="relative">
                    <Input
                      id="password"
                      type={showPassword ? "text" : "password"}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required
                      placeholder="Enter your password"
                      className="h-11 pr-10"
                      data-testid="input-password"
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="absolute right-0 top-0 h-11 w-11 hover:bg-transparent"
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

                <Button 
                  type="submit" 
                  className="w-full h-11 text-base font-semibold"
                  data-testid="button-login"
                >
                  Sign In
                </Button>

                {/* Info Alert */}
                <div className="mt-4 p-4 rounded-lg bg-accent/20 border border-accent/30">
                  <p className="text-sm text-foreground/80 text-center">
                    First time here? Contact your administrator for credentials.
                  </p>
                </div>
              </form>
            </CardContent>
          </Card>

          {/* Mobile Contact Info */}
          <div className="lg:hidden space-y-3">
            <div className="glass rounded-lg p-3 border border-border/30">
              <div className="flex items-center gap-2 text-sm">
                <MapPin className="w-4 h-4 text-primary flex-shrink-0" />
                <p className="text-muted-foreground">J-446, Off Anukul Circle, MIDC Bhosari, Pune - 411026</p>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="glass rounded-lg p-3 border border-border/30">
                <div className="flex items-center gap-2 text-sm">
                  <Clock className="w-4 h-4 text-primary flex-shrink-0" />
                  <p className="text-muted-foreground">Mon-Sat 9AM-7PM</p>
                </div>
              </div>
              <div className="glass rounded-lg p-3 border border-border/30">
                <div className="flex items-center gap-2 text-sm">
                  <Phone className="w-4 h-4 text-primary flex-shrink-0" />
                  <p className="text-muted-foreground">8600100720</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
