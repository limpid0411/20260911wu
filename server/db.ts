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
  Notification,
  LunchRestaurant,
  LunchOrder,
  LunchOrderItem
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
    type TEXT,
    title TEXT,
    content TEXT,
    is_read INTEGER,
    created_at TEXT
  );

  CREATE TABLE IF NOT EXISTS lunch_restaurants (
    id TEXT PRIMARY KEY,
    name TEXT,
    phone TEXT,
    category TEXT,
    menu_items TEXT
  );

  CREATE TABLE IF NOT EXISTS lunch_orders (
    id TEXT PRIMARY KEY,
    title TEXT,
    restaurant_id TEXT,
    date TEXT,
    cutoff_time TEXT,
    status TEXT,
    created_by TEXT,
    created_at TEXT
  );

  CREATE TABLE IF NOT EXISTS lunch_order_items (
    id TEXT PRIMARY KEY,
    order_id TEXT,
    user_id TEXT,
    user_name TEXT,
    item_name TEXT,
    price INTEGER,
    quantity INTEGER,
    note TEXT,
    is_paid INTEGER,
    created_at TEXT
  );
`);

// Check if initial users exist
const userCount = (db.prepare('SELECT COUNT(*) as count FROM users').get() as any).count;
if (userCount === 0) {
  console.log('[SQLite] Seeding initial core data...');

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
      r.suggested_solution || '',
      r.official_reply || '',
      r.status,
      r.priority,
      r.reference_spec_no || '',
      r.cost_impact ? 1 : 0,
      r.schedule_impact ? 1 : 0,
      r.schedule_days_impact || 0,
      r.author_id,
      r.assigned_reviewer_id,
      r.due_date,
      r.answered_at || '',
      r.answered_by || '',
      r.closed_at || '',
      r.closed_by || '',
      r.created_at
    );
  }

  const insertLog = db.prepare(`
    INSERT INTO rfi_audit_logs (id, rfi_id, action, user_id, user_name, user_role, details, timestamp)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `);
  for (const log of INITIAL_RFI_AUDIT_LOGS) {
    insertLog.run(
      log.id,
      log.rfi_id,
      log.action,
      log.user_id,
      log.user_name,
      log.user_role,
      log.details,
      log.timestamp
    );
  }

  const insertAttachment = db.prepare(`
    INSERT INTO attachments (id, target_type, target_id, file_name, file_size, file_url, mime_type, uploader_id, uploader_name, created_at, is_clipboard)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);
  for (const att of INITIAL_ATTACHMENTS) {
    insertAttachment.run(
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
  for (const comm of INITIAL_COMMENTS) {
    insertComment.run(comm.id, comm.task_id, comm.author_id, comm.author_name, comm.content, comm.created_at);
  }

  const insertNotif = db.prepare(`
    INSERT INTO notifications (id, type, title, content, is_read, created_at)
    VALUES (?, ?, ?, ?, ?, ?)
  `);
  insertNotif.run(
    'n_init',
    'WIP_LIMIT_ALERT',
    'SQLite 資料庫服務已上線',
    '系統已成功遷移至 SQLite 實體關聯資料庫，所有變更將即時寫入 data/pms.sqlite。',
    0,
    new Date().toISOString()
  );

  console.log('[SQLite] Seed data populated successfully.');
}

// Seed lunch data if missing
const restCount = (db.prepare('SELECT COUNT(*) as count FROM lunch_restaurants').get() as any).count;
if (restCount === 0) {
  console.log('[SQLite] Seeding initial lunch data...');

  const insertRest = db.prepare(`
    INSERT INTO lunch_restaurants (id, name, phone, category, menu_items)
    VALUES (?, ?, ?, ?, ?)
  `);

  insertRest.run(
    'r1',
    '正宗台式排骨便當',
    '02-2345-6789',
    '便當簡餐',
    JSON.stringify([
      { id: 'm1', name: '招牌排骨飯', price: 110, category: '主食' },
      { id: 'm2', name: '酥炸雞腿飯', price: 120, category: '主食' },
      { id: 'm3', name: '爌肉滷肉便當', price: 100, category: '主食' },
      { id: 'm4', name: '紅燒牛肉麵', price: 150, category: '麵食' },
      { id: 'm5', name: '古早味紅茶', price: 25, category: '飲料' }
    ])
  );

  insertRest.run(
    'r2',
    '五十嵐手搖飲專賣',
    '02-8765-4321',
    '手搖飲料',
    JSON.stringify([
      { id: 'm6', name: '四季春青茶', price: 40, category: '茶飲' },
      { id: 'm7', name: '珍珠奶茶 (大)', price: 60, category: '奶茶' },
      { id: 'm8', name: '燕麥紅茶拿鐵', price: 70, category: '鮮奶茶' },
      { id: 'm9', name: '檸檬綠茶', price: 50, category: '果茶' }
    ])
  );

  const insertOrder = db.prepare(`
    INSERT INTO lunch_orders (id, title, restaurant_id, date, cutoff_time, status, created_by, created_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `);

  const todayStr = new Date().toISOString().split('T')[0];
  insertOrder.run(
    'o1',
    `${todayStr} 團隊午餐排骨便當團`,
    'r1',
    todayStr,
    '11:30',
    'OPEN',
    '陳大明 (專案經理)',
    new Date().toISOString()
  );

  const insertItem = db.prepare(`
    INSERT INTO lunch_order_items (id, order_id, user_id, user_name, item_name, price, quantity, note, is_paid, created_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  insertItem.run('i1', 'o1', 'u1', '張小華', '招牌排骨飯', 110, 1, '飯少，加辣', 1, new Date().toISOString());
  insertItem.run('i2', 'o1', 'u2', '李美玲', '酥炸雞腿飯', 120, 1, '無辣，配菜不要苦瓜', 0, new Date().toISOString());
  insertItem.run('i3', 'o1', 'u3', '王志強', '古早味紅茶', 25, 2, '去冰微糖', 1, new Date().toISOString());

  console.log('[SQLite] Seed lunch data populated.');
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

// Lunch Order Query & Mutation Helpers
export function getLunchRestaurants(): LunchRestaurant[] {
  const rows = db.prepare('SELECT * FROM lunch_restaurants').all() as any[];
  return rows.map(r => ({
    ...r,
    menu_items: r.menu_items ? JSON.parse(r.menu_items) : []
  }));
}


export function updateLunchRestaurant(restaurant: LunchRestaurant): LunchRestaurant {
  const stmt = db.prepare(`
    UPDATE lunch_restaurants
    SET name = ?, phone = ?, category = ?, menu_items = ?
    WHERE id = ?
  `);
  stmt.run(
    restaurant.name,
    restaurant.phone,
    restaurant.category,
    JSON.stringify(restaurant.menu_items || []),
    restaurant.id
  );
  return restaurant;
}

export function addLunchRestaurant(restaurant: LunchRestaurant): LunchRestaurant {
  const stmt = db.prepare(`
    INSERT INTO lunch_restaurants (id, name, phone, category, menu_items)
    VALUES (?, ?, ?, ?, ?)
  `);
  stmt.run(
    restaurant.id,
    restaurant.name,
    restaurant.phone,
    restaurant.category,
    JSON.stringify(restaurant.menu_items || [])
  );
  return restaurant;
}

export function getLunchOrders(): LunchOrder[] {
  const orders = db.prepare('SELECT * FROM lunch_orders ORDER BY created_at DESC').all() as any[];
  const restaurants = getLunchRestaurants();
  const restMap = new Map(restaurants.map(r => [r.id, r]));

  return orders.map(o => {
    const rawItems = db.prepare('SELECT * FROM lunch_order_items WHERE order_id = ? ORDER BY created_at ASC').all(o.id) as any[];
    const items: LunchOrderItem[] = rawItems.map(i => ({
      ...i,
      is_paid: Boolean(i.is_paid)
    }));

    const rest = restMap.get(o.restaurant_id);
    return {
      ...o,
      restaurant_name: rest ? rest.name : '未知店家',
      restaurant_phone: rest ? rest.phone : '',
      items
    };
  });
}

export function addLunchOrder(order: Partial<LunchOrder>): LunchOrder {
  const id = order.id || `o_${Date.now()}`;
  const now = new Date().toISOString();
  const stmt = db.prepare(`
    INSERT INTO lunch_orders (id, title, restaurant_id, date, cutoff_time, status, created_by, created_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `);
  stmt.run(
    id,
    order.title || '午餐團購',
    order.restaurant_id || '',
    order.date || now.split('T')[0],
    order.cutoff_time || '12:00',
    order.status || 'OPEN',
    order.created_by || '同仁',
    now
  );

  return getLunchOrders().find(o => o.id === id)!;
}

export function updateLunchOrderStatus(id: string, status: string): LunchOrder | null {
  db.prepare('UPDATE lunch_orders SET status = ? WHERE id = ?').run(status, id);
  return getLunchOrders().find(o => o.id === id) || null;
}

export function addLunchOrderItem(item: Partial<LunchOrderItem>): LunchOrderItem {
  const id = item.id || `i_${Date.now()}`;
  const now = new Date().toISOString();
  const stmt = db.prepare(`
    INSERT INTO lunch_order_items (id, order_id, user_id, user_name, item_name, price, quantity, note, is_paid, created_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);
  stmt.run(
    id,
    item.order_id || '',
    item.user_id || 'u_guest',
    item.user_name || '同仁',
    item.item_name || '',
    item.price || 0,
    item.quantity || 1,
    item.note || '',
    item.is_paid ? 1 : 0,
    now
  );

  return {
    id,
    order_id: item.order_id || '',
    user_id: item.user_id || 'u_guest',
    user_name: item.user_name || '同仁',
    item_name: item.item_name || '',
    price: item.price || 0,
    quantity: item.quantity || 1,
    note: item.note || '',
    is_paid: Boolean(item.is_paid),
    created_at: now
  };
}

export function toggleLunchItemPaid(id: string, is_paid: boolean): void {
  db.prepare('UPDATE lunch_order_items SET is_paid = ? WHERE id = ?').run(is_paid ? 1 : 0, id);
}

export function deleteLunchOrderItem(id: string): void {
  db.prepare('DELETE FROM lunch_order_items WHERE id = ?').run(id);
}
