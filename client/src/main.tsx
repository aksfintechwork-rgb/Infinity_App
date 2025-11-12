import React from "react";
import { createRoot } from "react-dom/client";
import { StrictMode } from "react";
import App from "./App";
import "./index.css";

console.log('[DEBUG] main.tsx is executing...');
console.log('[DEBUG] React version:', React.version);
console.log('[DEBUG] Root element:', document.getElementById("root"));

try {
  console.log('[DEBUG] Creating React root...');
  const root = createRoot(document.getElementById("root")!);
  console.log('[DEBUG] React root created successfully');
  
  console.log('[DEBUG] Rendering App...');
  
  // DIAGNOSTIC: Render pure HTML with inline styles to bypass all CSS issues
  root.render(
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      width: '100vw',
      height: '100vh',
      backgroundColor: '#FF0000',
      color: '#FFFFFF',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      fontSize: '24px',
      fontFamily: 'Arial, sans-serif',
      zIndex: 999999
    }}>
      <h1 style={{ fontSize: '48px', fontWeight: 'bold', marginBottom: '20px' }}>
        DIAGNOSTIC TEST
      </h1>
      <p style={{ fontSize: '24px', marginBottom: '10px' }}>
        If you see this RED screen, React is working!
      </p>
      <p style={{ fontSize: '18px', color: '#FFFF00' }}>
        Time: {new Date().toLocaleTimeString()}
      </p>
      <button 
        onClick={() => alert('Button works!')}
        style={{
          marginTop: '30px',
          padding: '15px 30px',
          fontSize: '20px',
          backgroundColor: '#FFFFFF',
          color: '#000000',
          border: '3px solid #000000',
          borderRadius: '5px',
          cursor: 'pointer',
          fontWeight: 'bold'
        }}
      >
        CLICK ME TO TEST
      </button>
    </div>
  );
  console.log('[DEBUG] App rendered successfully');
  
  // Verify DOM is populated
  setTimeout(() => {
    const rootElement = document.getElementById('root');
    console.log('[DEBUG] DOM check after render - root innerHTML length:', rootElement?.innerHTML?.length || 0);
    console.log('[DEBUG] DOM check - root has children:', rootElement?.children?.length || 0);
    if (rootElement && rootElement.children.length > 0) {
      console.log('[DEBUG] First child:', rootElement.children[0].tagName, rootElement.children[0].className);
    }
  }, 100);
} catch (error) {
  console.error('[DEBUG] Fatal error during React initialization:', error);
}
