import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Send, Sparkles, User, Loader2, HelpCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import type { ForensicInputs, OpterraMetrics } from '@/lib/opterraAlgorithm';
import type { MaintenanceTask } from '@/lib/maintenanceCalculations';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import ReactMarkdown from 'react-markdown';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
}

interface CorrtexChatOverlayProps {
  open: boolean;
  onClose: () => void;
  inputs: ForensicInputs;
  metrics: OpterraMetrics;
  recommendation: { action: string; badge: string; title: string; description?: string };
  violations: MaintenanceTask[];
  recommendations: MaintenanceTask[];
  maintenanceTasks: MaintenanceTask[];
  addOns: MaintenanceTask[];
  healthScore: number;
  priorityFindings?: Array<{
    id: string;
    name: string;
    friendlyName: string;
    description: string;
    severity: string;
  }>;
}

function generateSuggestedQuestions(
  violations: MaintenanceTask[],
  recommendations: MaintenanceTask[],
  maintenanceTasks: MaintenanceTask[],
  addOns: MaintenanceTask[],
  inputs: ForensicInputs,
  recommendation: { action: string }
): string[] {
  const questions: string[] = [];
  
  if (violations.some(v => v.type.includes('exp_tank'))) {
    questions.push("Why is an expansion tank required?");
  }
  
  if (violations.some(v => v.type.includes('prv')) || recommendations.some(r => r.type.includes('prv'))) {
    questions.push("What does a PRV do?");
  }
  
  if (maintenanceTasks.some(m => m.type === 'replacement_consult') || recommendation.action === 'REPLACE') {
    questions.push("Is replacement urgent or can I wait?");
  }
  
  if (maintenanceTasks.some(m => m.type === 'anode')) {
    questions.push("How does an anode protect my tank?");
  }
  
  if (maintenanceTasks.some(m => m.type === 'flush' || m.type === 'descale')) {
    questions.push("What happens if I skip the flush?");
  }
  
  if (addOns.some(a => a.label.toLowerCase().includes('softener'))) {
    questions.push("How would a softener help my situation?");
  }
  
  if (inputs.housePsi > 70) {
    questions.push("Is my water pressure dangerous?");
  }
  
  if (inputs.calendarAge >= 10) {
    questions.push("How much life does my unit have left?");
  }
  
  if (inputs.hardnessGPG > 10 && !inputs.hasSoftener) {
    questions.push("How does hard water affect my water heater?");
  }
  
  if (questions.length === 0) {
    questions.push("What's the most important thing I should know?");
    questions.push("What should I do next?");
  }
  
  return questions.slice(0, 4);
}

function buildChatContext(props: CorrtexChatOverlayProps) {
  const { inputs, metrics, recommendation, violations, recommendations, maintenanceTasks, addOns, healthScore, priorityFindings } = props;
  
  const findings = [
    ...violations.map(v => ({
      title: v.label,
      measurement: v.description,
      explanation: v.benefit || v.whyExplanation || '',
      severity: 'critical',
    })),
    ...recommendations.map(r => ({
      title: r.label,
      measurement: r.description,
      explanation: r.benefit || r.whyExplanation || '',
      severity: 'warning',
    })),
    ...maintenanceTasks.slice(0, 3).map(m => ({
      title: m.label,
      measurement: m.description,
      explanation: m.benefit || m.whyExplanation || '',
      severity: m.urgency === 'overdue' ? 'warning' : 'info',
    })),
    ...(priorityFindings || []).map(f => ({
      title: f.name,
      measurement: f.friendlyName,
      explanation: f.description,
      severity: f.severity,
    })),
  ].slice(0, 6);

  const serviceContext = {
    selectedServices: [
      ...violations.map(v => v.label),
      ...recommendations.map(r => r.label),
      ...maintenanceTasks.map(m => m.label),
      ...addOns.map(a => a.label),
    ],
    violationCount: violations.length,
    recommendationCount: recommendations.length,
    maintenanceCount: maintenanceTasks.length,
    addOnCount: addOns.length,
  };
  
  return {
    inputs: {
      manufacturer: inputs.manufacturer,
      modelNumber: inputs.modelNumber,
      calendarAgeYears: inputs.calendarAge,
      fuelType: inputs.fuelType,
      tankCapacityGallons: inputs.tankCapacity,
      hasPrv: inputs.hasPrv,
      hasExpTank: inputs.hasExpTank,
      expTankStatus: inputs.expTankStatus,
      isClosedLoop: inputs.isClosedLoop,
      streetHardnessGpg: inputs.hardnessGPG,
      hasSoftener: inputs.hasSoftener,
      housePsi: inputs.housePsi,
      visualRust: inputs.visualRust,
      isLeaking: inputs.isLeaking,
      leakSource: inputs.leakSource,
    },
    metrics: {
      healthScore,
      bioAge: metrics.bioAge,
      failProbability: metrics.failProb / 100,
      stressFactors: metrics.stressFactors,
    },
    recommendation: {
      action: recommendation.action,
      badge: recommendation.badge,
      title: recommendation.title,
      description: recommendation.description,
    },
    findings,
    serviceContext,
  };
}

