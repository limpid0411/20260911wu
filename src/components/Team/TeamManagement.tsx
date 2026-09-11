import React, { useState } from 'react';
import {
  Users,
  Shield,
  ShieldCheck,
  Check,
  X,
  UserCheck,
  Building,
  Key,
  Plus
} from 'lucide-react';
import { User, UserRole } from '../../types/pms';
import { ROLE_PERMISSIONS, ROLE_DESCRIPTIONS } from '../../utils/rbac';

interface TeamManagementProps {
  users: User[];
  currentUser: User;
  onSwitchUser: (userId: string) => void;
}

const ROLES: { key: UserRole; title: string; badge: string }[] = [
  { key: 'SUPER_ADMIN', title: 'SUPER ADMIN (系統管理員)', badge: 'bg-black text-white border border-black' },
  { key: 'PROJECT_MANAGER', title: 'PROJECT MANAGER (專案經理)', badge: 'bg-[#525252] text-white border border-black' },
  { key: 'MEMBER', title: 'CONTRACTOR (承包商/成員)', badge: 'bg-white text-black border border-black' },
  { key: 'REVIEWER_CLIENT', title: 'CLIENT / REVIEWER (業主/審查員)', badge: 'bg-[#E5E5E5] text-black border border-black' }
];

const PERMISSION_ROWS = [
  { key: 'canCreateBoard', label: '建立專案看板 (Create Board)' },
  { key: 'canEditBoardColumns', label: '維護欄位與設定 WIP 限制 (Manage WIP Limits)' },
  { key: 'canCreateTask', label: '建立看板卡片 (Create Tasks)' },
  { key: 'canMoveTask', label: '拖拉排程/跨欄位移動卡片 (Move Tasks)' },
  { key: 'canDeleteTask', label: '刪除卡片 (Delete Tasks)' },
  { key: 'canCreateRFI', label: '提出工程 RFI 資訊請求 (Submit RFI)' },
  { key: 'canOfficialReplyRFI', label: '填寫並簽署 RFI 官方回覆 (Sign Official Reply)' },
  { key: 'canCloseRFI', label: '核定與強制結案 RFI (Close RFI)' },
  { key: 'canUploadAttachment', label: '剪貼簿貼圖與上傳檔案 (Upload Attachments)' }
];

