
import { Button } from "@/components/ui/button";
import { BrainCircuit } from 'lucide-react';

interface LandingProps {
  onStart: () => void;
}

const Landing = ({ onStart }: LandingProps) => {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen text-center p-4">
      <div className="absolute inset-0 -z-10 h-full w-full bg-white bg-[linear-gradient(to_right,#f0f0f0_1px,transparent_1px),linear-gradient(to_bottom,#f0f0f0_1px,transparent_1px)] bg-[size:6rem_4rem]">
        <div className="absolute bottom-0 left-0 right-0 top-0 bg-[radial-gradient(circle_800px_at_100%_200px,#d5c5ff,transparent)]"></div>
      </div>
      <div className="bg-white/50 backdrop-blur-sm p-8 rounded-2xl shadow-lg border border-gray-200">
        <div className="flex justify-center mb-6">
          <BrainCircuit className="h-16 w-16 text-primary" />
        </div>
        <h1 className="text-5xl md:text-6xl font-bold font-sans text-primary tracking-tight">
          AI Question Paper Generator
        </h1>
        <p className="mt-6 text-lg md:text-xl max-w-2xl text-muted-foreground font-sans">
          Upload your syllabus and generate perfectly structured exam question papers in seconds. Effortless, intelligent, and designed for educators.
        </p>
        <Button onClick={onStart} size="lg" className="mt-8 text-lg px-8 py-6 rounded-full font-bold">
          Start Now
        </Button>
      </div>
       <footer className="absolute bottom-4 text-center w-full text-sm text-muted-foreground">
        Generated using AI by Lovable
      </footer>
    </div>
  );
};

export default Landing;
