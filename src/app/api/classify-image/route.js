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

    const prompt = `You are a Senior Forensic Waste Inspector for the Dharwad Municipal Corporation. Your task is to perform a high-precision technical analysis of an environmental violation at: "${locationStr}".

DO NOT provide generic summaries. I need a technical evidence report based EXACTLY on what is visible.

PHASE 1: VISUAL INSPECTION
- Identify the exact objects (e.g., "three discarded plastic milk sachets", "rusty 2-inch iron pipe", "clogged cement drain").
- Identify signs of duration (e.g., "freshly dumped", "weathered debris showing long-term accumulation").

PHASE 2: CLASSIFICATION CATEGORY
- "Water Wastage": Active leaks, stagnant pooling, pipe bursts, or drain overflows.
- "Garbage": Loose litter, household waste piles, or overflowing bins.
- "Material Waste": Specific industrial/construction debris or high-volume recyclables (Plastic/E-Waste/Glass/Metal/Paper).

PHASE 3: INCIDENT REPORT GENERATION
Write a 4-sentence technical description that:
1. Precise Identification: Start with the primary material and its estimated quantity/state.
2. Contextual Location: Describe how it relates to the immediate environment at "${locationStr}".
3. Impact Assessment: State the specific risk (e.g., "breeding ground for mosquitoes", "clogging storm-water infrastructure").
4. Forensic Detail: Note any identifying marks or colors visible.

Respond ONLY in this exact JSON format:
{"type": "<Water Wastage|Garbage|Material Waste>", "materialType": "<Plastic|E-Waste|Glass|Metal|Cardboard/Paper|Other|null>", "confidence": <0-100>, "shortLabel": "<4-6 word technical summary>", "severity": "<Minor|Moderate|Severe>", "description": "<Detailed forensic-style description as per Phase 3>"}

IMPORTANT: If you see multiple issues, prioritize the most severe. Be extremely specific about what you see in THIS exact image.`;

    // Priority: gemini-1.5-flash is the most stable and free-tier friendly vision model
    const MODELS = [
      "gemini-1.5-flash",
      "gemini-1.5-flash-latest",
      "gemini-2.0-flash",
    ];

    let lastError = "Unknown error";
    let apiResponse = null;

    for (const model of MODELS) {
      // Use stable v1 endpoint
      const url = `https://generativelanguage.googleapis.com/v1/models/${model}:generateContent?key=${apiKey}`;

      try {
        const attempt = await fetch(url, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            contents: [{ 
              parts: [
                { text: prompt }, 
                { inline_data: { mime_type: mimeType, data: base64Data } }
              ] 
            }],
            generationConfig: { 
              temperature: 0.1, 
              maxOutputTokens: 800
            },
          }),
        });

        if (attempt.ok) {
          apiResponse = await attempt.json();
          console.log(`Successfully used model: ${model}`);
          break;
        } else {
          const errData = await attempt.json();
          lastError = errData.error?.message || "API request failed";
          console.warn(`Model ${model} failed: ${lastError}`);
        }
      } catch (e) {
        lastError = e.message;
        console.error(`Fetch error for ${model}:`, e);
      }
    }

    if (!apiResponse) {
      return NextResponse.json({
        success: true,
        classification: {
          type: "Garbage",
          materialType: null,
          confidence: 0,
          shortLabel: "AI Analysis Offline",
          severity: "Moderate",
          description: `Analysis currently unavailable (Error: ${lastError}). Resident reports an issue at ${locationStr}. Please describe the situation manually.`,
        },
      });
    }

    const rawText = apiResponse.candidates?.[0]?.content?.parts?.[0]?.text || "";
    
    // Extract JSON
    const jsonMatch = rawText.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      return NextResponse.json({ 
        success: true, 
        classification: {
          type: "Garbage",
          materialType: null,
          confidence: 40,
          shortLabel: "Unidentified issue",
          description: `Reported at ${locationStr}. The photo was processed but details are unclear. Please verify manually.`
        }
      });
    }

    const classification = JSON.parse(jsonMatch[0]);
    if (!classification.description) {
      classification.description = `Incident reported at ${locationStr}. Type: ${classification.type}.`;
    }
    classification.locationStr = locationStr;

    return NextResponse.json({ success: true, classification });

  } catch (error) {
    console.error("Critical Classification Error:", error);
    return NextResponse.json({ error: "Internal Server Error", details: error.message }, { status: 500 });
  }
}
