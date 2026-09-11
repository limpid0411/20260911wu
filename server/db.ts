import { DatabaseSync } from 'node:sqlite';
import path from 'path';
import fs from 'fs';
import {
  INITIAL_USERS,
  INITIAL_PROJECTS,
  INITIAL_BOARDS,
  INITIAL_COLUMNS,
  INITIAL_TASKS,
  INITIAL_RFIS,
  INITIAL_ATTACHMENTS,
  INITIAL_RFI_AUDIT_LOGS,
  INITIAL_COMMENTS
} from '../src/mock/initialData';
import {
  User,
  Project,
  Board,
  BoardColumn,
  Task,
  RFI,
  RFIAuditLog,
  Attachment,
  TaskComment,
  Notification
} from '../src/types/pms';

const dataDir = path.join(process.cwd(), 'data');
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
}

const dbPath = path.join(dataDir, 'pms.sqlite');
export const db = new DatabaseSync(dbPath);

// Enable WAL mode for high concurrency
db.exec('PRAGMA journal_mode = WAL;');

// Initialize tables
db.exec(`
  CREATE TABLE IF NOT EXISTS users (
    id TEXT PRIMARY KEY,
    email TEXT,
    full_name TEXT,
    role TEXT,
    avatar_url TEXT,
    department TEXT
  );

  CREATE TABLE IF NOT EXISTS projects (
    id TEXT PRIMARY KEY,
    code TEXT,
    name TEXT,
    description TEXT,
    created_by TEXT,
    created_at TEXT
  );

  CREATE TABLE IF NOT EXISTS boards (
    id TEXT PRIMARY KEY,
    project_id TEXT,
    title TEXT,
    position REAL,
    description TEXT
  );

  CREATE TABLE IF NOT EXISTS columns (
    id TEXT PRIMARY KEY,
    board_id TEXT,
    name TEXT,
    wip_limit INTEGER,
    position REAL
  );

  CREATE TABLE IF NOT EXISTS tasks (
    id TEXT PRIMARY KEY,
    column_id TEXT,
    title TEXT,
    description TEXT,
    priority TEXT,
    assignee_id TEXT,
    collaborators TEXT,
    position REAL,
    due_date TEXT,
    estimated_hours REAL,
    tags TEXT,
    module_category TEXT,
    created_at TEXT
  );

  CREATE TABLE IF NOT EXISTS rfis (
    id TEXT PRIMARY KEY,
    project_id TEXT,
    rfi_number TEXT,
    subject TEXT,
    question TEXT,
    suggested_solution TEXT,
    official_reply TEXT,
    status TEXT,
    priority TEXT,
    reference_spec_no TEXT,
    cost_impact INTEGER,
    schedule_impact INTEGER,
    schedule_days_impact REAL,
    author_id TEXT,
    assigned_reviewer_id TEXT,
    due_date TEXT,
    answered_at TEXT,
    answered_by TEXT,
    closed_at TEXT,
    closed_by TEXT,
    created_at TEXT
  );

  CREATE TABLE IF NOT EXISTS rfi_audit_logs (
    id TEXT PRIMARY KEY,
    rfi_id TEXT,
    action TEXT,
    user_id TEXT,
    user_name TEXT,
    user_role TEXT,
    details TEXT,
    timestamp TEXT
  );

  CREATE TABLE IF NOT EXISTS attachments (
    id TEXT PRIMARY KEY,
    target_type TEXT,
    target_id TEXT,
    file_name TEXT,
    file_size INTEGER,
    file_url TEXT,
    mime_type TEXT,
    uploader_id TEXT,
    uploader_name TEXT,
    created_at TEXT,
    is_clipboard INTEGER
  );

  CREATE TABLE IF NOT EXISTS comments (
    id TEXT PRIMARY KEY,
    task_id TEXT,
    author_id TEXT,
    author_name TEXT,
    content TEXT,
    created_at TEXT
  );

  CREATE TABLE IF NOT EXISTS notifications (
    id TEXT PRIMARY KEY,
    user_id TEXT,
    type TEXT,
    title TEXT,
    message TEXT,
    is_read INTEGER,
    created_at TEXT
  );
`);

