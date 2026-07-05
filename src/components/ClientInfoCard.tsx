import { User as UserIcon, Phone, Mail } from "lucide-react";

interface ClientInfoCardProps {
  clientName: string;
  setClientName: (val: string) => void;
  phone: string;
  setPhone: (val: string) => void;
  email: string;
  setEmail: (val: string) => void;
}

export default function ClientInfoCard({
  clientName,
  setClientName,
  phone,
  setPhone,
  email,
  setEmail,
}: ClientInfoCardProps) {
  return (
    <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm space-y-3">
      <h3 className="text-sm font-semibold text-slate-700 pb-2 border-b border-slate-100 flex items-center gap-2">
        <UserIcon size={16} className="text-[#004ac6]" /> Datos del Cliente
      </h3>

      <div className="space-y-1">
        <label className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider block">
          Nombre Completo
        </label>
        <div className="relative">
          <input
            type="text"
            value={clientName}
            onChange={(e) => setClientName(e.target.value)}
            required
            placeholder="Ej. Benjamin Miller"
            className="w-full pl-9 pr-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:border-[#004ac6] focus:ring-1 focus:ring-[#004ac6] transition-all bg-white"
          />
          <UserIcon size={14} className="text-slate-400 absolute left-3 top-3" />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1">
          <label className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider block">
            Teléfono / WhatsApp
          </label>
          <div className="relative">
            <input
              type="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              required
              placeholder="Ej. 5512345678"
              className="w-full pl-9 pr-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:border-[#004ac6] focus:ring-1 focus:ring-[#004ac6] transition-all bg-white"
            />
            <Phone size={14} className="text-slate-400 absolute left-3 top-3" />
          </div>
        </div>

        <div className="space-y-1">
          <label className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider block">
            Correo Electrónico
          </label>
          <div className="relative">
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              placeholder="Ej. cliente@correo.com"
              className="w-full pl-9 pr-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:border-[#004ac6] focus:ring-1 focus:ring-[#004ac6] transition-all bg-white"
            />
            <Mail size={14} className="text-slate-400 absolute left-3 top-3" />
          </div>
        </div>
      </div>
    </div>
  );
}
