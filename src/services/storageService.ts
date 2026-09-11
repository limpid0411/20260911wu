import {
  LunchRestaurant,
  LunchOrder,
  LunchOrderItem,
  LunchOrderStatus,
  User,
  Project,
  Board,
  BoardColumn,
  Task,
  RFI,
  RFIAuditLog,
  Attachment,
  TaskComment,
  RealtimeMessage,
  Notification,
  ApiLogEntry,
  RFIStatus,
  Priority
} from '../types/pms';
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
} from '../mock/initialData';

const STORAGE_KEYS = {
  USERS: 'pms_users_v1',
  PROJECTS: 'pms_projects_v1',
  BOARDS: 'pms_boards_v1',
  COLUMNS: 'pms_columns_v1',
  TASKS: 'pms_tasks_v1',
  RFIS: 'pms_rfis_v1',
  ATTACHMENTS: 'pms_attachments_v1',
  RFI_AUDIT_LOGS: 'pms_rfi_audit_logs_v1',
  COMMENTS: 'pms_comments_v1',
  CURRENT_USER_ID: 'pms_current_user_id_v1',
  CURRENT_PROJECT_ID: 'pms_current_project_id_v1',
  API_LOGS: 'pms_api_logs_v1',
  NOTIFICATIONS: 'pms_notifications_v1'
};

class StorageService {
  private users: User[] = [];
  private projects: Project[] = [];
  private boards: Board[] = [];
  private columns: BoardColumn[] = [];
  private tasks: Task[] = [];
  private rfis: RFI[] = [];
  private attachments: Attachment[] = [];
  private rfiAuditLogs: RFIAuditLog[] = [];
  private comments: TaskComment[] = [];
  private currentUserId: string = 'usr-pm';
  private currentProjectId: string = 'prj-pj01';
  private apiLogs: ApiLogEntry[] = [];
  private lunchRestaurants: LunchRestaurant[] = [];
  private lunchOrders: LunchOrder[] = [];
  private notifications: Notification[] = [];
  private listeners: Set<() => void> = new Set();

  constructor() {
    this.init();
  }

  private init() {
    try {
      this.users = this.loadFromStorage(STORAGE_KEYS.USERS, INITIAL_USERS);
      this.projects = this.loadFromStorage(STORAGE_KEYS.PROJECTS, INITIAL_PROJECTS);
      this.boards = this.loadFromStorage(STORAGE_KEYS.BOARDS, INITIAL_BOARDS);
      this.columns = this.loadFromStorage(STORAGE_KEYS.COLUMNS, INITIAL_COLUMNS);
      this.tasks = this.loadFromStorage(STORAGE_KEYS.TASKS, INITIAL_TASKS);
      this.rfis = this.loadFromStorage(STORAGE_KEYS.RFIS, INITIAL_RFIS);
      this.attachments = this.loadFromStorage(STORAGE_KEYS.ATTACHMENTS, INITIAL_ATTACHMENTS);
      this.rfiAuditLogs = this.loadFromStorage(STORAGE_KEYS.RFI_AUDIT_LOGS, INITIAL_RFI_AUDIT_LOGS);
      this.comments = this.loadFromStorage(STORAGE_KEYS.COMMENTS, INITIAL_COMMENTS);
      
      const storedUser = localStorage.getItem(STORAGE_KEYS.CURRENT_USER_ID);
      if (storedUser && this.users.some(u => u.id === storedUser)) {
        this.currentUserId = storedUser;
      }
      
      const storedProj = localStorage.getItem(STORAGE_KEYS.CURRENT_PROJECT_ID);
      if (storedProj && this.projects.some(p => p.id === storedProj)) {
        this.currentProjectId = storedProj;
      }
      this.syncFromBackend();
      this.fetchLunchRestaurants();
      this.fetchLunchOrders();
    } catch {
      this.resetToDefaults();
    }
  }

  private loadFromStorage<T>(key: string, fallback: T): T {
    try {
      const data = localStorage.getItem(key);
      return data ? JSON.parse(data) : fallback;
    } catch {
      return fallback;
    }
  }

  private saveToStorage(key: string, data: any) {
    try {
      localStorage.setItem(key, JSON.stringify(data));
    } catch (e) {
      console.warn('Storage quota exceeded or storage unavailable', e);
    }
  }

