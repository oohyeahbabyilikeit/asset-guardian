import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Send, Sparkles, MessageCircle, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import type { ForensicInputs, OpterraMetrics } from '@/lib/opterraAlgorithm';
import type { MaintenanceTask } from '@/lib/maintenanceCalculations';
import type { InfrastructureIssue } from '@/lib/infrastructureIssues';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
}

interface CorrtexChatOverlayProps {
  open: boolean;
  onClose: () => void;
  // Context for AI
  inputs: ForensicInputs;
  metrics: OpterraMetrics;
  recommendation: { action: string; badge: string; title: string; description?: string };
  // Services being shown to generate questions
  violations: MaintenanceTask[];
  recommendations: MaintenanceTask[];
  maintenanceTasks: MaintenanceTask[];
  addOns: MaintenanceTask[];
  healthScore: number;
  // Optional additional context
  priorityFindings?: Array<{
    id: string;
    name: string;
    friendlyName: string;
    description: string;
    severity: string;
  }>;
}

// Generate suggested questions based on services
function generateSuggestedQuestions(
  violations: MaintenanceTask[],
  recommendations: MaintenanceTask[],
  maintenanceTasks: MaintenanceTask[],
  addOns: MaintenanceTask[],
  inputs: ForensicInputs,
  recommendation: { action: string }
): string[] {
  const questions: string[] = [];
  
  // Check for specific services and add relevant questions
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
  
  // Pressure-related questions
  if (inputs.housePsi > 70) {
    questions.push("Is my water pressure dangerous?");
  }
  
  // Age-related questions
  if (inputs.calendarAge >= 10) {
    questions.push("How much life does my unit have left?");
  }
  
  // Hard water questions
  if (inputs.hardnessGPG > 10 && !inputs.hasSoftener) {
    questions.push("How does hard water affect my water heater?");
  }
  
  // General health questions
  if (questions.length === 0) {
    questions.push("What's the most important thing I should know?");
    questions.push("What should I do next?");
  }
  
  return questions.slice(0, 4); // Max 4 suggestions
}

// Build context for the AI
function buildChatContext(props: CorrtexChatOverlayProps) {
  const { inputs, metrics, recommendation, violations, recommendations, maintenanceTasks, addOns, healthScore, priorityFindings } = props;
  
  // Build findings array for AI context
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

  // Build service context for the AI
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
  
  // Initialize with greeting when opened
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
  
  // Reset when closed
  useEffect(() => {
    if (!open) {
      setMessages([]);
      setIsInitialized(false);
      setInput('');
    }
  }, [open]);
  
  // Scroll to bottom on new messages
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);
  
  // Focus input when opened
  useEffect(() => {
    if (open && inputRef.current) {
      setTimeout(() => inputRef.current?.focus(), 300);
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
      
      // Add assistant message placeholder
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
            // Incomplete JSON, put it back
            textBuffer = line + '\n' + textBuffer;
            break;
          }
        }
      }
      
      // Final flush
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
  
  if (!open) return null;
  
  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 bg-background flex flex-col"
        >
          {/* Header */}
          <motion.header
            initial={{ y: -20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.1 }}
            className="flex items-center justify-between px-4 py-3 border-b border-border bg-background/95 backdrop-blur-sm"
          >
            <div className="flex items-center gap-2">
              <div className="p-2 rounded-lg bg-primary/10">
                <Sparkles className="w-5 h-5 text-primary" />
              </div>
              <div>
                <h1 className="font-semibold text-foreground">Corrtex AI</h1>
                <p className="text-xs text-muted-foreground">Your water heater assistant</p>
              </div>
            </div>
            <Button variant="ghost" size="icon" onClick={onClose} className="shrink-0">
              <X className="w-5 h-5" />
            </Button>
          </motion.header>
          
          {/* Messages */}
          <ScrollArea className="flex-1 px-4 py-4" ref={scrollRef}>
            <div className="space-y-4 max-w-2xl mx-auto">
              {messages.map((msg, idx) => (
                <motion.div
                  key={msg.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: idx === 0 ? 0.2 : 0 }}
                  className={cn(
                    "flex gap-3",
                    msg.role === 'user' ? "justify-end" : "justify-start"
                  )}
                >
                  {msg.role === 'assistant' && (
                    <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                      <Sparkles className="w-4 h-4 text-primary" />
                    </div>
                  )}
                  <div className={cn(
                    "rounded-2xl px-4 py-3 max-w-[85%]",
                    msg.role === 'user' 
                      ? "bg-primary text-primary-foreground rounded-br-md" 
                      : "bg-secondary text-foreground rounded-bl-md"
                  )}>
                    <p className="text-sm whitespace-pre-wrap">{msg.content || (isLoading && msg.role === 'assistant' ? '...' : '')}</p>
                  </div>
                  {msg.role === 'user' && (
                    <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center shrink-0">
                      <MessageCircle className="w-4 h-4 text-muted-foreground" />
                    </div>
                  )}
                </motion.div>
              ))}
              
              {/* Suggested Questions - show only after greeting, before first user message */}
              {messages.length === 1 && messages[0].role === 'assistant' && !isLoading && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.4 }}
                  className="space-y-2"
                >
                  <p className="text-xs text-muted-foreground text-center">Suggested questions:</p>
                  <div className="flex flex-wrap gap-2 justify-center">
                    {suggestedQuestions.map((q, idx) => (
                      <button
                        key={idx}
                        onClick={() => handleSuggestedQuestion(q)}
                        className="px-3 py-2 text-xs rounded-full bg-secondary hover:bg-secondary/80 text-foreground border border-border transition-colors"
                      >
                        {q}
                      </button>
                    ))}
                  </div>
                </motion.div>
              )}
            </div>
          </ScrollArea>
          
          {/* Input */}
          <motion.div
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.2 }}
            className="border-t border-border bg-background/95 backdrop-blur-sm p-4"
          >
            <form onSubmit={handleSubmit} className="max-w-2xl mx-auto flex gap-2">
              <Input
                ref={inputRef}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Ask about your water heater..."
                className="flex-1"
                disabled={isLoading}
              />
              <Button type="submit" size="icon" disabled={isLoading || !input.trim()}>
                {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
              </Button>
            </form>
            <p className="text-[10px] text-center text-muted-foreground mt-2">
              Corrtex AI provides educational guidance. For specific recommendations, consult your plumber.
            </p>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
