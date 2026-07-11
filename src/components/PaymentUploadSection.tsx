import React from "react";
import { 
  UploadCloud, 
  CheckCircle, 
  AlertCircle, 
  Sparkles, 
  Loader2 
} from "lucide-react";
import { PaymentConfig, GeminiValidationResult } from "../types";

interface PaymentUploadSectionProps {
  paymentMethod: "Tarjeta" | "OXXO" | "Transferencia";
  paymentConfig: PaymentConfig;
  amount: number;
  depositPercentage: number;
  depositAmountNeeded: number;
  previewUrl: string | null;
  file: File | null;
  dragActive: boolean;
  base64Data: string | null;
  isValidating: boolean;
  validationResult: GeminiValidationResult | null;
  handleDrag: (e: React.DragEvent) => void;
  handleDrop: (e: React.DragEvent) => void;
  handleFileChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  handleUseDemoTicket: () => void;
  handleAIValidate: () => void;
  onRemoveFoto: () => void;
  fileInputRef: React.RefObject<HTMLInputElement>;
  cardName: string;
  setCardName: (val: string) => void;
  cardNumber: string;
  setCardNumber: (val: string) => void;
  cardExpiry: string;
  setCardExpiry: (val: string) => void;
  cardCvv: string;
  setCardCvv: (val: string) => void;
}

