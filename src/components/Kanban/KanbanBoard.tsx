import React, { useState, useEffect } from 'react';
import {
  Plus,
  Layers,
  Settings2,
  AlertTriangle,
  Search,
  Filter,
  Columns3,
  CalendarRange,
  GanttChart as GanttChartIcon,
  Flame,
  CheckCircle2,
  MoreVertical,
  X,
  Edit2,
  Trash2
} from 'lucide-react';
import { Board, BoardColumn, Task, User, Priority } from '../../types/pms';
import { storageService } from '../../services/storageService';
import { checkPermission } from '../../utils/rbac';
import { TaskCard } from './TaskCard';
import { TaskModal } from './TaskModal';
import { GanttChart } from './GanttChart';

interface KanbanBoardProps {
  projectId: string;
  currentUser: User;
  users: User[];
}

type SwimlaneMode = 'NONE' | 'PRIORITY' | 'MODULE';

export const KanbanBoard: React.FC<KanbanBoardProps> = ({ projectId, currentUser, users }) => {
  const [boards, setBoards] = useState<Board[]>([]);
  const [activeBoardId, setActiveBoardId] = useState<string>('');
  const [columns, setColumns] = useState<BoardColumn[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [viewMode, setViewMode] = useState<'KANBAN' | 'GANTT'>('KANBAN');
  const [swimlaneMode, setSwimlaneMode] = useState<SwimlaneMode>('NONE');

  // Search & Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedPriority, setSelectedPriority] = useState<Priority | 'ALL'>('ALL');

  // Modals
  const [isTaskModalOpen, setIsTaskModalOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [targetColumnIdForNewTask, setTargetColumnIdForNewTask] = useState<string | null>(null);

  // Column WIP Setting Modal
  const [editingColumn, setEditingColumn] = useState<BoardColumn | null>(null);
  const [isColumnModalOpen, setIsColumnModalOpen] = useState(false);
  const [colNameInput, setColNameInput] = useState('');
  const [colWipInput, setColWipInput] = useState<number>(0);
  const [isNewColumn, setIsNewColumn] = useState(false);

  // New Board Modal
  const [isNewBoardModalOpen, setIsNewBoardModalOpen] = useState(false);
  const [newBoardTitle, setNewBoardTitle] = useState('');
  const [newBoardDesc, setNewBoardDesc] = useState('');

  // Drag state
  const [draggedTask, setDraggedTask] = useState<Task | null>(null);
  const [dragOverColumnId, setDragOverColumnId] = useState<string | null>(null);

  // Subscribe to storage
  const loadData = () => {
    const projectBoards = storageService.getBoards(projectId);
    setBoards(projectBoards);

    const currentBoardId =
      activeBoardId && projectBoards.some((b) => b.id === activeBoardId)
        ? activeBoardId
        : projectBoards[0]?.id || '';

    setActiveBoardId(currentBoardId);

    if (currentBoardId) {
      setColumns(storageService.getColumns(currentBoardId));
      setTasks(storageService.getTasks());
    } else {
      setColumns([]);
      setTasks([]);
    }
  };

  useEffect(() => {
    loadData();
    const unsubscribe = storageService.subscribe(() => {
      loadData();
    });
    return unsubscribe;
  }, [projectId, activeBoardId]);

  const canEditColumns = checkPermission(currentUser.role, 'canEditBoardColumns');
  const canCreateTask = checkPermission(currentUser.role, 'canCreateTask');

  // Filter tasks
  const filteredTasks = tasks.filter((t) => {
    const matchesSearch =
      !searchQuery ||
      t.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      t.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      t.tags.some((tag) => tag.toLowerCase().includes(searchQuery.toLowerCase()));

    const matchesPriority = selectedPriority === 'ALL' || t.priority === selectedPriority;
    return matchesSearch && matchesPriority;
  });

  // Drag & Drop Handlers
  const handleDragStart = (e: React.DragEvent, task: Task) => {
    setDraggedTask(task);
    e.dataTransfer.setData('text/plain', task.id);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragOver = (e: React.DragEvent, columnId: string) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    if (dragOverColumnId !== columnId) {
      setDragOverColumnId(columnId);
    }
  };

  const handleDragLeave = (columnId: string) => {
    if (dragOverColumnId === columnId) {
      setDragOverColumnId(null);
    }
  };

  const handleDrop = (e: React.DragEvent, columnId: string) => {
    e.preventDefault();
    setDragOverColumnId(null);
    if (!draggedTask) return;

    const columnTasks = storageService.getTasks(columnId);
    storageService.moveTask(draggedTask.id, columnId, columnTasks.length);
    setDraggedTask(null);
  };

  // Open Column Setting Modal
  const openEditColumn = (col: BoardColumn) => {
    setEditingColumn(col);
    setColNameInput(col.name);
    setColWipInput(col.wip_limit);
    setIsNewColumn(false);
    setIsColumnModalOpen(true);
  };

  const openAddColumn = () => {
    setEditingColumn(null);
    setColNameInput('');
    setColWipInput(0);
    setIsNewColumn(true);
    setIsColumnModalOpen(true);
  };

  const handleSaveColumn = (e: React.FormEvent) => {
    e.preventDefault();
    if (!colNameInput.trim() || !activeBoardId) return;

    if (isNewColumn) {
      storageService.addColumn(activeBoardId, colNameInput.trim(), colWipInput);
    } else if (editingColumn) {
      storageService.updateColumn(editingColumn.id, colNameInput.trim(), colWipInput);
    }
    setIsColumnModalOpen(false);
  };

  const handleDeleteColumn = () => {
    if (!editingColumn) return;
    if (confirm(`確定要刪除欄位「${editingColumn.name}」嗎？欄位中的卡片將一併被移除。`)) {
      storageService.deleteColumn(editingColumn.id);
      setIsColumnModalOpen(false);
    }
  };

  const handleCreateBoard = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newBoardTitle.trim()) return;
    const newB = storageService.createBoard(projectId, newBoardTitle.trim(), newBoardDesc.trim());
    setActiveBoardId(newB.id);
    setIsNewBoardModalOpen(false);
    setNewBoardTitle('');
    setNewBoardDesc('');
  };

  // Swimlane definitions
  const priorityLanes: { key: Priority; label: string; dot: string }[] = [
    { key: 'URGENT', label: '🔥 緊急任務泳道 (Urgent)', dot: 'bg-red-500' },
    { key: 'HIGH', label: '⚠️ 高度優先泳道 (High)', dot: 'bg-amber-500' },
    { key: 'MEDIUM', label: '📌 中等常規泳道 (Medium)', dot: 'bg-blue-500' },
    { key: 'LOW', label: '🌱 低度備用泳道 (Low)', dot: 'bg-slate-400' }
  ];

  const moduleLanes = ['機電工程', '結構工程', '弱電工程', '消防安檢', '裝修工程', '一般工作'];

  return (
    <div id="kanban-module-root" className="flex flex-col h-full space-y-6">
      {/* Top Toolbar: Board selection, Swimlanes, Search & Add Actions */}
      <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4 bg-white p-4 border-2 border-black">
        {/* Left: Board Selector & View Switcher */}
        <div className="flex items-center gap-3 sm:gap-4 flex-wrap">
          {/* View Switcher Toggle: Kanban vs Gantt */}
          <div className="flex items-center border border-black p-0.5 bg-white shrink-0 font-mono text-xs uppercase">
            <button
              id="btn-switch-kanban-view"
              onClick={() => setViewMode('KANBAN')}
              className={`flex items-center gap-1.5 px-3 py-1.5 transition-colors ${
                viewMode === 'KANBAN'
                  ? 'bg-black text-white font-bold'
                  : 'text-[#525252] hover:text-black hover:bg-[#F5F5F5]'
              }`}
            >
              <Columns3 className="w-3.5 h-3.5" strokeWidth={1.5} />
              <span>KANBAN (看板)</span>
            </button>
            <button
              id="btn-switch-gantt-view"
              onClick={() => setViewMode('GANTT')}
              className={`flex items-center gap-1.5 px-3 py-1.5 transition-colors ${
                viewMode === 'GANTT'
                  ? 'bg-black text-white font-bold'
                  : 'text-[#525252] hover:text-black hover:bg-[#F5F5F5]'
              }`}
            >
              <GanttChartIcon className="w-3.5 h-3.5" strokeWidth={1.5} />
              <span>GANTT (甘特圖)</span>
            </button>
          </div>

          <div className="h-5 w-px bg-black hidden sm:block" />

          {/* Board Selector */}
          <div className="flex items-center gap-2">
            <span className="text-[11px] font-mono font-bold uppercase tracking-widest text-[#525252] hidden sm:inline">
              BOARD:
            </span>
            <div className="flex items-center gap-1.5 overflow-x-auto max-w-sm sm:max-w-md pb-1 sm:pb-0 font-mono text-xs uppercase">
              {boards.map((b) => (
                <button
                  key={b.id}
                  onClick={() => setActiveBoardId(b.id)}
                  className={`px-3 py-1.5 border transition-colors ${
                    activeBoardId === b.id
                      ? 'bg-black text-white border-black font-bold'
                      : 'bg-white text-black border-black hover:bg-[#F5F5F5]'
                  }`}
                >
                  {b.title}
                </button>
              ))}

              <button
                onClick={() => setIsNewBoardModalOpen(true)}
                className="px-2.5 py-1.5 border border-dashed border-black text-black hover:bg-black hover:text-white transition-colors flex items-center gap-1 shrink-0"
                title="新增專案看板"
              >
                <Plus className="w-3.5 h-3.5" strokeWidth={1.5} /> + NEW
              </button>
            </div>
          </div>
        </div>

        {/* Right: Swimlane Switcher, Filter, Search & Create Task Button (Kanban mode) */}
        {viewMode === 'KANBAN' ? (
          <div className="flex items-center gap-2.5 flex-wrap w-full lg:w-auto justify-start lg:justify-end">
            {/* Swimlane Toggle */}
            <div className="flex items-center border border-black p-0.5 bg-white font-mono text-xs uppercase">
              <button
                onClick={() => setSwimlaneMode('NONE')}
                className={`px-2.5 py-1 transition-colors ${
                  swimlaneMode === 'NONE'
                    ? 'bg-black text-white font-bold'
                    : 'text-[#525252] hover:text-black hover:bg-[#F5F5F5]'
                }`}
              >
                STANDARD
              </button>
              <button
                onClick={() => setSwimlaneMode('PRIORITY')}
                className={`px-2.5 py-1 transition-colors ${
                  swimlaneMode === 'PRIORITY'
                    ? 'bg-black text-white font-bold'
                    : 'text-[#525252] hover:text-black hover:bg-[#F5F5F5]'
                }`}
              >
                BY PRIORITY
              </button>
              <button
                onClick={() => setSwimlaneMode('MODULE')}
                className={`px-2.5 py-1 transition-colors ${
                  swimlaneMode === 'MODULE'
                    ? 'bg-black text-white font-bold'
                    : 'text-[#525252] hover:text-black hover:bg-[#F5F5F5]'
                }`}
              >
                BY MODULE
              </button>
            </div>

            {/* Search bar */}
            <div className="relative">
              <Search className="w-3.5 h-3.5 text-[#525252] absolute left-2.5 top-1/2 -translate-y-1/2" strokeWidth={1.5} />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="SEARCH TASKS..."
                className="pl-8 pr-3 py-1.5 text-xs font-mono border-2 border-black bg-white text-black placeholder:italic placeholder:text-[#525252] focus:outline-none w-36 sm:w-44"
              />
            </div>

            {/* Priority filter */}
            <select
              value={selectedPriority}
              onChange={(e) => setSelectedPriority(e.target.value as any)}
              className="px-2.5 py-1.5 text-xs font-mono uppercase border-2 border-black bg-white text-black focus:outline-none"
            >
              <option value="ALL">ALL PRIORITIES</option>
              <option value="URGENT">URGENT (緊急)</option>
              <option value="HIGH">HIGH (高重要)</option>
              <option value="MEDIUM">MEDIUM (中等)</option>
              <option value="LOW">LOW (低優先)</option>
            </select>

            {/* Create Task Button */}
            {canCreateTask && (
              <button
                id="btn-create-task-main"
                onClick={() => {
                  setEditingTask(null);
                  setTargetColumnIdForNewTask(columns[0]?.id || null);
                  setIsTaskModalOpen(true);
                }}
                className="btn-mono-primary"
              >
                <Plus className="w-3.5 h-3.5" strokeWidth={1.5} />
                + CREATE TASK
              </button>
            )}
          </div>
        ) : (
          <div className="flex items-center gap-2">
            <span className="text-xs font-mono uppercase tracking-wider px-3 py-1.5 border-2 border-black bg-black text-white font-bold flex items-center gap-1.5">
              <CalendarRange className="w-3.5 h-3.5" strokeWidth={1.5} />
              GANTT TIMELINE SCHEDULE
            </span>
          </div>
        )}
      </div>

      {/* Main View Container: Kanban Canvas or Gantt Chart */}
      {viewMode === 'GANTT' ? (
        <div className="flex-1 min-h-[620px]">
          <GanttChart
            tasks={tasks}
            columns={columns}
            users={users}
            currentUser={currentUser}
            onTaskClick={(task) => {
              setEditingTask(task);
              setIsTaskModalOpen(true);
            }}
            onAddTask={(colId) => {
              setEditingTask(null);
              setTargetColumnIdForNewTask(colId || columns[0]?.id || null);
              setIsTaskModalOpen(true);
            }}
            canCreateTask={canCreateTask}
          />
        </div>
      ) : (
        /* Main Board Canvas */
        <div
          id="kanban-canvas"
          className="flex-1 overflow-x-auto pb-4"
        >
        {swimlaneMode === 'NONE' ? (
          /* Standard Columns View (No Swimlane) */
          <div className="flex items-start gap-5 min-w-max">
            {columns.map((col) => {
              const colTasks = filteredTasks.filter((t) => t.column_id === col.id);
              const isOverWip = col.wip_limit > 0 && colTasks.length > col.wip_limit;
              const isAtWip = col.wip_limit > 0 && colTasks.length === col.wip_limit;
              const isDragTarget = dragOverColumnId === col.id;

              return (
                <div
                  key={col.id}
                  onDragOver={(e) => handleDragOver(e, col.id)}
                  onDragLeave={() => handleDragLeave(col.id)}
                  onDrop={(e) => handleDrop(e, col.id)}
                  className={`flex flex-col w-80 bg-white border-2 border-black transition-colors ${
                    isOverWip
                      ? 'border-4 border-black'
                      : isDragTarget
                      ? 'border-4 border-black bg-[#F5F5F5]'
                      : 'border-2 border-black'
                  }`}
                >
                  {/* Column Header */}
                  <div className="p-3.5 border-b-2 border-black bg-white">
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2 min-w-0">
                        <h3 className="text-sm font-display font-bold uppercase tracking-tight text-black truncate">
                          {col.name}
                        </h3>
                        <span
                          className={`px-1.5 py-0.5 text-[10px] font-mono uppercase tracking-wider border border-black ${
                            isOverWip
                              ? 'bg-black text-white font-bold'
                              : isAtWip
                              ? 'bg-[#E5E5E5] text-black font-bold'
                              : 'bg-white text-[#525252]'
                          }`}
                        >
                          {colTasks.length}
                          {col.wip_limit > 0 && ` / ${col.wip_limit}`}
                        </span>
                      </div>

                      <div className="flex items-center gap-1">
                        {canCreateTask && (
                          <button
                            onClick={() => {
                              setEditingTask(null);
                              setTargetColumnIdForNewTask(col.id);
                              setIsTaskModalOpen(true);
                            }}
                            className="p-1 border border-black hover:bg-black hover:text-white transition-colors"
                            title="新增至此欄位"
                          >
                            <Plus className="w-3.5 h-3.5" strokeWidth={1.5} />
                          </button>
                        )}
                        {canEditColumns && (
                          <button
                            onClick={() => openEditColumn(col)}
                            className="p-1 border border-black hover:bg-black hover:text-white transition-colors"
                            title="欄位設定與 WIP 上限"
                          >
                            <Settings2 className="w-3.5 h-3.5" strokeWidth={1.5} />
                          </button>
                        )}
                      </div>
                    </div>

                    {/* WIP Limit Alert Banner */}
                    {isOverWip && (
                      <div className="mt-2.5 px-2.5 py-1.5 bg-black text-white border border-black text-xs font-mono uppercase tracking-wider flex items-center gap-1.5">
                        <AlertTriangle className="w-3.5 h-3.5 shrink-0" strokeWidth={1.5} />
                        <span>[ WIP EXCEEDED +{colTasks.length - col.wip_limit} ]</span>
                      </div>
                    )}
                  </div>

                  {/* Tasks List */}
                  <div className="flex-1 p-3 space-y-3 min-h-[420px] max-h-[70vh] overflow-y-auto bg-white">
                    {colTasks.length === 0 ? (
                      <div className="h-32 flex flex-col items-center justify-center text-[#525252] text-xs font-mono uppercase tracking-wider border-2 border-dashed border-black">
                        [ DROP CARD HERE ]
                      </div>
                    ) : (
                      colTasks.map((t) => (
                        <TaskCard
                          key={t.id}
                          task={t}
                          users={users}
                          onClick={() => {
                            setEditingTask(t);
                            setIsTaskModalOpen(true);
                          }}
                          onDragStart={handleDragStart}
                        />
                      ))
                    )}
                  </div>
                </div>
              );
            })}

            {/* Add Column Button */}
            {canEditColumns && (
              <button
                onClick={openAddColumn}
                className="w-72 h-32 border-2 border-dashed border-black hover:bg-black hover:text-white text-black transition-colors flex flex-col items-center justify-center gap-2 shrink-0 font-mono text-xs uppercase tracking-widest"
              >
                <Plus className="w-5 h-5" strokeWidth={1.5} />
                <span>+ ADD COLUMN</span>
              </button>
            )}
          </div>
        ) : (
          /* Swimlanes View (By Priority or By Module) */
          <div className="space-y-6 min-w-max">
            {(swimlaneMode === 'PRIORITY' ? priorityLanes : moduleLanes.map(m => ({ key: m, label: m, dot: 'bg-black' }))).map(
              (lane) => {
                const laneTasks = filteredTasks.filter((t) =>
                  swimlaneMode === 'PRIORITY'
                    ? t.priority === lane.key
                    : t.module_category === lane.key
                );

                return (
                  <div
                    key={lane.key}
                    className="bg-white border-2 border-black p-4"
                  >
                    {/* Swimlane Header */}
                    <div className="flex items-center gap-2 mb-3 pb-2 border-b-2 border-black">
                      <span className="w-2.5 h-2.5 bg-black" />
                      <h3 className="text-sm font-display font-bold uppercase tracking-tight text-black">
                        {lane.label}
                      </h3>
                      <span className="text-xs font-mono px-2 py-0.5 border border-black bg-black text-white uppercase tracking-wider">
                        {laneTasks.length} TASKS
                      </span>
                    </div>

                    {/* Columns in Swimlane */}
                    <div className="flex items-start gap-4">
                      {columns.map((col) => {
                        const cellTasks = laneTasks.filter((t) => t.column_id === col.id);
                        const isDragTarget = dragOverColumnId === col.id;

                        return (
                          <div
                            key={col.id}
                            onDragOver={(e) => handleDragOver(e, col.id)}
                            onDragLeave={() => handleDragLeave(col.id)}
                            onDrop={(e) => handleDrop(e, col.id)}
                            className={`w-72 bg-white p-3 border-2 border-black transition-colors ${
                              isDragTarget ? 'border-4 border-black bg-[#F5F5F5]' : ''
                            }`}
                          >
                            <div className="text-xs font-mono uppercase tracking-wider text-[#525252] mb-2 flex justify-between border-b border-black pb-1">
                              <span>{col.name}</span>
                              <span className="font-bold text-black">{cellTasks.length}</span>
                            </div>

                            <div className="space-y-2.5 min-h-[120px]">
                              {cellTasks.map((t) => (
                                <TaskCard
                                  key={t.id}
                                  task={t}
                                  users={users}
                                  onClick={() => {
                                    setEditingTask(t);
                                    setIsTaskModalOpen(true);
                                  }}
                                  onDragStart={handleDragStart}
                                />
                              ))}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                );
              }
            )}
          </div>
        )}
      </div>
      )}

      {/* Task View / Create Modal */}
      {isTaskModalOpen && (
        <TaskModal
          task={editingTask}
          columnId={targetColumnIdForNewTask || columns[0]?.id}
          users={users}
          currentUser={currentUser}
          isOpen={isTaskModalOpen}
          onClose={() => setIsTaskModalOpen(false)}
          onSave={() => loadData()}
        />
      )}

      {/* Column WIP Limit & Setting Modal */}
      {isColumnModalOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 animate-in fade-in duration-100"
          onClick={() => setIsColumnModalOpen(false)}
        >
          <div
            className="w-full max-w-md bg-white border-4 border-black p-6 shadow-none"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b-2 border-black pb-3 mb-4">
              <h3 className="text-lg font-display font-bold uppercase tracking-tight text-black">
                {isNewColumn ? '新增看板欄位 / NEW COLUMN' : '欄位設定與 WIP 上限 / SETTINGS'}
              </h3>
              <button
                onClick={() => setIsColumnModalOpen(false)}
                className="p-1 border border-black hover:bg-black hover:text-white transition-colors"
              >
                <X className="w-4 h-4" strokeWidth={1.5} />
              </button>
            </div>

            <form onSubmit={handleSaveColumn} className="space-y-4">
              <div>
                <label className="block text-xs font-mono font-bold uppercase tracking-wider text-black mb-1.5">
                  欄位名稱 (COLUMN NAME) *
                </label>
                <input
                  type="text"
                  required
                  value={colNameInput}
                  onChange={(e) => setColNameInput(e.target.value)}
                  placeholder="例如：進行中、審查中、已完工驗收..."
                  className="w-full px-3 py-2 text-sm border-2 border-black bg-white text-black font-body placeholder:italic placeholder:text-[#525252] focus:outline-none"
                />
              </div>

              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="text-xs font-mono font-bold uppercase tracking-wider text-black">
                    WIP 限制 (WORK IN PROGRESS LIMIT)
                  </label>
                  <span className="text-[11px] font-mono text-[#525252]">[ 0 = UNLIMITED ]</span>
                </div>
                <input
                  type="number"
                  min="0"
                  max="100"
                  value={colWipInput}
                  onChange={(e) => setColWipInput(parseInt(e.target.value) || 0)}
                  className="w-full px-3 py-2 text-sm border-2 border-black bg-white text-black font-mono focus:outline-none"
                />
                <p className="text-xs font-body text-[#525252] mt-1">
                  當卡片數量大於此值時，系統將觸發警示並推播 WIP 預警通知。
                </p>
              </div>

              <div className="flex items-center justify-between pt-4 border-t-2 border-black">
                {!isNewColumn && (
                  <button
                    type="button"
                    onClick={handleDeleteColumn}
                    className="text-xs font-mono uppercase tracking-wider text-black underline hover:bg-black hover:text-white px-2 py-1 flex items-center gap-1 border border-black"
                  >
                    <Trash2 className="w-3.5 h-3.5" strokeWidth={1.5} /> 刪除欄位
                  </button>
                )}
                <div className="flex items-center gap-2 ml-auto">
                  <button
                    type="button"
                    onClick={() => setIsColumnModalOpen(false)}
                    className="btn-mono-outline"
                  >
                    取消
                  </button>
                  <button
                    type="submit"
                    className="btn-mono-primary"
                  >
                    儲存 →
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* New Board Modal */}
      {isNewBoardModalOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 animate-in fade-in duration-100"
          onClick={() => setIsNewBoardModalOpen(false)}
        >
          <div
            className="w-full max-w-md bg-white border-4 border-black p-6 shadow-none"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b-2 border-black pb-3 mb-4">
              <h3 className="text-lg font-display font-bold uppercase tracking-tight text-black">
                建立新敏捷看板 / NEW BOARD
              </h3>
              <button
                onClick={() => setIsNewBoardModalOpen(false)}
                className="p-1 border border-black hover:bg-black hover:text-white transition-colors"
              >
                <X className="w-4 h-4" strokeWidth={1.5} />
              </button>
            </div>

            <form onSubmit={handleCreateBoard} className="space-y-4">
              <div>
                <label className="block text-xs font-mono font-bold uppercase tracking-wider text-black mb-1.5">
                  看板標題 (BOARD TITLE) *
                </label>
                <input
                  type="text"
                  required
                  value={newBoardTitle}
                  onChange={(e) => setNewBoardTitle(e.target.value)}
                  placeholder="例如：施工驗收看板、BIM 碰撞檢討、維運保固排程..."
                  className="w-full px-3 py-2 text-sm border-2 border-black bg-white text-black font-body placeholder:italic placeholder:text-[#525252] focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-mono font-bold uppercase tracking-wider text-black mb-1.5">
                  看板說明 / 適用工區
                </label>
                <textarea
                  rows={3}
                  value={newBoardDesc}
                  onChange={(e) => setNewBoardDesc(e.target.value)}
                  placeholder="描述此看板之工作流程、適用範圍或檢驗標準..."
                  className="w-full px-3 py-2 text-sm border-2 border-black bg-white text-black font-body placeholder:italic placeholder:text-[#525252] focus:outline-none"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-4 border-t-2 border-black">
                <button
                  type="button"
                  onClick={() => setIsNewBoardModalOpen(false)}
                  className="btn-mono-outline"
                >
                  取消
                </button>
                <button
                  type="submit"
                  className="btn-mono-primary"
                >
                  建立看板 →
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
