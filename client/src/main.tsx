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
  root.render(
    <StrictMode>
      <App />
    </StrictMode>
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
