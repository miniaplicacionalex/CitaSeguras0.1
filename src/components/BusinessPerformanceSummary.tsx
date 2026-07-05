import { CheckCircle, Calendar } from "lucide-react";
import { BusinessStats } from "../types";

interface BusinessPerformanceSummaryProps {
  stats: BusinessStats;
}

export default function BusinessPerformanceSummary({ stats }: BusinessPerformanceSummaryProps) {
  return (
    <div className="space-y-3">
      <div className="flex justify-between items-baseline">
        <h2 className="text-xl font-bold text-slate-900 tracking-tight">Resumen de Rendimiento</h2>
        <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">Últimos 30 días</span>
      </div>

      {/* Primary Attendance Metric Card */}
      <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-sm flex flex-col justify-between h-32 relative overflow-hidden">
        <div className="flex justify-between items-start">
          <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Tasa de Asistencia</span>
          <span className="bg-emerald-50 text-emerald-700 text-[10px] font-bold py-0.5 px-2 rounded-full border border-emerald-100 flex items-center gap-0.5 animate-pulse">
            +2.4%
          </span>
        </div>
        <div className="flex items-baseline gap-1 mt-4">
          <span className="text-4xl font-extrabold text-[#004ac6] tracking-tight">
            {stats.attendanceRate}%
          </span>
        </div>
        {/* Visual gradient accent line */}
        <div className="absolute bottom-0 left-0 right-0 h-1 bg-[#004ac6]" />
      </div>

      {/* Grid sub-cards */}
      <div className="grid grid-cols-2 gap-3">
        <div className="bg-white border border-slate-200 rounded-xl p-3 shadow-sm flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-emerald-50 border border-emerald-100 flex items-center justify-center text-emerald-600 flex-shrink-0">
            <CheckCircle size={16} />
          </div>
          <div>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Confirmadas</p>
            <p className="text-lg font-bold text-slate-800">{stats.confirmedCount}</p>
          </div>
        </div>

        <div className="bg-white border border-slate-200 rounded-xl p-3 shadow-sm flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-amber-50 border border-amber-100 flex items-center justify-center text-amber-600 flex-shrink-0">
            <Calendar size={16} />
          </div>
          <div>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Reagendadas</p>
            <p className="text-lg font-bold text-slate-800">{stats.rescheduledCount}</p>
          </div>
        </div>
      </div>
    </div>
  );
}
