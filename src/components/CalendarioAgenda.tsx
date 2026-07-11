import React, { useState } from "react";
import { 
  ChevronLeft, 
  ChevronRight, 
  CalendarDays, 
  Clock, 
  User, 
  Tag,
  CalendarRange
} from "lucide-react";
import { Appointment } from "../types";

interface CalendarioAgendaProps {
  appointments: Appointment[];
  onSuccessToast: (msg: string) => void;
}

export default function CalendarioAgenda({ appointments, onSuccessToast }: CalendarioAgendaProps) {
  // We use the stable demo date or current local date.
  // Since the demo appointments are around July 2026, we default to July 2026.
  const [currentDate, setCurrentDate] = useState<Date>(() => {
    // If we have appointments, we can default to the month of the first appointment,
    // or July 2026. Let's use July 2026 as the base or the current date.
    const today = new Date();
    // Default to July 2026 if today is not in 2026 yet, to ensure the user sees the demo data.
    if (today.getFullYear() < 2026) {
      return new Date(2026, 6, 1); // July is index 6
    }
    return today;
  });

  const [selectedDateStr, setSelectedDateStr] = useState<string>(() => {
    const today = new Date();
    const y = today.getFullYear() < 2026 ? 2026 : today.getFullYear();
    const m = today.getFullYear() < 2026 ? 7 : today.getMonth() + 1;
    const d = today.getFullYear() < 2026 ? 4 : today.getDate(); // Default to July 4th for demo data if we are in 2026-07
    const mStr = String(m).padStart(2, "0");
    const dStr = String(d).padStart(2, "0");
    return `${y}-${mStr}-${dStr}`;
  });

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();

  // Navigation handlers
  const handlePrevMonth = () => {
    setCurrentDate(new Date(year, month - 1, 1));
  };

  const handleNextMonth = () => {
    setCurrentDate(new Date(year, month + 1, 1));
  };

  // Days calculations
  const firstDayIndex = new Date(year, month, 1).getDay(); // 0 = Sunday, 1 = Monday...
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const daysInPrevMonth = new Date(year, month, 0).getDate();

  // Create grid cells
  const gridCells: { dayNum: number; dateStr: string; isCurrentMonth: boolean }[] = [];

  // Previous month padding
  for (let i = firstDayIndex - 1; i >= 0; i--) {
    const prevDay = daysInPrevMonth - i;
    const prevMonthDate = new Date(year, month - 1, prevDay);
    const mStr = String(prevMonthDate.getMonth() + 1).padStart(2, "0");
    const dStr = String(prevDay).padStart(2, "0");
    gridCells.push({
      dayNum: prevDay,
      dateStr: `${prevMonthDate.getFullYear()}-${mStr}-${dStr}`,
      isCurrentMonth: false,
    });
  }

  // Current month days
  for (let i = 1; i <= daysInMonth; i++) {
    const mStr = String(month + 1).padStart(2, "0");
    const dStr = String(i).padStart(2, "0");
    gridCells.push({
      dayNum: i,
      dateStr: `${year}-${mStr}-${dStr}`,
      isCurrentMonth: true,
    });
  }

  // Next month padding to fill grid
  const totalCells = gridCells.length;
  const nextMonthPadding = totalCells % 7 === 0 ? 0 : 7 - (totalCells % 7);
  for (let i = 1; i <= nextMonthPadding; i++) {
    const nextMonthDate = new Date(year, month + 1, i);
    const mStr = String(nextMonthDate.getMonth() + 1).padStart(2, "0");
    const dStr = String(i).padStart(2, "0");
    gridCells.push({
      dayNum: i,
      dateStr: `${nextMonthDate.getFullYear()}-${mStr}-${dStr}`,
      isCurrentMonth: false,
    });
  }

  // Month name helper
  const monthName = currentDate.toLocaleDateString("es-MX", { month: "long", year: "numeric" });

  // Get appointments for the selected date
  const selectedDayAppointments = appointments.filter(app => app.date === selectedDateStr);

  return (
    <div id="calendario-agenda-container" className="bg-white border border-slate-200 rounded-2xl p-4 shadow-sm space-y-4 animate-fade-in mt-6">
      
      {/* Calendar Header with navigation */}
      <div className="flex items-center justify-between border-b border-slate-100 pb-3">
        <div className="flex items-center gap-2">
          <CalendarRange className="text-[#004ac6]" size={18} />
          <h3 className="text-xs font-extrabold text-slate-800 tracking-tight uppercase">
            Calendario de Citas
          </h3>
        </div>
        
        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={handlePrevMonth}
            className="p-1 hover:bg-slate-100 rounded-lg text-slate-500 transition-colors cursor-pointer"
            title="Mes Anterior"
          >
            <ChevronLeft size={16} />
          </button>
          <span className="text-xs font-bold text-slate-700 capitalize min-w-[100px] text-center">
            {monthName}
          </span>
          <button
            type="button"
            onClick={handleNextMonth}
            className="p-1 hover:bg-slate-100 rounded-lg text-slate-500 transition-colors cursor-pointer"
            title="Siguiente Mes"
          >
            <ChevronRight size={16} />
          </button>
        </div>
      </div>

      {/* Weekday headers */}
      <div className="grid grid-cols-7 gap-1 text-center">
        {["Do", "Lu", "Ma", "Mi", "Ju", "Vi", "Sá"].map((day, idx) => (
          <span 
            key={idx} 
            className="text-[10px] font-bold text-slate-400 uppercase tracking-wider py-1"
          >
            {day}
          </span>
        ))}
      </div>

      {/* Calendar Days Grid */}
      <div className="grid grid-cols-7 gap-1">
        {gridCells.map((cell, idx) => {
          // Get appointments on this specific day
          const dayApps = appointments.filter(app => app.date === cell.dateStr);
          
          // Count statuses
          const confirmedCount = dayApps.filter(app => app.paymentStatus === "Confirmado").length;
          const pendingCount = dayApps.filter(app => app.paymentStatus === "Por Verificar").length;
          const rescheduledCount = dayApps.filter(app => app.paymentStatus === "Reagendado").length;
          
          const isSelected = selectedDateStr === cell.dateStr;
          const isToday = (() => {
            const t = new Date();
            const y = t.getFullYear();
            const m = String(t.getMonth() + 1).padStart(2, "0");
            const d = String(t.getDate()).padStart(2, "0");
            return cell.dateStr === `${y}-${m}-${d}`;
          })();

          return (
            <button
              key={idx}
              type="button"
              onClick={() => setSelectedDateStr(cell.dateStr)}
              className={`min-h-[44px] flex flex-col justify-between p-1 rounded-xl transition-all relative border cursor-pointer ${
                !cell.isCurrentMonth 
                  ? "bg-slate-50/50 text-slate-300 border-transparent hover:bg-slate-50" 
                  : isSelected
                  ? "bg-[#004ac6] text-white border-[#004ac6] shadow-sm font-bold scale-[1.02] z-10"
                  : isToday
                  ? "bg-blue-50/70 border-blue-200 text-[#004ac6] font-bold"
                  : "bg-white border-transparent text-slate-700 hover:bg-slate-50 hover:border-slate-100"
              }`}
            >
              {/* Day number */}
              <span className="text-[11px] self-start ml-1 mt-0.5">{cell.dayNum}</span>

              {/* Status Indicators dots/pills */}
              <div className="flex gap-0.5 justify-center w-full mt-1 pb-0.5">
                {confirmedCount > 0 && (
                  <span 
                    className={`w-1.5 h-1.5 rounded-full ${isSelected ? "bg-white" : "bg-emerald-500"}`}
                    title={`${confirmedCount} confirmada(s)`}
                  />
                )}
                {pendingCount > 0 && (
                  <span 
                    className={`w-1.5 h-1.5 rounded-full ${isSelected ? "bg-white" : "bg-amber-500"}`}
                    title={`${pendingCount} por confirmar`}
                  />
                )}
                {rescheduledCount > 0 && (
                  <span 
                    className={`w-1.5 h-1.5 rounded-full ${isSelected ? "bg-white" : "bg-blue-400"}`}
                    title={`${rescheduledCount} reagendada(s)`}
                  />
                )}
              </div>
            </button>
          );
        })}
      </div>

      {/* Interactive Legend */}
      <div className="flex justify-center flex-wrap gap-x-4 gap-y-1.5 pt-2 border-t border-slate-100 text-[10px] text-slate-500 font-medium">
        <div className="flex items-center gap-1">
          <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 inline-block" />
          <span>Agendadas / Confirmadas</span>
        </div>
        <div className="flex items-center gap-1">
          <span className="w-2.5 h-2.5 rounded-full bg-amber-500 inline-block" />
          <span>Por Confirmar</span>
        </div>
        <div className="flex items-center gap-1">
          <span className="w-2.5 h-2.5 rounded-full bg-blue-400 inline-block" />
          <span>Reagendadas</span>
        </div>
      </div>

      {/* Selected Day Agenda Breakdown */}
      <div className="bg-slate-50 border border-slate-100 rounded-xl p-3 space-y-2.5 mt-2">
        <div className="flex items-center justify-between">
          <h4 className="text-[11px] font-extrabold text-slate-600 uppercase tracking-wider flex items-center gap-1.5">
            <CalendarDays size={13} className="text-slate-400" />
            <span>Citas del {new Date(selectedDateStr + "T00:00:00").toLocaleDateString("es-MX", { day: "numeric", month: "short", year: "numeric" })}</span>
          </h4>
          <span className="text-[10px] bg-slate-200/70 text-slate-600 font-bold px-2 py-0.5 rounded-full">
            {selectedDayAppointments.length} en total
          </span>
        </div>

        {selectedDayAppointments.length === 0 ? (
          <p className="text-[11px] text-slate-400 text-center py-4 font-medium italic">
            No hay citas registradas para este día.
          </p>
        ) : (
          <div className="space-y-1.5 max-h-[220px] overflow-y-auto pr-0.5">
            {selectedDayAppointments.map((app) => {
              // Status Styling
              let statusBg = "bg-slate-100 text-slate-600 border-slate-200";
              let statusLabel = "Cancelado";
              
              if (app.paymentStatus === "Confirmado") {
                statusBg = "bg-emerald-50 text-emerald-700 border-emerald-100";
                statusLabel = "Confirmada";
              } else if (app.paymentStatus === "Por Verificar") {
                statusBg = "bg-amber-50 text-amber-700 border-amber-100";
                statusLabel = "Por Confirmar";
              } else if (app.paymentStatus === "Reagendado") {
                statusBg = "bg-blue-50 text-blue-700 border-blue-100";
                statusLabel = "Reagendada";
              }

              return (
                <div 
                  key={app.id} 
                  className="bg-white border border-slate-150 rounded-lg p-2.5 flex flex-col gap-1 shadow-xs hover:border-slate-300 transition-colors text-left"
                >
                  <div className="flex justify-between items-start">
                    <div className="flex items-center gap-1.5">
                      <User size={12} className="text-slate-400 shrink-0" />
                      <span className="text-xs font-bold text-slate-800 line-clamp-1">
                        {app.clientName}
                      </span>
                    </div>
                    <span className={`text-[9px] font-extrabold px-2 py-0.5 rounded-full border uppercase tracking-wider shrink-0 ${statusBg}`}>
                      {statusLabel}
                    </span>
                  </div>

                  <div className="flex items-center justify-between mt-1 text-[10px]">
                    <div className="flex items-center gap-1 text-slate-500">
                      <Tag size={10} className="shrink-0" />
                      <span className="font-semibold text-slate-600">{app.service}</span>
                    </div>

                    <div className="flex items-center gap-1 text-[#004ac6] font-bold">
                      <Clock size={10} className="shrink-0 text-blue-500" />
                      <span>{app.time}</span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
