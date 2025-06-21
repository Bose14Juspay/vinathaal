
import Landing from "@/components/Landing";
import { useNavigate } from "react-router-dom";

const Index = () => {
  const navigate = useNavigate();

  return <Landing onStart={() => navigate("/form")} />;
};

export default Index;
