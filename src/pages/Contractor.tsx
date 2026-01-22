import { Link } from 'react-router-dom';
import { ArrowLeft, Wrench } from 'lucide-react';

export default function Contractor() {
  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-10 bg-card border-b border-border">
        <div className="flex items-center justify-between px-4 py-4">
          <Link to="/" className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors">
            <ArrowLeft className="w-5 h-5" />
            <span className="text-sm">Back to Home</span>
          </Link>
          <h1 className="text-lg font-bold text-foreground">Contractor Tools</h1>
          <div className="w-20" /> {/* Spacer for centering */}
        </div>
      </header>
      
      <main className="p-4">
        {/* Your contractor tools will go here */}
        <div className="text-center py-12 text-muted-foreground">
          <Wrench className="w-12 h-12 mx-auto mb-4 opacity-50" />
          <p>Contractor tools coming soon...</p>
        </div>
      </main>
    </div>
  );
}
