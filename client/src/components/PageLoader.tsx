import { useEffect, useState } from 'react';
import { useLocation } from 'wouter';

export function PageLoader() {
  const [location] = useLocation();
  const [isLoading, setIsLoading] = useState(false);
  const [prevLocation, setPrevLocation] = useState(location);

  useEffect(() => {
    if (location !== prevLocation) {
      setIsLoading(true);
      setPrevLocation(location);
      
      const timer = setTimeout(() => {
        setIsLoading(false);
      }, 400);
      
      return () => clearTimeout(timer);
    }
  }, [location, prevLocation]);

  if (!isLoading) return null;

  return (
    <div 
      className="fixed top-0 left-0 right-0 z-[9999] h-1 bg-primary/20" 
      data-testid="page-loader"
    >
      <div 
        className="h-full bg-primary page-loader shadow-lg" 
        style={{ width: '40%' }}
      />
    </div>
  );
}
