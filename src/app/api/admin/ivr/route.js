import { NextResponse } from "next/server";
import { connectToDatabase, IvrState } from "../../../../lib/db/mongoose";
import { getServerSession } from "next-auth/next";
import { authOptions } from "../../auth/auth";

export async function GET(request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || session.user.role !== "admin") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await connectToDatabase();
    
    // Fetch completed or in-progress IVR sessions to show all activity
    const reports = await IvrState.find({})
      .sort({ updatedAt: -1 })
      .limit(50)
      .lean();

    return NextResponse.json({ reports });
  } catch (error) {
    console.error("Admin IVR fetch error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
