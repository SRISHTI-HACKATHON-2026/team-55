import { NextResponse } from "next/server";
import { connectToDatabase, VoiceRequest } from "../../../../lib/db/mongoose";

export async function POST(request) {
  try {
    await connectToDatabase();

    // Parse Form Data (Exotel/Twilio send URL-encoded data)
    const formData = await request.formData();
    const body = Object.fromEntries(formData);

    const phone = body.CallerId || body.CallFrom || body.From || "Unknown";
    const digit = body.Digits || "";

    console.log("IVR INPUT RECEIVED:", body);

    let type = "other";
    if (digit === "1") type = "water";
    else if (digit === "2") type = "electricity";
    else if (digit === "3") type = "food";

    // Store in MongoDB
    await VoiceRequest.create({
      phone,
      type,
      inputDigit: digit,
      status: "pending"
    });

    // Generate XML response for Exotel/Twilio
    const xmlResponse = `
<Response>
  <Say>Your request for ${type} has been recorded successfully. Our team will contact you soon.</Say>
</Response>`.trim();

    return new NextResponse(xmlResponse, {
      headers: {
        "Content-Type": "text/xml",
      },
    });

  } catch (error) {
    console.error("IVR Passthru Error:", error);
    
    // Fallback XML response in case of error
    return new NextResponse(`
<Response>
  <Say>Sorry, there was an error processing your request. Please try again later.</Say>
</Response>`.trim(), {
      headers: {
        "Content-Type": "text/xml",
      },
    });
  }
}
