export type ReviewStatus = 'pending' | 'approved' | 'rejected' | 'auto_approved';

export interface ReviewRequest {
  id: string;
  title: string;
  content: string;
  language?: string;
  status: ReviewStatus;
  comments?: string;
  createdAt: string;
  resolvedAt?: string;
}

export interface Settings {
  autoApprove: boolean;
  autoApproveDelay: number; // seconds; 0 = immediate
  notificationsEnabled: boolean;
}

export type WebSocketMessage =
  | { type: 'init'; payload: ReviewRequest[] }
  | { type: 'review_created' | 'review_updated'; payload: ReviewRequest }
  | { type: 'settings_updated'; payload: Settings };
