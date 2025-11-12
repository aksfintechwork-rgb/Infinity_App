import React from "react";
import { createRoot } from "react-dom/client";
import App from "./App";
import "./index.css";

console.log('[DEBUG] main.tsx is executing...');
console.log('[DEBUG] React version:', React.version);
console.log('[DEBUG] Root element:', document.getElementById("root"));

// Error boundary component
class ErrorBoundary extends React.Component<{children: React.ReactNode}, {hasError: boolean; error: any}> {
  constructor(props: any) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: any) {
    return { hasError: true, error };
  }

  componentDidCatch(error: any, errorInfo: any) {
    console.error('[ErrorBoundary] Caught error:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div style={{
          padding: '50px',
          textAlign: 'center',
          fontFamily: 'Arial',
          backgroundColor: '#fff',
          color: '#000',
          minHeight: '100vh'
        }}>
          <h1 style={{color: '#C54E1F', fontSize: '32px', marginBottom: '20px'}}>
            Application Error
          </h1>
          <pre style={{
            textAlign: 'left',
            padding: '20px',
            backgroundColor: '#f5f5f5',
            border: '1px solid #ddd',
            borderRadius: '4px',
            overflow: 'auto',
            maxWidth: '800px',
            margin: '0 auto'
          }}>
            {String(this.state.error)}
          </pre>
        </div>
      );
    }

    return this.props.children;
  }
}

try {
  console.log('[DEBUG] Creating React root...');
  const rootElement = document.getElementById("root");
  
  if (!rootElement) {
    throw new Error('Root element not found!');
  }
  
  const root = createRoot(rootElement);
  console.log('[DEBUG] React root created successfully');
  
  console.log('[DEBUG] Rendering App WITHOUT StrictMode...');
  root.render(
    <ErrorBoundary>
      <App />
    </ErrorBoundary>
  );
  console.log('[DEBUG] App rendered successfully');
  
  // Verify DOM is populated
  setTimeout(() => {
    const rootEl = document.getElementById('root');
    console.log('[DEBUG] DOM check after render - root innerHTML length:', rootEl?.innerHTML?.length || 0);
    console.log('[DEBUG] DOM check - root has children:', rootEl?.children?.length || 0);
    if (rootEl && rootEl.children.length > 0) {
      console.log('[DEBUG] First child:', rootEl.children[0].tagName, rootEl.children[0].className);
    } else {
      console.error('[DEBUG] ⚠️ ROOT IS STILL EMPTY AFTER RENDER!');
      // Force render a test div
      if (rootEl) {
        console.log('[DEBUG] Force injecting test content...');
        rootEl.innerHTML = '<div style="padding:50px;background:white;color:black;font-size:24px;text-align:center;">EMERGENCY: React failed to render. This is a fallback message.</div>';
      }
    }
  }, 500);
} catch (error) {
  console.error('[DEBUG] Fatal error during React initialization:', error);
  const rootEl = document.getElementById('root');
  if (rootEl) {
    rootEl.innerHTML = `
      <div style="padding:50px;background:white;color:black;font-size:18px;text-align:center;">
        <h1 style="color:#C54E1F;font-size:32px;margin-bottom:20px;">Critical Error</h1>
        <p>React failed to initialize:</p>
        <pre style="text-align:left;padding:20px;background:#f5f5f5;border:1px solid #ddd;margin:20px auto;max-width:600px;">${String(error)}</pre>
      </div>
    `;
  }
}
