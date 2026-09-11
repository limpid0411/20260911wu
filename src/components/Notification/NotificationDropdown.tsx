import React, { useState, useEffect } from 'react';
import { Bell, AlertTriangle, CheckCircle2, Clock, MessageSquare, Paperclip, X, Trash2 } from 'lucide-react';
import { Notification } from '../../types/pms';
import { storageService } from '../../services/storageService';

interface NotificationDropdownProps {
  userId: string;
}

export const NotificationDropdown: React.FC<NotificationDropdownProps> = ({ userId }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [notifications, setNotifications] = useState<Notification[]>([]);

  const loadNotifications = () => {
    setNotifications(storageService.getNotifications(userId));
  };

  useEffect(() => {
    loadNotifications();
    const unsubscribe = storageService.subscribe(() => {
      loadNotifications();
    });
    return unsubscribe;
  }, [userId]);

  const unreadCount = notifications.filter((n) => !n.is_read).length;

  const handleMarkAllRead = () => {
    storageService.markAllNotificationsRead(userId);
    loadNotifications();
  };

  const getIcon = (type: Notification['type']) => {
    switch (type) {
      case 'WIP_LIMIT_ALERT':
        return <AlertTriangle className="w-4 h-4 text-black" strokeWidth={1.5} />;
      case 'RFI_OVERDUE':
        return <Clock className="w-4 h-4 text-black" strokeWidth={1.5} />;
      case 'RFI_STATUS_CHANGED':
        return <CheckCircle2 className="w-4 h-4 text-black" strokeWidth={1.5} />;
      case 'TASK_ASSIGNED':
        return <CheckCircle2 className="w-4 h-4 text-black" strokeWidth={1.5} />;
      case 'COMMENT_ADDED':
        return <MessageSquare className="w-4 h-4 text-black" strokeWidth={1.5} />;
      default:
        return <Bell className="w-4 h-4 text-black" strokeWidth={1.5} />;
    }
  };

  return (
    <div className="relative font-mono">
      <button
        type="button"
        id="btn-notification-bell"
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2 border border-black bg-white text-black hover:bg-black hover:text-white transition-colors"
        title="NOTIFICATIONS (即時通知)"
      >
        <Bell className="w-4 h-4" strokeWidth={1.5} />
        {unreadCount > 0 && (
          <span className="absolute -top-1.5 -right-1.5 flex h-4 w-4 items-center justify-center bg-black text-[9px] font-bold text-white border border-white">
            {unreadCount}
          </span>
        )}
      </button>

      {isOpen && (
        <div
          className="fixed inset-0 z-40 sm:absolute sm:inset-auto sm:right-0 sm:top-10 sm:w-84 md:w-96"
          onClick={() => setIsOpen(false)}
        >
          <div
            className="w-full h-full sm:h-auto max-h-[80vh] flex flex-col bg-white border-2 border-black shadow-none overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex items-center justify-between px-4 py-3 border-b-2 border-black bg-[#F5F5F5]">
              <div className="flex items-center gap-2">
                <Bell className="w-4 h-4 text-black" strokeWidth={1.5} />
                <h4 className="text-xs font-mono font-bold text-black uppercase">
                  NOTIFICATIONS (系統通知)
                </h4>
                {unreadCount > 0 && (
                  <span className="px-1.5 py-0.2 bg-black text-white text-[10px] font-bold">
                    {unreadCount} NEW
                  </span>
                )}
              </div>

              <div className="flex items-center gap-3">
                {unreadCount > 0 && (
                  <button
                    type="button"
                    onClick={handleMarkAllRead}
                    className="text-[11px] font-mono text-black hover:underline uppercase font-bold"
                  >
                    MARK ALL READ
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => setIsOpen(false)}
                  className="p-1 text-black hover:bg-black hover:text-white transition-colors"
                >
                  <X className="w-4 h-4" strokeWidth={1.5} />
                </button>
              </div>
            </div>

            {/* List */}
            <div className="flex-1 overflow-y-auto divide-y divide-black/20 text-xs">
              {notifications.length === 0 ? (
                <div className="p-8 text-center text-[#525252] font-mono">
                  NO NOTIFICATIONS (目前尚無任何通知)
                </div>
              ) : (
                notifications.map((n) => (
                  <div
                    key={n.id}
                    onClick={() => {
                      storageService.markNotificationRead(n.id);
                      loadNotifications();
                    }}
                    className={`p-3.5 flex items-start gap-3 cursor-pointer hover:bg-[#F5F5F5] transition-colors ${
                      !n.is_read ? 'bg-[#F5F5F5] font-semibold' : ''
                    }`}
                  >
                    <div className="mt-0.5 shrink-0">{getIcon(n.type)}</div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-1 mb-0.5">
                        <span className="font-bold text-black truncate uppercase">
                          {n.title}
                        </span>
                        <span className="text-[10px] text-[#525252] font-mono shrink-0">
                          {new Date(n.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>
                      <p className="text-black line-clamp-2 leading-relaxed text-[11px] font-body">
                        {n.message}
                      </p>
                    </div>
                    {!n.is_read && (
                      <span className="w-2 h-2 bg-black shrink-0 self-center" />
                    )}
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
