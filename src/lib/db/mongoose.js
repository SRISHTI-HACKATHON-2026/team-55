import mongoose from "mongoose";

const MONGODB_URI = process.env.MONGODB_URI || "mongodb://localhost:27017/ecoledger";

if (!MONGODB_URI) {
  throw new Error("Please define the MONGODB_URI environment variable");
}

let cached = global.mongoose;
if (!cached) {
  cached = global.mongoose = { conn: null, promise: null };
}

export async function connectToDatabase() {
  if (cached.conn) { return cached.conn; }
  if (!cached.promise) {
    cached.promise = mongoose.connect(MONGODB_URI, { bufferCommands: false }).then(m => m);
  }
  try {
    cached.conn = await cached.promise;
  } catch (e) {
    cached.promise = null;
    throw e;
  }
  return cached.conn;
}

// ─── User Schema ─────────────────────────────────────────────────────────────
const UserSchema = new mongoose.Schema(
  {
    name:       { type: String, required: true, trim: true },
    email:      { type: String, required: true, unique: true, lowercase: true, trim: true },
    password:   { type: String, required: true },
    phone:      { type: String, default: "" },
    role:       { type: String, enum: ["user", "admin"], default: "user" },
    trustScore: { type: Number, default: 0 },
    isActive:   { type: Boolean, default: true },
    avatar:     { type: String, default: "" },

    // Household / Community Profile (Resident only)
    houseNumber:  { type: String, default: "" },
    familySize:   { type: Number, default: 0, min: 0 },
    familyGenders: {
      male:   { type: Number, default: 0 },
      female: { type: Number, default: 0 },
      other:  { type: Number, default: 0 },
    },
  },
  { timestamps: true }
);

// Delete cached model to always use the latest schema in dev (hot-reload safe)
if (mongoose.models.User) delete mongoose.models.User;
export const User = mongoose.model("User", UserSchema);

// Report Schema
const ReportSchema = new mongoose.Schema({
  localId: { type: String, required: true },
  type: { type: String, required: true },
  description: { type: String },
  location: {
    lat: { type: Number, required: true },
    lng: { type: Number, required: true },
  },
  reporterName: { type: String, required: true },
  reporterEmail: { type: String },
  status: { type: String, enum: ["Pending", "Resolved", "Flagged"], default: "Pending" },
  imageUrl: { type: String },
  timestamp: { type: Date, default: Date.now },
});

if (mongoose.models.Report) delete mongoose.models.Report;
export const Report = mongoose.model("Report", ReportSchema);

