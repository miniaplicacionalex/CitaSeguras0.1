import React, { useState, useEffect } from "react";
import { 
  Store, 
  Trash2, 
  Plus, 
  Save, 
  Database, 
  ToggleRight, 
  ToggleLeft, 
  Download, 
  RefreshCw, 
  CreditCard, 
  Landmark, 
  User as UserIcon, 
  Link as LinkIcon, 
  AlertTriangle,
  FileSpreadsheet,
  Sparkles,
  Clock,
  ExternalLink,
  Check,
  Copy,
  Share2
} from "lucide-react";
import { ServiceConfig, PaymentConfig, Appointment } from "../types";
import { User } from "firebase/auth";

interface PantallaNegocioProps {
  user: User | null;
  accessToken: string | null;
  appointments: Appointment[];
  services: ServiceConfig[];
  onSaveServices: (newServices: ServiceConfig[]) => void;
  paymentConfig: PaymentConfig;
  onSavePaymentConfig: (config: PaymentConfig) => void;
  triggerCleanup: () => void;
  triggerMonthlyReportEmail: () => Promise<boolean>;
  onSuccessToast: (msg: string) => void;
}

export default function PantallaNegocio({
  user,
  accessToken,
  appointments,
  services,
  onSaveServices,
  paymentConfig,
  onSavePaymentConfig,
  triggerCleanup,
  triggerMonthlyReportEmail,
  onSuccessToast,
}: PantallaNegocioProps) {
  // Local service editing state
  const [localServices, setLocalServices] = useState<ServiceConfig[]>([]);
  
  // Local payment config state
  const [cardOrSpei, setCardOrSpei] = useState(paymentConfig.cardOrSpei || "");
  const [bankName, setBankName] = useState(paymentConfig.bankName || "");
  const [accountHolder, setAccountHolder] = useState(paymentConfig.accountHolder || "");
  const [alternativePayLink, setAlternativePayLink] = useState(paymentConfig.alternativePayLink || "");
  const [refundPolicyDisclaimer, setRefundPolicyDisclaimer] = useState(
    paymentConfig.refundPolicyDisclaimer || 
    "⚠️ NOTA DE SEGURIDAD: Para asegurar el espacio de su cita y los insumos requeridos, el depósito del anticipo de reserva no es reembolsable en caso de inasistencia o de no reprogramar con al menos 24 horas de anticipación."
  );

  // Conversion Optimization Toggles
  const [enableUrgencyBadges, setEnableUrgencyBadges] = useState(paymentConfig.enableUrgencyBadges ?? true);
  const [enableReservationTimer, setEnableReservationTimer] = useState(paymentConfig.enableReservationTimer ?? true);
  const [conversionTacticDiscount, setConversionTacticDiscount] = useState(paymentConfig.conversionTacticDiscount || "5% de Descuento Extra si seleccionas pago al 100% como anticipo.");
  
  // Custom WhatsApp Templates
  const [whatsappTemplatePending, setWhatsappTemplatePending] = useState(
    paymentConfig.whatsappTemplatePending || 
    "Hola {nombre_cliente}, detectamos tu pago como pendiente. Por favor confírmanos si ya realizaste tu depósito/transferencia para verificarlo por IA de CitaSeguras y activar tu cita de {servicio}. ¡Gracias!"
  );
  const [whatsappTemplateConfirmed, setWhatsappTemplateConfirmed] = useState(
    paymentConfig.whatsappTemplateConfirmed || 
    "¡Hola {nombre_cliente}! Tu cita para {servicio} está confirmada para el día {fecha} a las {hora}. Te recordamos asistir puntualmente. ¡Te esperamos!"
  );
  const [whatsappTemplate8h, setWhatsappTemplate8h] = useState(
    paymentConfig.whatsappTemplate8h ||
    "¡Hola {nombre_cliente}! Te recordamos que tu cita para {servicio} es hoy mismo en 8 horas (a las {hora}). Por favor confírmanos que asistirás respondiendo con un 'OK' o un emoticón. ¡Gracias!"
  );
  const [whatsappTemplate2h, setWhatsappTemplate2h] = useState(
    paymentConfig.whatsappTemplate2h ||
    "⚠️ ¡Hola {nombre_cliente}! Recordatorio rápido de que tu cita para {servicio} comienza en 2 horas (a las {hora}). Agradecemos tu puntualidad. ¡Te vemos pronto!"
  );
  
  // Link copied state
  const [copied, setCopied] = useState(false);

  // Storage optimization state
  const [isCleanupEnabled, setIsCleanupEnabled] = useState(true);
  const [isCleaning, setIsCleaning] = useState(false);
  const [isSendingReport, setIsSendingReport] = useState(false);

  // Sync state on load/prop updates
  useEffect(() => {
    setLocalServices([...services]);
  }, [services]);

  useEffect(() => {
    setCardOrSpei(paymentConfig.cardOrSpei || "");
    setBankName(paymentConfig.bankName || "");
    setAccountHolder(paymentConfig.accountHolder || "");
    setAlternativePayLink(paymentConfig.alternativePayLink || "");
    if (paymentConfig.refundPolicyDisclaimer) {
      setRefundPolicyDisclaimer(paymentConfig.refundPolicyDisclaimer);
    }
    setEnableUrgencyBadges(paymentConfig.enableUrgencyBadges ?? true);
    setEnableReservationTimer(paymentConfig.enableReservationTimer ?? true);
    setConversionTacticDiscount(paymentConfig.conversionTacticDiscount || "");
    setWhatsappTemplatePending(paymentConfig.whatsappTemplatePending || "Hola {nombre_cliente}, detectamos tu pago como pendiente. Por favor confírmanos si ya realizaste tu depósito/transferencia para verificarlo por IA de CitaSeguras y activar tu cita de {servicio}. ¡Gracias!");
    setWhatsappTemplateConfirmed(paymentConfig.whatsappTemplateConfirmed || "¡Hola {nombre_cliente}! Tu cita para {servicio} está confirmada para el día {fecha} a las {hora}. Te recordamos asistir puntualmente. ¡Te esperamos!");
    setWhatsappTemplate8h(paymentConfig.whatsappTemplate8h || "¡Hola {nombre_cliente}! Te recordamos que tu cita para {servicio} es hoy mismo en 8 horas (a las {hora}). Por favor confírmanos que asistirás respondiendo con un 'OK' o un emoticón. ¡Gracias!");
    setWhatsappTemplate2h(paymentConfig.whatsappTemplate2h || "⚠️ ¡Hola {nombre_cliente}! Recordatorio rápido de que tu cita para {servicio} comienza en 2 horas (a las {hora}). Agradecemos tu puntualidad. ¡Te vemos pronto!");
  }, [paymentConfig]);

  // Handle service field changes
  const handleServiceChange = (index: number, field: keyof ServiceConfig, value: any) => {
    const updated = [...localServices];
    updated[index] = {
      ...updated[index],
      [field]: value
    };
    setLocalServices(updated);
  };

  // Add new service if total count < 10
  const handleAddService = () => {
    if (localServices.length >= 10) {
      alert("Límite alcanzado: Únicamente puedes configurar un máximo de 10 productos o servicios.");
      return;
    }
    const newService: ServiceConfig = {
      id: "srv-" + Math.floor(Math.random() * 10000),
      name: "Nuevo Servicio",
      price: 500,
      duration: "30 min",
      depositPercentage: 50, // Default 50% reservation deposit
    };
    setLocalServices([...localServices, newService]);
  };

  // Delete a service
  const handleDeleteService = (index: number) => {
    const updated = localServices.filter((_, i) => i !== index);
    setLocalServices(updated);
  };

  // Save services
  const handleSaveServices = () => {
    // Basic validation
    const hasEmptyName = localServices.some((s) => !s.name.trim());
    if (hasEmptyName) {
      alert("Por favor, asegúrate de que todos los servicios tengan un nombre válido.");
      return;
    }
    onSaveServices(localServices);
    onSuccessToast("¡Servicios y porcentajes de reserva actualizados correctamente!");
  };

  // Save payment config
  const handleSavePaymentConfig = () => {
    onSavePaymentConfig({
      cardOrSpei,
      bankName,
      accountHolder,
      alternativePayLink,
      refundPolicyDisclaimer,
      enableUrgencyBadges,
      enableReservationTimer,
      conversionTacticDiscount,
      whatsappTemplatePending,
      whatsappTemplateConfirmed,
      whatsappTemplate8h,
      whatsappTemplate2h,
    });
    onSuccessToast("¡Métodos de recepción de pagos y política de reembolso guardados!");
  };

  // Download local CSV
  const downloadReportLocally = () => {
    let csvContent = "data:text/csv;charset=utf-8,";
    csvContent += "ID,Cliente,Telefono,Correo,Servicio,Fecha,Hora,Monto,Metodo Pago,Estado Pago,Inasistencias\n";
    
    appointments.forEach((app) => {
      csvContent += `${app.id},${app.clientName},${app.phone},${app.email},${app.service},${app.date},${app.time},${app.amount},${app.paymentMethod},${app.paymentStatus},${app.absences}\n`;
    });

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `Reporte_Asistencia_CitaSeguras.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    onSuccessToast("¡Reporte de asistencia descargado localmente!");
  };

  const handleDownloadReport = async () => {
    setIsSendingReport(true);
    try {
      if (accessToken && user?.email) {
        const success = await triggerMonthlyReportEmail();
        if (success) {
          onSuccessToast(`¡Reporte de Excel/CSV enviado con éxito a tu Gmail (${user.email})!`);
        } else {
          downloadReportLocally();
        }
      } else {
        downloadReportLocally();
      }
    } catch (err) {
      console.error(err);
      downloadReportLocally();
    } finally {
      setIsSendingReport(false);
    }
  };

  const handleForceCleanup = () => {
    setIsCleaning(true);
    setTimeout(() => {
      triggerCleanup();
      onSuccessToast("🧹 Depuración exitosa: se eliminaron registros con antigüedad mayor a 30 días.");
      setIsCleaning(false);
    }, 1500);
  };

  return (
    <div id="pantalla-negocio" className="p-4 max-w-md mx-auto space-y-6">
      <div className="flex flex-col gap-1">
        <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
          <Store className="text-[#004ac6]" size={22} /> Perfil del Negocio
        </h2>
        <p className="text-xs text-slate-500">
          Personaliza los servicios de tu negocio, los anticipos requeridos y los métodos de pago.
        </p>
      </div>

      {/* 1. PRODUCTOS Y SERVICIOS CONFIG */}
      <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-sm space-y-4">
        <div className="flex justify-between items-center border-b border-slate-100 pb-2">
          <div>
            <h3 className="text-sm font-bold text-slate-800">
              Servicios y Anticipos ({localServices.length}/10)
            </h3>
            <p className="text-[10px] text-slate-400 mt-0.5">
              Define los costos y el % de anticipo para reservar cada servicio.
            </p>
          </div>
          <button
            type="button"
            onClick={handleAddService}
            disabled={localServices.length >= 10}
            className="p-1.5 rounded-full bg-blue-50 text-[#004ac6] hover:bg-blue-100 disabled:opacity-50 transition-colors cursor-pointer"
            title="Agregar nuevo servicio"
          >
            <Plus size={16} />
          </button>
        </div>

        <div className="space-y-3 max-h-[300px] overflow-y-auto pr-1">
          {localServices.length === 0 ? (
            <p className="text-xs text-slate-400 text-center py-4">No hay servicios configurados. Agrega uno nuevo.</p>
          ) : (
            localServices.map((srv, index) => (
              <div 
                key={srv.id} 
                className="p-3 bg-slate-50 rounded-xl border border-slate-100 space-y-2 relative group"
              >
                <div className="flex items-center gap-2">
                  <span className="text-[10px] bg-slate-200 text-slate-600 font-bold px-1.5 py-0.5 rounded">
                    #{index + 1}
                  </span>
                  <input
                    type="text"
                    value={srv.name}
                    onChange={(e) => handleServiceChange(index, "name", e.target.value)}
                    placeholder="Nombre del servicio"
                    className="flex-1 bg-transparent border-b border-slate-200 focus:border-[#004ac6] text-xs font-bold text-slate-800 focus:outline-none py-0.5"
                  />
                  <button
                    type="button"
                    onClick={() => handleDeleteService(index)}
                    className="text-slate-400 hover:text-red-500 transition-colors p-1"
                    title="Eliminar servicio"
                  >
                    <Trash2 size={13} />
                  </button>
                </div>

                <div className="grid grid-cols-3 gap-2 text-xs">
                  <div>
                    <label className="text-[9px] font-bold text-slate-400 uppercase tracking-wider block">
                      Costo (MXN)
                    </label>
                    <input
                      type="number"
                      value={srv.price}
                      onChange={(e) => handleServiceChange(index, "price", parseFloat(e.target.value) || 0)}
                      className="w-full bg-white border border-slate-200 rounded px-2 py-1 focus:outline-none focus:border-[#004ac6] text-xs font-semibold"
                    />
                  </div>

                  <div>
                    <label className="text-[9px] font-bold text-slate-400 uppercase tracking-wider block">
                      Duración
                    </label>
                    <input
                      type="text"
                      value={srv.duration}
                      onChange={(e) => handleServiceChange(index, "duration", e.target.value)}
                      placeholder="Ej. 45 min"
                      className="w-full bg-white border border-slate-200 rounded px-2 py-1 focus:outline-none focus:border-[#004ac6] text-xs font-semibold"
                    />
                  </div>

                  <div>
                    <label className="text-[9px] font-bold text-slate-400 uppercase tracking-wider block">
                      % de Anticipo
                    </label>
                    <select
                      value={srv.depositPercentage}
                      onChange={(e) => handleServiceChange(index, "depositPercentage", parseInt(e.target.value) || 100)}
                      className="w-full bg-white border border-slate-200 rounded px-1.5 py-1 focus:outline-none focus:border-[#004ac6] text-xs font-semibold"
                    >
                      <option value={10}>10%</option>
                      <option value={20}>20%</option>
                      <option value={30}>30%</option>
                      <option value={50}>50%</option>
                      <option value={75}>75%</option>
                      <option value={100}>100% (Total)</option>
                    </select>
                  </div>
                </div>

                {/* Info bubble for advance calculation */}
                <div className="text-[9px] text-[#004ac6] bg-blue-50/50 p-1 rounded border border-blue-100/50 flex justify-between">
                  <span>Anticipo requerido para cita:</span>
                  <span className="font-bold">
                    ${Math.round((srv.price * (srv.depositPercentage / 100)))} MXN ({srv.depositPercentage}%)
                  </span>
                </div>
              </div>
            ))
          )}
        </div>

        <button
          type="button"
          onClick={handleSaveServices}
          className="w-full bg-[#004ac6] hover:bg-[#0049be] text-white font-bold py-2.5 px-4 rounded-xl text-xs transition-all shadow flex items-center justify-center gap-1.5 cursor-pointer"
        >
          <Save size={13} /> Guardar Lista de Servicios
        </button>
      </div>

      {/* 2. RECEPCIÓN DE PAGOS & POLÍTICA DE REEMBOLSO */}
      <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-sm space-y-4">
        <div>
          <h3 className="text-sm font-bold text-slate-800 flex items-center gap-2">
            <CreditCard size={16} className="text-[#004ac6]" /> Datos de Referencia para SPEI / Depósitos
          </h3>
          <p className="text-[10px] text-slate-400 mt-0.5">
            Configura los datos de tu cuenta bancaria. Los clientes verán esta información exacta como referencia para hacer sus transferencias (SPEI) o depósitos, y luego subirán su comprobante de pago.
          </p>
        </div>

        <div className="space-y-3">
          <div className="space-y-1">
            <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1">
              <CreditCard size={12} className="text-slate-400" /> CLABE Interbancaria / Número de Cuenta (Referencia SPEI)
            </label>
            <input
              type="text"
              value={cardOrSpei}
              onChange={(e) => setCardOrSpei(e.target.value)}
              placeholder="Ej. 1234 5678 9012 3456"
              className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg bg-white focus:outline-none focus:border-[#004ac6] focus:ring-1 focus:ring-[#004ac6]"
            />
          </div>

          <div className="space-y-1">
            <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1">
              <Landmark size={12} className="text-slate-400" /> Nombre del Banco
            </label>
            <input
              type="text"
              value={bankName}
              onChange={(e) => setBankName(e.target.value)}
              placeholder="Ej. BBVA, Santander, Banorte"
              className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg bg-white focus:outline-none focus:border-[#004ac6] focus:ring-1 focus:ring-[#004ac6]"
            />
          </div>

          <div className="space-y-1">
            <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1">
              <UserIcon size={12} className="text-slate-400" /> Titular de la Cuenta
            </label>
            <input
              type="text"
              value={accountHolder}
              onChange={(e) => setAccountHolder(e.target.value)}
              placeholder="Ej. Consultorio Dental S.A."
              className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg bg-white focus:outline-none focus:border-[#004ac6] focus:ring-1 focus:ring-[#004ac6]"
            />
          </div>

          <div className="space-y-1">
            <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1">
              <LinkIcon size={12} className="text-slate-400" /> Enlace de Pago Alternativo (Opcional)
            </label>
            <input
              type="url"
              value={alternativePayLink}
              onChange={(e) => setAlternativePayLink(e.target.value)}
              placeholder="Ej. https://link.mercadopago.com.mx/..."
              className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg bg-white focus:outline-none focus:border-[#004ac6] focus:ring-1 focus:ring-[#004ac6]"
            />
          </div>

          <div className="space-y-1">
            <label className="text-[10px] font-bold text-rose-600 uppercase tracking-wider flex items-center gap-1">
              <AlertTriangle size={12} className="text-rose-500" /> Política de Reembolso por No Asistir
            </label>
            <textarea
              rows={3}
              value={refundPolicyDisclaimer}
              onChange={(e) => setRefundPolicyDisclaimer(e.target.value)}
              placeholder="Texto legal de advertencia sobre la no asistencia o cambios de última hora."
              className="w-full p-2.5 text-xs border border-slate-200 rounded-lg bg-white focus:outline-none focus:border-rose-500 focus:ring-1 focus:ring-rose-500 text-slate-700 leading-relaxed"
            />
            <p className="text-[9px] text-slate-400 italic">
              Este descargo se mostrará directamente al cliente en su ficha de instrucciones de depósito.
            </p>
          </div>

          <button
            type="button"
            onClick={handleSavePaymentConfig}
            className="w-full bg-[#004ac6] hover:bg-[#0049be] text-white font-bold py-2.5 px-4 rounded-xl text-xs transition-all shadow flex items-center justify-center gap-1.5 cursor-pointer"
          >
            <Save size={13} /> Guardar Datos y Políticas de Pago
          </button>
        </div>
      </div>

      {/* 2B. PLANTILLAS DE RECORDATORIOS WHATSAPP (100% GRATUITAS) */}
      <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-sm space-y-4">
        <div>
          <h3 className="text-sm font-bold text-slate-800 flex items-center gap-1.5">
            <span className="text-emerald-500 text-lg">💬</span>
            Plantillas de Recordatorios WhatsApp (Gratuito)
          </h3>
          <p className="text-[10px] text-slate-400 mt-0.5">
            Personaliza los mensajes pre-diseñados que envías a tus clientes. Usamos enlaces directos de WhatsApp para que sea 100% gratuito sin costos de APIs.
          </p>
        </div>

        <div className="space-y-4">
          <div className="bg-emerald-50 border border-emerald-100 p-3 rounded-xl space-y-1.5">
            <p className="text-[10px] font-bold text-emerald-800 uppercase tracking-wide flex items-center gap-1">
              💡 Guía de Variables para Automatizar
            </p>
            <p className="text-[10px] text-emerald-700 leading-relaxed">
              Puedes escribir las siguientes etiquetas en tus mensajes para que el sistema las reemplace automáticamente por la información del cliente antes de enviar:
            </p>
            <div className="grid grid-cols-2 gap-1.5 text-[9px] font-mono text-emerald-950 pt-1">
              <div><strong className="text-emerald-800">{`{nombre_cliente}`}</strong>: Nombre del cliente</div>
              <div><strong className="text-emerald-800">{`{servicio}`}</strong>: Nombre del servicio</div>
              <div><strong className="text-emerald-800">{`{fecha}`}</strong>: Fecha de la cita</div>
              <div><strong className="text-emerald-800">{`{hora}`}</strong>: Hora acordada</div>
              <div><strong className="text-emerald-800">{`{monto}`}</strong>: Costo total o anticipo</div>
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">
              Mensaje 1: Pago Pendiente por Validar (OXXO/SPEI)
            </label>
            <textarea
              rows={3}
              value={whatsappTemplatePending}
              onChange={(e) => setWhatsappTemplatePending(e.target.value)}
              placeholder="Mensaje para solicitar el comprobante al cliente..."
              className="w-full p-2.5 text-xs border border-slate-200 rounded-lg bg-white focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 text-slate-700 leading-relaxed"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">
              Mensaje 2: Confirmación de Cita Activa (Inicial)
            </label>
            <textarea
              rows={3}
              value={whatsappTemplateConfirmed}
              onChange={(e) => setWhatsappTemplateConfirmed(e.target.value)}
              placeholder="Mensaje para confirmar la fecha y hora de la cita..."
              className="w-full p-2.5 text-xs border border-slate-200 rounded-lg bg-white focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 text-slate-700 leading-relaxed"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">
              Mensaje 3: Recordatorio Intermedio (8 Horas Antes)
            </label>
            <textarea
              rows={3}
              value={whatsappTemplate8h}
              onChange={(e) => setWhatsappTemplate8h(e.target.value)}
              placeholder="Mensaje para recordar la cita 8 horas antes..."
              className="w-full p-2.5 text-xs border border-slate-200 rounded-lg bg-white focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 text-slate-700 leading-relaxed"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">
              Mensaje 4: Recordatorio Inmediato (2 Horas Antes)
            </label>
            <textarea
              rows={3}
              value={whatsappTemplate2h}
              onChange={(e) => setWhatsappTemplate2h(e.target.value)}
              placeholder="Mensaje para recordar la cita 2 horas antes..."
              className="w-full p-2.5 text-xs border border-slate-200 rounded-lg bg-white focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 text-slate-700 leading-relaxed"
            />
          </div>

          <button
            type="button"
            onClick={handleSavePaymentConfig}
            className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-2.5 px-4 rounded-xl text-xs transition-all shadow flex items-center justify-center gap-1.5 cursor-pointer"
          >
            <Save size={13} /> Guardar Plantillas de WhatsApp
          </button>
        </div>
      </div>

      {/* 3. PORTAL DE AUTORESERVACIÓN Y CONVERSIÓN */}
      <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-sm space-y-4">
        <div>
          <h3 className="text-sm font-bold text-slate-800 flex items-center gap-1.5">
            <Sparkles size={16} className="text-amber-500 animate-pulse" />
            Portal de Autoreservas para Clientes
          </h3>
          <p className="text-[10px] text-slate-400 mt-0.5">
            Comparte este enlace con tus clientes para que agenden sus citas de forma autónoma con depósito integrado.
          </p>
        </div>

        {/* Dynamic Booking Link Box */}
        <div className="bg-[#f8fafc] border border-slate-200/60 rounded-xl p-3 space-y-2.5">
          <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">
            Enlace Directo para Clientes
          </label>
          <div className="flex gap-2">
            <input
              type="text"
              readOnly
              value={typeof window !== "undefined" ? `${window.location.origin}/?cliente=true` : ""}
              className="flex-1 bg-white border border-slate-200 rounded-lg px-2.5 py-1.5 text-[11px] font-mono font-semibold text-[#004ac6] select-all outline-none"
            />
            <button
              type="button"
              onClick={() => {
                const url = typeof window !== "undefined" ? `${window.location.origin}/?cliente=true` : "";
                navigator.clipboard.writeText(url);
                setCopied(true);
                onSuccessToast("¡Enlace de reservación copiado al portapapeles!");
                setTimeout(() => setCopied(false), 2000);
              }}
              className="px-3 bg-[#004ac6] hover:bg-[#0049be] text-white rounded-lg flex items-center justify-center transition-colors cursor-pointer"
              title="Copiar enlace"
            >
              {copied ? <Check size={14} /> : <Copy size={14} />}
            </button>
          </div>

          <div className="flex justify-between items-center pt-1">
            <span className="text-[10px] text-slate-400 font-medium">✨ Listo para WhatsApp, Instagram o Facebook</span>
            <a
              href={typeof window !== "undefined" ? `${window.location.origin}/?cliente=true` : "#"}
              target="_blank"
              rel="noopener noreferrer"
              className="text-[10px] text-[#004ac6] hover:underline font-bold flex items-center gap-0.5"
            >
              Probar Vista Cliente <ExternalLink size={10} />
            </a>
          </div>
        </div>

        {/* Conversion rate optimization controllers */}
        <div className="border-t border-slate-100 pt-3.5 space-y-3.5">
          <div>
            <h4 className="text-xs font-bold text-slate-800 flex items-center gap-1">
              🚀 Optimizadores de Conversión (% de Citas Completadas)
            </h4>
            <p className="text-[9px] text-slate-400 leading-normal mt-0.5">
              Activa disparadores psicológicos y de confianza para motivar al cliente a completar su pago de anticipo de inmediato.
            </p>
          </div>

          {/* Optimizer 1: Urgency Badges */}
          <div className="flex items-start justify-between py-1 bg-slate-50 p-2.5 rounded-lg border border-slate-100">
            <div className="space-y-0.5 pr-3">
              <p className="text-xs font-bold text-slate-700 flex items-center gap-1">
                <span>🔥</span> Indicador de Alta Demanda (Escasez)
              </p>
              <p className="text-[10px] text-slate-500 leading-tight">
                Muestra alertas dinámicas de alta demanda para acelerar la decisión del cliente sobre asegurar su cupo.
              </p>
            </div>
            <button
              type="button"
              onClick={() => {
                setEnableUrgencyBadges(!enableUrgencyBadges);
                onSuccessToast(`Indicador de alta demanda ${!enableUrgencyBadges ? "activado" : "desactivado"}`);
              }}
              className="text-[#004ac6] flex-shrink-0 hover:scale-105 transition-transform"
            >
              {enableUrgencyBadges ? <ToggleRight size={32} className="text-[#004ac6]" /> : <ToggleLeft size={32} className="text-slate-300" />}
            </button>
          </div>

          {/* Optimizer 2: Seat retention Countdown */}
          <div className="flex items-start justify-between py-1 bg-slate-50 p-2.5 rounded-lg border border-slate-100">
            <div className="space-y-0.5 pr-3">
              <p className="text-xs font-bold text-slate-700 flex items-center gap-1">
                <span>⏳</span> Temporizador de Retención (Prisa)
              </p>
              <p className="text-[10px] text-slate-500 leading-tight">
                Establece un contador de 5 minutos que retiene el espacio del cliente temporalmente para apresurar el depósito.
              </p>
            </div>
            <button
              type="button"
              onClick={() => {
                setEnableReservationTimer(!enableReservationTimer);
                onSuccessToast(`Temporizador de retención ${!enableReservationTimer ? "activado" : "desactivado"}`);
              }}
              className="text-[#004ac6] flex-shrink-0 hover:scale-105 transition-transform"
            >
              {enableReservationTimer ? <ToggleRight size={32} className="text-[#004ac6]" /> : <ToggleLeft size={32} className="text-slate-300" />}
            </button>
          </div>

          {/* Optimizer 3: Discount Incentive text */}
          <div className="space-y-1 bg-slate-50 p-2.5 rounded-lg border border-slate-100">
            <label className="text-xs font-bold text-slate-700 block">
              🎁 Incentivo Extra de Pago Completo
            </label>
            <p className="text-[10px] text-slate-400 leading-tight mb-1.5">
              Ofrece incentivos de pago para que el cliente liquide el total de la cita o un monto mayor como anticipo.
            </p>
            <input
              type="text"
              value={conversionTacticDiscount}
              onChange={(e) => setConversionTacticDiscount(e.target.value)}
              placeholder="Ej. Recibe un snack o muestra de regalo..."
              className="w-full px-2.5 py-1.5 text-xs bg-white border border-slate-200 rounded-lg text-slate-700 outline-none focus:border-[#004ac6]"
            />
          </div>

          <button
            type="button"
            onClick={handleSavePaymentConfig}
            className="w-full bg-[#004ac6] hover:bg-[#0049be] text-white font-bold py-2.5 px-4 rounded-xl text-xs transition-all shadow flex items-center justify-center gap-1.5 cursor-pointer"
          >
            <Save size={13} /> Guardar Cambios en Optimizadores
          </button>
        </div>
      </div>

      {/* 4. OPTIMIZACIÓN DE ALMACENAMIENTO (Ciclo de 30 días) */}
      <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-sm space-y-4">
        <div>
          <h3 className="text-sm font-bold text-slate-800 flex items-center gap-2">
            <Database size={16} className="text-[#004ac6]" /> Optimización de Almacenamiento (Ciclo de 30 días)
          </h3>
          <p className="text-[11px] text-slate-400 mt-0.5">
            Mantenimiento automatizado y descargas de seguridad de tu base de datos.
          </p>
        </div>

        <div className="flex items-center justify-between py-1.5 border-y border-slate-100">
          <div className="space-y-0.5 pr-2">
            <p className="text-xs font-bold text-slate-700">Limpieza automática activa</p>
            <p className="text-[10px] text-slate-500 leading-normal">
              Los tickets de OXXO y las citas concluidas con más de 30 días de antigüedad se purgan automáticamente de la nube para mantener tu almacenamiento rápido y ligero.
            </p>
          </div>
          <button
            type="button"
            onClick={() => {
              setIsCleanupEnabled(!isCleanupEnabled);
              onSuccessToast(`Limpieza automática ${!isCleanupEnabled ? "activada" : "desactivada"}`);
            }}
            className="text-[#004ac6] flex-shrink-0 hover:scale-105 transition-transform"
          >
            {isCleanupEnabled ? <ToggleRight size={38} className="text-[#004ac6]" /> : <ToggleLeft size={38} className="text-slate-300" />}
          </button>
        </div>

        {/* Next purge countdown progress bar */}
        <div className="space-y-1.5">
          <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
            <div className="bg-[#004ac6] h-full rounded-full" style={{ width: "83%" }} />
          </div>
          <p className="text-[10px] font-bold text-[#004ac6] flex items-center gap-1.5">
            ⌛ Próxima depuración automática en: 5 días
          </p>
        </div>

        {/* Actions layout in settings panel */}
        <div className="grid grid-cols-2 gap-2 pt-1">
          {/* Download CSV */}
          <button
            type="button"
            onClick={handleDownloadReport}
            disabled={isSendingReport}
            className="bg-emerald-50 border border-emerald-200 hover:bg-emerald-100/75 text-emerald-800 font-bold py-2.5 px-3 rounded-xl text-xs transition-colors flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50"
          >
            {isSendingReport ? (
              <RefreshCw size={14} className="animate-spin" />
            ) : (
              <FileSpreadsheet size={14} className="text-emerald-600" />
            )}
            Reporte CSV
          </button>

          {/* Force Cleanup Now */}
          <button
            type="button"
            onClick={handleForceCleanup}
            disabled={isCleaning}
            className="border border-red-200 hover:border-red-300 bg-red-50 hover:bg-red-100/75 text-red-700 font-bold py-2.5 px-3 rounded-xl text-xs transition-colors flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50"
          >
            {isCleaning ? (
              <RefreshCw size={14} className="animate-spin text-red-500" />
            ) : (
              <Trash2 size={14} className="text-red-500" />
            )}
            Limpiar Ahora
          </button>
        </div>
      </div>
    </div>
  );
}
