export interface ServiceConfig {
  id: string;
  name: string;
  price: number;
  duration: string;
  depositPercentage: number; // e.g. 20, 50, 100
}

export interface Appointment {
  id: string;
  clientName: string;
  phone: string;
  email: string;
  service: string;
  date: string;
  time: string;
  amount: number; // Total amount
  depositAmountNeeded?: number; // Calculated reservation fee (e.g. amount * percentage / 100)
  paymentMethod: "Tarjeta" | "OXXO" | "Transferencia";
  paymentStatus: "Confirmado" | "Por Verificar" | "Cancelado" | "Reagendado";
  receiptUrl?: string;
  receiptStatus?: "APROBADO" | "RECHAZADO" | "PENDIENTE" | "NONE";
  geminiValidationLog?: string;
  calendarEventId?: string;
  sheetRowIndex?: number;
  absences: number;
}

export interface PaymentConfig {
  cardOrSpei: string;
  referenceType?: "tarjeta" | "clabe";
  bankName: string;
  accountHolder: string;
  alternativePayLink?: string;
  refundPolicyDisclaimer?: string; // Clear policy on cancel/no-show
  enableUrgencyBadges?: boolean;   // Urgency badges (e.g., "5 personas viendo")
  enableReservationTimer?: boolean; // Reservation seat countdown timer
  conversionTacticDiscount?: string; // Discount / incentive text
  whatsappTemplatePending?: string;
  whatsappTemplateConfirmed?: string;
  whatsappTemplate8h?: string;
  whatsappTemplate2h?: string;
  enableGateway?: boolean;          // Enable automated credit card gateway (Stripe/MercadoPago)
  gatewayProvider?: "Stripe" | "MercadoPago" | "PayPal";
  gatewayApiKey?: string;           // Merchant gateway API Key
}

export interface BusinessStats {
  attendanceRate: number;
  confirmedCount: number;
  rescheduledCount: number;
}

export interface GeminiValidationResult {
  isValidLogo: boolean;
  isToday: boolean;
  amountMatches: boolean;
  extractedAmount: number;
  extractedDate: string;
  status: "APROBADO" | "RECHAZADO";
  reason: string;
}

export interface AppNotification {
  id: string;
  appointmentId: string;
  clientName: string;
  phone: string;
  type: "por_verificar" | "recordatorio_8h" | "recordatorio_2h";
  title: string;
  description: string;
  message: string;
}

