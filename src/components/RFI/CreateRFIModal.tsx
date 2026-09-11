import React, { useState } from 'react';
import { X, FileText, AlertCircle, Calendar, User, DollarSign, Clock, Paperclip, Send } from 'lucide-react';
import { Project, User as UserType, Priority, RFI } from '../../types/pms';
import { storageService } from '../../services/storageService';
import { ClipboardUploadHelper } from '../Attachment/ClipboardUploadHelper';

interface CreateRFIModalProps {
  project: Project;
  currentUser: UserType;
  users: UserType[];
  isOpen: boolean;
  onClose: () => void;
  onCreated: (rfi: RFI) => void;
}

const PRIORITIES: { value: Priority; label: string }[] = [
  { value: 'LOW', label: '低優先級' },
  { value: 'NORMAL', label: '一般常規' },
  { value: 'HIGH', label: '高度重要' },
  { value: 'URGENT', label: '緊急疑難' }
];

export const CreateRFIModal: React.FC<CreateRFIModalProps> = ({
  project,
  currentUser,
  users,
  isOpen,
  onClose,
  onCreated
}) => {
  const nextRFINumber = storageService.getNextRFINumber(project.id);

  const [subject, setSubject] = useState('');
  const [question, setQuestion] = useState('');
  const [suggestedSolution, setSuggestedSolution] = useState('');
  const [priority, setPriority] = useState<Priority>('NORMAL');
  const [referenceSpecNo, setReferenceSpecNo] = useState('');
  const [costImpact, setCostImpact] = useState<boolean>(false);
  const [scheduleImpact, setScheduleImpact] = useState<boolean>(false);
  const [scheduleDaysImpact, setScheduleDaysImpact] = useState<number>(0);
  const [assignedReviewerId, setAssignedReviewerId] = useState<string>('usr-reviewer');
  const [dueDate, setDueDate] = useState<string>(() => {
    // Default 7 days from now
    const d = new Date();
    d.setDate(d.getDate() + 7);
    return d.toISOString().slice(0, 10);
  });

  const [createdRFIId, setCreatedRFIId] = useState<string>('temp-rfi-' + Date.now());

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!subject.trim() || !question.trim()) return;

    const newRFI = storageService.createRFI({
      project_id: project.id,
      subject: subject.trim(),
      question: question.trim(),
      suggested_solution: suggestedSolution.trim(),
      priority,
      reference_spec_no: referenceSpecNo.trim() || '依圖說規範',
      cost_impact: costImpact,
      schedule_impact: scheduleImpact,
      schedule_days_impact: scheduleImpact ? scheduleDaysImpact : 0,
      assigned_reviewer_id: assignedReviewerId || null,
      due_date: dueDate ? new Date(dueDate).toISOString() : null
    });

    onCreated(newRFI);
    onClose();
  };

  const reviewers = users.filter(
    (u) => u.role === 'REVIEWER_CLIENT' || u.role === 'PROJECT_MANAGER' || u.role === 'SUPER_ADMIN'
  );

  return (
    <div
      id="create-rfi-overlay"
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4"
      onClick={onClose}
    >
      <div
        id="create-rfi-container"
        className="flex flex-col w-full max-w-3xl max-h-[90vh] bg-white border-2 border-black overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b-2 border-black bg-[#F5F5F5]">
          <div className="flex items-center gap-3">
            <span className="font-mono text-xs font-bold px-2.5 py-1 bg-black text-white border border-black">
              {nextRFINumber}
            </span>
            <div>
              <h3 className="text-base font-display font-black text-black">
                CREATE RFI / 提出專案技術諮詢單
              </h3>
              <p className="text-xs font-mono uppercase text-[#525252]">
                系統自動產生合約存證唯一流水編號，並啟動狀態機追蹤
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-1 text-black hover:bg-black hover:text-white border border-transparent hover:border-black transition-colors"
          >
            <X className="w-5 h-5" strokeWidth={1.5} />
          </button>
        </div>

        {/* Form Body */}
        <form id="create-rfi-form" onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-5">
          {/* Subject */}
          <div>
            <label className="block text-xs font-mono font-bold uppercase text-black mb-1.5">
              SUBJECT / 主旨與諮詢議題 *
            </label>
            <input
              type="text"
              required
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              placeholder="例：地下二層穿牆套管與機電冷媒管高程衝突諮詢..."
              className="w-full px-3 py-2 text-sm border-2 border-black bg-white text-black font-body placeholder:text-[#525252] placeholder:italic focus:outline-none"
            />
          </div>

          {/* Reference Spec & Priority */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-mono font-bold uppercase text-black mb-1.5">
                REF DRAWING / SPEC NO. (關聯圖面規範) *
              </label>
              <input
                type="text"
                required
                value={referenceSpecNo}
                onChange={(e) => setReferenceSpecNo(e.target.value)}
                placeholder="例：DWG-MEP-B2-04 / SPEC-STR-S204"
                className="w-full px-3 py-2 text-sm border-2 border-black bg-white text-black font-mono focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-mono font-bold uppercase text-black mb-1.5">
                PRIORITY (優先級別)
              </label>
              <select
                value={priority}
                onChange={(e) => setPriority(e.target.value as Priority)}
                className="w-full px-3 py-2 text-sm border-2 border-black bg-white text-black font-mono uppercase focus:outline-none"
              >
                {PRIORITIES.map((p) => (
                  <option key={p.value} value={p.value}>
                    {p.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Question / Technical Query */}
          <div>
            <label className="block text-xs font-mono font-bold uppercase text-black mb-1.5">
              QUERY DETAIL / 技術疑難或圖面不符詳述 *
            </label>
            <textarea
              required
              rows={4}
              value={question}
              onChange={(e) => setQuestion(e.target.value)}
              placeholder="詳細說明現場發現之圖面矛盾、技術疑義、法規爭點或業主需求待確認處..."
              className="w-full px-3 py-2 text-sm border-2 border-black bg-white text-black font-body placeholder:text-[#525252] placeholder:italic focus:outline-none"
            />
          </div>

          {/* Suggested Solution */}
          <div>
            <label className="block text-xs font-mono font-bold uppercase text-black mb-1.5">
              SUGGESTED SOLUTION / 承包商建議方案
            </label>
            <textarea
              rows={3}
              value={suggestedSolution}
              onChange={(e) => setSuggestedSolution(e.target.value)}
              placeholder="提出經結構或機電技師初步評估之替代作法、補強構想或施作程序..."
              className="w-full px-3 py-2 text-sm border-2 border-black bg-white text-black font-body placeholder:text-[#525252] placeholder:italic focus:outline-none"
            />
          </div>

          {/* Impact Assessments Section */}
          <div className="p-4 bg-[#F5F5F5] border-2 border-black space-y-3">
            <h4 className="text-xs font-mono font-bold text-black uppercase tracking-wider">
              IMPACT ASSESSMENTS / 影響性評估 (合約存證關鍵)
            </h4>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-1">
              {/* Cost Impact */}
              <div className="flex items-center justify-between p-3 bg-white border-2 border-black">
                <div className="flex items-center gap-2">
                  <DollarSign className="w-4 h-4 text-black" strokeWidth={1.5} />
                  <div>
                    <div className="text-xs font-mono font-bold uppercase text-black">
                      COST IMPACT (成本追加)
                    </div>
                    <span className="text-[11px] font-mono text-[#525252]">是否衍生工程追加款</span>
                  </div>
                </div>

                <div className="flex items-center gap-1">
                  <button
                    type="button"
                    onClick={() => setCostImpact(false)}
                    className={`px-3 py-1 text-xs font-mono uppercase border border-black ${
                      !costImpact
                        ? 'bg-black text-white font-bold'
                        : 'bg-white text-black hover:bg-[#F5F5F5]'
                    }`}
                  >
                    NO (否)
                  </button>
                  <button
                    type="button"
                    onClick={() => setCostImpact(true)}
                    className={`px-3 py-1 text-xs font-mono uppercase border border-black ${
                      costImpact
                        ? 'bg-black text-white font-bold'
                        : 'bg-white text-black hover:bg-[#F5F5F5]'
                    }`}
                  >
                    YES (是)
                  </button>
                </div>
              </div>

              {/* Schedule Impact */}
              <div className="p-3 bg-white border-2 border-black space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Clock className="w-4 h-4 text-black" strokeWidth={1.5} />
                    <div>
                      <div className="text-xs font-mono font-bold uppercase text-black">
                        SCHEDULE IMPACT (工期影響)
                      </div>
                      <span className="text-[11px] font-mono text-[#525252]">是否延宕關鍵路徑</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      onClick={() => setScheduleImpact(false)}
                      className={`px-3 py-1 text-xs font-mono uppercase border border-black ${
                        !scheduleImpact
                          ? 'bg-black text-white font-bold'
                          : 'bg-white text-black hover:bg-[#F5F5F5]'
                      }`}
                    >
                      NO (否)
                    </button>
                    <button
                      type="button"
                      onClick={() => setScheduleImpact(true)}
                      className={`px-3 py-1 text-xs font-mono uppercase border border-black ${
                        scheduleImpact
                          ? 'bg-black text-white font-bold'
                          : 'bg-white text-black hover:bg-[#F5F5F5]'
                      }`}
                    >
                      YES (是)
                    </button>
                  </div>
                </div>

                {scheduleImpact && (
                  <div className="flex items-center gap-2 pt-1 border-t border-black">
                    <span className="text-xs font-mono uppercase text-black whitespace-nowrap">
                      DAYS IMPACT:
                    </span>
                    <input
                      type="number"
                      min="1"
                      max="365"
                      value={scheduleDaysImpact}
                      onChange={(e) => setScheduleDaysImpact(parseInt(e.target.value) || 0)}
                      className="w-20 px-2 py-1 text-xs font-mono font-bold border-2 border-black bg-white text-black focus:outline-none"
                    />
                    <span className="text-xs font-mono uppercase text-black">日曆天 (CALENDAR DAYS)</span>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Reviewer & Required Due Date */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-mono font-bold uppercase text-black mb-1.5">
                ASSIGNED REVIEWER (審查負責人) *
              </label>
              <select
                value={assignedReviewerId}
                onChange={(e) => setAssignedReviewerId(e.target.value)}
                className="w-full px-3 py-2 text-sm border-2 border-black bg-white text-black font-body focus:outline-none"
              >
                {reviewers.map((r) => (
                  <option key={r.id} value={r.id}>
                    {r.full_name} ({r.role === 'REVIEWER_CLIENT' ? '業主/總顧問' : r.department})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-mono font-bold uppercase text-black mb-1.5">
                REQUIRED DUE DATE (預計回覆期限) *
              </label>
              <input
                type="date"
                required
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
                className="w-full px-3 py-2 text-sm border-2 border-black bg-white text-black font-mono focus:outline-none"
              />
              <span className="text-[11px] font-mono uppercase text-[#525252] mt-1 block">
                超期未回覆將由系統自動標記 [ OVERDUE 逾期警示 ]
              </span>
            </div>
          </div>

          {/* Pre-upload zone for new RFI */}
          <div>
            <label className="block text-xs font-mono font-bold uppercase text-black mb-1.5">
              ATTACHMENTS / 掛載技術圖紙與現場貼圖 (S3 Pre-signed / Ctrl+V)
            </label>
            <ClipboardUploadHelper
              targetType="RFI"
              targetId={createdRFIId}
              onUploadSuccess={() => {}}
            />
          </div>
        </form>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 px-6 py-4 border-t-2 border-black bg-[#F5F5F5]">
          <button
            type="button"
            onClick={onClose}
            className="btn-mono-outline"
          >
            CANCEL (取消)
          </button>
          <button
            type="submit"
            form="create-rfi-form"
            id="btn-submit-rfi"
            className="btn-mono-primary inline-flex items-center gap-1.5"
          >
            <Send className="w-3.5 h-3.5" strokeWidth={1.5} />
            SUBMIT RFI (建立並送出)
          </button>
        </div>
      </div>
    </div>
  );
};
