import { NextResponse } from "next/server";
import { connectToDatabase, User } from "../../../lib/db/mongoose";

export async function GET() {
  try {
    await connectToDatabase();
    
    // Fetch top 5 users by trust score (excluding admins)
    const leaderboard = await User.find({ role: { $ne: "admin" } })
      .sort({ trustScore: -1 })
      .limit(5)
      .select("name trustScore")
      .lean();
      
    return NextResponse.json({ leaderboard });
  } catch (error) {
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
