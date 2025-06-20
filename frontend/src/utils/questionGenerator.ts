import { SectionConfig } from '@/components/SubjectConfigForm';

export type GeneratedQuestion = {
  text: string;
  unit: string;
  marks: number;
};

export async function generateQuestions(
  subjectCode: string,
  subjectName: string,
  section: SectionConfig
): Promise<GeneratedQuestion[]> {
  const response = await fetch("http://127.0.0.1:8000/generate-questions", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      subjectCode,
      subjectName,
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

  if (!response.ok) {
    throw new Error(`API error: ${response.statusText}`);
  }

  const data = await response.json();

  if (!Array.isArray(data.questions)) {
    console.error("Unexpected API response:", data);
    throw new Error("Invalid question data received from backend.");
  }

  return data.questions.map((q: any) => ({
    text: q.text || "",
    unit: q.unit || section.units[0],
    marks: parseInt(section.marksPerQuestion)
  }));
}

export function formatUnitDisplay(unit: string): string {
  const unitNumber = parseInt(unit.replace("unit", ""));
  const romanNumerals = ["I", "II", "III", "IV", "V", "VI", "VII", "VIII", "IX", "X"];
  if (!isNaN(unitNumber) && unitNumber >= 1 && unitNumber <= 10) {
    return `Unit ${romanNumerals[unitNumber - 1]}`;
  }
  return unit;
}
