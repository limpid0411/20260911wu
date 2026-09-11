import React, { useState, useMemo, useRef, useEffect } from 'react';
import {
  CalendarRange,
  ChevronLeft,
  ChevronRight,
  Plus,
  Search,
  Filter,
  AlertTriangle,
  Clock,
  CheckCircle2,
  Calendar,
  Layers,
  ChevronDown,
  ChevronUp,
  User as UserIcon
} from 'lucide-react';
import { BoardColumn, Task, User, Priority } from '../../types/pms';
import { storageService } from '../../services/storageService';

interface GanttChartProps {
  tasks: Task[];
  columns: BoardColumn[];
  users: User[];
  currentUser: User;
  onTaskClick: (task: Task) => void;
  onAddTask: (columnId?: string) => void;
  canCreateTask: boolean;
}

type GroupByOption = 'COLUMN' | 'MODULE' | 'PRIORITY' | 'NONE';
type ViewRangeOption = '14' | '30' | '60';

const PRIORITY_BADGES: Record<Priority, { label: string; color: string; dot: string }> = {
  LOW: { label: 'LOW', color: 'bg-white text-black border border-black', dot: 'bg-black/30' },
  MEDIUM: { label: 'MED', color: 'bg-[#F5F5F5] text-black border border-black', dot: 'bg-black/60' },
  NORMAL: { label: 'NORM', color: 'bg-[#F5F5F5] text-black border border-black', dot: 'bg-black/60' },
  HIGH: { label: 'HIGH', color: 'bg-[#525252] text-white border border-black', dot: 'bg-black' },
  URGENT: { label: 'URGENT', color: 'bg-black text-white border border-black', dot: 'bg-black' }
};

