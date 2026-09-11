import { User, Project, Board, BoardColumn, Task, RFI, RFIAuditLog, Attachment, TaskComment } from '../types/pms';

export const INITIAL_USERS: User[] = [
  {
    id: 'usr-admin',
    email: 'admin@apex-engineering.com',
    full_name: '鄭志豪 (Super Admin)',
    role: 'SUPER_ADMIN',
    avatar_url: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
    department: '系統與架構管理處'
  },
  {
    id: 'usr-pm',
    email: 'lin.pm@apex-engineering.com',
    full_name: '林思瑜 (Project Manager)',
    role: 'PROJECT_MANAGER',
    avatar_url: 'https://images.unsplash.com/photo-1580489944761-15a19d654956?w=150&auto=format&fit=crop&q=80',
    department: '工程管理專案部'
  },
  {
    id: 'usr-member',
    email: 'chen.site@apex-engineering.com',
    full_name: '陳柏叡 (Site Engineer)',
    role: 'MEMBER',
    avatar_url: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80',
    department: '機電施工與現場組'
  },
  {
    id: 'usr-reviewer',
    email: 'kuo.owner@railtransit.gov.tw',
    full_name: '郭文正 (Client Reviewer)',
    role: 'REVIEWER_CLIENT',
    avatar_url: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&auto=format&fit=crop&q=80',
    department: '業主審查工程處 / 總顧問'
  }
];

export const INITIAL_PROJECTS: Project[] = [
  {
    id: 'prj-pj01',
    code: 'PJ01',
    name: '高鐵新設車站機電與鋼構擴建工程',
    description: '包含主體結構鋼樑架設、地下二層機電管線穿廊及智慧閘門系統整合。',
    created_by: 'usr-pm',
    created_at: '2026-01-15T08:00:00Z'
  },
  {
    id: 'prj-pj02',
    code: 'PJ02',
    name: '智慧科學園區第III期資料中心建置',
    description: 'Tier-IV 等級不斷電系統、冰水主機循環與高密散熱管道工程。',
    created_by: 'usr-pm',
    created_at: '2026-03-01T08:00:00Z'
  },
  {
    id: 'prj-pj03',
    code: 'PJ03',
    name: '跨站智慧旅客資訊中台 (PIS & Cloud)',
    description: '列車調度 API、即時推播看板與行動應用程式雲端微服務系統。',
    created_by: 'usr-admin',
    created_at: '2026-05-10T08:00:00Z'
  }
];

export const INITIAL_BOARDS: Board[] = [
  {
    id: 'brd-01',
    project_id: 'prj-pj01',
    title: '施工現場與驗收敏捷看板',
    position: 0,
    description: '現場各工區鋼構、機電、配管及安全巡檢流動卡片。'
  },
  {
    id: 'brd-02',
    project_id: 'prj-pj01',
    title: 'BIM 模型與深化設計檢討看板',
    position: 1,
    description: '管線碰撞、結構圖面修訂與發包釋疑進度管理。'
  },
  {
    id: 'brd-03',
    project_id: 'prj-pj01',
    title: '機電保固與維運試車排程',
    position: 2,
    description: '高壓變電所通電試驗、空調通風系統與消防連動。'
  },
  {
    id: 'brd-04',
    project_id: 'prj-pj02',
    title: '園區數據機房土建工進',
    position: 0,
    description: '基礎高架地板與冷熱通道隔間作業。'
  }
];

