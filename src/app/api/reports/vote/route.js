import { NextResponse } from "next/server";
import { connectToDatabase, Report } from "../../../../lib/db/mongoose";
import { getServerSession } from "next-auth/next";
import { authOptions } from "../../auth/auth";
import mongoose from "mongoose";

export async function POST(request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { reportId } = await request.json();
    if (!reportId) {
      return NextResponse.json({ error: "Report ID required" }, { status: 400 });
    }

    await connectToDatabase();

    const report = await Report.findById(reportId);
    if (!report) {
      return NextResponse.json({ error: "Report not found" }, { status: 404 });
    }

    // Initialize votes array if it doesn't exist (for older reports)
    if (!report.votes) report.votes = [];

    const userId = new mongoose.Types.ObjectId(session.user.id);
    
    // Check if already voted
    const hasVoted = report.votes.some(voterId => voterId.equals(userId));

    if (hasVoted) {
      // Remove vote (toggle behavior)
      report.votes = report.votes.filter(voterId => !voterId.equals(userId));
    } else {
      // Add vote
      report.votes.push(userId);
    }

    report.voteCount = report.votes.length;
    await report.save();

    return NextResponse.json({ 
      success: true, 
      voteCount: report.voteCount, 
      hasVoted: !hasVoted 
    });

  } catch (error) {
    console.error("Vote API Error:", error);
    return NextResponse.json({ error: "Server Error" }, { status: 500 });
  }
}
