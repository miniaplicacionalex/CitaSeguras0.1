import { JWT } from "google-auth-library";
import { ServiceConfig, PaymentConfig, Appointment } from "../types";

// Parse environment variables
const clientEmail = process.env.CORREO_ELECTRÓNICO_DE_LA_CUENTA_DE_SERVICE;
const privateKey = (process.env.CLAVE_PRIVADA_DE_GOOGLE || "").replace(/\\n/g, "\n").trim();
const spreadsheetId = process.env.ID_DE_HOJA_DE_GOOGLE;

// Lazy initialize JWT client
let jwtClient: JWT | null = null;

function getJwtClient(): JWT | null {
  if (!clientEmail || !privateKey || !spreadsheetId) {
    console.warn("Google Sheets Service Account credentials are not fully configured in environment variables.");
    return null;
  }
  if (!jwtClient) {
    jwtClient = new JWT({
      email: clientEmail,
      key: privateKey,
      scopes: ["https://www.googleapis.com/auth/spreadsheets"],
    });
  }
  return jwtClient;
}

/**
 * Gets HTTP authorization headers using the Service Account JWT
 */
async function getAuthHeaders(): Promise<Record<string, string>> {
  const client = getJwtClient();
  if (!client) {
    throw new Error("No Google Sheets client configured. Check your environment variables.");
  }
  const headers = await client.getRequestHeaders() as any;
  const result: Record<string, string> = {
    "Content-Type": "application/json",
  };
  
  const authHeader = headers.Authorization || headers.authorization;
  if (authHeader) {
    result["Authorization"] = String(authHeader);
  }
  return result;
}

/**
 * Helper to ensure necessary Sheets (Citas, Catalogos, Suscripciones) exist in the Spreadsheet
 */
export async function initializeSheets(): Promise<boolean> {
  const client = getJwtClient();
  if (!client || !spreadsheetId) return false;

  try {
    const headers = await getAuthHeaders();
    
    // Get spreadsheet details to check existing sheet titles
    const res = await fetch(`https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}`, {
      headers,
    });
    
    if (!res.ok) {
      console.error("Failed to fetch spreadsheet info:", await res.text());
      return false;
    }

    const data = await res.json();
    const sheetTitles = (data.sheets || []).map((s: any) => s.properties.title);
    
    const requiredSheets = ["Citas", "Catalogos", "Suscripciones"];
    const sheetsToAdd = requiredSheets.filter(title => !sheetTitles.includes(title));
    
    if (sheetsToAdd.length === 0) {
      return true;
    }

    console.log(`Initializing missing sheets: ${sheetsToAdd.join(", ")}`);
    const requests = sheetsToAdd.map(title => ({
      addSheet: {
        properties: { title }
      }
    }));

    const updateRes = await fetch(`https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}:batchUpdate`, {
      method: "POST",
      headers,
      body: JSON.stringify({ requests }),
    });

    if (!updateRes.ok) {
      console.error("Failed to initialize missing sheets:", await updateRes.text());
      return false;
    }

    // Initialize headers in the newly created sheets
    await setupSheetHeaders(headers);
    return true;
  } catch (error) {
    console.error("Error in initializeSheets:", error);
    return false;
  }
}

/**
 * Helper to setup default headers in Sheets
 */
async function setupSheetHeaders(headers: Record<string, string>): Promise<void> {
  if (!spreadsheetId) return;

  const initialHeaders = [
    {
      range: "Citas!A1:O1",
      values: [["ID Cita", "Cliente", "Teléfono", "Correo", "Servicio", "Fecha", "Hora", "Monto", "Método Pago", "Estado Pago", "Evidencia URL", "Resultado IA", "Business ID", "Inasistencias", "Fecha Creacion"]]
    },
    {
      range: "Catalogos!A1:D1",
      values: [["Business ID", "Servicios JSON", "Pago JSON", "Ultima Actualizacion"]]
    },
    {
      range: "Suscripciones!A1:E1",
      values: [["Business ID", "Plan", "Estado", "Fecha Expiracion", "Email"]]
    }
  ];

  for (const item of initialHeaders) {
    try {
      // Check if header already written
      const checkRes = await fetch(`https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/${item.range.split("!")[0]}!A1:A1`, { headers });
      const checkData = await checkRes.json();
      if (checkData.values && checkData.values.length > 0) {
        continue; // Already has headers
      }

      await fetch(`https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/${item.range}?valueInputOption=USER_ENTERED`, {
        method: "PUT",
        headers,
        body: JSON.stringify({ values: item.values }),
      });
    } catch (e) {
      console.error(`Error setting headers for ${item.range}:`, e);
    }
  }
}

