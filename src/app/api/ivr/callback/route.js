import { NextResponse } from "next/server";

export async function POST(request) {
  const formData = await request.formData();
  const digits = formData.get("Digits");

  let issueType = "Other";
  if (digits === "1") issueType = "Garbage";
  if (digits === "2") issueType = "Water Leakage";

  const twiml = `<?xml version="1.0" encoding="UTF-8"?>
<Response>
    <Say voice="alice">You selected ${issueType}.</Say>
    <Gather action="/api/ivr/save?type=${issueType}" finishOnKey="#">
        <Say voice="alice">Please enter your House Number using the keypad, followed by the hash key.</Say>
    </Gather>
</Response>`;

  return new NextResponse(twiml, {
    headers: { "Content-Type": "text/xml" },
  });
}
