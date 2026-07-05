import { Clock } from "lucide-react";
import { ServiceConfig } from "../types";

interface ServiceSelectorProps {
  service: string;
  setService: (val: string) => void;
  date: string;
  setDate: (val: string) => void;
  time: string;
  setTime: (val: string) => void;
  amount: number;
  services: ServiceConfig[];
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
}: ServiceSelectorProps) {
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
            Hora
          </label>
          <select
            value={time}
            onChange={(e) => setTime(e.target.value)}
            className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg bg-white focus:outline-none focus:border-[#004ac6] focus:ring-1 focus:ring-[#004ac6] transition-all cursor-pointer"
          >
            <option value="09:00 AM">09:00 AM</option>
            <option value="10:30 AM">10:30 AM</option>
            <option value="11:00 AM">11:00 AM</option>
            <option value="12:00 PM">12:00 PM</option>
            <option value="02:15 PM">02:15 PM</option>
            <option value="04:00 PM">04:00 PM</option>
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
