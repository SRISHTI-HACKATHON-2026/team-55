import { NextResponse } from "next/server";
import { connectToDatabase, Report } from "../../../../lib/db/mongoose";

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

    // GAMIFICATION: Award +10 Trust Score to the reporter if the issue is successfully resolved!
    if (newStatus === "Resolved" && updatedReport.reporterEmail) {
      const { Resident } = require("../../../../lib/db/mongoose");
      await Resident.findOneAndUpdate(
        { email: updatedReport.reporterEmail },
        { $inc: { trustScore: 10 } }
      );
    }

    return NextResponse.json({ success: true, report: updatedReport });
  } catch (error) {
    console.error("Verify API Error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
