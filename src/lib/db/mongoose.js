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
    cached.promise = mongoose.connect(MONGODB_URI, { 
      bufferCommands: false,
      serverSelectionTimeoutMS: 5000, // Fail fast if DB is unreachable
      connectTimeoutMS: 5000,
    }).then(m => m);
  }
  try {
    cached.conn = await cached.promise;
  } catch (e) {
    cached.promise = null;
    throw e;
  }
  return cached.conn;
}

// ─── Admin Schema (Administrative Staff) ──────────────────────────────────
const AdminSchema = new mongoose.Schema(
  {
    name:     { type: String, required: true, trim: true },
    email:    { type: String, required: true, unique: true, lowercase: true, trim: true },
    password: { type: String, required: true },
    role:     { type: String, default: "admin" },
    department: { type: String, default: "Municipal" }
  },
  { timestamps: true }
);

if (mongoose.models.Admin) delete mongoose.models.Admin;
export const Admin = mongoose.model("Admin", AdminSchema);

// ─── NGO Schema (Non-Profit Organizations) ──────────────────────────────────
const NgoSchema = new mongoose.Schema(
  {
    name:     { type: String, required: true, trim: true },
    email:    { type: String, required: true, unique: true, lowercase: true, trim: true },
    password: { type: String, required: true },
    ngoId:    { type: String, required: true, unique: true }, // License or Reg Number
    role:     { type: String, default: "ngo" },
    address:  { type: String, default: "" },
    phone:    { type: String, default: "" },
    category: { type: String, default: "Food Recovery" }
  },
  { timestamps: true }
);

if (mongoose.models.Ngo) delete mongoose.models.Ngo;
export const Ngo = mongoose.model("Ngo", NgoSchema);

// ─── Resident Schema (Citizen / User) ───────────────────────────────────────
const ResidentSchema = new mongoose.Schema(
  {
    name:       { type: String, required: true, trim: true },
    email:      { type: String, required: true, unique: true, lowercase: true, trim: true },
    password:   { type: String, required: true },
    phone:      { type: String, default: "" },
    role:       { type: String, default: "resident" },
    trustScore: { type: Number, default: 0 },
    isActive:   { type: Boolean, default: true },
    avatar:     { type: String, default: "" },

    // Household / Community Profile
    houseNumber:  { type: String, default: "" },
    familySize:   { type: Number, default: 0, min: 0 },
    familyGenders: {
      male:   { type: Number, default: 0 },
      female: { type: Number, default: 0 },
      other:  { type: Number, default: 0 },
    },
    averageElectricityBill: { type: Number, default: 0 },
  },
  { timestamps: true }
);

if (mongoose.models.Resident) delete mongoose.models.Resident;
export const Resident = mongoose.model("Resident", ResidentSchema);

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
  status: { type: String, enum: ["Pending", "Accepted", "Resolved", "Flagged"], default: "Pending" },
  acceptedBy: { type: mongoose.Schema.Types.ObjectId, ref: "Ngo" },
  imageUrl: { type: String },
  timestamp: { type: Date, default: Date.now },
  votes: [{ type: mongoose.Schema.Types.ObjectId, ref: "Resident" }],
  voteCount: { type: Number, default: 0 },
  foodServings: { type: Number },
  isNGOFeature: { type: Boolean, default: false }
});

if (mongoose.models.Report) delete mongoose.models.Report;
export const Report = mongoose.model("Report", ReportSchema);

// ─── Water Usage Schema ──────────────────────────────────────────────────────
const WaterUsageSchema = new mongoose.Schema({
  residentId: { type: mongoose.Schema.Types.ObjectId, ref: "Resident", required: true },
  amount: { type: Number, required: true }, 
  limit: { type: Number, required: true },  
  date: { type: Date, default: Date.now },
  scoreImpact: { type: Number, default: 0 } 
}, { timestamps: true });

if (mongoose.models.WaterUsage) delete mongoose.models.WaterUsage;
export const WaterUsage = mongoose.model("WaterUsage", WaterUsageSchema);

// ─── Electricity Usage Schema ────────────────────────────────────────────────
const ElectricityUsageSchema = new mongoose.Schema({
  residentId: { type: mongoose.Schema.Types.ObjectId, ref: "Resident", required: true },
  units: { type: Number, required: true }, 
  previousAverage: { type: Number, required: true }, 
  date: { type: Date, default: Date.now },
  scoreImpact: { type: Number, default: 0 }
}, { timestamps: true });

if (mongoose.models.ElectricityUsage) delete mongoose.models.ElectricityUsage;
export const ElectricityUsage = mongoose.model("ElectricityUsage", ElectricityUsageSchema);

// ─── Voice Report Schema (IVR) ─────────────────────────────────────────────
const VoiceReportSchema = new mongoose.Schema({
  houseNumber: { type: String, required: true },
  issueType: { type: String, enum: ["Garbage", "Water Leakage", "Other"], required: true },
  status: { type: String, default: "Pending" },
  callSid: { type: String }, 
  timestamp: { type: Date, default: Date.now }
}, { timestamps: true });

if (mongoose.models.VoiceReport) delete mongoose.models.VoiceReport;
export const VoiceReport = mongoose.model("VoiceReport", VoiceReportSchema);

// ─── Voice Request Schema (Passthru) ───────────────────────────────────────
const VoiceRequestSchema = new mongoose.Schema({
  phone: { type: String, required: true },
  type: { type: String, enum: ["water", "electricity", "food", "other"], required: true },
  inputDigit: { type: String },
  status: { type: String, default: "pending" },
  timestamp: { type: Date, default: Date.now }
}, { timestamps: true });

if (mongoose.models.VoiceRequest) delete mongoose.models.VoiceRequest;
export const VoiceRequest = mongoose.model("VoiceRequest", VoiceRequestSchema);

// ─── IVR State Schema (Multi-step Flow) ────────────────────────────────────
const IvrStateSchema = new mongoose.Schema({
  phone: { type: String, required: true },
  selectedService: { type: String, enum: ["water", "electricity", "food"] },
  currentStep: { type: String, default: "main_menu" },
  houseNumber: { type: String },
  waterQuantity: { type: Number },
  electricityBill: { type: Number },
  preparedTime: { type: String },
  servings: { type: Number },
  status: { type: String, enum: ["in-progress", "completed", "failed"], default: "in-progress" },
  updatedAt: { type: Date, default: Date.now }
}, { timestamps: true });

if (mongoose.models.IvrState) delete mongoose.models.IvrState;
export const IvrState = mongoose.model("IvrState", IvrStateSchema);
