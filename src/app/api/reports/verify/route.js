import { NextResponse } from "next/server";
import { connectToDatabase, Report } from "../../../../lib/db/mongoose";
import mongoose from "mongoose";

export async function POST(request) {
  try {
    await connectToDatabase();
    const { reportId, action } = await request.json();

    if (!reportId || !["verify", "flag"].includes(action)) {
      return NextResponse.json({ error: "Invalid action" }, { status: 400 });
    }

    const newStatus = action === "verify" ? "Resolved" : "Flagged";
    
    const updatedReport = await Report.findByIdAndUpdate(
      reportId,
      { status: newStatus },
      { new: true }
    );

    if (!updatedReport) {
      return NextResponse.json({ error: "Report not found" }, { status: 404 });
    }

    // GAMIFICATION: 
    // - Award +10 Trust Score to the reporter if the issue is successfully resolved!
    // - Deduct -10 Trust Score if the issue is flagged (denied/rejected) to prevent spam!
    if (updatedReport.reporterEmail) {
      // Access models from the global registry to avoid re-compilation or import issues
      const ResidentModel = mongoose.models.Resident;
      const scoreChange = newStatus === "Resolved" ? 10 : -10;
      
      console.log(`[GAMIFICATION] Updating trustScore for ${updatedReport.reporterEmail}: ${scoreChange} XP`);

      await ResidentModel.findOneAndUpdate(
        { email: updatedReport.reporterEmail },
        { 
          $inc: { trustScore: scoreChange }
        }
      );

      // Ensure score doesn't drop below zero in a separate step to guarantee $inc worked
      await ResidentModel.findOneAndUpdate(
        { email: updatedReport.reporterEmail, trustScore: { $lt: 0 } },
        { $set: { trustScore: 0 } }
      );
    }

    return NextResponse.json({ success: true, report: updatedReport });
  } catch (error) {
    console.error("Verify API Error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
