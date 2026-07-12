import { Appointment, BusinessStats } from "./types";

export const initialAppointments: Appointment[] = [];

export const initialStats: BusinessStats = {
  attendanceRate: 100,
  confirmedCount: 0,
  rescheduledCount: 0,
};

export const SERVICES = [
  { name: "Consulta General", price: 500, duration: "30 min" },
  { name: "Fisioterapia", price: 800, duration: "60 min" },
  { name: "Revisión Financiera", price: 1200, duration: "45 min" },
  { name: "Seguimiento", price: 400, duration: "15 min" },
];
