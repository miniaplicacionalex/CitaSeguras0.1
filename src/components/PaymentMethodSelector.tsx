import { Sparkles, Landmark, Store } from "lucide-react";

interface PaymentMethodSelectorProps {
  paymentMethod: "Tarjeta" | "OXXO" | "Transferencia";
  setPaymentMethod: (val: "Tarjeta" | "OXXO" | "Transferencia") => void;
  clearValidationResult: () => void;
}

export default function PaymentMethodSelector({
  paymentMethod,
  setPaymentMethod,
  clearValidationResult,
}: PaymentMethodSelectorProps) {
  return (
    <div className="w-full space-y-2">
      <p className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
        Selecciona tu Método de Pago:
      </p>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
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
            Oxxo (México) / Vía Baloto (Colombia) / Caja Vecina (Chile) / Agentes BCP (Perú) / Red Pagos / Abitab (Uruguay) / Pago Fácil / Rapipago (Argentina)
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
            Transferencia bancaria directa. El dueño del negocio proporciona la cuenta de referencia para que realices tu pago de forma segura.
          </span>
        </button>
      </div>
    </div>
  );
}

