import Dexie from "dexie";

export const db = new Dexie("EcoLedgerDB");

// Version 4 schema update to support Water and Electricity Offline Logs
db.version(4).stores({
  reports: "++id, type, description, lat, lng, reporterName, reporterEmail, status, timestamp, synced, imageUrl",
  water_usage: "++id, residentId, amount, date, synced",
  electricity_usage: "++id, residentId, units, date, synced"
});
