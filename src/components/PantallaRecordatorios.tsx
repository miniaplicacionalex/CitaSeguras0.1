import { useState } from "react";
import { 
  MessageSquare, 
  Send, 
  Clock, 
  CheckCircle, 
  AlertTriangle, 
  Check,
  Search,
  ExternalLink
} from "lucide-react";
import { Appointment, PaymentConfig } from "../types";

interface PantallaRecordatoriosProps {
  appointments: Appointment[];
  onSuccessToast: (msg: string) => void;
  paymentConfig?: PaymentConfig;
}

export default function PantallaRecordatorios({ appointments, onSuccessToast, paymentConfig }: PantallaRecordatoriosProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedApp, setSelectedApp] = useState<Appointment | null>(null);
  const [customMessage, setCustomMessage] = useState("");
  const [isSentId, setIsSentId] = useState<string[]>([]);
  const [activeMessageType, setActiveMessageType] = useState<"pending" | "confirmed" | "8h" | "2h">("confirmed");

  const filteredAppointments = appointments.filter((app) =>
    app.clientName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    app.service.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getMessageForType = (type: "pending" | "confirmed" | "8h" | "2h", app: Appointment) => {
    let template = "";
    if (type === "pending") {
      template = paymentConfig?.whatsappTemplatePending || 
        "Hola {nombre_cliente}, detectamos tu pago como pendiente. Por favor confírmanos si ya realizaste tu depósito/transferencia para verificarlo por IA de CitaSeguras y activar tu cita de {servicio}. ¡Gracias!";
    } else if (type === "confirmed") {
      template = paymentConfig?.whatsappTemplateConfirmed || 
        "¡Hola {nombre_cliente}! Tu cita para {servicio} está confirmada para el día {fecha} a las {hora}. Te recordamos asistir puntualmente. ¡Te esperamos!";
    } else if (type === "8h") {
      template = paymentConfig?.whatsappTemplate8h || 
        "¡Hola {nombre_cliente}! Te recordamos que tu cita para {servicio} es hoy mismo en 8 horas (a las {hora}). Por favor confírmanos que asistirás respondiendo con un 'OK' o un emoticón. ¡Gracias!";
    } else if (type === "2h") {
      template = paymentConfig?.whatsappTemplate2h || 
        "⚠️ ¡Hola {nombre_cliente}! Recordatorio rápido de que tu cita para {servicio} comienza en 2 horas (a las {hora}). Agradecemos tu puntualidad. ¡Te vemos pronto!";
    }

    return template
      .replace(/{nombre_cliente}/g, app.clientName)
      .replace(/{servicio}/g, app.service)
      .replace(/{fecha}/g, app.date)
      .replace(/{hora}/g, app.time)
      .replace(/{monto}/g, String(app.amount));
  };

  // Opens modal with draft message based on payment status
  const handleSelectAppointment = (app: Appointment) => {
    setSelectedApp(app);
    const initialType = app.paymentStatus === "Por Verificar" ? "pending" : "confirmed";
    setActiveMessageType(initialType);
    setCustomMessage(getMessageForType(initialType, app));
  };

  // Trigger real WhatsApp URL
  const handleSendWhatsApp = () => {
    if (!selectedApp) return;
    
    // Format: https://wa.me/PHONE?text=MESSAGE
    // Let's clean the phone number to be safe (digits only, prefix country code if missing)
    let cleanPhone = selectedApp.phone.replace(/\D/g, "");
    if (cleanPhone.length === 10) {
      cleanPhone = "52" + cleanPhone; // Mexico default
    }

    const encodedMessage = encodeURIComponent(customMessage);
    const whatsappUrl = `https://wa.me/${cleanPhone}?text=${encodedMessage}`;
    
    window.open(whatsappUrl, "_blank");
    onSuccessToast(`Recordatorio enviado a ${selectedApp.clientName}`);
    setIsSentId((prev) => [...prev, selectedApp.id]);
    setSelectedApp(null);
  };

  return (
    <div id="pantalla-recordatorios" className="p-4 max-w-md mx-auto space-y-4">
      <div>
        <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
          <MessageSquare className="text-[#004ac6]" size={22} /> Envió de Recordatorios
        </h2>
        <p className="text-xs text-slate-500">
          Envía notificaciones dinámicas de validación y confirmación por WhatsApp en un solo clic.
        </p>
      </div>

      {/* Search Input */}
      <div className="relative">
        <input
          type="text"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          placeholder="Buscar cliente para notificar..."
          className="w-full pl-9 pr-4 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:border-[#004ac6] focus:ring-1 focus:ring-[#004ac6] transition-all bg-white"
        />
        <Search size={16} className="text-slate-400 absolute left-3 top-2.5" />
      </div>

      {/* List of Clients for Reminders */}
      <div className="space-y-2 max-h-[65vh] overflow-y-auto pr-1 pb-10">
        {filteredAppointments.length === 0 ? (
          <div className="bg-white border border-slate-200 rounded-xl p-8 text-center space-y-2 shadow-sm">
            <MessageSquare size={32} className="text-slate-300 mx-auto" />
            <p className="text-sm font-semibold text-slate-600">No hay clientes por notificar</p>
          </div>
        ) : (
          filteredAppointments.map((app) => {
            const isOxxoPending = app.paymentStatus === "Por Verificar";
            const alreadySent = isSentId.includes(app.id);

            return (
              <div
                key={app.id}
                className="bg-white border border-slate-200 rounded-xl p-3.5 shadow-sm space-y-3 flex flex-col hover:border-blue-300 transition-all"
              >
                <div className="flex justify-between items-start">
                  <div className="space-y-0.5">
                    <h4 className="text-sm font-bold text-slate-900">{app.clientName}</h4>
                    <p className="text-xs text-slate-500 font-medium">
                      {app.service} • {app.time}
                    </p>
                  </div>
                  <span
                    className={`text-[9px] font-bold uppercase px-2 py-0.5 rounded border ${
                      isOxxoPending
                        ? "bg-amber-50 text-amber-700 border-amber-100"
                        : "bg-emerald-50 text-emerald-700 border-emerald-100"
                    }`}
                  >
                    {isOxxoPending ? "Pendiente OXXO" : "Aprobado"}
                  </span>
                </div>

                {/* WhatsApp Action Button */}
                <button
                  onClick={() => handleSelectAppointment(app)}
                  className={`w-full py-2.5 px-4 text-xs font-bold rounded-lg transition-all flex items-center justify-center gap-1.5 shadow-sm ${
                    alreadySent
                      ? "bg-slate-100 hover:bg-slate-200 text-slate-600 border border-slate-200"
                      : "bg-[#004ac6] hover:bg-[#0049be] text-white"
                  }`}
                >
                  {alreadySent ? (
                    <>
                      <Check size={14} className="text-emerald-600" /> Recordatorio Enviado
                    </>
                  ) : isOxxoPending ? (
                    <>
                      <Clock size={14} /> ⏳ Enviar Validación OXXO
                    </>
                  ) : (
                    <>
                      <Send size={14} /> 📱 Enviar Recordatorio Activo
                    </>
                  )}
                </button>
              </div>
            );
          })
        )}
      </div>

      {/* WhatsApp Message Composer Modal */}
      {selectedApp && (
        <div className="fixed inset-0 bg-slate-900/60 flex items-end sm:items-center justify-center p-4 z-50 animate-fade-in">
          <div className="bg-white w-full max-w-sm rounded-t-2xl sm:rounded-2xl p-4 shadow-xl space-y-4 border border-slate-100 animate-slide-up">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <h3 className="text-sm font-bold text-slate-800 flex items-center gap-1.5">
                <MessageSquare size={16} className="text-blue-600" /> Borrador de Recordatorio
              </h3>
              <button
                onClick={() => setSelectedApp(null)}
                className="text-slate-400 hover:text-slate-600 text-sm font-bold px-1"
              >
                ✕
              </button>
            </div>

            <div className="space-y-1.5">
              <p className="text-[10px] text-slate-400 uppercase font-semibold">Cliente Destinatario</p>
              <div className="flex justify-between items-center bg-slate-50 p-2 rounded-lg border border-slate-100 text-xs">
                <span className="font-bold text-slate-800">{selectedApp.clientName}</span>
                <span className="text-slate-500 font-medium">{selectedApp.phone}</span>
              </div>
            </div>

             <div className="space-y-1.5">
              <p className="text-[10px] text-slate-400 uppercase font-semibold">Seleccionar Tipo de Recordatorio</p>
              <div className={`grid gap-1.5 ${selectedApp.paymentStatus === "Por Verificar" ? "grid-cols-4" : "grid-cols-3"}`}>
                {selectedApp.paymentStatus === "Por Verificar" && (
                  <button
                    type="button"
                    onClick={() => {
                      setActiveMessageType("pending");
                      setCustomMessage(getMessageForType("pending", selectedApp));
                    }}
                    className={`py-2 px-1 rounded-xl text-[9px] font-bold text-center border transition-all cursor-pointer ${
                      activeMessageType === "pending"
                        ? "bg-amber-600 border-amber-600 text-white shadow-sm"
                        : "bg-slate-50 hover:bg-slate-100 text-slate-700 border-slate-200"
                    }`}
                  >
                    ⏳ OXXO
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => {
                    setActiveMessageType("confirmed");
                    setCustomMessage(getMessageForType("confirmed", selectedApp));
                  }}
                  className={`py-2 px-1 rounded-xl text-[9px] font-bold text-center border transition-all cursor-pointer ${
                    activeMessageType === "confirmed"
                      ? "bg-[#004ac6] border-[#004ac6] text-white shadow-sm"
                      : "bg-slate-50 hover:bg-slate-100 text-slate-700 border-slate-200"
                  }`}
                >
                  ✅ Inicial
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setActiveMessageType("8h");
                    setCustomMessage(getMessageForType("8h", selectedApp));
                  }}
                  className={`py-2 px-1 rounded-xl text-[9px] font-bold text-center border transition-all cursor-pointer ${
                    activeMessageType === "8h"
                      ? "bg-emerald-600 border-emerald-600 text-white shadow-sm"
                      : "bg-slate-50 hover:bg-slate-100 text-slate-700 border-slate-200"
                  }`}
                >
                  🕒 8 hrs
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setActiveMessageType("2h");
                    setCustomMessage(getMessageForType("2h", selectedApp));
                  }}
                  className={`py-2 px-1 rounded-xl text-[9px] font-bold text-center border transition-all cursor-pointer ${
                    activeMessageType === "2h"
                      ? "bg-orange-600 border-orange-600 text-white shadow-sm"
                      : "bg-slate-50 hover:bg-slate-100 text-slate-700 border-slate-200"
                  }`}
                >
                  ⚡ 2 hrs
                </button>
              </div>
            </div>

            <div className="space-y-1.5">
              <p className="text-[10px] text-slate-400 uppercase font-semibold">Mensaje de WhatsApp</p>
              <textarea
                value={customMessage}
                onChange={(e) => setCustomMessage(e.target.value)}
                rows={5}
                className="w-full p-2.5 text-xs border border-slate-200 rounded-lg focus:outline-none focus:border-[#004ac6] focus:ring-1 focus:ring-[#004ac6] transition-all leading-relaxed bg-slate-50"
              />
            </div>

            <div className="bg-blue-50 border border-blue-100 p-2.5 rounded-lg text-[10px] text-blue-800 flex items-center gap-1.5">
              <CheckCircle size={14} className="text-blue-600 flex-shrink-0" />
              <span>El botón abrirá WhatsApp Web/Móvil con el mensaje ya cargado.</span>
            </div>

            {/* Modal Actions */}
            <div className="flex gap-2">
              <button
                onClick={() => setSelectedApp(null)}
                className="flex-1 bg-white border border-slate-200 hover:bg-slate-50 text-slate-600 font-semibold py-2 rounded-lg text-xs"
              >
                Cancelar
              </button>
              <button
                onClick={handleSendWhatsApp}
                className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-2 rounded-lg text-xs flex items-center justify-center gap-1 shadow-md"
              >
                Abrir WhatsApp <ExternalLink size={12} />
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
