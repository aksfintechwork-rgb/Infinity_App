import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Eye, EyeOff, ArrowLeft } from 'lucide-react';
import { Link } from 'wouter';
import logoImage from '@assets/image_1763461605012.png';

interface RegisterPageProps {
  onRegister: (data: {
    name: string;
    loginId: string;
    email: string;
    password: string;
    designation: string;
    department: string;
    contactEmail: string;
  }) => void;
}

const DEPARTMENTS = [
  'Engineering',
  'Product',
  'Design',
  'Marketing',
  'Sales',
  'Human Resources',
  'Finance',
  'Operations',
  'Customer Support',
  'IT',
  'Research & Development',
  'Quality Assurance',
  'Other'
];

export default function RegisterPage({ onRegister }: RegisterPageProps) {
  const [formData, setFormData] = useState({
    name: '',
    loginId: '',
    email: '',
    password: '',
    confirmPassword: '',
    designation: '',
    department: '',
    contactEmail: ''
  });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    // Validate required fields
    if (!formData.name || !formData.loginId || !formData.password || !formData.designation || !formData.department) {
      setError('Please fill in all required fields');
      return;
    }

    // Validate password match
    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    // Validate password length
    if (formData.password.length < 6) {
      setError('Password must be at least 6 characters long');
      return;
    }

    // Validate loginId format
    const loginIdRegex = /^[a-zA-Z0-9_-]+$/;
    if (!loginIdRegex.test(formData.loginId)) {
      setError('Login ID can only contain letters, numbers, dashes, and underscores');
      return;
    }

    setIsLoading(true);

    try {
      // Mobile-safe normalization
      const nfkc = (s: string) => (s || '').normalize('NFKC');
      const sanitize = (s: string) => nfkc(s).replace(/[\u0000-\u001F\u007F\u200B\u00A0]/g, '').trim();

      // Submit registration data
      await onRegister({
        name: sanitize(formData.name),
        loginId: sanitize(formData.loginId.toLowerCase()),
        email: formData.email || '',
        password: nfkc(formData.password),
        designation: formData.designation,
        department: formData.department,
        contactEmail: formData.contactEmail || formData.email || ''
      });
      
      // Success - component will be unmounted as user is now logged in
      // No need to clear loading state as component unmounts
    } catch (error: any) {
      setError(error.response?.data?.error || 'Registration failed. Please try again.');
    } finally {
      // Always clear loading state (handles both success and failure)
      setIsLoading(false);
    }
  };

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    setError('');
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background via-accent/5 to-background p-4">
      <div className="w-full max-w-5xl">
        {/* Back to Login Link */}
        <div className="mb-6">
          <Link href="/login">
            <Button variant="ghost" className="gap-2" data-testid="button-back-to-login">
              <ArrowLeft className="w-4 h-4" />
              Back to Login
            </Button>
          </Link>
        </div>

        <div className="grid lg:grid-cols-2 gap-8 items-start">
          {/* Left Side - Branding */}
          <div className="hidden lg:flex flex-col space-y-6 sticky top-8">
            {/* Logo Section */}
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

            {/* Welcome Message */}
            <div className="space-y-4">
              <h2 className="text-3xl font-bold text-foreground">
                Join Infinity Technology
              </h2>
              <p className="text-muted-foreground text-lg">
                Register your employee account to get started with our internal collaboration platform
              </p>
              
              <div className="glass rounded-lg p-4 border border-border/30">
                <h3 className="font-semibold text-foreground mb-2">Platform Features</h3>
                <ul className="text-sm text-muted-foreground space-y-2">
                  <li>Real-time messaging and collaboration</li>
                  <li>Meeting scheduling with AI summaries</li>
                  <li>Task and project management</li>
                  <li>Video conferencing integration</li>
                  <li>Cloud file storage and sharing</li>
                </ul>
              </div>
            </div>
          </div>

          {/* Right Side - Registration Form */}
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

            {/* Registration Card */}
            <Card className="border-border/50 shadow-xl">
              <CardHeader className="space-y-1 pb-4">
                <CardTitle className="text-2xl font-bold text-center">
                  Employee Registration
                </CardTitle>
                <CardDescription className="text-center">
                  Create your account to access the platform
                </CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleSubmit} className="space-y-4">
                  {/* Error Message */}
                  {error && (
                    <div className="p-3 rounded-lg bg-destructive/10 border border-destructive/20 text-destructive text-sm" data-testid="text-error">
                      {error}
                    </div>
                  )}

                  {/* Full Name */}
                  <div className="space-y-2">
                    <Label htmlFor="name" className="text-foreground font-medium">
                      Full Name <span className="text-destructive">*</span>
                    </Label>
                    <Input
                      id="name"
                      type="text"
                      value={formData.name}
                      onChange={(e) => handleInputChange('name', e.target.value)}
                      required
                      placeholder="Enter your full name"
                      className="h-11"
                      data-testid="input-name"
                    />
                  </div>

                  {/* Login ID */}
                  <div className="space-y-2">
                    <Label htmlFor="loginId" className="text-foreground font-medium">
                      Login ID <span className="text-destructive">*</span>
                    </Label>
                    <Input
                      id="loginId"
                      type="text"
                      value={formData.loginId}
                      onChange={(e) => handleInputChange('loginId', e.target.value)}
                      required
                      placeholder="e.g., john.doe or johnd"
                      className="h-11"
                      data-testid="input-loginid"
                    />
                    <p className="text-xs text-muted-foreground">
                      Use only letters, numbers, dashes, and underscores (3-32 characters)
                    </p>
                  </div>

                  {/* Designation */}
                  <div className="space-y-2">
                    <Label htmlFor="designation" className="text-foreground font-medium">
                      Designation <span className="text-destructive">*</span>
                    </Label>
                    <Input
                      id="designation"
                      type="text"
                      value={formData.designation}
                      onChange={(e) => handleInputChange('designation', e.target.value)}
                      required
                      placeholder="e.g., Software Engineer, Product Manager"
                      className="h-11"
                      data-testid="input-designation"
                    />
                  </div>

                  {/* Department */}
                  <div className="space-y-2">
                    <Label htmlFor="department" className="text-foreground font-medium">
                      Department <span className="text-destructive">*</span>
                    </Label>
                    <Select 
                      value={formData.department} 
                      onValueChange={(value) => handleInputChange('department', value)}
                      required
                    >
                      <SelectTrigger className="h-11" data-testid="select-department">
                        <SelectValue placeholder="Select your department" />
                      </SelectTrigger>
                      <SelectContent>
                        {DEPARTMENTS.map((dept) => (
                          <SelectItem key={dept} value={dept}>
                            {dept}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Email (Optional) */}
                  <div className="space-y-2">
                    <Label htmlFor="email" className="text-foreground font-medium">
                      Company Email
                    </Label>
                    <Input
                      id="email"
                      type="email"
                      value={formData.email}
                      onChange={(e) => handleInputChange('email', e.target.value)}
                      placeholder="your.name@infinitytechnology.com"
                      className="h-11"
                      data-testid="input-email"
                    />
                  </div>

                  {/* Contact Email (Optional) */}
                  <div className="space-y-2">
                    <Label htmlFor="contactEmail" className="text-foreground font-medium">
                      Personal Contact Email
                    </Label>
                    <Input
                      id="contactEmail"
                      type="email"
                      value={formData.contactEmail}
                      onChange={(e) => handleInputChange('contactEmail', e.target.value)}
                      placeholder="your.personal@email.com"
                      className="h-11"
                      data-testid="input-contact-email"
                    />
                  </div>

                  {/* Password */}
                  <div className="space-y-2">
                    <Label htmlFor="password" className="text-foreground font-medium">
                      Password <span className="text-destructive">*</span>
                    </Label>
                    <div className="relative">
                      <Input
                        id="password"
                        type={showPassword ? "text" : "password"}
                        value={formData.password}
                        onChange={(e) => handleInputChange('password', e.target.value)}
                        required
                        placeholder="Create a password (min. 6 characters)"
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

                  {/* Confirm Password */}
                  <div className="space-y-2">
                    <Label htmlFor="confirmPassword" className="text-foreground font-medium">
                      Confirm Password <span className="text-destructive">*</span>
                    </Label>
                    <div className="relative">
                      <Input
                        id="confirmPassword"
                        type={showConfirmPassword ? "text" : "password"}
                        value={formData.confirmPassword}
                        onChange={(e) => handleInputChange('confirmPassword', e.target.value)}
                        required
                        placeholder="Re-enter your password"
                        className="h-11 pr-10"
                        data-testid="input-confirm-password"
                      />
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="absolute right-0 top-0 h-11 w-11 hover:bg-transparent"
                        onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                        data-testid="button-toggle-confirm-password"
                      >
                        {showConfirmPassword ? (
                          <EyeOff className="h-4 w-4 text-muted-foreground" />
                        ) : (
                          <Eye className="h-4 w-4 text-muted-foreground" />
                        )}
                      </Button>
                    </div>
                  </div>

                  {/* Submit Button */}
                  <Button 
                    type="submit" 
                    className="w-full h-11 text-base font-semibold"
                    disabled={isLoading}
                    data-testid="button-register"
                  >
                    {isLoading ? (
                      <>
                        <div className="w-4 h-4 border-2 border-primary-foreground border-t-transparent rounded-full animate-spin mr-2"></div>
                        Registering...
                      </>
                    ) : (
                      'Register Account'
                    )}
                  </Button>

                  {/* Login Link */}
                  <p className="text-center text-sm text-muted-foreground">
                    Already have an account?{' '}
                    <Link href="/login">
                      <span className="text-primary hover:underline cursor-pointer font-medium" data-testid="link-login">
                        Sign in here
                      </span>
                    </Link>
                  </p>
                </form>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
