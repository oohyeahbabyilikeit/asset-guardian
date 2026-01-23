import { useState, useMemo } from 'react';
import { Menu, Plus, Zap } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ContractorMenu } from '@/components/contractor/ContractorMenu';
import { ActiveSequencesList } from '@/components/contractor/ActiveSequencesList';
import { TemplatesList } from '@/components/contractor/TemplatesList';
import { SequenceAnalytics } from '@/components/contractor/SequenceAnalytics';
import { TemplateEditor } from '@/components/contractor/TemplateEditor';
import { SequenceBucketSidebar, filterSequencesByBucket, type SequenceBucket } from '@/components/contractor/SequenceBucketSidebar';
import { SequenceGlobalSearch } from '@/components/contractor/SequenceGlobalSearch';
import { useEnrichedSequences, useSequenceTemplates } from '@/hooks/useNurturingSequences';

export default function Sequences() {
  const [menuOpen, setMenuOpen] = useState(false);
  const [editorOpen, setEditorOpen] = useState(false);
  const [editingTemplateId, setEditingTemplateId] = useState<string | null>(null);
  const [activeBucket, setActiveBucket] = useState<SequenceBucket>('all');
  
  // Use enriched sequences for customer data
  const { data: sequences = [] } = useEnrichedSequences();
  const { data: templates = [] } = useSequenceTemplates();
  
  // Filter to active/paused only
  const activeSequences = useMemo(() => 
    sequences.filter(s => s.status === 'active' || s.status === 'paused'),
    [sequences]
  );
  
  // Apply bucket filter
  const filteredSequences = useMemo(() => 
    filterSequencesByBucket(activeSequences, activeBucket),
    [activeSequences, activeBucket]
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
                <Zap className="w-5 h-5 text-primary" />
                Outreach Sequences
              </h1>
              <p className="text-sm text-muted-foreground">
                Automate follow-up with customers
              </p>
            </div>
          </div>
          
          <div className="flex items-center gap-3">
            {/* Global Search */}
            <SequenceGlobalSearch sequences={activeSequences} />
            
            <Button
              onClick={handleNewTemplate}
              className="gap-2"
            >
              <Plus className="w-4 h-4" />
              New Template
            </Button>
          </div>
        </div>
      </header>
      
      {/* Main Layout: Sidebar + Content */}
      <div className="flex">
        {/* Left Sidebar */}
        <div className="p-4">
          <SequenceBucketSidebar
            sequences={activeSequences}
            activeBucket={activeBucket}
            onBucketChange={setActiveBucket}
          />
        </div>
        
        {/* Main Content */}
        <div className="flex-1 px-4 py-4">
          <Tabs defaultValue="active" className="w-full">
            <TabsList className="bg-muted/50 p-1">
              <TabsTrigger value="active" className="gap-2">
                Active
                {filteredSequences.length > 0 && (
                  <span className="text-xs bg-primary/20 text-primary px-1.5 py-0.5 rounded-full">
                    {filteredSequences.length}
                  </span>
                )}
              </TabsTrigger>
              <TabsTrigger value="templates" className="gap-2">
                Templates
                {templates.length > 0 && (
                  <span className="text-xs bg-muted-foreground/20 px-1.5 py-0.5 rounded-full">
                    {templates.length}
                  </span>
                )}
              </TabsTrigger>
              <TabsTrigger value="analytics">
                Analytics
              </TabsTrigger>
            </TabsList>
            
            <TabsContent value="active" className="mt-4">
              <ActiveSequencesList sequences={filteredSequences} />
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
