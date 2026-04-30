import { NextResponse } from "next/server";
import { connectToDatabase, Report } from "../../../lib/db/mongoose";

export async function POST(request) {
  try {
    await connectToDatabase();
    const { reports } = await request.json();

    if (!reports || !Array.isArray(reports)) {
      return NextResponse.json({ error: "Invalid data" }, { status: 400 });
    }

    const operations = [];
    for (const report of reports) {
      // 1. Duplicate check: Same type + Same area (within ~100m)
      const latRange = 0.001; // ~111 meters
      const lngRange = 0.001; 

      const existing = await Report.findOne({
        type: report.type,
        status: "Pending",
        "location.lat": { $gte: report.lat - latRange, $lte: report.lat + latRange },
        "location.lng": { $gte: report.lng - lngRange, $lte: report.lng + lngRange },
        localId: { $ne: report.localId } // Don't match itself
      });

      if (existing) {
        console.log(`Duplicate report ignored: ${report.type} at ${report.lat}, ${report.lng}`);
        continue; 
      }

      operations.push({
        updateOne: {
          filter: { localId: report.localId || report.id.toString() },
          update: {
            $set: {
              type: report.type,
              description: report.description,
              location: {
                lat: report.lat,
                lng: report.lng
              },
              reporterName: report.reporterName,
              reporterEmail: report.reporterEmail,
              imageUrl: report.imageUrl,
              status: "Pending",
              timestamp: report.timestamp,
              foodServings: report.foodServings,
              isNGOFeature: report.isNGOFeature,
            },
          },
          upsert: true,
        },
      });
    }

    if (operations.length > 0) {
      await Report.bulkWrite(operations);
    }

    return NextResponse.json({ success: true, count: operations.length });
  } catch (error) {
    console.error("API Error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

export async function GET(request) {
  try {
    await connectToDatabase();
    
    const { searchParams } = new URL(request.url);
    const status = searchParams.get("status");
    
    const query = status ? { status } : {};
    const reports = await Report.find(query).sort({ timestamp: -1 }).lean();
    
    return NextResponse.json({ reports });
  } catch (error) {
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

export async function DELETE(request) {
  try {
    await connectToDatabase();
    const { reportId } = await request.json();

    if (!reportId) {
      return NextResponse.json({ error: "reportId is required" }, { status: 400 });
    }

    const deleted = await Report.findByIdAndDelete(reportId);
    if (!deleted) {
      return NextResponse.json({ error: "Report not found" }, { status: 404 });
    }

    return NextResponse.json({ success: true, message: "Report deleted." });
  } catch (error) {
    console.error("Delete report error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