  public async syncFromBackend() {
    try {
      const res = await fetch('/api/all');
      if (res.ok) {
        const data = await res.json();
        if (data.users && data.users.length) {
          this.users = data.users;
          this.saveToStorage(STORAGE_KEYS.USERS, this.users);
        }
        if (data.projects && data.projects.length) {
          this.projects = data.projects;
          this.saveToStorage(STORAGE_KEYS.PROJECTS, this.projects);
        }
        if (data.boards && data.boards.length) {
          this.boards = data.boards;
          this.saveToStorage(STORAGE_KEYS.BOARDS, this.boards);
        }
        if (data.columns && data.columns.length) {
          this.columns = data.columns;
          this.saveToStorage(STORAGE_KEYS.COLUMNS, this.columns);
        }
        if (data.tasks) {
          this.tasks = data.tasks;
          this.saveToStorage(STORAGE_KEYS.TASKS, this.tasks);
        }
        if (data.rfis) {
          this.rfis = data.rfis;
          this.saveToStorage(STORAGE_KEYS.RFIS, this.rfis);
        }
        if (data.rfiAuditLogs) {
          this.rfiAuditLogs = data.rfiAuditLogs;
          this.saveToStorage(STORAGE_KEYS.RFI_AUDIT_LOGS, this.rfiAuditLogs);
        }
        if (data.attachments) {
          this.attachments = data.attachments;
          this.saveToStorage(STORAGE_KEYS.ATTACHMENTS, this.attachments);
        }
        if (data.comments) {
          this.comments = data.comments;
          this.saveToStorage(STORAGE_KEYS.COMMENTS, this.comments);
        }
        if (data.notifications && data.notifications.length) {
          this.notifications = data.notifications;
          this.saveToStorage(STORAGE_KEYS.NOTIFICATIONS, this.notifications);
        }
        this.notify();
      }
    } catch {
      // Backend offline or fallback
    }
  }

