
import { useState } from "react";
import Landing from "@/components/Landing";
import { Generator } from "@/components/Generator";

const Index = () => {
  const [started, setStarted] = useState(false);

  if (!started) {
    return <Landing onStart={() => setStarted(true)} />;
  }

  return <Generator onBack={() => setStarted(false)} />;
};

export default Index;
