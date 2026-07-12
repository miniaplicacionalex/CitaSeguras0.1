import { useState, useEffect } from "react";
import { Sparkles, X, ShieldCheck } from "lucide-react";
import Header from "./components/Header";
import TabNavigation, { TabType } from "./components/TabNavigation";
import PantallaRegistro from "./components/PantallaRegistro";
import PantallaAgenda from "./components/PantallaAgenda";
import PantallaRecordatorios from "./components/PantallaRecordatorios";
import PantallaEstado from "./components/PantallaEstado";
import PantallaNegocio from "./components/PantallaNegocio";
import { initialAppointments, initialStats } from "./data";
import { Appointment, BusinessStats, PaymentConfig, ServiceConfig, AppNotification } from "./types";
import { User } from "firebase/auth";
import { 
  initAuth, 
  googleSignIn, 
  logout, 
  setupGoogleSheet, 
  addAppointmentToSheet, 
  updateAppointmentInSheet, 
  scheduleCalendarEvent, 
  getOrCreateDriveFolder, 
  uploadReceiptToDrive, 
  sendGmailReport 
} from "./utils/googleWorkspace";

export default function App() {
  const [activeTab, setActiveTab] = useState<TabType>("estado");
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [stats, setStats] = useState<BusinessStats>(initialStats);
  
  // Google Workspace / Firebase Auth state
  const [user, setUser] = useState<User | null>(null);
  const [accessToken, setAccessToken] = useState<string | null>(null);
  const [isLoggingIn, setIsLoggingIn] = useState(false);
  const [spreadsheetId, setSpreadsheetId] = useState<string | null>(null);
  const [showDemoLoginSuggestion, setShowDemoLoginSuggestion] = useState(false);
  
  // Notification / Feedback State
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Decode URL configuration if present (for client booking link)
  const isClientMode = typeof window !== "undefined" && window.location.search.includes("cliente=true");
  let urlServices: ServiceConfig[] | null = null;
  let urlPaymentConfig: PaymentConfig | null = null;
  
  if (typeof window !== "undefined") {
    const params = new URLSearchParams(window.location.search);
    const encodedData = params.get("data");
    if (encodedData) {
      try {
        const decoded = decodeURIComponent(atob(encodedData));
        const parsed = JSON.parse(decoded);
        if (parsed.services) {
          urlServices = parsed.services;
        }
        if (parsed.paymentConfig) {
          urlPaymentConfig = parsed.paymentConfig;
        }
      } catch (e) {
        console.error("Error decoding url data parameter:", e);
      }
    }
  }

  // Payment Config State linked to business_id (user?.uid || "default_business")
  const [paymentConfig, setPaymentConfig] = useState<PaymentConfig>(() => {
    if (urlPaymentConfig) return urlPaymentConfig;

    const bid = "default_business";
    const saved = localStorage.getItem(`cs_payment_config_${bid}`);
    if (saved) return JSON.parse(saved);

    const lastActive = localStorage.getItem("cs_payment_config_last_active");
    if (lastActive) return JSON.parse(lastActive);

    return {
      cardOrSpei: "1234 5678 9012 3456",
      referenceType: "tarjeta",
      bankName: "BBVA Bancomer",
      accountHolder: "CitaSeguras Negocios S.A.",
      alternativePayLink: "https://link.mercadopago.com.mx/citaseguras",
      refundPolicyDisclaimer: "⚠️ NOTA DE SEGURIDAD: Para asegurar el espacio de su cita y los insumos requeridos, el depósito del anticipo de reserva no es reembolsable en caso de inasistencia o de no reprogramar con al menos 24 horas de anticipación.",
      enableUrgencyBadges: true,
      enableReservationTimer: true,
      conversionTacticDiscount: "5% de Descuento Extra si seleccionas pago al 100% como anticipo.",
      workingHoursStart: "09:00",
      workingHoursEnd: "21:00",
      breakStart: "14:00",
      breakEnd: "16:00"
    };
  });

  // Generate active notifications from appointments
  const notifications: AppNotification[] = (() => {
    const list: AppNotification[] = [];
    const todayStr = "2026-07-04"; // Stable demo date used in initialAppointments
    
    appointments.forEach((app) => {
      // 1. Por Verificar (Pending Verification)
      if (app.paymentStatus === "Por Verificar") {
        const template = paymentConfig.whatsappTemplatePending || 
          "Hola {nombre_cliente}, detectamos tu pago como pendiente. Por favor confírmanos si ya realizaste tu depósito/transferencia para verificarlo por IA de CitaSeguras y activar tu cita de {servicio}. ¡Gracias!";
        
        const message = template
          .replace(/{nombre_cliente}/g, app.clientName)
          .replace(/{servicio}/g, app.service)
          .replace(/{fecha}/g, app.date)
          .replace(/{hora}/g, app.time)
          .replace(/{monto}/g, String(app.amount));

        list.push({
          id: `${app.id}-pending`,
          appointmentId: app.id,
          clientName: app.clientName,
          phone: app.phone,
          type: "por_verificar",
          title: "Validar Pago de OXXO / SPEI",
          description: `${app.clientName} - ${app.service} ($${app.amount})`,
          message: message,
        });
      }
      
      // 2. Confirmed & Today -> candidate for 8h and 2h reminders
      if (app.paymentStatus === "Confirmado" && app.date === todayStr) {
        // 8 Hours Reminder
        const template8h = paymentConfig.whatsappTemplate8h || 
          "¡Hola {nombre_cliente}! Te recordamos que tu cita para {servicio} es hoy mismo en 8 horas (a las {hora}). Por favor confírmanos que asistirás respondiendo con un 'OK' o un emoticón. ¡Gracias!";
          
        const message8h = template8h
          .replace(/{nombre_cliente}/g, app.clientName)
          .replace(/{servicio}/g, app.service)
          .replace(/{fecha}/g, app.date)
          .replace(/{hora}/g, app.time)
          .replace(/{monto}/g, String(app.amount));

        list.push({
          id: `${app.id}-8h`,
          appointmentId: app.id,
          clientName: app.clientName,
          phone: app.phone,
          type: "recordatorio_8h",
          title: "Recordatorio 8 Hrs",
          description: `${app.clientName} a las ${app.time}`,
          message: message8h,
        });

        // 2 Hours Reminder
        const template2h = paymentConfig.whatsappTemplate2h || 
          "⚠️ ¡Hola {nombre_cliente}! Recordatorio rápido de que tu cita para {servicio} comienza en 2 horas (a las {hora}). Agradecemos tu puntualidad. ¡Te vemos pronto!";
          
        const message2h = template2h
          .replace(/{nombre_cliente}/g, app.clientName)
          .replace(/{servicio}/g, app.service)
          .replace(/{fecha}/g, app.date)
          .replace(/{hora}/g, app.time)
          .replace(/{monto}/g, String(app.amount));

        list.push({
          id: `${app.id}-2h`,
          appointmentId: app.id,
          clientName: app.clientName,
          phone: app.phone,
          type: "recordatorio_2h",
          title: "Recordatorio 2 Hrs",
          description: `${app.clientName} a las ${app.time}`,
          message: message2h,
        });
      }
    });
    
    return list;
  })();

  const [businessId, setBusinessId] = useState<string>("default_business");
  const [subscriptionState, setSubscriptionState] = useState<{ plan: string; estado: string; expiration: string } | null>(null);

  // Dynamic services/products configuration
  const [services, setServices] = useState<ServiceConfig[]>(() => {
    if (urlServices) return urlServices;
    const saved = localStorage.getItem("cs_services_config");
    if (saved) return JSON.parse(saved);
    return [
      { id: "srv-1", name: "Consulta General", price: 500, duration: "30 min", depositPercentage: 50 },
      { id: "srv-2", name: "Fisioterapia", price: 800, duration: "60 min", depositPercentage: 50 },
      { id: "srv-3", name: "Revisión Financiera", price: 1200, duration: "45 min", depositPercentage: 50 },
      { id: "srv-4", name: "Seguimiento", price: 400, duration: "15 min", depositPercentage: 50 },
    ];
  });

  const saveServices = async (newServices: ServiceConfig[]) => {
    setServices(newServices);
    localStorage.setItem("cs_services_config", JSON.stringify(newServices));
    try {
      await fetch(`/api/catalog/${businessId}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ services: newServices, paymentConfig }),
      });
    } catch (e) {
      console.error("Error syncing services to remote spreadsheet:", e);
    }
  };

  useEffect(() => {
    const loadCatalogAndSubscription = async () => {
      const params = new URLSearchParams(window.location.search);
      const urlBid = params.get("business_id") || params.get("business") || params.get("bid");
      const bid = urlBid || user?.uid || "default_business";
      setBusinessId(bid);

      try {
        const res = await fetch(`/api/catalog/${bid}`);
        if (res.ok) {
          const data = await res.json();
          if (data.services) setServices(data.services);
          if (data.paymentConfig) setPaymentConfig(data.paymentConfig);
          console.log(`Loaded catalog from central Google Sheets for: ${bid}`);
        }
      } catch (e) {
        console.error("Error loading remote catalog, using local defaults:", e);
      }
      
      try {
        const subRes = await fetch(`/api/subscription/${bid}`);
        if (subRes.ok) {
          const subData = await subRes.json();
          setSubscriptionState(subData);
          console.log(`Loaded subscription state for: ${bid}`, subData);
        }
      } catch (e) {
        console.error("Error loading subscription state:", e);
      }
    };

    loadCatalogAndSubscription();
  }, [user]);

  const savePaymentConfig = async (config: PaymentConfig) => {
    const bid = businessId;
    setPaymentConfig(config);
    localStorage.setItem(`cs_payment_config_${bid}`, JSON.stringify(config));
    localStorage.setItem("cs_payment_config_default_business", JSON.stringify(config));
    localStorage.setItem("cs_payment_config_last_active", JSON.stringify(config));
    try {
      await fetch(`/api/catalog/${bid}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ services, paymentConfig: config }),
      });
    } catch (e) {
      console.error("Error syncing payment config to remote spreadsheet:", e);
    }
    showToast("¡Métodos de pagos guardados y sincronizados con la base de datos!");
  };

  // Load state from local storage or fallback to defaults (with automatic 35-day cleanup)
  useEffect(() => {
    const savedApps = localStorage.getItem("cs_appointments");
    let loadedApps: Appointment[] = [];
    if (savedApps) {
      loadedApps = JSON.parse(savedApps);
    } else {
      loadedApps = initialAppointments;
    }

    // Auto-cleanup: remove any appointment older than 35 days to keep interface light and fast
    const today = new Date();
    const thirtyFiveDaysAgo = new Date(today.getTime() - 35 * 24 * 60 * 60 * 1000);
    const cleanedApps = loadedApps.filter((app) => {
      const appDate = new Date(app.date);
      if (isNaN(appDate.getTime())) return true;
      return appDate >= thirtyFiveDaysAgo;
    });

    setAppointments(cleanedApps);
    localStorage.setItem("cs_appointments", JSON.stringify(cleanedApps));

    const savedStats = localStorage.getItem("cs_stats");
    if (savedStats) {
      setStats(JSON.parse(savedStats));
    } else {
      setStats(initialStats);
    }

    const savedSheetId = localStorage.getItem("cs_spreadsheet_id");
    if (savedSheetId) {
      setSpreadsheetId(savedSheetId);
    }

    // Load persistent demo workspace
    const isDemoActive = localStorage.getItem("cs_demo_workspace_active") === "true";
    if (isDemoActive) {
      setUser({
        uid: "demo-workspace-user",
        displayName: "Clínica Dental Demo (Simulado)",
        email: "demo-dental@citaseguras.com",
        photoURL: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?q=80&w=150&auto=format&fit=crop"
      } as any);
      setAccessToken("demo-access-token-12345");
      setSpreadsheetId("spreadsheet_demo_12345");
    }
  }, []);

  // Initialize Firebase authentication listener
  useEffect(() => {
    const isDemoActive = localStorage.getItem("cs_demo_workspace_active") === "true";
    if (isDemoActive) return;

    const unsubscribe = initAuth(
      async (firebaseUser, token) => {
        setUser(firebaseUser);
        setAccessToken(token);
        showToast(`¡Conectado como ${firebaseUser.displayName}! Sincronizando Workspace...`);
        
        // Setup central Google Sheet database
        try {
          const sheetId = await setupGoogleSheet(token);
          setSpreadsheetId(sheetId);
          localStorage.setItem("cs_spreadsheet_id", sheetId);
        } catch (err) {
          console.error("No se pudo iniciar Google Sheets:", err);
        }
      },
      () => {
        setUser(null);
        setAccessToken(null);
      }
    );
    return () => unsubscribe();
  }, []);

  const showToast = (message: string) => {
    setToastMessage(message);
    setTimeout(() => {
      setToastMessage(null);
    }, 4000);
  };

  // Google sign in action
  const handleLogin = async () => {
    setIsLoggingIn(true);
    try {
      const result = await googleSignIn();
      if (result) {
        setUser(result.user);
        setAccessToken(result.accessToken);
        showToast("¡Sesión iniciada con Google Workspace!");
        
        // Provision sheets database
        const sheetId = await setupGoogleSheet(result.accessToken);
        setSpreadsheetId(sheetId);
        localStorage.setItem("cs_spreadsheet_id", sheetId);
      }
    } catch (err: any) {
      console.error("Login Error details:", err);
      if (err?.code === "auth/popup-closed-by-user" || err?.message?.includes("popup-closed-by-user") || err?.message?.includes("closed by user")) {
        showToast("Inicio de sesión cancelado o ventana emergente bloqueada.");
        setShowDemoLoginSuggestion(true);
      } else {
        showToast("No se pudo conectar: " + (err?.message || "Error desconocido"));
        setShowDemoLoginSuggestion(true);
      }
    } finally {
      setIsLoggingIn(false);
    }
  };

  const handleDemoSignIn = () => {
    localStorage.setItem("cs_demo_workspace_active", "true");
    setUser({
      uid: "demo-workspace-user",
      displayName: "Clínica Dental Demo (Simulado)",
      email: "demo-dental@citaseguras.com",
      photoURL: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?q=80&w=150&auto=format&fit=crop"
    } as any);
    setAccessToken("demo-access-token-12345");
    setSpreadsheetId("spreadsheet_demo_12345");
    setShowDemoLoginSuggestion(false);
    showToast("¡Modo Demo de Google Workspace activado!");
  };

  // Logout action
  const handleLogout = async () => {
    try {
      await logout();
      setUser(null);
      setAccessToken(null);
      setSpreadsheetId(null);
      localStorage.removeItem("cs_spreadsheet_id");
      localStorage.removeItem("cs_demo_workspace_active");
      showToast("Sesión cerrada.");
    } catch (err) {
      console.error(err);
    }
  };

  // Adding appointment and syncing
  const addAppointment = async (newApp: Appointment) => {
    const updatedApps = [newApp, ...appointments];
    setAppointments(updatedApps);
    localStorage.setItem("cs_appointments", JSON.stringify(updatedApps));

    // recalculate statistics
    recalculateStats(updatedApps);

    // Sync with Central Service Account Spreadsheet via Server
    try {
      const serverRes = await fetch("/api/save-appointment", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ businessId, appointment: newApp }),
      });
      if (serverRes.ok) {
        const serverData = await serverRes.json();
        if (serverData.success && serverData.rowIndex) {
          newApp.sheetRowIndex = serverData.rowIndex;
          console.log(`Cita guardada en base de datos central en fila ${serverData.rowIndex}`);
        }
      }
    } catch (e) {
      console.error("Error saving appointment to server-side central database:", e);
    }

    // Sync with Google Workspace if authenticated
    if (accessToken) {
      try {
        let finalReceiptUrl = "";
        
        // 1. If OXXO receipt image exists, upload it to Google Drive first
        if (newApp.paymentMethod === "OXXO" && newApp.geminiValidationLog) {
          showToast("Subiendo comprobante de OXXO a Google Drive...");
          const folderId = await getOrCreateDriveFolder(accessToken);
          
          // Get the base64 from state (using mock/or generated data)
          const base64Data = "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII=";
          const url = await uploadReceiptToDrive(
            accessToken,
            folderId,
            `Comprobante_${newApp.clientName.replace(/\s+/g, "_")}_${newApp.id}.png`,
            base64Data,
            "image/png"
          );
          finalReceiptUrl = url;
          newApp.receiptUrl = url;
        }

        // 2. Add as a row in Google Sheets
        if (spreadsheetId) {
          const rowIndex = await addAppointmentToSheet(accessToken, spreadsheetId, {
            ...newApp,
            receiptUrl: finalReceiptUrl
          });
          newApp.sheetRowIndex = rowIndex;
        }

        // 3. If confirmed immediately (Tarjeta or Approved), schedule on Google Calendar
        if (newApp.paymentStatus === "Confirmado") {
          const eventId = await scheduleCalendarEvent(accessToken, newApp);
          newApp.calendarEventId = eventId;
        }
      } catch (err) {
        console.error("Error al sincronizar con Google Workspace:", err);
      }
    }

    // Update with the sheet reference and calendar IDs
    const syncedApps = updatedApps.map((a) => (a.id === newApp.id ? newApp : a));
    setAppointments(syncedApps);
    localStorage.setItem("cs_appointments", JSON.stringify(syncedApps));
  };

  // Manually approving a payment
  const approveAppointmentPayment = async (id: string) => {
    const updatedApps = appointments.map((app) => {
      if (app.id === id) {
        return {
          ...app,
          paymentStatus: "Confirmado" as const,
          receiptStatus: "APROBADO" as const,
        };
      }
      return app;
    });

    setAppointments(updatedApps);
    localStorage.setItem("cs_appointments", JSON.stringify(updatedApps));
    recalculateStats(updatedApps);

    const targetApp = updatedApps.find((app) => app.id === id);
    if (targetApp && targetApp.sheetRowIndex) {
      // Sync with Central Service Account Spreadsheet via Server
      try {
        await fetch("/api/update-appointment", {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            rowIndex: targetApp.sheetRowIndex,
            status: "Confirmado",
            receiptUrl: targetApp.receiptUrl,
            receiptStatus: "APROBADO",
          }),
        });
      } catch (e) {
        console.error("Error updating appointment in central database:", e);
      }
    }

    // Sync Workspace status update
    if (targetApp && accessToken) {
      try {
        // 1. Update Sheet row
        if (spreadsheetId && targetApp.sheetRowIndex) {
          await updateAppointmentInSheet(
            accessToken,
            spreadsheetId,
            targetApp.sheetRowIndex,
            "Confirmado",
            targetApp.receiptUrl,
            "APROBADO"
          );
        }

        // 2. Add event to Google Calendar
        const eventId = await scheduleCalendarEvent(accessToken, targetApp);
        targetApp.calendarEventId = eventId;

        // Save reference IDs
        const savedApps = updatedApps.map((a) => (a.id === id ? targetApp : a));
        setAppointments(savedApps);
        localStorage.setItem("cs_appointments", JSON.stringify(savedApps));
      } catch (err) {
        console.error("Error de sincronización de aprobación en Workspace:", err);
      }
    }
  };

  // Rejecting payment
  const rejectAppointmentPayment = async (id: string) => {
    const updatedApps = appointments.map((app) => {
      if (app.id === id) {
        return {
          ...app,
          paymentStatus: "Cancelado" as const,
          receiptStatus: "RECHAZADO" as const,
        };
      }
      return app;
    });

    setAppointments(updatedApps);
    localStorage.setItem("cs_appointments", JSON.stringify(updatedApps));
    recalculateStats(updatedApps);

    const targetApp = updatedApps.find((app) => app.id === id);
    if (targetApp && targetApp.sheetRowIndex) {
      // Sync with Central Service Account Spreadsheet via Server
      try {
        await fetch("/api/update-appointment", {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            rowIndex: targetApp.sheetRowIndex,
            status: "Cancelado",
            receiptUrl: targetApp.receiptUrl,
            receiptStatus: "RECHAZADO",
          }),
        });
      } catch (e) {
        console.error("Error updating appointment in central database:", e);
      }
    }

    // Sync Google Sheets
    if (targetApp && accessToken && spreadsheetId && targetApp.sheetRowIndex) {
      try {
        await updateAppointmentInSheet(
          accessToken,
          spreadsheetId,
          targetApp.sheetRowIndex,
          "Cancelado",
          targetApp.receiptUrl,
          "RECHAZADO"
        );
      } catch (err) {
        console.error(err);
      }
    }
  };

  // Recalculates stats based on the appointments list
  const recalculateStats = (appsList: Appointment[]) => {
    const totalCount = appsList.length;
    if (totalCount === 0) {
      const resetStats: BusinessStats = {
        attendanceRate: 100,
        confirmedCount: 0,
        rescheduledCount: 0,
      };
      setStats(resetStats);
      localStorage.setItem("cs_stats", JSON.stringify(resetStats));
      return;
    }

    const confirmed = appsList.filter((a) => a.paymentStatus === "Confirmado").length;
    const canceled = appsList.filter((a) => a.paymentStatus === "Cancelado").length;
    const rescheduled = appsList.filter((a) => a.paymentStatus === "Reagendado").length;

    // Attendance rate formula: confirmed appointments over total valid ones (not canceled)
    const activeApps = totalCount - canceled;
    const attendanceRate = activeApps > 0 ? Math.round((confirmed / activeApps) * 100) : 100;

    const updatedStats: BusinessStats = {
      attendanceRate: Math.max(0, Math.min(100, attendanceRate)),
      confirmedCount: confirmed,
      rescheduledCount: rescheduled,
    };

    setStats(updatedStats);
    localStorage.setItem("cs_stats", JSON.stringify(updatedStats));
  };

  // Storage Cleanup Trigger (delete older than 30 days)
  const triggerCleanup = () => {
    const today = new Date();
    const thirtyDaysAgo = new Date(today.getTime() - 30 * 24 * 60 * 60 * 1000);

    const activeApps = appointments.filter((app) => {
      const appDate = new Date(app.date);
      return appDate >= thirtyDaysAgo;
    });

    setAppointments(activeApps);
    localStorage.setItem("cs_appointments", JSON.stringify(activeApps));
    recalculateStats(activeApps);
  };

  // Send Monthly assistance report to Gmail
  const triggerMonthlyReportEmail = async (): Promise<boolean> => {
    if (!accessToken || !user?.email) return false;

    // Generate CSV string
    let csvContent = "ID,Cliente,Telefono,Correo,Servicio,Fecha,Hora,Monto,Metodo Pago,Estado Pago,Inasistencias\n";
    appointments.forEach((app) => {
      csvContent += `${app.id},${app.clientName},${app.phone},${app.email},${app.service},${app.date},${app.time},${app.amount},${app.paymentMethod},${app.paymentStatus},${app.absences}\n`;
    });

    try {
      const success = await sendGmailReport(accessToken, user.email, csvContent, "Julio 2026");
      return success;
    } catch (err) {
      console.error("No se pudo enviar el reporte por Gmail:", err);
      return false;
    }
  };

  return (
    <div className="min-h-screen bg-slate-100 flex items-center justify-center font-sans select-none antialiased text-[#0b1c30] p-0 sm:p-4">
      {/* Container Device Wrapper matching the theme */}
      <div className="w-full max-w-md bg-white sm:rounded-[24px] sm:shadow-2xl overflow-hidden flex flex-col sm:border-[6px] sm:border-slate-800 h-screen sm:h-[88vh] sm:max-h-[820px] relative">
        
        {/* Google Workspace Simulation Helper Modal */}
        {showDemoLoginSuggestion && (
          <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-end sm:items-center justify-center p-4 animate-fade-in">
            <div className="bg-white w-full max-w-sm rounded-2xl p-5 shadow-2xl border border-slate-100 space-y-4 animate-slide-up">
              <div className="flex items-start justify-between">
                <div className="bg-blue-50 p-2.5 rounded-xl border border-blue-100">
                  <Sparkles size={24} className="text-[#004ac6] animate-pulse" />
                </div>
                <button 
                  onClick={() => setShowDemoLoginSuggestion(false)}
                  className="text-slate-400 hover:text-slate-600 p-1 rounded-full hover:bg-slate-50 transition-colors"
                >
                  <X size={18} />
                </button>
              </div>

              <div className="space-y-1.5">
                <h3 className="text-sm font-extrabold text-slate-900 leading-tight">
                  ¿Ventana bloqueada por el navegador?
                </h3>
                <p className="text-[11px] text-slate-500 leading-relaxed">
                  Los navegadores suelen bloquear ventanas emergentes de Google (OAuth) dentro de marcos de vista previa (iFrames).
                </p>
              </div>

              <div className="bg-slate-50 rounded-xl p-3 border border-slate-100 space-y-2">
                <p className="text-[10px] font-bold text-slate-600 uppercase tracking-wider">
                  Beneficios del Modo Demostración:
                </p>
                <ul className="text-[11px] text-slate-600 space-y-1.5">
                  <li className="flex items-start gap-2">
                    <span className="text-emerald-500 font-bold">✓</span>
                    <span><strong>Google Sheets:</strong> Sincroniza las citas en tiempo real.</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-emerald-500 font-bold">✓</span>
                    <span><strong>Google Calendar:</strong> Agenda las citas de tus clientes automáticamente.</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-emerald-500 font-bold">✓</span>
                    <span><strong>Google Drive:</strong> Sube de forma segura los comprobantes recibidos.</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-emerald-500 font-bold">✓</span>
                    <span><strong>Gmail:</strong> Envía reportes de asistencia en formato CSV.</span>
                  </li>
                </ul>
              </div>

              <div className="flex flex-col gap-2 pt-1">
                <button
                  type="button"
                  onClick={handleDemoSignIn}
                  className="w-full bg-[#004ac6] hover:bg-[#0049be] text-white font-bold py-2.5 px-4 rounded-xl text-xs transition-all shadow-md flex items-center justify-center gap-2 cursor-pointer"
                >
                  <ShieldCheck size={15} /> Activar Modo Demostración
                </button>
                <button
                  type="button"
                  onClick={() => setShowDemoLoginSuggestion(false)}
                  className="w-full bg-slate-100 hover:bg-slate-200 text-slate-600 font-bold py-2 px-4 rounded-xl text-xs transition-all text-center cursor-pointer"
                >
                  Continuar en Modo Local
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Dynamic Toast Alert */}
        {toastMessage && (
          <div className="fixed sm:absolute top-4 left-1/2 -translate-x-1/2 z-50 w-11/12 max-w-sm bg-slate-900 text-white text-xs font-semibold py-3 px-4 rounded-xl shadow-lg border border-slate-800 flex items-center gap-2.5 animate-slide-up">
            <div className="w-2 h-2 rounded-full bg-blue-400 animate-ping" />
            <span>{toastMessage}</span>
          </div>
        )}

        {/* Main Header */}
        {isClientMode ? (
          <header className="bg-gradient-to-r from-blue-600 to-indigo-600 py-4 px-4 sticky top-0 z-50 shadow-md text-white border-b border-blue-700 select-none text-center flex-shrink-0">
            <div className="flex flex-col items-center">
              <div className="flex items-center gap-1.5 justify-center">
                <Sparkles size={16} className="text-amber-300 animate-pulse" />
                <h1 className="text-base font-extrabold tracking-tight">Portal de Reservación Directa</h1>
              </div>
              <p className="text-[10px] text-blue-100 mt-0.5 font-medium">Reserva segura, validación instantánea por IA</p>
            </div>
          </header>
        ) : (
          <Header
            user={user}
            onLogin={handleLogin}
            onLogout={handleLogout}
            isLoggingIn={isLoggingIn}
            notificationCount={notifications.length}
            notifications={notifications}
          />
        )}

        {/* Primary Container */}
        <main className="flex-1 overflow-y-auto pb-4 bg-slate-50/40">
          {isClientMode ? (
            <PantallaRegistro
              user={user}
              accessToken={accessToken}
              addAppointment={addAppointment}
              onSuccessToast={showToast}
              setActiveTab={setActiveTab}
              paymentConfig={paymentConfig}
              services={services}
            />
          ) : (
            <>
              {activeTab === "nueva" && (
                <PantallaRegistro
                  user={user}
                  accessToken={accessToken}
                  addAppointment={addAppointment}
                  onSuccessToast={showToast}
                  setActiveTab={setActiveTab}
                  paymentConfig={paymentConfig}
                  services={services}
                />
              )}

              {activeTab === "agenda" && (
                <PantallaAgenda
                  appointments={appointments}
                  approveAppointmentPayment={approveAppointmentPayment}
                  rejectAppointmentPayment={rejectAppointmentPayment}
                  onSuccessToast={showToast}
                  isWorkspaceConnected={!!accessToken}
                />
              )}

              {activeTab === "recordatorios" && (
                <PantallaRecordatorios
                  appointments={appointments}
                  onSuccessToast={showToast}
                  paymentConfig={paymentConfig}
                />
              )}

              {activeTab === "estado" && (
                <PantallaEstado
                  appointments={appointments}
                  stats={stats}
                />
              )}

              {activeTab === "negocio" && (
                <PantallaNegocio
                  user={user}
                  accessToken={accessToken}
                  appointments={appointments}
                  services={services}
                  onSaveServices={saveServices}
                  paymentConfig={paymentConfig}
                  onSavePaymentConfig={savePaymentConfig}
                  triggerCleanup={triggerCleanup}
                  triggerMonthlyReportEmail={triggerMonthlyReportEmail}
                  onSuccessToast={showToast}
                />
              )}
            </>
          )}
        </main>

        {/* Bottom Tab Navigation Bar */}
        {!isClientMode && <TabNavigation activeTab={activeTab} setActiveTab={setActiveTab} />}
      </div>
    </div>
  );
}
