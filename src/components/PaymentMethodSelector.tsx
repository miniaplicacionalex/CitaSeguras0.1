import { Sparkles, Landmark, Store, CreditCard } from "lucide-react";

interface PaymentMethodSelectorProps {
  paymentMethod: "Tarjeta" | "OXXO" | "Transferencia";
  setPaymentMethod: (val: "Tarjeta" | "OXXO" | "Transferencia") => void;
  clearValidationResult: () => void;
  enableGateway?: boolean;
  gatewayProvider?: string;
  isClientMode?: boolean;
}

export default function PaymentMethodSelector({
  paymentMethod,
  setPaymentMethod,
  clearValidationResult,
  enableGateway = false,
  gatewayProvider = "Stripe",
  isClientMode = false,
}: PaymentMethodSelectorProps) {
  const showCardOption = enableGateway || !isClientMode;

  return (
    <div className="w-full space-y-2 text-left">
      <p className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
        Selecciona tu Método de Pago:
      </p>
      <div className={`grid grid-cols-1 ${showCardOption ? "sm:grid-cols-3" : "sm:grid-cols-2"} gap-2.5`}>
        {showCardOption && (
          <button
            type="button"
            onClick={() => {
              setPaymentMethod("Tarjeta");
              clearValidationResult();
            }}
            className={`flex flex-col items-start p-3 border-2 rounded-xl transition-all text-left cursor-pointer space-y-1 ${
              paymentMethod === "Tarjeta"
                ? "border-[#004ac6] bg-[#eff4ff] text-[#004ac6]"
                : "border-slate-200 bg-white hover:bg-slate-50 text-slate-600"
            }`}
          >
            <div className="flex items-center gap-1.5 font-bold text-xs">
              <CreditCard size={15} className={paymentMethod === "Tarjeta" ? "text-[#004ac6]" : "text-slate-400"} />
              <span>Tarjeta {isClientMode ? `(${gatewayProvider})` : "Manual"}</span>
              {paymentMethod === "Tarjeta" && isClientMode && (
                <span className="text-[8px] bg-emerald-500 text-white px-1.5 py-0.5 rounded-full flex items-center gap-0.5 font-bold animate-pulse">
                  <Sparkles size={8} /> Auto-Aprobación
                </span>
              )}
            </div>
            <span className="text-[9px] leading-relaxed font-semibold text-slate-500 block">
              {isClientMode 
                ? `Paga en línea tu anticipo mediante ${gatewayProvider} de forma segura con confirmación instantánea de cita.`
                : "Registra el pago directo con tarjeta de crédito o débito del cliente."}
            </span>
          </button>
        )}

        <button
          type="button"
          onClick={() => {
            setPaymentMethod("OXXO");
            clearValidationResult();
          }}
          className={`flex flex-col items-start p-3 border-2 rounded-xl transition-all text-left cursor-pointer space-y-1 ${
            paymentMethod === "OXXO"
              ? "border-[#004ac6] bg-[#eff4ff] text-[#004ac6]"
              : "border-slate-200 bg-white hover:bg-slate-50 text-slate-600"
          }`}
        >
          <div className="flex items-center gap-1.5 font-bold text-xs">
            <Store size={15} className={paymentMethod === "OXXO" ? "text-[#004ac6]" : "text-slate-400"} />
            <span>Depósitos en Efectivo</span>
            {paymentMethod === "OXXO" && (
              <span className="text-[8px] bg-amber-500 text-white px-1.5 py-0.5 rounded-full flex items-center gap-0.5 font-bold animate-pulse">
                <Sparkles size={8} /> Instantáneo
              </span>
            )}
          </div>
          <span className="text-[9px] leading-relaxed font-semibold text-slate-500 block">
            Oxxo (México) / Vía Baloto (Colombia) / Caja Vecina / Agentes BCP / Rapipago. Sube comprobante.
          </span>
        </button>

        <button
          type="button"
          onClick={() => {
            setPaymentMethod("Transferencia");
            clearValidationResult();
          }}
          className={`flex flex-col items-start p-3 border-2 rounded-xl transition-all text-left cursor-pointer space-y-1 ${
            paymentMethod === "Transferencia"
              ? "border-[#004ac6] bg-[#eff4ff] text-[#004ac6]"
              : "border-slate-200 bg-white hover:bg-slate-50 text-slate-600"
          }`}
        >
          <div className="flex items-center gap-1.5 font-bold text-xs">
            <Landmark size={15} className={paymentMethod === "Transferencia" ? "text-[#004ac6]" : "text-slate-400"} />
            <span>SPEI / Depósitos</span>
          </div>
          <span className="text-[9px] leading-relaxed font-semibold text-slate-500 block">
            Transferencia bancaria directa. El dueño proporciona la cuenta CLABE para transferir el anticipo.
          </span>
        </button>
      </div>
    </div>
  );
}

