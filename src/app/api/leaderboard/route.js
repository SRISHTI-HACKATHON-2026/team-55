import { NextResponse } from "next/server";
import { connectToDatabase, User } from "../../../lib/db/mongoose";
import { getServerSession } from "next-auth/next";
import { authOptions } from "../auth/[...nextauth]/route";

export async function GET() {
  try {
    await connectToDatabase();

    // Fetch all users with role 'user', sort by trustScore descending
    const leaderboard = await User.find({ role: "user" })
      .select("name houseNumber trustScore familySize")
      .sort({ trustScore: -1 })
      .limit(50) // Top 50 households
      .lean();

    return NextResponse.json({ leaderboard });
  } catch (error) {
    console.error("Leaderboard API error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
