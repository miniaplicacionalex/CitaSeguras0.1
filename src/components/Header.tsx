import { useState, useRef, useEffect } from "react";
import { Bell, ShieldAlert, LogIn, LogOut, AlertTriangle, Clock, MessageSquare, ExternalLink } from "lucide-react";
import { User } from "firebase/auth";
import { AppNotification } from "../types";
import logoUrl from "../assets/images/citaseguras_logo_1783949144850.jpg";

interface HeaderProps {
  user: User | null;
  onLogin: () => void;
  onLogout: () => void;
  isLoggingIn: boolean;
  notificationCount: number;
  notifications?: AppNotification[];
}

export default function Header({
  user,
  onLogin,
  onLogout,
  isLoggingIn,
  notificationCount,
  notifications = [],
}: HeaderProps) {
  const [showDropdown, setShowDropdown] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Click outside detection
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setShowDropdown(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const getWhatsAppUrl = (phone: string, message: string) => {
    let cleanPhone = phone.replace(/\D/g, "");
    if (cleanPhone.length === 10) {
      cleanPhone = "52" + cleanPhone; // Default country code Mexico
    }
    return `https://wa.me/${cleanPhone}?text=${encodeURIComponent(message)}`;
  };

  return (
    <header className="bg-blue-600 py-3.5 px-4 sticky top-0 z-50 shadow-md text-white border-b border-blue-700 select-none">
      <div className="max-w-md mx-auto flex items-center justify-between">
        {/* Left: App Title and Workspace Indicator */}
        <div className="flex items-center gap-2.5">
          {user ? (
            <div className="relative group flex-shrink-0">
              <img
                src={
                  user.photoURL ||
                  logoUrl
                }
                alt="Profile"
                className="w-10 h-10 rounded-full object-cover border-2 border-white/80 shadow-sm"
                referrerPolicy="no-referrer"
              />
              <button
                onClick={onLogout}
                title="Cerrar sesión"
                className="absolute -bottom-1 -right-1 bg-rose-600 hover:bg-rose-700 p-1 rounded-full text-white border-2 border-blue-600 shadow transition-colors"
              >
                <LogOut size={9} />
              </button>
            </div>
          ) : (
            <button
              onClick={onLogin}
              disabled={isLoggingIn}
              title="Iniciar sesión con Google Workspace"
              className="flex items-center justify-center w-10 h-10 rounded-full bg-white/10 hover:bg-white/20 text-white transition-all border border-white/20 shadow-inner flex-shrink-0"
            >
              <LogIn size={16} className={isLoggingIn ? "animate-spin" : ""} />
            </button>
          )}

          <div className="flex flex-col">
            <div className="flex items-center gap-1.5">
              <h1 className="text-base font-extrabold tracking-tight">CitaSeguras</h1>
              <span className="bg-blue-500/40 text-blue-100 text-[9px] font-bold px-1.5 py-0.5 rounded border border-blue-400/30">
                v1.0 MVP
              </span>
            </div>
            {user ? (
              <span className="text-[10px] text-blue-100 font-medium truncate max-w-[120px]">
                {user.displayName || user.email}
              </span>
            ) : (
              <span className="text-[10px] text-blue-200/80 font-medium flex items-center gap-0.5">
                <ShieldAlert size={10} className="text-amber-300" /> Sin Google Workspace
              </span>
            )}
          </div>
        </div>

        {/* Right: Engine Badges & Notification Bell */}
        <div className="flex items-center gap-3 relative" ref={dropdownRef}>
          {/* Active Status Engine Badges */}
          <div className="hidden xs:flex items-center gap-2">
            <div className="flex -space-x-1.5">
              <div className="w-6 h-6 rounded-full border border-blue-600 bg-emerald-500 flex items-center justify-center text-[8px] text-white font-extrabold shadow-sm" title="Gemini AI Engine Active">
                AI
              </div>
              <div className={`w-6 h-6 rounded-full border border-blue-600 flex items-center justify-center text-[8px] text-white font-extrabold shadow-sm ${user ? "bg-blue-500" : "bg-slate-500/60"}`} title={user ? "Google Workspace Connected" : "Google Workspace Disconnected"}>
                G-W
              </div>
            </div>
            <span className="bg-blue-500/40 text-blue-100 text-[8px] px-2 py-0.5 rounded-full border border-blue-400/20 font-medium whitespace-nowrap">
              Active Engine
            </span>
          </div>

          {/* Bell Icon with click handler */}
          <button
            type="button"
            onClick={() => setShowDropdown(!showDropdown)}
            className="relative p-2 rounded-full hover:bg-white/10 transition-colors flex-shrink-0 cursor-pointer focus:outline-none"
            aria-label="Notificaciones"
          >
            <Bell size={20} className={notificationCount > 0 ? "text-amber-300 animate-pulse animate-duration-1000" : "text-white"} />
            {notificationCount > 0 && (
              <span className="absolute top-1 right-1 bg-rose-500 text-white text-[8px] font-extrabold w-4 h-4 rounded-full flex items-center justify-center border-2 border-blue-600 shadow-md">
                {notificationCount}
              </span>
            )}
          </button>

          {/* Dynamic Dropdown Card - Always positioned exactly next to/below the bell on all screen sizes */}
          {showDropdown && (
            <div className="absolute right-0 top-11 w-[230px] sm:w-[280px] bg-white rounded-xl shadow-2xl border border-slate-200/90 text-slate-800 z-50 overflow-hidden animate-slide-up">
              {/* Header */}
              <div className="bg-slate-50 px-2.5 py-1.5 border-b border-slate-100 flex items-center justify-between">
                <span className="text-[9px] font-extrabold text-slate-700 flex items-center gap-1">
                  🔔 Alertas Recurrentes
                </span>
                <span className="bg-rose-100 text-rose-700 text-[7.5px] font-black px-1.5 py-0.5 rounded-full">
                  {notifications.length} pendientes
                </span>
              </div>

              {/* List */}
              <div className="max-h-[220px] overflow-y-auto divide-y divide-slate-100">
                {notifications.length === 0 ? (
                  <div className="p-3.5 text-center text-slate-400 space-y-1">
                    <p className="text-base animate-bounce">✨</p>
                    <p className="text-[8px] font-medium leading-relaxed">¡Todo listo! No hay alertas hoy.</p>
                  </div>
                ) : (
                  notifications.map((notif) => {
                    const isVerification = notif.type === "por_verificar";
                    const is8h = notif.type === "recordatorio_8h";
                    const is2h = notif.type === "recordatorio_2h";

                    return (
                      <div key={notif.id} className="p-2 hover:bg-slate-50/75 transition-colors space-y-1">
                        <div className="flex items-start gap-1.5">
                          <div className={`mt-0.5 p-0.5 rounded flex-shrink-0 ${
                            isVerification ? "bg-amber-50 text-amber-600 border border-amber-100" :
                            is8h ? "bg-emerald-50 text-emerald-600 border border-emerald-100" :
                            "bg-orange-50 text-orange-600 border border-orange-100"
                          }`}>
                            {isVerification ? <AlertTriangle size={8} /> : <Clock size={8} />}
                          </div>
                          <div className="space-y-0.5 min-w-0 flex-1">
                            <p className="text-[8.5px] font-extrabold text-slate-800 leading-none">
                              {notif.title}
                            </p>
                            <p className="text-[8px] text-slate-500 font-semibold truncate">
                              {notif.description}
                            </p>
                          </div>
                        </div>

                        {/* Direct Anchor Action for 100% Free Auto-Opening click */}
                        <a
                          href={getWhatsAppUrl(notif.phone, notif.message)}
                          target="_blank"
                          rel="noopener noreferrer"
                          onClick={() => setShowDropdown(false)}
                          className={`w-full py-0.5 px-1.5 rounded text-[8px] font-black flex items-center justify-center gap-0.5 transition-all cursor-pointer shadow-sm ${
                            isVerification ? "bg-amber-600 hover:bg-amber-700 text-white" :
                            is8h ? "bg-emerald-600 hover:bg-emerald-700 text-white" :
                            "bg-orange-600 hover:bg-orange-700 text-white"
                          }`}
                        >
                          <MessageSquare size={8} /> Enviar WhatsApp
                          <ExternalLink size={6} className="opacity-80" />
                        </a>
                      </div>
                    );
                  })
                )}
              </div>

              {/* Disclaimer */}
              <div className="bg-slate-50 p-1.5 text-center border-t border-slate-100">
                <p className="text-[7px] text-slate-400 leading-none font-semibold">
                  💡 1-Click gratis: Abre WhatsApp listo para mandar.
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
