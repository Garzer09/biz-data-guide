import { useState } from "react";
import { SplashScreen } from "@/components/splash-screen";
import { MainLayout } from "@/components/layout/main-layout";

const Index = () => {
  const [showSplash, setShowSplash] = useState(true);

  if (showSplash) {
    return <SplashScreen onStart={() => setShowSplash(false)} />;
  }

  return <MainLayout />;
};

export default Index;
