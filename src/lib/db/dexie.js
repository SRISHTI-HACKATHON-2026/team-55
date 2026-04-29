import Dexie from "dexie";

export const db = new Dexie("EcoLedgerDB");

// Version 3 schema update to support Image Uploads
db.version(3).stores({
  reports: "++id, type, description, lat, lng, reporterName, reporterEmail, status, timestamp, synced, imageUrl",
});
