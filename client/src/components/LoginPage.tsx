import { useState, useEffect, useRef } from 'react';
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
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Debug: Log computed styles and dimensions
    const timer = setTimeout(() => {
      const container = containerRef.current;
      if (container) {
        const rect = container.getBoundingClientRect();
        const computed = window.getComputedStyle(container);
        console.log('🔍 [LOGIN CONTAINER DEBUG]', {
          dimensions: {
            width: rect.width,
            height: rect.height,
            top: rect.top,
            left: rect.left
          },
          computedStyles: {
            display: computed.display,
            visibility: computed.visibility,
            opacity: computed.opacity,
            transform: computed.transform,
            position: computed.position,
            zIndex: computed.zIndex,
            pointerEvents: computed.pointerEvents,
            backgroundColor: computed.backgroundColor,
            color: computed.color
          },
          classNames: container.className
        });
      }
    }, 500);
    return () => clearTimeout(timer);
  }, []);

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
    <div ref={containerRef} style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: '#F5F0E8', padding: '24px' }}>
      <div style={{ width: '100%', maxWidth: '448px', backgroundColor: 'white', padding: '32px', borderRadius: '8px', border: '2px solid #C54E1F' }}>
        <h1 style={{ fontSize: '32px', fontWeight: 'bold', color: '#C54E1F', marginBottom: '8px', textAlign: 'center' }}>
          SUPREMO TRADERS
        </h1>
        <p style={{ fontSize: '16px', color: '#666', marginBottom: '32px', textAlign: 'center' }}>
          Team Communication Platform
        </p>

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div>
            <label style={{ display: 'block', fontSize: '14px', fontWeight: '600', color: '#333', marginBottom: '8px' }}>
              Login ID
            </label>
            <input
              type="text"
              value={loginId}
              onChange={(e) => setLoginId(e.target.value)}
              required
              style={{ width: '100%', padding: '12px', fontSize: '16px', border: '2px solid #ddd', borderRadius: '4px' }}
              data-testid="input-loginid"
            />
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '14px', fontWeight: '600', color: '#333', marginBottom: '8px' }}>
              Password
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              style={{ width: '100%', padding: '12px', fontSize: '16px', border: '2px solid #ddd', borderRadius: '4px' }}
              data-testid="input-password"
            />
          </div>

          <button
            type="submit"
            style={{ width: '100%', padding: '16px', fontSize: '18px', fontWeight: 'bold', color: 'white', backgroundColor: '#C54E1F', border: 'none', borderRadius: '4px', cursor: 'pointer', marginTop: '16px' }}
            data-testid="button-login"
          >
            Sign In
          </button>
        </form>

        <p style={{ marginTop: '24px', fontSize: '14px', color: '#666', textAlign: 'center', padding: '12px', backgroundColor: '#FFF3E0', borderRadius: '4px', border: '1px solid #FFE0B2' }}>
          First time here? Contact your administrator for credentials.
        </p>
      </div>
    </div>
  );
}
