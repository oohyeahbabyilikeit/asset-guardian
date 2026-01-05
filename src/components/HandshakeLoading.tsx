import { useTypewriter } from '@/hooks/useTypewriter';
import { demoAsset, demoContractor } from '@/data/mockAsset';

interface HandshakeLoadingProps {
  onComplete: () => void;
}

const bootSequence = [
  'Connecting to asset vault...',
  `Loading asset #${demoAsset.id}...`,
  'Analyzing system health...',
  'Complete.',
];

export function HandshakeLoading({ onComplete }: HandshakeLoadingProps) {
  const { displayedLines, isComplete, currentLineIndex } = useTypewriter({
    lines: bootSequence,
    typingSpeed: 30,
    lineDelay: 500,
    onComplete: () => {
      setTimeout(onComplete, 600);
    },
  });

  return (
    <div className="fixed inset-0 bg-background flex flex-col items-center justify-center overflow-hidden">
      {/* Contractor Branding */}
      <div className="mb-8 flex flex-col items-center">
        <div 
          className="w-16 h-16 rounded-2xl flex items-center justify-center text-white font-bold text-2xl shadow-lg mb-4"
          style={{ backgroundColor: demoContractor.accentColor }}
        >
          {demoContractor.name.charAt(0)}
        </div>
        <p className="text-xs text-muted-foreground uppercase tracking-wider">
          Powered by {demoContractor.name}
        </p>
      </div>

      {/* Loading Spinner */}
      <div className="relative mb-8">
        <div className="w-16 h-16 rounded-full border-4 border-muted"></div>
        <div 
          className="absolute top-0 left-0 w-16 h-16 rounded-full border-4 border-transparent border-t-primary animate-spin"
        ></div>
      </div>

      {/* Status Messages */}
      <div className="w-full max-w-xs px-6 text-center">
        {displayedLines.map((line, index) => (
          <div
            key={index}
            className={`mb-2 text-sm transition-all ${
              line.includes('Complete')
                ? 'text-green-600 font-medium'
                : 'text-muted-foreground'
            }`}
          >
            {line}
          </div>
        ))}
      </div>

      {/* Progress Dots */}
      <div className="absolute bottom-12 left-1/2 -translate-x-1/2">
        <div className="flex gap-2">
          {bootSequence.map((_, index) => (
            <div
              key={index}
              className={`w-2 h-2 rounded-full transition-all duration-300 ${
                index <= currentLineIndex
                  ? 'bg-primary'
                  : 'bg-muted'
              }`}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
