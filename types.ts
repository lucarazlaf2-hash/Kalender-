
export type ProjectStatus = 'Planning' | 'Editing' | 'Ready' | 'Posted';

export interface VideoProject {
  id: string;
  title: string;
  description: string;
  platform: 'YouTube' | 'TikTok' | 'Instagram' | 'LinkedIn' | 'Custom';
  status: ProjectStatus;
  dueDate: string; // ISO format: YYYY-MM-DD
  postTime?: string; // Format: HH:mm
  reminderMinutes?: number; // Minutes before postTime
  lastNotifiedAt?: number; // Timestamp to prevent duplicate notifications
  createdAt: number;
  fileName?: string;
  fileSize?: number;
  fileType?: string;
}

export interface CalendarDay {
  date: Date;
  isCurrentMonth: boolean;
  isToday: boolean;
  projects: VideoProject[];
}
