import React, { useState } from 'react';
import {
  X,
  Clock,
  AlertTriangle,
  CheckCircle2,
  Calendar,
  User,
  DollarSign,
  FileText,
  Paperclip,
  Check,
  Send,
  Eye,
  ShieldCheck,
  ArrowRight,
  RotateCcw,
  History,
  Lock,
  Download
} from 'lucide-react';
import { RFI, User as UserType, Attachment, RFIAuditLog, RFIStatus } from '../../types/pms';
import { storageService } from '../../services/storageService';
import { checkPermission, ROLE_PERMISSIONS } from '../../utils/rbac';
import { ClipboardUploadHelper } from '../Attachment/ClipboardUploadHelper';
import { LightboxModal } from '../Attachment/LightboxModal';

interface RFIDetailModalProps {
  rfiId: string;
  currentUser: UserType;
  users: UserType[];
  isOpen: boolean;
  onClose: () => void;
  onUpdated: () => void;
}

const STATUS_FLOW_STEPS: { key: RFIStatus; label: string }[] = [
  { key: 'DRAFT', label: '草稿' },
  { key: 'SUBMITTED', label: '已送出' },
  { key: 'UNDER_REVIEW', label: '審理中' },
  { key: 'ANSWERED', label: '已回覆' },
  { key: 'CLOSED', label: '已結案' }
];