/**
 * 1. LECTURA DE CATÁLOGOS POR business_id
 */
export async function getBusinessCatalog(businessId: string): Promise<{ services: ServiceConfig[]; paymentConfig: PaymentConfig } | null> {
  const client = getJwtClient();
  if (!client || !spreadsheetId) return null;

  try {
    await initializeSheets();
    const headers = await getAuthHeaders();
    
    const res = await fetch(`https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/Catalogos!A:D`, {
      headers,
    });

    if (!res.ok) {
      console.error("Failed to read Catalogos from sheet:", await res.text());
      return null;
    }

    const data = await res.json();
    const rows = data.values || [];
    
    // Find matching businessId row (skip headers row index 0)
    for (let i = 1; i < rows.length; i++) {
      const row = rows[i];
      if (row[0] === businessId) {
        try {
          const services = JSON.parse(row[1]) as ServiceConfig[];
          const paymentConfig = JSON.parse(row[2]) as PaymentConfig;
          return { services, paymentConfig };
        } catch (jsonErr) {
          console.error(`JSON Parse error for catalog row ${i}:`, jsonErr);
        }
      }
    }
    return null;
  } catch (error) {
    console.error("Error getting business catalog:", error);
    return null;
  }
}

/**
 * 2. GUARDADO DE CATÁLOGOS POR business_id
 */
export async function saveBusinessCatalog(
  businessId: string,
  services: ServiceConfig[],
  paymentConfig: PaymentConfig
): Promise<boolean> {
  const client = getJwtClient();
  if (!client || !spreadsheetId) return false;

  try {
    await initializeSheets();
    const headers = await getAuthHeaders();

    // Read existing Catalogos rows
    const getRes = await fetch(`https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/Catalogos!A:A`, {
      headers,
    });

    let rowIndex = -1;
    if (getRes.ok) {
      const getData = await getRes.json();
      const rows = getData.values || [];
      for (let i = 0; i < rows.length; i++) {
        if (rows[i][0] === businessId) {
          rowIndex = i + 1; // 1-indexed for Sheets API
          break;
        }
      }
    }

    const timestamp = new Date().toISOString();
    const rowValues = [
      businessId,
      JSON.stringify(services),
      JSON.stringify(paymentConfig),
      timestamp,
    ];

    if (rowIndex !== -1) {
      // Overwrite existing row
      const updateRes = await fetch(
        `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/Catalogos!A${rowIndex}:D${rowIndex}?valueInputOption=USER_ENTERED`,
        {
          method: "PUT",
          headers,
          body: JSON.stringify({ values: [rowValues] }),
        }
      );
      return updateRes.ok;
    } else {
      // Append new row
      const appendRes = await fetch(
        `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/Catalogos!A:D:append?valueInputOption=USER_ENTERED`,
        {
          method: "POST",
          headers,
          body: JSON.stringify({ values: [rowValues] }),
        }
      );
      return appendRes.ok;
    }
  } catch (error) {
    console.error("Error saving business catalog:", error);
    return false;
  }
}

/**
 * 3. GUARDADO DE CITAS (SERVER SIDE)
 */
export async function saveAppointment(businessId: string, appointment: Appointment): Promise<number> {
  const client = getJwtClient();
  if (!client || !spreadsheetId) return -1;

  try {
    await initializeSheets();
    const headers = await getAuthHeaders();

    const timestamp = new Date().toISOString();
    const rowValues = [
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
      businessId,
      appointment.absences || 0,
      timestamp,
    ];

    const appendRes = await fetch(
      `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/Citas!A:O:append?valueInputOption=USER_ENTERED`,
      {
        method: "POST",
        headers,
        body: JSON.stringify({ values: [rowValues] }),
      }
    );

    if (!appendRes.ok) {
      console.error("Failed to append appointment to sheet:", await appendRes.text());
      return -1;
    }

    const appendData = await appendRes.json();
    const updatedRange = appendData.updates?.updatedRange; // e.g. "Citas!A5:O5"
    if (updatedRange) {
      const match = updatedRange.match(/A(\d+):/);
      if (match) return parseInt(match[1], 10);
    }
    return -1;
  } catch (error) {
    console.error("Error saving appointment:", error);
    return -1;
  }
}

