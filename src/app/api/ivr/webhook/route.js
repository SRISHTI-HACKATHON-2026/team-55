import { NextResponse } from "next/server";

export async function POST() {
  // TwiML (XML) for Twilio to read
  const twiml = `<?xml version="1.0" encoding="UTF-8"?>
<Response>
    <Say voice="alice">Welcome to Eco Ledger Dharwad. Your smart civic assistant.</Say>
    <Gather action="/api/ivr/callback" numDigits="1" timeout="10">
        <Say voice="alice">
            Press 1 to report a Garbage issue.
            Press 2 to report a Water Leakage issue.
        </Say>
    </Gather>
    <Say voice="alice">We did not receive any input. Goodbye.</Say>
</Response>`;

  return new NextResponse(twiml, {
    headers: { "Content-Type": "text/xml" },
  });
}
