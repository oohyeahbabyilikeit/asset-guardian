import { useState, useRef, useEffect } from 'react';
import { Send, Bot, User, Sparkles, Maximize2, Minimize2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';

interface Message {
  id: string;
  role: 'assistant' | 'user';
  content: string;
}

interface MaintenanceChatInterfaceProps {
  flushMonths: number | null;
  anodeMonths: number;
  sedimentRate?: number;
}

const MAINTENANCE_EXPLANATIONS = {
  flush: {
    what: "Tank flushing removes sediment that naturally accumulates at the bottom of your water heater from minerals in the water supply.",
    why: "Sediment buildup reduces heating efficiency (costing you more money), creates hot spots that can damage the tank liner, and shortens the overall lifespan of your unit.",
    when: "We recommend flushing based on your water hardness and usage patterns. Most units benefit from annual flushing, but your specific timeline is calculated from actual conditions."
  },
  anode: {
    what: "The anode rod is a sacrificial metal rod that attracts corrosive elements in water, protecting your tank from rust.",
    why: "Once depleted, corrosion attacks your tank directly, leading to leaks and premature failure. Replacing the $30-50 rod can extend tank life by years.",
    when: "Anode life depends on water chemistry. We calculate remaining protection based on your water conditions and unit age."
  }
};

export function MaintenanceChatInterface({ 
  flushMonths, 
  anodeMonths, 
  sedimentRate 
}: MaintenanceChatInterfaceProps) {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      role: 'assistant',
      content: getInitialMessage(flushMonths, anodeMonths)
    }
  ]);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSend = () => {
    if (!input.trim()) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: input.trim()
    };

    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsTyping(true);

    setTimeout(() => {
      const response = generateResponse(input.toLowerCase(), flushMonths, anodeMonths, sedimentRate);
      setMessages(prev => [...prev, {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: response
      }]);
      setIsTyping(false);
    }, 800 + Math.random() * 400);
  };

  const suggestedQuestions = [
    "Why flush?",
    "What's an anode?",
    "Skip it?"
  ];

  // Fullscreen overlay
  if (isFullscreen) {
    return (
      <div className="fixed inset-0 z-50 bg-background flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-border bg-card">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-primary/20 flex items-center justify-center">
              <Sparkles className="w-4 h-4 text-primary" />
            </div>
            <div>
              <h3 className="font-semibold text-foreground text-sm">Maintenance Assistant</h3>
              <p className="text-[10px] text-muted-foreground">Ask me about your maintenance needs</p>
            </div>
          </div>
          <button 
            onClick={() => setIsFullscreen(false)}
            className="w-8 h-8 rounded-full bg-muted/50 flex items-center justify-center hover:bg-muted transition-colors"
          >
            <Minimize2 className="w-4 h-4 text-muted-foreground" />
          </button>
        </div>

        {/* Chat Messages - Fullscreen */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          {messages.map((msg) => (
            <div key={msg.id} className={`flex gap-2 ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
              {msg.role === 'assistant' && (
                <div className="w-7 h-7 rounded-full bg-primary/20 flex items-center justify-center flex-shrink-0">
                  <Bot className="w-3.5 h-3.5 text-primary" />
                </div>
              )}
              <div className={`max-w-[80%] px-3 py-2 rounded-xl text-sm leading-relaxed ${
                msg.role === 'user' 
                  ? 'bg-primary text-primary-foreground' 
                  : 'bg-muted/50 text-foreground'
              }`}>
                {msg.content}
              </div>
              {msg.role === 'user' && (
                <div className="w-7 h-7 rounded-full bg-muted flex items-center justify-center flex-shrink-0">
                  <User className="w-3.5 h-3.5 text-muted-foreground" />
                </div>
              )}
            </div>
          ))}
          {isTyping && (
            <div className="flex gap-2 justify-start">
              <div className="w-7 h-7 rounded-full bg-primary/20 flex items-center justify-center flex-shrink-0">
                <Bot className="w-3.5 h-3.5 text-primary" />
              </div>
              <div className="bg-muted/50 px-3 py-2 rounded-xl">
                <div className="flex gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-muted-foreground/50 animate-bounce" style={{ animationDelay: '0ms' }} />
                  <span className="w-1.5 h-1.5 rounded-full bg-muted-foreground/50 animate-bounce" style={{ animationDelay: '150ms' }} />
                  <span className="w-1.5 h-1.5 rounded-full bg-muted-foreground/50 animate-bounce" style={{ animationDelay: '300ms' }} />
                </div>
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Suggested Questions - Fullscreen */}
        {messages.length < 4 && (
          <div className="px-4 pb-2">
            <div className="flex flex-wrap gap-2">
              {suggestedQuestions.map((q) => (
                <button
                  key={q}
                  onClick={() => setInput(q)}
                  className="px-3 py-1.5 text-xs rounded-full bg-muted/50 text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
                >
                  {q}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Input - Fullscreen */}
        <div className="p-4 border-t border-border bg-card">
          <div className="flex gap-2">
            <Input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSend()}
              placeholder="Ask about maintenance..."
              className="text-sm"
              autoFocus
            />
            <Button 
              onClick={handleSend}
              disabled={!input.trim() || isTyping}
            >
              <Send className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </div>
    );
  }

  // Compact inline view
  return (
    <div className="clean-card p-3 border-primary/20 bg-gradient-to-br from-primary/5 to-transparent flex flex-col">
      {/* Header with expand button */}
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded-md bg-primary/20 flex items-center justify-center">
            <Sparkles className="w-3 h-3 text-primary" />
          </div>
          <h3 className="font-semibold text-foreground text-xs">Maintenance Assistant</h3>
        </div>
        <button 
          onClick={() => setIsFullscreen(true)}
          className="w-6 h-6 rounded-full bg-muted/50 flex items-center justify-center hover:bg-muted transition-colors"
        >
          <Maximize2 className="w-3 h-3 text-muted-foreground" />
        </button>
      </div>

      {/* Chat Messages - Compact */}
      <div className="h-[80px] overflow-y-auto space-y-1.5 mb-2 pr-1 scrollbar-thin">
        {messages.map((msg) => (
          <div key={msg.id} className={`flex gap-1.5 ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            {msg.role === 'assistant' && (
              <div className="w-5 h-5 rounded-full bg-primary/20 flex items-center justify-center flex-shrink-0">
                <Bot className="w-2.5 h-2.5 text-primary" />
              </div>
            )}
            <div className={`max-w-[85%] px-2 py-1.5 rounded-lg text-[11px] leading-relaxed ${
              msg.role === 'user' 
                ? 'bg-primary text-primary-foreground' 
                : 'bg-muted/50 text-foreground'
            }`}>
              {msg.content}
            </div>
            {msg.role === 'user' && (
              <div className="w-5 h-5 rounded-full bg-muted flex items-center justify-center flex-shrink-0">
                <User className="w-2.5 h-2.5 text-muted-foreground" />
              </div>
            )}
          </div>
        ))}
        {isTyping && (
          <div className="flex gap-1.5 justify-start">
            <div className="w-5 h-5 rounded-full bg-primary/20 flex items-center justify-center flex-shrink-0">
              <Bot className="w-2.5 h-2.5 text-primary" />
            </div>
            <div className="bg-muted/50 px-2 py-1.5 rounded-lg">
              <div className="flex gap-1">
                <span className="w-1 h-1 rounded-full bg-muted-foreground/50 animate-bounce" style={{ animationDelay: '0ms' }} />
                <span className="w-1 h-1 rounded-full bg-muted-foreground/50 animate-bounce" style={{ animationDelay: '150ms' }} />
                <span className="w-1 h-1 rounded-full bg-muted-foreground/50 animate-bounce" style={{ animationDelay: '300ms' }} />
              </div>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Tap to expand hint + Input */}
      <div 
        onClick={() => setIsFullscreen(true)}
        className="flex items-center gap-1.5 p-2 rounded-lg bg-muted/30 border border-border/50 cursor-pointer hover:bg-muted/50 transition-colors"
      >
        <Input
          value={input}
          onChange={(e) => {
            e.stopPropagation();
            setInput(e.target.value);
          }}
          onClick={(e) => e.stopPropagation()}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              e.stopPropagation();
              handleSend();
            }
          }}
          placeholder="Tap to expand or type here..."
          className="text-[11px] h-6 border-0 bg-transparent focus-visible:ring-0 p-0"
        />
        <Send className="w-3 h-3 text-muted-foreground flex-shrink-0" />
      </div>
    </div>
  );
}