export const INITIAL_COLUMNS: BoardColumn[] = [
  {
    id: 'col-01',
    board_id: 'brd-01',
    name: '待處理 (Backlog)',
    wip_limit: 0,
    position: 0
  },
  {
    id: 'col-02',
    board_id: 'brd-01',
    name: '進行中 (In Progress)',
    wip_limit: 3, // WIP limit set to 3 to demonstrate alert when full/exceeded
    position: 1
  },
  {
    id: 'col-03',
    board_id: 'brd-01',
    name: '檢驗與審核中 (Review)',
    wip_limit: 2, // WIP limit set to 2
    position: 2
  },
  {
    id: 'col-04',
    board_id: 'brd-01',
    name: '已完成 (Done)',
    wip_limit: 0,
    position: 3
  },
  // Board 02 columns
  {
    id: 'col-05',
    board_id: 'brd-02',
    name: '待深化',
    wip_limit: 0,
    position: 0
  },
  {
    id: 'col-06',
    board_id: 'brd-02',
    name: '建模修訂中',
    wip_limit: 4,
    position: 1
  },
  {
    id: 'col-07',
    board_id: 'brd-02',
    name: '業主核備中',
    wip_limit: 3,
    position: 2
  },
  {
    id: 'col-08',
    board_id: 'brd-02',
    name: '已發布施工圖',
    wip_limit: 0,
    position: 3
  }
];

export const INITIAL_TASKS: Task[] = [
  {
    id: 'tsk-01',
    column_id: 'col-02',
    title: 'B2 標段主管道貫穿防火套管密封檢驗',
    description: '依據消防法規第32條，針對地下二層冷卻管穿樑孔隙進行耐火發泡填縫施工驗收。',
    priority: 'URGENT',
    assignee_id: 'usr-member',
    collaborators: ['usr-pm'],
    position: 0,
    due_date: '2026-09-15T18:00:00Z',
    estimated_hours: 16,
    tags: ['消防安檢', '現場驗收', '防火填塞'],
    module_category: '機電工程',
    created_at: '2026-09-01T10:00:00Z'
  },
  {
    id: 'tsk-02',
    column_id: 'col-02',
    title: '南側大廳鋼柱焊接超音波探傷檢測 (UT)',
    description: '完成南端 12 支巨型箱型鋼柱對接焊道 100% 超音波無損檢測，並產出第三公正方檢驗報告。',
    priority: 'HIGH',
    assignee_id: 'usr-member',
    collaborators: ['usr-pm', 'usr-reviewer'],
    position: 1,
    due_date: '2026-09-18T18:00:00Z',
    estimated_hours: 24,
    tags: ['鋼構工程', '無損探傷', '品質查核'],
    module_category: '結構工程',
    created_at: '2026-09-02T11:30:00Z'
  },
  {
    id: 'tsk-03',
    column_id: 'col-02',
    title: '高壓受電盤電纜耐壓試驗與標籤查驗',
    description: '針對 22.8kV 特高壓迴路電纜絕緣阻抗進行加壓測試，記錄相間與對地漏洩電流。',
    priority: 'MEDIUM',
    assignee_id: 'usr-member',
    collaborators: ['usr-pm'],
    position: 2,
    due_date: '2026-09-20T17:00:00Z',
    estimated_hours: 12,
    tags: ['特高壓', '電氣測試'],
    module_category: '機電工程',
    created_at: '2026-09-03T09:00:00Z'
  },
  {
    id: 'tsk-04',
    column_id: 'col-01',
    title: '西側通廊抗震剪力支撐骨架放樣',
    description: '配合第2版建築平面圖修訂，現場利用全測站雷射儀進行軸線放樣並釘設基準墨線。',
    priority: 'MEDIUM',
    assignee_id: 'usr-member',
    collaborators: [],
    position: 0,
    due_date: '2026-09-25T18:00:00Z',
    estimated_hours: 8,
    tags: ['放樣測量', '抗震支架'],
    module_category: '裝修工程',
    created_at: '2026-09-04T14:00:00Z'
  },
  {
    id: 'tsk-05',
    column_id: 'col-01',
    title: '冰水主機進出水軟管避震接頭材料進場報驗',
    description: '進場 6 組 ANSI 300 級高壓雙球型不銹鋼防震軟管，核對原廠出廠檢驗證明 (MTR)。',
    priority: 'LOW',
    assignee_id: 'usr-pm',
    collaborators: ['usr-reviewer'],
    position: 1,
    due_date: '2026-09-28T18:00:00Z',
    estimated_hours: 6,
    tags: ['進場檢驗', '材料審查'],
    module_category: '機電工程',
    created_at: '2026-09-05T10:00:00Z'
  },
  {
    id: 'tsk-06',
    column_id: 'col-03',
    title: '智慧閘門刷卡通道光學感應遮斷測試',
    description: '實測 16 處出入閘門紅外線安全偵測，提交防夾人安全連動邏輯測試紀錄表予業主。',
    priority: 'HIGH',
    assignee_id: 'usr-member',
    collaborators: ['usr-reviewer'],
    position: 0,
    due_date: '2026-09-14T12:00:00Z',
    estimated_hours: 10,
    tags: ['系統整合', '出入控制'],
    module_category: '弱電工程',
    created_at: '2026-08-30T16:00:00Z'
  },
  {
    id: 'tsk-07',
    column_id: 'col-04',
    title: '基坑降水井封填及防水混凝土補灌',
    description: '完成 4 口深層降水井膨脹止水條環繞與高強度抗滲無收縮水泥砂漿壓力灌注。',
    priority: 'MEDIUM',
    assignee_id: 'usr-member',
    collaborators: ['usr-pm'],
    position: 0,
    due_date: '2026-09-02T18:00:00Z',
    estimated_hours: 18,
    tags: ['防水工程', '已驗收'],
    module_category: '結構工程',
    created_at: '2026-08-25T08:00:00Z'
  }
];

