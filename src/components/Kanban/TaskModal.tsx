import React, { useState } from 'react';
import {
  X,
  Calendar,
  Clock,
  User,
  Users,
  Tag,
  Paperclip,
  MessageSquare,
  Trash2,
  Send,
  Eye,
  Plus,
  AlertCircle
} from 'lucide-react';
import { Task, User as UserType, Priority, Attachment, TaskComment } from '../../types/pms';
import { storageService } from '../../services/storageService';
import { checkPermission } from '../../utils/rbac';
import { ClipboardUploadHelper } from '../Attachment/ClipboardUploadHelper';
import { LightboxModal } from '../Attachment/LightboxModal';

interface TaskModalProps {
  task?: Task | null;
  columnId?: string;
  users: UserType[];
  currentUser: UserType;
  isOpen: boolean;
  onClose: () => void;
  onSave: () => void;
}

const PRIORITIES: { value: Priority; label: string }[] = [
  { value: 'LOW', label: '低優先級' },
  { value: 'MEDIUM', label: '中等優先' },
  { value: 'HIGH', label: '高度重要' },
  { value: 'URGENT', label: '緊急任務' }
];

const CATEGORIES = ['機電工程', '結構工程', '弱電工程', '消防安檢', '裝修工程', '一般工作'];

export const TaskModal: React.FC<TaskModalProps> = ({
  task,
  columnId,
  users,
  currentUser,
  isOpen,
  onClose,
  onSave
}) => {
  const isEditing = Boolean(task);

  const [title, setTitle] = useState(task?.title || '');
  const [description, setDescription] = useState(task?.description || '');
  const [priority, setPriority] = useState<Priority>(task?.priority || 'MEDIUM');
  const [moduleCategory, setModuleCategory] = useState(task?.module_category || '機電工程');
  const [assigneeId, setAssigneeId] = useState<string | null>(task?.assignee_id || null);
  const [collaborators, setCollaborators] = useState<string[]>(task?.collaborators || []);
  const [dueDate, setDueDate] = useState(task?.due_date ? task.due_date.slice(0, 10) : '');
  const [estimatedHours, setEstimatedHours] = useState<number>(task?.estimated_hours || 8);
  const [tags, setTags] = useState<string[]>(task?.tags || []);
  const [tagInput, setTagInput] = useState('');

  const [activeTab, setActiveTab] = useState<'DETAILS' | 'ATTACHMENTS' | 'COMMENTS'>('DETAILS');
  const [commentInput, setCommentInput] = useState('');
  const [previewAttachment, setPreviewAttachment] = useState<Attachment | null>(null);

  if (!isOpen) return null;

  const canAssign = checkPermission(currentUser.role, 'canAssignTask');
  const taskId = task?.id || 'temp-' + Date.now();
  const attachments = task ? storageService.getAttachments('TASK', task.id) : [];
  const comments = task ? storageService.getComments(task.id) : [];

  const handleAddTag = (e: React.KeyboardEvent | React.MouseEvent) => {
    if ('key' in e && e.key !== 'Enter') return;
    e.preventDefault();
    if (tagInput.trim() && !tags.includes(tagInput.trim())) {
      setTags([...tags, tagInput.trim()]);
      setTagInput('');
    }
  };

  const handleRemoveTag = (tagToRemove: string) => {
    setTags(tags.filter((t) => t !== tagToRemove));
  };

  const toggleCollaborator = (userId: string) => {
    if (collaborators.includes(userId)) {
      setCollaborators(collaborators.filter((id) => id !== userId));
    } else {
      setCollaborators([...collaborators, userId]);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    if (isEditing && task) {
      storageService.updateTask(task.id, {
        title,
        description,
        priority,
        module_category: moduleCategory,
        assignee_id: assigneeId,
        collaborators,
        due_date: dueDate ? new Date(dueDate).toISOString() : null,
        estimated_hours: estimatedHours,
        tags
      });
    } else if (columnId) {
      storageService.createTask({
        column_id: columnId,
        title,
        description,
        priority,
        module_category: moduleCategory,
        assignee_id: assigneeId,
        collaborators,
        due_date: dueDate ? new Date(dueDate).toISOString() : null,
        estimated_hours: estimatedHours,
        tags
      });
    }
    onSave();
    onClose();
  };

  const handleDelete = () => {
    if (!task) return;
    if (confirm('確定要刪除這張卡片嗎？此操作無法撤銷。')) {
      storageService.deleteTask(task.id);
      onSave();
      onClose();
    }
  };

  const handleAddComment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!commentInput.trim() || !task) return;
    storageService.addComment(task.id, commentInput.trim());
    setCommentInput('');
  };

  return (
    <div
      id="task-modal-overlay"
      className="fixed inset-0 z-40 flex items-center justify-center bg-black/70 p-4 animate-in fade-in duration-100"
      onClick={onClose}
    >
      <div
        id="task-modal-card"
        className="flex flex-col w-full max-w-3xl max-h-[90vh] bg-white border-4 border-black shadow-none overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b-2 border-black bg-white">
          <div className="flex items-center gap-3">
            <span className="text-xs font-mono font-bold uppercase tracking-widest bg-black text-white px-2.5 py-1 border border-black">
              {isEditing ? `TASK #${task?.id.slice(-5)}` : 'CREATE TASK'}
            </span>
            <span className="text-xs font-mono uppercase text-[#525252]">
              {isEditing ? 'EDIT WORK ITEM' : 'AGILE WORK ORDER'}
            </span>
          </div>

          <div className="flex items-center gap-2">
            {isEditing && (
              <button
                type="button"
                id="btn-delete-task"
                onClick={handleDelete}
                className="p-1.5 border border-black text-black hover:bg-black hover:text-white transition-colors"
                title="刪除任務"
              >
                <Trash2 className="w-4 h-4" strokeWidth={1.5} />
              </button>
            )}
            <button
              type="button"
              id="btn-close-task-modal"
              onClick={onClose}
              className="p-1.5 border border-black text-black hover:bg-black hover:text-white transition-colors"
            >
              <X className="w-4 h-4" strokeWidth={1.5} />
            </button>
          </div>
        </div>

        {/* Tab Switcher */}
        {isEditing && (
          <div className="flex items-center gap-2 px-6 border-b-2 border-black font-mono text-xs uppercase bg-[#F5F5F5]">
            <button
              type="button"
              onClick={() => setActiveTab('DETAILS')}
              className={`py-2.5 px-4 border-b-2 transition-colors ${
                activeTab === 'DETAILS'
                  ? 'border-black bg-white text-black font-bold -mb-[2px]'
                  : 'border-transparent text-[#525252] hover:text-black'
              }`}
            >
              DETAILS (基本屬性)
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('ATTACHMENTS')}
              className={`py-2.5 px-4 border-b-2 transition-colors flex items-center gap-1.5 ${
                activeTab === 'ATTACHMENTS'
                  ? 'border-black bg-white text-black font-bold -mb-[2px]'
                  : 'border-transparent text-[#525252] hover:text-black'
              }`}
            >
              ATTACHMENTS ({attachments.length})
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('COMMENTS')}
              className={`py-2.5 px-4 border-b-2 transition-colors flex items-center gap-1.5 ${
                activeTab === 'COMMENTS'
                  ? 'border-black bg-white text-black font-bold -mb-[2px]'
                  : 'border-transparent text-[#525252] hover:text-black'
              }`}
            >
              COMMENTS ({comments.length})
            </button>
          </div>
        )}

        {/* Body Content */}
        <div className="flex-1 overflow-y-auto p-6 bg-white">
          {activeTab === 'DETAILS' && (
            <form id="task-form" onSubmit={handleSubmit} className="space-y-5">
              {/* Title */}
              <div>
                <label className="block text-xs font-mono font-bold uppercase tracking-wider text-black mb-1.5">
                  任務標題 (TASK TITLE) *
                </label>
                <input
                  type="text"
                  required
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="輸入簡明扼要之工程工項或驗收任務標題..."
                  className="w-full px-3.5 py-2.5 border-2 border-black bg-white text-black font-body text-sm placeholder:italic placeholder:text-[#525252] focus:outline-none"
                />
              </div>

              {/* Description */}
              <div>
                <label className="block text-xs font-mono font-bold uppercase tracking-wider text-black mb-1.5">
                  工項內容與規範描述 (SPECIFICATION)
                </label>
                <textarea
                  rows={4}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="輸入詳細施工條件、查驗法規依據、圖號或預期成果..."
                  className="w-full px-3.5 py-2.5 border-2 border-black bg-white text-black font-body text-sm placeholder:italic placeholder:text-[#525252] focus:outline-none"
                />
              </div>

              {/* Grid 1: Priority & Category */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-mono font-bold uppercase tracking-wider text-black mb-1.5">
                    優先等級 (PRIORITY)
                  </label>
                  <select
                    value={priority}
                    onChange={(e) => setPriority(e.target.value as Priority)}
                    className="w-full px-3 py-2 border-2 border-black bg-white text-black font-mono text-xs uppercase focus:outline-none"
                  >
                    {PRIORITIES.map((p) => (
                      <option key={p.value} value={p.value}>
                        {p.value} - {p.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-mono font-bold uppercase tracking-wider text-black mb-1.5">
                    工程模組分類 (MODULE CATEGORY)
                  </label>
                  <select
                    value={moduleCategory}
                    onChange={(e) => setModuleCategory(e.target.value)}
                    className="w-full px-3 py-2 border-2 border-black bg-white text-black font-mono text-xs uppercase focus:outline-none"
                  >
                    {CATEGORIES.map((c) => (
                      <option key={c} value={c}>
                        {c}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Grid 2: Due Date & Estimated Hours */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-mono font-bold uppercase tracking-wider text-black mb-1.5">
                    預計完成期限 (DUE DATE)
                  </label>
                  <input
                    type="date"
                    value={dueDate}
                    onChange={(e) => setDueDate(e.target.value)}
                    className="w-full px-3 py-2 border-2 border-black bg-white text-black font-mono text-xs focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-mono font-bold uppercase tracking-wider text-black mb-1.5">
                    預估工時 (ESTIMATED HOURS)
                  </label>
                  <input
                    type="number"
                    min="1"
                    max="1000"
                    value={estimatedHours}
                    onChange={(e) => setEstimatedHours(parseInt(e.target.value) || 0)}
                    className="w-full px-3 py-2 border-2 border-black bg-white text-black font-mono text-xs focus:outline-none"
                  />
                </div>
              </div>

              {/* Section 3.4: Assignee & Collaborators */}
              <div className="p-4 bg-white border-2 border-black space-y-4">
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="text-xs font-mono font-bold uppercase tracking-wider text-black flex items-center gap-1.5">
                      <User className="w-3.5 h-3.5" strokeWidth={1.5} /> 主要負責人 (ASSIGNEE)
                    </label>
                    {!canAssign && (
                      <span className="text-[11px] font-mono text-[#525252]">
                        [ READ-ONLY: PM / ADMIN ONLY ]
                      </span>
                    )}
                  </div>
                  <select
                    disabled={!canAssign}
                    value={assigneeId || ''}
                    onChange={(e) => setAssigneeId(e.target.value || null)}
                    className="w-full px-3 py-2 border-2 border-black bg-white text-black font-mono text-xs uppercase focus:outline-none disabled:opacity-50"
                  >
                    <option value="">-- UNASSIGNED (未指派) --</option>
                    {users.map((u) => (
                      <option key={u.id} value={u.id}>
                        {u.full_name} ({u.department})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-mono font-bold uppercase tracking-wider text-black mb-2 flex items-center gap-1.5">
                    <Users className="w-3.5 h-3.5" strokeWidth={1.5} /> 協同作業者 (COLLABORATORS)
                  </label>
                  <div className="flex flex-wrap gap-2">
                    {users.map((u) => {
                      const isSelected = collaborators.includes(u.id);
                      return (
                        <button
                          key={u.id}
                          type="button"
                          onClick={() => toggleCollaborator(u.id)}
                          className={`flex items-center gap-1.5 px-2.5 py-1 text-xs font-mono uppercase border transition-colors ${
                            isSelected
                              ? 'bg-black text-white border-black font-bold'
                              : 'bg-white text-black border-black hover:bg-[#F5F5F5]'
                          }`}
                        >
                          <img
                            src={u.avatar_url}
                            alt=""
                            referrerPolicy="no-referrer"
                            className="w-4 h-4 object-cover border border-current"
                          />
                          {u.full_name.split(' ')[0]}
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>

              {/* Tags */}
              <div>
                <label className="block text-xs font-mono font-bold uppercase tracking-wider text-black mb-1.5">
                  標籤 (TAGS)
                </label>
                <div className="flex items-center gap-2 mb-2">
                  <input
                    type="text"
                    value={tagInput}
                    onChange={(e) => setTagInput(e.target.value)}
                    onKeyDown={handleAddTag}
                    placeholder="輸入標籤名稱後按 Enter 或點擊新增..."
                    className="flex-1 px-3 py-1.5 border-2 border-black bg-white text-black font-mono text-xs focus:outline-none"
                  />
                  <button
                    type="button"
                    onClick={handleAddTag}
                    className="btn-mono-outline py-1.5 text-xs"
                  >
                    + ADD TAG
                  </button>
                </div>
                <div className="flex items-center gap-1.5 flex-wrap">
                  {tags.map((tag) => (
                    <span
                      key={tag}
                      className="inline-flex items-center gap-1 px-2 py-0.5 text-xs font-mono uppercase bg-black text-white border border-black"
                    >
                      #{tag}
                      <button
                        type="button"
                        onClick={() => handleRemoveTag(tag)}
                        className="hover:text-[#A3A3A3] ml-1"
                      >
                        ×
                      </button>
                    </span>
                  ))}
                </div>
              </div>

              {/* Quick attachment dropzone inside details if new task */}
              {!isEditing && (
                <div className="pt-2">
                  <ClipboardUploadHelper
                    targetType="TASK"
                    targetId={taskId}
                    onUploadSuccess={() => {}}
                  />
                </div>
              )}
            </form>
          )}

          {activeTab === 'ATTACHMENTS' && isEditing && task && (
            <div className="space-y-5">
              <ClipboardUploadHelper
                targetType="TASK"
                targetId={task.id}
                onUploadSuccess={() => {}}
              />

              <div>
                <h5 className="text-xs font-mono font-bold uppercase tracking-wider text-black mb-3">
                  ATTACHMENTS LIST ({attachments.length})
                </h5>

                {attachments.length === 0 ? (
                  <div className="p-8 text-center text-xs font-mono uppercase text-[#525252] border-2 border-dashed border-black">
                    NO ATTACHMENTS. USE DROPZONE ABOVE OR PRESS CTRL+V TO PASTE.
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
                          className="flex items-center justify-between p-3 border-2 border-black bg-white"
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
                                className="w-10 h-10 object-cover border border-black shrink-0"
                              />
                            ) : (
                              <div className="w-10 h-10 bg-black text-white flex items-center justify-center shrink-0">
                                <Paperclip className="w-5 h-5" strokeWidth={1.5} />
                              </div>
                            )}

                            <div className="min-w-0">
                              <p className="text-xs font-body font-bold text-black truncate">
                                {att.file_name}
                              </p>
                              <div className="flex items-center gap-2 text-[11px] font-mono text-[#525252]">
                                <span>{(att.file_size / 1024 / 1024).toFixed(2)} MB</span>
                                {att.is_clipboard && (
                                  <span className="text-black font-bold uppercase">
                                    [CLIPBOARD]
                                  </span>
                                )}
                              </div>
                            </div>
                          </div>

                          <div className="flex items-center gap-1 shrink-0">
                            <button
                              type="button"
                              onClick={() => setPreviewAttachment(att)}
                              className="p-1 border border-black hover:bg-black hover:text-white transition-colors"
                              title="檢視 (Lightbox)"
                            >
                              <Eye className="w-3.5 h-3.5" strokeWidth={1.5} />
                            </button>
                            <button
                              type="button"
                              onClick={() => storageService.deleteAttachment(att.id)}
                              className="p-1 border border-black hover:bg-black hover:text-white transition-colors"
                              title="移除"
                            >
                              <Trash2 className="w-3.5 h-3.5" strokeWidth={1.5} />
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          )}

          {activeTab === 'COMMENTS' && isEditing && task && (
            <div className="flex flex-col h-full space-y-4">
              <div className="space-y-3 flex-1 overflow-y-auto max-h-[350px] pr-2">
                {comments.length === 0 ? (
                  <div className="p-8 text-center text-xs font-mono uppercase text-[#525252] border-2 border-dashed border-black">
                    NO COMMENTS YET. START DISCUSSION BELOW.
                  </div>
                ) : (
                  comments.map((c) => (
                    <div
                      key={c.id}
                      className="p-3.5 bg-white border-2 border-black text-xs"
                    >
                      <div className="flex items-center justify-between mb-1.5 border-b border-black pb-1">
                        <span className="font-mono font-bold uppercase text-black">
                          {c.author_name}
                        </span>
                        <span className="text-[11px] font-mono text-[#525252]">
                          {new Date(c.created_at).toLocaleString()}
                        </span>
                      </div>
                      <p className="text-black font-body whitespace-pre-wrap leading-relaxed">
                        {c.content}
                      </p>
                    </div>
                  ))
                )}
              </div>

              {/* Add comment box */}
              <form onSubmit={handleAddComment} className="flex gap-2 pt-3 border-t-2 border-black">
                <input
                  type="text"
                  value={commentInput}
                  onChange={(e) => setCommentInput(e.target.value)}
                  placeholder="輸入留言討論或施工狀況..."
                  className="flex-1 px-3 py-2 text-xs font-body border-2 border-black bg-white text-black placeholder:italic placeholder:text-[#525252] focus:outline-none"
                />
                <button
                  type="submit"
                  disabled={!commentInput.trim()}
                  className="btn-mono-primary"
                >
                  <Send className="w-3.5 h-3.5" strokeWidth={1.5} /> POST
                </button>
              </form>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        {activeTab === 'DETAILS' && (
          <div className="flex items-center justify-end gap-3 px-6 py-4 border-t-2 border-black bg-white">
            <button
              type="button"
              onClick={onClose}
              className="btn-mono-outline"
            >
              取消
            </button>
            <button
              type="button"
              id="btn-save-task"
              onClick={handleSubmit}
              className="btn-mono-primary"
            >
              {isEditing ? '儲存變更 →' : '建立卡片 →'}
            </button>
          </div>
        )}
      </div>

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
