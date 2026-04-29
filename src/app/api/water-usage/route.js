import { NextResponse } from "next/server";
import { connectToDatabase, User, WaterUsage } from "../../../lib/db/mongoose";
import { getServerSession } from "next-auth/next";
import { authOptions } from "../auth/[...nextauth]/route";

export async function POST(request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { amount } = await request.json();
    if (typeof amount !== "number") {
      return NextResponse.json({ error: "Invalid amount" }, { status: 400 });
    }

    await connectToDatabase();

    // Get current user details to check family size
    const user = await User.findById(session.user.id);
    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const familySize = user.familySize || 1;
    // Logic: 3 liters per member (as per user's 5 mem = 15 ltrs example)
    const LITERS_PER_PERSON = 3;
    const dailyLimit = familySize * LITERS_PER_PERSON;

    let scoreChange = 0;
    if (amount <= dailyLimit) {
      scoreChange = 10; // Reward for saving water
    } else {
      scoreChange = -15; // Penalty for exceeding
    }

    // Update user's trust score
    user.trustScore = (user.trustScore || 0) + scoreChange;
    // Ensure score doesn't go below 0
    if (user.trustScore < 0) user.trustScore = 0;
    await user.save();

    // Record the usage
    const usage = await WaterUsage.create({
      userId: user._id,
      amount,
      limit: dailyLimit,
      scoreImpact: scoreChange,
      date: new Date()
    });

    return NextResponse.json({
      success: true,
      message: scoreChange > 0 ? "Great job saving water! +10 XP" : "Water limit exceeded. -15 XP",
      newScore: user.trustScore,
      limit: dailyLimit,
      usage
    });

  } catch (error) {
    console.error("Water usage error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

export async function GET(request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    await connectToDatabase();
    const history = await WaterUsage.find({ userId: session.user.id })
      .sort({ createdAt: -1 })
      .limit(7);

    return NextResponse.json({ history });
  } catch (error) {
    return NextResponse.json({ error: "Server Error" }, { status: 500 });
  }
}
