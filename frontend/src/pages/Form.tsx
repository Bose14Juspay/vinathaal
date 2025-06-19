
import { Generator } from "@/components/Generator";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import { useNavigate } from "react-router-dom";

const Form = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-gray-50/50">
      <Button 
        variant="ghost" 
        onClick={() => navigate("/")} 
        className="absolute top-4 left-4 z-10"
      >
        <ArrowLeft className="mr-2 h-4 w-4" /> Back to Home
      </Button>
      <Generator onBack={() => navigate("/")} />
    </div>
  );
};

export default Form;
