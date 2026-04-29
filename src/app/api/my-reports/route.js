import { NextResponse } from "next/server";
import { connectToDatabase, Report } from "../../../lib/db/mongoose";
import { getServerSession } from "next-auth/next";
import { authOptions } from "../auth/auth";

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await connectToDatabase();
    
    // Fetch reports belonging only to the logged-in user
    const reports = await Report.find({ reporterEmail: session.user.email })
      .sort({ timestamp: -1 })
      .lean();
      
    return NextResponse.json({ reports });
  } catch (error) {
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
