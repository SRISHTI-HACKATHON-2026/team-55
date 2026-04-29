import { connectToDatabase, Resident, WaterUsage } from "../../../lib/db/mongoose";
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

    // Get current resident details to check family size
    const resident = await Resident.findById(session.user.id);
    if (!resident) {
      return NextResponse.json({ error: "Resident not found" }, { status: 404 });
    }

    const familySize = resident.familySize || 1;
    const LITERS_PER_PERSON = 3;
    const dailyLimit = familySize * LITERS_PER_PERSON;

    let scoreChange = 0;
    if (amount <= dailyLimit) {
      scoreChange = 10; 
    } else {
      scoreChange = -15; 
    }

    // Update resident's trust score
    resident.trustScore = (resident.trustScore || 0) + scoreChange;
    if (resident.trustScore < 0) resident.trustScore = 0;
    await resident.save();

    // Record the usage
    const usage = await WaterUsage.create({
      residentId: resident._id,
      amount,
      limit: dailyLimit,
      scoreImpact: scoreChange,
      date: new Date()
    });

    return NextResponse.json({
      success: true,
      message: scoreChange > 0 ? "Great job saving water! +10 XP" : "Water limit exceeded. -15 XP",
      newScore: resident.trustScore,
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
    const history = await WaterUsage.find({ residentId: session.user.id })
      .sort({ createdAt: -1 })
      .limit(7);

    return NextResponse.json({ history });
  } catch (error) {
    return NextResponse.json({ error: "Server Error" }, { status: 500 });
  }
}