/**
 * 4. ACTUALIZACIÓN DE ESTADO DE CITA (SERVER SIDE)
 */
export async function updateAppointmentInSheetServer(
  rowIndex: number,
  status: string,
  receiptUrl?: string,
  receiptStatus?: string,
  absences?: number
): Promise<boolean> {
  const client = getJwtClient();
  if (!client || !spreadsheetId) return false;

  try {
    const headers = await getAuthHeaders();
    
    // Column J (index 10) is paymentStatus, K (index 11) is receiptUrl, L (index 12) is receiptStatus, N (index 14) is absences
    const range = `Citas!J${rowIndex}:L${rowIndex}`;
    const updateRes = await fetch(
      `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/${range}?valueInputOption=USER_ENTERED`,
      {
        method: "PUT",
        headers,
        body: JSON.stringify({
          values: [[status, receiptUrl || "", receiptStatus || ""]],
        }),
      }
    );

    if (absences !== undefined) {
      const rangeAbsences = `Citas!N${rowIndex}:N${rowIndex}`;
      await fetch(
        `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/${rangeAbsences}?valueInputOption=USER_ENTERED`,
        {
          method: "PUT",
          headers,
          body: JSON.stringify({
            values: [[absences]],
          }),
        }
      );
    }

    return updateRes.ok;
  } catch (error) {
    console.error("Error updating appointment in sheet server:", error);
    return false;
  }
}

/**
 * 5. VERIFICACIÓN DE SUSCRIPCIONES
 */
export async function verifySubscription(businessId: string): Promise<{ plan: string; estado: string; expiration: string } | null> {
  const client = getJwtClient();
  if (!client || !spreadsheetId) return null;

  try {
    await initializeSheets();
    const headers = await getAuthHeaders();

    const res = await fetch(`https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/Suscripciones!A:E`, {
      headers,
    });

    if (!res.ok) {
      console.error("Failed to read Suscripciones from sheet:", await res.text());
      return null;
    }

    const data = await res.json();
    const rows = data.values || [];

    for (let i = 1; i < rows.length; i++) {
      const row = rows[i];
      if (row[0] === businessId) {
        return {
          plan: row[1] || "Gratuito",
          estado: row[2] || "Inactivo",
          expiration: row[3] || "",
        };
      }
    }

    // Default subscription if not found (trial mode so it is fully open-access out of the box)
    return {
      plan: "Premium Trial",
      estado: "Activo",
      expiration: "2028-12-31",
    };
  } catch (error) {
    console.error("Error verifying subscription:", error);
    return null;
  }
}

/**
 * 6. LECTURA DE CITAS POR business_id
 */
export async function getBusinessAppointments(businessId: string): Promise<Appointment[]> {
  const client = getJwtClient();
  if (!client || !spreadsheetId) return [];

  try {
    await initializeSheets();
    const headers = await getAuthHeaders();
    
    const res = await fetch(`https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/Citas!A:O`, {
      headers,
    });

    if (!res.ok) {
      console.error("Failed to read Citas from sheet:", await res.text());
      return [];
    }

    const data = await res.json();
    const rows = data.values || [];
    const appointments: Appointment[] = [];
    
    // Find matching businessId rows (skip headers row index 0)
    for (let i = 1; i < rows.length; i++) {
      const row = rows[i];
      if (row.length > 12 && row[12] === businessId) {
        appointments.push({
          id: row[0] || "",
          clientName: row[1] || "",
          phone: row[2] || "",
          email: row[3] || "",
          service: row[4] || "",
          date: row[5] || "",
          time: row[6] || "",
          amount: parseFloat(row[7]) || 0,
          paymentMethod: (row[8] || "OXXO") as any,
          paymentStatus: (row[9] || "Por Verificar") as any,
          receiptUrl: row[10] || "",
          receiptStatus: (row[11] || "NONE") as any,
          sheetRowIndex: i + 1, // Store 1-based index in sheet
          absences: parseInt(row[13], 10) || 0,
        });
      }
    }
    return appointments;
  } catch (error) {
    console.error("Error getting business appointments:", error);
    return [];
  }
}

