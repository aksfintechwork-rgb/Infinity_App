import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { User, Mail, Shield, Calendar } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';

interface ProfileDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

interface UserProfile {
  id: number;
  name: string;
  loginId: string;
  email: string;
  role: string;
  createdAt: string;
}

export default function ProfileDialog({ open, onOpenChange }: ProfileDialogProps) {
  const { data: profile } = useQuery<UserProfile>({
    queryKey: ['/api/profile'],
    enabled: open,
  });

  if (!profile) return null;

  const initials = profile.name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);

  const joinDate = new Date(profile.createdAt).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]" data-testid="dialog-profile">
        <DialogHeader>
          <DialogTitle className="text-xl">Profile Information</DialogTitle>
          <DialogDescription>
            View your account details and information
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          <div className="flex justify-center">
            <Avatar className="w-24 h-24 ring-4 ring-purple-100 dark:ring-purple-900">
              <AvatarImage src="" />
              <AvatarFallback className="text-3xl bg-gradient-to-br from-purple-500 to-blue-600 text-white">
                {initials}
              </AvatarFallback>
            </Avatar>
          </div>

          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="profile-name" className="flex items-center gap-2 text-muted-foreground">
                <User className="w-4 h-4" />
                Full Name
              </Label>
              <Input
                id="profile-name"
                value={profile.name}
                readOnly
                className="bg-muted/50"
                data-testid="input-profile-name"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="profile-login-id" className="flex items-center gap-2 text-muted-foreground">
                <User className="w-4 h-4" />
                Login ID
              </Label>
              <Input
                id="profile-login-id"
                value={profile.loginId}
                readOnly
                className="bg-muted/50"
                data-testid="input-profile-login-id"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="profile-email" className="flex items-center gap-2 text-muted-foreground">
                <Mail className="w-4 h-4" />
                Email Address
              </Label>
              <Input
                id="profile-email"
                value={profile.email}
                readOnly
                className="bg-muted/50"
                data-testid="input-profile-email"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="profile-role" className="flex items-center gap-2 text-muted-foreground">
                <Shield className="w-4 h-4" />
                Role
              </Label>
              <div className="flex items-center gap-2">
                <Input
                  id="profile-role"
                  value={profile.role.charAt(0).toUpperCase() + profile.role.slice(1)}
                  readOnly
                  className="bg-muted/50 flex-1"
                  data-testid="input-profile-role"
                />
                {profile.role === 'admin' && (
                  <div className="px-3 py-1.5 bg-gradient-to-r from-purple-500 to-blue-600 text-white text-sm rounded-md font-medium">
                    Admin
                  </div>
                )}
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="profile-joined" className="flex items-center gap-2 text-muted-foreground">
                <Calendar className="w-4 h-4" />
                Member Since
              </Label>
              <Input
                id="profile-joined"
                value={joinDate}
                readOnly
                className="bg-muted/50"
                data-testid="input-profile-joined"
              />
            </div>
          </div>

          <div className="flex justify-end pt-4">
            <Button onClick={() => onOpenChange(false)} data-testid="button-close-profile">
              Close
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
