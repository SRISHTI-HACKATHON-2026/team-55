import { NextResponse } from "next/server";
import { connectToDatabase, IvrState, Resident } from "../../../../lib/db/mongoose";

// XML generator
const generateXml = (message, gather = false, gatherOptions = "") => {
  if (gather) {
    return `<?xml version="1.0" encoding="UTF-8"?>
<Response>
  <Gather action="https://sdmshrishti.onrender.com/api/ivr/webhook" timeout="10" ${gatherOptions}>
    <Say>${message}</Say>
  </Gather>
  <Say>We did not receive any input. Goodbye.</Say>
  <Hangup/>
</Response>`;
  }

  return `<?xml version="1.0" encoding="UTF-8"?>
<Response>
  <Say>${message}</Say>
  <Hangup/>
</Response>`;
};

export async function POST(request) {
  try {
    await connectToDatabase();

    const formData = await request.formData();

    const from =
      formData.get("CallFrom") ||
      formData.get("CallerId") ||
      formData.get("From");

    const digits = formData.get("Digits") || "";

    console.log("EXOTEL INPUT:", { from, digits });

    if (!from) {
      return new NextResponse(
        generateXml("System error. No phone number detected."),
        { headers: { "Content-Type": "text/xml" } }
      );
    }

    let state = await IvrState.findOne({
      phone: from,
      status: "in-progress",
    });

    // Start new session
    if (!state) {
      state = await IvrState.create({
        phone: from,
        currentStep: "main_menu",
        status: "in-progress",
      });

      return new NextResponse(
        generateXml(
          "Welcome to Eco Ledger. Press 1 for water facility. Press 2 for electricity usage. Press 3 for surplus food.",
          true,
          'numDigits="1"'
        ),
        { headers: { "Content-Type": "text/xml" } }
      );
    }

    // No input
    if (!digits) {
      return new NextResponse(
        generateXml("No input received. Goodbye."),
        { headers: { "Content-Type": "text/xml" } }
      );
    }

    // MAIN MENU
    if (state.currentStep === "main_menu") {
      if (digits === "1") state.selectedService = "water";
      else if (digits === "2") state.selectedService = "electricity";
      else if (digits === "3") state.selectedService = "food";
      else {
        state.status = "failed";
        await state.save();

        return new NextResponse(
          generateXml("Invalid input. Goodbye."),
          { headers: { "Content-Type": "text/xml" } }
        );
      }

      state.currentStep = "ask_house";
      await state.save();

      return new NextResponse(
        generateXml(
          "Enter your house number followed by hash.",
          true,
          'finishOnKey="#"'
        ),
        { headers: { "Content-Type": "text/xml" } }
      );
    }

    // HOUSE VALIDATION
    if (state.currentStep === "ask_house") {
      const houseNumber = digits.replace("#", "");

      const resident = await Resident.findOne({ houseNumber });

      if (!resident) {
        state.status = "failed";
        await state.save();

        return new NextResponse(
          generateXml("Invalid house number. Goodbye."),
          { headers: { "Content-Type": "text/xml" } }
        );
      }

      state.houseNumber = houseNumber;

      if (state.selectedService === "water") {
        state.currentStep = "ask_water_quantity";
        await state.save();

        return new NextResponse(
          generateXml(
            "House verified. Enter water quantity required followed by hash.",
            true,
            'finishOnKey="#"'
          ),
          { headers: { "Content-Type": "text/xml" } }
        );
      }

      if (state.selectedService === "electricity") {
        state.currentStep = "ask_electricity_bill";
        await state.save();

        return new NextResponse(
          generateXml(
            "House verified. Enter electricity bill amount followed by hash.",
            true,
            'finishOnKey="#"'
          ),
          { headers: { "Content-Type": "text/xml" } }
        );
      }

      if (state.selectedService === "food") {
        state.currentStep = "ask_prepared_time";
        await state.save();

        return new NextResponse(
          generateXml(
            "House verified. Enter food preparation time followed by hash.",
            true,
            'finishOnKey="#"'
          ),
          { headers: { "Content-Type": "text/xml" } }
        );
      }
    }

    // WATER
    if (state.currentStep === "ask_water_quantity") {
      state.waterQuantity = digits.replace("#", "");
      state.status = "completed";
      await state.save();

      return new NextResponse(
        generateXml("Water request recorded successfully."),
        { headers: { "Content-Type": "text/xml" } }
      );
    }

    // ELECTRICITY
    if (state.currentStep === "ask_electricity_bill") {
      state.electricityBill = digits.replace("#", "");
      state.status = "completed";
      await state.save();

      return new NextResponse(
        generateXml("Electricity bill recorded successfully."),
        { headers: { "Content-Type": "text/xml" } }
      );
    }

    // FOOD TIME
    if (state.currentStep === "ask_prepared_time") {
      state.preparedTime = digits.replace("#", "");
      state.currentStep = "ask_food_servings";
      await state.save();

      return new NextResponse(
        generateXml(
          "Enter how many members it can serve followed by hash.",
          true,
          'finishOnKey="#"'
        ),
        { headers: { "Content-Type": "text/xml" } }
      );
    }

    // FOOD SERVINGS
    if (state.currentStep === "ask_food_servings") {
      state.servings = digits.replace("#", "");
      state.status = "completed";
      await state.save();

      return new NextResponse(
        generateXml("Surplus food recorded successfully."),
        { headers: { "Content-Type": "text/xml" } }
      );
    }

    return new NextResponse(
      generateXml("System error. Invalid state."),
      { headers: { "Content-Type": "text/xml" } }
    );
  } catch (error) {
    console.error("IVR ERROR:", error);

    return new NextResponse(
      generateXml("A system error occurred. Please try again later."),
      { headers: { "Content-Type": "text/xml" } }
    );
  }
}