export const GanttChart: React.FC<GanttChartProps> = ({
  tasks,
  columns,
  users,
  currentUser,
  onTaskClick,
  onAddTask,
  canCreateTask
}) => {
  const [groupBy, setGroupBy] = useState<GroupByOption>('COLUMN');
  const [viewRange, setViewRange] = useState<ViewRangeOption>('30');
  const [collapsedGroups, setCollapsedGroups] = useState<Record<string, boolean>>({});
  const [searchQuery, setSearchQuery] = useState('');
  const [priorityFilter, setPriorityFilter] = useState<Priority | 'ALL'>('ALL');
  const [moduleFilter, setModuleFilter] = useState<string>('ALL');

  // Timeline offset from today (in days)
  const [dayOffset, setDayOffset] = useState<number>(-5);

  const timelineContainerRef = useRef<HTMLDivElement>(null);

  // Column pixel width per day
  const dayWidth = viewRange === '14' ? 52 : viewRange === '30' ? 42 : 30;
  const numDays = parseInt(viewRange, 10);

  // Generate date array
  const dateRange = useMemo(() => {
    const dates: Date[] = [];
    const base = new Date();
    base.setHours(0, 0, 0, 0);
    base.setDate(base.getDate() + dayOffset);

    for (let i = 0; i < numDays; i++) {
      const d = new Date(base);
      d.setDate(base.getDate() + i);
      dates.push(d);
    }
    return dates;
  }, [dayOffset, numDays]);

  const startDate = dateRange[0];
  const endDate = dateRange[dateRange.length - 1];

  // Group months for header
  const monthGroups = useMemo(() => {
    const groups: { label: string; span: number }[] = [];
    let currentMonth = '';
    let currentSpan = 0;

    dateRange.forEach((d) => {
      const mLabel = `${d.getFullYear()}年 ${d.getMonth() + 1}月`;
      if (mLabel === currentMonth) {
        currentSpan++;
      } else {
        if (currentMonth) {
          groups.push({ label: currentMonth, span: currentSpan });
        }
        currentMonth = mLabel;
        currentSpan = 1;
      }
    });
    if (currentSpan > 0) {
      groups.push({ label: currentMonth, span: currentSpan });
    }
    return groups;
  }, [dateRange]);

  // Check if today falls in range and calculate its X position
  const todayPos = useMemo(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const start = new Date(startDate);
    start.setHours(0, 0, 0, 0);

    const diffDays = Math.round((today.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));
    if (diffDays >= 0 && diffDays < numDays) {
      return diffDays * dayWidth + dayWidth / 2;
    }
    return null;
  }, [startDate, numDays, dayWidth]);

  // Scroll to today when range shifts
  useEffect(() => {
    if (todayPos && timelineContainerRef.current) {
      // Gentle center scroll
      const container = timelineContainerRef.current;
      const targetScroll = todayPos - container.clientWidth / 2 + 100;
      container.scrollTo({ left: Math.max(0, targetScroll), behavior: 'smooth' });
    }
  }, [todayPos, viewRange]);

  // Filter tasks
  const filteredTasks = useMemo(() => {
    return tasks.filter((t) => {
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchTitle = t.title.toLowerCase().includes(q);
        const matchTags = t.tags.some((tag) => tag.toLowerCase().includes(q));
        const matchDesc = t.description?.toLowerCase().includes(q);
        if (!matchTitle && !matchTags && !matchDesc) return false;
      }
      if (priorityFilter !== 'ALL' && t.priority !== priorityFilter) {
        return false;
      }
      if (moduleFilter !== 'ALL' && t.module_category !== moduleFilter) {
        return false;
      }
      return true;
    });
  }, [tasks, searchQuery, priorityFilter, moduleFilter]);

  // Unique modules
  const allModules = useMemo(() => {
    const set = new Set<string>();
    tasks.forEach((t) => {
      if (t.module_category) set.add(t.module_category);
    });
    return Array.from(set);
  }, [tasks]);

  // Group tasks
  const taskGroups = useMemo(() => {
    if (groupBy === 'NONE') {
      return [
        {
          id: 'all',
          title: '全部任務時間軸',
          subtitle: `共 ${filteredTasks.length} 項任務`,
          tasks: filteredTasks
        }
      ];
    }

    if (groupBy === 'COLUMN') {
      return columns.map((col) => {
        const colTasks = filteredTasks.filter((t) => t.column_id === col.id);
        return {
          id: col.id,
          title: col.name,
          subtitle: `WIP: ${colTasks.length} / ${col.wip_limit > 0 ? col.wip_limit : '無上限'}`,
          tasks: colTasks
        };
      });
    }

    if (groupBy === 'MODULE') {
      const groupsMap: Record<string, Task[]> = {};
      filteredTasks.forEach((t) => {
        const mod = t.module_category || '一般工作';
        if (!groupsMap[mod]) groupsMap[mod] = [];
        groupsMap[mod].push(t);
      });
      return Object.entries(groupsMap).map(([modName, modTasks]) => ({
        id: modName,
        title: modName,
        subtitle: `${modTasks.length} 項任務`,
        tasks: modTasks
      }));
    }

    if (groupBy === 'PRIORITY') {
      const priorities: Priority[] = ['URGENT', 'HIGH', 'MEDIUM', 'LOW'];
      return priorities.map((p) => {
        const pTasks = filteredTasks.filter((t) => t.priority === p || (p === 'MEDIUM' && t.priority === 'NORMAL'));
        const pInfo = PRIORITY_BADGES[p];
        return {
          id: p,
          title: `優先級: ${pInfo.label}`,
          subtitle: `${pTasks.length} 項任務`,
          tasks: pTasks
        };
      });
    }

    return [];
  }, [groupBy, columns, filteredTasks]);

  const toggleGroup = (groupId: string) => {
    setCollapsedGroups((prev) => ({
      ...prev,
      [groupId]: !prev[groupId]
    }));
  };

  // Helper to compute start and end positions for a task
  const getTaskCoordinates = (task: Task) => {
    const taskStart = new Date(task.created_at || Date.now());
    taskStart.setHours(0, 0, 0, 0);

    let taskEnd: Date;
    if (task.due_date) {
      taskEnd = new Date(task.due_date);
    } else {
      // Default duration: 4 days from taskStart
      taskEnd = new Date(taskStart);
      taskEnd.setDate(taskEnd.getDate() + 4);
    }
    taskEnd.setHours(0, 0, 0, 0);

    // If taskEnd is before taskStart, adjust taskEnd
    if (taskEnd.getTime() < taskStart.getTime()) {
      taskEnd = new Date(taskStart);
      taskEnd.setDate(taskEnd.getDate() + 1);
    }

    const timelineStart = new Date(startDate);
    timelineStart.setHours(0, 0, 0, 0);

    const startDiffDays = (taskStart.getTime() - timelineStart.getTime()) / (1000 * 60 * 60 * 24);
    const durationDays = Math.max(1, Math.round((taskEnd.getTime() - taskStart.getTime()) / (1000 * 60 * 60 * 24)) + 1);

    const left = startDiffDays * dayWidth;
    const width = Math.max(dayWidth * 0.9, durationDays * dayWidth);

    const isOverdue = storageService.isTaskOverdue(task);

    // Progress determination
    const col = columns.find((c) => c.id === task.column_id);
    let progress = 30;
    let colColor = 'bg-black text-white';
    let borderColor = 'border-black';

    if (col) {
      if (col.name.includes('完成') || col.name.includes('Done')) {
        progress = 100;
        colColor = 'bg-black text-white';
        borderColor = 'border-black';
      } else if (col.name.includes('審核') || col.name.includes('Review')) {
        progress = 85;
        colColor = 'bg-[#525252] text-white';
        borderColor = 'border-black';
      } else if (col.name.includes('進行') || col.name.includes('Progress')) {
        progress = 55;
        colColor = 'bg-black text-white';
        borderColor = 'border-black';
      } else {
        progress = 15;
        colColor = 'bg-[#737373] text-white';
        borderColor = 'border-black';
      }
    }

    if (isOverdue && progress < 100) {
      colColor = 'bg-black text-white';
      borderColor = 'border-black border-dashed';
    }

    return {
      left,
      width,
      durationDays,
      taskStart,
      taskEnd,
      isOverdue,
      progress,
      colColor,
      borderColor
    };
  };

  // KPIs
  const stats = useMemo(() => {
    const total = tasks.length;
    let overdueCount = 0;
    let completedCount = 0;
    let totalEstHours = 0;

    tasks.forEach((t) => {
      if (storageService.isTaskOverdue(t)) overdueCount++;
      const col = columns.find((c) => c.id === t.column_id);
      if (col && (col.name.includes('完成') || col.name.includes('Done'))) {
        completedCount++;
      }
      totalEstHours += t.estimated_hours || 0;
    });

    return { total, overdueCount, completedCount, totalEstHours };
  }, [tasks, columns]);

  return (
    <div className="flex flex-col h-full bg-white border-2 border-black overflow-hidden font-mono">
      {/* Top Toolbar */}
      <div className="p-4 border-b-2 border-black bg-[#F5F5F5] flex flex-col gap-3">
        {/* Row 1: KPI Stats & Filter Controls */}
        <div className="flex items-center justify-between flex-wrap gap-3">
          {/* Quick Metrics */}
          <div className="flex items-center gap-2 sm:gap-3">
            <div className="flex items-center gap-1.5 px-3 py-1.5 bg-white border-2 border-black text-xs">
              <Layers className="w-3.5 h-3.5 text-black" strokeWidth={1.5} />
              <span className="text-[#525252]">TASKS:</span>
              <span className="font-bold text-black">{stats.total}</span>
            </div>
            <div className="flex items-center gap-1.5 px-3 py-1.5 bg-white border-2 border-black text-xs">
              <CheckCircle2 className="w-3.5 h-3.5 text-black" strokeWidth={1.5} />
              <span className="text-[#525252]">DONE:</span>
              <span className="font-bold text-black">{stats.completedCount}</span>
            </div>
            <div className="flex items-center gap-1.5 px-3 py-1.5 bg-white border-2 border-black text-xs">
              <AlertTriangle className="w-3.5 h-3.5 text-black" strokeWidth={1.5} />
              <span className="text-[#525252]">OVERDUE:</span>
              <span className={`font-bold ${stats.overdueCount > 0 ? 'text-black underline' : 'text-black'}`}>
                {stats.overdueCount}
              </span>
            </div>
            <div className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 bg-white border-2 border-black text-xs">
              <Clock className="w-3.5 h-3.5 text-black" strokeWidth={1.5} />
              <span className="text-[#525252]">EST HOURS:</span>
              <span className="font-bold text-black">{stats.totalEstHours}h</span>
            </div>
          </div>

          {/* Action: Add Task Button */}
          {canCreateTask && (
            <button
              onClick={() => onAddTask()}
              className="btn-mono-primary inline-flex items-center gap-1.5 shrink-0"
            >
              <Plus className="w-3.5 h-3.5" strokeWidth={1.5} />
              ADD TASK (新增任務)
            </button>
          )}
        </div>

        {/* Row 2: Navigation & Filter Bar */}
        <div className="flex items-center justify-between flex-wrap gap-2 pt-1 border-t border-black/20">
          {/* Left: Timeline Navigation & Range */}
          <div className="flex items-center gap-2 flex-wrap">
            {/* Range Selector */}
            <div className="flex items-center bg-white border-2 border-black p-0.5">
              <button
                onClick={() => setViewRange('14')}
                className={`px-2.5 py-1 text-xs font-mono font-bold transition-colors ${
                  viewRange === '14'
                    ? 'bg-black text-white'
                    : 'text-black hover:bg-[#F5F5F5]'
                }`}
              >
                14D
              </button>
              <button
                onClick={() => setViewRange('30')}
                className={`px-2.5 py-1 text-xs font-mono font-bold transition-colors ${
                  viewRange === '30'
                    ? 'bg-black text-white'
                    : 'text-black hover:bg-[#F5F5F5]'
                }`}
              >
                30D
              </button>
              <button
                onClick={() => setViewRange('60')}
                className={`px-2.5 py-1 text-xs font-mono font-bold transition-colors ${
                  viewRange === '60'
                    ? 'bg-black text-white'
                    : 'text-black hover:bg-[#F5F5F5]'
                }`}
              >
                60D
              </button>
            </div>

            {/* Navigation Arrows */}
            <div className="flex items-center gap-1">
              <button
                onClick={() => setDayOffset((prev) => prev - (numDays > 30 ? 14 : 7))}
                className="p-1.5 border-2 border-black bg-white text-black hover:bg-black hover:text-white transition-colors"
                title="前移時間區間"
              >
                <ChevronLeft className="w-4 h-4" strokeWidth={1.5} />
              </button>
              <button
                onClick={() => setDayOffset(-5)}
                className="px-2.5 py-1 border-2 border-black bg-white text-xs font-mono font-bold text-black hover:bg-[#F5F5F5] transition-colors"
              >
                TODAY (今天)
              </button>
              <button
                onClick={() => setDayOffset((prev) => prev + (numDays > 30 ? 14 : 7))}
                className="p-1.5 border-2 border-black bg-white text-black hover:bg-black hover:text-white transition-colors"
                title="後移時間區間"
              >
                <ChevronRight className="w-4 h-4" strokeWidth={1.5} />
              </button>
            </div>

            {/* Date Span Display */}
            <div className="text-xs font-mono text-[#525252] pl-1">
              [{startDate.toLocaleDateString()} — {endDate.toLocaleDateString()}]
            </div>
          </div>

          {/* Right: Group By & Search & Filters */}
          <div className="flex items-center gap-2 flex-wrap">
            {/* Group By selector */}
            <div className="flex items-center gap-1.5 text-xs">
              <span className="hidden md:inline text-[#525252]">GROUP:</span>
              <select
                value={groupBy}
                onChange={(e) => setGroupBy(e.target.value as GroupByOption)}
                className="px-2 py-1 text-xs border-2 border-black bg-white text-black focus:outline-none"
              >
                <option value="COLUMN">BY COLUMN (依看板)</option>
                <option value="MODULE">BY MODULE (依模組)</option>
                <option value="PRIORITY">BY PRIORITY (依優先級)</option>
                <option value="NONE">ALL (不分組)</option>
              </select>
            </div>

            {/* Search Input */}
            <div className="relative">
              <Search className="w-3.5 h-3.5 text-black absolute left-2 top-1/2 -translate-y-1/2" strokeWidth={1.5} />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="SEARCH TASKS..."
                className="pl-7 pr-2 py-1 text-xs border-2 border-black bg-white text-black uppercase focus:outline-none w-32 sm:w-40 placeholder:text-[#525252]"
              />
            </div>

            {/* Module Filter */}
            <select
              value={moduleFilter}
              onChange={(e) => setModuleFilter(e.target.value)}
              className="px-2 py-1 text-xs border-2 border-black bg-white text-black focus:outline-none"
            >
              <option value="ALL">ALL MODULES</option>
              {allModules.map((m) => (
                <option key={m} value={m}>
                  {m}
                </option>
              ))}
            </select>

            {/* Priority Filter */}
            <select
              value={priorityFilter}
              onChange={(e) => setPriorityFilter(e.target.value as any)}
              className="px-2 py-1 text-xs border-2 border-black bg-white text-black focus:outline-none"
            >
              <option value="ALL">ALL PRIORITY</option>
              <option value="URGENT">URGENT</option>
              <option value="HIGH">HIGH</option>
              <option value="MEDIUM">MEDIUM</option>
              <option value="LOW">LOW</option>
            </select>
          </div>
        </div>
      </div>

      {/* Main Gantt Body: Split into Left Task Table & Right Scrollable Timeline */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left Column: Fixed Task List */}
        <div className="w-72 sm:w-80 shrink-0 border-r-2 border-black bg-white flex flex-col z-10">
          {/* Header */}
          <div className="h-16 px-4 border-b-2 border-black flex items-center justify-between bg-[#F5F5F5] text-xs font-mono font-bold text-black uppercase">
            <span>TASK / ITEM</span>
            <span>ASSIGNEE / DUE</span>
          </div>

          {/* Task Rows List */}
          <div className="flex-1 overflow-y-auto divide-y border-t border-black">
            {taskGroups.map((group) => {
              const isCollapsed = Boolean(collapsedGroups[group.id]);
              return (
                <div key={group.id} className="divide-y divide-black/20">
                  {/* Group Header */}
                  <button
                    onClick={() => toggleGroup(group.id)}
                    className="w-full h-10 px-3 flex items-center justify-between bg-[#F5F5F5] hover:bg-[#E5E5E5] text-xs font-mono font-bold text-black border-b border-black transition-colors text-left"
                  >
                    <div className="flex items-center gap-1.5 truncate">
                      {isCollapsed ? (
                        <ChevronRight className="w-4 h-4 text-black shrink-0" strokeWidth={1.5} />
                      ) : (
                        <ChevronDown className="w-4 h-4 text-black shrink-0" strokeWidth={1.5} />
                      )}
                      <span className="truncate">{group.title}</span>
                    </div>
                    <span className="text-[11px] font-normal text-[#525252] shrink-0">{group.subtitle}</span>
                  </button>

                  {/* Task Items */}
                  {!isCollapsed &&
                    group.tasks.map((task) => {
                      const assignee = users.find((u) => u.id === task.assignee_id);
                      const isOverdue = storageService.isTaskOverdue(task);
                      const priority = PRIORITY_BADGES[task.priority] || PRIORITY_BADGES.MEDIUM;

                      return (
                        <div
                          key={task.id}
                          onClick={() => onTaskClick(task)}
                          className="h-12 px-3 flex items-center justify-between gap-2 hover:bg-[#F5F5F5] cursor-pointer transition-colors group border-b border-black/10"
                        >
                          <div className="flex items-center gap-2 min-w-0 flex-1">
                            <span
                              className={`w-2 h-2 shrink-0 ${priority.dot}`}
                              title={`PRIORITY: ${priority.label}`}
                            />
                            <div className="truncate">
                              <div className="text-xs font-bold text-black group-hover:underline truncate">
                                {task.title}
                              </div>
                              <div className="text-[10px] text-[#525252] truncate flex items-center gap-1.5">
                                <span>{task.module_category || 'GENERAL'}</span>
                                {isOverdue && (
                                  <span className="text-black font-bold flex items-center gap-0.5 underline">
                                    [!] OVERDUE
                                  </span>
                                )}
                              </div>
                            </div>
                          </div>

                          {/* Assignee & Due Date */}
                          <div className="flex items-center gap-2 shrink-0">
                            {assignee ? (
                              <img
                                src={assignee.avatar_url}
                                alt={assignee.full_name}
                                className="w-6 h-6 border border-black object-cover"
                                title={`ASSIGNEE: ${assignee.full_name}`}
                              />
                            ) : (
                              <div className="w-6 h-6 border border-black bg-white flex items-center justify-center text-black">
                                <UserIcon className="w-3 h-3" strokeWidth={1.5} />
                              </div>
                            )}
                            <span className="text-[11px] font-mono text-[#525252]">
                              {task.due_date ? task.due_date.slice(5, 10) : 'NONE'}
                            </span>
                          </div>
                        </div>
                      );
                    })}

                  {!isCollapsed && group.tasks.length === 0 && (
                    <div className="h-10 px-4 flex items-center text-xs text-[#525252] italic">
                      NO MATCHING TASKS
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Right Column: Scrollable Gantt Timeline Track */}
        <div ref={timelineContainerRef} className="flex-1 overflow-x-auto overflow-y-auto relative bg-white">
          <div
            style={{ width: `${numDays * dayWidth}px` }}
            className="min-w-full min-h-full flex flex-col relative"
          >
            {/* Timeline Header */}
            <div className="sticky top-0 z-20 bg-white border-b-2 border-black">
              {/* Month Row */}
              <div className="h-7 border-b border-black flex">
                {monthGroups.map((mg, i) => (
                  <div
                    key={i}
                    style={{ width: `${mg.span * dayWidth}px` }}
                    className="h-full px-3 flex items-center text-xs font-mono font-bold text-black border-r border-black bg-[#F5F5F5] truncate uppercase"
                  >
                    {mg.label}
                  </div>
                ))}
              </div>

              {/* Day & Weekday Row */}
              <div className="h-9 flex">
                {dateRange.map((d, i) => {
                  const dayNum = d.getDate();
                  const weekDay = ['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'][d.getDay()];
                  const isWeekend = d.getDay() === 0 || d.getDay() === 6;
                  const isToday =
                    d.toDateString() === new Date().toDateString();

                  return (
                    <div
                      key={i}
                      style={{ width: `${dayWidth}px` }}
                      className={`h-full flex flex-col items-center justify-center border-r border-black text-[11px] font-mono select-none ${
                        isToday
                          ? 'bg-black text-white font-bold'
                          : isWeekend
                          ? 'bg-[#F5F5F5] text-[#525252]'
                          : 'text-black'
                      }`}
                    >
                      <span className="leading-tight">{dayNum}</span>
                      <span className={`text-[9px] ${isToday ? 'text-white' : 'text-[#525252]'}`}>{weekDay}</span>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Today Vertical Black Indicator Line */}
            {todayPos !== null && (
              <div
                style={{ left: `${todayPos}px` }}
                className="absolute top-0 bottom-0 w-0.5 bg-black z-15 pointer-events-none"
              >
                <div className="sticky top-16 -left-4 -translate-x-1/2 px-1.5 py-0.5 bg-black text-white text-[9px] font-mono font-bold border border-black whitespace-nowrap">
                  TODAY
                </div>
              </div>
            )}

            {/* Task Tracks Grouped Matching Left Column */}
            <div className="flex-1 divide-y divide-black/20 relative">
              {/* Background Day Vertical Grid Lines */}
              <div className="absolute inset-0 flex pointer-events-none">
                {dateRange.map((d, i) => {
                  const isWeekend = d.getDay() === 0 || d.getDay() === 6;
                  return (
                    <div
                      key={i}
                      style={{ width: `${dayWidth}px` }}
                      className={`h-full border-r border-black/10 ${
                        isWeekend ? 'bg-[#F5F5F5]/40' : ''
                      }`}
                    />
                  );
                })}
              </div>

              {/* Groups and Task Bars */}
              {taskGroups.map((group) => {
                const isCollapsed = Boolean(collapsedGroups[group.id]);

                return (
                  <div key={group.id} className="relative">
                    {/* Empty Group Header Space matching left height (40px) */}
                    <div className="h-10 bg-[#F5F5F5] border-b border-black" />

                    {/* Task Rows matching left height (48px each) */}
                    {!isCollapsed &&
                      group.tasks.map((task) => {
                        const coords = getTaskCoordinates(task);

                        return (
                          <div
                            key={task.id}
                            className="h-12 relative flex items-center hover:bg-[#F5F5F5]/40 transition-colors border-b border-black/10"
                          >
                            {/* Gantt Bar */}
                            <div
                              onClick={() => onTaskClick(task)}
                              style={{
                                left: `${coords.left}px`,
                                width: `${coords.width}px`
                              }}
                              className={`absolute h-7 cursor-pointer border-2 border-black overflow-hidden transition-all group bg-white ${
                                coords.isOverdue ? 'border-dashed' : ''
                              }`}
                              title={`${task.title} | 工期: ${coords.durationDays} 天 (${coords.taskStart.toLocaleDateString()} ~ ${coords.taskEnd.toLocaleDateString()})`}
                            >
                              {/* Background Bar */}
                              <div className="absolute inset-0 bg-[#F5F5F5]" />

                              {/* Completed Progress Fill */}
                              <div
                                style={{ width: `${coords.progress}%` }}
                                className={`h-full ${coords.colColor} transition-all duration-100`}
                              />

                              {/* Bar Content Overlay */}
                              <div className="absolute inset-0 px-2 flex items-center justify-between text-[11px] font-mono font-bold text-white mix-blend-difference pointer-events-none truncate gap-1">
                                <span className="truncate flex items-center gap-1">
                                  {coords.isOverdue && (
                                    <span>[!]</span>
                                  )}
                                  <span className="truncate">{task.title}</span>
                                </span>
                                <span className="text-[10px] shrink-0">
                                  {coords.durationDays}D
                                </span>
                              </div>
                            </div>
                          </div>
                        );
                      })}

                    {!isCollapsed && group.tasks.length === 0 && (
                      <div className="h-10" />
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      {/* Footer / Legend Bar */}
      <div className="p-2.5 px-4 border-t-2 border-black bg-[#F5F5F5] flex items-center justify-between flex-wrap gap-2 text-xs font-mono text-black">
        <div className="flex items-center gap-4 flex-wrap">
          <span className="font-bold">LEGEND (圖例):</span>
          <div className="flex items-center gap-1.5">
            <span className="w-3 h-3 bg-black border border-black" />
            <span>IN PROGRESS (進行中)</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-3 h-3 bg-[#525252] border border-black" />
            <span>REVIEW (審核中)</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-3 h-3 bg-black border border-black flex items-center justify-center text-white text-[8px]">✓</span>
            <span>DONE (已完成)</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-3 h-3 bg-[#737373] border border-black" />
            <span>PENDING (待處理)</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-3 h-3 bg-white border-2 border-black border-dashed" />
            <span className="font-bold">[!] OVERDUE (逾期警示)</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2 h-0.5 bg-black" />
            <span>TODAY LINE (今日基準線)</span>
          </div>
        </div>

        <div className="text-[11px] text-[#525252]">
          CLICK ANY TASK BAR TO EDIT SCHEDULE OR ATTACH DRAWINGS
        </div>
      </div>
    </div>
  );
};