export const INITIAL_RFIS: RFI[] = [
  {
    id: 'rfi-0042',
    project_id: 'prj-pj01',
    rfi_number: 'RFI-PJ01-2026-0042',
    subject: '地下二層穿牆套管與機電冷媒管高程衝突諮詢',
    question: '於現場放樣地下二層空調水管穿樑套管時，發現結構圖 S-204 與機電圖 M-301 所註記之樑貫穿孔中心高程偏差達 180mm，若依原結構預留套管施作，冷媒保溫管將切削大樑主筋保護層。請業主及建築設計總監確認修正方案。',
    suggested_solution: '建議將穿樑孔位向下平移 120mm，並於孔洞兩側增設 #5 U型補強筋4支；或改由隔間牆側邊走明管包覆防火岩棉。',
    official_reply: null,
    status: 'UNDER_REVIEW',
    priority: 'HIGH',
    reference_spec_no: 'DWG-MEP-B2-04 / DWG-STR-S204',
    cost_impact: true,
    schedule_impact: true,
    schedule_days_impact: 5,
    author_id: 'usr-member',
    assigned_reviewer_id: 'usr-reviewer',
    due_date: '2026-09-14T23:59:59Z',
    answered_at: null,
    answered_by: null,
    closed_at: null,
    closed_by: null,
    created_at: '2026-09-08T09:30:00Z'
  },
  {
    id: 'rfi-0043',
    project_id: 'prj-pj01',
    rfi_number: 'RFI-PJ01-2026-0043',
    subject: '主結構柱鋼骨抗拉螺栓規格變更與供貨交期釋疑',
    question: '原設計指定之 ASTM A490 Type 3 耐候高張力螺栓（M30），因國際航運延誤交期需展延8週。協力廠商提議採用同等品 JIS B1186 F10T 進行替換，請確認是否符合原結構耐震設計標準規範。',
    suggested_solution: '已檢附材料抗拉剪力檢驗強度對照表及原廠出廠質檢認證，兩者降伏強度均達 900 N/mm² 以上，可即時供應現場吊裝。',
    official_reply: null,
    status: 'SUBMITTED',
    priority: 'NORMAL',
    reference_spec_no: 'SPEC-STR-2026-SEC05',
    cost_impact: false,
    schedule_impact: false,
    schedule_days_impact: 0,
    author_id: 'usr-member',
    assigned_reviewer_id: 'usr-reviewer',
    due_date: '2026-09-18T18:00:00Z',
    answered_at: null,
    answered_by: null,
    closed_at: null,
    closed_by: null,
    created_at: '2026-09-09T14:15:00Z'
  },
  {
    id: 'rfi-0038',
    project_id: 'prj-pj01',
    rfi_number: 'RFI-PJ01-2026-0038',
    subject: '屋頂防洪防汛閘門耐震等級與連動控制線路確認',
    question: '車站頂層機房防水抗洪防汛閘門設計未明確標註耐震需求等級是否需具備 Class 1E 抗震驗證，且與火警連動優先權設定尚未統一。',
    suggested_solution: '建議防汛閘門動力迴路改納入緊急發電機自動切換受電盤 (ATS)，火災偵測啟動時以人員疏散為第一優先解鎖。',
    official_reply: '【業主回覆核定】：同意承包商所提方案。防汛閘門採用 IEEE 344 抗震 Class II 級認證即可；連動控制櫃邏輯依消防防護法規，火警信號輸入時強制降下延遲3分鐘以供現場人員撤離。已同步簽核變更設計單 No.CN-0911。',
    status: 'ANSWERED',
    priority: 'HIGH',
    reference_spec_no: 'DWG-ARCH-R02 / SPEC-ELEC-701',
    cost_impact: true,
    schedule_impact: false,
    schedule_days_impact: 0,
    author_id: 'usr-pm',
    assigned_reviewer_id: 'usr-reviewer',
    due_date: '2026-09-07T18:00:00Z',
    answered_at: '2026-09-07T16:20:00Z',
    answered_by: 'usr-reviewer',
    closed_at: null,
    closed_by: null,
    created_at: '2026-09-02T11:00:00Z'
  },
  {
    id: 'rfi-0035',
    project_id: 'prj-pj01',
    rfi_number: 'RFI-PJ01-2026-0035',
    subject: '特高壓變電室外牆防火時效塗料耐候認證審查',
    question: '變電所混凝土外牆需施作2小時耐火時效膨脹型防火漆，請確認進口防火塗料原廠認證是否可免附 CNS 11728 額外現地抽驗。',
    suggested_solution: '檢附英國 BS 476 Part 20 測試報告與內政部營建署審核認可通知書作為免抽驗佐證。',
    official_reply: '【審查結案核可】：經結構顧問與消防安全技師複核，所附營建署認可通知書有效期限至 2028 年，符合工程契約第14條標準，同意備查免再抽驗。本 RFI 正式結案。',
    status: 'CLOSED',
    priority: 'NORMAL',
    reference_spec_no: 'SPEC-FIRE-02-B',
    cost_impact: false,
    schedule_impact: false,
    schedule_days_impact: 0,
    author_id: 'usr-pm',
    assigned_reviewer_id: 'usr-reviewer',
    due_date: '2026-08-28T18:00:00Z',
    answered_at: '2026-08-27T15:10:00Z',
    answered_by: 'usr-reviewer',
    closed_at: '2026-08-28T09:00:00Z',
    closed_by: 'usr-pm',
    created_at: '2026-08-20T10:00:00Z'
  },
  {
    id: 'rfi-0045',
    project_id: 'prj-pj01',
    rfi_number: 'RFI-PJ01-2026-0045',
    subject: '雨水回收沉砂池排水斜度與既有管網高程倒灌疑義 (⚠️ 已逾期)',
    question: '現場開挖測量既有市政雨水幹管入水口標高為 EL+12.45m，但設計圖標示為 EL+11.80m。高程差異導致沉砂池重力流坡度不足（反坡 0.8%），豪大雨時恐有市政雨水倒灌回流機房危險！',
    suggested_solution: '緊急評估增設一套 7.5HP 沉水排污防洪抽水泵浦及電動逆止防回流活塞閥，並將此區標高重新修正。',
    official_reply: null,
    status: 'UNDER_REVIEW',
    priority: 'URGENT',
    reference_spec_no: 'DWG-CIVIL-SW-08',
    cost_impact: true,
    schedule_impact: true,
    schedule_days_impact: 14,
    author_id: 'usr-member',
    assigned_reviewer_id: 'usr-reviewer',
    due_date: '2026-09-05T18:00:00Z', // In the past -> Overdue!
    answered_at: null,
    answered_by: null,
    closed_at: null,
    closed_by: null,
    created_at: '2026-08-28T09:00:00Z'
  },
  {
    id: 'rfi-0046',
    project_id: 'prj-pj01',
    rfi_number: 'RFI-PJ01-2026-0046',
    subject: '地下停車場充電樁線槽與排煙風管淨高不足檢討',
    question: 'B1 停車場設計 32 座電動車充電樁線槽，與消防防排煙風管交會處淨高僅剩 2.05m，未達法規最低 2.1m 通行淨高要求。',
    suggested_solution: '將風管轉折改為扁平型長寬比 4:1 之矩形不銹鋼風管，並將線槽整合共用吊架。',
    official_reply: null,
    status: 'DRAFT',
    priority: 'NORMAL',
    reference_spec_no: 'DWG-MEP-B1-ELEC-12',
    cost_impact: true,
    schedule_impact: false,
    schedule_days_impact: 0,
    author_id: 'usr-member',
    assigned_reviewer_id: null,
    due_date: '2026-09-22T18:00:00Z',
    answered_at: null,
    answered_by: null,
    closed_at: null,
    closed_by: null,
    created_at: '2026-09-10T14:00:00Z'
  }
];

