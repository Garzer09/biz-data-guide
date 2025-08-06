import { Button } from "@/components/ui/button";

interface SplashScreenProps {
  onStart: () => void;
}

export function SplashScreen({ onStart }: SplashScreenProps) {
  return (
    <div className="min-h-screen bg-gradient-hero flex items-center justify-center">
      <div className="text-center text-white">
        <h1 className="text-6xl font-bold mb-6">FinSight</h1>
        <p className="text-xl mb-12 text-white/90">Tu análisis económico inteligente</p>
        <Button 
          onClick={onStart}
          size="lg"
          className="bg-white/20 text-white border border-white/30 hover:bg-white/30 backdrop-blur-sm px-8 py-3 text-lg font-medium"
        >
          Comenzar
        </Button>
      </div>
    </div>
  );
}