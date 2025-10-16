import { useState } from "react";
import { Sparkles, Send, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";

interface AICopilotProps {
  onConfigGenerated?: (config: string, explanation: string) => void;
  isGenerating?: boolean;
}

export function AICopilot({ onConfigGenerated, isGenerating = false }: AICopilotProps) {
  const [intent, setIntent] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (intent.trim() && onConfigGenerated) {
      onConfigGenerated(intent, "");
      setIntent("");
    }
  };

  return (
    <Card className="border-primary/20 bg-card/50 backdrop-blur" data-testid="ai-copilot-card">
      <div className="p-4 border-b border-border">
        <div className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-md bg-primary/10">
            <Sparkles className="h-4 w-4 text-primary" />
          </div>
          <div className="flex-1">
            <h3 className="text-sm font-semibold" data-testid="ai-copilot-title">AI Configuration Assistant</h3>
            <p className="text-xs text-muted-foreground" data-testid="ai-copilot-subtitle">Describe what you want to configure in natural language</p>
          </div>
          <Badge variant="secondary" className="text-xs" data-testid="ai-model-badge">
            GPT-5
          </Badge>
        </div>
      </div>
      <form onSubmit={handleSubmit} className="p-4">
        <div className="space-y-3">
          <Textarea
            value={intent}
            onChange={(e) => setIntent(e.target.value)}
            placeholder="e.g., 'Configure a firewall rule to allow SSH from 192.168.1.0/24' or 'Set up BGP peering with AS 65001'"
            className="min-h-[100px] resize-none font-sans text-sm"
            disabled={isGenerating}
            data-testid="input-ai-intent"
          />
          <div className="flex items-center justify-between">
            <p className="text-xs text-muted-foreground" data-testid="ai-hint-text">
              {isGenerating ? "Generating VyOS configuration..." : "Press Enter with Shift for new line"}
            </p>
            <Button
              type="submit"
              disabled={!intent.trim() || isGenerating}
              size="sm"
              data-testid="button-generate-config"
            >
              {isGenerating ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" data-testid="loading-spinner" />
                  Generating
                </>
              ) : (
                <>
                  <Send className="h-4 w-4" />
                  Generate
                </>
              )}
            </Button>
          </div>
        </div>
      </form>
    </Card>
  );
}
