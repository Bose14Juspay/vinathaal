
import React, { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "@/hooks/use-toast";
import { UploadCloud, FileText, Settings, TestTube2, Download, ArrowLeft } from "lucide-react";
import html2pdf from 'html2pdf.js';

type PaperConfig = {
  examType: string;
  totalMarks: string;
  subject: string;
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
  const [config, setConfig] = useState<PaperConfig>({ examType: "Midterm Exam", totalMarks: "100", subject: "Introduction to Computer Science" });
  const [generatedPaper, setGeneratedPaper] = useState<GeneratedPaper | null>(null);
  const paperRef = useRef<HTMLDivElement>(null);

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      if (file.type === "text/plain") {
        const reader = new FileReader();
        reader.onload = (e) => {
          setSyllabusText(e.target?.result as string);
          setFileName(file.name);
        };
        reader.readAsText(file);
      } else {
        toast({
          title: "Unsupported File Type",
          description: "For this demo, please upload a .txt file.",
          variant: "destructive",
        });
      }
    }
  };

  const handleGenerate = () => {
    // Simple topic extraction: assumes each line is a topic
    const topics = syllabusText.split('\n').filter(line => line.trim() !== '');
    if (topics.length === 0) {
      toast({ title: "Syllabus is empty!", description: "Please upload a syllabus with some content.", variant: "destructive" });
      return;
    }

    const marksPerQuestion = Math.floor(parseInt(config.totalMarks) / topics.length);

    // Mock question generation
    const questions = topics.map((topic, index) => ({
      text: `Elaborate on the key principles of "${topic}". Discuss its applications and significance.`,
      marks: marksPerQuestion,
    }));

    const paper: GeneratedPaper = {
      title: config.examType,
      subject: config.subject,
      totalMarks: config.totalMarks,
      sections: [{
        title: "Section A",
        questions,
      }],
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
            <p className="text-muted-foreground mt-2">Upload a .txt file with your syllabus topics, one topic per line.</p>
            <div className="mt-6">
              <Label htmlFor="syllabus-upload" className="cursor-pointer bg-primary text-primary-foreground px-6 py-3 rounded-md font-semibold inline-block">
                Choose File
              </Label>
              <Input id="syllabus-upload" type="file" className="hidden" onChange={handleFileChange} accept=".txt" />
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
               <div>
                <Label htmlFor="total-marks">Total Marks</Label>
                <Input id="total-marks" type="number" value={config.totalMarks} onChange={e => setConfig({...config, totalMarks: e.target.value})} />
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
