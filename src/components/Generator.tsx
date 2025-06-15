
import React, { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "@/hooks/use-toast";
import { UploadCloud, FileText, Settings, TestTube2, Download, ArrowLeft, PlusCircle, XCircle } from "lucide-react";
import html2pdf from 'html2pdf.js';
import * as pdfjsLib from 'pdfjs-dist';

// Set up the PDF worker to enable PDF parsing
import pdfjsWorker from 'pdfjs-dist/build/pdf.worker.min.mjs?url';
pdfjsLib.GlobalWorkerOptions.workerSrc = pdfjsWorker;

type SectionConfig = {
  id: string;
  title: string;
  numQuestions: string;
  marksPerQuestion: string;
};

type PaperConfig = {
  examType: string;
  totalMarks: string;
  subject: string;
  sections: SectionConfig[];
};

type GeneratedPaper = {
  title: string;
  subject: string;
  totalMarks: string;
  sections: {
    title: string;
    questions: { text: string; marks: number }[];
  }[];
};

export const Generator = ({ onBack }: { onBack: () => void }) => {
  const [step, setStep] = useState<"upload" | "configure" | "preview">("upload");
  const [syllabusText, setSyllabusText] = useState("");
  const [fileName, setFileName] = useState("");
  const [config, setConfig] = useState<PaperConfig>({
    examType: "Midterm Exam",
    totalMarks: "100",
    subject: "Introduction to Computer Science",
    sections: [{ id: crypto.randomUUID(), title: "Section A", numQuestions: "10", marksPerQuestion: "5" }]
  });
  const [generatedPaper, setGeneratedPaper] = useState<GeneratedPaper | null>(null);
  const paperRef = useRef<HTMLDivElement>(null);

  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setFileName(file.name);
    setSyllabusText(""); // Reset syllabus text on new file selection

    if (file.type === "text/plain") {
      const reader = new FileReader();
      reader.onload = (e) => {
        setSyllabusText(e.target?.result as string);
      };
      reader.readAsText(file);
    } else if (file.type === "application/pdf") {
      try {
        const arrayBuffer = await file.arrayBuffer();
        const pdf = await pdfjsLib.getDocument(arrayBuffer).promise;
        let fullText = "";
        for (let i = 1; i <= pdf.numPages; i++) {
          const page = await pdf.getPage(i);
          const textContent = await page.getTextContent();
          const pageText = textContent.items.map(item => ('str' in item ? item.str : '')).join(' ');
          fullText += pageText + '\n';
        }
        setSyllabusText(fullText);
      } catch (error) {
        console.error("Error parsing PDF:", error);
        toast({
          title: "PDF Parsing Error",
          description: "Could not read the PDF. It might be a scanned image, which is not supported yet.",
          variant: "destructive",
        });
        setFileName("");
      }
    } else {
      toast({
        title: "Unsupported File Type",
        description: "Please upload a .txt or .pdf file.",
        variant: "destructive",
      });
      setFileName("");
    }
  };

  const handleAddSection = () => {
    setConfig(prevConfig => ({
      ...prevConfig,
      sections: [
        ...prevConfig.sections,
        { id: crypto.randomUUID(), title: `Section ${String.fromCharCode(65 + prevConfig.sections.length)}`, numQuestions: "5", marksPerQuestion: "10" }
      ]
    }));
  };

  const handleRemoveSection = (id: string) => {
    setConfig(prevConfig => ({
      ...prevConfig,
      sections: prevConfig.sections.filter(section => section.id !== id)
    }));
  };

  const handleSectionChange = (id: string, field: keyof Omit<SectionConfig, 'id'>, value: string) => {
    setConfig(prevConfig => ({
      ...prevConfig,
      sections: prevConfig.sections.map(section =>
        section.id === id ? { ...section, [field]: value } : section
      )
    }));
  };

  const handleGenerate = () => {
    const topics = syllabusText.split('\n').filter(line => line.trim() !== '');
    if (topics.length === 0) {
      toast({ title: "Syllabus is empty!", description: "Please upload a syllabus with some content.", variant: "destructive" });
      return;
    }

    const questionTemplates = [
      'Elaborate on the key principles of "{topic}". Discuss its applications and significance.',
      'What is "{topic}"? Explain its core concepts with examples.',
      'Compare and contrast "{topic}" with a related concept. What are its unique features?',
      'Describe the architecture and components of "{topic}".',
      'Analyze the advantages and disadvantages of using "{topic}".',
      'Provide a detailed case study on the implementation of "{topic}".',
      'Discuss the historical development and future trends of "{topic}".',
      'Explain the role of "{topic}" in the broader context of its field.'
    ];

    let topicIndex = 0;

    const paperSections = config.sections.map(sectionConfig => {
      const numQuestions = parseInt(sectionConfig.numQuestions, 10);
      const marksPerQuestion = parseInt(sectionConfig.marksPerQuestion, 10);

      if (isNaN(numQuestions) || isNaN(marksPerQuestion) || numQuestions <= 0 || marksPerQuestion <= 0) {
        toast({ title: "Invalid Section Data", description: `Please check the values for "${sectionConfig.title}".`, variant: "destructive" });
        return null;
      }

      const questions = [];
      for (let i = 0; i < numQuestions; i++) {
        const topic = topics[topicIndex % topics.length];
        const template = questionTemplates[Math.floor(Math.random() * questionTemplates.length)];
        const questionText = template.replace('{topic}', topic);
        topicIndex++;
        questions.push({
          text: questionText,
          marks: marksPerQuestion,
        });
      }
      return { title: sectionConfig.title, questions };
    }).filter(Boolean) as { title: string; questions: { text: string; marks: number }[] }[];

    if (paperSections.length !== config.sections.length) {
      // A toast would have already been shown for the invalid section
      return;
    }

    const calculatedTotalMarks = paperSections.reduce((total, section) => total + section.questions.reduce((sectionTotal, q) => sectionTotal + q.marks, 0), 0);

    const paper: GeneratedPaper = {
      title: config.examType,
      subject: config.subject,
      totalMarks: config.totalMarks || calculatedTotalMarks.toString(),
      sections: paperSections,
    };
    setGeneratedPaper(paper);
    setStep("preview");
  };

  const handleDownload = () => {
    const element = paperRef.current;
    if (element) {
        const opt = {
          margin:       [0.5, 0.5, 0.5, 0.5],
          filename:     `${config.subject}_${config.examType}.pdf`,
          image:        { type: 'jpeg', quality: 0.98 },
          html2canvas:  { scale: 2 },
          jsPDF:        { unit: 'in', format: 'letter', orientation: 'portrait' }
        };
        html2pdf().from(element).set(opt).save();
    }
  };

  return (
    <div className="min-h-screen bg-gray-50/50 flex flex-col items-center justify-center p-4 sm:p-8">
       <Button variant="ghost" onClick={onBack} className="absolute top-4 left-4">
        <ArrowLeft className="mr-2 h-4 w-4" /> Back to Home
      </Button>
      <Card className="w-full max-w-3xl shadow-xl">
        {step === "upload" && (
          <CardContent className="p-8 text-center">
            <UploadCloud className="mx-auto h-16 w-16 text-primary/70" />
            <h2 className="mt-4 text-2xl font-bold">Upload Syllabus</h2>
            <p className="text-muted-foreground mt-2">Upload a .txt or .pdf file with your syllabus topics.</p>
            <div className="mt-6">
              <Label htmlFor="syllabus-upload" className="cursor-pointer bg-primary text-primary-foreground px-6 py-3 rounded-md font-semibold inline-block">
                Choose File
              </Label>
              <Input id="syllabus-upload" type="file" className="hidden" onChange={handleFileChange} accept=".txt,.pdf" />
            </div>
            {fileName && (
              <div className="mt-6 flex items-center justify-center bg-gray-100 p-4 rounded-md">
                <FileText className="h-5 w-5 text-green-600 mr-2" />
                <span className="font-medium">{fileName}</span>
              </div>
            )}
            <Button onClick={() => setStep("configure")} disabled={!syllabusText} className="mt-8 w-full max-w-xs">Next</Button>
          </CardContent>
        )}

        {step === "configure" && (
          <>
            <CardHeader>
              <CardTitle className="flex items-center"><Settings className="mr-3"/>Configure Paper</CardTitle>
            </CardHeader>
            <CardContent className="p-8 space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <Label htmlFor="subject">Subject Name</Label>
                  <Input id="subject" value={config.subject} onChange={e => setConfig({...config, subject: e.target.value})} />
                </div>
                <div>
                  <Label htmlFor="exam-type">Exam Type</Label>
                  <Select value={config.examType} onValueChange={value => setConfig({...config, examType: value})}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Internal Exam">Internal Exam</SelectItem>
                      <SelectItem value="Midterm Exam">Midterm Exam</SelectItem>
                      <SelectItem value="Semester Exam">Semester Exam</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div>
                <Label htmlFor="total-marks">Display Total Marks</Label>
                <Input id="total-marks" type="number" value={config.totalMarks} onChange={e => setConfig({...config, totalMarks: e.target.value})} />
                 <p className="text-xs text-muted-foreground mt-1">This is displayed in the paper header. Actual marks are calculated from sections.</p>
              </div>

              <div className="space-y-4 pt-4 border-t">
                <div className="flex justify-between items-center">
                   <h3 className="text-lg font-medium">Sections</h3>
                   <Button variant="outline" size="sm" onClick={handleAddSection}><PlusCircle className="mr-2"/> Add Section</Button>
                </div>
                {config.sections.map((section, index) => (
                  <div key={section.id} className="p-4 border rounded-lg bg-gray-50/50 space-y-3 relative">
                     <Button variant="ghost" size="icon" className="absolute top-1 right-1 h-7 w-7" onClick={() => handleRemoveSection(section.id)}>
                        <XCircle className="text-destructive"/>
                      </Button>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div>
                        <Label htmlFor={`section-title-${section.id}`}>Title</Label>
                        <Input id={`section-title-${section.id}`} value={section.title} onChange={e => handleSectionChange(section.id, 'title', e.target.value)} />
                      </div>
                      <div>
                        <Label htmlFor={`num-questions-${section.id}`}>No. of Questions</Label>
                        <Input id={`num-questions-${section.id}`} type="number" value={section.numQuestions} onChange={e => handleSectionChange(section.id, 'numQuestions', e.target.value)} />
                      </div>
                      <div>
                        <Label htmlFor={`marks-question-${section.id}`}>Marks/Question</Label>
                        <Input id={`marks-question-${section.id}`} type="number" value={section.marksPerQuestion} onChange={e => handleSectionChange(section.id, 'marksPerQuestion', e.target.value)} />
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              <Button onClick={handleGenerate} className="w-full">
                <TestTube2 className="mr-2 h-4 w-4" />
                Generate Question Paper
              </Button>
            </CardContent>
          </>
        )}

        {step === "preview" && generatedPaper && (
          <>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>Preview & Download</CardTitle>
              <div className="space-x-2">
                <Button variant="outline" onClick={() => setStep("configure")}>Edit Config</Button>
                <Button onClick={handleDownload}><Download className="mr-2 h-4 w-4"/> Download PDF</Button>
              </div>
            </CardHeader>
            <CardContent>
                <div ref={paperRef} className="p-8 border rounded-lg bg-white font-serif text-gray-800">
                  <header className="text-center border-b-2 pb-4 border-gray-800">
                    <h1 className="text-xl font-bold">University of Academia</h1>
                    <h2 className="text-lg font-semibold mt-2">{generatedPaper.subject}</h2>
                    <div className="flex justify-between text-sm mt-2">
                      <span>{generatedPaper.title}</span>
                      <span>Date: {new Date().toLocaleDateString()}</span>
                      <span>Total Marks: {generatedPaper.totalMarks}</span>
                    </div>
                  </header>
                  <main className="mt-6">
                    {generatedPaper.sections.map((section, sIndex) => (
                      <div key={sIndex} className="mb-6">
                        <h3 className="text-center font-bold text-lg mb-4">{section.title}</h3>
                        <ol className="list-decimal list-inside space-y-4">
                          {section.questions.map((q, qIndex) => (
                            <li key={qIndex} className="flex justify-between items-start">
                              <span>{q.text}</span>
                              <span className="font-bold whitespace-nowrap ml-4">[{q.marks} Marks]</span>
                            </li>
                          ))}
                        </ol>
                      </div>
                    ))}
                  </main>
                  <footer className="text-center text-xs text-gray-500 pt-4 mt-8 border-t">
                    Generated using AI by Lovable
                  </footer>
                </div>
            </CardContent>
          </>
        )}
      </Card>
    </div>
  );
};
