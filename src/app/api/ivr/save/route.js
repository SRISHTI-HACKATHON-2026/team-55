import { NextResponse } from "next/server";
import { connectToDatabase, VoiceReport, VoiceRequest } from "../../../../lib/db/mongoose";

export async function POST(request) {
  const { searchParams } = new URL(request.url);
  const issueType = searchParams.get("type") || "Other";
  
  const formData = await request.formData();
  const houseNumber = formData.get("Digits");
  const callSid = formData.get("CallSid");

  try {
    await connectToDatabase();
    await VoiceReport.create({
      houseNumber,
      issueType,
      callSid,
      status: "Pending",
      timestamp: new Date()
    });

    const twiml = `<?xml version="1.0" encoding="UTF-8"?>
<Response>
    <Say voice="alice">Thank you. Your report for house number ${houseNumber} has been logged in Eco Ledger. We will process it shortly. Goodbye.</Say>
    <Hangup/>
</Response>`;

    return new NextResponse(twiml, {
      headers: { "Content-Type": "text/xml" },
    });
  } catch (error) {
    console.error("IVR Save Error:", error);
    return new NextResponse(`<?xml version="1.0" encoding="UTF-8"?><Response><Say>System error. Please try again later.</Say></Response>`, {
      headers: { "Content-Type": "text/xml" },
    });
  }
}

export async function GET() {
  // Admin utility to fetch voice reports and passthru requests
  try {
    await connectToDatabase();
    const reports = await VoiceReport.find({}).sort({ createdAt: -1 });
    const passthruRequests = await VoiceRequest.find({}).sort({ createdAt: -1 });
    
    return NextResponse.json({ 
      reports,
      passthruRequests 
    });
  } catch (e) {
    return NextResponse.json({ error: "Failed" }, { status: 500 });
  }
}
