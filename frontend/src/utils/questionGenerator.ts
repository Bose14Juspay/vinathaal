
import { SectionConfig } from '@/components/SubjectConfigForm';

export type GeneratedQuestion = {
  text: string;
  unit: string;
  marks: number;
};

export async function generateQuestions(
  subjectCode: string,
  subjectName: string,
  section: SectionConfig,
): Promise<GeneratedQuestion[]> {
  const response = await fetch("http://127.0.0.1:8000/generate-questions", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      subjectCode,  // ✅ uses the argument passed to the function
      subjectName,  // ✅ same here
      regulation: "R2017",
      sections: [
        {
          id: section.id,
          name: section.name,
          numQuestions: section.numQuestions,
          marksPerQuestion: section.marksPerQuestion,
          difficulty: section.difficulty,
          units: section.units
        }
      ]
    })    
  });

  const data = await response.json();

  // Parse Gemini-generated plain-text into list of questions
  const lines = data.questions.split(/\n+/).filter((line: string) => line.trim().length > 0);

  return lines.map((line: string, index: number) => ({
    text: line.replace(/^\d+[\.\)]?\s*/, ""), // Remove numbering if any
    unit: section.units[0], // Or try to extract from question text if needed
    marks: parseInt(section.marksPerQuestion)
  }));
}

export function formatUnitDisplay(unit: string): string {
  const unitNumber = parseInt(unit.replace("unit", ""));
  const romanNumerals = ["I", "II", "III", "IV", "V", "VI", "VII", "VIII", "IX", "X"];
  if (!isNaN(unitNumber) && unitNumber >= 1 && unitNumber <= 10) {
    return `Unit ${romanNumerals[unitNumber - 1]}`;
  }
  return unit; // fallback if format is unknown
}