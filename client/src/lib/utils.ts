import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"
import { formatDistanceToNow } from "date-fns"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatLastSeen(lastSeenAt: Date | string | null | undefined, isOnline: boolean): string {
  if (isOnline) {
    return "Online";
  }
  
  if (!lastSeenAt) {
    return "Offline";
  }
  
  const date = typeof lastSeenAt === 'string' ? new Date(lastSeenAt) : lastSeenAt;
  
  // Check if date is valid
  if (isNaN(date.getTime())) {
    return "Offline";
  }
  
  try {
    return `Last seen ${formatDistanceToNow(date, { addSuffix: true })}`;
  } catch (error) {
    return "Offline";
  }
}
