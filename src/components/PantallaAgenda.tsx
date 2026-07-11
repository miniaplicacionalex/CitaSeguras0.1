import React, { useState } from "react";
import { 
  Calendar, 
  Search, 
  SlidersHorizontal 
} from "lucide-react";
import { Appointment } from "../types";
import AppointmentCard from "./AppointmentCard";
import CalendarioAgenda from "./CalendarioAgenda";

interface PantallaAgendaProps {
  appointments: Appointment[];
  approveAppointmentPayment: (id: string) => void;
  rejectAppointmentPayment: (id: string) => void;
  onSuccessToast: (msg: string) => void;
  isWorkspaceConnected: boolean;
}

export default function PantallaAgenda({
  appointments,
  approveAppointmentPayment,
  rejectAppointmentPayment,
  onSuccessToast,
  isWorkspaceConnected,
}: PantallaAgendaProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedAppointmentId, setSelectedAppointmentId] = useState<string | null>(null);
  const [activeFilter, setActiveFilter] = useState<"todos" | "confirmado" | "por_verificar">("todos");

  // Filter and search logic
  const filteredAppointments = appointments.filter((app) => {
    const matchesSearch =
      app.clientName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      app.service.toLowerCase().includes(searchTerm.toLowerCase());

    if (activeFilter === "todos") return matchesSearch;
    if (activeFilter === "confirmado") return matchesSearch && app.paymentStatus === "Confirmado";
    if (activeFilter === "por_verificar") return matchesSearch && app.paymentStatus === "Por Verificar";
    return matchesSearch;
  });

  return (
    <div id="pantalla-agenda" className="p-4 max-w-md mx-auto space-y-4">
      {/* Title & Stats */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
            <Calendar className="text-[#004ac6]" size={22} /> Agenda del Día
          </h2>
          <p className="text-xs text-slate-500">
            {new Date().toLocaleDateString("es-MX", {
              weekday: "long",
              year: "numeric",
              month: "long",
              day: "numeric",
            })}
          </p>
        </div>
        <span className="text-xs font-semibold px-2.5 py-1 bg-[#eff4ff] text-[#004ac6] rounded-full border border-blue-100">
          {filteredAppointments.length} Citas
        </span>
      </div>

      {/* Search and Filters */}
      <div className="space-y-2">
        <div className="relative">
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Buscar por cliente o servicio..."
            className="w-full pl-9 pr-8 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:border-[#004ac6] focus:ring-1 focus:ring-[#004ac6] transition-all bg-white"
          />
          <Search size={16} className="text-slate-400 absolute left-3 top-2.5" />
          <SlidersHorizontal size={16} className="text-slate-400 absolute right-3 top-2.5 cursor-pointer hover:text-[#004ac6] transition-colors" />
        </div>

        {/* Filter chips */}
        <div className="flex gap-2">
          <button
            onClick={() => setActiveFilter("todos")}
            className={`text-xs px-3 py-1.5 rounded-lg border font-medium transition-all cursor-pointer ${
              activeFilter === "todos"
                ? "bg-[#004ac6] text-white border-[#004ac6] shadow-sm"
                : "bg-white text-slate-600 border-slate-200 hover:bg-slate-50"
            }`}
          >
            Todos
          </button>
          <button
            onClick={() => setActiveFilter("confirmado")}
            className={`text-xs px-3 py-1.5 rounded-lg border font-medium transition-all cursor-pointer ${
              activeFilter === "confirmado"
                ? "bg-emerald-600 text-white border-emerald-600 shadow-sm"
                : "bg-white text-slate-600 border-slate-200 hover:bg-slate-50"
            }`}
          >
            Confirmados
          </button>
          <button
            onClick={() => setActiveFilter("por_verificar")}
            className={`text-xs px-3 py-1.5 rounded-lg border font-medium transition-all cursor-pointer ${
              activeFilter === "por_verificar"
                ? "bg-amber-500 text-white border-amber-500 shadow-sm"
                : "bg-white text-slate-600 border-slate-200 hover:bg-slate-50"
            }`}
          >
            Por Verificar
          </button>
        </div>
      </div>

      {/* Appointment List with Scroll */}
      <div className="space-y-2.5 max-h-[60vh] overflow-y-auto pr-1 pb-10">
        {filteredAppointments.length === 0 ? (
          <div className="bg-white border border-slate-200 rounded-xl p-8 text-center space-y-2 shadow-sm">
            <Calendar size={32} className="text-slate-300 mx-auto" />
            <p className="text-sm font-semibold text-slate-600">No se encontraron citas</p>
            <p className="text-xs text-slate-400">Intenta buscar otro nombre o cambia de filtro.</p>
          </div>
        ) : (
          filteredAppointments.map((app) => (
            <AppointmentCard
              key={app.id}
              app={app}
              isSelected={selectedAppointmentId === app.id}
              onToggleSelect={() => setSelectedAppointmentId(selectedAppointmentId === app.id ? null : app.id)}
              approveAppointmentPayment={approveAppointmentPayment}
              rejectAppointmentPayment={rejectAppointmentPayment}
              onSuccessToast={onSuccessToast}
              isWorkspaceConnected={isWorkspaceConnected}
            />
          ))
        )}
      </div>

      {/* Calendar view with scheduled, pending and rescheduled appointments */}
      <CalendarioAgenda 
        appointments={appointments} 
        onSuccessToast={onSuccessToast} 
      />
    </div>
  );
}
