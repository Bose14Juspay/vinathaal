
import React from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { PlusCircle, XCircle, TestTube2 } from "lucide-react";
import { v4 as uuidv4 } from 'uuid';

export type SectionConfig = {
  id: string;
  name: string;
  numQuestions: string;
  marksPerQuestion: string;
  difficulty: string;
  units: string[];
};

export type SubjectConfig = {
  subjectCode: string;
  subjectName: string;
  regulation: string;
  sections: SectionConfig[];
};

interface SubjectConfigFormProps {
  config: SubjectConfig;
  onConfigChange: (config: SubjectConfig) => void;
  onGenerate: () => void;
}

const DIFFICULTY_OPTIONS = [
  { value: "easy", label: "Easy" },
  { value: "medium", label: "Medium" },
  { value: "hard", label: "Hard" }
];

const UNIT_OPTIONS = [
  { value: "unit1", label: "UNIT I" },
  { value: "unit2", label: "UNIT II" },
  { value: "unit3", label: "UNIT III" },
  { value: "unit4", label: "UNIT IV" },
  { value: "unit5", label: "UNIT V" }
];

export const SubjectConfigForm = ({ config, onConfigChange, onGenerate }: SubjectConfigFormProps) => {
  const handleSubjectChange = (field: 'subjectCode' | 'subjectName', value: string) => {
    onConfigChange({ ...config, [field]: value });
  };

  const handleAddSection = () => {
    const newSection: SectionConfig = {
      id: uuidv4(),
      name: `Section ${String.fromCharCode(65 + config.sections.length)}`,
      numQuestions: "5",
      marksPerQuestion: "2",
      difficulty: "medium",
      units: ["unit1"]
    };
    onConfigChange({
      ...config,
      sections: [...config.sections, newSection]
    });
  };

  const handleRemoveSection = (id: string) => {
    onConfigChange({
      ...config,
      sections: config.sections.filter(section => section.id !== id)
    });
  };

  const handleSectionChange = (id: string, field: keyof Omit<SectionConfig, 'id'>, value: string | string[]) => {
    onConfigChange({
      ...config,
      sections: config.sections.map(section =>
        section.id === id ? { ...section, [field]: value } : section
      )
    });
  };

  const handleUnitToggle = (sectionId: string, unit: string) => {
    const section = config.sections.find(s => s.id === sectionId);
    if (!section) return;

    const updatedUnits = section.units.includes(unit)
      ? section.units.filter(u => u !== unit)
      : [...section.units, unit];

    handleSectionChange(sectionId, 'units', updatedUnits);
  };

  const calculateTotalMarks = () => {
    return config.sections.reduce((total, section) => {
      const numQuestions = parseInt(section.numQuestions) || 0;
      const marksPerQuestion = parseInt(section.marksPerQuestion) || 0;
      return total + (numQuestions * marksPerQuestion);
    }, 0);
  };

  const totalMarks = calculateTotalMarks();

  return (
    <Card className="w-full max-w-4xl">
      <CardHeader>
        <CardTitle className="flex items-center">
          <TestTube2 className="mr-3" />
          Configure Question Paper
        </CardTitle>
      </CardHeader>
      <CardContent className="p-8 space-y-6">
        {/* Subject Details */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <Label htmlFor="subject-code">Subject Code</Label>
            <Input
              id="subject-code"
              placeholder="e.g., CS8493"
              value={config.subjectCode}
              onChange={e => handleSubjectChange('subjectCode', e.target.value)}
            />
          </div>
          <div>
            <Label htmlFor="subject-name">Subject Name</Label>
            <Input
              id="subject-name"
              placeholder="e.g., Operating Systems"
              value={config.subjectName}
              onChange={e => handleSubjectChange('subjectName', e.target.value)}
            />
          </div>
        </div>

        {/* Sections Configuration */}
        <div className="space-y-4 pt-4 border-t">
          <div className="flex justify-between items-center">
            <h3 className="text-lg font-medium">Sections Configuration</h3>
            <div className="flex items-center gap-4">
              <span className={`text-sm font-medium ${totalMarks > 100 ? 'text-red-600' : 'text-green-600'}`}>
                Total Marks: {totalMarks}
              </span>
              <Button variant="outline" size="sm" onClick={handleAddSection}>
                <PlusCircle className="mr-2 h-4 w-4" />
                Add Section
              </Button>
            </div>
          </div>

          {config.sections.map((section) => (
            <div key={section.id} className="p-6 border rounded-lg bg-gray-50/50 space-y-4 relative">
              <Button
                variant="ghost"
                size="icon"
                className="absolute top-2 right-2 h-8 w-8"
                onClick={() => handleRemoveSection(section.id)}
              >
                <XCircle className="h-4 w-4 text-destructive" />
              </Button>

              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div>
                  <Label htmlFor={`section-name-${section.id}`}>Section Name</Label>
                  <Input
                    id={`section-name-${section.id}`}
                    value={section.name}
                    onChange={e => handleSectionChange(section.id, 'name', e.target.value)}
                  />
                </div>
                <div>
                  <Label htmlFor={`num-questions-${section.id}`}>No. of Questions</Label>
                  <Input
                    id={`num-questions-${section.id}`}
                    type="number"
                    value={section.numQuestions}
                    onChange={e => handleSectionChange(section.id, 'numQuestions', e.target.value)}
                  />
                </div>
                <div>
                  <Label htmlFor={`marks-question-${section.id}`}>Marks per Question</Label>
                  <Input
                    id={`marks-question-${section.id}`}
                    type="number"
                    value={section.marksPerQuestion}
                    onChange={e => handleSectionChange(section.id, 'marksPerQuestion', e.target.value)}
                  />
                </div>
                <div>
                  <Label htmlFor={`difficulty-${section.id}`}>Difficulty Level</Label>
                  <Select
                    value={section.difficulty}
                    onValueChange={value => handleSectionChange(section.id, 'difficulty', value)}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {DIFFICULTY_OPTIONS.map(option => (
                        <SelectItem key={option.value} value={option.value}>
                          {option.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div>
                <Label className="text-sm font-medium mb-2 block">Units to Cover</Label>
                <div className="flex flex-wrap gap-2">
                  {UNIT_OPTIONS.map(unit => (
                    <Button
                      key={unit.value}
                      variant={section.units.includes(unit.value) ? "default" : "outline"}
                      size="sm"
                      onClick={() => handleUnitToggle(section.id, unit.value)}
                    >
                      {unit.label}
                    </Button>
                  ))}
                </div>
              </div>
            </div>
          ))}
        </div>

        {totalMarks > 100 && (
          <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-red-800 text-sm">
              ⚠️ Total marks ({totalMarks}) exceed the recommended limit of 100. Please adjust the sections.
            </p>
          </div>
        )}

        <Button
          onClick={onGenerate}
          className="w-full"
          disabled={!config.subjectCode || !config.subjectName || config.sections.length === 0}
        >
          <TestTube2 className="mr-2 h-4 w-4" />
          Generate Question Paper
        </Button>
      </CardContent>
    </Card>
  );
};
