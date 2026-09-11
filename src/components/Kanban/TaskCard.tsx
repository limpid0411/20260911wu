import React from 'react';
import { Clock, Paperclip, MessageSquare, AlertTriangle, User as UserIcon } from 'lucide-react';
import { Task, User, Priority } from '../../types/pms';
import { storageService } from '../../services/storageService';

interface TaskCardProps {
  task: Task;
  users: User[];
  onClick: () => void;
  onDragStart: (e: React.DragEvent, task: Task) => void;
}

export const TaskCard: React.FC<TaskCardProps> = ({ task, users, onClick, onDragStart }) => {
  const isOverdue = storageService.isTaskOverdue(task);
  const assignee = users.find((u) => u.id === task.assignee_id);
  const attachments = storageService.getAttachments('TASK', task.id);
  const comments = storageService.getComments(task.id);

  const formatDate = (isoString: string | null) => {
    if (!isoString) return null;
    const d = new Date(isoString);
    return `${d.getMonth() + 1}/${d.getDate()}`;
  };

  const renderPriorityBadge = (p: Priority) => {
    switch (p) {
      case 'URGENT':
        return (
          <span className="bg-black text-white group-hover:bg-white group-hover:text-black border border-black group-hover:border-white font-mono text-[9px] uppercase tracking-widest px-1.5 py-0.5 font-bold">
            URGENT
          </span>
        );
      case 'HIGH':
        return (
          <span className="border-2 border-black text-black group-hover:border-white group-hover:text-white font-mono text-[9px] uppercase tracking-wider px-1.5 py-0.5 font-bold">
            HIGH
          </span>
        );
      case 'MEDIUM':
      case 'NORMAL':
        return (
          <span className="border border-black text-black group-hover:border-white group-hover:text-white font-mono text-[9px] uppercase tracking-wider px-1.5 py-0.5">
            MED
          </span>
        );
      case 'LOW':
      default:
        return (
          <span className="border border-[#525252] text-[#525252] group-hover:border-[#E5E5E5] group-hover:text-[#E5E5E5] font-mono text-[9px] uppercase tracking-wider px-1.5 py-0.5">
            LOW
          </span>
        );
    }
  };

  return (
    <div
      id={`task-card-${task.id}`}
      draggable
      onDragStart={(e) => onDragStart(e, task)}
      onClick={onClick}
      className={`group relative bg-white text-black p-4 border transition-colors duration-100 cursor-grab active:cursor-grabbing hover:bg-black hover:text-white ${
        isOverdue
          ? 'border-2 border-black border-dashed ring-1 ring-black'
          : 'border-2 border-black'
      }`}
    >
      {/* Top row: Priority & ID */}
      <div className="flex items-center justify-between gap-2 mb-2.5">
        <div className="flex items-center gap-1.5 flex-wrap">
          {renderPriorityBadge(task.priority)}
          <span className="text-[10px] font-mono uppercase tracking-wider text-[#525252] group-hover:text-[#E5E5E5]">
            [ {task.module_category} ]
          </span>
        </div>

        <span className="text-[10px] font-mono text-[#525252] group-hover:text-white transition-colors">
          #{task.id.slice(-4).toUpperCase()}
        </span>
      </div>

      {/* Title */}
      <h4 className="text-sm font-display font-bold uppercase tracking-tight text-black group-hover:text-white line-clamp-2 mb-2 transition-colors">
        {task.title}
      </h4>

      {/* Tags */}
      {task.tags && task.tags.length > 0 && (
        <div className="flex items-center gap-1.5 flex-wrap mb-3">
          {task.tags.map((tag) => (
            <span
              key={tag}
              className="text-[9px] font-mono uppercase tracking-wider px-1.5 py-0.5 border border-black group-hover:border-white text-black group-hover:text-white"
            >
              #{tag}
            </span>
          ))}
        </div>
      )}

      {/* Footer metadata & Assignee */}
      <div className="flex items-center justify-between pt-2.5 border-t border-black group-hover:border-white text-xs font-mono transition-colors">
        <div className="flex items-center gap-3">
          {task.due_date && (
            <span
              className={`flex items-center gap-1 text-[11px] font-mono ${
                isOverdue
                  ? 'font-bold underline'
                  : 'text-[#525252] group-hover:text-[#E5E5E5]'
              }`}
              title={isOverdue ? '任務已逾期' : '預定截止日期'}
            >
              <Clock className="w-3 h-3" strokeWidth={1.5} />
              {formatDate(task.due_date)}
              {isOverdue && <span className="text-[9px] font-bold">[OVERDUE]</span>}
            </span>
          )}

          {task.estimated_hours && (
            <span className="text-[10px] font-mono text-[#525252] group-hover:text-[#E5E5E5]">
              {task.estimated_hours}H
            </span>
          )}

          {attachments.length > 0 && (
            <span className="flex items-center gap-0.5 text-[#525252] group-hover:text-white text-[10px]">
              <Paperclip className="w-3 h-3" strokeWidth={1.5} />
              <span>{attachments.length}</span>
            </span>
          )}

          {comments.length > 0 && (
            <span className="flex items-center gap-0.5 text-[#525252] group-hover:text-white text-[10px]">
              <MessageSquare className="w-3 h-3" strokeWidth={1.5} />
              <span>{comments.length}</span>
            </span>
          )}
        </div>

        {/* Assignee Avatar */}
        <div>
          {assignee ? (
            <div className="flex items-center" title={`負責人: ${assignee.full_name}`}>
              <img
                src={assignee.avatar_url}
                alt={assignee.full_name}
                referrerPolicy="no-referrer"
                className="w-5 h-5 object-cover border border-black group-hover:border-white grayscale group-hover:grayscale-0 transition-all"
              />
            </div>
          ) : (
            <span
              className="w-5 h-5 border border-black group-hover:border-white text-black group-hover:text-white flex items-center justify-center text-[9px]"
              title="尚未指派負責人"
            >
              <UserIcon className="w-3 h-3" strokeWidth={1.5} />
            </span>
          )}
        </div>
      </div>
    </div>
  );
};
