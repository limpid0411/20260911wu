import express from 'express';
import { db, getAllData, getLunchRestaurants, addLunchRestaurant, getLunchOrders, addLunchOrder, updateLunchOrderStatus, addLunchOrderItem, toggleLunchItemPaid, deleteLunchOrderItem } from './db';
import { Task, RFI, Project, BoardColumn, RFIAuditLog, Attachment, TaskComment, Notification, User } from '../src/types/pms';

// Seed data if DB is empty

const app = express();
const PORT = process.env.PORT || 3001;

// Large payload limit for base64 clipboard attachments
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Request logging middleware
app.use((req, res, next) => {
  const start = Date.now();
  res.on('finish', () => {
    const duration = Date.now() - start;
    console.log(`[${req.method}] ${req.originalUrl} - ${res.statusCode} (${duration}ms)`);
  });
  next();
});

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', engine: 'node:sqlite', timestamp: new Date().toISOString() });
});

// Full state bootstrap
app.get('/api/all', (req, res) => {
  try {
    const data = getAllData();
    res.json(data);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// --- Projects ---
app.post('/api/projects', (req, res) => {
  try {
    const p: Project = req.body;
    const stmt = db.prepare(`
      INSERT INTO projects (id, code, name, description, created_by, created_at)
      VALUES (?, ?, ?, ?, ?, ?)
    `);
    stmt.run(p.id, p.code, p.name, p.description, p.created_by, p.created_at);

    // Also create default board & columns for the project
    const boardId = `brd-${Date.now()}`;
    db.prepare('INSERT INTO boards (id, project_id, title, position, description) VALUES (?, ?, ?, ?, ?)')
      .run(boardId, p.id, '銝餉?撌亦??', 0, '?身撠?撌亦??極?脣漲?');

    const defaultCols = [
      { name: '敺齒鈭? (Backlog)', limit: 0, pos: 0 },
      { name: '?脰?銝?(In Progress)', limit: 3, pos: 1 },
      { name: '撖拇瑼Ｘ (Review)', limit: 2, pos: 2 },
      { name: '撌脣?撌?(Done)', limit: 0, pos: 3 }
    ];
    const colStmt = db.prepare('INSERT INTO columns (id, board_id, name, wip_limit, position) VALUES (?, ?, ?, ?, ?)');
    for (let i = 0; i < defaultCols.length; i++) {
      colStmt.run(`col-${Date.now()}-${i}`, boardId, defaultCols[i].name, defaultCols[i].limit, defaultCols[i].pos);
    }

    res.status(201).json(p);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// --- Columns ---
app.put('/api/columns/:id', (req, res) => {
  try {
    const { id } = req.params;
    const { wip_limit, name } = req.body;
    if (wip_limit !== undefined) {
      db.prepare('UPDATE columns SET wip_limit = ? WHERE id = ?').run(wip_limit, id);
    }
    if (name !== undefined) {
      db.prepare('UPDATE columns SET name = ? WHERE id = ?').run(name, id);
    }
    res.json({ success: true, id });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// --- Additional Column & Attachment Routes ---
app.post('/api/columns', (req, res) => {
  try {
    const c: BoardColumn = req.body;
    db.prepare('INSERT INTO columns (id, board_id, name, wip_limit, position) VALUES (?, ?, ?, ?, ?)')
      .run(c.id, c.board_id, c.name, c.wip_limit, c.position);
    res.status(201).json(c);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

app.delete('/api/columns/:id', (req, res) => {
  try {
    const { id } = req.params;
    db.prepare('DELETE FROM columns WHERE id = ?').run(id);
    res.json({ success: true, id });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

app.delete('/api/attachments/:id', (req, res) => {
  try {
    const { id } = req.params;
    db.prepare('DELETE FROM attachments WHERE id = ?').run(id);
    res.json({ success: true, id });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// --- Tasks ---
app.post('/api/tasks', (req, res) => {
  try {
    const t: Task = req.body;
    const stmt = db.prepare(`
      INSERT INTO tasks (id, column_id, title, description, priority, assignee_id, collaborators, position, due_date, estimated_hours, tags, module_category, created_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);
    stmt.run(
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
    res.status(201).json(t);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

app.put('/api/tasks/:id', (req, res) => {
  try {
    const { id } = req.params;
    const t: Partial<Task> = req.body;

    const current = db.prepare('SELECT * FROM tasks WHERE id = ?').get(id) as any;
    if (!current) {
      return res.status(404).json({ error: 'Task not found' });
    }

    const updated = {
      column_id: t.column_id !== undefined ? t.column_id : current.column_id,
      title: t.title !== undefined ? t.title : current.title,
      description: t.description !== undefined ? t.description : current.description,
      priority: t.priority !== undefined ? t.priority : current.priority,
      assignee_id: t.assignee_id !== undefined ? t.assignee_id : current.assignee_id,
      collaborators: t.collaborators !== undefined ? JSON.stringify(t.collaborators) : current.collaborators,
      position: t.position !== undefined ? t.position : current.position,
      due_date: t.due_date !== undefined ? t.due_date : current.due_date,
      estimated_hours: t.estimated_hours !== undefined ? t.estimated_hours : current.estimated_hours,
      tags: t.tags !== undefined ? JSON.stringify(t.tags) : current.tags,
      module_category: t.module_category !== undefined ? t.module_category : current.module_category
    };

    const stmt = db.prepare(`
      UPDATE tasks
      SET column_id = ?, title = ?, description = ?, priority = ?, assignee_id = ?, collaborators = ?, position = ?, due_date = ?, estimated_hours = ?, tags = ?, module_category = ?
      WHERE id = ?
    `);
    stmt.run(
      updated.column_id,
      updated.title,
      updated.description,
      updated.priority,
      updated.assignee_id,
      updated.collaborators,
      updated.position,
      updated.due_date,
      updated.estimated_hours,
      updated.tags,
      updated.module_category,
      id
    );

    res.json({ success: true, id });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

app.delete('/api/tasks/:id', (req, res) => {
  try {
    const { id } = req.params;
    db.prepare('DELETE FROM tasks WHERE id = ?').run(id);
    db.prepare('DELETE FROM comments WHERE task_id = ?').run(id);
    res.json({ success: true, id });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// --- RFIs ---
app.post('/api/rfis', (req, res) => {
  try {
    const r: RFI = req.body;
    const stmt = db.prepare(`
      INSERT INTO rfis (id, project_id, rfi_number, subject, question, suggested_solution, official_reply, status, priority, reference_spec_no, cost_impact, schedule_impact, schedule_days_impact, author_id, assigned_reviewer_id, due_date, answered_at, answered_by, closed_at, closed_by, created_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);
    stmt.run(
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
    res.status(201).json(r);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

app.put('/api/rfis/:id', (req, res) => {
  try {
    const { id } = req.params;
    const r: Partial<RFI> = req.body;

    const current = db.prepare('SELECT * FROM rfis WHERE id = ?').get(id) as any;
    if (!current) {
      return res.status(404).json({ error: 'RFI not found' });
    }

    const updated = {
      status: r.status !== undefined ? r.status : current.status,
      official_reply: r.official_reply !== undefined ? r.official_reply : current.official_reply,
      assigned_reviewer_id: r.assigned_reviewer_id !== undefined ? r.assigned_reviewer_id : current.assigned_reviewer_id,
      answered_at: r.answered_at !== undefined ? r.answered_at : current.answered_at,
      answered_by: r.answered_by !== undefined ? r.answered_by : current.answered_by,
      closed_at: r.closed_at !== undefined ? r.closed_at : current.closed_at,
      closed_by: r.closed_by !== undefined ? r.closed_by : current.closed_by
    };

    const stmt = db.prepare(`
      UPDATE rfis
      SET status = ?, official_reply = ?, assigned_reviewer_id = ?, answered_at = ?, answered_by = ?, closed_at = ?, closed_by = ?
      WHERE id = ?
    `);
    stmt.run(
      updated.status,
      updated.official_reply,
      updated.assigned_reviewer_id,
      updated.answered_at,
      updated.answered_by,
      updated.closed_at,
      updated.closed_by,
      id
    );

    res.json({ success: true, id });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// --- RFI Audit Logs ---
app.post('/api/rfi-audit-logs', (req, res) => {
  try {
    const a: RFIAuditLog = req.body;
    const stmt = db.prepare(`
      INSERT INTO rfi_audit_logs (id, rfi_id, action, user_id, user_name, user_role, details, timestamp)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `);
    stmt.run(a.id, a.rfi_id, a.action, a.user_id, a.user_name, a.user_role, a.details, a.timestamp);
    res.status(201).json(a);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// --- Comments ---
app.post('/api/comments', (req, res) => {
  try {
    const c: TaskComment = req.body;
    const stmt = db.prepare(`
      INSERT INTO comments (id, task_id, author_id, author_name, content, created_at)
      VALUES (?, ?, ?, ?, ?, ?)
    `);
    stmt.run(c.id, c.task_id, c.author_id, c.author_name, c.content, c.created_at);
    res.status(201).json(c);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// --- Attachments ---
app.post('/api/attachments', (req, res) => {
  try {
    const a: Attachment = req.body;
    const stmt = db.prepare(`
      INSERT INTO attachments (id, target_type, target_id, file_name, file_size, file_url, mime_type, uploader_id, uploader_name, created_at, is_clipboard)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);
    stmt.run(
      a.id,
      a.target_type,
      a.target_id,
      a.file_name,
      a.file_size,
      a.file_url,
      a.mime_type,
      a.uploader_id,
      a.uploader_name,
      a.created_at,
      a.is_clipboard ? 1 : 0
    );
    res.status(201).json(a);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// --- Notifications ---
app.post('/api/notifications', (req, res) => {
  try {
    const n: Notification = req.body;
    const stmt = db.prepare(`
      INSERT INTO notifications (id, user_id, type, title, message, is_read, created_at)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `);
    stmt.run(n.id, n.user_id || null, n.type, n.title, n.message, n.is_read ? 1 : 0, n.created_at);
    res.status(201).json(n);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

app.put('/api/notifications/:id/read', (req, res) => {
  try {
    const { id } = req.params;
    db.prepare('UPDATE notifications SET is_read = 1 WHERE id = ?').run(id);
    res.json({ success: true, id });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

app.put('/api/notifications/read-all', (req, res) => {
  try {
    db.prepare('UPDATE notifications SET is_read = 1').run();
    res.json({ success: true });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// --- Users ---
app.post('/api/users', (req, res) => {
  try {
    const u: User = req.body;
    const stmt = db.prepare(`
      INSERT INTO users (id, email, full_name, role, avatar_url, department)
      VALUES (?, ?, ?, ?, ?, ?)
    `);
    stmt.run(u.id, u.email, u.full_name, u.role, u.avatar_url, u.department);
    res.status(201).json(u);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});


// --- Lunch Orders & Restaurants ---
app.get('/api/lunch/restaurants', (req, res) => {
  try {
    res.json(getLunchRestaurants());
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/lunch/restaurants', (req, res) => {
  try {
    const restaurant = addLunchRestaurant(req.body);
    res.status(201).json(restaurant);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/lunch/orders', (req, res) => {
  try {
    res.json(getLunchOrders());
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/lunch/orders', (req, res) => {
  try {
    const order = addLunchOrder(req.body);
    res.status(201).json(order);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

app.put('/api/lunch/orders/:id/status', (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;
    const order = updateLunchOrderStatus(id, status);
    res.json(order);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/lunch/orders/:id/items', (req, res) => {
  try {
    const { id } = req.params;
    const itemData = { ...req.body, order_id: id };
    const item = addLunchOrderItem(itemData);
    res.status(201).json(item);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

app.put('/api/lunch/items/:id/paid', (req, res) => {
  try {
    const { id } = req.params;
    const { is_paid } = req.body;
    toggleLunchItemPaid(id, Boolean(is_paid));
    res.json({ success: true, id, is_paid: Boolean(is_paid) });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

app.delete('/api/lunch/items/:id', (req, res) => {
  try {
    const { id } = req.params;
    deleteLunchOrderItem(id);
    res.json({ success: true, id });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Start Express server
app.listen(PORT, () => {
  console.log(`[SQLite Backend API] Server running at http://localhost:${PORT}`);
  console.log(`[SQLite Backend API] Database: data/pms.sqlite (WAL mode)`);
});

