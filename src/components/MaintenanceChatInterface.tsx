import { useState, useRef, useEffect } from 'react';
import { Send, Bot, User, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

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

  return (
    <div className="clean-card p-3 border-primary/20 bg-gradient-to-br from-primary/5 to-transparent flex-1 flex flex-col min-h-0">
      <div className="flex items-center gap-2 mb-2 flex-shrink-0">
        <div className="w-6 h-6 rounded-md bg-primary/20 flex items-center justify-center">
          <Sparkles className="w-3 h-3 text-primary" />
        </div>
        <div>
          <h3 className="font-semibold text-foreground text-xs">Maintenance Assistant</h3>
        </div>
      </div>

      {/* Chat Messages */}
      <div className="flex-1 overflow-y-auto space-y-1.5 mb-2 pr-1 scrollbar-thin min-h-0">
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

      {/* Suggested Questions */}
      {messages.length < 3 && (
        <div className="flex flex-wrap gap-1 mb-2 flex-shrink-0">
          {suggestedQuestions.map((q) => (
            <button
              key={q}
              onClick={() => setInput(q)}
              className="px-1.5 py-0.5 text-[9px] rounded-full bg-muted/50 text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
            >
              {q}
            </button>
          ))}
        </div>
      )}

      {/* Input */}
      <div className="flex gap-1.5 flex-shrink-0">
        <Input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleSend()}
          placeholder="Ask about maintenance..."
          className="text-[11px] h-7"
        />
        <Button 
          size="sm" 
          onClick={handleSend}
          disabled={!input.trim() || isTyping}
          className="h-7 w-7 p-0"
        >
          <Send className="w-3 h-3" />
        </Button>
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
