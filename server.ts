/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import express from "express";
import path from "path";
import dotenv from "dotenv";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI, Type } from "@google/genai";

dotenv.config();

const app = express();
const PORT = 3000;

// Setup generic middlewares
app.use(express.json({ limit: "15mb" }));
app.use(express.urlencoded({ extended: true, limit: "15mb" }));

// Initialize Gemini Client with correct User-Agent for tracking
const geminiKey = process.env.GEMINI_API_KEY;
let ai: GoogleGenAI | null = null;

if (geminiKey) {
  ai = new GoogleGenAI({
    apiKey: geminiKey,
    httpOptions: {
      headers: {
        'User-Agent': 'aistudio-build',
      }
    }
  });
} else {
  console.warn("WARNING: GEMINI_API_KEY is not defined. AI features will fallback to mock logic.");
}

// Ensure database/backend is modular and can fallback gracefully
// Endpoints first

// Health Check
app.get("/api/health", (req, res) => {
  res.json({
    status: "ok",
    app: "Vitara",
    time: new Date().toISOString(),
    aiConfigured: !!ai
  });
});

// 1. AI Risk Scoring Endpoint
app.post("/api/gemini/risk-score", async (req, res) => {
  try {
    const { transactions, userAnswers } = req.body;

    if (!ai) {
      // Mock score if no AI key configured to let preview run gracefully
      return res.json({
        score: 82,
        grade: "B",
        recommendedPlan: "health",
        analysisReason: "Analysis of your OPay daily transfers, stable monthly savings, and frequent supermarket receipts indicate modest financial buffer. Risk exposure checked as Low-Medium based on age and steady trade records (Mock Fallback).",
        indicators: {
          incomeStability: "High",
          spendingDiscipline: "Medium",
          savingBuffer: "Medium",
          healthExposure: "Low"
        }
      });
    }

    const transactionPrompt = Array.isArray(transactions) 
      ? transactions.map((t: any) => `- ${t.date}: ${t.type} of ₦${t.amount} to/from ${t.sender || 'Unknown'} -> ${t.receiver || 'Unknown'} (${t.description}, category: ${t.category})`).join("\n")
      : "No transactions provided.";

    const answersPrompt = userAnswers
      ? `User Health Survey:\n- Age Bracket: ${userAnswers.ageBracket || 'Not specified'}\n- Primary Occupation/Work: ${userAnswers.occupation || 'Not specified'}\n- Pre-existing conditions or regular medication: ${userAnswers.hasPreExisting || 'No'}\n- Dependents counting: ${userAnswers.dependents || '0'}`
      : "No extra survey details.";

    const prompt = `You are Vitara's AI underwriting engine embedded inside OPay. 
Analyze the user's OPay financial transaction logs to estimate their cashflow stability, healthcare risks, and premium qualification scores.

OPay Transaction History:
${transactionPrompt}

${answersPrompt}

Evaluate the user with these considerations:
1. Income stability (regular deposits, business sales, high/low variance).
2. Saving buffers (percentage of cashflow saved, standard out of pocket safety margin).
3. Healthcare risk factors (frequent pharmacy expenditures or doctor visits reflect active exposure, while physical occupations like Transport Rider might warrant broader coverage like Health or Premier plans).

Calculate:
- Risk score: 0 to 100 where higher score means LOWER risk / higher stability (Better grade).
- Grade: A (85-100, excellent buffer, safe), B (70-84, good buffer, moderate), C (50-69, irregular income, standard exposure), D (<50, high risk/vulnerable cashflow).
- Recommended Plan: 'foundation' for low incomes or basic coverage, 'health' for medium stable trades, 'premier' for active risk workers (Riders/Gig workers) or high income tiers.
- analysisReason: A comprehensive, friendly microinsurance advice summary tailored to ordinary Nigerians (can use gentle Pidgin accents if appropriate, but primarily professional English).
- indicators: Evaluate high/medium/low ratings for incomeStability, spendingDiscipline, savingBuffer, and healthExposure.

Your response must strictly match the expected JSON schema.`;

    const response = await ai.models.generateContent({
      model: "gemini-3.5-flash",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          required: ["score", "grade", "recommendedPlan", "analysisReason", "indicators"],
          properties: {
            score: { 
              type: Type.INTEGER, 
              description: "Final financial and health scoring from 0 to 100 where higher is better." 
            },
            grade: { 
              type: Type.STRING, 
              description: "Grade rating: A, B, C, or D." 
            },
            recommendedPlan: { 
              type: Type.STRING, 
              description: "Recommended plan tier: foundation, health, or premier." 
            },
            analysisReason: { 
              type: Type.STRING, 
              description: "Comprehensive written advice explaining the risk score, including what aspects of OPay activity or occupation fields led to this scoring." 
            },
            indicators: {
              type: Type.OBJECT,
              required: ["incomeStability", "spendingDiscipline", "savingBuffer", "healthExposure"],
              properties: {
                incomeStability: { type: Type.STRING, description: "High, Medium, or Low" },
                spendingDiscipline: { type: Type.STRING, description: "High, Medium, or Low" },
                savingBuffer: { type: Type.STRING, description: "High, Medium, or Low" },
                healthExposure: { type: Type.STRING, description: "High, Medium, or Low" },
              }
            }
          }
        }
      }
    });

    const bodyText = response.text || "{}";
    const result = JSON.parse(bodyText.trim());
    return res.json(result);
  } catch (error: any) {
    console.error("Error evaluating risk score:", error);
    return res.status(500).json({ error: error.message || "Failed to calculate risk score" });
  }
});

