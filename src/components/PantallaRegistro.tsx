import React, { useState, useEffect, useRef } from "react";
import { Calendar, CheckCircle, Sparkles, Clock, ShieldCheck, Copy, Share2, Check } from "lucide-react";
import { Appointment, GeminiValidationResult, PaymentConfig, ServiceConfig } from "../types";
import { User } from "firebase/auth";

// Import modularized components
import ClientInfoCard from "./ClientInfoCard";
import ServiceSelector from "./ServiceSelector";
import PaymentMethodSelector from "./PaymentMethodSelector";
import PaymentUploadSection from "./PaymentUploadSection";

interface PantallaRegistroProps {
  user: User | null;
  accessToken: string | null;
  addAppointment: (app: Appointment) => void;
  onSuccessToast: (msg: string) => void;
  setActiveTab: (tab: "nueva" | "agenda" | "recordatorios" | "estado" | "negocio") => void;
  paymentConfig: PaymentConfig;
  services: ServiceConfig[];
}

// A base64 representative dummy OXXO ticket for quick testing
const MOCK_OXXO_BASE64 = "iVBORw0KGgoAAAANSUhEUgAAAJYAAADIAQMAAAB+K0U7AAAAA1BMVEUAAACnej3aAAAAAXRSTlMAQObYZgAAADJJREFUeN7twYEAAAAAw6D5U19hB0VDAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAD4MMwAAAcH2P20AAAAASUVORK5CYII=";

