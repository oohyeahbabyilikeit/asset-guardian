import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Sparkles, RefreshCw, Send, Copy, Check, Target, MessageSquare, Package, Shield, Clapperboard } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { toast } from 'sonner';
import ReactMarkdown from 'react-markdown';
import type { MockOpportunity } from '@/data/mockContractorData';

const SALES_COACH_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/sales-coach`;

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
}

interface SalesCoachDrawerProps {
  open: boolean;
  onClose: () => void;
  opportunity: MockOpportunity;
}

const priorityConfig = {
  critical: { label: 'CRITICAL', dotClass: 'bg-rose-500' },
  high: { label: 'HIGH', dotClass: 'bg-orange-500' },
  medium: { label: 'MEDIUM', dotClass: 'bg-amber-500' },
  low: { label: 'LOW', dotClass: 'bg-emerald-500' },
};

export function SalesCoachDrawer({ open, onClose, opportunity }: SalesCoachDrawerProps) {
  const [briefing, setBriefing] = useState<string>('');
  const [isLoading, setIsLoading] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [copiedSection, setCopiedSection] = useState<string | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const priority = priorityConfig[opportunity.priority] || priorityConfig.medium;

  // Generate initial briefing when drawer opens
  useEffect(() => {
    if (open && !briefing && !isLoading) {
      generateBriefing();
    }
  }, [open]);

  // Reset state when drawer closes
  useEffect(() => {
    if (!open) {
      setBriefing('');
      setMessages([]);
      setInputValue('');
    }
  }, [open]);

  // Auto-scroll to bottom
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [briefing, messages]);

  const generateBriefing = async () => {
    setIsLoading(true);
    setBriefing('');

    try {
      const response = await fetch(SALES_COACH_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
        },
        body: JSON.stringify({
          opportunity,
          mode: 'briefing',
        }),
      });

      if (!response.ok) {
        if (response.status === 429) {
          toast.error('Rate limit exceeded. Please wait a moment and try again.');
          return;
        }
        if (response.status === 402) {
          toast.error('AI service temporarily unavailable.');
          return;
        }
        throw new Error('Failed to generate briefing');
      }

      const reader = response.body?.getReader();
      if (!reader) throw new Error('No response body');

      const decoder = new TextDecoder();
      let buffer = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });

        let newlineIndex: number;
        while ((newlineIndex = buffer.indexOf('\n')) !== -1) {
          let line = buffer.slice(0, newlineIndex);
          buffer = buffer.slice(newlineIndex + 1);

          if (line.endsWith('\r')) line = line.slice(0, -1);
          if (line.startsWith(':') || line.trim() === '') continue;
          if (!line.startsWith('data: ')) continue;

          const jsonStr = line.slice(6).trim();
          if (jsonStr === '[DONE]') break;

          try {
            const parsed = JSON.parse(jsonStr);
            const content = parsed.choices?.[0]?.delta?.content;
            if (content) {
              setBriefing(prev => prev + content);
            }
          } catch {
            buffer = line + '\n' + buffer;
            break;
          }
        }
      }
    } catch (error) {
      console.error('Error generating briefing:', error);
      toast.error('Failed to generate sales briefing. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const sendFollowUp = async () => {
    if (!inputValue.trim() || isLoading) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: inputValue.trim(),
    };

    setMessages(prev => [...prev, userMessage]);
    setInputValue('');
    setIsLoading(true);

    try {
      const response = await fetch(SALES_COACH_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
        },
        body: JSON.stringify({
          opportunity,
          mode: 'chat',
          messages: [...messages, userMessage].map(m => ({
            role: m.role,
            content: m.content,
          })),
        }),
      });

      if (!response.ok) {
        if (response.status === 429) {
          toast.error('Rate limit exceeded. Please wait a moment.');
          return;
        }
        throw new Error('Failed to send message');
      }

      const reader = response.body?.getReader();
      if (!reader) throw new Error('No response body');

      const decoder = new TextDecoder();
      let buffer = '';
      let assistantContent = '';

      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: '',
      };
      setMessages(prev => [...prev, assistantMessage]);

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });

        let newlineIndex: number;
        while ((newlineIndex = buffer.indexOf('\n')) !== -1) {
          let line = buffer.slice(0, newlineIndex);
          buffer = buffer.slice(newlineIndex + 1);

          if (line.endsWith('\r')) line = line.slice(0, -1);
          if (line.startsWith(':') || line.trim() === '') continue;
          if (!line.startsWith('data: ')) continue;

          const jsonStr = line.slice(6).trim();
          if (jsonStr === '[DONE]') break;

          try {
            const parsed = JSON.parse(jsonStr);
            const content = parsed.choices?.[0]?.delta?.content;
            if (content) {
              assistantContent += content;
              setMessages(prev =>
                prev.map(m =>
                  m.id === assistantMessage.id
                    ? { ...m, content: assistantContent }
                    : m
                )
              );
            }
          } catch {
            buffer = line + '\n' + buffer;
            break;
          }
        }
      }
    } catch (error) {
      console.error('Error sending follow-up:', error);
      toast.error('Failed to send message. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const copySection = async (sectionTitle: string, content: string) => {
    try {
      await navigator.clipboard.writeText(content);
      setCopiedSection(sectionTitle);
      toast.success('Copied to clipboard');
      setTimeout(() => setCopiedSection(null), 2000);
    } catch {
      toast.error('Failed to copy');
    }
  };

  const getSectionIcon = (title: string) => {
    if (title.includes('CALL OPENING')) return Target;
    if (title.includes('KEY TALKING')) return MessageSquare;
    if (title.includes('UPSELL')) return Package;
    if (title.includes('OBJECTION')) return Shield;
    if (title.includes('CLOSING')) return Clapperboard;
    return Sparkles;
  };

  // Parse briefing into sections for copy buttons
  const sections = briefing.split(/(?=## [🎯💬📦🛡️🎬])/).filter(Boolean);

  if (!open) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-[60] bg-background/95 backdrop-blur-xl"
      >
        {/* Header */}
        <div className="sticky top-0 z-10 bg-card/80 backdrop-blur-sm border-b border-border">
          <div className="flex items-center justify-between p-4">
            <Button
              variant="ghost"
              size="sm"
              onClick={onClose}
              className="gap-2 text-muted-foreground hover:text-foreground"
            >
              <X className="w-4 h-4" />
              Close
            </Button>

            <div className="flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-primary" />
              <span className="font-semibold text-foreground">Sales Coach</span>
            </div>

            <Button
              variant="ghost"
              size="sm"
              onClick={generateBriefing}
              disabled={isLoading}
              className="gap-2 text-muted-foreground hover:text-foreground"
            >
              <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
              Regenerate
            </Button>
          </div>

          {/* Customer Context */}
          <div className="px-4 pb-3 flex items-center gap-3">
            <div className={`w-2 h-2 rounded-full ${priority.dotClass}`} />
            <span className="text-sm text-muted-foreground">{priority.label}</span>
            <span className="text-foreground font-medium">{opportunity.customerName || 'Customer'}</span>
            <span className="text-muted-foreground">•</span>
            <span className="text-sm text-muted-foreground">{opportunity.propertyAddress}</span>
          </div>
        </div>

        {/* Content */}
        <ScrollArea className="h-[calc(100vh-180px)]" ref={scrollRef}>
          <div className="p-4 pb-32 max-w-3xl mx-auto">
            {/* Loading State */}
            {isLoading && !briefing && (
              <div className="flex flex-col items-center justify-center py-16 gap-4">
                <div className="relative">
                  <div className="w-16 h-16 rounded-full bg-primary/20 animate-pulse" />
                  <Sparkles className="w-8 h-8 text-primary absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2" />
                </div>
                <p className="text-muted-foreground">Generating your sales briefing...</p>
              </div>
            )}

            {/* Briefing Content */}
            {briefing && (
              <div className="space-y-6">
                {sections.map((section, index) => {
                  const lines = section.trim().split('\n');
                  const titleLine = lines[0];
                  const content = lines.slice(1).join('\n').trim();
                  const Icon = getSectionIcon(titleLine);

                  return (
                    <motion.div
                      key={index}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.1 }}
                      className="bg-card rounded-lg border border-border p-4"
                    >
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex items-center gap-2">
                          <Icon className="w-5 h-5 text-primary" />
                          <h3 className="font-semibold text-foreground">
                            {titleLine.replace(/^## /, '').replace(/[🎯💬📦🛡️🎬] /, '')}
                          </h3>
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => copySection(titleLine, content)}
                          className="text-muted-foreground hover:text-foreground h-8 w-8 p-0"
                        >
                          {copiedSection === titleLine ? (
                            <Check className="w-4 h-4 text-emerald-500" />
                          ) : (
                            <Copy className="w-4 h-4" />
                          )}
                        </Button>
                      </div>
                      <div className="prose prose-invert prose-sm max-w-none">
                        <ReactMarkdown
                          components={{
                            p: ({ children }) => <p className="text-muted-foreground leading-relaxed mb-2">{children}</p>,
                            ul: ({ children }) => <ul className="list-disc list-inside space-y-1 text-muted-foreground">{children}</ul>,
                            li: ({ children }) => <li className="text-muted-foreground">{children}</li>,
                            strong: ({ children }) => <strong className="text-foreground font-medium">{children}</strong>,
                          }}
                        >
                          {content}
                        </ReactMarkdown>
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            )}

            {/* Follow-up Messages */}
            {messages.length > 0 && (
              <div className="mt-8 space-y-4">
                <div className="border-t border-border pt-4">
                  <h4 className="text-sm font-medium text-muted-foreground mb-4">Follow-up Questions</h4>
                </div>
                {messages.map((message) => (
                  <div
                    key={message.id}
                    className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
                  >
                    <div
                      className={`max-w-[80%] rounded-lg p-3 ${
                        message.role === 'user'
                          ? 'bg-primary text-primary-foreground'
                          : 'bg-card border border-border'
                      }`}
                    >
                      {message.role === 'assistant' ? (
                        <div className="prose prose-invert prose-sm max-w-none">
                          <ReactMarkdown
                            components={{
                              p: ({ children }) => <p className="text-muted-foreground leading-relaxed mb-2 last:mb-0">{children}</p>,
                              strong: ({ children }) => <strong className="text-foreground">{children}</strong>,
                            }}
                          >
                            {message.content}
                          </ReactMarkdown>
                        </div>
                      ) : (
                        <p>{message.content}</p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </ScrollArea>

        {/* Input Area */}
        <div className="fixed bottom-0 left-0 right-0 bg-card/80 backdrop-blur-sm border-t border-border p-4">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              sendFollowUp();
            }}
            className="flex gap-3 max-w-3xl mx-auto"
          >
            <Input
              ref={inputRef}
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              placeholder="Ask a follow-up question..."
              disabled={isLoading || !briefing}
              className="flex-1 bg-secondary border-border"
            />
            <Button
              type="submit"
              disabled={!inputValue.trim() || isLoading || !briefing}
              className="gap-2"
            >
              <Send className="w-4 h-4" />
              Send
            </Button>
          </form>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}