export const INITIAL_ATTACHMENTS: Attachment[] = [
  {
    id: 'att-01',
    target_type: 'RFI',
    target_id: 'rfi-0042',
    file_name: 'B2_樑穿孔管線碰撞斷面圖_REV2.dwg',
    file_size: 14285000,
    file_url: 'https://images.unsplash.com/photo-1503387762-592deb58ef4e?w=1200&auto=format&fit=crop&q=80',
    mime_type: 'application/acad',
    uploader_id: 'usr-member',
    uploader_name: '陳柏叡',
    created_at: '2026-09-08T09:35:00Z'
  },
  {
    id: 'att-02',
    target_type: 'RFI',
    target_id: 'rfi-0042',
    file_name: '現場套管干擾照片_剪貼簿截圖.png',
    file_size: 2450000,
    file_url: 'https://images.unsplash.com/photo-1581092160607-ee22621dd758?w=1200&auto=format&fit=crop&q=80',
    mime_type: 'image/png',
    uploader_id: 'usr-member',
    uploader_name: '陳柏叡',
    created_at: '2026-09-08T09:40:00Z',
    is_clipboard: true
  },
  {
    id: 'att-03',
    target_type: 'RFI',
    target_id: 'rfi-0043',
    file_name: 'JIS_F10T_材料降伏剪力測試報告書.pdf',
    file_size: 8400000,
    file_url: 'https://images.unsplash.com/photo-1541888946425-d0fbb1861564?w=1200&auto=format&fit=crop&q=80',
    mime_type: 'application/pdf',
    uploader_id: 'usr-member',
    uploader_name: '陳柏叡',
    created_at: '2026-09-09T14:20:00Z'
  },
  {
    id: 'att-04',
    target_type: 'TASK',
    target_id: 'tsk-01',
    file_name: '耐火填縫施工SOP檢驗規範.pdf',
    file_size: 4200000,
    file_url: 'https://images.unsplash.com/photo-1590247813693-5541d1c609fd?w=1200&auto=format&fit=crop&q=80',
    mime_type: 'application/pdf',
    uploader_id: 'usr-pm',
    uploader_name: '林思瑜',
    created_at: '2026-09-01T10:15:00Z'
  },
  {
    id: 'att-05',
    target_type: 'TASK',
    target_id: 'tsk-02',
    file_name: 'UT超音波探傷探頭校驗校正紀錄.png',
    file_size: 1980000,
    file_url: 'https://images.unsplash.com/photo-1581092335397-9583fe92d232?w=1200&auto=format&fit=crop&q=80',
    mime_type: 'image/png',
    uploader_id: 'usr-member',
    uploader_name: '陳柏叡',
    created_at: '2026-09-02T12:00:00Z',
    is_clipboard: true
  }
];

