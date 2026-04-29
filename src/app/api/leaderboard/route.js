import { NextResponse } from "next/server";
import { connectToDatabase, Resident } from "../../../lib/db/mongoose";
import { getServerSession } from "next-auth/next";
import { authOptions } from "../auth/[...nextauth]/route";

export async function GET() {
  try {
    await connectToDatabase();

    // Fetch all residents, sort by trustScore descending
    const leaderboard = await Resident.find({})
      .select("name houseNumber trustScore familySize")
      .sort({ trustScore: -1 })
      .limit(50) 
      .lean();

    return NextResponse.json({ leaderboard });
  } catch (error) {
    console.error("Leaderboard API error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
