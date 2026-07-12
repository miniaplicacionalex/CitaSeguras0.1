import React from "react";
import { Clock } from "lucide-react";
import { ServiceConfig, PaymentConfig } from "../types";

interface ServiceSelectorProps {
  service: string;
  setService: (val: string) => void;
  date: string;
  setDate: (val: string) => void;
  time: string;
  setTime: (val: string) => void;
  amount: number;
  services: ServiceConfig[];
  paymentConfig?: PaymentConfig;
}

export default function ServiceSelector({
  service,
  setService,
  date,
  setDate,
  time,
  setTime,
  amount,
  services,
  paymentConfig,
}: ServiceSelectorProps) {
  // Extract business hours from config, falling back to default values
  const wStart = paymentConfig?.workingHoursStart || "09:00";
  const wEnd = paymentConfig?.workingHoursEnd || "21:00";
  const bStart = paymentConfig?.breakStart || "14:00";
  const bEnd = paymentConfig?.breakEnd || "16:00";

  // Generate the 24 hours list: ["00:00", "01:00", ..., "23:00"]
  const hours = Array.from({ length: 24 }, (_, i) => {
    return i < 10 ? `0${i}:00` : `${i}:00`;
  });

  // Helper to check if hour is during lunch break
  const isBreakTime = (hh: string) => {
    return hh >= bStart && hh < bEnd;
  };

  // Helper to check if hour is outside business working hours
  const isOutsideWorkingHours = (hh: string) => {
    return hh < wStart || hh >= wEnd;
  };

  return (
    <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm space-y-3">
      <h3 className="text-sm font-semibold text-slate-700 pb-2 border-b border-slate-100 flex items-center gap-2">
        <Clock size={16} className="text-[#004ac6]" /> Servicio y Horario
      </h3>

      <div className="space-y-1">
        <label className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider block">
          Servicio Requerido
        </label>
        <select
          value={service}
          onChange={(e) => setService(e.target.value)}
          className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg bg-white focus:outline-none focus:border-[#004ac6] focus:ring-1 focus:ring-[#004ac6] transition-all cursor-pointer text-slate-800"
        >
          {services.map((s) => (
            <option key={s.id} value={s.name}>
              {s.name} - ${s.price} MXN ({s.duration})
            </option>
          ))}
        </select>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1">
          <label className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider block">
            Fecha
          </label>
          <input
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            required
            className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:border-[#004ac6] focus:ring-1 focus:ring-[#004ac6] transition-all bg-white"
          />
        </div>

        <div className="space-y-1">
          <label className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider block">
            Hora de la Cita
          </label>
          <select
            value={time}
            onChange={(e) => setTime(e.target.value)}
            className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg bg-white focus:outline-none focus:border-[#004ac6] focus:ring-1 focus:ring-[#004ac6] transition-all cursor-pointer font-medium text-slate-800"
          >
            {hours.map((hh) => {
              const inBreak = isBreakTime(hh);
              const isOutside = isOutsideWorkingHours(hh);
              const isBlocked = inBreak || isOutside;

              let labelText = `${hh}`;
              let styleObj: React.CSSProperties = {};
              let clsName = "text-slate-800";

              if (inBreak) {
                labelText = `${hh} 🛑 [Hora de Comida - Bloqueado]`;
                styleObj = { color: "#e11d48", fontWeight: "bold", backgroundColor: "#fef2f2" }; // Deep red text
                clsName = "text-rose-600 font-bold bg-rose-50";
              } else if (isOutside) {
                labelText = `${hh} 🚫 [Fuera de Horas Labores]`;
                styleObj = { color: "#94a3b8", textDecoration: "line-through" }; // Light slate gray text
                clsName = "text-slate-400 line-through";
              } else {
                labelText = `${hh} 🟢 [Disponible]`;
                styleObj = { color: "#059669" }; // Emerald-600
                clsName = "text-emerald-600 font-medium";
              }

              return (
                <option
                  key={hh}
                  value={hh}
                  disabled={isBlocked}
                  style={styleObj}
                  className={clsName}
                >
                  {labelText}
                </option>
              );
            })}
          </select>
        </div>
      </div>

      <div className="pt-2 flex items-center justify-between text-sm bg-[#eff4ff] px-3 py-2 rounded-lg border border-blue-100">
        <span className="font-medium text-slate-700">Monto del Servicio:</span>
        <span className="font-bold text-lg text-[#004ac6]">${amount} MXN</span>
      </div>
    </div>
  );
}
