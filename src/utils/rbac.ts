import { UserRole } from '../types/pms';

export interface RolePermission {
  canManageProject: boolean;
  canEditBoardColumns: boolean; // Add/edit columns & WIP limits
  canCreateTask: boolean;
  canMoveAnyTask: boolean;
  canAssignTask: boolean;
  canCreateRFI: boolean;
  canOfficialReplyRFI: boolean; // Only Reviewer, PM, Super Admin
  canCloseRFI: boolean; // Only PM & Super Admin
  canManageUsers: boolean;
  roleTitle: string;
  roleBadgeColor: string;
  description: string;
}

export const ROLE_PERMISSIONS: Record<UserRole, RolePermission> = {
  SUPER_ADMIN: {
    canManageProject: true,
    canEditBoardColumns: true,
    canCreateTask: true,
    canMoveAnyTask: true,
    canAssignTask: true,
    canCreateRFI: true,
    canOfficialReplyRFI: true,
    canCloseRFI: true,
    canManageUsers: true,
    roleTitle: '系統管理員 (Super Admin)',
    roleBadgeColor: 'bg-purple-100 text-purple-800 border-purple-300 dark:bg-purple-900/40 dark:text-purple-300',
    description: '具備全系統最高權限，可管理所有專案、看板架構、使用者帳號與審計稽核日誌。'
  },
  PROJECT_MANAGER: {
    canManageProject: true,
    canEditBoardColumns: true,
    canCreateTask: true,
    canMoveAnyTask: true,
    canAssignTask: true,
    canCreateRFI: true,
    canOfficialReplyRFI: true,
    canCloseRFI: true, // 強制結案 RFI
    canManageUsers: false,
    roleTitle: '專案經理 (Project Manager)',
    roleBadgeColor: 'bg-blue-100 text-blue-800 border-blue-300 dark:bg-blue-900/40 dark:text-blue-300',
    description: '負責專案進度控管、調整看板結構與 WIP 限制、指派卡片責任人、審查並強制結案 RFI。'
  },
  MEMBER: {
    canManageProject: false,
    canEditBoardColumns: false,
    canCreateTask: true,
    canMoveAnyTask: true, // or own tasks
    canAssignTask: false,
    canCreateRFI: true, // 提出 RFI
    canOfficialReplyRFI: false,
    canCloseRFI: false,
    canManageUsers: false,
    roleTitle: '一般成員 (Member / Engineer)',
    roleBadgeColor: 'bg-emerald-100 text-emerald-800 border-emerald-300 dark:bg-emerald-900/40 dark:text-emerald-300',
    description: '工程技術與現場團隊，可建立任務卡片、拖曳卡片更新進度、提出工程 RFI 疑難諮詢。'
  },
  REVIEWER_CLIENT: {
    canManageProject: false,
    canEditBoardColumns: false,
    canCreateTask: false,
    canMoveAnyTask: false,
    canAssignTask: false,
    canCreateRFI: false,
    canOfficialReplyRFI: true, // 專責填寫官方審核回覆
    canCloseRFI: false,
    canManageUsers: false,
    roleTitle: '外部審查員 / 業主 (Reviewer / Client)',
    roleBadgeColor: 'bg-amber-100 text-amber-800 border-amber-300 dark:bg-amber-900/40 dark:text-amber-300',
    description: '外部業主代表或建築總顧問，具備指定看板檢閱權限，專責簽核並填寫 RFI 官方回覆。'
  }
};

export function checkPermission(role: UserRole, permission: keyof RolePermission): boolean {
  const perms = ROLE_PERMISSIONS[role];
  return perms ? Boolean(perms[permission]) : false;
}

export const ROLE_DESCRIPTIONS: Record<UserRole, string> = {
  SUPER_ADMIN: '具備全系統最高權限，可管理所有專案、看板架構、使用者帳號與審計稽核日誌。',
  PROJECT_MANAGER: '負責專案進度控管、調整看板結構與 WIP 限制、指派卡片責任人、審查並強制結案 RFI。',
  MEMBER: '工程技術與現場團隊，可建立任務卡片、拖曳卡片更新進度、提出工程 RFI 疑難諮詢。',
  REVIEWER_CLIENT: '外部業主代表或建築總顧問，具備指定看板檢閱權限，專責簽核並填寫 RFI 官方回覆。'
};

