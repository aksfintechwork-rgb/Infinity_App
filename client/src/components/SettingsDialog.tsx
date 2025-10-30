import { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Separator } from '@/components/ui/separator';
import { Bell, Moon, Volume2, MessageSquare, Calendar as CalendarIcon } from 'lucide-react';

interface SettingsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export default function SettingsDialog({ open, onOpenChange }: SettingsDialogProps) {
  const [settings, setSettings] = useState({
    darkMode: false,
    notifications: true,
    soundAlerts: true,
    messageNotifications: true,
    taskNotifications: true,
    meetingNotifications: true,
  });

  useEffect(() => {
    const savedSettings = localStorage.getItem('app_settings');
    if (savedSettings) {
      setSettings(JSON.parse(savedSettings));
    }
    
    const isDark = document.documentElement.classList.contains('dark');
    setSettings(prev => ({ ...prev, darkMode: isDark }));
  }, [open]);

  const handleSettingChange = (key: keyof typeof settings, value: boolean) => {
    const newSettings = { ...settings, [key]: value };
    setSettings(newSettings);
    localStorage.setItem('app_settings', JSON.stringify(newSettings));

    if (key === 'darkMode') {
      if (value) {
        document.documentElement.classList.add('dark');
      } else {
        document.documentElement.classList.remove('dark');
      }
    }
  };

  const handleSave = () => {
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[550px]" data-testid="dialog-settings">
        <DialogHeader>
          <DialogTitle className="text-xl">Settings</DialogTitle>
          <DialogDescription>
            Manage your app preferences and notification settings
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          <div className="space-y-4">
            <div>
              <h3 className="text-sm font-semibold mb-3">Appearance</h3>
              <div className="flex items-center justify-between p-3 rounded-lg bg-muted/30 hover-elevate">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-md bg-purple-100 dark:bg-purple-900/30">
                    <Moon className="w-4 h-4 text-purple-600 dark:text-purple-400" />
                  </div>
                  <div>
                    <Label htmlFor="dark-mode" className="text-sm font-medium cursor-pointer">
                      Dark Mode
                    </Label>
                    <p className="text-xs text-muted-foreground">Use dark theme throughout the app</p>
                  </div>
                </div>
                <Switch
                  id="dark-mode"
                  checked={settings.darkMode}
                  onCheckedChange={(checked) => handleSettingChange('darkMode', checked)}
                  data-testid="switch-dark-mode"
                />
              </div>
            </div>

            <Separator />

            <div>
              <h3 className="text-sm font-semibold mb-3">Notifications</h3>
              <div className="space-y-3">
                <div className="flex items-center justify-between p-3 rounded-lg bg-muted/30 hover-elevate">
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-md bg-blue-100 dark:bg-blue-900/30">
                      <Bell className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                    </div>
                    <div>
                      <Label htmlFor="notifications" className="text-sm font-medium cursor-pointer">
                        Desktop Notifications
                      </Label>
                      <p className="text-xs text-muted-foreground">Show browser notifications</p>
                    </div>
                  </div>
                  <Switch
                    id="notifications"
                    checked={settings.notifications}
                    onCheckedChange={(checked) => handleSettingChange('notifications', checked)}
                    data-testid="switch-notifications"
                  />
                </div>

                <div className="flex items-center justify-between p-3 rounded-lg bg-muted/30 hover-elevate">
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-md bg-green-100 dark:bg-green-900/30">
                      <Volume2 className="w-4 h-4 text-green-600 dark:text-green-400" />
                    </div>
                    <div>
                      <Label htmlFor="sound-alerts" className="text-sm font-medium cursor-pointer">
                        Sound Alerts
                      </Label>
                      <p className="text-xs text-muted-foreground">Play sound for new notifications</p>
                    </div>
                  </div>
                  <Switch
                    id="sound-alerts"
                    checked={settings.soundAlerts}
                    onCheckedChange={(checked) => handleSettingChange('soundAlerts', checked)}
                    data-testid="switch-sound-alerts"
                  />
                </div>
              </div>
            </div>

            <Separator />

            <div>
              <h3 className="text-sm font-semibold mb-3">Notification Types</h3>
              <div className="space-y-3">
                <div className="flex items-center justify-between p-3 rounded-lg bg-muted/30 hover-elevate">
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-md bg-purple-100 dark:bg-purple-900/30">
                      <MessageSquare className="w-4 h-4 text-purple-600 dark:text-purple-400" />
                    </div>
                    <div>
                      <Label htmlFor="message-notifications" className="text-sm font-medium cursor-pointer">
                        Message Notifications
                      </Label>
                      <p className="text-xs text-muted-foreground">Notify for new messages</p>
                    </div>
                  </div>
                  <Switch
                    id="message-notifications"
                    checked={settings.messageNotifications}
                    onCheckedChange={(checked) => handleSettingChange('messageNotifications', checked)}
                    data-testid="switch-message-notifications"
                  />
                </div>

                <div className="flex items-center justify-between p-3 rounded-lg bg-muted/30 hover-elevate">
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-md bg-amber-100 dark:bg-amber-900/30">
                      <Bell className="w-4 h-4 text-amber-600 dark:text-amber-400" />
                    </div>
                    <div>
                      <Label htmlFor="task-notifications" className="text-sm font-medium cursor-pointer">
                        Task Notifications
                      </Label>
                      <p className="text-xs text-muted-foreground">Notify for task updates</p>
                    </div>
                  </div>
                  <Switch
                    id="task-notifications"
                    checked={settings.taskNotifications}
                    onCheckedChange={(checked) => handleSettingChange('taskNotifications', checked)}
                    data-testid="switch-task-notifications"
                  />
                </div>

                <div className="flex items-center justify-between p-3 rounded-lg bg-muted/30 hover-elevate">
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-md bg-teal-100 dark:bg-teal-900/30">
                      <CalendarIcon className="w-4 h-4 text-teal-600 dark:text-teal-400" />
                    </div>
                    <div>
                      <Label htmlFor="meeting-notifications" className="text-sm font-medium cursor-pointer">
                        Meeting Notifications
                      </Label>
                      <p className="text-xs text-muted-foreground">Notify for upcoming meetings</p>
                    </div>
                  </div>
                  <Switch
                    id="meeting-notifications"
                    checked={settings.meetingNotifications}
                    onCheckedChange={(checked) => handleSettingChange('meetingNotifications', checked)}
                    data-testid="switch-meeting-notifications"
                  />
                </div>
              </div>
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-4">
            <Button variant="outline" onClick={() => onOpenChange(false)} data-testid="button-cancel-settings">
              Cancel
            </Button>
            <Button onClick={handleSave} data-testid="button-save-settings">
              Save Changes
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
