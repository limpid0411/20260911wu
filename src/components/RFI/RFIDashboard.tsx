import React, { useState, useEffect } from 'react';
import {
  Plus,
  Search,
  Filter,
  AlertTriangle,
  CheckCircle2,
  Clock,
  FileText,
  DollarSign,
  ShieldAlert,
  ShieldCheck,
  Eye,
  LayoutGrid,
  List,
  Calendar,
  Layers
} from 'lucide-react';
import { Project, User, RFI, RFIStatus } from '../../types/pms';
import { storageService } from '../../services/storageService';
import { checkPermission } from '../../utils/rbac';
import { CreateRFIModal } from './CreateRFIModal';
import { RFIDetailModal } from './RFIDetailModal';

interface RFIDashboardProps {
  project: Project;
  currentUser: User;
  users: User[];
}

const STATUS_BADGES: Record<RFIStatus, { label: string; className: string }> = {
  DRAFT: { label: 'DRAFT (草稿)', className: 'bg-white text-black border-black' },
  SUBMITTED: { label: 'SUBMITTED (已送出)', className: 'bg-white text-black border-black font-bold' },
  UNDER_REVIEW: { label: 'UNDER REVIEW (審理中)', className: 'bg-[#F5F5F5] text-black border-black font-bold' },
  ANSWERED: { label: 'ANSWERED (已回覆)', className: 'bg-black text-white border-black font-bold' },
  CLOSED: { label: 'CLOSED (已結案)', className: 'bg-[#525252] text-white border-black' },
  REJECTED: { label: 'REJECTED (退件)', className: 'bg-white text-black border-2 border-black line-through' }
};

