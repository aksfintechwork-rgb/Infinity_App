/**
 * Opens a blank call window immediately to preserve user gesture,
 * then navigates to the URL when ready. This prevents popup blockers.
 * 
 * Uses window.screenX/screenY to detect the current monitor position and centers
 * the popup window on that screen instead of defaulting to the primary monitor.
 * 
 * @param url - Optional Daily.co meeting URL to open immediately
 * @returns Window object if successful, null if popup was blocked
 */
export function openCallWindow(url?: string): Window | null {
  // Desired dimensions
  const desiredWidth = 1200;
  const desiredHeight = 800;
  
  // Minimum safe dimensions
  const minWidth = 480;
  const minHeight = 360;
  
  // Get available screen space with fallbacks
  const availableWidth = window.outerWidth || window.innerWidth || 1024;
  const availableHeight = window.outerHeight || window.innerHeight || 768;
  
  // Clamp to available screen space (leave some margin)
  const maxWidth = Math.max(minWidth, availableWidth - 100);
  const maxHeight = Math.max(minHeight, availableHeight - 100);
  const width = Math.max(minWidth, Math.min(desiredWidth, maxWidth));
  const height = Math.max(minHeight, Math.min(desiredHeight, maxHeight));
  
  // Calculate position to center on current screen (multi-monitor support)
  // Allow negative coordinates for monitors positioned left/above primary
  const screenX = window.screenX || 0;
  const screenY = window.screenY || 0;
  const left = screenX + (availableWidth - width) / 2;
  const top = screenY + (availableHeight - height) / 2;
  
  const features = `width=${width},height=${height},left=${left},top=${top},resizable=yes,scrollbars=yes`;
  
  // Development-only logging
  if (import.meta.env.DEV) {
    console.log('[CALL WINDOW] Opening call window - Position:', { left, top, width, height });
  }
  
  // Open blank window or with URL
  const targetUrl = url || 'about:blank';
  
  try {
    const newWindow = window.open(targetUrl, '_blank', features);
    
    // window.open() can return null in some browsers even when successful
    // Especially with about:blank. Only truly blocked if both null AND closed.
    if (!newWindow) {
      if (import.meta.env.DEV) {
        console.warn('[CALL WINDOW] window.open returned null - may be blocked or may succeed anyway');
      }
      return null;
    }
    
    // Security: Prevent reverse-tabnabbing by nullifying opener reference
    // This mitigates the security risk while still allowing us to control the window
    newWindow.opener = null;
    
    // Additional check: verify window isn't immediately closed (real block)
    if (newWindow.closed) {
      if (import.meta.env.DEV) {
        console.error('[CALL WINDOW] Window was blocked by popup blocker');
      }
      return null;
    }
    
    if (import.meta.env.DEV) {
      console.log('[CALL WINDOW] Window opened successfully');
    }
    
    return newWindow;
  } catch (error) {
    console.error('[CALL WINDOW] Exception opening window:', error);
    return null;
  }
}

/**
 * Navigate an already-opened call window to a URL.
 * Used when window was opened as blank to preserve user gesture.
 * 
 * @param window - The window object to navigate
 * @param url - The URL to navigate to
 */
export function navigateCallWindow(window: Window, url: string): void {
  try {
    window.location.href = url;
  } catch (error) {
    console.error('[CALL WINDOW] Failed to navigate:', error);
  }
}