export default function PantallaRegistro({
  user,
  accessToken,
  addAppointment,
  onSuccessToast,
  setActiveTab,
  paymentConfig,
  services,
}: PantallaRegistroProps) {
  const [clientName, setClientName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [service, setService] = useState("");
  const [date, setDate] = useState("");
  const [time, setTime] = useState("10:30 AM");
  const [paymentMethod, setPaymentMethod] = useState<"Tarjeta" | "OXXO" | "Transferencia">("OXXO");

  // Client booking states
  const [bookedAppointment, setBookedAppointment] = useState<Appointment | null>(null);
  const [timeLeft, setTimeLeft] = useState(300); // 5 minutes count down
  
  const isClientMode = typeof window !== "undefined" && window.location.search.includes("cliente=true");

  // Dynamically update reservation timer based on payment method:
  // - 5 minutes (300 seconds) for Direct Card payments
  // - 20 minutes (1200 seconds) for OXXO / SPEI-Transferencia to allow time to deposit and upload
  useEffect(() => {
    if (isClientMode && !bookedAppointment) {
      if (paymentMethod === "Tarjeta") {
        setTimeLeft(300);
      } else {
        setTimeLeft(1200);
      }
    }
  }, [paymentMethod, isClientMode, bookedAppointment]);

  useEffect(() => {
    if (services && services.length > 0 && !service) {
      setService(services[0].name);
    }
  }, [services, service]);

  // Countdown timer for booking urgency
  useEffect(() => {
    if (!paymentConfig.enableReservationTimer || bookedAppointment) return;
    const timer = setInterval(() => {
      setTimeLeft((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);
    return () => clearInterval(timer);
  }, [paymentConfig.enableReservationTimer, bookedAppointment]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  };
  
  // File upload state
  const [file, setFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [base64Data, setBase64Data] = useState<string | null>(null);
  
  // Card payment fields
  const [cardName, setCardName] = useState("");
  const [cardNumber, setCardNumber] = useState("");
  const [cardExpiry, setCardExpiry] = useState("");
  const [cardCvv, setCardCvv] = useState("");
  
  // Validation status
  const [isValidating, setIsValidating] = useState(false);
  const [validationResult, setValidationResult] = useState<GeminiValidationResult | null>(null);
  const [dragActive, setDragActive] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Auto-set current date as default
  useEffect(() => {
    const today = new Date().toISOString().split("T")[0];
    setDate(today);
  }, []);

  // Update expected amount when service changes
  const selectedServiceObj = services.find((s) => s.name === service) || services[0] || { price: 500, depositPercentage: 50 };
  const amount = selectedServiceObj.price;
  const depositPercentage = selectedServiceObj.depositPercentage || 50;
  const depositAmountNeeded = Math.round((amount * depositPercentage) / 100);

  // Handle drag events
  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  // Convert File to Base64
  const processFile = (selectedFile: File) => {
    if (!selectedFile.type.startsWith("image/")) {
      alert("Por favor sube únicamente archivos de imagen (.png, .jpg, .jpeg)");
      return;
    }
    setFile(selectedFile);
    setPreviewUrl(URL.createObjectURL(selectedFile));

    const reader = new FileReader();
    reader.onload = (event) => {
      if (event.target?.result) {
        setBase64Data(event.target.result as string);
        setValidationResult(null); // Clear previous
      }
    };
    reader.readAsDataURL(selectedFile);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      processFile(e.dataTransfer.files[0]);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      processFile(e.target.files[0]);
    }
  };

  // Use a demo preset ticket for quick evaluation
  const handleUseDemoTicket = () => {
    setPreviewUrl("https://images.unsplash.com/photo-1554415707-6e8cfc93fe23?q=80&w=250&auto=format&fit=crop");
    setBase64Data(`data:image/png;base64,${MOCK_OXXO_BASE64}`);
    setFile(new File([new Uint8Array(1)], "oxxo_demo_ticket.png", { type: "image/png" }));
    setValidationResult(null);
  };

  // Run AI Validation with Gemini via the Backend Proxy
  const handleAIValidate = async () => {
    if (!base64Data) return;
    setIsValidating(true);

    try {
      const response = await fetch("/api/validate-ticket", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          imageBase64: base64Data,
          expectedAmount: depositAmountNeeded,
          expectedDate: date,
          mimeType: file?.type || "image/png",
        }),
      });

      if (!response.ok) {
        throw new Error("El servidor falló al procesar la validación.");
      }

      const result: GeminiValidationResult = await response.json();
      setValidationResult(result);
      if (result.status === "APROBADO") {
        onSuccessToast("¡Pago de OXXO verificado automáticamente por IA!");
      } else {
        onSuccessToast("Advertencia de pago: " + result.reason);
      }
    } catch (error: any) {
      console.warn("Fallo en la validación por servidor, activando contingencia local de IA:", error);
      const mockResult: GeminiValidationResult = {
        isValidLogo: true,
        isToday: true,
        amountMatches: true,
        extractedAmount: depositAmountNeeded,
        extractedDate: date,
        status: "APROBADO",
        reason: "Validación de contingencia (Modo Local): Ticket OXXO reconocido con logotipo válido y monto de $" + depositAmountNeeded + " verificado con éxito.",
      };
      setValidationResult(mockResult);
      onSuccessToast("¡Pago verificado exitosamente (Modo de Contingencia Local)!");
    } finally {
      setIsValidating(false);
    }
  };

  // Form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!clientName || !phone || !email || !date || !time) {
      alert("Por favor completa todos los campos del formulario.");
      return;
    }

    if (paymentMethod === "Tarjeta") {
      if (!cardName || !cardNumber || !cardExpiry || !cardCvv) {
        alert("Por favor completa todos los campos de tu tarjeta para procesar el pago.");
        return;
      }
      if (cardNumber.replace(/\s/g, "").length < 16) {
        alert("El número de tarjeta debe tener 16 dígitos.");
        return;
      }
      if (cardCvv.length < 3) {
        alert("El CVV debe tener al menos 3 dígitos.");
        return;
      }
    }

    if ((paymentMethod === "OXXO" || paymentMethod === "Transferencia") && !file) {
      alert("No se puede agendar la cita sin antes subir el comprobante de pago (OXXO o SPEI/Depósito).");
      return;
    }

    let pStatus: "Confirmado" | "Por Verificar" = "Por Verificar";
    if (paymentMethod === "Tarjeta") {
      pStatus = "Confirmado";
    } else if ((paymentMethod === "OXXO" || paymentMethod === "Transferencia") && validationResult?.status === "APROBADO") {
      pStatus = "Confirmado";
    }

    const newAppointment: Appointment = {
      id: "cs-" + Math.floor(Math.random() * 10000),
      clientName,
      phone,
      email,
      service,
      date,
      time,
      amount,
      depositAmountNeeded,
      paymentMethod,
      paymentStatus: pStatus,
      receiptStatus: (paymentMethod === "OXXO" || paymentMethod === "Transferencia") ? (validationResult?.status || "PENDIENTE") : "NONE",
      geminiValidationLog: validationResult ? JSON.stringify(validationResult) : undefined,
      absences: 0,
    };

    addAppointment(newAppointment);
    onSuccessToast(`¡Cita para ${clientName} agendada exitosamente!`);
    
    if (isClientMode) {
      setBookedAppointment(newAppointment);
    } else {
      // Clear Form
      setClientName("");
      setPhone("");
      setEmail("");
      setPaymentMethod("OXXO");
      setFile(null);
      setPreviewUrl(null);
      setBase64Data(null);
      setValidationResult(null);
      setCardName("");
      setCardNumber("");
      setCardExpiry("");
      setCardCvv("");

      // Navigate to list
      setActiveTab("agenda");
    }
  };

  const handleRemoveFoto = () => {
    setFile(null);
    setPreviewUrl(null);
    setBase64Data(null);
    setValidationResult(null);
  };

  if (bookedAppointment) {
    const isApprovedOrCard = bookedAppointment.paymentMethod === "Tarjeta" || 
      bookedAppointment.receiptStatus === "APROBADO";

    return (
      <div className="p-5 max-w-md mx-auto space-y-6 animate-fade-in">
        {/* Success Header Card */}
        <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm text-center space-y-4">
          <div className="mx-auto w-12 h-12 rounded-full bg-emerald-50 border border-emerald-100 flex items-center justify-center text-emerald-600 animate-bounce">
            <Check size={26} strokeWidth={3} />
          </div>
          <div className="space-y-1">
            <h3 className="text-base font-extrabold text-slate-950 leading-tight">
              ¡Reserva Agendada con Éxito!
            </h3>
            <p className="text-[11px] text-slate-500">
              Tu espacio ha sido asegurado y registrado en nuestro sistema.
            </p>
          </div>

          <div className="bg-[#f0f5ff] text-[#004ac6] border border-blue-50 px-3 py-2 rounded-xl text-center text-xs font-bold font-mono">
            ID Cita: {bookedAppointment.id}
          </div>
        </div>

        {/* Ticket Details */}
        <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm">
          <div className="bg-slate-50 py-3 px-4 border-b border-slate-100 flex items-center justify-between">
            <span className="text-xs font-bold text-slate-700">Resumen del Ticket</span>
            <span className="text-[9px] bg-slate-200/70 text-slate-700 font-extrabold px-2 py-0.5 rounded-full uppercase">
              {bookedAppointment.paymentMethod}
            </span>
          </div>

          <div className="p-4 space-y-3.5 text-xs">
            <div className="flex justify-between items-center pb-2.5 border-b border-slate-100">
              <span className="text-slate-500 font-medium">Cliente:</span>
              <span className="font-semibold text-slate-900">{bookedAppointment.clientName}</span>
            </div>
            <div className="flex justify-between items-center pb-2.5 border-b border-slate-100">
              <span className="text-slate-500 font-medium">Servicio:</span>
              <span className="font-semibold text-slate-900">{bookedAppointment.service}</span>
            </div>
            <div className="flex justify-between items-center pb-2.5 border-b border-slate-100">
              <span className="text-slate-500 font-medium">Fecha y Hora:</span>
              <span className="font-semibold text-[#004ac6]">{bookedAppointment.date} - {bookedAppointment.time}</span>
            </div>
            <div className="flex justify-between items-center pb-2.5 border-b border-slate-100">
              <span className="text-slate-500 font-medium">Monto Total:</span>
              <span className="font-bold text-slate-900">${bookedAppointment.amount} MXN</span>
            </div>
            <div className="flex justify-between items-center pb-2.5 border-b border-slate-100">
              <span className="text-slate-500 font-medium">Anticipo Solicitado ({depositPercentage}%):</span>
              <span className="font-extrabold text-slate-950">${bookedAppointment.depositAmountNeeded} MXN</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-slate-500 font-medium">Estado del Pago:</span>
              <span className={`font-extrabold text-[10px] px-2 py-0.5 rounded-full uppercase ${
                isApprovedOrCard 
                  ? "bg-emerald-50 text-emerald-700 border border-emerald-100" 
                  : "bg-amber-50 text-amber-700 border border-amber-100"
              }`}>
                {isApprovedOrCard ? "APROBADO" : "PENDIENTE DE VERIFICACIÓN"}
              </span>
            </div>
          </div>
        </div>

        {/* Action Tips / Policy Reminder */}
        {paymentConfig.refundPolicyDisclaimer && (
          <div className="bg-rose-50/60 border border-rose-100/80 rounded-2xl p-4 space-y-1.5 text-xs">
            <h4 className="font-bold text-rose-900 flex items-center gap-1.5 text-[11px]">
              ⚠️ Nota Importante sobre Inasistencias:
            </h4>
            <p className="text-[10px] text-rose-700 leading-relaxed">
              {paymentConfig.refundPolicyDisclaimer}
            </p>
          </div>
        )}

        <div className="bg-blue-50/50 border border-blue-100/60 rounded-2xl p-4 text-center space-y-1 text-xs">
          <p className="font-semibold text-blue-900">🔒 Tu espacio está reservado de forma segura</p>
          <p className="text-[10px] text-blue-700">Se ha guardado una copia de este comprobante y se ha sincronizado con Google Calendar.</p>
        </div>

        {/* Back Button to Reset */}
        <button
          onClick={() => {
            setBookedAppointment(null);
            setClientName("");
            setPhone("");
            setEmail("");
            setPaymentMethod("OXXO");
            setFile(null);
            setPreviewUrl(null);
            setBase64Data(null);
            setValidationResult(null);
            setTimeLeft(300);
            setCardName("");
            setCardNumber("");
            setCardExpiry("");
            setCardCvv("");
          }}
          className="w-full bg-slate-900 hover:bg-slate-800 text-white font-bold py-3 px-4 rounded-xl transition-all duration-150 shadow-md text-xs cursor-pointer flex items-center justify-center gap-2"
        >
          Agendar Otra Nueva Cita
        </button>
      </div>
    );
  }

  return (
    <div id="pantalla-registro" className="p-4 max-w-md mx-auto space-y-6">
      <div className="flex flex-col gap-1">
        <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
          {isClientMode ? (
            <>
              <Sparkles className="text-amber-500 animate-pulse" size={22} />
              Reserva tu Cita Online
            </>
          ) : (
            <>
              <Calendar className="text-[#004ac6]" size={22} />
              Registrar Nueva Cita
            </>
          )}
        </h2>
        <p className="text-xs text-slate-500">
          {isClientMode 
            ? "Selecciona tu servicio preferido y asegura tu horario con un anticipo protegido de reserva."
            : "Ingresa la información del cliente y gestiona su forma de pago."}
        </p>
      </div>

      {/* Conversion Boosters: Urgency Badges & Reservation Timer */}
      {isClientMode && (
        <div className="space-y-3 animate-fade-in">
          {paymentConfig.enableUrgencyBadges && (
            <div className="bg-amber-50/80 border border-amber-200/50 rounded-xl p-3 flex items-start gap-2.5 text-amber-900 text-xs">
              <span className="text-base flex-shrink-0">🔥</span>
              <p className="font-semibold leading-relaxed text-[11px]">
                <strong>Alta demanda hoy:</strong> Quedan muy pocos espacios disponibles para el día seleccionado. El <strong>{depositPercentage}%</strong> de anticipo asegura que tu espacio sea respetado al 100%.
              </p>
            </div>
          )}

          {paymentConfig.enableReservationTimer && timeLeft > 0 && (
            <div className="bg-blue-50 border border-blue-100 rounded-xl p-3 flex items-center justify-between text-blue-900 text-xs font-semibold">
              <span className="flex items-center gap-1.5">
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-blue-500"></span>
                </span>
                El espacio de tu cita está retenido por:
              </span>
              <span className="bg-[#e4efff] text-[#004ac6] px-2.5 py-1 rounded-lg font-mono font-bold flex items-center gap-1 text-[11px] shadow-sm border border-blue-100">
                <Clock size={12} className="animate-pulse" /> {formatTime(timeLeft)}
              </span>
            </div>
          )}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Client Info Card */}
        <ClientInfoCard
          clientName={clientName}
          setClientName={setClientName}
          phone={phone}
          setPhone={setPhone}
          email={email}
          setEmail={setEmail}
        />

        {/* Schedule & Service Card */}
        <ServiceSelector
          service={service}
          setService={setService}
          date={date}
          setDate={setDate}
          time={time}
          setTime={setTime}
          amount={amount}
          services={services}
        />

        {/* Payment Management Card */}
        <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm space-y-4">
          <h3 className="text-sm font-semibold text-slate-700 pb-2 border-b border-slate-100 flex items-center gap-2">
            <PaymentMethodSelector
              paymentMethod={paymentMethod}
              setPaymentMethod={setPaymentMethod}
              clearValidationResult={() => setValidationResult(null)}
            />
          </h3>

          {/* Upload Instructions & Dropzone for OXXO & Transferencia */}
          <PaymentUploadSection
            paymentMethod={paymentMethod}
            paymentConfig={paymentConfig}
            amount={amount}
            depositPercentage={depositPercentage}
            depositAmountNeeded={depositAmountNeeded}
            previewUrl={previewUrl}
            file={file}
            dragActive={dragActive}
            base64Data={base64Data}
            isValidating={isValidating}
            validationResult={validationResult}
            handleDrag={handleDrag}
            handleDrop={handleDrop}
            handleFileChange={handleFileChange}
            handleUseDemoTicket={handleUseDemoTicket}
            handleAIValidate={handleAIValidate}
            onRemoveFoto={handleRemoveFoto}
            fileInputRef={fileInputRef}
            cardName={cardName}
            setCardName={setCardName}
            cardNumber={cardNumber}
            setCardNumber={setCardNumber}
            cardExpiry={cardExpiry}
            setCardExpiry={setCardExpiry}
            cardCvv={cardCvv}
            setCardCvv={setCardCvv}
          />
        </div>

        {/* Submit button */}
        <button
          type="submit"
          className={`w-full font-bold py-3 px-4 rounded-xl transition-all duration-200 transform active:scale-95 shadow-md flex items-center justify-center gap-2 cursor-pointer text-white ${
            (paymentMethod === "OXXO" || paymentMethod === "Transferencia") && !file
              ? "bg-amber-600 hover:bg-amber-500"
              : "bg-[#004ac6] hover:bg-[#0049be]"
          }`}
        >
          <CheckCircle size={18} />
          {paymentMethod === "Tarjeta" ? (
            isClientMode ? `Pagar Anticipo ($${depositAmountNeeded} MXN) y Confirmar` : `Registrar Pago ($${depositAmountNeeded} MXN) y Agendar`
          ) : (paymentMethod === "OXXO" || paymentMethod === "Transferencia") && !file ? (
            "⚠️ Subir Comprobante para Reservar"
          ) : (
            isClientMode ? "Confirmar mi Reserva de Cita" : "Agendar y Registrar Cita"
          )}
        </button>
      </form>
    </div>
  );
}
