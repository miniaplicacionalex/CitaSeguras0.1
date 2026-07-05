import { initializeApp } from "firebase/app";
import {
  getAuth,
  signInWithPopup,
  GoogleAuthProvider,
  onAuthStateChanged,
  User,
} from "firebase/auth";
import firebaseConfig from "../../firebase-applet-config.json";

// Initialize Firebase App
const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);

const provider = new GoogleAuthProvider();
// Add required Google Workspace scopes
provider.addScope("https://www.googleapis.com/auth/calendar");
provider.addScope("https://www.googleapis.com/auth/drive.file");
provider.addScope("https://www.googleapis.com/auth/spreadsheets");
provider.addScope("https://www.googleapis.com/auth/gmail.send");

let isSigningIn = false;
let cachedAccessToken: string | null = null;

// Initialize auth state listener
export const initAuth = (
  onAuthSuccess?: (user: User, token: string) => void,
  onAuthFailure?: () => void
) => {
  return onAuthStateChanged(auth, async (user: User | null) => {
    if (user) {
      if (cachedAccessToken) {
        if (onAuthSuccess) onAuthSuccess(user, cachedAccessToken);
      } else {
        // If we have a user but no cached token, we can sign in again or clear
        // Wait, usually we need to re-login to get the Google access token in popup
        // But for testing, if the token is not cached, we fallback to local-mode
        if (onAuthFailure) onAuthFailure();
      }
    } else {
      cachedAccessToken = null;
      if (onAuthFailure) onAuthFailure();
    }
  });
};

// Sign in with Google (Popup)
export const googleSignIn = async (): Promise<{ user: User; accessToken: string } | null> => {
  try {
    isSigningIn = true;
    const result = await signInWithPopup(auth, provider);
    const credential = GoogleAuthProvider.credentialFromResult(result);
    if (!credential?.accessToken) {
      throw new Error("No se pudo obtener el token de acceso de Google.");
    }
    cachedAccessToken = credential.accessToken;
    return { user: result.user, accessToken: cachedAccessToken };
  } catch (error: any) {
    console.error("Error en Google Sign-In:", error);
    throw error;
  } finally {
    isSigningIn = false;
  }
};

// Get current cached token
export const getAccessToken = (): string | null => {
  return cachedAccessToken;
};

// Log out
export const logout = async () => {
  await auth.signOut();
  cachedAccessToken = null;
};

// ==========================================
// GOOGLE WORKSPACE API REST CALLS
// ==========================================

/**
 * 1. Google Sheets Integration
 */
export async function setupGoogleSheet(token: string): Promise<string> {
  if (token.startsWith("demo-access-token")) {
    console.log("SIMULACIÓN: Configurando Google Sheet para la Base de Datos...");
    return "spreadsheet_demo_12345";
  }
  // Try to find if a sheet with name "CitaSeguras_Database" exists, otherwise create it.
  try {
    // Search Drive for the file
    const searchResponse = await fetch(
      "https://www.googleapis.com/drive/v3/files?q=name='CitaSeguras_Database' and mimeType='application/vnd.google-apps.spreadsheet' and trashed=false",
      {
        headers: { Authorization: `Bearer ${token}` },
      }
    );
    const searchData = await searchResponse.json();
    if (searchData.files && searchData.files.length > 0) {
      return searchData.files[0].id;
    }

    // Create a new sheet
    const createResponse = await fetch("https://sheets.googleapis.com/v4/spreadsheets", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        properties: {
          title: "CitaSeguras_Database",
        },
        sheets: [
          {
            properties: {
              title: "Citas",
            },
            data: [
              {
                startRow: 0,
                startColumn: 0,
                rowData: [
                  {
                    values: [
                      { userEnteredValue: { stringValue: "ID" } },
                      { userEnteredValue: { stringValue: "Cliente" } },
                      { userEnteredValue: { stringValue: "Teléfono" } },
                      { userEnteredValue: { stringValue: "Correo" } },
                      { userEnteredValue: { stringValue: "Servicio" } },
                      { userEnteredValue: { stringValue: "Fecha" } },
                      { userEnteredValue: { stringValue: "Hora" } },
                      { userEnteredValue: { stringValue: "Monto" } },
                      { userEnteredValue: { stringValue: "Método Pago" } },
                      { userEnteredValue: { stringValue: "Estado Pago" } },
                      { userEnteredValue: { stringValue: "Evidencia URL" } },
                      { userEnteredValue: { stringValue: "Resultado IA" } },
                    ],
                  },
                ],
              },
            ],
          },
        ],
      }),
    });
    const sheetData = await createResponse.json();
    return sheetData.spreadsheetId;
  } catch (error) {
    console.error("Error setting up Google Sheet:", error);
    throw error;
  }
}

