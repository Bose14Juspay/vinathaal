const express = require('express');
const multer = require('multer');
const Tesseract = require('tesseract.js');
const fs = require('fs');
const sharp = require('sharp');

const router = express.Router();
const upload = multer({ dest: 'uploads/' });

// === 🧠 Smart Roman Numeral Fixer ===
function normalizeUnitsWithInference(text) {
  const romanMap = {
    I: ['I', 'l', '1', '|'],
    V: ['V'],
    X: ['X']
  };

  const romanNumerals = ['I', 'II', 'III', 'IV', 'V', 'VI', 'VII', 'VIII', 'IX', 'X'];

  let count = 0;

  return text.replace(/UNIT\s+([A-Za-z|1]{1,5})/g, (match, fuzzy) => {
    const cleaned = fuzzy
      .toUpperCase()
      .split('')
      .map(c => {
        if (romanMap.I.includes(c)) return 'I';
        if (romanMap.V.includes(c)) return 'V';
        if (romanMap.X.includes(c)) return 'X';
        return '';
      })
      .join('');

    // If it's a valid roman numeral, use it. Else fallback to inferred unit
    const normalized = romanNumerals.includes(cleaned)
      ? cleaned
      : romanNumerals[count] || 'I';

    return `UNIT ${romanNumerals[count++] || 'I'}`;
  });
}

router.post('/', upload.single('image'), async (req, res) => {
  console.log("📥 Received image upload:", req.file.originalname);
  const imagePath = req.file.path;
  const preprocessedPath = imagePath + '-processed.png';

  try {
    console.log("🛠️ Preprocessing image...");
    await sharp(imagePath)
      .resize({ width: 1500 })
      .grayscale()
      .threshold(140)
      .sharpen()
      .normalize()
      .toFile(preprocessedPath);

    console.log("🔍 Running OCR...");
    const result = await Tesseract.recognize(preprocessedPath, 'eng', {
      tessedit_char_whitelist: 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789:().,- ',
      preserve_interword_spaces: '1',
      logger: m => console.log("[📊 Tesseract Log]", m)
    });

    let text = result.data.text || '';
    console.log("📄 Raw OCR text length:", text.length);

    // Normalize Roman numerals (e.g. UNIT If → UNIT III)
    text = normalizeUnitsWithInference(text);
    text = '\n' + text.trim() + '\n';
    console.log("✅ Normalized OCR Text:\n", text);

    // Extract subject name from first few lines
    const lines = text.split('\n').filter(Boolean).slice(0, 6);
    console.log("🔹 Candidate lines for subject name:", lines);

    let subjectName = "Unknown";

    for (const line of lines) {
      const match = line.match(/\b[A-Z]{1,3}\d{4}\b\s+(.*)/);
      if (match) {
        let rawName = match[1].replace(/\s{2,}/g, ' ').trim();
        subjectName = rawName.replace(/\bL\s*T\s*P\s*C\b.*$/i, '').trim();
        break;
      }
    }

    // Extract syllabus content from UNIT I to OUTCOMES or end
    const unitStart = text.search(/UNIT\s+I/i);
    const endMatch = text.slice(unitStart).match(/(OUTCOMES|TEXT\s+BOOKS|REFERENCES|TOTAL\s*:\s*\d+\s*PERIODS)/i);
    const endIndex = endMatch ? unitStart + endMatch.index : text.length;

    const unitsText =
      unitStart !== -1
        ? text.slice(unitStart, endIndex).replace(/(UNIT\s+[IVX]+)/g, '\n\n$1')
        : text;

    console.log("📚 Extracted syllabus content length:", unitsText.length);
    console.log("✅ Extracted subject name:", subjectName);

    res.json({
      subjectName,
      syllabusText: unitsText
    });

  } catch (err) {
    console.error("❌ OCR/Extraction error:", err);
    res.status(500).json({ error: err.message });
  } finally {
    try {
      fs.unlinkSync(imagePath);
      fs.unlinkSync(preprocessedPath);
    } catch (e) {
      console.warn("⚠️ Cleanup error:", e.message);
    }
  }
});

module.exports = router;
