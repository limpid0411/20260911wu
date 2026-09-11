export type UserRole = 'SUPER_ADMIN' | 'PROJECT_MANAGER' | 'MEMBER' | 'REVIEWER_CLIENT';

export interface User {
  id: string;
  email: string;
  full_name: string;
  role: UserRole;
  avatar_url: string;
  department: string;
}

export interface Project {
  id: string;
  code: string;
  name: string;
  description: string;
  created_by: string;
  created_at: string;
}

export interface Board {
  id: string;
  project_id: string;
  title: string;
  position: number;
  description?: string;
}

export interface BoardColumn {
  id: string;
  board_id: string;
  name: string;
  wip_limit: number; // 0 for unlimited
  position: number;
}

export type Priority = 'LOW' | 'MEDIUM' | 'NORMAL' | 'HIGH' | 'URGENT';

export interface Notification {
  id: string;
  user_id?: string;
  type: 'WIP_LIMIT_ALERT' | 'RFI_OVERDUE' | 'RFI_CREATED' | 'RFI_STATUS_CHANGED' | 'TASK_ASSIGNED' | 'COMMENT_ADDED' | 'TASK_MOVED' | 'ATTACHMENT_UPLOADED' | 'WIP_WARNING';
  title: string;
  message: string;
  is_read: boolean;
  created_at: string;
}

export interface Task {
  id: string;
  column_id: string;
  title: string;
  description: string;
  priority: Priority;
  assignee_id: string | null;
  collaborators: string[];
  position: number;
  due_date: string | null;
  estimated_hours?: number;
  tags: string[];
  module_category: string;
  created_at: string;
}

export type RFIStatus =
  | 'DRAFT'
  | 'SUBMITTED'
  | 'UNDER_REVIEW'
  | 'ANSWERED'
  | 'CLOSED'
  | 'REJECTED';

export interface RFI {
  id: string;
  project_id: string;
  rfi_number: string; // e.g. RFI-PJ01-2026-0042
  subject: string;
  question: string;
  suggested_solution: string;
  official_reply: string | null;
  status: RFIStatus;
  priority: Priority;
  reference_spec_no: string; // 關聯圖面/規範編號
  cost_impact: boolean;
  schedule_impact: boolean;
  schedule_days_impact: number;
  author_id: string;
  assigned_reviewer_id: string | null;
  due_date: string | null;
  answered_at: string | null;
  answered_by: string | null;
  closed_at: string | null;
  closed_by: string | null;
  created_at: string;
}

export interface RFIAuditLog {
  id: string;
  rfi_id: string;
  action: string;
  user_id: string;
  user_name: string;
  user_role: UserRole;
  details: string;
  timestamp: string;
}

export interface Attachment {
  id: string;
  target_type: 'TASK' | 'RFI' | 'COMMENT';
  target_id: string;
  file_name: string;
  file_size: number;
  file_url: string;
  mime_type: string;
  uploader_id: string;
  uploader_name: string;
  created_at: string;
  is_clipboard?: boolean;
}

export interface TaskComment {
  id: string;
  task_id: string;
  author_id: string;
  author_name: string;
  content: string;
  created_at: string;
}

export interface RealtimeMessage {
  id: string;
  type: 'TASK_MOVED' | 'TASK_ASSIGNED' | 'RFI_CREATED' | 'RFI_STATUS_CHANGED' | 'ATTACHMENT_UPLOADED' | 'WIP_WARNING';
  title: string;
  content: string;
  timestamp: string;
  user_name: string;
}

export interface ApiLogEntry {
  id: string;
  method: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';
  endpoint: string;
  status: number;
  durationMs: number;
  timestamp: string;
  requestPayload?: any;
  responsePreview?: any;
}