// 2. OCR and Fraud Claim Validator Endpoint
app.post("/api/gemini/ocr-claim", async (req, res) => {
  try {
    const { imageBase64, mimeType, fallbackTextContent } = req.body;

    if (!ai) {
      // Return beautiful mock OCR results if AI not configured
      return res.json({
        patientName: "Mama Chisom",
        hospitalName: "Ketu Medical Clinic, Lagos",
        treatmentDate: new Date().toISOString().split('T')[0],
        diagnoses: ["Malaria & Severe Typhoid Fever"],
        items: [
          { description: "General Consultation & Registration", cost: 5000 },
          { description: "Full Blood Count & Widal Test", cost: 12000 },
          { description: "Artesunate Injection (Malaria Core)", cost: 15000 },
          { description: "Oral Medication & Antibiotics", cost: 18000 }
        ],
        totalAmount: 50000,
        receiptNumber: "KMC-2026-90821",
        classification: "Malaria/Outpatient",
        fraudAlerts: {
          isSuspicious: false,
          reason: "Hospital facility matches registered list. Medical billing amounts align with NHIA default pricing limits. Verified low-risk claim.",
          score: 12
        }
      });
    }

    let contentsPayload: any;

    const basePrompt = `You are Vitara's AI Claims Assessor. 
Analyze the provided medical bills or receipt documents. 
You must:
1. Extract OCR text, billing items (description and cost), patient name, hospital center name, treatment date, and diagnose classifications.
2. Cross-verify against clinical fraud templates:
   - Does billing look normal? (e.g., charge duplication, unreasonable injection costs exceeding standard Nigerian ward prices)
   - Is the facility clear?
   - Classify the claim into: Maternity, Emergency, Accident, Malaria/Outpatient, Prescription, Surgery, or Unknown.
3. Assess the fraud profile:
   - Rate suspicion from 0 (completely legit) to 100 (severe suspect).
   - Flag as suspicious if there are matching patient/facility discrepancies or altered digits.
   - For low-risk claims, they will be auto-approved, while high-risk claims (>40) will escalate to human review.

Provide output in strict structured JSON.`;

    if (imageBase64 && mimeType) {
      const imagePart = {
        inlineData: {
          mimeType: mimeType,
          data: imageBase64
        }
      };
      contentsPayload = {
        parts: [
          imagePart,
          { text: `${basePrompt}\nExtract data from this uploaded PNG/JPEG hospital receipt.` }
        ]
      };
    } else {
      // User selected a sample text representation
      contentsPayload = `${basePrompt}\nExtract information from typical billing records printed below:\n${fallbackTextContent || '(No document data sent)'}`;
    }

    const response = await ai.models.generateContent({
      model: "gemini-3.5-flash",
      contents: contentsPayload,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          required: ["patientName", "hospitalName", "treatmentDate", "diagnoses", "items", "totalAmount", "receiptNumber", "classification", "fraudAlerts"],
          properties: {
            patientName: { type: Type.STRING, description: "Name of patient extracted from document" },
            hospitalName: { type: Type.STRING, description: "Name of clinic, hospital, or pharmacy center" },
            treatmentDate: { type: Type.STRING, description: "Date of treatment or invoice issue (YYYY-MM-DD format if possible)" },
            diagnoses: { 
              type: Type.ARRAY, 
              items: { type: Type.STRING }, 
              description: "Array of diagnoses, medical condition names, or treatment descriptions detected." 
            },
            items: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                required: ["description", "cost"],
                properties: {
                  description: { type: Type.STRING, description: "Line item description" },
                  cost: { type: Type.NUMBER, description: "Cost value in Naira" }
                }
              }
            },
            totalAmount: { type: Type.NUMBER, description: "Grand total on receipt in Naira" },
            receiptNumber: { type: Type.STRING, description: "Receipt or Invoice Reference serial number" },
            classification: { 
              type: Type.STRING, 
              description: "Must be exactly one of: Maternity, Emergency, Accident, Malaria/Outpatient, Prescription, Surgery, or Unknown" 
            },
            fraudAlerts: {
              type: Type.OBJECT,
              required: ["isSuspicious", "reason", "score"],
              properties: {
                isSuspicious: { type: Type.BOOLEAN, description: "True if suspicious editing, double billing, or over-billing is detected." },
                reason: { type: Type.STRING, description: "Brief audit evaluation explaining integrity rating." },
                score: { type: Type.INTEGER, description: "Suspicion score from 0 to 100." }
              }
            }
          }
        }
      }
    });

    const bodyText = response.text || "{}";
    const result = JSON.parse(bodyText.trim());
    return res.json(result);
  } catch (error: any) {
    console.error("Error parsing claim OCR/fraud assessment:", error);
    return res.status(500).json({ error: error.message || "Failed to analyze document" });
  }
});

