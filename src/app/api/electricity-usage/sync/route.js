import { NextResponse } from "next/server";
import { connectToDatabase, Resident, ElectricityUsage } from "../../../../lib/db/mongoose";
import { getServerSession } from "next-auth/next";
import { authOptions } from "../../auth/[...nextauth]/route";

export async function POST(request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { logs } = await request.json();
    if (!logs || !Array.isArray(logs)) return NextResponse.json({ error: "Invalid data" }, { status: 400 });

    await connectToDatabase();

    const resident = await Resident.findById(session.user.id);
    if (!resident) return NextResponse.json({ error: "Resident not found" }, { status: 404 });

    const operations = logs.map(log => {
      const previousAverage = resident.averageElectricityBill || 0;
      let scoreChange = 0;

      if (previousAverage > 0) {
        scoreChange = log.units <= previousAverage ? 25 : -30;
        resident.averageElectricityBill = (previousAverage + log.units) / 2;
      } else {
        resident.averageElectricityBill = log.units;
      }

      resident.trustScore = (resident.trustScore || 0) + scoreChange;
      if (resident.trustScore < 0) resident.trustScore = 0;

      return {
        residentId: resident._id,
        units: log.units,
        previousAverage,
        scoreImpact: scoreChange,
        date: log.date || new Date(),
      };
    });

    await ElectricityUsage.insertMany(operations);
    await resident.save();

    return NextResponse.json({ success: true, count: operations.length });
  } catch (error) {
    console.error("Electricity sync error:", error);
    return NextResponse.json({ error: "Server Error" }, { status: 500 });
  }
}