export const RFIDetailModal: React.FC<RFIDetailModalProps> = ({
  rfiId,
  currentUser,
  users,
  isOpen,
  onClose,
  onUpdated
}) => {
  const rfi = storageService.getRFIById(rfiId);
  const [activeTab, setActiveTab] = useState<'OVERVIEW' | 'ATTACHMENTS' | 'AUDIT_TRAIL'>('OVERVIEW');
  const [replyInput, setReplyInput] = useState(rfi?.official_reply || '');
  const [isEditingReply, setIsEditingReply] = useState(false);
  const [closeNote, setCloseNote] = useState('');
  const [isClosingModal, setIsClosingModal] = useState(false);
  const [previewAttachment, setPreviewAttachment] = useState<Attachment | null>(null);

  if (!isOpen || !rfi) return null;

  const isOverdue = storageService.isRFIOverdue(rfi);
  const author = users.find((u) => u.id === rfi.author_id);
  const reviewer = users.find((u) => u.id === rfi.assigned_reviewer_id);
  const answeredByUser = users.find((u) => u.id === rfi.answered_by);
  const closedByUser = users.find((u) => u.id === rfi.closed_by);

  const attachments = storageService.getAttachments('RFI', rfi.id);
  const auditLogs = storageService.getRFIAuditLogs(rfi.id);

  // RBAC checks
  const canOfficialReply = checkPermission(currentUser.role, 'canOfficialReplyRFI');
  const canClose = checkPermission(currentUser.role, 'canCloseRFI');

  // Stepper calculations
  const currentStepIdx = STATUS_FLOW_STEPS.findIndex((s) => s.key === rfi.status);

  // Actions
  const handleTransitionStatus = (nextStatus: RFIStatus, comment?: string) => {
    storageService.updateRFIStatus(rfi.id, nextStatus, comment);
    onUpdated();
  };

  const handleSaveReply = () => {
    if (!replyInput.trim()) return;
    storageService.replyRFI(rfi.id, replyInput.trim());
    setIsEditingReply(false);
    onUpdated();
  };

  const handleConfirmClose = () => {
    storageService.closeRFI(rfi.id, closeNote.trim());
    setIsClosingModal(false);
    onUpdated();
  };

  return (
    <div
      id="rfi-detail-overlay"
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-3 sm:p-5"
      onClick={onClose}
    >
      <div
        id="rfi-detail-card"
        className="flex flex-col w-full max-w-4xl max-h-[92vh] bg-white border-2 border-black overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header with RFI Number & Overdue Alert */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 px-6 py-4 border-b-2 border-black bg-[#F5F5F5]">
          <div className="flex items-center gap-3 flex-wrap">
            <span className="font-mono text-sm font-black px-3 py-1 bg-black text-white border border-black">
              {rfi.rfi_number}
            </span>

            {/* Overdue alert indicator */}
            {isOverdue && (
              <span className="inline-flex items-center gap-1.5 px-3 py-1 text-xs font-mono font-bold bg-black text-white border border-black">
                <AlertTriangle className="w-3.5 h-3.5" strokeWidth={1.5} />
                [ OVERDUE / 回覆期限已逾期 ]
              </span>
            )}

            {rfi.status === 'CLOSED' && (
              <span className="inline-flex items-center gap-1.5 px-3 py-1 text-xs font-mono font-bold bg-[#525252] text-white border border-black">
                <ShieldCheck className="w-3.5 h-3.5" strokeWidth={1.5} />
                CLOSED / 已正式結案歸檔
              </span>
            )}

            {rfi.status === 'REJECTED' && (
              <span className="inline-flex items-center gap-1.5 px-3 py-1 text-xs font-mono font-bold bg-white text-black border-2 border-black line-through">
                <X className="w-3.5 h-3.5" strokeWidth={1.5} />
                REJECTED / 已退件要求補正
              </span>
            )}
          </div>

          <div className="flex items-center gap-4 self-end sm:self-center">
            <span className="text-xs text-[#525252] font-mono">
              DATE: {new Date(rfi.created_at).toLocaleDateString()}
            </span>
            <button
              onClick={onClose}
              className="p-1 text-black hover:bg-black hover:text-white border border-transparent hover:border-black transition-colors"
            >
              <X className="w-5 h-5" strokeWidth={1.5} />
            </button>
          </div>
        </div>

        {/* State Stepper Visualizer */}
        <div className="px-6 py-3.5 bg-white border-b-2 border-black">
          <div className="flex items-center justify-between max-w-2xl mx-auto">
            {STATUS_FLOW_STEPS.map((step, idx) => {
              const isPassed = currentStepIdx >= idx && rfi.status !== 'REJECTED';
              const isCurrent = rfi.status === step.key;

              return (
                <div key={step.key} className="flex items-center gap-2">
                  <div className="flex flex-col items-center">
                    <div
                      className={`w-7 h-7 flex items-center justify-center text-xs font-mono font-bold border-2 border-black transition-all ${
                        isCurrent
                          ? 'bg-black text-white'
                          : isPassed
                          ? 'bg-black text-white'
                          : 'bg-white text-black opacity-40'
                      }`}
                    >
                      {isPassed && !isCurrent ? <Check className="w-3.5 h-3.5" strokeWidth={2} /> : idx + 1}
                    </div>
                    <span
                      className={`text-[11px] mt-1 font-mono uppercase whitespace-nowrap ${
                        isCurrent
                          ? 'text-black font-bold underline'
                          : isPassed
                          ? 'text-black font-semibold'
                          : 'text-[#525252]'
                      }`}
                    >
                      {step.label}
                    </span>
                  </div>

                  {idx < STATUS_FLOW_STEPS.length - 1 && (
                    <div
                      className={`h-0.5 w-10 sm:w-16 mb-4 transition-colors ${
                        currentStepIdx > idx && rfi.status !== 'REJECTED'
                          ? 'bg-black'
                          : 'bg-[#525252]/30'
                      }`}
                    />
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="flex items-center gap-6 px-6 border-b-2 border-black text-xs font-mono uppercase font-bold text-black bg-[#F5F5F5]">
          <button
            type="button"
            onClick={() => setActiveTab('OVERVIEW')}
            className={`py-3 border-b-2 transition-colors ${
              activeTab === 'OVERVIEW'
                ? 'border-black text-black bg-white px-3'
                : 'border-transparent text-[#525252] hover:text-black'
            }`}
          >
            OVERVIEW (RFI 資訊與回覆)
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('ATTACHMENTS')}
            className={`py-3 border-b-2 transition-colors flex items-center gap-1.5 ${
              activeTab === 'ATTACHMENTS'
                ? 'border-black text-black bg-white px-3'
                : 'border-transparent text-[#525252] hover:text-black'
            }`}
          >
            ATTACHMENTS (圖面附件)
            <span className="px-1.5 py-0.5 text-xs border border-black bg-white font-mono">
              {attachments.length}
            </span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('AUDIT_TRAIL')}
            className={`py-3 border-b-2 transition-colors flex items-center gap-1.5 ${
              activeTab === 'AUDIT_TRAIL'
                ? 'border-black text-black bg-white px-3'
                : 'border-transparent text-[#525252] hover:text-black'
            }`}
          >
            <History className="w-3.5 h-3.5" strokeWidth={1.5} />
            AUDIT TRAIL (存證軌跡)
            <span className="px-1.5 py-0.5 text-xs border border-black bg-white font-mono">
              {auditLogs.length}
            </span>
          </button>
        </div>

        {/* Modal Scrollable Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {activeTab === 'OVERVIEW' && (
            <div className="space-y-6">
              {/* Subject Title */}
              <div>
                <h2 className="text-xl font-display font-black text-black leading-snug">
                  {rfi.subject}
                </h2>
                <div className="flex items-center gap-3 mt-2 flex-wrap text-xs font-mono text-[#525252]">
                  <span>
                    SPEC: <strong className="text-black">{rfi.reference_spec_no}</strong>
                  </span>
                  <span>|</span>
                  <span>
                    ENGINEER: <strong className="text-black">{author ? author.full_name : '現場工程師'}</strong>
                  </span>
                  <span>|</span>
                  <span>
                    REVIEWER: <strong className="text-black">{reviewer ? reviewer.full_name : '業主審查團隊'}</strong>
                  </span>
                </div>
              </div>

              {/* Impact Evaluation Row */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 p-4 bg-white border-2 border-black font-mono">
                {/* Cost impact */}
                <div className="flex items-center gap-3 border-r border-black/20 pr-2">
                  <div className="w-9 h-9 border border-black flex items-center justify-center shrink-0 bg-white text-black">
                    <DollarSign className="w-5 h-5" strokeWidth={1.5} />
                  </div>
                  <div>
                    <div className="text-[11px] font-bold text-[#525252] uppercase tracking-wider">COST IMPACT</div>
                    <div className="text-xs font-bold text-black uppercase">
                      {rfi.cost_impact ? 'YES (涉及追加款)' : 'NONE (無成本影響)'}
                    </div>
                  </div>
                </div>

                {/* Schedule impact */}
                <div className="flex items-center gap-3 border-r border-black/20 pr-2">
                  <div className="w-9 h-9 border border-black flex items-center justify-center shrink-0 bg-white text-black">
                    <Clock className="w-5 h-5" strokeWidth={1.5} />
                  </div>
                  <div>
                    <div className="text-[11px] font-bold text-[#525252] uppercase tracking-wider">SCHEDULE IMPACT</div>
                    <div className="text-xs font-bold text-black uppercase">
                      {rfi.schedule_impact ? (
                        <span>+{rfi.schedule_days_impact} DAYS (延宕)</span>
                      ) : (
                        'NONE (無工期影響)'
                      )}
                    </div>
                  </div>
                </div>

                {/* Due Date & Overdue */}
                <div className="flex items-center gap-3">
                  <div className={`w-9 h-9 border border-black flex items-center justify-center shrink-0 ${isOverdue ? 'bg-black text-white' : 'bg-white text-black'}`}>
                    <Calendar className="w-5 h-5" strokeWidth={1.5} />
                  </div>
                  <div>
                    <div className="text-[11px] font-bold text-[#525252] uppercase tracking-wider">DUE DATE</div>
                    <div className="text-xs font-bold text-black flex items-center gap-1">
                      {rfi.due_date ? new Date(rfi.due_date).toLocaleDateString() : 'NONE'}
                      {isOverdue && <span className="font-bold underline">[ OVERDUE ]</span>}
                    </div>
                  </div>
                </div>
              </div>

              {/* Technical Question */}
              <div className="p-4 border-2 border-black bg-white space-y-1.5">
                <h4 className="text-xs font-mono font-bold text-black uppercase tracking-wider flex items-center gap-1.5 border-b border-black pb-1.5">
                  <FileText className="w-4 h-4" strokeWidth={1.5} />
                  TECHNICAL QUERY / 技術疑義提問詳述
                </h4>
                <p className="text-sm font-body text-black whitespace-pre-wrap leading-relaxed pt-1">
                  {rfi.question}
                </p>
              </div>

              {/* Suggested Solution */}
              {rfi.suggested_solution && (
                <div className="p-4 border-2 border-black bg-[#F5F5F5] space-y-1.5">
                  <h4 className="text-xs font-mono font-bold text-black uppercase tracking-wider flex items-center gap-1.5 border-b border-black pb-1.5">
                    <CheckCircle2 className="w-4 h-4" strokeWidth={1.5} />
                    SUGGESTED SOLUTION / 承包商建議解決方案
                  </h4>
                  <p className="text-sm font-body text-black whitespace-pre-wrap leading-relaxed pt-1">
                    {rfi.suggested_solution}
                  </p>
                </div>
              )}

              {/* Official Response */}
              <div className="p-5 border-2 border-black bg-white space-y-3">
                <div className="flex items-center justify-between border-b-2 border-black pb-3">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 bg-black text-white flex items-center justify-center shrink-0 border border-black">
                      <ShieldCheck className="w-4 h-4" strokeWidth={1.5} />
                    </div>
                    <div>
                      <h4 className="text-sm font-mono font-bold uppercase text-black flex items-center gap-2">
                        OFFICIAL RESPONSE / 官方核定意見
                        {rfi.official_reply && (
                          <span className="px-2 py-0.5 text-[11px] bg-black text-white font-bold border border-black">
                            SIGNED (已簽署)
                          </span>
                        )}
                      </h4>
                      <p className="text-xs font-mono text-[#525252]">
                        工程合約存證效力，僅限業主代表、總顧問或專案主管填寫
                      </p>
                    </div>
                  </div>

                  {canOfficialReply && !isEditingReply && (
                    <button
                      type="button"
                      onClick={() => {
                        setReplyInput(rfi.official_reply || '');
                        setIsEditingReply(true);
                      }}
                      className="btn-mono-primary py-1.5 px-3 text-xs"
                    >
                      {rfi.official_reply ? 'EDIT REPLY' : 'OFFICIAL REPLY'}
                    </button>
                  )}
                </div>

                {isEditingReply ? (
                  <div className="space-y-3 pt-2">
                    <textarea
                      rows={5}
                      value={replyInput}
                      onChange={(e) => setReplyInput(e.target.value)}
                      placeholder="輸入正式官方回覆意見、變更設計核可字號、工程指導方針與圖說修訂版次..."
                      className="w-full p-3 text-sm border-2 border-black bg-white text-black font-body focus:outline-none"
                    />
                    <div className="flex items-center justify-end gap-2">
                      <button
                        type="button"
                        onClick={() => setIsEditingReply(false)}
                        className="btn-mono-outline py-1.5 px-3 text-xs"
                      >
                        CANCEL
                      </button>
                      <button
                        type="button"
                        onClick={handleSaveReply}
                        className="btn-mono-primary inline-flex items-center gap-1.5 py-1.5 px-4 text-xs"
                      >
                        <Send className="w-3.5 h-3.5" strokeWidth={1.5} />
                        SUBMIT & SIGN (ANSWERED)
                      </button>
                    </div>
                  </div>
                ) : rfi.official_reply ? (
                  <div className="space-y-3 pt-1">
                    <div className="text-sm font-body text-black whitespace-pre-wrap leading-relaxed bg-[#F5F5F5] p-4 border border-black">
                      {rfi.official_reply}
                    </div>
                    <div className="flex items-center justify-between text-xs font-mono text-[#525252]">
                      <span>
                        SIGNATORY: <strong className="text-black">{answeredByUser ? answeredByUser.full_name : '郭文正 (業主總顧問)'}</strong>
                      </span>
                      <span>
                        TIME: {rfi.answered_at ? new Date(rfi.answered_at).toLocaleString() : 'SIGNED'}
                      </span>
                    </div>
                  </div>
                ) : (
                  <div className="p-4 bg-[#F5F5F5] border border-black text-xs font-mono uppercase text-black">
                    AWAITING OFFICIAL RESPONSE FROM ASSIGNED REVIEWER.
                  </div>
                )}
              </div>
            </div>
          )}

          {activeTab === 'ATTACHMENTS' && (
            <div className="space-y-5">
              {/* Clipboard paste zone */}
              <ClipboardUploadHelper
                targetType="RFI"
                targetId={rfi.id}
                onUploadSuccess={() => onUpdated()}
              />

              <div>
                <h5 className="text-xs font-mono font-bold uppercase text-black mb-3">
                  ATTACHMENTS ({attachments.length})
                </h5>

                {attachments.length === 0 ? (
                  <div className="p-8 text-center text-xs font-mono uppercase text-[#525252] border-2 border-black border-dashed">
                    NO ATTACHMENTS FOUND. USE DRAG & DROP OR CTRL+V TO PASTE.
                  </div>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {attachments.map((att) => {
                      const isImg =
                        att.mime_type.startsWith('image/') ||
                        /\.(png|jpe?g|webp|gif)$/i.test(att.file_name);
                      return (
                        <div
                          key={att.id}
                          className="flex items-center justify-between p-3 border-2 border-black bg-white hover:bg-[#F5F5F5] transition-colors"
                        >
                          <div
                            className="flex items-center gap-3 min-w-0 cursor-pointer"
                            onClick={() => setPreviewAttachment(att)}
                          >
                            {isImg ? (
                              <img
                                src={att.file_url}
                                alt=""
                                referrerPolicy="no-referrer"
                                className="w-12 h-12 object-cover border border-black shrink-0"
                              />
                            ) : (
                              <div className="w-12 h-12 bg-[#F5F5F5] text-black border border-black flex items-center justify-center shrink-0">
                                <FileText className="w-6 h-6" strokeWidth={1.5} />
                              </div>
                            )}

                            <div className="min-w-0 font-mono">
                              <p className="text-xs font-bold text-black truncate">
                                {att.file_name}
                              </p>
                              <div className="flex items-center gap-2 text-[11px] text-[#525252] mt-0.5">
                                <span>{(att.file_size / 1024 / 1024).toFixed(2)} MB</span>
                                {att.is_clipboard && (
                                  <span className="text-black font-bold uppercase">
                                    [ CLIPBOARD ]
                                  </span>
                                )}
                              </div>
                            </div>
                          </div>

                          <div className="flex items-center gap-1 shrink-0">
                            <button
                              type="button"
                              onClick={() => setPreviewAttachment(att)}
                              className="p-1.5 text-black hover:bg-black hover:text-white border border-black"
                              title="開啟 Lightbox 檢視"
                            >
                              <Eye className="w-4 h-4" strokeWidth={1.5} />
                            </button>
                            <a
                              href={att.file_url}
                              download={att.file_name}
                              target="_blank"
                              rel="noreferrer"
                              className="p-1.5 text-black hover:bg-black hover:text-white border border-black"
                              title="下載"
                            >
                              <Download className="w-4 h-4" strokeWidth={1.5} />
                            </a>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          )}

          {activeTab === 'AUDIT_TRAIL' && (
            <div className="space-y-4">
              <div className="p-3.5 bg-[#F5F5F5] border-2 border-black text-xs font-mono text-black">
                [ SECURITY & AUDIT TRAIL ] 本系統對所有 RFI 狀態變更、審查人官方回覆與圖面附件上傳進行不可篡改之 AUDIT TRAIL 存證，限制不可硬刪除，確保合約法律效益。
              </div>

              <div className="relative pl-6 space-y-6 before:absolute before:left-2 before:top-2 before:bottom-2 before:w-0.5 before:bg-black">
                {auditLogs.map((log) => (
                  <div key={log.id} className="relative group">
                    <div className="absolute -left-6 top-1 w-3 h-3 bg-black border-2 border-white" />
                    <div className="p-3.5 bg-white border-2 border-black text-xs font-mono space-y-1">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <strong className="text-black font-bold">
                            {log.user_name}
                          </strong>
                          <span className="text-[10px] px-1.5 py-0.5 border border-black bg-[#F5F5F5] text-black">
                            {log.user_role}
                          </span>
                        </div>
                        <span className="text-[#525252] text-[11px]">
                          {new Date(log.timestamp).toLocaleString()}
                        </span>
                      </div>
                      <p className="text-black font-body">{log.details}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Action Footer: Lifecycle State Machine Buttons */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 px-6 py-4 border-t-2 border-black bg-[#F5F5F5]">
          <div className="text-xs font-mono text-black flex items-center gap-2">
            <span>USER:</span>
            <span className="font-bold">
              {currentUser.full_name} ({currentUser.role})
            </span>
          </div>

          <div className="flex items-center gap-2 flex-wrap justify-end">
            {/* If Draft -> Submit */}
            {rfi.status === 'DRAFT' && (
              <button
                type="button"
                onClick={() => handleTransitionStatus('SUBMITTED', '工程師正式送出審查')}
                className="btn-mono-primary inline-flex items-center gap-1.5"
              >
                <Send className="w-3.5 h-3.5" strokeWidth={1.5} /> SUBMIT RFI (送出審查)
              </button>
            )}

            {/* If Submitted -> Under Review */}
            {rfi.status === 'SUBMITTED' && (
              <button
                type="button"
                onClick={() => handleTransitionStatus('UNDER_REVIEW', '審查員接單審查中')}
                className="btn-mono-primary inline-flex items-center gap-1.5"
              >
                <ArrowRight className="w-3.5 h-3.5" strokeWidth={1.5} /> ACCEPT (轉為審查中)
              </button>
            )}

            {/* If Under Review and Reviewer can reply */}
            {rfi.status === 'UNDER_REVIEW' && canOfficialReply && (
              <>
                <button
                  type="button"
                  onClick={() => handleTransitionStatus('REJECTED', '所附圖面規格資訊不足，退件補正')}
                  className="btn-mono-outline"
                >
                  REJECT (退件補正)
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setActiveTab('OVERVIEW');
                    setIsEditingReply(true);
                  }}
                  className="btn-mono-primary inline-flex items-center gap-1.5"
                >
                  <Send className="w-3.5 h-3.5" strokeWidth={1.5} /> SIGN OFFICIAL REPLY (填寫簽署)
                </button>
              </>
            )}

            {/* If Answered and PM/Admin can Close */}
            {rfi.status === 'ANSWERED' && canClose && (
              <button
                type="button"
                onClick={() => setIsClosingModal(true)}
                className="btn-mono-primary inline-flex items-center gap-1.5"
              >
                <ShieldCheck className="w-3.5 h-3.5" strokeWidth={1.5} /> CLOSE RFI (正式結案歸檔)
              </button>
            )}

            {/* Close Modal button */}
            <button
              type="button"
              onClick={onClose}
              className="btn-mono-outline"
            >
              CLOSE WINDOW (關閉)
            </button>
          </div>
        </div>
      </div>

      {/* Close RFI Confirmation Modal */}
      {isClosingModal && (
        <div
          className="fixed inset-0 z-60 flex items-center justify-center bg-black/70 p-4"
          onClick={() => setIsClosingModal(false)}
        >
          <div
            className="w-full max-w-md bg-white p-6 border-2 border-black"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="text-base font-display font-black text-black mb-2 flex items-center gap-2">
              <ShieldCheck className="w-5 h-5" strokeWidth={1.5} />
              CLOSE RFI / 確認辦理結案存證
            </h3>
            <p className="text-xs font-mono text-[#525252] mb-4">
              結案後將凍結單據，此紀錄將做為工程請款與工期結算之合法法律佐證依據。
            </p>

            <textarea
              rows={3}
              value={closeNote}
              onChange={(e) => setCloseNote(e.target.value)}
              placeholder="輸入結案說明（如：變更設計單 No.CN-0911 已開立並完成驗收備查）..."
              className="w-full p-3 text-xs border-2 border-black bg-white text-black font-body focus:outline-none mb-4"
            />

            <div className="flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={() => setIsClosingModal(false)}
                className="btn-mono-outline"
              >
                CANCEL (取消)
              </button>
              <button
                type="button"
                onClick={handleConfirmClose}
                className="btn-mono-primary"
              >
                CONFIRM CLOSE (確認結案)
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Lightbox for preview */}
      {previewAttachment && (
        <LightboxModal
          attachment={previewAttachment}
          onClose={() => setPreviewAttachment(null)}
        />
      )}
    </div>
  );
};