// 3. Multilingual Support Chat Endpoint
app.post("/api/gemini/support-chat", async (req, res) => {
  try {
    const { messages, selectedLanguage, userProfile } = req.body;

    if (!ai) {
      // Fallback response generator if API key is not configured
      const reply = "Welcome to Vitara Health support. I am here to help you register, renew your monthly contribution, or submit hospital claims directly from your OPay wallet. Standard plans cover emergency ward treatment, maternity, diagnostics, and pharmacies up to ₦150,000 to ₦1,000,000 annually. Feel free to ask anything! (Mock Response)";
      return res.json({ reply });
    }

    const languageInstructionMap: Record<string, string> = {
      en: "Respond in clear, professional West African English.",
      pidgin: "Respond in friendly, natural Nigerian Pidgin English (e.g. use terms like 'No wahala', 'You dey cover', 'abeg', 'worry free'). Keep it highly respectful and practical, sounding like an OPay assistant speaking to a market trade expert.",
      yoruba: "Respond primarily in gentle Yoruba language combined with helpful English terms where appropriate for finance.",
      hausa: "Respond primarily in pleasant Hausa language to explain microinsurance with ease.",
      igbo: "Respond primarily in pleasant Igbo language, demonstrating deep care, warm community concern, and clear microfinance assistance."
    };

    const activeLanguageInstruction = languageInstructionMap[selectedLanguage || 'en'] || languageInstructionMap.en;

    const userStatusMsg = userProfile && userProfile.isEnrolled
      ? `User Status: ENROLLED on the ${userProfile.activePlan?.toUpperCase()} plan. OPay Bal: ₦${userProfile.opayBalance}. Email: ${userProfile.email}.`
      : `User Status: NOT ENROLLED yet. Considering insurance choices. OPay Bal: ₦${userProfile?.opayBalance || 0}.`;

    const systemInstruction = `You are "Vitara Support Assistant" - an advanced, extremely friendly AI care officer inside the Vitara microhealth portal on OPay.
Your task is to answer user queries with compassion, clear explanations, and precise solutions.

Vitara Microhealth Overview:
- We are a microinsurance technology platform embedded in OPay, partnering with NAICOM underwriters. OPay handles the money/wallets; we run the premium auto-debits, risk scoring, and Gemini-based automated claims approving layers.
- Plans:
  1. Foundation Plan: ₦500/month. Standard cover: Basic emergency ward admissions, acute child care.
  2. Health Plan: ₦1,500/month. Cover: Maternity delivery, outpatient clinical consults, routine lab diagnostics, emergency surgery list.
  3. Premier Plan: ₦3,500/month. Cover: Broad hospitalization, full surgeries, dental/physiotherapy list, and high pharmacy allowances.
- Key Workflows:
  - Enrollment takes under 3 minutes, requiring OPay transactional history authorization to create a personalized Health Risk Score.
  - Claims process: User takes a clear photo of the hospital receipt/bill. Gemini OCR analyzes, detects fraud levels, and approves low-risk items instantly. Disbursements land inside their OPay wallet in under 2 hours. High-risk bills escalate to safe manual audit reviews (within 24 hours).

${userStatusMsg}

Language directive:
${activeLanguageInstruction}

Keep response helpful, direct, short (under 130 words) for neat rendering in mobile chats, and avoid unnecessary technical jargon like server hostnames. Always focus on how Vitara prevents market traders, transport riders, and everyday workers from financial ruin (recalling Mama Chisom's story if they ask why Vitara exists, highlighting that 'health is not a luxury, protection should not be either').`;

    // Process message list for GenAI Chat API
    // We will use the standard contents parameter matching the Gemini API instructions
    const conversationParts = messages.map((m: any) => {
      return {
        role: m.role === 'model' ? 'model' : 'user',
        parts: [{ text: m.content }]
      };
    });

    const response = await ai.models.generateContent({
      model: "gemini-3.5-flash",
      contents: conversationParts,
      config: {
        systemInstruction: systemInstruction,
        temperature: 0.7
      }
    });

    return res.json({ reply: response.text || "I am here to help you." });
  } catch (error: any) {
    console.error("Error in support-chat:", error);
    return res.status(500).json({ error: error.message || "Failed to generate chat response" });
  }
});


async function bootstrap() {
  // Serve static Vite assets in production, or hook up dev proxy
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  // Start listener
  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Vitara Full-Stack Server running on gold-standard port: http://0.0.0.0:${PORT}`);
  });
}

bootstrap();
