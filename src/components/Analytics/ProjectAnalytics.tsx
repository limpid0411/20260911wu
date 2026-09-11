import React from 'react';
import {
  TrendingUp,
  Clock,
  DollarSign,
  AlertTriangle,
  CheckCircle2,
  PieChart,
  BarChart3,
  Calendar,
  Layers,
  ArrowUpRight
} from 'lucide-react';
import { Project, Task, RFI, BoardColumn } from '../../types/pms';
import { storageService } from '../../services/storageService';

interface ProjectAnalyticsProps {
  project: Project;
}

export const ProjectAnalytics: React.FC<ProjectAnalyticsProps> = ({ project }) => {
  const tasks = storageService.getTasks();
  const rfis = storageService.getRFIs(project.id);
  const boards = storageService.getBoards(project.id);
  const columns = boards.flatMap((b) => storageService.getColumns(b.id));

  // Compute metrics
  const totalTasks = tasks.length;
  const completedTasks = tasks.filter((t) => {
    const col = columns.find((c) => c.id === t.column_id);
    return col?.name.includes('完成') || col?.name.includes('Done');
  }).length;
  const taskCompletionRate = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

  const totalRFIs = rfis.length;
  const closedRFIs = rfis.filter((r) => r.status === 'CLOSED').length;
  const overdueRFIs = rfis.filter((r) => storageService.isRFIOverdue(r)).length;
  const costImpactRFIs = rfis.filter((r) => r.cost_impact).length;
  const scheduleDelayDays = rfis.reduce((acc, r) => acc + (r.schedule_days_impact || 0), 0);

  // Status breakdown
  const rfiByStatus = {
    DRAFT: rfis.filter((r) => r.status === 'DRAFT').length,
    SUBMITTED: rfis.filter((r) => r.status === 'SUBMITTED').length,
    UNDER_REVIEW: rfis.filter((r) => r.status === 'UNDER_REVIEW').length,
    ANSWERED: rfis.filter((r) => r.status === 'ANSWERED').length,
    CLOSED: rfis.filter((r) => r.status === 'CLOSED').length,
    REJECTED: rfis.filter((r) => r.status === 'REJECTED').length
  };

  // Priority breakdown
  const urgentTasks = tasks.filter((t) => t.priority === 'URGENT').length;
  const highTasks = tasks.filter((t) => t.priority === 'HIGH').length;

  return (
    <div id="analytics-root" className="space-y-6">
      {/* Top summary cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Task Completion Rate */}
        <div className="bg-white p-5 border-2 border-black">
          <div className="flex items-center justify-between text-xs font-mono uppercase text-[#525252] mb-2 border-b border-black pb-1.5">
            <span className="font-bold tracking-wider">COMPLETION RATE</span>
            <CheckCircle2 className="w-4 h-4 text-black" strokeWidth={1.5} />
          </div>
          <div className="flex items-baseline gap-2 mt-2">
            <span className="text-4xl font-display font-black text-black font-mono">
              {taskCompletionRate}%
            </span>
            <span className="text-xs font-mono text-[#525252]">
              ({completedTasks}/{totalTasks})
            </span>
          </div>
          {/* Progress Bar */}
          <div className="w-full h-3 border border-black bg-white mt-4 p-0.5">
            <div
              className="h-full bg-black transition-all duration-300"
              style={{ width: `${taskCompletionRate}%` }}
            />
          </div>
        </div>

        {/* Total RFI & Closure */}
        <div className="bg-white p-5 border-2 border-black">
          <div className="flex items-center justify-between text-xs font-mono uppercase text-[#525252] mb-2 border-b border-black pb-1.5">
            <span className="font-bold tracking-wider">RFI CLOSURE RATE</span>
            <TrendingUp className="w-4 h-4 text-black" strokeWidth={1.5} />
          </div>
          <div className="flex items-baseline gap-2 mt-2">
            <span className="text-4xl font-display font-black text-black font-mono">
              {totalRFIs > 0 ? Math.round((closedRFIs / totalRFIs) * 100) : 0}%
            </span>
            <span className="text-xs font-mono text-[#525252]">
              ({closedRFIs}/{totalRFIs})
            </span>
          </div>
          <div className="w-full h-3 border border-black bg-white mt-4 p-0.5">
            <div
              className="h-full bg-black transition-all duration-300"
              style={{
                width: `${totalRFIs > 0 ? (closedRFIs / totalRFIs) * 100 : 0}%`
              }}
            />
          </div>
        </div>

        {/* Schedule Delay Risk */}
        <div className="bg-white p-5 border-2 border-black">
          <div className="flex items-center justify-between text-xs font-mono uppercase text-[#525252] mb-2 border-b border-black pb-1.5">
            <span className="font-bold tracking-wider">SCHEDULE DELAY</span>
            <Clock className="w-4 h-4 text-black" strokeWidth={1.5} />
          </div>
          <div className="flex items-baseline gap-2 mt-2">
            <span className="text-4xl font-display font-black text-black font-mono">
              +{scheduleDelayDays}
            </span>
            <span className="text-xs font-mono uppercase text-black font-bold">DAYS</span>
          </div>
          <p className="text-[11px] font-body text-[#525252] mt-3">
            源自 RFI 圖面設計衝突與結構變更工期展延
          </p>
        </div>

        {/* Cost Impact RFI */}
        <div className="bg-white p-5 border-2 border-black">
          <div className="flex items-center justify-between text-xs font-mono uppercase text-[#525252] mb-2 border-b border-black pb-1.5">
            <span className="font-bold tracking-wider">COST IMPACT RFIs</span>
            <DollarSign className="w-4 h-4 text-black" strokeWidth={1.5} />
          </div>
          <div className="flex items-baseline gap-2 mt-2">
            <span className="text-4xl font-display font-black text-black font-mono">
              {costImpactRFIs}
            </span>
            <span className="text-xs font-mono uppercase text-[#525252]">ITEMS</span>
          </div>
          <p className="text-[11px] font-body text-[#525252] mt-3">需提報工務會報進行合約價金議價</p>
        </div>
      </div>

      {/* Charts / Visual Breakdown */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* RFI Lifecycle State Distribution */}
        <div className="bg-white p-6 border-2 border-black space-y-4">
          <div className="flex items-center justify-between border-b-2 border-black pb-3">
            <div>
              <h3 className="text-base font-display font-bold uppercase tracking-tight text-black">
                RFI 資訊請求生命週期分佈
              </h3>
              <p className="text-xs font-mono uppercase text-[#525252]">LIFECYCLE DISTRIBUTION</p>
            </div>
            <span className="text-xs font-mono font-bold text-black border border-black bg-[#F5F5F5] px-2.5 py-1 uppercase">
              TOTAL: {totalRFIs}
            </span>
          </div>

          <div className="space-y-4 pt-2">
            {[
              { label: '草稿 (DRAFT)', count: rfiByStatus.DRAFT },
              { label: '已送出審查 (SUBMITTED)', count: rfiByStatus.SUBMITTED },
              { label: '審理核定中 (UNDER REVIEW)', count: rfiByStatus.UNDER_REVIEW },
              { label: '官方已回覆 (ANSWERED)', count: rfiByStatus.ANSWERED },
              { label: '已正式結案 (CLOSED)', count: rfiByStatus.CLOSED },
              { label: '退件補正 (REJECTED)', count: rfiByStatus.REJECTED }
            ].map((st) => {
              const pct = totalRFIs > 0 ? Math.round((st.count / totalRFIs) * 100) : 0;
              return (
                <div key={st.label} className="space-y-1">
                  <div className="flex items-center justify-between text-xs font-mono">
                    <span className="text-black font-bold uppercase">
                      {st.label}
                    </span>
                    <span className="text-[#525252]">
                      {st.count} 件 [{pct}%]
                    </span>
                  </div>
                  <div className="w-full h-2.5 border border-black bg-white p-0.5">
                    <div
                      className="h-full bg-black transition-all duration-300"
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Task Priority & Health Distribution */}
        <div className="bg-white p-6 border-2 border-black space-y-4">
          <div className="flex items-center justify-between border-b-2 border-black pb-3">
            <div>
              <h3 className="text-base font-display font-bold uppercase tracking-tight text-black">
                看板任務優先級與風險評估
              </h3>
              <p className="text-xs font-mono uppercase text-[#525252]">PRIORITY & RISK MATRIX</p>
            </div>
            <span className="text-xs font-mono font-bold text-black border border-black bg-[#F5F5F5] px-2.5 py-1 uppercase">
              TOTAL: {totalTasks}
            </span>
          </div>

          <div className="grid grid-cols-2 gap-3 pt-2">
            <div className="p-4 bg-white border-2 border-black">
              <div className="text-xs font-mono font-bold text-black uppercase tracking-wider mb-1">
                [ URGENT ] 緊急卡片
              </div>
              <div className="text-3xl font-display font-bold font-mono text-black">
                {urgentTasks}
              </div>
              <span className="text-[11px] font-mono text-[#525252] uppercase mt-1 block">需立即排解</span>
            </div>

            <div className="p-4 bg-white border-2 border-black">
              <div className="text-xs font-mono font-bold text-black uppercase tracking-wider mb-1">
                [ HIGH ] 高優先度
              </div>
              <div className="text-3xl font-display font-bold font-mono text-black">
                {highTasks}
              </div>
              <span className="text-[11px] font-mono text-[#525252] uppercase mt-1 block">本週驗收重點</span>
            </div>

            <div className="p-4 bg-white border-2 border-black">
              <div className="text-xs font-mono font-bold text-black uppercase tracking-wider mb-1">
                [ MEDIUM ] 中等常規
              </div>
              <div className="text-3xl font-display font-bold font-mono text-black">
                {tasks.filter((t) => t.priority === 'MEDIUM').length}
              </div>
              <span className="text-[11px] font-mono text-[#525252] uppercase mt-1 block">按進度施作</span>
            </div>

            <div className="p-4 bg-white border-2 border-black">
              <div className="text-xs font-mono font-bold text-black uppercase tracking-wider mb-1">
                [ LOW ] 低優先度
              </div>
              <div className="text-3xl font-display font-bold font-mono text-black">
                {tasks.filter((t) => t.priority === 'LOW').length}
              </div>
              <span className="text-[11px] font-mono text-[#525252] uppercase mt-1 block">後續改善項</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
