import React from "react";
import { 
  AlertTriangle, 
  ExternalLink, 
  FileText, 
  CheckCircle2, 
  Check,
  MoreVertical,
  MessageSquare,
  Phone,
  Mail
} from "lucide-react";
import { Appointment } from "../types";

interface AppointmentCardProps {
  key?: string;
  app: Appointment;
  isSelected: boolean;
  onToggleSelect: () => void;
  approveAppointmentPayment: (id: string) => void;
  rejectAppointmentPayment: (id: string) => void;
  onSuccessToast: (msg: string) => void;
  isWorkspaceConnected: boolean;
}

export default function AppointmentCard({
  app,
  isSelected,
  onToggleSelect,
  approveAppointmentPayment,
  rejectAppointmentPayment,
  onSuccessToast,
  isWorkspaceConnected,
}: AppointmentCardProps) {
  const isReincidente = app.absences >= 2;

  // Determine border and accent colors
  let accentColorClass = "bg-slate-300";
  let bgBadgeClass = "bg-slate-100 text-slate-600";
  
  if (app.paymentStatus === "Confirmado") {
    accentColorClass = "bg-emerald-500";
    bgBadgeClass = "bg-emerald-50 text-emerald-700 border border-emerald-100";
  } else if (app.paymentStatus === "Por Verificar") {
    accentColorClass = "bg-amber-500";
    bgBadgeClass = "bg-amber-50 text-amber-700 border border-amber-100";
  } else if (app.paymentStatus === "Cancelado") {
    accentColorClass = "bg-rose-500";
    bgBadgeClass = "bg-rose-50 text-rose-700 border border-rose-100";
  }

  return (
    <div className="space-y-2">
      <div
        onClick={onToggleSelect}
        className={`bg-white border rounded-xl overflow-hidden shadow-sm hover:shadow-md transition-all cursor-pointer flex ${
          isSelected ? "border-[#004ac6] ring-1 ring-[#004ac6]" : "border-slate-200"
        }`}
      >
        {/* Left accent bar */}
        <div className={`w-1.5 ${accentColorClass}`} />

        {/* Card Content */}
        <div className="flex-1 p-3 flex items-center justify-between">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-slate-800">{app.time}</span>
              {isReincidente && (
                <span className="text-[10px] bg-red-50 text-red-600 border border-red-100 font-bold px-1.5 py-0.5 rounded flex items-center gap-0.5 animate-pulse">
                  ⚠️ Cliente Reincidente
                </span>
              )}
            </div>

            <h4 className="text-sm font-bold text-slate-900 tracking-tight">
              {app.clientName}
            </h4>

            <p className="text-xs text-slate-500 flex items-center gap-1">
              <span>{app.service}</span>
              <span>•</span>
              <span>{app.paymentMethod}</span>
            </p>
          </div>

          {/* Right Side: Status Badge */}
          <div className="flex flex-col items-end gap-1.5">
            <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${bgBadgeClass}`}>
              {app.paymentStatus === "Por Verificar" ? "Por Verificar" : app.paymentStatus}
            </span>
            <span className="text-[10px] font-mono text-slate-400">
              ${app.amount} MXN
            </span>
          </div>
        </div>
      </div>

      {/* Expanded Details Panel */}
      {isSelected && (
        <div className="bg-slate-50 border-x border-b border-slate-200 rounded-b-xl p-3 space-y-3 -mt-2.5 mx-0.5 text-xs text-slate-700 animate-fade-in">
          <div className="grid grid-cols-2 gap-2 border-b border-slate-200 pb-2">
            <div>
              <p className="text-slate-400 text-[10px] uppercase font-semibold">Email</p>
              <p className="font-medium text-slate-800 break-all">{app.email}</p>
            </div>
            <div>
              <p className="text-slate-400 text-[10px] uppercase font-semibold">WhatsApp</p>
              <p className="font-medium text-slate-800">{app.phone}</p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2 border-b border-slate-200 pb-2">
            <div>
              <p className="text-slate-400 text-[10px] uppercase font-semibold">Historial de Ausencias</p>
              <p className={`font-bold ${app.absences > 0 ? "text-red-600" : "text-emerald-600"}`}>
                {app.absences > 0 ? `❌ ${app.absences} Ausencias` : "✅ Sin ausencias"}
              </p>
            </div>
            <div>
              <p className="text-slate-400 text-[10px] uppercase font-semibold">Acciones Inteligentes</p>
              <p className="font-semibold text-blue-700">
                {app.paymentStatus === "Confirmado"
                  ? "✅ Agendado en Calendar"
                  : "⏳ Esperando validación"}
              </p>
            </div>
          </div>

          {/* Reincidente Blocking Explanation */}
          {isReincidente && (
            <div className="bg-red-50 border border-red-100 text-red-800 p-2.5 rounded-lg space-y-1">
              <p className="font-bold flex items-center gap-1">
                <AlertTriangle size={14} className="text-red-600" /> Apartados Parciales Bloqueados
              </p>
              <p className="text-[10px] leading-relaxed">
                Este cliente tiene {app.absences} inasistencias acumuladas. Por seguridad, no puede reservar con pagos parciales y se le exige prepago total para validar citas.
              </p>
            </div>
          )}

          {/* Gemini validation log summary if exists */}
          {app.geminiValidationLog && (
            <div className="bg-white border border-slate-200 p-2 rounded-lg text-[10px] space-y-1">
              <p className="font-bold text-slate-700 flex items-center gap-1">
                <FileText size={12} className="text-[#004ac6]" /> Log de Verificación IA (Gemini):
              </p>
              <p className="text-slate-600 font-mono italic leading-relaxed">
                {JSON.parse(app.geminiValidationLog).reason}
              </p>
            </div>
          )}

          {/* Approve / Reject Actions for verification */}
          {app.paymentStatus === "Por Verificar" && (
            <div className="flex gap-2 pt-1">
              <button
                onClick={() => {
                  approveAppointmentPayment(app.id);
                  onSuccessToast("¡Pago aprobado y evento sincronizado en Google Calendar!");
                }}
                className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-2 px-3 rounded-lg flex items-center justify-center gap-1.5 shadow-sm transition-colors text-xs cursor-pointer"
              >
                <Check size={14} /> Aprobar Pago y Calendar
              </button>
              <button
                onClick={() => {
                  rejectAppointmentPayment(app.id);
                  onSuccessToast("Pago marcado como rechazado.");
                }}
                className="bg-white border border-rose-300 hover:bg-rose-50 text-rose-600 font-semibold py-2 px-3 rounded-lg flex items-center justify-center gap-1.5 transition-colors text-xs cursor-pointer"
              >
                Rechazar
              </button>
            </div>
          )}

          {/* Google Workspace Sync Details */}
          {isWorkspaceConnected && app.paymentStatus === "Confirmado" && (
            <div className="bg-blue-50 border border-blue-100 p-2 rounded-lg text-[10px] text-blue-800 flex items-center justify-between">
              <div className="flex items-center gap-1.5">
                <CheckCircle2 size={12} className="text-blue-600" />
                <span>Sincronizado en Google Sheets y Calendar</span>
              </div>
              <a
                href="https://calendar.google.com"
                target="_blank"
                rel="noreferrer"
                className="font-bold text-blue-600 hover:underline flex items-center gap-0.5"
              >
                Ver <ExternalLink size={10} />
              </a>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
