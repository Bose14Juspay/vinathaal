const express = require("express");
const axios = require("axios");
const router = express.Router();
require("dotenv").config();

const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
const GEMINI_ENDPOINT = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-pro:generateContent?key=${GEMINI_API_KEY}`;

function formatUnitLabel(unit) {
  if (typeof unit === "string" && unit.toLowerCase().startsWith("unit")) {
    return `UNIT ${unit.slice(4)}`;
  }
  return `UNIT ${unit}`;
}

router.post("/generate-questions", async (req, res) => {
  const { subjectName, regulation, sections, unitTopics } = req.body;

  if (!sections?.length || !unitTopics) {
    return res.status(400).json({ error: "Missing sections or unitTopics" });
  }

  const section = sections[0]; // assuming one section at a time
  const { difficulty, units, marksPerQuestion, numQuestions } = section;

  const totalUnits = units.length;
  const questionsPerUnit = Math.floor(numQuestions / totalUnits);
  const remaining = numQuestions % totalUnits;

  const allQuestions = [];

  for (let i = 0; i < totalUnits; i++) {
    const unit = units[i];
    const unitNumber = unit.toString().replace(/[^0-9]/g, "");
    const unitKey = `unit${unitNumber}`;
    const unitContentArray = unitTopics[unitKey];
    const unitContent = Array.isArray(unitContentArray) ? unitContentArray.join("\n").trim() : "";

    if (!unitContent) {
      allQuestions.push({
        section: section.id,
        unit: formatUnitLabel(unit),
        text: `⚠️ No valid syllabus content found for ${formatUnitLabel(unit)}. Skipping question generation.`
      });
      continue;
    }

    const currentUnitQuestionCount = questionsPerUnit + (i < remaining ? 1 : 0);

    const complexity = {
      easy: "definition or concept-based question",
      medium: "application-based question with brief explanation",
      hard: "analytical or scenario-based question"
    }[difficulty.toLowerCase()] || "conceptual question";

    const lengthHint = {
      2: "one-line answer",
      5: "one and half-line answer",
      10: "two-line answer",
      13: "two-line answer",
      15: "three-line answer",
      16: "three-line answer"
    }[parseInt(marksPerQuestion)] || "brief answer";

    // ✅ Improved strict prompt
    const prompt = `
You are an AI exam paper generator for the university course "${subjectName}".

Your task:
- Generate exactly ${currentUnitQuestionCount} UNIQUE and relevant exam questions.
- Use ONLY the syllabus content provided below.
- Each question must align specifically with concepts in the unit content.
- Difficulty: ${complexity}
- Marks: ${marksPerQuestion}
- Answer length hint: ${lengthHint}

Rules:
- Return ONLY the questions in a numbered list (1. ..., 2. ..., etc.).
- DO NOT include any instructions, notes, answer hints, placeholders like "Answer in two lines", or markdown.
- DO NOT generate more or fewer questions than ${currentUnitQuestionCount}.
- Questions should be realistic, academic, and unit-specific.

Syllabus Content:
${unitContent}
    `;

    try {
      const response = await axios.post(GEMINI_ENDPOINT, {
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: {
          temperature: 0.7,
          topK: 40,
          topP: 0.95,
          maxOutputTokens: 1024
        },
        safetySettings: [
          { category: "HARM_CATEGORY_HATE_SPEECH", threshold: 4 },
          { category: "HARM_CATEGORY_SEXUALLY_EXPLICIT", threshold: 4 },
          { category: "HARM_CATEGORY_DANGEROUS_CONTENT", threshold: 4 },
          { category: "HARM_CATEGORY_HARASSMENT", threshold: 4 },
          { category: "HARM_CATEGORY_CIVIC_INTEGRITY", threshold: 4 }
        ]
      });

      const text = response.data?.candidates?.[0]?.content?.parts?.[0]?.text || "";

      const questions = text.split(/\n+/).filter(line => line.trim()).map(line => {
        const match = line.match(/^\d+[\).]?\s*(.*)$/);
        return {
          section: section.id,
          unit: formatUnitLabel(unit),
          text: match ? match[1] : line
        };
      });

      allQuestions.push(...questions);
    } catch (error) {
      console.error("❌ Error generating questions:", {
        message: error.message,
        stack: error.stack,
        responseData: error.response?.data
      });
      allQuestions.push({
        section: section.id,
        unit: formatUnitLabel(unit),
        text: `❌ Error generating questions for ${formatUnitLabel(unit)}`
      });
    }
  }

  return res.json({ questions: allQuestions });
});

module.exports = router;