export default function PaymentUploadSection({
  paymentMethod,
  paymentConfig,
  amount,
  depositPercentage,
  depositAmountNeeded,
  previewUrl,
  file,
  dragActive,
  base64Data,
  isValidating,
  validationResult,
  handleDrag,
  handleDrop,
  handleFileChange,
  handleUseDemoTicket,
  handleAIValidate,
  onRemoveFoto,
  fileInputRef,
  cardName,
  setCardName,
  cardNumber,
  setCardNumber,
  cardExpiry,
  setCardExpiry,
  cardCvv,
  setCardCvv,
}: PaymentUploadSectionProps) {
  if (paymentMethod === "Tarjeta") {
    return (
      <div className="space-y-4 animate-fade-in pt-2">
        {/* Real-time Credit Card Visualization */}
        <div className="relative w-full h-40 bg-gradient-to-br from-slate-900 to-slate-800 rounded-2xl p-5 text-white flex flex-col justify-between shadow-lg overflow-hidden border border-slate-700 select-none">
          {/* Chip and Card Type */}
          <div className="flex justify-between items-start">
            <div className="w-10 h-7 bg-amber-400/80 rounded-md border border-amber-300 flex items-center justify-center opacity-90">
              <div className="w-6 h-4 border border-slate-900/10 rounded flex grid grid-cols-3 gap-0.5"></div>
            </div>
            <span className="text-xs font-bold tracking-widest text-slate-400">VISA / MASTERCARD</span>
          </div>

          {/* Card Number */}
          <div className="font-mono text-base tracking-[0.2em] font-semibold text-center my-2 text-slate-100">
            {cardNumber || "•••• •••• •••• ••••"}
          </div>

          {/* Holder and Expiry */}
          <div className="flex justify-between items-end text-[10px] uppercase font-mono tracking-wider">
            <div>
              <p className="text-slate-500 text-[8px]">Titular</p>
              <p className="font-bold truncate max-w-[200px]">{cardName || "Nombre del Titular"}</p>
            </div>
            <div className="text-right">
              <p className="text-slate-500 text-[8px]">Vence</p>
              <p className="font-bold">{cardExpiry || "MM/AA"}</p>
            </div>
          </div>

          {/* Decorative background circle */}
          <div className="absolute -right-10 -bottom-10 w-24 h-24 bg-blue-600/15 rounded-full blur-xl"></div>
        </div>

        {/* Form Fields */}
        <div className="space-y-3">
          <div>
            <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">
              Nombre en la Tarjeta
            </label>
            <input
              type="text"
              required
              placeholder="Nombre del dueño de la tarjeta"
              value={cardName}
              onChange={(e) => setCardName(e.target.value)}
              className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg outline-none focus:border-[#004ac6] focus:ring-1 focus:ring-[#004ac6] transition-all text-slate-800 bg-white font-sans"
            />
          </div>

          <div>
            <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">
              Número de Tarjeta (16 dígitos)
            </label>
            <input
              type="text"
              required
              maxLength={19}
              placeholder="0000 0000 0000 0000"
              value={cardNumber}
              onChange={(e) => {
                let value = e.target.value.replace(/\D/g, "");
                let formatted = "";
                for (let i = 0; i < value.length && i < 16; i++) {
                  if (i > 0 && i % 4 === 0) {
                    formatted += " ";
                  }
                  formatted += value[i];
                }
                setCardNumber(formatted);
              }}
              className="w-full px-3 py-2 text-xs font-mono border border-slate-200 rounded-lg outline-none focus:border-[#004ac6] focus:ring-1 focus:ring-[#004ac6] transition-all text-slate-800 bg-white"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">
                Vigencia (MM/AA)
              </label>
              <input
                type="text"
                required
                maxLength={5}
                placeholder="MM/AA"
                value={cardExpiry}
                onChange={(e) => {
                  let value = e.target.value.replace(/\D/g, "");
                  if (value.length > 2) {
                    value = value.substring(0, 2) + "/" + value.substring(2, 4);
                  }
                  setCardExpiry(value);
                }}
                className="w-full px-3 py-2 text-xs font-mono border border-slate-200 rounded-lg outline-none focus:border-[#004ac6] focus:ring-1 focus:ring-[#004ac6] transition-all text-slate-800 bg-white"
              />
            </div>

            <div>
              <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">
                CVV
              </label>
              <input
                type="password"
                required
                maxLength={4}
                placeholder="•••"
                value={cardCvv}
                onChange={(e) => {
                  const value = e.target.value.replace(/\D/g, "");
                  setCardCvv(value);
                }}
                className="w-full px-3 py-2 text-xs font-mono border border-slate-200 rounded-lg outline-none focus:border-[#004ac6] focus:ring-1 focus:ring-[#004ac6] transition-all text-slate-800 bg-white"
              />
            </div>
          </div>
          
          {paymentConfig.conversionTacticDiscount && (
            <div className="bg-emerald-50 border border-emerald-100 text-emerald-950 p-2.5 rounded-lg text-[10px] leading-relaxed flex items-start gap-1.5 animate-pulse mt-1">
              <span className="text-xs">🎁</span>
              <div>
                <p className="font-bold text-emerald-800">Incentivo Aplicado:</p>
                <p className="text-emerald-700">{paymentConfig.conversionTacticDiscount}</p>
              </div>
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-3 animate-fade-in pt-2">
      <div className="bg-blue-50/75 border border-blue-100 rounded-lg p-3 text-xs text-blue-950 space-y-2">
        <p className="font-bold text-blue-900 flex items-center gap-1">
          📋 Instrucciones de Anticipo ({depositPercentage}%):
        </p>
        
        <div className="space-y-1 bg-white p-2.5 rounded-md border border-blue-100 font-sans shadow-sm">
          <div className="flex justify-between border-b border-slate-100 pb-1">
            <span className="text-slate-500 font-medium text-[10px]">MÉTODO:</span>
            <span className="font-bold text-slate-800 text-[10px] uppercase">
              {paymentMethod === "OXXO" ? "Depósito OXXO" : "Transferencia SPEI"}
            </span>
          </div>

          {paymentConfig.bankName && (
            <div className="flex justify-between border-b border-slate-100 py-1">
              <span className="text-slate-500 font-medium text-[10px]">BANCO:</span>
              <span className="font-bold text-slate-800 text-[10px]">{paymentConfig.bankName}</span>
            </div>
          )}

          {paymentConfig.cardOrSpei && (
            <div className="py-1">
              <p className="text-slate-500 font-medium text-[10px] uppercase">
                {paymentConfig.referenceType === "clabe" 
                  ? "CLABE Interbancaria (18 dígitos):" 
                  : "Número de Tarjeta de Débito (16 dígitos):"}
              </p>
              <p className="font-mono text-xs font-bold bg-slate-50 px-2 py-1.5 rounded border border-slate-100 text-center select-all my-1 text-slate-800 tracking-wider">
                {paymentConfig.cardOrSpei}
              </p>
              <p className="text-[8px] text-slate-400 text-center italic mt-0.5">
                💡 Toca dos veces sobre el número para copiarlo
              </p>
            </div>
          )}

          {paymentConfig.accountHolder && (
            <div className="flex justify-between border-t border-slate-100 pt-1">
              <span className="text-slate-500 font-medium text-[10px]">TITULAR:</span>
              <span className="font-bold text-slate-800 text-[10px] truncate max-w-[150px]" title={paymentConfig.accountHolder}>
                {paymentConfig.accountHolder}
              </span>
            </div>
          )}
          
          <div className="flex justify-between border-t border-slate-100 pt-1 text-[#004ac6] font-bold">
            <span className="text-[10px]">ANTICIPO REQUERIDO:</span>
            <span className="text-xs">${depositAmountNeeded} MXN ({depositPercentage}%)</span>
          </div>
        </div>

        {paymentConfig.alternativePayLink && (
          <div className="bg-emerald-50 border border-emerald-100 text-emerald-950 p-2 rounded-md text-[11px]">
            <span className="font-bold">🔗 Enlace de Pago Alternativo:</span>{" "}
            <a 
              href={paymentConfig.alternativePayLink} 
              target="_blank" 
              rel="noopener noreferrer" 
              className="text-emerald-700 font-bold hover:underline break-all"
            >
              {paymentConfig.alternativePayLink}
            </a>
          </div>
        )}

        {paymentConfig.refundPolicyDisclaimer && (
          <div className="bg-rose-50 border border-rose-100 text-rose-950 p-2.5 rounded-lg text-[10px] leading-relaxed">
            <p className="font-bold text-rose-800 mb-0.5">⚠️ Política de Reserva y Cancelación:</p>
            <p className="text-rose-700">{paymentConfig.refundPolicyDisclaimer}</p>
          </div>
        )}

        <p className="text-slate-600 text-[10px] leading-relaxed">
          Realiza el pago del anticipo de reserva por el monto exacto de <strong className="text-slate-800">${depositAmountNeeded} MXN</strong> ({depositPercentage}% del total de ${amount} MXN). Sube tu comprobante para validación automática por IA.
        </p>
      </div>

      {/* Drag and Drop Zone */}
      <div
        onDragEnter={handleDrag}
        onDragOver={handleDrag}
        onDragLeave={handleDrag}
        onDrop={handleDrop}
        className={`border-2 border-dashed rounded-xl p-4 flex flex-col items-center justify-center text-center transition-all cursor-pointer ${
          dragActive
            ? "border-[#004ac6] bg-blue-50"
            : previewUrl
            ? "border-slate-300 bg-slate-50"
            : "border-slate-300 hover:border-slate-400 hover:bg-slate-50"
        }`}
        onClick={() => fileInputRef.current?.click()}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          onChange={handleFileChange}
          className="hidden"
        />

        {previewUrl ? (
          <div className="space-y-2 w-full flex flex-col items-center">
            <img
              src={previewUrl}
              alt="Comprobante"
              className="h-28 object-contain rounded border border-slate-300"
              referrerPolicy="no-referrer"
            />
            <p className="text-[10px] text-slate-500 font-medium truncate max-w-[200px]">
              {file?.name || "oxxo_deposito.png"}
            </p>
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onRemoveFoto();
              }}
              className="text-xs text-red-500 font-semibold hover:underline"
            >
              Remover foto
            </button>
          </div>
        ) : (
          <div className="space-y-1 flex flex-col items-center">
            <UploadCloud size={28} className="text-slate-400" />
            <p className="text-xs font-semibold text-slate-700">
              Sube tu comprobante de pago
            </p>
            <p className="text-[10px] text-slate-400">
              Arrastra la imagen o haz clic para buscar
            </p>
          </div>
        )}
      </div>

      {/* Demo Action Buttons */}
      <div className="flex gap-2">
        <button
          type="button"
          onClick={handleUseDemoTicket}
          className="flex-1 text-[11px] font-semibold text-[#004ac6] border border-[#004ac6] hover:bg-blue-50 py-1.5 px-2 rounded-lg transition-colors flex items-center justify-center gap-1.5 cursor-pointer bg-white"
        >
          💡 Usar Ticket Demo OXXO
        </button>

        {base64Data && !validationResult && (
          <button
            type="button"
            onClick={handleAIValidate}
            disabled={isValidating}
            className="flex-1 bg-[#004ac6] hover:bg-[#0049be] text-white text-[11px] font-bold py-1.5 px-2 rounded-lg transition-all flex items-center justify-center gap-1.5 shadow-sm disabled:opacity-50 cursor-pointer"
          >
            {isValidating ? (
              <>
                <Loader2 size={12} className="animate-spin" />
                Validando...
              </>
            ) : (
              <>
                <Sparkles size={12} className="text-amber-300 fill-amber-300 animate-pulse" />
                Validar por IA
              </>
            )}
          </button>
        )}
      </div>

      {/* Validation Response Panel */}
      {isValidating && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 flex items-center gap-3 animate-pulse">
          <Loader2 size={18} className="animate-spin text-[#004ac6] flex-shrink-0" />
          <div className="text-[11px] text-[#004ac6] space-y-0.5">
            <p className="font-bold">Analizando ticket con Gemini AI...</p>
            <p>Verificando logo OXXO, fecha de hoy y monto del anticipo de ${depositAmountNeeded} MXN...</p>
          </div>
        </div>
      )}

      {validationResult && (
        <div
          className={`border rounded-lg p-3 text-xs space-y-2 animate-fade-in ${
            validationResult.status === "APROBADO"
              ? "bg-emerald-50 border-emerald-200 text-emerald-900"
              : "bg-rose-50 border-rose-200 text-rose-900"
          }`}
        >
          <div className="flex items-center justify-between pb-1.5 border-b border-black/5">
            <span className="font-bold flex items-center gap-1.5 text-sm">
              {validationResult.status === "APROBADO" ? (
                <>
                  <CheckCircle size={16} className="text-emerald-600" /> ¡PAGO APROBADO!
                </>
              ) : (
                <>
                  <AlertCircle size={16} className="text-rose-600" /> RECHAZADO POR IA
                </>
              )}
            </span>
            <span className="text-[10px] uppercase font-mono px-1.5 py-0.5 rounded bg-black/5">
              Gemini Verified
            </span>
          </div>

          <div className="grid grid-cols-3 gap-2 text-[10px] text-center font-semibold">
            <div className="bg-black/5 rounded p-1">
              <p className="text-black/40 text-[8px] uppercase">Logo OXXO</p>
              <p className="mt-0.5">{validationResult.isValidLogo ? "✅ Real" : "❌ No detectado"}</p>
            </div>
            <div className="bg-black/5 rounded p-1">
              <p className="text-black/40 text-[8px] uppercase">Fecha de Hoy</p>
              <p className="mt-0.5">{validationResult.isToday ? "✅ Correcta" : "❌ Incorrecta"}</p>
            </div>
            <div className="bg-black/5 rounded p-1">
              <p className="text-black/40 text-[8px] uppercase">Monto</p>
              <p className="mt-0.5">{validationResult.amountMatches ? "✅ Coincide" : "❌ Diferente"}</p>
            </div>
          </div>

          <div className="text-[11px] bg-white/40 p-2 rounded border border-black/5">
            <p className="font-semibold text-slate-700">Análisis detallado de Gemini:</p>
            <p className="text-slate-600 mt-0.5 leading-relaxed">{validationResult.reason}</p>
            {validationResult.extractedAmount > 0 && (
              <p className="text-[10px] text-slate-500 mt-1">
                Monto Extraído: <span className="font-bold">${validationResult.extractedAmount} MXN</span> 
                {validationResult.extractedDate && ` | Fecha: ${validationResult.extractedDate}`}
              </p>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
