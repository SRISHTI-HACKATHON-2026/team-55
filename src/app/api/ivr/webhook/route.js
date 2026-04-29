import { NextResponse } from "next/server";
import { connectToDatabase, IvrState, Resident } from "../../../../lib/db/mongoose";

// Helper to generate TwiML/Exotel XML
const generateXml = (message, gather = false, gatherOptions = "") => {
  if (gather) {
    return `<?xml version="1.0" encoding="UTF-8"?>
<Response>
    <Gather action="/api/ivr/webhook" numDigits="10" timeout="10" ${gatherOptions}>
        <Say voice="alice">${message}</Say>
    </Gather>
    <Say voice="alice">We did not receive any input. Goodbye.</Say>
    <Hangup/>
</Response>`;
  }
  return `<?xml version="1.0" encoding="UTF-8"?>
<Response>
    <Say voice="alice">${message}</Say>
    <Hangup/>
</Response>`;
};

export async function POST(request) {
  try {
    await connectToDatabase();
    
    // Parse form data from Exotel webhook
    const formData = await request.formData();
    const from = formData.get("From");
    const digits = formData.get("Digits");

    if (!from) {
      return new NextResponse(generateXml("System error. No phone number detected."), {
        headers: { "Content-Type": "text/xml" },
      });
    }

    // 1. Find an in-progress session for this phone number
    let state = await IvrState.findOne({ phone: from, status: "in-progress" });

    // 2. If NO in-progress session, or they are just starting
    if (!state) {
      // Create new session
      state = await IvrState.create({
        phone: from,
        currentStep: "main_menu",
        status: "in-progress"
      });

      return new NextResponse(
        generateXml("Welcome to Eco Ledger. Press 1 for water facility. Press 2 for electricity usage. Press 3 for surplus food.", true, 'numDigits="1"'),
        { headers: { "Content-Type": "text/xml" } }
      );
    }

    // 3. Process input based on current step
    if (!digits) {
      // User didn't input anything, re-prompt the current step
      if (state.currentStep === "main_menu") {
        return new NextResponse(
          generateXml("Welcome to Eco Ledger. Press 1 for water facility. Press 2 for electricity usage. Press 3 for surplus food.", true, 'numDigits="1"'),
          { headers: { "Content-Type": "text/xml" } }
        );
      }
      return new NextResponse(generateXml("No input received. Goodbye."), { headers: { "Content-Type": "text/xml" } });
    }

    // ================= MAIN MENU =================
    if (state.currentStep === "main_menu") {
      if (digits === "1") state.selectedService = "water";
      else if (digits === "2") state.selectedService = "electricity";
      else if (digits === "3") state.selectedService = "food";
      else {
        state.status = "failed";
        await state.save();
        return new NextResponse(generateXml("Invalid input. Goodbye."), { headers: { "Content-Type": "text/xml" } });
      }

      state.currentStep = "ask_house";
      await state.save();

      return new NextResponse(
        generateXml("Please enter your house number, followed by the hash key.", true, 'finishOnKey="#"'),
        { headers: { "Content-Type": "text/xml" } }
      );
    }

    // ================= ASK HOUSE NUMBER =================
    if (state.currentStep === "ask_house") {
      // Clean up the hash if present
      const houseNumber = digits.replace("#", "");
      
      // Validate house number
      const resident = await Resident.findOne({ houseNumber });
      if (!resident) {
        state.status = "failed";
        await state.save();
        return new NextResponse(generateXml("Invalid house number. Goodbye."), { headers: { "Content-Type": "text/xml" } });
      }

      state.houseNumber = houseNumber;

      if (state.selectedService === "water") {
        state.currentStep = "ask_water_quantity";
        await state.save();
        return new NextResponse(
          generateXml("House verified. How much water is required in liters? Press hash when done.", true, 'finishOnKey="#"'),
          { headers: { "Content-Type": "text/xml" } }
        );
      } 
      else if (state.selectedService === "electricity") {
        state.currentStep = "ask_electricity_bill";
        await state.save();
        return new NextResponse(
          generateXml("House verified. What was your electricity bill this month? Press hash when done.", true, 'finishOnKey="#"'),
          { headers: { "Content-Type": "text/xml" } }
        );
      }
      else if (state.selectedService === "food") {
        state.currentStep = "ask_prepared_time";
        await state.save();
        return new NextResponse(
          generateXml("House verified. When was the food prepared? Enter time using keypad, for example 1230 for 12:30. Press hash when done.", true, 'finishOnKey="#"'),
          { headers: { "Content-Type": "text/xml" } }
        );
      }
    }

    // ================= WATER QUANTITY =================
    if (state.currentStep === "ask_water_quantity") {
      const quantity = parseInt(digits.replace("#", ""), 10);
      if (isNaN(quantity)) {
        state.status = "failed";
        await state.save();
        return new NextResponse(generateXml("Invalid quantity. Goodbye."), { headers: { "Content-Type": "text/xml" } });
      }

      state.waterQuantity = quantity;
      state.status = "completed";
      await state.save();

      return new NextResponse(generateXml("Thank you. Your water request has been recorded. Goodbye."), { headers: { "Content-Type": "text/xml" } });
    }

    // ================= ELECTRICITY BILL =================
    if (state.currentStep === "ask_electricity_bill") {
      const bill = parseInt(digits.replace("#", ""), 10);
      if (isNaN(bill)) {
        state.status = "failed";
        await state.save();
        return new NextResponse(generateXml("Invalid bill amount. Goodbye."), { headers: { "Content-Type": "text/xml" } });
      }

      state.electricityBill = bill;
      state.status = "completed";
      await state.save();

      return new NextResponse(generateXml("Thank you. Your electricity bill has been recorded. Goodbye."), { headers: { "Content-Type": "text/xml" } });
    }

    // ================= FOOD PREPARED TIME =================
    if (state.currentStep === "ask_prepared_time") {
      const timeStr = digits.replace("#", "");
      if (!timeStr) {
        state.status = "failed";
        await state.save();
        return new NextResponse(generateXml("Invalid time. Goodbye."), { headers: { "Content-Type": "text/xml" } });
      }

      state.preparedTime = timeStr;
      state.currentStep = "ask_food_servings";
      await state.save();

      return new NextResponse(
        generateXml("How many members can it serve? Press hash when done.", true, 'finishOnKey="#"'),
        { headers: { "Content-Type": "text/xml" } }
      );
    }

    // ================= FOOD SERVINGS =================
    if (state.currentStep === "ask_food_servings") {
      const servings = parseInt(digits.replace("#", ""), 10);
      if (isNaN(servings)) {
        state.status = "failed";
        await state.save();
        return new NextResponse(generateXml("Invalid number of servings. Goodbye."), { headers: { "Content-Type": "text/xml" } });
      }

      state.servings = servings;
      state.status = "completed";
      await state.save();

      return new NextResponse(generateXml("Thank you. Your surplus food has been listed for pickup. Goodbye."), { headers: { "Content-Type": "text/xml" } });
    }

    // Fallback
    return new NextResponse(generateXml("System error. Invalid state. Goodbye."), { headers: { "Content-Type": "text/xml" } });

  } catch (error) {
    console.error("IVR Webhook Error:", error);
    return new NextResponse(generateXml("A system error occurred. Please try again later."), {
      headers: { "Content-Type": "text/xml" },
    });
  }
}
