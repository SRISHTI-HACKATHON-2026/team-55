import { NextResponse } from "next/server";
import { connectToDatabase, Resident, WaterUsage } from "../../../../lib/db/mongoose";
import { getServerSession } from "next-auth/next";
import { authOptions } from "../../auth/auth";

export async function POST(request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { logs } = await request.json();
    if (!logs || !Array.isArray(logs)) return NextResponse.json({ error: "Invalid data" }, { status: 400 });

    await connectToDatabase();

    const resident = await Resident.findById(session.user.id);
    if (!resident) return NextResponse.json({ error: "Resident not found" }, { status: 404 });

    const familySize = resident.familySize || 1;
    const dailyLimit = familySize * 10;

    const operations = logs.map(log => {
      let scoreChange = log.amount <= dailyLimit ? 10 : -15;
      
      // Update running trust score
      resident.trustScore = (resident.trustScore || 0) + scoreChange;
      if (resident.trustScore < 0) resident.trustScore = 0;

      return {
        residentId: resident._id,
        amount: log.amount,
        limit: dailyLimit,
        scoreImpact: scoreChange,
        date: log.date || new Date(),
      };
    });

    await WaterUsage.insertMany(operations);
    await resident.save();

    return NextResponse.json({ success: true, count: operations.length });
  } catch (error) {
    console.error("Water sync error:", error);
    return NextResponse.json({ error: "Server Error" }, { status: 500 });
  }
}
