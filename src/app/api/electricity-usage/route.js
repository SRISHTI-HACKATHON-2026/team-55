import { NextResponse } from "next/server";
import { connectToDatabase, User, ElectricityUsage } from "../../../lib/db/mongoose";
import { getServerSession } from "next-auth/next";
import { authOptions } from "../auth/[...nextauth]/route";

export async function POST(request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { units } = await request.json();
    if (typeof units !== "number") return NextResponse.json({ error: "Invalid units" }, { status: 400 });

    await connectToDatabase();

    const user = await User.findById(session.user.id);
    if (!user) return NextResponse.json({ error: "User not found" }, { status: 404 });

    const previousAverage = user.averageElectricityBill || 0;
    let scoreChange = 0;
    let message = "";

    if (previousAverage === 0) {
      // First time entry — set the baseline
      user.averageElectricityBill = units;
      message = "Baseline set! Next month's bill will be compared to this value.";
    } else {
      if (units <= previousAverage) {
        scoreChange = 25; // Reward for saving energy
        message = `Excellent! You saved energy compared to your average. +25 XP`;
      } else {
        scoreChange = -30; // Penalty for excess usage
        message = `Usage exceeded your average. -30 XP. Try to save energy next month!`;
      }
      
      // Optionally update the moving average (50% weight to new bill)
      user.averageElectricityBill = (previousAverage + units) / 2;
    }

    user.trustScore = (user.trustScore || 0) + scoreChange;
    if (user.trustScore < 0) user.trustScore = 0;
    await user.save();

    const usage = await ElectricityUsage.create({
      userId: user._id,
      units,
      previousAverage,
      scoreImpact: scoreChange,
      date: new Date()
    });

    return NextResponse.json({
      success: true,
      message,
      newScore: user.trustScore,
      average: user.averageElectricityBill,
      usage
    });

  } catch (error) {
    console.error("Electricity error:", error);
    return NextResponse.json({ error: "Server Error" }, { status: 500 });
  }
}

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    await connectToDatabase();
    const history = await ElectricityUsage.find({ userId: session.user.id })
      .sort({ createdAt: -1 })
      .limit(6);

    const user = await User.findById(session.user.id).select("averageElectricityBill");

    return NextResponse.json({ 
      history, 
      currentAverage: user.averageElectricityBill || 0 
    });
  } catch (error) {
    return NextResponse.json({ error: "Server Error" }, { status: 500 });
  }
}
