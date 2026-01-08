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

    // Simulate AI response based on keywords
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
    "Why do I need to flush?",
    "What's an anode rod?",
    "Can I skip maintenance?"
  ];

  return (
    <div className="clean-card border-primary/20 bg-gradient-to-br from-primary/5 to-transparent">
      <div className="flex items-center gap-2 mb-3">
        <div className="w-8 h-8 rounded-lg bg-primary/20 flex items-center justify-center">
          <Sparkles className="w-4 h-4 text-primary" />
        </div>
        <div>
          <h3 className="font-semibold text-foreground text-sm">Maintenance Assistant</h3>
          <p className="text-[10px] text-muted-foreground">Ask me about your maintenance needs</p>
        </div>
      </div>

      {/* Chat Messages */}
      <div className="h-[140px] overflow-y-auto space-y-2 mb-3 pr-1 scrollbar-thin">
        {messages.map((msg) => (
          <div key={msg.id} className={`flex gap-2 ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            {msg.role === 'assistant' && (
              <div className="w-6 h-6 rounded-full bg-primary/20 flex items-center justify-center flex-shrink-0">
                <Bot className="w-3 h-3 text-primary" />
              </div>
            )}
            <div className={`max-w-[85%] px-3 py-2 rounded-xl text-xs ${
              msg.role === 'user' 
                ? 'bg-primary text-primary-foreground' 
                : 'bg-muted/50 text-foreground'
            }`}>
              {msg.content}
            </div>
            {msg.role === 'user' && (
              <div className="w-6 h-6 rounded-full bg-muted flex items-center justify-center flex-shrink-0">
                <User className="w-3 h-3 text-muted-foreground" />
              </div>
            )}
          </div>
        ))}
        {isTyping && (
          <div className="flex gap-2 justify-start">
            <div className="w-6 h-6 rounded-full bg-primary/20 flex items-center justify-center flex-shrink-0">
              <Bot className="w-3 h-3 text-primary" />
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

      {/* Suggested Questions */}
      {messages.length < 3 && (
        <div className="flex flex-wrap gap-1.5 mb-3">
          {suggestedQuestions.map((q) => (
            <button
              key={q}
              onClick={() => setInput(q)}
              className="px-2 py-1 text-[10px] rounded-full bg-muted/50 text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
            >
              {q}
            </button>
          ))}
        </div>
      )}

      {/* Input */}
      <div className="flex gap-2">
        <Input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleSend()}
          placeholder="Ask about maintenance..."
          className="text-xs h-8"
        />
        <Button 
          size="sm" 
          onClick={handleSend}
          disabled={!input.trim() || isTyping}
          className="h-8 w-8 p-0"
        >
          <Send className="w-3.5 h-3.5" />
        </Button>
      </div>
    </div>
  );
}

function getInitialMessage(flushMonths: number | null, anodeMonths: number): string {
  const parts: string[] = ["Great news! Your water heater is in good shape. 🎉"];
  
  if (flushMonths !== null && anodeMonths > 0) {
    const flushTime = flushMonths >= 12 ? `${(flushMonths / 12).toFixed(1)} years` : `${flushMonths} months`;
    const anodeTime = anodeMonths >= 12 ? `${(anodeMonths / 12).toFixed(1)} years` : `${anodeMonths} months`;
    parts.push(`Your tank flush is due in ${flushTime} and anode check in ${anodeTime}. Want to know why these matter?`);
  } else if (flushMonths !== null) {
    const flushTime = flushMonths >= 12 ? `${(flushMonths / 12).toFixed(1)} years` : `${flushMonths} months`;
    parts.push(`Your tank flush is due in ${flushTime}. Ask me why this helps extend your unit's life!`);
  } else if (anodeMonths > 0) {
    const anodeTime = anodeMonths >= 12 ? `${(anodeMonths / 12).toFixed(1)} years` : `${anodeMonths} months`;
    parts.push(`Your anode rod check is due in ${anodeTime}. Curious what that does?`);
  }
  
  return parts.join(' ');
}

function generateResponse(
  query: string, 
  flushMonths: number | null, 
  anodeMonths: number,
  sedimentRate?: number
): string {
  // Flush related
  if (query.includes('flush') || query.includes('sediment') || query.includes('drain')) {
    if (query.includes('why') || query.includes('what') || query.includes('need')) {
      return `${MAINTENANCE_EXPLANATIONS.flush.why} Based on your water conditions${sedimentRate ? ` (sediment accumulating at ${sedimentRate.toFixed(2)}% monthly)` : ''}, I've calculated your optimal flush interval.`;
    }
    if (query.includes('skip') || query.includes('ignore') || query.includes('delay')) {
      return "Skipping flushes leads to efficiency loss (higher bills), strange noises from sediment, and eventually tank damage. The $100-150 flush cost prevents $800+ in early replacement. I'd recommend keeping to the schedule!";
    }
    return MAINTENANCE_EXPLANATIONS.flush.what;
  }

  // Anode related
  if (query.includes('anode') || query.includes('rod') || query.includes('rust') || query.includes('corrosion')) {
    if (query.includes('why') || query.includes('what')) {
      return MAINTENANCE_EXPLANATIONS.anode.what + " " + MAINTENANCE_EXPLANATIONS.anode.why;
    }
    return `The anode rod is your tank's bodyguard against rust. Currently, you have about ${anodeMonths >= 12 ? `${(anodeMonths / 12).toFixed(1)} years` : `${anodeMonths} months`} of protection left. Replacing it when needed is one of the best investments for longevity.`;
  }

  // Skip/delay maintenance
  if (query.includes('skip') || query.includes('ignore') || query.includes('necessary')) {
    return "While skipping seems tempting, preventive maintenance typically costs 10-20x less than emergency repairs. A $150 flush + $50 anode rod beats a $1,500+ emergency replacement any day!";
  }

  // Cost related
  if (query.includes('cost') || query.includes('price') || query.includes('expensive')) {
    return "Tank flush typically runs $100-150, anode replacement $150-250 with labor. Compare that to $1,200-2,500 for full replacement. Maintenance pays for itself many times over!";
  }

  // How/DIY
  if (query.includes('how') || query.includes('myself') || query.includes('diy')) {
    return "While DIY is possible, professional service ensures proper drainage, sediment removal, and safety checks. They'll also spot early warning signs. Set a reminder below and we'll connect you with a trusted pro!";
  }

  // General fallback
  return "Regular maintenance keeps your water heater running efficiently and extends its life significantly. The two key tasks are tank flushing (removes sediment) and anode rod checks (prevents rust). Want details on either?";
}