export async function addAppointmentToSheet(
  token: string,
  spreadsheetId: string,
  appointment: any
): Promise<number> {
  if (token.startsWith("demo-access-token")) {
    console.log("SIMULACIÓN: Sincronizando cita en Google Sheet...", appointment);
    return Math.floor(Math.random() * 50) + 3;
  }
  try {
    const range = "Citas!A:L";
    const response = await fetch(
      `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/${range}:append?valueInputOption=USER_ENTERED`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          values: [
            [
              appointment.id,
              appointment.clientName,
              appointment.phone,
              appointment.email,
              appointment.service,
              appointment.date,
              appointment.time,
              appointment.amount,
              appointment.paymentMethod,
              appointment.paymentStatus,
              appointment.receiptUrl || "",
              appointment.receiptStatus || "NONE",
            ],
          ],
        }),
      }
    );
    const data = await response.json();
    // Parse response to find out which row was added
    const updatedRange = data.updates?.updatedRange; // e.g., "Citas!A5:L5"
    if (updatedRange) {
      const match = updatedRange.match(/A(\d+):/);
      if (match) return parseInt(match[1]);
    }
    return 1;
  } catch (error) {
    console.error("Error adding appointment to sheet:", error);
    return 1;
  }
}

export async function updateAppointmentInSheet(
  token: string,
  spreadsheetId: string,
  rowIndex: number,
  status: string,
  receiptUrl?: string,
  receiptStatus?: string
): Promise<boolean> {
  if (token.startsWith("demo-access-token")) {
    console.log(`SIMULACIÓN: Actualizando cita en la fila ${rowIndex} de Google Sheets a estado: ${status}`);
    return true;
  }
  try {
    // We update columns J (Payment Status), K (Receipt URL), L (Receipt Status)
    // Col J is column 10, K is 11, L is 12
    const range = `Citas!J${rowIndex}:L${rowIndex}`;
    const response = await fetch(
      `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/${range}?valueInputOption=USER_ENTERED`,
      {
        method: "PUT",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          values: [[status, receiptUrl || "", receiptStatus || ""]],
        }),
      }
    );
    return response.ok;
  } catch (error) {
    console.error("Error updating sheet:", error);
    return false;
  }
}

/**
 * 2. Google Calendar Integration
 */
export async function scheduleCalendarEvent(token: string, appointment: any): Promise<string> {
  if (token.startsWith("demo-access-token")) {
    console.log("SIMULACIÓN: Agendando evento en Google Calendar...", appointment);
    return "demo-event-" + Math.floor(Math.random() * 100000);
  }
  try {
    const startDateTime = `${appointment.date}T${convertTimeTo24h(appointment.time)}:00`;
    // Add 1 hour duration
    const endDate = new Date(new Date(startDateTime).getTime() + 60 * 60 * 1000);
    const endDateTime = endDate.toISOString().split(".")[0];

    const response = await fetch("https://www.googleapis.com/calendar/v3/calendars/primary/events", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        summary: `CitaSeguras: ${appointment.clientName} - ${appointment.service}`,
        description: `Cita agendada y verificada mediante CitaSeguras.\nContacto: ${appointment.phone}\nCorreo: ${appointment.email}\nMonto: $${appointment.amount} MXN\nMétodo de Pago: ${appointment.paymentMethod}`,
        start: {
          dateTime: startDateTime,
          timeZone: "America/Mexico_City",
        },
        end: {
          dateTime: endDateTime,
          timeZone: "America/Mexico_City",
        },
        reminders: {
          useDefault: false,
          overrides: [
            { method: "popup", minutes: 30 },
            { method: "email", minutes: 120 },
          ],
        },
      }),
    });
    const data = await response.json();
    return data.id || "";
  } catch (error) {
    console.error("Error creating Google Calendar event:", error);
    return "";
  }
}

/**
 * Helper to convert 12h time (10:30 AM) to 24h format (10:30) or (14:15)
 */
function convertTimeTo24h(time12h: string): string {
  const [time, modifier] = time12h.split(" ");
  let [hours, minutes] = time.split(":");
  if (hours === "12") {
    hours = "00";
  }
  if (modifier === "PM") {
    hours = String(parseInt(hours, 10) + 12);
  }
  if (hours.length === 1) {
    hours = "0" + hours;
  }
  return `${hours}:${minutes}`;
}

/**
 * 3. Google Drive Integration
 */