export const INITIAL_RFI_AUDIT_LOGS: RFIAuditLog[] = [
  {
    id: 'log-01',
    rfi_id: 'rfi-0042',
    action: 'CREATE_RFI',
    user_id: 'usr-member',
    user_name: '陳柏叡',
    user_role: 'MEMBER',
    details: '建立資訊請求草稿，自動編號 RFI-PJ01-2026-0042，引用圖號 DWG-MEP-B2-04。',
    timestamp: '2026-09-08T09:30:00Z'
  },
  {
    id: 'log-02',
    rfi_id: 'rfi-0042',
    action: 'ATTACHMENT_UPLOADED',
    user_id: 'usr-member',
    user_name: '陳柏叡',
    user_role: 'MEMBER',
    details: '透過剪貼簿貼上現場干擾截圖 (2.45MB)，直接掛載 S3 Pre-signed URL。',
    timestamp: '2026-09-08T09:40:00Z'
  },
  {
    id: 'log-03',
    rfi_id: 'rfi-0042',
    action: 'SUBMIT_RFI',
    user_id: 'usr-member',
    user_name: '陳柏叡',
    user_role: 'MEMBER',
    details: '正式送出 RFI，狀態由 DRAFT 轉為 SUBMITTED，指派審查員 郭文正。',
    timestamp: '2026-09-08T10:00:00Z'
  },
  {
    id: 'log-04',
    rfi_id: 'rfi-0042',
    action: 'STATUS_CHANGED',
    user_id: 'usr-reviewer',
    user_name: '郭文正',
    user_role: 'REVIEWER_CLIENT',
    details: '審查員接單收件，狀態轉為 UNDER_REVIEW（審查中）。',
    timestamp: '2026-09-09T09:00:00Z'
  },
  {
    id: 'log-05',
    rfi_id: 'rfi-0038',
    action: 'OFFICIAL_REPLY',
    user_id: 'usr-reviewer',
    user_name: '郭文正',
    user_role: 'REVIEWER_CLIENT',
    details: '審查人員填寫官方回覆，核定採用 IEEE 344 抗震 Class II 級認證。狀態改為 ANSWERED。',
    timestamp: '2026-09-07T16:20:00Z'
  },
  {
    id: 'log-06',
    rfi_id: 'rfi-0035',
    action: 'CLOSE_RFI',
    user_id: 'usr-pm',
    user_name: '林思瑜',
    user_role: 'PROJECT_MANAGER',
    details: '專案經理驗核業主官方回覆無誤，依法規合約辦理強制結案歸檔 (CLOSED)。',
    timestamp: '2026-08-28T09:00:00Z'
  }
];

export const INITIAL_COMMENTS: TaskComment[] = [
  {
    id: 'cmt-01',
    task_id: 'tsk-01',
    author_id: 'usr-pm',
    author_name: '林思瑜',
    content: '現場已聯繫第三公正檢驗機構，預計下週一上午現場取樣抽查。請機電組預備好管位放樣記錄。',
    created_at: '2026-09-03T14:20:00Z'
  },
  {
    id: 'cmt-02',
    task_id: 'tsk-01',
    author_id: 'usr-member',
    author_name: '陳柏叡',
    content: '收到！已備妥相關圖面並將孔位標示於柱側。',
    created_at: '2026-09-03T15:05:00Z'
  }
];
