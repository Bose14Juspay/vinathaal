import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export const SyllabusUpload = ({
  onExtracted,
}: {
  onExtracted: (data: {
    subjectName: string;
    syllabusText: string;
  }) => void;
}) => {
  const [uploading, setUploading] = useState(false);
  const [file, setFile] = useState<File | null>(null);

  const handleUpload = async () => {
    if (!file) return;

    setUploading(true);
    const formData = new FormData();
    formData.append("image", file);

    try {
      const res = await fetch("http://localhost:4000/api/extract-syllabus", {
        method: "POST",
        body: formData,
      });
      const data = await res.json();
      onExtracted(data);
    } catch (err) {
      console.error("Upload failed:", err);
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="p-8 text-center max-w-2xl mx-auto">
      <h2 className="text-2xl font-semibold mb-4">Upload Your Syllabus Image</h2>
      <Input
        type="file"
        accept="image/*"
        onChange={(e) => setFile(e.target.files?.[0] || null)}
      />
      <Button onClick={handleUpload} className="mt-4" disabled={!file || uploading}>
        {uploading ? "Uploading..." : "Extract Syllabus"}
      </Button>
    </div>
  );
};
