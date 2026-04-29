import { NextResponse } from "next/server";

export async function POST(request) {
  try {
    const { imageBase64, lat, lng } = await request.json();

    if (!imageBase64) {
      return NextResponse.json({ error: "No image provided" }, { status: 400 });
    }

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      return NextResponse.json({ error: "Gemini API key not configured" }, { status: 500 });
    }

    // Step 1: Reverse geocode to get a human-readable address
    let locationStr = "an unspecified location";
    if (lat && lng) {
      try {
        const maptilerKey = process.env.MAPTILER_API_KEY || "fm63BZNe6hXB2ad5Xaz5";
        const geoRes = await fetch(
          `https://api.maptiler.com/geocoding/${lng},${lat}.json?key=${maptilerKey}`
        );
        const geoData = await geoRes.json();
        const place = geoData.features?.[0]?.place_name;
        if (place) locationStr = place;
      } catch (_) {
        // Keep default if geocoding fails
      }
    }

    // Strip the data URL prefix to get raw base64
    const base64Data = imageBase64.split(",")[1];
    const mimeType = imageBase64.split(";")[0].split(":")[1] || "image/jpeg";

    const prompt = `You are an expert AI waste analyst for EcoLedger, a civic waste reporting system in Dharwad, Karnataka, India.

A resident has photographed a waste/environmental issue at: "${locationStr}"

Your job is to carefully analyze EXACTLY what is visible in the image and produce a complete incident report.

STEP 1 - LOOK CAREFULLY at the image and note:
- What specific objects, materials, or conditions are visible?
- What colors, textures, or quantities can you identify?
- What is the approximate severity (minor/moderate/severe)?
- Is it on a road, sidewalk, drain, open ground, near a building?

STEP 2 - CLASSIFY into one of:
- "Water Wastage": water leakage, burst pipe, drain overflow, flooding, stagnant water, waterlogging
- "Garbage": trash pile, litter, overflowing dustbin, illegal dumping, mixed household waste on public space
- "Material Waste": specific recyclable materials — plastic bags/bottles, e-waste/electronics, glass, metal scrap, cardboard/paper

STEP 3 - Write a DETAILED description (3-4 sentences) that:
- Starts with what TYPE of waste this is and WHY you classified it that way
- Describes EXACTLY what you see (specific objects, colors, quantity, state)
- Mentions the location: "${locationStr}"
- Ends with the urgency level and recommended action

Respond ONLY in this exact JSON format (no markdown, no code blocks):
{"type": "<Water Wastage|Garbage|Material Waste>", "materialType": "<Plastic|E-Waste|Glass|Metal|Cardboard/Paper|Other|null>", "confidence": <0-100>, "shortLabel": "<4-6 word summary of what you see>", "severity": "<Minor|Moderate|Severe>", "description": "<3-4 sentence detailed description of the specific waste visible in the image, including location>"}

IMPORTANT: Be specific. Do NOT write generic descriptions. Describe the ACTUAL objects and conditions you see in THIS image.`;

    // Try models in order — use v1beta which supports vision models
    const MODELS = [
      "gemini-2.0-flash",
      "gemini-1.5-flash",
      "gemini-1.5-flash-latest",
      "gemini-pro-vision",
    ];

    let response = null;
    let usedModel = null;
    for (const model of MODELS) {
      const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;

      const attempt = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }, { inline_data: { mime_type: mimeType, data: base64Data } }] }],
          generationConfig: { temperature: 0.2, maxOutputTokens: 600 },
        }),
      });

      if (attempt.ok) {
        response = attempt;
        usedModel = model;
        console.log(`Using Gemini model: ${model}`);
        break;
      } else {
        const err = await attempt.text();
        console.warn(`Model ${model} failed:`, err.slice(0, 150));
      }
    }

    if (!response) {
      // All models failed — return a generic description so the user still gets auto-fill
      return NextResponse.json({
        success: true,
        classification: {
          type: "Garbage",
          materialType: null,
          confidence: 40,
          shortLabel: "Environmental issue detected",
          severity: "Moderate",
          description: `An environmental issue has been reported at ${locationStr}. The AI model could not analyze the photo at this time — please describe what you see in the text box below and submit your report manually.`,
        },
      });
    }

    const data = await response.json();
    const rawText = data.candidates?.[0]?.content?.parts?.[0]?.text || "";
    console.log("Gemini raw response:", rawText);

    // Extract JSON even if Gemini wraps it in markdown code blocks
    const jsonMatch = rawText.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      console.error("No JSON found in response:", rawText);
      return NextResponse.json({ 
        success: true, 
        classification: {
          type: "Garbage",
          materialType: null,
          confidence: 40,
          shortLabel: "Unidentified issue",
          description: `An environmental issue has been reported at ${locationStr}. The photo could not be fully analyzed. Please verify and update the description manually.`
        }
      });
    }

    const classification = JSON.parse(jsonMatch[0]);
    // Ensure description is always present
    if (!classification.description) {
      classification.description = `An environmental issue (${classification.type}) has been reported at ${locationStr}.`;
    }
    classification.locationStr = locationStr;

    return NextResponse.json({ success: true, classification });

  } catch (error) {
    console.error("Classification error:", error);
    return NextResponse.json({ error: "Internal Server Error", details: error.message }, { status: 500 });
  }
}