const CHAT_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/chat-water-heater`;

// Typing indicator component
function TypingIndicator() {
  return (
    <div className="flex items-center gap-1 px-2 py-1">
      <motion.div 
        className="w-2 h-2 rounded-full bg-primary/60"
        animate={{ scale: [1, 1.2, 1], opacity: [0.5, 1, 0.5] }}
        transition={{ duration: 0.8, repeat: Infinity, delay: 0 }}
      />
      <motion.div 
        className="w-2 h-2 rounded-full bg-primary/60"
        animate={{ scale: [1, 1.2, 1], opacity: [0.5, 1, 0.5] }}
        transition={{ duration: 0.8, repeat: Infinity, delay: 0.2 }}
      />
      <motion.div 
        className="w-2 h-2 rounded-full bg-primary/60"
        animate={{ scale: [1, 1.2, 1], opacity: [0.5, 1, 0.5] }}
        transition={{ duration: 0.8, repeat: Infinity, delay: 0.4 }}
      />
    </div>
  );
}

export function CorrtexChatOverlay(props: CorrtexChatOverlayProps) {
  const { open, onClose, violations, recommendations, maintenanceTasks, addOns, inputs, recommendation } = props;
  
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isInitialized, setIsInitialized] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  
  const suggestedQuestions = generateSuggestedQuestions(
    violations, recommendations, maintenanceTasks, addOns, inputs, recommendation
  );
  
  useEffect(() => {
    if (open && !isInitialized) {
      const totalServices = violations.length + recommendations.length + maintenanceTasks.length + addOns.length;
      const greeting = totalServices > 0
        ? `Hi! I've reviewed your water heater assessment. Based on what we found, you have ${totalServices} item${totalServices === 1 ? '' : 's'} to discuss. Ask me anything about your options!`
        : `Hi! I've reviewed your water heater assessment. Ask me anything about your situation and I'll help you understand what you're seeing.`;
      
      setMessages([{
        id: 'greeting',
        role: 'assistant',
        content: greeting,
      }]);
      setIsInitialized(true);
    }
  }, [open, isInitialized, violations.length, recommendations.length, maintenanceTasks.length, addOns.length]);
  
  useEffect(() => {
    if (!open) {
      setMessages([]);
      setIsInitialized(false);
      setInput('');
    }
  }, [open]);
  
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);
  
  useEffect(() => {
    if (open && inputRef.current) {
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [open]);
  
  const sendMessage = async (messageText: string) => {
    if (!messageText.trim() || isLoading) return;
    
    const userMsg: Message = { id: `user-${Date.now()}`, role: 'user', content: messageText };
    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setIsLoading(true);
    
    const context = buildChatContext(props);
    const allMessages = [...messages, userMsg].map(m => ({ role: m.role, content: m.content }));
    
    let assistantContent = '';
    
    try {
      const resp = await fetch(CHAT_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
        },
        body: JSON.stringify({ messages: allMessages, context }),
      });
      
      if (resp.status === 429) {
        toast.error('Too many requests. Please wait a moment and try again.');
        setIsLoading(false);
        return;
      }
      
      if (resp.status === 402) {
        toast.error('Service temporarily unavailable. Please try again later.');
        setIsLoading(false);
        return;
      }
      
      if (!resp.ok || !resp.body) {
        throw new Error('Failed to get response');
      }
      
      const reader = resp.body.getReader();
      const decoder = new TextDecoder();
      let textBuffer = '';
      let streamDone = false;
      
      const assistantId = `assistant-${Date.now()}`;
      setMessages(prev => [...prev, { id: assistantId, role: 'assistant', content: '' }]);
      
      while (!streamDone) {
        const { done, value } = await reader.read();
        if (done) break;
        textBuffer += decoder.decode(value, { stream: true });
        
        let newlineIndex: number;
        while ((newlineIndex = textBuffer.indexOf('\n')) !== -1) {
          let line = textBuffer.slice(0, newlineIndex);
          textBuffer = textBuffer.slice(newlineIndex + 1);
          
          if (line.endsWith('\r')) line = line.slice(0, -1);
          if (line.startsWith(':') || line.trim() === '') continue;
          if (!line.startsWith('data: ')) continue;
          
          const jsonStr = line.slice(6).trim();
          if (jsonStr === '[DONE]') {
            streamDone = true;
            break;
          }
          
          try {
            const parsed = JSON.parse(jsonStr);
            const content = parsed.choices?.[0]?.delta?.content as string | undefined;
            if (content) {
              assistantContent += content;
              setMessages(prev => 
                prev.map(m => m.id === assistantId ? { ...m, content: assistantContent } : m)
              );
            }
          } catch {
            textBuffer = line + '\n' + textBuffer;
            break;
          }
        }
      }
      
      if (textBuffer.trim()) {
        for (let raw of textBuffer.split('\n')) {
          if (!raw) continue;
          if (raw.endsWith('\r')) raw = raw.slice(0, -1);
          if (raw.startsWith(':') || raw.trim() === '') continue;
          if (!raw.startsWith('data: ')) continue;
          const jsonStr = raw.slice(6).trim();
          if (jsonStr === '[DONE]') continue;
          try {
            const parsed = JSON.parse(jsonStr);
            const content = parsed.choices?.[0]?.delta?.content as string | undefined;
            if (content) {
              assistantContent += content;
              setMessages(prev => 
                prev.map(m => m.id === assistantId ? { ...m, content: assistantContent } : m)
              );
            }
          } catch { /* ignore */ }
        }
      }
    } catch (error) {
      console.error('Chat error:', error);
      toast.error('Failed to get response. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };
  
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    sendMessage(input);
  };
  
  const handleSuggestedQuestion = (question: string) => {
    sendMessage(question);
  };

  // Always render but toggle visibility for instant appearance
  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 1 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.15 }}
          className="fixed inset-0 z-50 flex flex-col bg-gradient-to-b from-background via-background to-secondary/20"
        >
          {/* Header with gradient */}
          <header className="flex items-center justify-between px-4 py-3 border-b border-border/50 bg-gradient-to-r from-primary/5 via-background to-primary/5">
            <div className="flex items-center gap-3">
              <div className="relative">
                <div className="p-2.5 rounded-xl bg-gradient-to-br from-primary/20 to-primary/5 border border-primary/20">
                  <Sparkles className="w-5 h-5 text-primary" />
                </div>
                {/* Glow effect */}
                <div className="absolute inset-0 rounded-xl bg-primary/20 blur-md -z-10" />
              </div>
              <div>
                <h1 className="font-semibold text-foreground flex items-center gap-2">
                  Corrtex AI
                  <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full bg-green-500/10 text-green-500 text-[10px] font-medium">
                    <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
                    Online
                  </span>
                </h1>
                <p className="text-xs text-muted-foreground">Your water heater assistant</p>
              </div>
            </div>
            <Button variant="ghost" size="icon" onClick={onClose} className="shrink-0 rounded-full hover:bg-secondary">
              <X className="w-5 h-5" />
            </Button>
          </header>
          
          {/* Messages */}
          <ScrollArea className="flex-1 px-4 py-4" ref={scrollRef}>
            <div className="space-y-4 max-w-2xl mx-auto pb-4">
              {messages.map((msg) => (
                <motion.div
                  key={msg.id}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.2 }}
                  className={cn(
                    "flex gap-3",
                    msg.role === 'user' ? "justify-end" : "justify-start"
                  )}
                >
                  {msg.role === 'assistant' && (
                    <div className="relative shrink-0">
                      <div className={cn(
                        "w-9 h-9 rounded-full flex items-center justify-center",
                        "bg-gradient-to-br from-primary/20 to-primary/5 border border-primary/20"
                      )}>
                        <Sparkles className={cn(
                          "w-4 h-4 text-primary",
                          isLoading && msg.content === '' && "animate-pulse"
                        )} />
                      </div>
                      {/* Glow when loading */}
                      {isLoading && msg.content === '' && (
                        <div className="absolute inset-0 rounded-full bg-primary/30 blur-md animate-pulse" />
                      )}
                    </div>
                  )}
                  <div className={cn(
                    "rounded-2xl px-4 py-3 max-w-[85%] shadow-sm",
                    msg.role === 'user' 
                      ? "bg-primary text-primary-foreground rounded-br-lg shadow-primary/20" 
                      : "bg-secondary/80 text-foreground rounded-bl-lg border border-border/50 backdrop-blur-sm"
                  )}>
                    {msg.content ? (
                      msg.role === 'assistant' ? (
                        <div className="text-sm leading-[1.7] space-y-3 [&>p]:mb-3 [&>p:last-child]:mb-0 [&>ul]:pl-4 [&>ul]:space-y-1.5 [&>ol]:pl-4 [&>ol]:space-y-1.5 [&>ul>li]:list-disc [&>ol>li]:list-decimal [&_strong]:font-semibold [&_strong]:text-primary">
                          <ReactMarkdown>{msg.content}</ReactMarkdown>
                        </div>
                      ) : (
                        <p className="text-sm whitespace-pre-wrap leading-relaxed">{msg.content}</p>
                      )
                    ) : (
                      isLoading && msg.role === 'assistant' && <TypingIndicator />
                    )}
                  </div>
                  {msg.role === 'user' && (
                    <div className="w-9 h-9 rounded-full bg-muted flex items-center justify-center shrink-0 border border-border/50">
                      <User className="w-4 h-4 text-muted-foreground" />
                    </div>
                  )}
                </motion.div>
              ))}
              
              {/* Suggested Questions - card style */}
              {messages.length === 1 && messages[0].role === 'assistant' && !isLoading && (
                <motion.div
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.2, delay: 0.1 }}
                  className="space-y-3 pt-2"
                >
                  <p className="text-xs text-muted-foreground text-center font-medium">Quick questions</p>
                  <div className="grid grid-cols-2 gap-2">
                    {suggestedQuestions.map((q, idx) => (
                      <button
                        key={idx}
                        onClick={() => handleSuggestedQuestion(q)}
                        className={cn(
                          "flex items-start gap-2 p-3 text-left text-xs rounded-xl",
                          "bg-secondary/60 hover:bg-secondary border border-border/50",
                          "transition-all duration-200 hover:shadow-md hover:border-primary/30",
                          "group"
                        )}
                      >
                        <HelpCircle className="w-4 h-4 text-primary shrink-0 mt-0.5 group-hover:scale-110 transition-transform" />
                        <span className="text-foreground leading-snug">{q}</span>
                      </button>
                    ))}
                  </div>
                </motion.div>
              )}
            </div>
          </ScrollArea>
          
          {/* Input Area - cleaner design */}
          <div className="border-t border-border/50 bg-background/95 backdrop-blur-sm p-4">
            <form onSubmit={handleSubmit} className="max-w-2xl mx-auto">
              <div className="flex gap-2 items-center bg-secondary/50 rounded-xl p-1.5 border border-border/50 focus-within:border-primary/50 focus-within:ring-2 focus-within:ring-primary/10 transition-all">
                <Input
                  ref={inputRef}
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  placeholder="Ask about your water heater..."
                  className="flex-1 border-0 bg-transparent focus-visible:ring-0 focus-visible:ring-offset-0 placeholder:text-muted-foreground/60"
                  disabled={isLoading}
                />
                <Button 
                  type="submit" 
                  size="icon" 
                  disabled={isLoading || !input.trim()}
                  className="shrink-0 rounded-lg h-9 w-9 bg-primary hover:bg-primary/90"
                >
                  {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                </Button>
              </div>
            </form>
            <p className="text-[10px] text-center text-muted-foreground/60 mt-2">
              Corrtex AI provides educational guidance. For specific recommendations, consult your plumber.
            </p>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
