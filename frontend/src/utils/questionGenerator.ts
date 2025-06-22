import { SectionConfig } from '@/components/SubjectConfigForm';
const BASE_URL = "http://localhost:4000"; 
export type GeneratedQuestion = {
  text: string;
  unit: string;
  marks: number;
};
type UnitTopics = {
  [unit: string]: string[]; // e.g. unit1, unit2, etc.
};

export async function generateQuestions(
  subjectName: string,
  section: SectionConfig,
  unitTopics: UnitTopics
): Promise<GeneratedQuestion[]> {
  try {
    const response = await fetch("http://localhost:4000/api/generate-questions", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
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
        ],
        unitTopics
      })
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("API Error:", response.status, errorText);
      throw new Error(`API error: ${response.status} - ${response.statusText}`);
    }

    const data = await response.json();

    if (!Array.isArray(data.questions)) {
      console.error("Invalid API response structure:", data);
      throw new Error("Invalid question data received from backend.");
    }

    return data.questions.map((q: any, index: number) => ({
      text: q.text ?? `Question ${index + 1}`,
      unit: q.unit ?? section.units[0], // fallback to first unit if not specified
      marks: parseInt(section.marksPerQuestion)
    }));

  } catch (error) {
    console.error("Failed to generate questions:", error);
    throw error;
  }
}


export function formatUnitDisplay(unit: string): string {
  const unitNumber = parseInt(unit.replace("unit", ""));
  const romanNumerals = ["I", "II", "III", "IV", "V", "VI", "VII", "VIII", "IX", "X"];
  if (!isNaN(unitNumber) && unitNumber >= 1 && unitNumber <= 10) {
    return `Unit ${romanNumerals[unitNumber - 1]}`;
  }
  return unit;
}