// Seed data if database is brand new
export function seedDatabaseIfEmpty() {
  const check = db.prepare('SELECT count(*) as count FROM users').get() as { count: number };
  if (check && check.count > 0) {
    return;
  }

  console.log('[SQLite] Initializing database with seed data...');

  const insertUser = db.prepare(`
    INSERT INTO users (id, email, full_name, role, avatar_url, department)
    VALUES (?, ?, ?, ?, ?, ?)
  `);
  for (const u of INITIAL_USERS) {
    insertUser.run(u.id, u.email, u.full_name, u.role, u.avatar_url, u.department);
  }

  const insertProject = db.prepare(`
    INSERT INTO projects (id, code, name, description, created_by, created_at)
    VALUES (?, ?, ?, ?, ?, ?)
  `);
  for (const p of INITIAL_PROJECTS) {
    insertProject.run(p.id, p.code, p.name, p.description, p.created_by, p.created_at);
  }

  const insertBoard = db.prepare(`
    INSERT INTO boards (id, project_id, title, position, description)
    VALUES (?, ?, ?, ?, ?)
  `);
  for (const b of INITIAL_BOARDS) {
    insertBoard.run(b.id, b.project_id, b.title, b.position, b.description || '');
  }

  const insertCol = db.prepare(`
    INSERT INTO columns (id, board_id, name, wip_limit, position)
    VALUES (?, ?, ?, ?, ?)
  `);
  for (const c of INITIAL_COLUMNS) {
    insertCol.run(c.id, c.board_id, c.name, c.wip_limit, c.position);
  }

  const insertTask = db.prepare(`
    INSERT INTO tasks (id, column_id, title, description, priority, assignee_id, collaborators, position, due_date, estimated_hours, tags, module_category, created_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);
  for (const t of INITIAL_TASKS) {
    insertTask.run(
      t.id,
      t.column_id,
      t.title,
      t.description,
      t.priority,
      t.assignee_id,
      JSON.stringify(t.collaborators || []),
      t.position,
      t.due_date,
      t.estimated_hours || 0,
      JSON.stringify(t.tags || []),
      t.module_category,
      t.created_at
    );
  }

  const insertRFI = db.prepare(`
    INSERT INTO rfis (id, project_id, rfi_number, subject, question, suggested_solution, official_reply, status, priority, reference_spec_no, cost_impact, schedule_impact, schedule_days_impact, author_id, assigned_reviewer_id, due_date, answered_at, answered_by, closed_at, closed_by, created_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);
  for (const r of INITIAL_RFIS) {
    insertRFI.run(
      r.id,
      r.project_id,
      r.rfi_number,
      r.subject,
      r.question,
      r.suggested_solution,
      r.official_reply,
      r.status,
      r.priority,
      r.reference_spec_no,
      r.cost_impact ? 1 : 0,
      r.schedule_impact ? 1 : 0,
      r.schedule_days_impact,
      r.author_id,
      r.assigned_reviewer_id,
      r.due_date,
      r.answered_at,
      r.answered_by,
      r.closed_at,
      r.closed_by,
      r.created_at
    );
  }

  const insertAudit = db.prepare(`
    INSERT INTO rfi_audit_logs (id, rfi_id, action, user_id, user_name, user_role, details, timestamp)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `);
  for (const a of INITIAL_RFI_AUDIT_LOGS) {
    insertAudit.run(a.id, a.rfi_id, a.action, a.user_id, a.user_name, a.user_role, a.details, a.timestamp);
  }

  const insertAtt = db.prepare(`
    INSERT INTO attachments (id, target_type, target_id, file_name, file_size, file_url, mime_type, uploader_id, uploader_name, created_at, is_clipboard)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);
  for (const att of INITIAL_ATTACHMENTS) {
    insertAtt.run(
      att.id,
      att.target_type,
      att.target_id,
      att.file_name,
      att.file_size,
      att.file_url,
      att.mime_type,
      att.uploader_id,
      att.uploader_name,
      att.created_at,
      att.is_clipboard ? 1 : 0
    );
  }

  const insertComment = db.prepare(`
    INSERT INTO comments (id, task_id, author_id, author_name, content, created_at)
    VALUES (?, ?, ?, ?, ?, ?)
  `);
  for (const cm of INITIAL_COMMENTS) {
    insertComment.run(cm.id, cm.task_id, cm.author_id, cm.author_name, cm.content, cm.created_at);
  }

  // Initial welcome notification
  const insertNotif = db.prepare(`
    INSERT INTO notifications (id, user_id, type, title, message, is_read, created_at)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `);
  insertNotif.run(
    'notif-init-1',
    'usr-pm',
    'WIP_LIMIT_ALERT',
    'SQLite 資料庫服務已上線',
    '系統已全面升級為持久化 SQLite 關聯式資料庫架構，所有資料將實時寫入 data/pms.sqlite。',
    0,
    new Date().toISOString()
  );

  console.log('[SQLite] Seed data populated successfully.');
}

// Data query helpers
export function getAllData() {
  const users = db.prepare('SELECT * FROM users').all() as unknown as User[];
  const projects = db.prepare('SELECT * FROM projects').all() as unknown as Project[];
  const boards = db.prepare('SELECT * FROM boards ORDER BY position ASC').all() as unknown as Board[];
  const columns = db.prepare('SELECT * FROM columns ORDER BY position ASC').all() as unknown as BoardColumn[];
  
  const rawTasks = db.prepare('SELECT * FROM tasks ORDER BY position ASC').all() as unknown as any[];
  const tasks: Task[] = rawTasks.map(t => ({
    ...t,
    collaborators: t.collaborators ? JSON.parse(t.collaborators) : [],
    tags: t.tags ? JSON.parse(t.tags) : []
  }));

  const rawRFIs = db.prepare('SELECT * FROM rfis ORDER BY created_at DESC').all() as unknown as any[];
  const rfis: RFI[] = rawRFIs.map(r => ({
    ...r,
    cost_impact: Boolean(r.cost_impact),
    schedule_impact: Boolean(r.schedule_impact)
  }));

  const rfiAuditLogs = db.prepare('SELECT * FROM rfi_audit_logs ORDER BY timestamp DESC').all() as unknown as RFIAuditLog[];
  
  const rawAttachments = db.prepare('SELECT * FROM attachments ORDER BY created_at DESC').all() as unknown as any[];
  const attachments: Attachment[] = rawAttachments.map(a => ({
    ...a,
    is_clipboard: Boolean(a.is_clipboard)
  }));

  const comments = db.prepare('SELECT * FROM comments ORDER BY created_at ASC').all() as unknown as TaskComment[];
  
  const rawNotifications = db.prepare('SELECT * FROM notifications ORDER BY created_at DESC').all() as unknown as any[];
  const notifications: Notification[] = rawNotifications.map(n => ({
    ...n,
    is_read: Boolean(n.is_read)
  }));

  return {
    users,
    projects,
    boards,
    columns,
    tasks,
    rfis,
    rfiAuditLogs,
    attachments,
    comments,
    notifications
  };
}
