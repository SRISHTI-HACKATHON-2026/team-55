import { connectToDatabase, Resident, ElectricityUsage } from "../../../lib/db/mongoose";
import { getServerSession } from "next-auth/next";
import { authOptions } from "../auth/[...nextauth]/route";

export async function POST(request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { units } = await request.json();
    if (typeof units !== "number") return NextResponse.json({ error: "Invalid units" }, { status: 400 });

    await connectToDatabase();

    const resident = await Resident.findById(session.user.id);
    if (!resident) return NextResponse.json({ error: "Resident not found" }, { status: 404 });

    const previousAverage = resident.averageElectricityBill || 0;
    let scoreChange = 0;
    let message = "";

    if (previousAverage === 0) {
      resident.averageElectricityBill = units;
      message = "Baseline set! Next month's bill will be compared to this value.";
    } else {
      if (units <= previousAverage) {
        scoreChange = 25; 
        message = `Excellent! You saved energy compared to your average. +25 XP`;
      } else {
        scoreChange = -30; 
        message = `Usage exceeded your average. -30 XP. Try to save energy next month!`;
      }
      resident.averageElectricityBill = (previousAverage + units) / 2;
    }

    resident.trustScore = (resident.trustScore || 0) + scoreChange;
    if (resident.trustScore < 0) resident.trustScore = 0;
    await resident.save();

    const usage = await ElectricityUsage.create({
      residentId: resident._id,
      units,
      previousAverage,
      scoreImpact: scoreChange,
      date: new Date()
    });

    return NextResponse.json({
      success: true,
      message,
      newScore: resident.trustScore,
      average: resident.averageElectricityBill,
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
    const history = await ElectricityUsage.find({ residentId: session.user.id })
      .sort({ createdAt: -1 })
      .limit(6);

    const resident = await Resident.findById(session.user.id).select("averageElectricityBill");

    return NextResponse.json({ 
      history, 
      currentAverage: resident.averageElectricityBill || 0 
    });
  } catch (error) {
    return NextResponse.json({ error: "Server Error" }, { status: 500 });
  }
}