export const TeamManagement: React.FC<TeamManagementProps> = ({
  users,
  currentUser,
  onSwitchUser
}) => {
  return (
    <div id="team-management-root" className="space-y-6">
      {/* Current User Simulator Switcher Box */}
      <div className="bg-white p-5 border-2 border-black">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <ShieldCheck className="w-5 h-5 text-black" strokeWidth={1.5} />
              <h3 className="text-sm font-mono font-bold uppercase text-black">
                RBAC ROLE SIMULATOR / 權限角色模擬切換器
              </h3>
            </div>
            <p className="text-xs font-mono text-[#525252] mt-1">
              點選下方角色即時模擬身分切換，驗證看板操作、WIP 上限設定、官方回覆與結案之權限限制
            </p>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            {users.map((u) => {
              const isCurrent = u.id === currentUser.id;
              return (
                <button
                  key={u.id}
                  onClick={() => onSwitchUser(u.id)}
                  className={`flex items-center gap-2 px-3 py-1.5 text-xs font-mono font-bold border-2 border-black transition-all ${
                    isCurrent
                      ? 'bg-black text-white'
                      : 'bg-white text-black hover:bg-[#F5F5F5]'
                  }`}
                >
                  <img
                    src={u.avatar_url}
                    alt=""
                    referrerPolicy="no-referrer"
                    className="w-5 h-5 object-cover border border-black"
                  />
                  <span>{u.full_name}</span>
                  <span className="text-[10px] uppercase">
                    [{u.role === 'SUPER_ADMIN' ? 'ADMIN' : u.role === 'PROJECT_MANAGER' ? 'PM' : u.role === 'REVIEWER_CLIENT' ? 'CLIENT' : 'ENG'}]
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Team Roster */}
      <div className="bg-white border-2 border-black overflow-hidden">
        <div className="p-4 border-b-2 border-black bg-[#F5F5F5] flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Users className="w-5 h-5 text-black" strokeWidth={1.5} />
            <h3 className="text-sm font-mono font-bold uppercase text-black">
              TEAM ROSTER / 專案成員名冊與指派群組
            </h3>
          </div>
          <span className="text-xs font-mono text-[#525252]">TOTAL: {users.length} MEMBERS</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs font-mono">
            <thead>
              <tr className="border-b-2 border-black bg-white text-[11px] font-bold text-black uppercase tracking-wider">
                <th className="py-3 px-5 border-r border-black/20">MEMBER (姓名)</th>
                <th className="py-3 px-5 border-r border-black/20">EMAIL (信箱)</th>
                <th className="py-3 px-5 border-r border-black/20">UNIT (部門/單位)</th>
                <th className="py-3 px-5 border-r border-black/20">ROLE (角色)</th>
                <th className="py-3 px-5">RESPONSIBILITIES (權限職掌)</th>
              </tr>
            </thead>
            <tbody className="divide-y border-t border-black">
              {users.map((u) => {
                const roleInfo = ROLES.find((r) => r.key === u.role);
                const isCurrent = u.id === currentUser.id;

                return (
                  <tr
                    key={u.id}
                    className={`hover:bg-[#F5F5F5] transition-colors ${
                      isCurrent ? 'bg-[#F5F5F5] font-bold' : ''
                    }`}
                  >
                    <td className="py-3.5 px-5 text-black flex items-center gap-3 border-r border-black/20">
                      <img
                        src={u.avatar_url}
                        alt=""
                        referrerPolicy="no-referrer"
                        className="w-8 h-8 object-cover border border-black"
                      />
                      <div>
                        <div className="flex items-center gap-1.5">
                          <span>{u.full_name}</span>
                          {isCurrent && (
                            <span className="px-1.5 py-0.2 text-[10px] bg-black text-white uppercase">
                              CURRENT
                            </span>
                          )}
                        </div>
                      </div>
                    </td>

                    <td className="py-3.5 px-5 text-black border-r border-black/20">
                      {u.email}
                    </td>

                    <td className="py-3.5 px-5 text-black border-r border-black/20">
                      <div className="flex items-center gap-1.5">
                        <Building className="w-3.5 h-3.5 text-black" strokeWidth={1.5} />
                        <span>{u.department}</span>
                      </div>
                    </td>

                    <td className="py-3.5 px-5 whitespace-nowrap border-r border-black/20">
                      <span className={`px-2.5 py-1 text-[11px] font-bold ${roleInfo?.badge}`}>
                        {roleInfo?.title.split(' ')[0]}
                      </span>
                    </td>

                    <td className="py-3.5 px-5 text-[#525252] font-body text-xs">
                      {ROLE_DESCRIPTIONS[u.role]}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* RBAC Permission Matrix (SRS 3.4) */}
      <div className="bg-white border-2 border-black p-6 space-y-4">
        <div className="flex items-center gap-2 border-b-2 border-black pb-3">
          <Key className="w-5 h-5 text-black" strokeWidth={1.5} />
          <h3 className="text-sm font-mono font-bold uppercase text-black">
            RBAC PERMISSION MATRIX / 角色與權限矩陣對照表
          </h3>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-center border-collapse text-xs font-mono">
            <thead>
              <tr className="border-b-2 border-black bg-[#F5F5F5]">
                <th className="py-3 px-4 text-left font-bold text-black border-r border-black/20 uppercase">
                  FEATURE PERMISSION (功能權限項目)
                </th>
                {ROLES.map((r) => (
                  <th key={r.key} className="py-3 px-4 font-bold text-black whitespace-nowrap border-r border-black/20 last:border-r-0 uppercase">
                    {r.title.split(' ')[0]}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-black/20 border-t border-black">
              {PERMISSION_ROWS.map((perm) => (
                <tr key={perm.key} className="hover:bg-[#F5F5F5]">
                  <td className="py-3 px-4 text-left font-medium text-black border-r border-black/20">
                    {perm.label}
                  </td>
                  {ROLES.map((r) => {
                    const hasAccess = (ROLE_PERMISSIONS[r.key] as any)[perm.key];
                    return (
                      <td key={r.key} className="py-3 px-4 border-r border-black/20 last:border-r-0">
                        {hasAccess ? (
                          <div className="inline-flex items-center justify-center w-6 h-6 bg-black text-white border border-black">
                            <Check className="w-3.5 h-3.5" strokeWidth={2} />
                          </div>
                        ) : (
                          <div className="inline-flex items-center justify-center w-6 h-6 bg-white text-black border border-black/30">
                            <X className="w-3.5 h-3.5 opacity-30" strokeWidth={1.5} />
                          </div>
                        )}
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