function getInitialMessage(flushMonths: number | null, anodeMonths: number): string {
  const parts: string[] = ["Your water heater is in good shape! 🎉"];
  
  if (flushMonths !== null && anodeMonths > 0) {
    parts.push("Ask me why these maintenance tasks matter.");
  } else if (flushMonths !== null) {
    parts.push("Ask me why flushing helps extend your unit's life!");
  } else if (anodeMonths > 0) {
    parts.push("Curious what an anode rod does?");
  }
  
  return parts.join(' ');
}

function generateResponse(
  query: string, 
  flushMonths: number | null, 
  anodeMonths: number,
  sedimentRate?: number
): string {
  if (query.includes('flush') || query.includes('sediment') || query.includes('drain')) {
    if (query.includes('why') || query.includes('what') || query.includes('need')) {
      return `${MAINTENANCE_EXPLANATIONS.flush.why} Based on your water conditions${sedimentRate ? ` (sediment at ${sedimentRate.toFixed(2)}%/mo)` : ''}, I've calculated your optimal interval.`;
    }
    if (query.includes('skip') || query.includes('ignore') || query.includes('delay')) {
      return "Skipping leads to efficiency loss, strange noises, and tank damage. The $100-150 flush prevents $800+ in early replacement!";
    }
    return MAINTENANCE_EXPLANATIONS.flush.what;
  }

  if (query.includes('anode') || query.includes('rod') || query.includes('rust') || query.includes('corrosion')) {
    if (query.includes('why') || query.includes('what')) {
      return MAINTENANCE_EXPLANATIONS.anode.what + " " + MAINTENANCE_EXPLANATIONS.anode.why;
    }
    return `The anode rod protects against rust. You have ~${anodeMonths >= 12 ? `${(anodeMonths / 12).toFixed(1)} years` : `${anodeMonths} months`} of protection left.`;
  }

  if (query.includes('skip') || query.includes('ignore') || query.includes('necessary')) {
    return "Preventive maintenance costs 10-20x less than emergency repairs. A $150 flush beats a $1,500+ replacement!";
  }

  if (query.includes('cost') || query.includes('price') || query.includes('expensive')) {
    return "Flush: $100-150, anode: $150-250. Compare to $1,200-2,500 for replacement. Maintenance pays for itself!";
  }

  if (query.includes('how') || query.includes('myself') || query.includes('diy')) {
    return "While DIY is possible, pros ensure proper drainage and spot early warnings. Set a reminder above!";
  }

  return "Regular maintenance extends your water heater's life significantly. Ask about flushing or anode rods!";
}