export async function getOrCreateDriveFolder(token: string): Promise<string> {
  if (token.startsWith("demo-access-token")) {
    console.log("SIMULACIÓN: Creando/Obteniendo carpeta en Google Drive...");
    return "demo-folder-id-12345";
  }
  try {
    const searchResponse = await fetch(
      "https://www.googleapis.com/drive/v3/files?q=name='CitaSeguras_Comprobantes' and mimeType='application/vnd.google-apps.folder' and trashed=false",
      {
        headers: { Authorization: `Bearer ${token}` },
      }
    );
    const searchData = await searchResponse.json();
    if (searchData.files && searchData.files.length > 0) {
      return searchData.files[0].id;
    }

    const createResponse = await fetch("https://www.googleapis.com/drive/v3/files", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        name: "CitaSeguras_Comprobantes",
        mimeType: "application/vnd.google-apps.folder",
      }),
    });
    const folder = await createResponse.json();
    return folder.id;
  } catch (error) {
    console.error("Error getting or creating Google Drive folder:", error);
    throw error;
  }
}

export async function uploadReceiptToDrive(
  token: string,
  folderId: string,
  fileName: string,
  imageBase64: string,
  mimeType: string = "image/png"
): Promise<string> {
  if (token.startsWith("demo-access-token")) {
    console.log("SIMULACIÓN: Subiendo comprobante a Google Drive...", fileName);
    return "https://images.unsplash.com/photo-1554415707-6e8cfc93fe23?q=80&w=600&auto=format&fit=crop";
  }
  try {
    const cleanBase64 = imageBase64.replace(/^data:image\/\w+;base64,/, "");
    // Convert base64 to binary ArrayBuffer
    const byteCharacters = atob(cleanBase64);
    const byteNumbers = new Array(byteCharacters.length);
    for (let i = 0; i < byteCharacters.length; i++) {
      byteNumbers[i] = byteCharacters.charCodeAt(i);
    }
    const byteArray = new Uint8Array(byteNumbers);
    const blob = new Blob([byteArray], { type: mimeType });

    const metadata = {
      name: fileName,
      parents: [folderId],
    };

    const form = new FormData();
    form.append("metadata", new Blob([JSON.stringify(metadata)], { type: "application/json" }));
    form.append("file", blob);

    const response = await fetch(
      "https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart&fields=id,webViewLink",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: form,
      }
    );
    const data = await response.json();
    return data.webViewLink || `https://drive.google.com/file/d/${data.id}/view`;
  } catch (error) {
    console.error("Error uploading receipt to Google Drive:", error);
    return "";
  }
}

/**
 * 4. Gmail Report Sending Integration
 */
export async function sendGmailReport(
  token: string,
  toEmail: string,
  csvContent: string,
  monthName: string
): Promise<boolean> {
  if (token.startsWith("demo-access-token")) {
    console.log(`SIMULACIÓN: Enviando reporte mensual por Gmail a ${toEmail}...`);
    return true;
  }
  try {
    const subject = `CitaSeguras - Reporte Mensual de Asistencia: ${monthName}`;
    const bodyText = `Hola,\n\nSe adjunta el reporte de asistencia mensual del sistema CitaSeguras para el mes de ${monthName}.\n\nEste reporte contiene métricas de asistencia, confirmaciones, reincidentes y estados de pago.\n\nAtentamente,\nEquipo CitaSeguras.`;

    // Encode report in Base64 for the Gmail attachment
    const base64Csv = btoa(unescape(encodeURIComponent(csvContent)));

    // Construct MIME message
    const boundary = "foo_bar_baz";
    const mimeParts = [
      `To: ${toEmail}`,
      `Subject: =?utf-8?B?${btoa(unescape(encodeURIComponent(subject)))}?=`,
      `MIME-Version: 1.0`,
      `Content-Type: multipart/mixed; boundary="${boundary}"`,
      ``,
      `--${boundary}`,
      `Content-Type: text/plain; charset="UTF-8"`,
      `Content-Transfer-Encoding: 7bit`,
      ``,
      bodyText,
      ``,
      `--${boundary}`,
      `Content-Type: text/csv; name="Reporte_CitaSeguras_${monthName.replace(/\s+/g, "_")}.csv"`,
      `Content-Disposition: attachment; filename="Reporte_CitaSeguras_${monthName.replace(/\s+/g, "_")}.csv"`,
      `Content-Transfer-Encoding: base64`,
      ``,
      base64Csv,
      ``,
      `--${boundary}--`,
    ];

    const rawMessage = btoa(unescape(encodeURIComponent(mimeParts.join("\r\n"))))
      .replace(/\+/g, "-")
      .replace(/\//g, "_")
      .replace(/=+$/, "");

    const response = await fetch("https://gmail.googleapis.com/gmail/v1/users/me/messages/send", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        raw: rawMessage,
      }),
    });
    return response.ok;
  } catch (error) {
    console.error("Error sending Gmail:", error);
    return false;
  }
}
