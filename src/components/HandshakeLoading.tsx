import { useTypewriter } from '@/hooks/useTypewriter';
import { demoAsset } from '@/data/mockAsset';

interface HandshakeLoadingProps {
  onComplete: () => void;
}

const bootSequence = [
  '> ESTABLISHING SECURE CONNECTION...',
  '> HANDSHAKE PROTOCOL: [ ACTIVE ]',
  `> FETCHING ASSET ID: #${demoAsset.id}...`,
  '> DECRYPTING FORENSIC TELEMETRY...',
  '> SYNC COMPLETE.',
];

export function HandshakeLoading({ onComplete }: HandshakeLoadingProps) {
  const { displayedLines, isComplete, currentLineIndex } = useTypewriter({
    lines: bootSequence,
    typingSpeed: 25,
    lineDelay: 400,
    onComplete: () => {
      setTimeout(onComplete, 800);
    },
  });

  return (
    <div className="fixed inset-0 bg-black flex flex-col items-center justify-center overflow-hidden">
      {/* Laser Scan Line */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-primary to-transparent opacity-80 animate-laser-scan" />
      </div>

      {/* Water Heater Wireframe */}
      <div className="relative mb-12 animate-pulse-glow">
        <svg
          viewBox="0 0 100 160"
          className="w-24 h-36 stroke-primary fill-none"
          strokeWidth="1"
        >
          {/* Tank Body */}
          <rect x="20" y="20" width="60" height="100" rx="5" />
          {/* Top */}
          <ellipse cx="50" cy="20" rx="30" ry="8" />
          {/* Bottom */}
          <ellipse cx="50" cy="120" rx="30" ry="8" />
          {/* Pipes */}
          <line x1="35" y1="12" x2="35" y2="0" />
          <line x1="65" y1="12" x2="65" y2="0" />
          {/* Legs */}
          <line x1="30" y1="128" x2="30" y2="145" />
          <line x1="70" y1="128" x2="70" y2="145" />
          {/* Control Panel */}
          <rect x="35" y="70" width="30" height="20" rx="2" />
          <circle cx="50" cy="80" r="5" />
        </svg>
        
        {/* Glow Effect */}
        <div className="absolute inset-0 bg-primary/10 blur-xl rounded-full" />
      </div>

      {/* Terminal Output */}
      <div className="w-full max-w-md px-6 font-mono text-sm">
        {displayedLines.map((line, index) => (
          <div
            key={index}
            className={`mb-2 ${
              line.includes('COMPLETE') || line.includes('OK')
                ? 'text-status-optimal'
                : 'text-muted-foreground'
            }`}
          >
            {line}
            {index === currentLineIndex && !isComplete && (
              <span className="inline-block w-2 h-4 ml-1 bg-primary animate-blink" />
            )}
          </div>
        ))}
      </div>

      {/* Progress Indicator */}
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