export const RFIDashboard: React.FC<RFIDashboardProps> = ({ project, currentUser, users }) => {
  const [rfis, setRfis] = useState<RFI[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<RFIStatus | 'ALL'>('ALL');
  const [onlyOverdue, setOnlyOverdue] = useState(false);
  const [costFilter, setCostFilter] = useState<'ALL' | 'YES' | 'NO'>('ALL');
  const [scheduleFilter, setScheduleFilter] = useState<'ALL' | 'YES' | 'NO'>('ALL');
  const [viewMode, setViewMode] = useState<'TABLE' | 'GRID'>('TABLE');

  // Modals
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [selectedRfiId, setSelectedRfiId] = useState<string | null>(null);

  const loadData = () => {
    setRfis(storageService.getRFIs(project.id));
  };

  useEffect(() => {
    loadData();
    const unsubscribe = storageService.subscribe(() => {
      loadData();
    });
    return unsubscribe;
  }, [project.id]);

  const canCreateRFI = checkPermission(currentUser.role, 'canCreateRFI');

  // Filtered RFIs
  const filteredRFIs = rfis.filter((r) => {
    const matchesSearch =
      !searchQuery ||
      r.rfi_number.toLowerCase().includes(searchQuery.toLowerCase()) ||
      r.subject.toLowerCase().includes(searchQuery.toLowerCase()) ||
      r.reference_spec_no.toLowerCase().includes(searchQuery.toLowerCase()) ||
      r.question.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesStatus = statusFilter === 'ALL' || r.status === statusFilter;
    const isOverdue = storageService.isRFIOverdue(r);
    const matchesOverdue = !onlyOverdue || isOverdue;

    const matchesCost =
      costFilter === 'ALL' ||
      (costFilter === 'YES' && r.cost_impact) ||
      (costFilter === 'NO' && !r.cost_impact);

    const matchesSchedule =
      scheduleFilter === 'ALL' ||
      (scheduleFilter === 'YES' && r.schedule_impact) ||
      (scheduleFilter === 'NO' && !r.schedule_impact);

    return matchesSearch && matchesStatus && matchesOverdue && matchesCost && matchesSchedule;
  });

  // KPI calculations
  const totalCount = rfis.length;
  const underReviewCount = rfis.filter((r) => r.status === 'UNDER_REVIEW').length;
  const overdueCount = rfis.filter((r) => storageService.isRFIOverdue(r)).length;
  const answeredCount = rfis.filter((r) => r.status === 'ANSWERED').length;
  const closedCount = rfis.filter((r) => r.status === 'CLOSED').length;

  return (
    <div id="rfi-module-root" className="flex flex-col h-full space-y-5">
      {/* KPI Cards Row */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 sm:gap-4">
        {/* Total */}
        <div
          onClick={() => {
            setStatusFilter('ALL');
            setOnlyOverdue(false);
          }}
          className={`p-4 border-2 border-black cursor-pointer transition-colors ${
            statusFilter === 'ALL' && !onlyOverdue ? 'bg-black text-white' : 'bg-white text-black hover:bg-[#F5F5F5]'
          }`}
        >
          <div className="flex items-center justify-between text-xs font-mono uppercase mb-1.5 border-b border-current pb-1">
            <span className="font-bold tracking-wider">ALL RFIs</span>
            <FileText className="w-4 h-4" strokeWidth={1.5} />
          </div>
          <div className="text-3xl font-display font-black font-mono">
            {totalCount}
          </div>
          <span className="text-[11px] font-mono uppercase opacity-70">跨單位技術諮詢</span>
        </div>

        {/* Under Review */}
        <div
          onClick={() => {
            setStatusFilter('UNDER_REVIEW');
            setOnlyOverdue(false);
          }}
          className={`p-4 border-2 border-black cursor-pointer transition-colors ${
            statusFilter === 'UNDER_REVIEW' && !onlyOverdue ? 'bg-black text-white' : 'bg-white text-black hover:bg-[#F5F5F5]'
          }`}
        >
          <div className="flex items-center justify-between text-xs font-mono uppercase mb-1.5 border-b border-current pb-1">
            <span className="font-bold tracking-wider">UNDER REVIEW</span>
            <Clock className="w-4 h-4" strokeWidth={1.5} />
          </div>
          <div className="text-3xl font-display font-black font-mono">
            {underReviewCount}
          </div>
          <span className="text-[11px] font-mono uppercase opacity-70">審查核定中</span>
        </div>

        {/* Overdue Alerts */}
        <div
          onClick={() => setOnlyOverdue(!onlyOverdue)}
          className={`p-4 border-2 border-black cursor-pointer transition-colors ${
            onlyOverdue
              ? 'bg-black text-white'
              : overdueCount > 0
              ? 'bg-[#F5F5F5] text-black border-4 hover:bg-black hover:text-white'
              : 'bg-white text-black hover:bg-[#F5F5F5]'
          }`}
        >
          <div className="flex items-center justify-between text-xs font-mono uppercase mb-1.5 border-b border-current pb-1">
            <span className="font-bold tracking-wider">[ OVERDUE ]</span>
            <AlertTriangle className="w-4 h-4" strokeWidth={1.5} />
          </div>
          <div className="text-3xl font-display font-black font-mono">
            {overdueCount}
          </div>
          <span className="text-[11px] font-mono uppercase opacity-70">
            {onlyOverdue ? '點擊取消篩選' : '逾期未回覆'}
          </span>
        </div>

        {/* Answered */}
        <div
          onClick={() => {
            setStatusFilter('ANSWERED');
            setOnlyOverdue(false);
          }}
          className={`p-4 border-2 border-black cursor-pointer transition-colors ${
            statusFilter === 'ANSWERED' && !onlyOverdue ? 'bg-black text-white' : 'bg-white text-black hover:bg-[#F5F5F5]'
          }`}
        >
          <div className="flex items-center justify-between text-xs font-mono uppercase mb-1.5 border-b border-current pb-1">
            <span className="font-bold tracking-wider">ANSWERED</span>
            <CheckCircle2 className="w-4 h-4" strokeWidth={1.5} />
          </div>
          <div className="text-3xl font-display font-black font-mono">
            {answeredCount}
          </div>
          <span className="text-[11px] font-mono uppercase opacity-70">已回覆待歸檔</span>
        </div>

        {/* Closed */}
        <div
          onClick={() => {
            setStatusFilter('CLOSED');
            setOnlyOverdue(false);
          }}
          className={`p-4 border-2 border-black cursor-pointer transition-colors col-span-2 sm:col-span-1 ${
            statusFilter === 'CLOSED' && !onlyOverdue ? 'bg-black text-white' : 'bg-white text-black hover:bg-[#F5F5F5]'
          }`}
        >
          <div className="flex items-center justify-between text-xs font-mono uppercase mb-1.5 border-b border-current pb-1">
            <span className="font-bold tracking-wider">CLOSED</span>
            <ShieldCheck className="w-4 h-4" strokeWidth={1.5} />
          </div>
          <div className="text-3xl font-display font-black font-mono">
            {closedCount}
          </div>
          <span className="text-[11px] font-mono uppercase opacity-70">已正式結案</span>
        </div>
      </div>

      {/* Filter Toolbar & Actions */}
      <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-3 bg-white p-4 border-2 border-black">
        {/* Search & Status Filters */}
        <div className="flex items-center gap-2 flex-wrap w-full lg:w-auto">
          {/* Search */}
          <div className="relative flex-1 sm:flex-initial">
            <Search className="w-3.5 h-3.5 text-black absolute left-3 top-1/2 -translate-y-1/2" strokeWidth={1.5} />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="搜尋 RFI 編號、主旨、圖號..."
              className="pl-8 pr-3 py-1.5 text-xs border-2 border-black bg-white text-black font-mono placeholder:text-[#525252] placeholder:italic focus:outline-none w-full sm:w-60"
            />
          </div>

          {/* Status Dropdown */}
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as any)}
            className="px-3 py-1.5 text-xs border-2 border-black bg-white text-black font-mono uppercase focus:outline-none"
          >
            <option value="ALL">ALL STATUS (全部狀態)</option>
            <option value="DRAFT">DRAFT (草稿)</option>
            <option value="SUBMITTED">SUBMITTED (已送出)</option>
            <option value="UNDER_REVIEW">UNDER REVIEW (審理中)</option>
            <option value="ANSWERED">ANSWERED (已回覆)</option>
            <option value="CLOSED">CLOSED (已結案)</option>
            <option value="REJECTED">REJECTED (退件)</option>
          </select>

          {/* Impact Filter: Cost */}
          <select
            value={costFilter}
            onChange={(e) => setCostFilter(e.target.value as any)}
            className="px-3 py-1.5 text-xs border-2 border-black bg-white text-black font-mono uppercase focus:outline-none"
          >
            <option value="ALL">COST IMPACT: ALL</option>
            <option value="YES">COST IMPACT: YES (涉及追加款)</option>
            <option value="NO">COST IMPACT: NO (無成本影響)</option>
          </select>

          {/* Impact Filter: Schedule */}
          <select
            value={scheduleFilter}
            onChange={(e) => setScheduleFilter(e.target.value as any)}
            className="px-3 py-1.5 text-xs border-2 border-black bg-white text-black font-mono uppercase focus:outline-none"
          >
            <option value="ALL">SCHEDULE IMPACT: ALL</option>
            <option value="YES">SCHEDULE IMPACT: YES (涉及工期延宕)</option>
            <option value="NO">SCHEDULE IMPACT: NO (無工期影響)</option>
          </select>
        </div>

        {/* Right Actions: View Mode & Create RFI */}
        <div className="flex items-center gap-2 self-end lg:self-center">
          {/* View mode toggle */}
          <div className="flex items-center border-2 border-black p-0.5 bg-white">
            <button
              onClick={() => setViewMode('TABLE')}
              className={`p-1.5 transition-colors ${
                viewMode === 'TABLE'
                  ? 'bg-black text-white'
                  : 'text-black hover:bg-[#F5F5F5]'
              }`}
              title="清單列表檢視"
            >
              <List className="w-4 h-4" strokeWidth={1.5} />
            </button>
            <button
              onClick={() => setViewMode('GRID')}
              className={`p-1.5 transition-colors ${
                viewMode === 'GRID'
                  ? 'bg-black text-white'
                  : 'text-black hover:bg-[#F5F5F5]'
              }`}
              title="卡片九宮格檢視"
            >
              <LayoutGrid className="w-4 h-4" strokeWidth={1.5} />
            </button>
          </div>

          {/* Create Button */}
          {canCreateRFI && (
            <button
              id="btn-create-rfi-main"
              onClick={() => setIsCreateOpen(true)}
              className="btn-mono-primary inline-flex items-center gap-1.5"
            >
              <Plus className="w-4 h-4" strokeWidth={1.5} />
              提出新 RFI 諮詢單
            </button>
          )}
        </div>
      </div>

      {/* Main RFI Content: Table or Grid View */}
      {viewMode === 'TABLE' ? (
        <div className="bg-white border-2 border-black overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b-2 border-black bg-[#F5F5F5] text-xs font-mono font-bold text-black uppercase tracking-wider">
                  <th className="py-3 px-4 border-r border-black">RFI NUMBER</th>
                  <th className="py-3 px-4 border-r border-black">SUBJECT (主旨)</th>
                  <th className="py-3 px-4 border-r border-black">REF SPEC (圖說規範)</th>
                  <th className="py-3 px-4 border-r border-black">IMPACT (影響)</th>
                  <th className="py-3 px-4 border-r border-black">STATUS (狀態)</th>
                  <th className="py-3 px-4 border-r border-black">DUE DATE (期限)</th>
                  <th className="py-3 px-4 border-r border-black">REVIEWER (審理人)</th>
                  <th className="py-3 px-4 text-right">ACTION</th>
                </tr>
              </thead>
              <tbody className="divide-y border-black divide-black text-xs font-body">
                {filteredRFIs.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="py-12 text-center text-xs font-mono uppercase text-[#525252]">
                      NO MATCHING RFI RECORDS FOUND.
                    </td>
                  </tr>
                ) : (
                  filteredRFIs.map((rfi) => {
                    const isOverdue = storageService.isRFIOverdue(rfi);
                    const reviewer = users.find((u) => u.id === rfi.assigned_reviewer_id);
                    const statusBadge = STATUS_BADGES[rfi.status] || STATUS_BADGES.DRAFT;

                    return (
                      <tr
                        key={rfi.id}
                        onClick={() => setSelectedRfiId(rfi.id)}
                        className={`hover:bg-[#F5F5F5] cursor-pointer transition-colors ${
                          isOverdue ? 'bg-[#F5F5F5]' : ''
                        }`}
                      >
                        {/* Number */}
                        <td className="py-3.5 px-4 font-mono font-bold text-black border-r border-black whitespace-nowrap">
                          {rfi.rfi_number}
                        </td>

                        {/* Subject */}
                        <td className="py-3.5 px-4 font-bold text-black border-r border-black max-w-xs truncate">
                          {rfi.subject}
                        </td>

                        {/* Ref Spec */}
                        <td className="py-3.5 px-4 font-mono text-[#525252] border-r border-black whitespace-nowrap">
                          {rfi.reference_spec_no}
                        </td>

                        {/* Impact */}
                        <td className="py-3.5 px-4 border-r border-black whitespace-nowrap font-mono text-[11px]">
                          <div className="flex items-center gap-1.5">
                            {rfi.cost_impact && (
                              <span
                                className="px-1.5 py-0.5 border border-black bg-black text-white uppercase font-bold"
                                title="涉及工程追加款"
                              >
                                COST$
                              </span>
                            )}

                            {rfi.schedule_impact && (
                              <span
                                className="px-1.5 py-0.5 border border-black bg-white text-black uppercase font-bold"
                                title={`工期展延 +${rfi.schedule_days_impact} 天`}
                              >
                                +{rfi.schedule_days_impact}D
                              </span>
                            )}

                            {!rfi.cost_impact && !rfi.schedule_impact && (
                              <span className="text-[#525252]">NONE</span>
                            )}
                          </div>
                        </td>

                        {/* Status */}
                        <td className="py-3.5 px-4 border-r border-black whitespace-nowrap font-mono">
                          <span
                            className={`inline-flex items-center px-2 py-0.5 text-xs font-mono uppercase border ${statusBadge.className}`}
                          >
                            {statusBadge.label}
                          </span>
                        </td>

                        {/* Due date & overdue */}
                        <td className="py-3.5 px-4 border-r border-black whitespace-nowrap font-mono text-xs">
                          <div className="flex items-center gap-1.5">
                            <span className={isOverdue ? 'font-bold underline' : ''}>
                              {rfi.due_date ? new Date(rfi.due_date).toLocaleDateString() : '-'}
                            </span>
                            {isOverdue && (
                              <span className="px-1.5 py-0.2 border border-black bg-black text-white text-[10px] font-bold uppercase">
                                OVERDUE
                              </span>
                            )}
                          </div>
                        </td>

                        {/* Reviewer */}
                        <td className="py-3.5 px-4 border-r border-black whitespace-nowrap text-black font-body">
                          {reviewer ? reviewer.full_name.split(' ')[0] : '未指派'}
                        </td>

                        {/* Actions */}
                        <td className="py-3.5 px-4 text-right whitespace-nowrap">
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              setSelectedRfiId(rfi.id);
                            }}
                            className="btn-mono-outline py-1 px-2.5 text-xs"
                          >
                            <Eye className="w-3 h-3" strokeWidth={1.5} /> VIEW
                          </button>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        /* Grid View */
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {filteredRFIs.map((rfi) => {
            const isOverdue = storageService.isRFIOverdue(rfi);
            const statusBadge = STATUS_BADGES[rfi.status] || STATUS_BADGES.DRAFT;
            const reviewer = users.find((u) => u.id === rfi.assigned_reviewer_id);

            return (
              <div
                key={rfi.id}
                onClick={() => setSelectedRfiId(rfi.id)}
                className={`bg-white p-5 border-2 border-black cursor-pointer hover:bg-[#F5F5F5] transition-colors space-y-3 ${
                  isOverdue ? 'border-4' : ''
                }`}
              >
                <div className="flex items-center justify-between border-b border-black pb-2">
                  <span className="font-mono text-xs font-bold text-white bg-black px-2 py-0.5 border border-black">
                    {rfi.rfi_number}
                  </span>
                  <span
                    className={`px-2 py-0.5 text-xs font-mono uppercase border ${statusBadge.className}`}
                  >
                    {statusBadge.label}
                  </span>
                </div>

                <h4 className="text-sm font-display font-bold text-black line-clamp-2">
                  {rfi.subject}
                </h4>

                <p className="text-xs font-body text-[#525252] line-clamp-2 leading-relaxed">
                  {rfi.question}
                </p>

                <div className="flex items-center gap-2 pt-2 border-t border-black text-[11px] font-mono text-[#525252]">
                  <span>SPEC: {rfi.reference_spec_no}</span>
                  <span>|</span>
                  <span>REVIEWER: {reviewer ? reviewer.full_name.split(' ')[0] : 'NONE'}</span>
                </div>

                <div className="flex items-center justify-between pt-1 text-xs font-mono">
                  <div className="flex items-center gap-1">
                    {rfi.cost_impact && (
                      <span className="px-1.5 py-0.5 text-[10px] bg-black text-white font-bold border border-black">
                        COST$
                      </span>
                    )}
                    {rfi.schedule_impact && (
                      <span className="px-1.5 py-0.5 text-[10px] bg-white text-black font-bold border border-black">
                        +{rfi.schedule_days_impact}D
                      </span>
                    )}
                  </div>

                  <span
                    className={`text-xs ${
                      isOverdue ? 'font-bold underline' : 'text-[#525252]'
                    }`}
                  >
                    {isOverdue ? '[ OVERDUE ]' : `DUE: ${rfi.due_date ? new Date(rfi.due_date).toLocaleDateString() : '-'}`}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Create RFI Modal */}
      {isCreateOpen && (
        <CreateRFIModal
          project={project}
          currentUser={currentUser}
          users={users}
          isOpen={isCreateOpen}
          onClose={() => setIsCreateOpen(false)}
          onCreated={(newRfi) => {
            loadData();
            setSelectedRfiId(newRfi.id);
          }}
        />
      )}

      {/* RFI Detail & Workflow Modal */}
      {selectedRfiId && (
        <RFIDetailModal
          rfiId={selectedRfiId}
          currentUser={currentUser}
          users={users}
          isOpen={Boolean(selectedRfiId)}
          onClose={() => setSelectedRfiId(null)}
          onUpdated={() => loadData()}
        />
      )}
    </div>
  );
};
