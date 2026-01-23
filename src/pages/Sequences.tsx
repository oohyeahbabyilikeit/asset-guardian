import { useState } from 'react';
import { Menu, Plus, Zap } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ContractorMenu } from '@/components/contractor/ContractorMenu';
import { ActiveSequencesList } from '@/components/contractor/ActiveSequencesList';
import { TemplatesList } from '@/components/contractor/TemplatesList';
import { SequenceAnalytics } from '@/components/contractor/SequenceAnalytics';
import { TemplateEditor } from '@/components/contractor/TemplateEditor';
import { useEnrichedSequences, useSequenceTemplates } from '@/hooks/useNurturingSequences';

export default function Sequences() {
  const [menuOpen, setMenuOpen] = useState(false);
  const [editorOpen, setEditorOpen] = useState(false);
  const [editingTemplateId, setEditingTemplateId] = useState<string | null>(null);
  
  // Use enriched sequences for customer data
  const { data: sequences = [] } = useEnrichedSequences();
  const { data: templates = [] } = useSequenceTemplates();
  
  const activeSequences = sequences.filter(s => 
    s.status === 'active' || s.status === 'paused'
  );
  
  const handleEditTemplate = (templateId: string) => {
    setEditingTemplateId(templateId);
    setEditorOpen(true);
  };
  
  const handleNewTemplate = () => {
    setEditingTemplateId(null);
    setEditorOpen(true);
  };

  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Header */}
      <header className="sticky top-0 z-40 bg-background/95 backdrop-blur-lg border-b border-border">
        <div className="flex items-center justify-between px-4 py-4">
          <div className="flex items-center gap-3">
            <Button
              variant="ghost"
              size="icon"
              className="text-muted-foreground hover:text-foreground"
              onClick={() => setMenuOpen(true)}
            >
              <Menu className="w-5 h-5" />
            </Button>
            <div>
              <h1 className="text-xl font-semibold tracking-tight flex items-center gap-2">
                <Zap className="w-5 h-5 text-violet-400" />
                Outreach Sequences
              </h1>
              <p className="text-sm text-muted-foreground">
                Automate follow-up with customers
              </p>
            </div>
          </div>
          
          <Button
            onClick={handleNewTemplate}
            className="gap-2 bg-violet-600 hover:bg-violet-700"
          >
            <Plus className="w-4 h-4" />
            New Template
          </Button>
        </div>
      </header>
      
      {/* Tabs */}
      <div className="px-4 py-4">
        <Tabs defaultValue="active" className="w-full">
          <TabsList className="w-full bg-muted/50 p-1">
            <TabsTrigger value="active" className="flex-1 gap-2">
              Active
              {activeSequences.length > 0 && (
                <span className="text-xs bg-violet-500/20 text-violet-300 px-1.5 py-0.5 rounded-full">
                  {activeSequences.length}
                </span>
              )}
            </TabsTrigger>
            <TabsTrigger value="templates" className="flex-1 gap-2">
              Templates
              {templates.length > 0 && (
                <span className="text-xs bg-muted-foreground/20 px-1.5 py-0.5 rounded-full">
                  {templates.length}
                </span>
              )}
            </TabsTrigger>
            <TabsTrigger value="analytics" className="flex-1">
              Analytics
            </TabsTrigger>
          </TabsList>
          
          <TabsContent value="active" className="mt-4">
            <ActiveSequencesList sequences={activeSequences} />
          </TabsContent>
          
          <TabsContent value="templates" className="mt-4">
            <TemplatesList 
              templates={templates} 
              onEdit={handleEditTemplate}
              onNew={handleNewTemplate}
            />
          </TabsContent>
          
          <TabsContent value="analytics" className="mt-4">
            <SequenceAnalytics sequences={sequences} />
          </TabsContent>
        </Tabs>
      </div>
      
      {/* Navigation Menu */}
      <ContractorMenu open={menuOpen} onOpenChange={setMenuOpen} />
      
      {/* Template Editor */}
      <TemplateEditor
        open={editorOpen}
        onClose={() => {
          setEditorOpen(false);
          setEditingTemplateId(null);
        }}
        templateId={editingTemplateId}
      />
    </div>
  );
}