  private async apiRequest(endpoint: string, method: string, payload?: any) {
    try {
      await fetch(endpoint, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: payload ? JSON.stringify(payload) : undefined
      });
    } catch {
      // Non-blocking
    }
  }


  public subscribe(listener: () => void) {
    this.listeners.add(listener);
    return () => {
      this.listeners.delete(listener);
    };
  }

  private notify() {
    this.listeners.forEach((l) => l());
  }

  public resetToDefaults() {
    this.users = [...INITIAL_USERS];
    this.projects = [...INITIAL_PROJECTS];
    this.boards = [...INITIAL_BOARDS];
    this.columns = [...INITIAL_COLUMNS];
    this.tasks = [...INITIAL_TASKS];
    this.rfis = [...INITIAL_RFIS];
    this.attachments = [...INITIAL_ATTACHMENTS];
    this.rfiAuditLogs = [...INITIAL_RFI_AUDIT_LOGS];
    this.comments = [...INITIAL_COMMENTS];
    this.apiLogs = [];
    this.notifications = [];

    this.saveToStorage(STORAGE_KEYS.USERS, this.users);
    this.saveToStorage(STORAGE_KEYS.PROJECTS, this.projects);
    this.saveToStorage(STORAGE_KEYS.BOARDS, this.boards);
    this.saveToStorage(STORAGE_KEYS.COLUMNS, this.columns);
    this.saveToStorage(STORAGE_KEYS.TASKS, this.tasks);
    this.saveToStorage(STORAGE_KEYS.RFIS, this.rfis);
    this.saveToStorage(STORAGE_KEYS.ATTACHMENTS, this.attachments);
    this.saveToStorage(STORAGE_KEYS.RFI_AUDIT_LOGS, this.rfiAuditLogs);
    this.saveToStorage(STORAGE_KEYS.COMMENTS, this.comments);
    this.notify();
  }

  // Log API and Realtime broadcast simulation
  private logApi(
    method: ApiLogEntry['method'],
    endpoint: string,
    payload?: any,
    response?: any,
    status = 200
  ) {
    const entry: ApiLogEntry = {
      id: 'api-' + Date.now() + '-' + Math.random().toString(36).substring(2, 6),
      method,
      endpoint,
      status,
      durationMs: Math.floor(Math.random() * 35) + 15,
      timestamp: new Date().toISOString(),
      requestPayload: payload,
      responsePreview: response
    };
    this.apiLogs = [entry, ...this.apiLogs].slice(0, 50);
    this.notify();
  }

  private broadcastRealtime(type: Notification['type'], title: string, content: string) {
    const currentUser = this.getCurrentUser();
    const notif: Notification = {
      id: 'notif-' + Date.now() + '-' + Math.random().toString(36).substring(2, 6),
      type,
      title,
      message: content,
      is_read: false,
      created_at: new Date().toISOString()
    };
    this.notifications = [notif, ...this.notifications].slice(0, 50);
    this.notify();
  }

  // User & Project state
  public getUsers(): User[] {
    return this.users;
  }

  public getCurrentUser(): User {
    return this.users.find((u) => u.id === this.currentUserId) || this.users[0];
  }

  public setCurrentUser(userId: string) {
    this.currentUserId = userId;
    localStorage.setItem(STORAGE_KEYS.CURRENT_USER_ID, userId);
    this.notify();
  }

  public getProjects(): Project[] {
    return this.projects;
  }

  public getCurrentProject(): Project {
    return this.projects.find((p) => p.id === this.currentProjectId) || this.projects[0];
  }

  public setCurrentProject(projectId: string) {
    this.currentProjectId = projectId;
    localStorage.setItem(STORAGE_KEYS.CURRENT_PROJECT_ID, projectId);
    this.notify();
  }

  public createProject(name: string, code: string, description?: string): Project {
    return this.addProject(code, name, description || '');
  }

  public addProject(code: string, name: string, description: string): Project {
    const newProj: Project = {
      id: 'prj-' + code.toLowerCase().replace(/[^a-z0-9]/g, ''),
      code: code.toUpperCase(),
      name,
      description,
      created_by: this.currentUserId,
      created_at: new Date().toISOString()
    };
    this.projects.push(newProj);
    this.saveToStorage(STORAGE_KEYS.PROJECTS, this.projects);

    // Create default board for new project
    const defaultBoard: Board = {
      id: 'brd-' + Date.now(),
      project_id: newProj.id,
      title: '敏捷主工作看板',
      position: 0,
      description: '預設看板與基本工作流'
    };
    this.boards.push(defaultBoard);
    this.saveToStorage(STORAGE_KEYS.BOARDS, this.boards);

    const defaultCols: BoardColumn[] = [
      { id: 'col-' + Date.now() + '-1', board_id: defaultBoard.id, name: '待處理 (Backlog)', wip_limit: 0, position: 0 },
      { id: 'col-' + Date.now() + '-2', board_id: defaultBoard.id, name: '進行中 (In Progress)', wip_limit: 4, position: 1 },
      { id: 'col-' + Date.now() + '-3', board_id: defaultBoard.id, name: '檢驗中 (Review)', wip_limit: 2, position: 2 },
      { id: 'col-' + Date.now() + '-4', board_id: defaultBoard.id, name: '已完成 (Done)', wip_limit: 0, position: 3 }
    ];
    this.columns.push(...defaultCols);
    this.saveToStorage(STORAGE_KEYS.COLUMNS, this.columns);

    this.setCurrentProject(newProj.id);
    this.logApi('POST', `/api/v1/projects`, { code, name }, newProj, 201);
    this.broadcastRealtime('TASK_MOVED', '建立新專案', `專案 ${name} (${code}) 已建立`);
    return newProj;
  }

  // --- RESTful Kanban Endpoints ---
  // GET /api/v1/projects/:projectId/boards
  public getBoards(projectId: string): Board[] {
    const res = this.boards.filter((b) => b.project_id === projectId);
    return res;
  }

  public createBoard(projectId: string, title: string, description?: string): Board {
    const newBoard: Board = {
      id: 'brd-' + Date.now(),
      project_id: projectId,
      title,
      description: description || '',
      position: this.boards.filter((b) => b.project_id === projectId).length
    };
    this.boards.push(newBoard);
    this.saveToStorage(STORAGE_KEYS.BOARDS, this.boards);

    // Add standard 4 columns
    const cols: BoardColumn[] = [
      { id: 'col-' + Date.now() + '-1', board_id: newBoard.id, name: '待處理 (Backlog)', wip_limit: 0, position: 0 },
      { id: 'col-' + Date.now() + '-2', board_id: newBoard.id, name: '進行中 (In Progress)', wip_limit: 3, position: 1 },
      { id: 'col-' + Date.now() + '-3', board_id: newBoard.id, name: '審核中 (Review)', wip_limit: 2, position: 2 },
      { id: 'col-' + Date.now() + '-4', board_id: newBoard.id, name: '已完成 (Done)', wip_limit: 0, position: 3 }
    ];
    this.columns.push(...cols);
    this.saveToStorage(STORAGE_KEYS.COLUMNS, this.columns);

    this.logApi('POST', `/api/v1/projects/${projectId}/boards`, { title }, newBoard, 201);
    this.broadcastRealtime('TASK_MOVED', '建立看板', `建立新看板「${title}」`);
    this.notify();
    return newBoard;
  }

  public getColumns(boardId: string): BoardColumn[] {
    return this.columns.filter((c) => c.board_id === boardId).sort((a, b) => a.position - b.position);
  }

  // POST /api/v1/boards/:boardId/columns
  public addColumn(boardId: string, name: string, wip_limit: number = 0): BoardColumn {
    const existing = this.getColumns(boardId);
    const newCol: BoardColumn = {
      id: 'col-' + Date.now(),
      board_id: boardId,
      name,
      wip_limit,
      position: existing.length
    };
    this.columns.push(newCol);
    this.saveToStorage(STORAGE_KEYS.COLUMNS, this.columns);
    this.logApi('POST', `/api/v1/boards/${boardId}/columns`, { name, wip_limit }, newCol, 201);
    this.notify();
    return newCol;
  }

  public updateColumn(columnId: string, name: string, wip_limit: number) {
    this.columns = this.columns.map((c) => (c.id === columnId ? { ...c, name, wip_limit } : c));
    this.saveToStorage(STORAGE_KEYS.COLUMNS, this.columns);
    this.logApi('PUT', `/api/v1/columns/${columnId}`, { name, wip_limit }, { success: true });
    this.notify();
  }

  public deleteColumn(columnId: string) {
    this.columns = this.columns.filter((c) => c.id !== columnId);
    // Remove or move tasks in that column
    this.tasks = this.tasks.filter((t) => t.column_id !== columnId);
    this.saveToStorage(STORAGE_KEYS.COLUMNS, this.columns);
    this.saveToStorage(STORAGE_KEYS.TASKS, this.tasks);
    this.logApi('DELETE', `/api/v1/columns/${columnId}`, {}, { success: true });
    this.notify();
  }

  public getTasks(columnId?: string): Task[] {
    if (columnId) {
      return this.tasks.filter((t) => t.column_id === columnId).sort((a, b) => a.position - b.position);
    }
    return this.tasks;
  }

  // POST /api/v1/columns/:columnId/tasks
  public createTask(taskData: {
    column_id: string;
    title: string;
    description: string;
    priority: Priority;
    assignee_id: string | null;
    collaborators: string[];
    due_date: string | null;
    estimated_hours?: number;
    tags: string[];
    module_category: string;
  }): Task {
    const existing = this.getTasks(taskData.column_id);
    const newTask: Task = {
      id: 'tsk-' + Date.now().toString(36),
      ...taskData,
      position: existing.length,
      created_at: new Date().toISOString()
    };
    this.tasks.push(newTask);
    this.saveToStorage(STORAGE_KEYS.TASKS, this.tasks);

    // Check WIP limit warning
    const col = this.columns.find((c) => c.id === taskData.column_id);
    if (col && col.wip_limit > 0 && existing.length + 1 > col.wip_limit) {
      this.broadcastRealtime(
        'WIP_WARNING',
        '⚠️ WIP 限制警示',
        `欄位「${col.name}」卡片數 (${existing.length + 1}) 超過 WIP 上限 (${col.wip_limit})！`
      );
    }

    this.logApi('POST', `/api/v1/columns/${taskData.column_id}/tasks`, taskData, newTask, 201);
    this.broadcastRealtime('TASK_MOVED', '新增卡片', `建立任務卡片「${newTask.title}」`);
    this.notify();
    return newTask;
  }

  // PATCH /api/v1/tasks/:taskId/move
  public moveTask(taskId: string, targetColumnId: string, newPosition: number) {
    const task = this.tasks.find((t) => t.id === taskId);
    if (!task) return;

    const sourceColumnId = task.column_id;
    const isSameColumn = sourceColumnId === targetColumnId;

    if (isSameColumn) {
      const colTasks = this.getTasks(sourceColumnId).filter((t) => t.id !== taskId);
      colTasks.splice(newPosition, 0, task);
      colTasks.forEach((t, idx) => {
        t.position = idx;
      });
    } else {
      // Remove from source
      const srcTasks = this.getTasks(sourceColumnId).filter((t) => t.id !== taskId);
      srcTasks.forEach((t, idx) => {
        t.position = idx;
      });

      // Insert into target
      task.column_id = targetColumnId;
      const targetTasks = this.getTasks(targetColumnId).filter((t) => t.id !== taskId);
      targetTasks.splice(newPosition, 0, task);
      targetTasks.forEach((t, idx) => {
        t.position = idx;
      });

      // Check WIP limit warning on target column
      const targetCol = this.columns.find((c) => c.id === targetColumnId);
      if (targetCol && targetCol.wip_limit > 0 && targetTasks.length > targetCol.wip_limit) {
        this.broadcastRealtime(
          'WIP_WARNING',
          '⚠️ WIP 限制警示',
          `欄位「${targetCol.name}」卡片數 (${targetTasks.length}) 已超額！上限為 ${targetCol.wip_limit}`
        );
      }
    }

    this.saveToStorage(STORAGE_KEYS.TASKS, this.tasks);
    const targetColName = this.columns.find((c) => c.id === targetColumnId)?.name || '未知欄位';

    this.logApi(
      'PATCH',
      `/api/v1/tasks/${taskId}/move`,
      { targetColumnId, newPosition },
      { success: true, taskId, targetColumnId, newPosition }
    );
    this.broadcastRealtime('TASK_MOVED', '卡片拖曳移動', `卡片「${task.title}」移動至「${targetColName}」`);
    this.notify();
  }

  // PATCH /api/v1/tasks/:taskId/assign
  public assignTask(taskId: string, assignee_id: string | null, collaborators: string[] = []) {
    this.tasks = this.tasks.map((t) =>
      t.id === taskId ? { ...t, assignee_id, collaborators } : t
    );
    this.saveToStorage(STORAGE_KEYS.TASKS, this.tasks);

    const task = this.tasks.find((t) => t.id === taskId);
    const assignee = this.users.find((u) => u.id === assignee_id);
    const assigneeName = assignee ? assignee.full_name : '未指派';

    this.logApi('PATCH', `/api/v1/tasks/${taskId}/assign`, { assignee_id, collaborators }, { success: true });
    this.broadcastRealtime('TASK_ASSIGNED', '指派任務', `任務「${task?.title}」主要負責人變更為 ${assigneeName}`);
    this.notify();
  }

  public updateTask(taskId: string, updates: Partial<Task>) {
    this.tasks = this.tasks.map((t) => (t.id === taskId ? { ...t, ...updates } : t));
    this.saveToStorage(STORAGE_KEYS.TASKS, this.tasks);
    this.logApi('PUT', `/api/v1/tasks/${taskId}`, updates, { success: true });
    this.notify();
  }

  public deleteTask(taskId: string) {
    this.tasks = this.tasks.filter((t) => t.id !== taskId);
    this.saveToStorage(STORAGE_KEYS.TASKS, this.tasks);
    this.logApi('DELETE', `/api/v1/tasks/${taskId}`, {}, { success: true });
    this.notify();
  }

  // --- RESTful RFI Endpoints ---
  // GET /api/v1/projects/:projectId/rfis
  public getRFIs(projectId: string): RFI[] {
    return this.rfis.filter((r) => r.project_id === projectId);
  }

  public getRFIById(rfiId: string): RFI | undefined {
    return this.rfis.find((r) => r.id === rfiId);
  }

  // Auto-generate next RFI Number: RFI-[ProjectCode]-[Year]-[0001...]
  public getNextRFINumber(projectId: string): string {
    const project = this.projects.find((p) => p.id === projectId) || this.getCurrentProject();
    const currentYear = new Date().getFullYear();
    const projectCode = project.code || 'PRJ';
    const prefix = `RFI-${projectCode}-${currentYear}-`;

    const existingMatching = this.rfis
      .filter((r) => r.rfi_number.startsWith(prefix))
      .map((r) => {
        const numStr = r.rfi_number.replace(prefix, '');
        const n = parseInt(numStr, 10);
        return isNaN(n) ? 0 : n;
      });

    const maxNum = existingMatching.length > 0 ? Math.max(...existingMatching) : 46;
    const nextSeq = String(maxNum + 1).padStart(4, '0');
    return `${prefix}${nextSeq}`;
  }

  // POST /api/v1/projects/:projectId/rfis
  public createRFI(rfiData: {
    project_id: string;
    subject: string;
    question: string;
    suggested_solution: string;
    priority: Priority;
    reference_spec_no: string;
    cost_impact: boolean;
    schedule_impact: boolean;
    schedule_days_impact: number;
    assigned_reviewer_id: string | null;
    due_date: string | null;
  }): RFI {
    const currentUser = this.getCurrentUser();
    const rfiNumber = this.getNextRFINumber(rfiData.project_id);

    const newRFI: RFI = {
      id: 'rfi-' + Date.now().toString(36),
      ...rfiData,
      rfi_number: rfiNumber,
      official_reply: null,
      status: 'SUBMITTED', // Or DRAFT
      author_id: currentUser.id,
      answered_at: null,
      answered_by: null,
      closed_at: null,
      closed_by: null,
      created_at: new Date().toISOString()
    };

    this.rfis.unshift(newRFI);
    this.saveToStorage(STORAGE_KEYS.RFIS, this.rfis);

    // Add Audit Log entry
    const auditLog: RFIAuditLog = {
      id: 'log-' + Date.now(),
      rfi_id: newRFI.id,
      action: 'CREATE_RFI',
      user_id: currentUser.id,
      user_name: currentUser.full_name,
      user_role: currentUser.role,
      details: `建立並送出 RFI 單據，圖號: ${newRFI.reference_spec_no || '無'}，工期影響: ${newRFI.schedule_impact ? `${newRFI.schedule_days_impact}天` : '否'}。`,
      timestamp: new Date().toISOString()
    };
    this.rfiAuditLogs.unshift(auditLog);
    this.saveToStorage(STORAGE_KEYS.RFI_AUDIT_LOGS, this.rfiAuditLogs);
    this.apiRequest('/api/rfis', 'POST', newRFI);
    this.apiRequest('/api/rfi-audit-logs', 'POST', auditLog);

    this.logApi('POST', `/api/v1/projects/${rfiData.project_id}/rfis`, rfiData, newRFI, 201);
    this.broadcastRealtime(
      'RFI_CREATED',
      '新 RFI 提出',
      `${currentUser.full_name} 提出了正式諮詢「${newRFI.rfi_number} - ${newRFI.subject}」`
    );
    this.notify();
    return newRFI;
  }

  // PUT /api/v1/rfis/:rfiId/status
  public updateRFIStatus(rfiId: string, status: RFIStatus, comment?: string) {
    const rfi = this.rfis.find((r) => r.id === rfiId);
    if (!rfi) return;

    const currentUser = this.getCurrentUser();
    const prevStatus = rfi.status;
    rfi.status = status;

    this.saveToStorage(STORAGE_KEYS.RFIS, this.rfis);

    // Audit Trail
    const auditLog: RFIAuditLog = {
      id: 'log-' + Date.now(),
      rfi_id: rfiId,
      action: 'STATUS_CHANGED',
      user_id: currentUser.id,
      user_name: currentUser.full_name,
      user_role: currentUser.role,
      details: `狀態由 ${prevStatus} 變更為 ${status}。${comment ? ` 備註: ${comment}` : ''}`,
      timestamp: new Date().toISOString()
    };
    this.rfiAuditLogs.unshift(auditLog);
    this.saveToStorage(STORAGE_KEYS.RFI_AUDIT_LOGS, this.rfiAuditLogs);
    this.apiRequest('/api/rfis/' + rfiId, 'PUT', { status });
    this.apiRequest('/api/rfi-audit-logs', 'POST', auditLog);

    this.logApi('PUT', `/api/v1/rfis/${rfiId}/status`, { status, comment }, { success: true });
    this.broadcastRealtime(
      'RFI_STATUS_CHANGED',
      'RFI 狀態流轉',
      `RFI ${rfi.rfi_number} 狀態已變更為「${status}」`
    );
    this.notify();
  }

  // POST /api/v1/rfis/:rfiId/reply
  public replyRFI(rfiId: string, officialReply: string) {
    const rfi = this.rfis.find((r) => r.id === rfiId);
    if (!rfi) return;

    const currentUser = this.getCurrentUser();
    rfi.official_reply = officialReply;
    rfi.status = 'ANSWERED';
    rfi.answered_at = new Date().toISOString();
    rfi.answered_by = currentUser.id;

    this.saveToStorage(STORAGE_KEYS.RFIS, this.rfis);

    const auditLog: RFIAuditLog = {
      id: 'log-' + Date.now(),
      rfi_id: rfiId,
      action: 'OFFICIAL_REPLY',
      user_id: currentUser.id,
      user_name: currentUser.full_name,
      user_role: currentUser.role,
      details: `審查人員已提交官方正式回覆，狀態流轉為 ANSWERED。`,
      timestamp: new Date().toISOString()
    };
    this.rfiAuditLogs.unshift(auditLog);
    this.saveToStorage(STORAGE_KEYS.RFI_AUDIT_LOGS, this.rfiAuditLogs);
    this.apiRequest('/api/rfis/' + rfiId, 'PUT', { official_reply: officialReply, status: 'ANSWERED', answered_at: rfi.answered_at, answered_by: rfi.answered_by });
    this.apiRequest('/api/rfi-audit-logs', 'POST', auditLog);

    this.logApi('POST', `/api/v1/rfis/${rfiId}/reply`, { officialReply }, { success: true });
    this.broadcastRealtime(
      'RFI_STATUS_CHANGED',
      'RFI 官方回覆',
      `${currentUser.full_name} 已就「${rfi.rfi_number}」提出正式官方回覆！`
    );
    this.notify();
  }

  // POST /api/v1/rfis/:rfiId/close
  public closeRFI(rfiId: string, resolutionNote?: string) {
    const rfi = this.rfis.find((r) => r.id === rfiId);
    if (!rfi) return;

    const currentUser = this.getCurrentUser();
    rfi.status = 'CLOSED';
    rfi.closed_at = new Date().toISOString();
    rfi.closed_by = currentUser.id;

    this.saveToStorage(STORAGE_KEYS.RFIS, this.rfis);

    const auditLog: RFIAuditLog = {
      id: 'log-' + Date.now(),
      rfi_id: rfiId,
      action: 'CLOSE_RFI',
      user_id: currentUser.id,
      user_name: currentUser.full_name,
      user_role: currentUser.role,
      details: `完成 RFI 結案審查並正式歸檔。${resolutionNote ? ` 備註: ${resolutionNote}` : ''}`,
      timestamp: new Date().toISOString()
    };
    this.rfiAuditLogs.unshift(auditLog);
    this.saveToStorage(STORAGE_KEYS.RFI_AUDIT_LOGS, this.rfiAuditLogs);
    this.apiRequest('/api/rfis/' + rfiId, 'PUT', { status: 'CLOSED', closed_at: rfi.closed_at, closed_by: rfi.closed_by });
    this.apiRequest('/api/rfi-audit-logs', 'POST', auditLog);

    this.logApi('POST', `/api/v1/rfis/${rfiId}/close`, { resolutionNote }, { success: true });
    this.broadcastRealtime('RFI_STATUS_CHANGED', 'RFI 結案存證', `RFI ${rfi.rfi_number} 已由 ${currentUser.full_name} 正式結案！`);
    this.notify();
  }

  public getRFIAuditLogs(rfiId: string): RFIAuditLog[] {
    return this.rfiAuditLogs.filter((l) => l.rfi_id === rfiId).sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
  }

  // --- Attachments & Clipboard Integration ---
  // POST /api/v1/attachments/presigned-url
  public getPresignedUrl(fileName: string, mimeType: string, fileSize: number) {
    const fileKey = `uploads/${Date.now()}_${encodeURIComponent(fileName)}`;
    const mockS3UploadUrl = `https://storage.enterprise-pms.internal/bucket-prod/${fileKey}?X-Amz-Expires=3600&X-Amz-Signature=mock_sha256_${Date.now()}`;
    const publicUrl = `https://storage.enterprise-pms.internal/cdn/${fileKey}`;

    this.logApi(
      'POST',
      '/api/v1/attachments/presigned-url',
      { fileName, mimeType, fileSize },
      { uploadUrl: mockS3UploadUrl, fileKey, publicUrl, expiresIn: 3600 }
    );

    return {
      uploadUrl: mockS3UploadUrl,
      fileKey,
      publicUrl
    };
  }

  // POST /api/v1/attachments/confirm
  public confirmAttachment(attachmentData: {
    target_type: 'TASK' | 'RFI' | 'COMMENT';
    target_id: string;
    file_name: string;
    file_size: number;
    file_url: string;
    mime_type: string;
    is_clipboard?: boolean;
  }): Attachment {
    const currentUser = this.getCurrentUser();
    const newAtt: Attachment = {
      id: 'att-' + Date.now().toString(36),
      ...attachmentData,
      uploader_id: currentUser.id,
      uploader_name: currentUser.full_name,
      created_at: new Date().toISOString()
    };

    this.attachments.push(newAtt);
    this.saveToStorage(STORAGE_KEYS.ATTACHMENTS, this.attachments);
    this.apiRequest('/api/attachments', 'POST', newAtt);

    // If target is RFI, log to audit trail
    if (attachmentData.target_type === 'RFI') {
      const auditLog: RFIAuditLog = {
        id: 'log-' + Date.now(),
        rfi_id: attachmentData.target_id,
        action: 'ATTACHMENT_UPLOADED',
        user_id: currentUser.id,
        user_name: currentUser.full_name,
        user_role: currentUser.role,
        details: `${attachmentData.is_clipboard ? '剪貼簿貼圖' : '檔案上傳'}: ${newAtt.file_name} (${(newAtt.file_size / 1024 / 1024).toFixed(2)} MB)`,
        timestamp: new Date().toISOString()
      };
      this.rfiAuditLogs.unshift(auditLog);
      this.saveToStorage(STORAGE_KEYS.RFI_AUDIT_LOGS, this.rfiAuditLogs);
      this.apiRequest('/api/rfi-audit-logs', 'POST', auditLog);
    }

    this.logApi('POST', '/api/v1/attachments/confirm', attachmentData, newAtt, 201);
    this.broadcastRealtime(
      'ATTACHMENT_UPLOADED',
      '新附件上傳',
      `${currentUser.full_name} 上傳了附件「${newAtt.file_name}」`
    );
    this.notify();
    return newAtt;
  }

  public getAttachments(targetType: 'TASK' | 'RFI' | 'COMMENT', targetId: string): Attachment[] {
    return this.attachments.filter((a) => a.target_type === targetType && a.target_id === targetId);
  }

  public deleteAttachment(attachmentId: string) {
    this.attachments = this.attachments.filter((a) => a.id !== attachmentId);
    this.saveToStorage(STORAGE_KEYS.ATTACHMENTS, this.attachments);
    this.apiRequest('/api/attachments/' + attachmentId, 'DELETE');
    this.logApi('DELETE', `/api/v1/attachments/${attachmentId}`, {}, { success: true });
    this.notify();
  }

  // Comments
  public getComments(taskId: string): TaskComment[] {
    return this.comments.filter((c) => c.task_id === taskId).sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime());
  }

  public addComment(taskId: string, content: string): TaskComment {
    const currentUser = this.getCurrentUser();
    const comment: TaskComment = {
      id: 'cmt-' + Date.now(),
      task_id: taskId,
      author_id: currentUser.id,
      author_name: currentUser.full_name,
      content,
      created_at: new Date().toISOString()
    };
    this.comments.push(comment);
    this.saveToStorage(STORAGE_KEYS.COMMENTS, this.comments);
    this.apiRequest('/api/comments', 'POST', comment);
    this.logApi('POST', `/api/v1/tasks/${taskId}/comments`, { content }, comment, 201);
    this.notify();
    return comment;
  }

  // Logs & Notifications
  public getApiLogs(): ApiLogEntry[] {
    return this.apiLogs;
  }

  public getNotifications(userId?: string): Notification[] {
    if (!this.notifications.length) {
      // Seed some initial demo notifications if empty
      this.notifications = [
        {
          id: 'notif-1',
          type: 'RFI_OVERDUE',
          title: 'RFI 回覆期限逾期警告',
          message: '單號 RFI-PJ01-2026-0001 已逾期 3 天，請業主審查人員儘速核定官方回覆。',
          is_read: false,
          created_at: new Date(Date.now() - 3600000).toISOString()
        },
        {
          id: 'notif-2',
          type: 'WIP_LIMIT_ALERT',
          title: '看板 WIP 容量超額預警',
          message: '「進行中」欄位當前已達 4 張卡片，接近 WIP 限制 (4)，請注意工作流阻塞。',
          is_read: false,
          created_at: new Date(Date.now() - 7200000).toISOString()
        }
      ];
    }
    return this.notifications;
  }

  public markNotificationRead(id: string) {
    const notif = this.notifications.find((n) => n.id === id);
    if (notif) {
      notif.is_read = true;
      this.apiRequest('/api/notifications/' + id + '/read', 'PUT');
      this.notify();
    }
  }

  public markAllNotificationsRead(userId?: string) {
    this.notifications.forEach((n) => {
      n.is_read = true;
    });
    this.apiRequest('/api/notifications/read-all', 'PUT');
    this.notify();
  }

  public clearNotifications() {
    this.notifications = [];
    this.notify();
  }

  // Overdue check helper
  public isRFIOverdue(rfi: RFI): boolean {
    if (!rfi.due_date) return false;
    if (rfi.status === 'CLOSED' || rfi.status === 'ANSWERED' || rfi.status === 'REJECTED') return false;
    return new Date(rfi.due_date).getTime() < Date.now();
  }

  public isTaskOverdue(task: Task): boolean {
    if (!task.due_date) return false;
    const col = this.columns.find((c) => c.id === task.column_id);
    if (col && (col.name.includes('Done') || col.name.includes('完成'))) return false;
    return new Date(task.due_date).getTime() < Date.now();
  }

  // Lunch Order Management Methods
  public getLunchRestaurants(): LunchRestaurant[] {
    return this.lunchRestaurants;
  }

  public async fetchLunchRestaurants() {
    try {
      const data = await this.apiRequest('/api/lunch/restaurants', 'GET');
      if (Array.isArray(data)) {
        this.lunchRestaurants = data;
        this.notify();
      }
    } catch (e) {
      console.warn('Failed to fetch lunch restaurants:', e);
    }
  }

  
  public async updateLunchRestaurant(restaurant: LunchRestaurant) {
    const idx = this.lunchRestaurants.findIndex(r => r.id === restaurant.id);
    if (idx !== -1) {
      this.lunchRestaurants[idx] = restaurant;
      this.notify();
    }
    try {
      await this.apiRequest('/api/lunch/restaurants/' + restaurant.id, 'PUT', restaurant);
      await this.fetchLunchRestaurants();
      await this.fetchLunchOrders();
    } catch (e) {
      console.warn('Failed to update lunch restaurant:', e);
    }
  }

  public async createLunchRestaurant(restaurant: LunchRestaurant) {
    this.lunchRestaurants.push(restaurant);
    this.notify();
    try {
      await this.apiRequest('/api/lunch/restaurants', 'POST', restaurant);
      await this.fetchLunchRestaurants();
    } catch (e) {
      console.warn('Failed to create lunch restaurant:', e);
    }
  }

  public getLunchOrders(): LunchOrder[] {
    return this.lunchOrders;
  }

  public async fetchLunchOrders() {
    try {
      const data = await this.apiRequest('/api/lunch/orders', 'GET');
      if (Array.isArray(data)) {
        this.lunchOrders = data;
        this.notify();
      }
    } catch (e) {
      console.warn('Failed to fetch lunch orders:', e);
    }
  }

  public async createLunchOrder(orderData: Partial<LunchOrder>) {
    const tempId = 'o_' + Date.now();
    const newOrder: LunchOrder = {
      id: tempId,
      title: orderData.title || '午餐團購',
      restaurant_id: orderData.restaurant_id || '',
      date: orderData.date || new Date().toISOString().split('T')[0],
      cutoff_time: orderData.cutoff_time || '12:00',
      status: 'OPEN',
      created_by: orderData.created_by || '同仁',
      created_at: new Date().toISOString(),
      items: []
    };
    this.lunchOrders.unshift(newOrder);
    this.notify();

    try {
      await this.apiRequest('/api/lunch/orders', 'POST', orderData);
      await this.fetchLunchOrders();
    } catch (e) {
      console.warn('Failed to create lunch order:', e);
    }
  }

  public async updateLunchOrderStatus(id: string, status: LunchOrderStatus) {
    const order = this.lunchOrders.find(o => o.id === id);
    if (order) {
      order.status = status;
      this.notify();
    }
    try {
      await this.apiRequest('/api/lunch/orders/' + id + '/status', 'PUT', { status });
      await this.fetchLunchOrders();
    } catch (e) {
      console.warn('Failed to update order status:', e);
    }
  }

  public async addLunchOrderItem(orderId: string, itemData: Partial<LunchOrderItem>) {
    const order = this.lunchOrders.find(o => o.id === orderId);
    if (order) {
      const newItem: LunchOrderItem = {
        id: 'i_' + Date.now(),
        order_id: orderId,
        user_id: itemData.user_id || 'u_guest',
        user_name: itemData.user_name || '同仁',
        item_name: itemData.item_name || '',
        price: itemData.price || 0,
        quantity: itemData.quantity || 1,
        note: itemData.note || '',
        is_paid: Boolean(itemData.is_paid),
        created_at: new Date().toISOString()
      };
      order.items.push(newItem);
      this.notify();
    }

    try {
      await this.apiRequest('/api/lunch/orders/' + orderId + '/items', 'POST', itemData);
      await this.fetchLunchOrders();
    } catch (e) {
      console.warn('Failed to add lunch order item:', e);
    }
  }

  public async toggleLunchItemPaid(itemId: string, isPaid: boolean) {
    this.lunchOrders.forEach(o => {
      const item = o.items.find(i => i.id === itemId);
      if (item) {
        item.is_paid = isPaid;
      }
    });
    this.notify();

    try {
      await this.apiRequest('/api/lunch/items/' + itemId + '/paid', 'PUT', { is_paid: isPaid });
      await this.fetchLunchOrders();
    } catch (e) {
      console.warn('Failed to toggle lunch item paid status:', e);
    }
  }

  public async deleteLunchOrderItem(itemId: string) {
    this.lunchOrders.forEach(o => {
      o.items = o.items.filter(i => i.id !== itemId);
    });
    this.notify();

    try {
      await this.apiRequest('/api/lunch/items/' + itemId, 'DELETE');
      await this.fetchLunchOrders();
    } catch (e) {
      console.warn('Failed to delete lunch item:', e);
    }
  }

}

export const storageService = new StorageService();
