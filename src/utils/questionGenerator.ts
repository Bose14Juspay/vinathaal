
import { SectionConfig } from '@/components/SubjectConfigForm';

export type GeneratedQuestion = {
  text: string;
  marks: number;
  unit: string;
  difficulty: string;
};

const QUESTION_TEMPLATES = {
  easy: [
    "Define {topic}. List its key characteristics.",
    "What is {topic}? Explain with examples.",
    "List the main features of {topic}.",
    "Explain the basic concept of {topic}.",
    "What are the advantages of {topic}?"
  ],
  medium: [
    "Explain {topic} in detail with suitable examples.",
    "Compare and contrast {topic} with related concepts.",
    "Describe the working principle of {topic}.",
    "Analyze the role of {topic} in modern systems.",
    "Discuss the implementation of {topic} with diagrams."
  ],
  hard: [
    "Critically evaluate the effectiveness of {topic} in complex scenarios.",
    "Design and implement a solution using {topic} for a real-world problem.",
    "Analyze the performance implications of {topic} and suggest optimizations.",
    "Justify the use of {topic} over alternative approaches with detailed comparison.",
    "Propose modifications to {topic} to address current limitations."
  ]
};

export const generateQuestions = (
  section: SectionConfig,
  unitTopics: Record<string, string[]>
): GeneratedQuestion[] => {
  const questions: GeneratedQuestion[] = [];
  const numQuestions = parseInt(section.numQuestions);
  const marksPerQuestion = parseInt(section.marksPerQuestion);
  
  if (isNaN(numQuestions) || isNaN(marksPerQuestion)) {
    return [];
  }

  // Get available topics from selected units
  const availableTopics: Array<{topic: string, unit: string}> = [];
  section.units.forEach(unit => {
    if (unitTopics[unit]) {
      unitTopics[unit].forEach(topic => {
        availableTopics.push({ topic, unit });
      });
    }
  });

  if (availableTopics.length === 0) {
    // Fallback if no topics available
    const fallbackTopics = [
      "fundamental concepts", "basic principles", "core theories",
      "implementation strategies", "design patterns", "optimization techniques"
    ];
    fallbackTopics.forEach(topic => {
      availableTopics.push({ topic, unit: section.units[0] || 'unit1' });
    });
  }

  // Generate questions
  for (let i = 0; i < numQuestions; i++) {
    const topicData = availableTopics[i % availableTopics.length];
    const templates = QUESTION_TEMPLATES[section.difficulty as keyof typeof QUESTION_TEMPLATES] || QUESTION_TEMPLATES.medium;
    const template = templates[Math.floor(Math.random() * templates.length)];
    const questionText = template.replace('{topic}', topicData.topic);

    questions.push({
      text: questionText,
      marks: marksPerQuestion,
      unit: topicData.unit,
      difficulty: section.difficulty
    });
  }

  return questions;
};

export const formatUnitDisplay = (unit: string): string => {
  const unitMap: Record<string, string> = {
    'unit1': 'UNIT I',
    'unit2': 'UNIT II',
    'unit3': 'UNIT III',
    'unit4': 'UNIT IV',
    'unit5': 'UNIT V'
  };
  return unitMap[unit] || unit.toUpperCase();
};
