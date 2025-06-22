import React, { useState } from "react";
import Landing from "@/components/Landing";
import { SyllabusUpload } from "./SyllabusUpload";
import { SubjectConfigForm, SubjectConfig } from "@/components/SubjectConfigForm";

export const QuestionPaperWizard = () => {
  const [step, setStep] = useState(0);
  const [subjectConfig, setSubjectConfig] = useState<SubjectConfig>({
    subjectName: "",
    regulation: "R2017",
    sections: [],
  });

  const handleExtracted = (data: {
    subjectName: string;
    syllabusText: string;
  }) => {
    setSubjectConfig((prev) => ({
      ...prev,
      subjectName: data.subjectName,
    }));
    setStep(2);
  };

  const handleGenerate = async () => {
    // Here you can call your `/api/generate-questions` in loop per section
    console.log("🔁 Sending to backend:", subjectConfig);
  };

  return (
    <>
      {step === 0 && <Landing onStart={() => setStep(1)} />}
      {step === 1 && <SyllabusUpload onExtracted={handleExtracted} />}
      {step === 2 && (
        <SubjectConfigForm
          config={subjectConfig}
          onConfigChange={setSubjectConfig}
          onGenerate={handleGenerate}
        />
      )}
    </>
  );
};
