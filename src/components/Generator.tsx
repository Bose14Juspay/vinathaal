
import React, { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "@/hooks/use-toast";
import { ArrowLeft, Code, Download, Edit } from "lucide-react";
import html2pdf from 'html2pdf.js';
import { SubjectConfigForm, SubjectConfig, SectionConfig } from './SubjectConfigForm';
import { fetchAnnaSyllabus, parseSyllabusUnits } from '@/utils/syllabusService';
import { generateQuestions, GeneratedQuestion, formatUnitDisplay } from '@/utils/questionGenerator';

type GeneratedPaper = {
  subjectCode: string;
  subjectName: string;
  sections: {
    name: string;
    questions: GeneratedQuestion[];
  }[];
  totalMarks: number;
};

export const Generator = ({ onBack }: { onBack: () => void }) => {
  const [step, setStep] = useState<"configure" | "preview">("configure");
  const [config, setConfig] = useState<SubjectConfig>({
    subjectCode: "",
    subjectName: "",
    regulation: "R2017", // ADD THIS LINE
    sections: [{
      id: crypto.randomUUID(),
      name: "Section A",
      numQuestions: "5",
      marksPerQuestion: "2",
      difficulty: "easy",
      units: ["unit1"]
    }]
  });
  
  const [generatedPaper, setGeneratedPaper] = useState<GeneratedPaper | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const paperRef = useRef<HTMLDivElement>(null);

  const handleGenerate = async () => {
    if (!config.subjectCode || !config.subjectName) {
      toast({
        title: "Missing Information",
        description: "Please fill in both subject code and subject name.",
        variant: "destructive"
      });
      return;
    }

    setIsGenerating(true);
    
    try {
      // Fetch syllabus content
      toast({
        title: "Fetching Syllabus",
        description: "Searching for Anna University syllabus...",
      });
      console.log("Fetching syllabus for:", config.subjectCode, config.subjectName);

      const syllabusText = await fetchAnnaSyllabus(config.subjectCode, config.subjectName);
      const unitTopics = parseSyllabusUnits(syllabusText);

      // Generate questions for each section
      const paperSections = await Promise.all(config.sections.map(async (section) => {
        const questions = await generateQuestions(config.subjectCode, config.subjectName, section); // Now async
        return {
          name: section.name,
          questions,
        };
      }));

      const totalMarks = paperSections.reduce((total, section) => 
        total + section.questions.reduce((sectionTotal, q) => sectionTotal + q.marks, 0), 0
      );

      const paper: GeneratedPaper = {
        subjectCode: config.subjectCode,
        subjectName: config.subjectName,
        sections: paperSections,
        totalMarks
      };

      setGeneratedPaper(paper);
      setStep("preview");

      toast({
        title: "Question Paper Generated!",
        description: "Your question paper has been generated successfully.",
      });

    } catch (error) {
      console.error("Error generating paper:", error);
      toast({
        title: "Generation Failed",
        description: "Failed to generate question paper. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsGenerating(false);
    }
  };

  const handleDownload = () => {
    const element = paperRef.current;
    if (element) {
      const opt = {
        margin: [0.5, 0.5, 0.5, 0.5],
        filename: `${config.subjectCode}_${config.subjectName.replace(/\s+/g, '_')}_Question_Paper.pdf`,
        image: { type: 'jpeg', quality: 0.98 },
        html2canvas: { scale: 2 },
        jsPDF: { unit: 'in', format: 'letter', orientation: 'portrait' }
      };
      html2pdf().from(element).set(opt).save();
    }
  };

  return (
    <div className="min-h-screen bg-gray-50/50 flex flex-col items-center justify-center p-4 sm:p-8">
      <Button variant="ghost" onClick={onBack} className="absolute top-4 left-4">
        <ArrowLeft className="mr-2 h-4 w-4" /> Back to Home
      </Button>

      {step === "configure" && (
        <SubjectConfigForm
          config={config}
          onConfigChange={setConfig}
          onGenerate={handleGenerate}
        />
      )}

      {step === "preview" && generatedPaper && (
        <Card className="w-full max-w-4xl shadow-xl">
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>Generated Question Paper</CardTitle>
            <div className="space-x-2">
              <Button variant="outline" onClick={() => setStep("configure")}>
                <Edit className="mr-2 h-4 w-4" />
                Edit Configuration
              </Button>
              <Button onClick={handleDownload}>
                <Download className="mr-2 h-4 w-4" />
                Download PDF
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <div ref={paperRef} className="p-8 border rounded-lg bg-white font-serif text-gray-800">
              <header className="text-center border-b-2 pb-4 border-gray-800">
                <h1 className="text-xl font-bold">Anna University</h1>
                <h2 className="text-lg font-semibold mt-2">
                  {generatedPaper.subjectCode} - {generatedPaper.subjectName}
                </h2>
                <div className="flex justify-between text-sm mt-3">
                  <span>Date: {new Date().toLocaleDateString()}</span>
                  <span>Time: 3 Hours</span>
                  <span>Total Marks: {generatedPaper.totalMarks}</span>
                </div>
              </header>

              <main className="mt-6">
                {generatedPaper.sections.map((section, sIndex) => (
                  <div key={sIndex} className="mb-8">
                    <h3 className="text-center font-bold text-lg mb-4 underline">
                      {section.name}
                    </h3>
                    <ol className="list-decimal list-inside space-y-4">
                      {section.questions.map((question, qIndex) => (
                        <li key={qIndex} className="flex justify-between items-start leading-relaxed">
                          <div className="flex-1">
                            <span>{question.text}</span>
                            <span className="text-xs text-gray-600 ml-2">
                              (From {formatUnitDisplay(question.unit)})
                            </span>
                          </div>
                          <span className="font-bold whitespace-nowrap ml-4">
                            [{question.marks} Mark{question.marks > 1 ? 's' : ''}]
                          </span>
                        </li>
                      ))}
                    </ol>
                  </div>
                ))}
              </main>

              <footer className="text-center text-xs text-gray-500 pt-4 mt-8 border-t">
                Generated using AI by Lovable • Anna University Question Paper Format
              </footer>
            </div>
          </CardContent>
        </Card>
      )}

      {isGenerating && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <Card className="p-6 max-w-sm">
            <div className="text-center">
              <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full mx-auto mb-4"></div>
              <p className="font-medium">Generating Question Paper...</p>
              <p className="text-sm text-muted-foreground mt-1">
                Fetching syllabus and creating questions
              </p>
            </div>
          </Card>
        </div>
      )}
    </div>
  );
};
