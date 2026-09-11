import React, { useState, useEffect } from 'react';
import {
  KanbanSquare,
  FileText,
  BarChart3,
  Users,
  Building2,
  ChevronDown,
  Moon,
  Sun,
  Plus,
  ShieldCheck,
  Search,
  Sparkles,
  Layers,
  FolderGit2,
  Calendar,
  AlertCircle
} from 'lucide-react';
import { Project, User } from './types/pms';
import { storageService } from './services/storageService';
import { KanbanBoard } from './components/Kanban/KanbanBoard';
import { RFIDashboard } from './components/RFI/RFIDashboard';
import { ProjectAnalytics } from './components/Analytics/ProjectAnalytics';
import { TeamManagement } from './components/Team/TeamManagement';
import { NotificationDropdown } from './components/Notification/NotificationDropdown';

type NavigationTab = 'KANBAN' | 'RFI' | 'ANALYTICS' | 'TEAM';

export default function App() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [activeProjectId, setActiveProjectId] = useState<string>('');
  const [users, setUsers] = useState<User[]>([]);
  const [currentUserId, setCurrentUserId] = useState<string>('usr-pm');
  const [activeTab, setActiveTab] = useState<NavigationTab>('KANBAN');
  const [isDarkMode, setIsDarkMode] = useState<boolean>(false);
  const [isProjectDropdownOpen, setIsProjectDropdownOpen] = useState<boolean>(false);
  const [isNewProjectModalOpen, setIsNewProjectModalOpen] = useState<boolean>(false);

  // New Project Inputs
  const [newProjectName, setNewProjectName] = useState('');
  const [newProjectCode, setNewProjectCode] = useState('');
  const [newProjectDesc, setNewProjectDesc] = useState('');

  // Load Initial Data
  const refreshBaseData = () => {
    const allProjects = storageService.getProjects();
    setProjects(allProjects);
    if (!activeProjectId && allProjects.length > 0) {
      setActiveProjectId(allProjects[0].id);
    } else if (activeProjectId && !allProjects.some((p) => p.id === activeProjectId)) {
      setActiveProjectId(allProjects[0]?.id || '');
    }

    const allUsers = storageService.getUsers();
    setUsers(allUsers);
    const storedCurrent = storageService.getCurrentUser();
    if (storedCurrent) {
      setCurrentUserId(storedCurrent.id);
    }
  };

  useEffect(() => {
    refreshBaseData();
    const unsubscribe = storageService.subscribe(() => {
      refreshBaseData();
    });
    return unsubscribe;
  }, []);

  // Sync Dark mode with documentElement
  useEffect(() => {
    if (isDarkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [isDarkMode]);

  const activeProject = projects.find((p) => p.id === activeProjectId) || projects[0];
  const currentUser = users.find((u) => u.id === currentUserId) || users[0];

  const handleSwitchUser = (userId: string) => {
    storageService.setCurrentUser(userId);
    setCurrentUserId(userId);
  };

  const handleCreateProject = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newProjectName.trim() || !newProjectCode.trim()) return;

    const newPrj = storageService.createProject(
      newProjectName.trim(),
      newProjectCode.trim().toUpperCase(),
      newProjectDesc.trim()
    );

    setActiveProjectId(newPrj.id);
    setIsNewProjectModalOpen(false);
    setNewProjectName('');
    setNewProjectCode('');
    setNewProjectDesc('');
  };

  if (!activeProject || !currentUser) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white text-black font-mono text-sm tracking-widest uppercase">
        [ SYSTEM INITIALIZING : LOADING PROMANAGE DATABASE... ]
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-white text-black antialiased selection:bg-black selection:text-white">
      {/* Top Editorial Monochrome Application Header */}
      <header className="sticky top-0 z-30 bg-white border-b-4 border-black">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16 gap-3">
            {/* Left: Brand & Project Selector */}
            <div className="flex items-center gap-4 min-w-0">
              {/* App Brand Logo */}
              <div className="flex items-center gap-3 shrink-0">
                <div className="w-8 h-8 bg-black flex items-center justify-center text-white">
                  <KanbanSquare className="w-4 h-4" strokeWidth={1.5} />
                </div>
                <div className="hidden sm:block">
                  <div className="flex items-center gap-2">
                    <span className="font-display font-black text-base tracking-tight uppercase text-black">
                      ProManage
                    </span>
                    <span className="text-[9px] font-mono px-1.5 py-0.2 bg-black text-white tracking-widest uppercase font-bold">
                      ENTERPRISE
                    </span>
                  </div>
                  <p className="text-[10px] font-mono text-[#525252] tracking-wider uppercase">PMS & RFI ARCHITECTURE</p>
                </div>
              </div>

              <div className="h-6 w-px bg-black hidden sm:block" />

              {/* Project Dropdown Selector */}
              <div className="relative">
                <button
                  type="button"
                  id="project-selector-btn"
                  onClick={() => setIsProjectDropdownOpen(!isProjectDropdownOpen)}
                  className="flex items-center gap-2 px-3 py-1.5 border-2 border-black bg-white hover:bg-black hover:text-white transition-colors text-left group"
                >
                  <Building2 className="w-3.5 h-3.5 shrink-0" strokeWidth={1.5} />
                  <div className="min-w-0 max-w-[160px] sm:max-w-[220px]">
                    <div className="text-xs font-bold truncate font-display">
                      {activeProject.name}
                    </div>
                    <span className="text-[9px] font-mono text-[#525252] group-hover:text-[#E5E5E5] block truncate uppercase">
                      CODE: {activeProject.code}
                    </span>
                  </div>
                  <ChevronDown className="w-3.5 h-3.5 shrink-0" strokeWidth={1.5} />
                </button>

                {isProjectDropdownOpen && (
                  <div
                    className="fixed inset-0 z-40 sm:absolute sm:inset-auto sm:left-0 sm:top-12 sm:w-80"
                    onClick={() => setIsProjectDropdownOpen(false)}
                  >
                    <div
                      className="w-full bg-white border-2 border-black p-0 divide-y divide-black animate-in fade-in duration-100"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <div className="px-3 py-2 text-[10px] font-mono font-bold text-black uppercase tracking-widest bg-[#F5F5F5]">
                        SELECT PROJECT / 切換專案
                      </div>
                      <div className="max-h-64 overflow-y-auto divide-y divide-[#E5E5E5]">
                        {projects.map((p) => (
                          <button
                            key={p.id}
                            type="button"
                            onClick={() => {
                              setActiveProjectId(p.id);
                              setIsProjectDropdownOpen(false);
                            }}
                            className={`w-full flex items-center justify-between p-3 text-left transition-colors ${
                              p.id === activeProjectId
                                ? 'bg-black text-white font-semibold'
                                : 'hover:bg-[#F5F5F5] text-black'
                            }`}
                          >
                            <div className="min-w-0 pr-2">
                              <div className="text-xs font-bold truncate font-display">{p.name}</div>
                              <div className={`text-[10px] truncate font-mono uppercase tracking-wider ${
                                p.id === activeProjectId ? 'text-[#E5E5E5]' : 'text-[#525252]'
                              }`}>
                                {p.code} • {p.description || 'CONSTRUCTION PROJECT'}
                              </div>
                            </div>
                            {p.id === activeProjectId && (
                              <span className="text-[10px] font-mono uppercase tracking-widest border border-white px-1 py-0.5">ACTIVE</span>
                            )}
                          </button>
                        ))}
                      </div>

                      <div className="p-2 bg-white">
                        <button
                          type="button"
                          onClick={() => {
                            setIsProjectDropdownOpen(false);
                            setIsNewProjectModalOpen(true);
                          }}
                          className="w-full flex items-center justify-center gap-1.5 py-2 text-xs font-mono font-bold uppercase tracking-wider border-2 border-dashed border-black hover:bg-black hover:text-white transition-colors"
                        >
                          <Plus className="w-3.5 h-3.5" strokeWidth={1.5} /> 建立新專案 (NEW)
                        </button>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Right: Role Switcher Persona, Notifications */}
            <div className="flex items-center gap-2 sm:gap-3 shrink-0">
              {/* Quick Persona Switcher */}
              <div className="hidden md:flex items-center border border-black p-0.5 bg-white">
                <span className="text-[10px] font-mono uppercase tracking-widest text-[#525252] px-1.5">ROLE:</span>
                {users.map((u) => {
                  const isCurrent = u.id === currentUser.id;
                  const label =
                    u.role === 'SUPER_ADMIN'
                      ? 'ADMIN'
                      : u.role === 'PROJECT_MANAGER'
                      ? 'PM'
                      : u.role === 'REVIEWER_CLIENT'
                      ? 'CLIENT'
                      : 'ENG';

                  return (
                    <button
                      key={u.id}
                      onClick={() => handleSwitchUser(u.id)}
                      className={`px-2 py-1 text-xs font-mono uppercase tracking-wider transition-colors ${
                        isCurrent
                          ? 'bg-black text-white font-bold'
                          : 'text-[#525252] hover:text-black hover:bg-[#F5F5F5]'
                      }`}
                      title={`${u.full_name} (${u.role})`}
                    >
                      {label}
                    </button>
                  );
                })}
              </div>

              {/* User Avatar Chip */}
              <div className="flex items-center gap-2 pl-2 border-l border-black">
                <img
                  src={currentUser.avatar_url}
                  alt=""
                  referrerPolicy="no-referrer"
                  className="w-7 h-7 object-cover border border-black grayscale hover:grayscale-0 transition-all"
                />
                <div className="hidden lg:block text-left">
                  <div className="text-xs font-display font-bold leading-tight uppercase">{currentUser.full_name}</div>
                  <div className="text-[9px] font-mono uppercase tracking-widest text-[#525252]">
                    {currentUser.role === 'SUPER_ADMIN'
                      ? 'SUPER ADMIN'
                      : currentUser.role === 'PROJECT_MANAGER'
                      ? 'PROJ MANAGER'
                      : currentUser.role === 'REVIEWER_CLIENT'
                      ? 'CLIENT LEAD'
                      : 'SITE ENGINEER'}
                  </div>
                </div>
              </div>

              {/* Notification Center */}
              <NotificationDropdown userId={currentUser.id} />
            </div>
          </div>

          {/* Navigation Tabs Bar */}
          <nav className="flex items-center -mb-[4px] overflow-x-auto font-mono text-xs uppercase tracking-widest scrollbar-none border-t border-black">
            <button
              type="button"
              id="tab-kanban"
              onClick={() => setActiveTab('KANBAN')}
              className={`flex items-center gap-2 py-3 px-5 border-b-4 transition-colors whitespace-nowrap ${
                activeTab === 'KANBAN'
                  ? 'border-black bg-black text-white font-bold'
                  : 'border-transparent text-[#525252] hover:text-black hover:bg-[#F5F5F5]'
              }`}
            >
              <KanbanSquare className="w-3.5 h-3.5" strokeWidth={1.5} />
              KANBAN BOARD (敏捷看板)
            </button>

            <button
              type="button"
              id="tab-rfi"
              onClick={() => setActiveTab('RFI')}
              className={`flex items-center gap-2 py-3 px-5 border-b-4 transition-colors whitespace-nowrap ${
                activeTab === 'RFI'
                  ? 'border-black bg-black text-white font-bold'
                  : 'border-transparent text-[#525252] hover:text-black hover:bg-[#F5F5F5]'
              }`}
            >
              <FileText className="w-3.5 h-3.5" strokeWidth={1.5} />
              RFI TRACKING (資訊請求)
            </button>

            <button
              type="button"
              id="tab-analytics"
              onClick={() => setActiveTab('ANALYTICS')}
              className={`flex items-center gap-2 py-3 px-5 border-b-4 transition-colors whitespace-nowrap ${
                activeTab === 'ANALYTICS'
                  ? 'border-black bg-black text-white font-bold'
                  : 'border-transparent text-[#525252] hover:text-black hover:bg-[#F5F5F5]'
              }`}
            >
              <BarChart3 className="w-3.5 h-3.5" strokeWidth={1.5} />
              ANALYTICS (績效與工期)
            </button>

            <button
              type="button"
              id="tab-team"
              onClick={() => setActiveTab('TEAM')}
              className={`flex items-center gap-2 py-3 px-5 border-b-4 transition-colors whitespace-nowrap ${
                activeTab === 'TEAM'
                  ? 'border-black bg-black text-white font-bold'
                  : 'border-transparent text-[#525252] hover:text-black hover:bg-[#F5F5F5]'
              }`}
            >
              <Users className="w-3.5 h-3.5" strokeWidth={1.5} />
              RBAC MATRIX (成員權限)
            </button>
          </nav>
        </div>
      </header>

      {/* Editorial Headline & Metadata Banner */}
      <section className="bg-white border-b border-black">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
            <div>
              <div className="flex items-center gap-2 text-[10px] font-mono tracking-widest text-[#525252] uppercase mb-1">
                <span>PROJECT REGISTRY</span>
                <span>/</span>
                <span className="text-black font-bold">CODE: {activeProject.code}</span>
                <span>/</span>
                <span>STATUS: OPERATIONAL</span>
              </div>
              <h1 className="text-3xl sm:text-4xl lg:text-5xl font-display font-bold uppercase tracking-tight text-black">
                {activeProject.name}
              </h1>
            </div>

            <div className="flex items-center gap-4 text-xs font-mono text-[#525252] uppercase tracking-wider pb-1">
              <span className="border border-black px-2 py-1 text-black font-bold">
                [ SPEC 2.0 ]
              </span>
              <span>STATE MACHINE AUDITED</span>
            </div>
          </div>
        </div>
      </section>

      {/* Main App Content Viewport */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 lg:p-8">
        {activeTab === 'KANBAN' && (
          <KanbanBoard
            projectId={activeProject.id}
            currentUser={currentUser}
            users={users}
          />
        )}

        {activeTab === 'RFI' && (
          <RFIDashboard
            project={activeProject}
            currentUser={currentUser}
            users={users}
          />
        )}

        {activeTab === 'ANALYTICS' && (
          <ProjectAnalytics project={activeProject} />
        )}

        {activeTab === 'TEAM' && (
          <TeamManagement
            users={users}
            currentUser={currentUser}
            onSwitchUser={handleSwitchUser}
          />
        )}
      </main>

      {/* Create Project Modal */}
      {isNewProjectModalOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 animate-in fade-in duration-100"
          onClick={() => setIsNewProjectModalOpen(false)}
        >
          <div
            className="w-full max-w-md bg-white border-4 border-black p-6 shadow-none"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b-2 border-black pb-3 mb-4">
              <h3 className="text-lg font-display font-bold uppercase tracking-tight text-black">
                建立新工程專案 / NEW PROJECT
              </h3>
              <span className="text-xs font-mono text-[#525252]">[ FORM ]</span>
            </div>
            <p className="text-xs font-body text-[#525252] mb-5">
              專案建立後將自動初始化研發/施工看板、預設敏捷欄位與專屬 RFI 編號字首。
            </p>

            <form onSubmit={handleCreateProject} className="space-y-4">
              <div>
                <label className="block text-xs font-mono font-bold uppercase tracking-wider text-black mb-1">
                  專案完整名稱 *
                </label>
                <input
                  type="text"
                  required
                  value={newProjectName}
                  onChange={(e) => setNewProjectName(e.target.value)}
                  placeholder="例：台中水湳轉運中心機電智慧化工程"
                  className="w-full px-3 py-2 text-sm border-2 border-black bg-white text-black font-body placeholder:italic placeholder:text-[#525252] focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-mono font-bold uppercase tracking-wider text-black mb-1">
                  專案代碼 (CODE) *
                </label>
                <input
                  type="text"
                  required
                  value={newProjectCode}
                  onChange={(e) => setNewProjectCode(e.target.value)}
                  placeholder="例：TC03 (將作為 RFI-TC03-2026-XXXX 編號字首)"
                  className="w-full px-3 py-2 text-sm border-2 border-black bg-white text-black font-mono uppercase placeholder:italic placeholder:text-[#525252] focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-mono font-bold uppercase tracking-wider text-black mb-1">
                  專案描述與工區說明
                </label>
                <textarea
                  rows={3}
                  value={newProjectDesc}
                  onChange={(e) => setNewProjectDesc(e.target.value)}
                  placeholder="描述專案工期、合約規範或業主驗收標準..."
                  className="w-full px-3 py-2 text-sm border-2 border-black bg-white text-black font-body placeholder:italic placeholder:text-[#525252] focus:outline-none"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t-2 border-black">
                <button
                  type="button"
                  onClick={() => setIsNewProjectModalOpen(false)}
                  className="btn-mono-outline"
                >
                  取消
                </button>
                <button
                  type="submit"
                  className="btn-mono-primary"
                >
                  確認建立 →
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
