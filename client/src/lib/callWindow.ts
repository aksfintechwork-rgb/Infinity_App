/**
 * Opens a call window (Daily.co) on the current screen with proper multi-monitor support.
 * 
 * Uses window.screenX/screenY to detect the current monitor position and centers
 * the popup window on that screen instead of defaulting to the primary monitor.
 * 
 * @param url - The Daily.co meeting URL to open
 * @returns Window object if successful, null if popup was blocked
 */
export function openCallWindow(url: string): Window | null {
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
  
  const features = `width=${width},height=${height},left=${left},top=${top},resizable=yes,scrollbars=yes,noopener=yes,noreferrer=yes`;
  
  // Development-only logging
  if (import.meta.env.DEV) {
    console.log('[CALL WINDOW] Opening on current screen - Position:', { left, top, width, height });
  }
  
  const newWindow = window.open(url, '_blank', features);
  
  if (!newWindow && import.meta.env.DEV) {
    console.error('[CALL WINDOW] Failed to open - popup may be blocked');
  }
  
  return newWindow;
}
