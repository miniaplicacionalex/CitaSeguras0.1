import React from "react";
import { 
  Mail, 
  Phone, 
  MessageSquare, 
  MoreVertical, 
  AlertTriangle 
} from "lucide-react";
import { Appointment, BusinessStats } from "../types";
import BusinessPerformanceSummary from "./BusinessPerformanceSummary";

interface PantallaEstadoProps {
  appointments: Appointment[];
  stats: BusinessStats;
}

export default function PantallaEstado({
  appointments,
  stats,
}: PantallaEstadoProps) {
  return (
    <div id="pantalla-estado" className="p-4 max-w-md mx-auto space-y-6">
      {/* Resumen de Rendimiento widget */}
      <BusinessPerformanceSummary stats={stats} appointments={appointments} />

      {/* Actividad Reciente */}
      <div className="space-y-3">
        <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wider">Actividad Reciente</h3>

        <div className="space-y-2">
          {appointments.slice(0, 5).map((app, index) => {
            const hasAbsences = app.absences > 0;
            const isReincidente = app.absences >= 2;

            // Colored vertical bar on left matching status
            let barColor = "bg-slate-300";
            let iconComponent = <MoreVertical size={16} className="text-slate-400" />;

            if (app.paymentStatus === "Confirmado") {
              barColor = "bg-emerald-500";
              iconComponent = <MessageSquare size={16} className="text-[#004ac6]" />;
            } else if (app.paymentStatus === "Por Verificar") {
              barColor = "bg-amber-500";
              iconComponent = <Phone size={16} className="text-[#004ac6]" />;
            } else if (app.paymentStatus === "Cancelado") {
              barColor = "bg-rose-500";
              iconComponent = <Mail size={16} className="text-rose-500" />;
            }

            // Customize icons
            if (index === 0) {
              barColor = "bg-emerald-500";
              iconComponent = <MessageSquare size={16} className="text-[#004ac6]" />;
            } else if (index === 1) {
              barColor = "bg-amber-500";
              iconComponent = <Phone size={16} className="text-[#004ac6]" />;
            } else if (index === 2) {
              barColor = "bg-rose-500";
              iconComponent = <Mail size={16} className="text-[#004ac6]" />;
            } else if (index === 3) {
              barColor = "bg-slate-400";
              iconComponent = <MoreVertical size={16} className="text-slate-400" />;
            } else if (index === 4) {
              barColor = "bg-emerald-500";
              iconComponent = <MessageSquare size={16} className="text-[#004ac6]" />;
            }

            return (
              <div
                key={app.id}
                className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm flex items-center justify-between"
              >
                <div className="flex items-center h-full flex-1">
                  {/* Color strip on the left */}
                  <div className={`w-1.5 self-stretch ${barColor}`} />
                  
                  {/* Main content block */}
                  <div className="p-3.5 space-y-0.5">
                    <h4 className="text-sm font-bold text-slate-800">{app.clientName}</h4>
                    <div className="flex flex-wrap items-center gap-x-1.5 gap-y-0.5 text-[11px] text-slate-500">
                      <span>{app.service}</span>
                      <span>•</span>
                      <span>{app.time}</span>
                      {hasAbsences && (
                        <>
                          <span>•</span>
                          <span className="text-red-600 font-bold flex items-center gap-0.5">
                            ❌ {app.absences} Ausencias
                          </span>
                        </>
                      )}
                    </div>
                    {/* Alerta de bloqueo para reincidente */}
                    {isReincidente && (
                      <div className="text-[10px] bg-red-50 text-red-700 font-bold px-2 py-0.5 rounded border border-red-100 mt-1 inline-flex items-center gap-1 animate-pulse">
                        <AlertTriangle size={10} /> Alerta: Cliente Reincidente (Bloqueado)
                      </div>
                    )}
                  </div>
                </div>

                {/* Interactive visual button on right */}
                <div className="pr-4 pl-2">
                  <div className="w-8 h-8 rounded-full border border-slate-200 flex items-center justify-center bg-slate-50 hover:bg-slate-100 cursor-pointer transition-colors">
                    {iconComponent}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
