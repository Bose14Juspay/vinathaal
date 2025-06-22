// utils/syllabusService.ts
const BASE_URL = "http://localhost:4000";
export type SyllabusExtractedData = {
  subjectName: string;
  syllabusText: string;
};

export async function uploadImageAndExtractSyllabus(file: File): Promise<SyllabusExtractedData> {
  const formData = new FormData();
  formData.append("image", file);

  const response = await fetch(`${BASE_URL}/api/extract-syllabus`, {
    method: "POST",
    body: formData
  });

  if (!response.ok) {
    throw new Error("OCR failed while extracting syllabus from image.");
  }

  const data = await response.json();

  return {
    subjectName: data.subjectName ?? "Unknown",
    syllabusText: data.syllabusText ?? ""
  };
}

export async function fetchAnnaSyllabus(subjectName: string): Promise<string> {
  return `UNIT I\nIntroduction to ${subjectName}\n\nUNIT II\nAdvanced Concepts\n\nUNIT III\nSystem Design\n\nUNIT IV\nOptimization Techniques\n\nUNIT V\nApplications`;
}

export function parseSyllabusUnits(text: string): { [key: string]: string[] } {
  const units: { [key: string]: string[] } = {};
  const matches = text.matchAll(/UNIT\s+([IVX]+)[\s\n\r]+([^]*?)(?=\n\nUNIT\s+[IVX]+|$)/g);

  const romanToArabic: { [key: string]: string } = {
    I: "1", II: "2", III: "3", IV: "4", V: "5", VI: "6", VII: "7", VIII: "8", IX: "9", X: "10"
  };

  for (const match of matches) {
    const roman = match[1].toUpperCase();
    const unitKey = `unit${romanToArabic[roman] || roman.toLowerCase()}`;
    const topics = match[2]
      .split(/\n|—|–|•|\+/)
      .map(line => line.trim())
      .filter(line => line.length > 5);
    units[unitKey] = topics;
  }

  return units;
}
