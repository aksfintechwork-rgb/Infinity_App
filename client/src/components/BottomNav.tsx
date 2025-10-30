import { MessageSquare, CheckCircle2, Calendar, User, Shield } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface BottomNavProps {
  currentView: 'chat' | 'admin' | 'calendar' | 'tasks';
  onViewChange: (view: 'chat' | 'admin' | 'calendar' | 'tasks') => void;
  isAdmin: boolean;
  unreadCount?: number;
}

export default function BottomNav({
  currentView,
  onViewChange,
  isAdmin,
  unreadCount = 0,
}: BottomNavProps) {
  const navItems = [
    { id: 'chat' as const, label: 'Chats', icon: MessageSquare, showBadge: unreadCount > 0 },
    { id: 'tasks' as const, label: 'Tasks', icon: CheckCircle2 },
    { id: 'calendar' as const, label: 'Meetings', icon: Calendar },
    ...(isAdmin ? [{ id: 'admin' as const, label: 'Admin', icon: Shield }] : []),
  ];

  return (
    <nav
      className="fixed bottom-0 left-0 right-0 z-50 bg-background border-t border-border md:hidden"
      data-testid="bottom-nav"
    >
      <div className="flex items-center justify-around px-2 py-2 safe-area-inset-bottom">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = currentView === item.id;
          
          return (
            <Button
              key={item.id}
              variant="ghost"
              size="sm"
              onClick={() => onViewChange(item.id)}
              className={`relative flex flex-col items-center justify-center gap-1 h-14 min-w-[64px] px-3 ${
                isActive
                  ? 'text-purple-600 dark:text-purple-400'
                  : 'text-muted-foreground'
              }`}
              data-testid={`nav-${item.id}`}
            >
              <div className="relative">
                <Icon className="w-6 h-6" />
                {item.showBadge && unreadCount > 0 && (
                  <span className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-gradient-to-r from-purple-600 to-blue-600 text-[10px] font-bold text-white">
                    {unreadCount > 9 ? '9+' : unreadCount}
                  </span>
                )}
              </div>
              <span className={`text-xs font-medium ${isActive ? 'font-semibold' : ''}`}>
                {item.label}
              </span>
              {isActive && (
                <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-12 h-1 rounded-t-full bg-gradient-to-r from-purple-600 to-blue-600" />
              )}
            </Button>
          );
        })}
      </div>
    </nav>
  );
}
