import { NextResponse } from "next/server";
import { connectToDatabase, Report, Resident } from "../../../lib/db/mongoose";
import { getServerSession } from "next-auth";
import { authOptions } from "../../auth/auth";

export async function POST(request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || session.user.role !== "ngo") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await connectToDatabase();
    const { reportId } = await request.json();

    const report = await Report.findById(reportId);
    if (!report) {
      return NextResponse.json({ error: "Report not found" }, { status: 404 });
    }

    if (report.status === "Accepted") {
      return NextResponse.json({ error: "Already accepted" }, { status: 400 });
    }

    // Update report
    report.status = "Accepted";
    report.acceptedBy = session.user.id;
    await report.save();

    // Reward the resident
    const resident = await Resident.findOne({ email: report.reporterEmail });
    if (resident) {
      resident.trustScore += 10;
      await resident.save();
    }

    return NextResponse.json({ success: true, message: "Food request accepted. 10 points awarded to resident." });
  } catch (error) {
    console.error("NGO Accept Error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
