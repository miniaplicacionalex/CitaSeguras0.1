import { CheckCircle, Calendar, DollarSign, Clock, UserX, Coins } from "lucide-react";
import { BusinessStats, Appointment } from "../types";

interface BusinessPerformanceSummaryProps {
  stats: BusinessStats;
  appointments: Appointment[];
}

export default function BusinessPerformanceSummary({ stats, appointments }: BusinessPerformanceSummaryProps) {
  // Calculamos los indicadores financieros de forma dinámica a partir de las citas
  const metrics = appointments.reduce(
    (acc, app) => {
      const deposit = app.depositAmountNeeded ?? Math.round(app.amount * 0.5);
      
      if (app.paymentStatus === "Confirmado") {
        if (app.absences > 0) {
          // No asistió, pero el anticipo ya fue cobrado/pagado
          acc.noShowRevenue += deposit;
        } else {
          // Cita confirmada/activa (dinero ingresado)
          acc.confirmedRevenue += deposit;
        }
      } else if (app.paymentStatus === "Por Verificar") {
        // Ticket subido pendiente de validar
        acc.pendingRevenue += deposit;
      }
      return acc;
    },
    { confirmedRevenue: 0, pendingRevenue: 0, noShowRevenue: 0 }
  );

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-baseline">
        <h2 className="text-xl font-bold text-slate-900 tracking-tight">Resumen de Rendimiento</h2>
        <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">Últimos 30 días</span>
      </div>

      {/* Primary Attendance Metric Card */}
      <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-sm flex flex-col justify-between h-28 relative overflow-hidden">
        <div className="flex justify-between items-start">
          <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Tasa de Asistencia</span>
          <span className="bg-emerald-50 text-emerald-700 text-[10px] font-bold py-0.5 px-2 rounded-full border border-emerald-100 flex items-center gap-0.5 animate-pulse">
            +2.4%
          </span>
        </div>
        <div className="flex items-baseline gap-1 mt-2">
          <span className="text-4xl font-extrabold text-[#004ac6] tracking-tight">
            {stats.attendanceRate}%
          </span>
        </div>
        {/* Visual gradient accent line */}
        <div className="absolute bottom-0 left-0 right-0 h-1 bg-[#004ac6]" />
      </div>

      {/* Grid sub-cards for Volume */}
      <div className="grid grid-cols-2 gap-3">
        <div className="bg-white border border-slate-200 rounded-xl p-3 shadow-sm flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-emerald-50 border border-emerald-100 flex items-center justify-center text-emerald-600 flex-shrink-0">
            <CheckCircle size={16} />
          </div>
          <div>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Confirmadas</p>
            <p className="text-sm font-bold text-slate-800">{stats.confirmedCount} citas</p>
          </div>
        </div>

        <div className="bg-white border border-slate-200 rounded-xl p-3 shadow-sm flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-amber-50 border border-amber-100 flex items-center justify-center text-amber-600 flex-shrink-0">
            <Calendar size={16} />
          </div>
          <div>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Reagendadas</p>
            <p className="text-sm font-bold text-slate-800">{stats.rescheduledCount} citas</p>
          </div>
        </div>
      </div>

      {/* Finanzas & Anticipos Section */}
      <div className="space-y-2 pt-1">
        <h3 className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Estatus de Anticipos y Pagos</h3>
        
        <div className="grid grid-cols-1 gap-2.5">
          {/* Card 1: Dinero Ingresado por Cita Agendada */}
          <div className="bg-emerald-50/40 border-l-4 border-emerald-500 border-y border-r border-slate-200/80 rounded-r-xl p-3 flex items-center justify-between shadow-xs transition-all hover:bg-emerald-50/60">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-full bg-emerald-100 border border-emerald-200 flex items-center justify-center text-emerald-700 flex-shrink-0">
                <Coins size={15} />
              </div>
              <div className="text-left">
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Ingresado (Citas Activas)</p>
                <p className="text-[9px] text-emerald-700 font-semibold">Garantizado por anticipo de cita</p>
              </div>
            </div>
            <div className="text-right">
              <span className="text-sm font-extrabold text-emerald-800 block">
                ${metrics.confirmedRevenue.toLocaleString("es-MX")} MXN
              </span>
            </div>
          </div>

          {/* Card 2: Dinero Por Confirmar */}
          <div className="bg-amber-50/40 border-l-4 border-amber-500 border-y border-r border-slate-200/80 rounded-r-xl p-3 flex items-center justify-between shadow-xs transition-all hover:bg-amber-50/60">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-full bg-amber-100 border border-amber-200 flex items-center justify-center text-amber-700 flex-shrink-0 animate-pulse">
                <Clock size={15} />
              </div>
              <div className="text-left">
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Por Confirmar (SPEI/OXXO)</p>
                <p className="text-[9px] text-amber-700 font-semibold">Tickets en espera de tu validación</p>
              </div>
            </div>
            <div className="text-right">
              <span className="text-sm font-extrabold text-amber-800 block">
                ${metrics.pendingRevenue.toLocaleString("es-MX")} MXN
              </span>
            </div>
          </div>

          {/* Card 3: Dinero No Asistió (Anticipo Retenido) */}
          <div className="bg-rose-50/40 border-l-4 border-rose-500 border-y border-r border-slate-200/80 rounded-r-xl p-3 flex items-center justify-between shadow-xs transition-all hover:bg-rose-50/60">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-full bg-rose-100 border border-rose-200 flex items-center justify-center text-rose-700 flex-shrink-0">
                <UserX size={15} />
              </div>
              <div className="text-left">
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">No Asistió (Retenido)</p>
                <p className="text-[9px] text-rose-700 font-semibold">Anticipo no reembolsable cobrado</p>
              </div>
            </div>
            <div className="text-right">
              <span className="text-sm font-extrabold text-rose-800 block">
                ${metrics.noShowRevenue.toLocaleString("es-MX")} MXN
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

