import { useState, useEffect } from "react";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Terminal, Clock } from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useQuery } from "@tanstack/react-query";

interface CommandSuggestion {
  command: string;
  description: string;
  syntax: string;
  category: string;
}

const recentCommands = [
  'set interfaces ethernet eth0 address 192.168.1.1/24',
  'set firewall name WAN_LOCAL default-action drop',
  'set protocols bgp system-as 65001',
];

interface CommandAutocompleteProps {
  onSelectCommand?: (command: string) => void;
}

export function CommandAutocomplete({ onSelectCommand }: CommandAutocompleteProps) {
  const [input, setInput] = useState("");
  const [showSuggestions, setShowSuggestions] = useState(false);

  const { data: suggestions = [] } = useQuery<CommandSuggestion[]>({
    queryKey: ["/api/commands/suggest", input],
    queryFn: async () => {
      const response = await fetch(`/api/commands/suggest?q=${encodeURIComponent(input)}`);
      if (!response.ok) throw new Error('Failed to fetch suggestions');
      return response.json();
    },
    enabled: input.trim().length > 0,
  });

  const handleSelectSuggestion = (command: string) => {
    setInput(command);
    setShowSuggestions(false);
    if (onSelectCommand) {
      onSelectCommand(command);
    }
  };

  return (
    <div className="space-y-3">
      <div className="relative">
        <Terminal className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          value={input}
          onChange={(e) => {
            setInput(e.target.value);
            setShowSuggestions(e.target.value.trim().length > 0);
          }}
          placeholder="Type VyOS command..."
          className="pl-9 font-mono text-sm"
          data-testid="input-command"
          onFocus={() => input && setShowSuggestions(true)}
        />
        
        {showSuggestions && suggestions.length > 0 && (
          <Card className="absolute top-full mt-1 w-full z-10 border-border shadow-lg" data-testid="suggestions-dropdown">
            <ScrollArea className="max-h-[300px]">
              <div className="p-1">
                {suggestions.map((suggestion, index) => (
                  <button
                    key={index}
                    onClick={() => handleSelectSuggestion(suggestion.command)}
                    className="w-full text-left p-3 rounded-md hover-elevate transition-all"
                    data-testid={`suggestion-${index}`}
                  >
                    <div className="flex items-start justify-between gap-2 mb-1">
                      <code className="text-sm font-mono text-foreground" data-testid={`suggestion-command-${index}`}>{suggestion.command}</code>
                      <Badge variant="outline" className="text-xs capitalize" data-testid={`suggestion-category-${index}`}>
                        {suggestion.category}
                      </Badge>
                    </div>
                    <p className="text-xs text-muted-foreground mb-1" data-testid={`suggestion-desc-${index}`}>{suggestion.description}</p>
                    <p className="text-xs font-mono text-muted-foreground/70" data-testid={`suggestion-syntax-${index}`}>{suggestion.syntax}</p>
                  </button>
                ))}
              </div>
            </ScrollArea>
          </Card>
        )}
      </div>

      {!input && recentCommands.length > 0 && (
        <div className="space-y-2">
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <Clock className="h-3 w-3" />
            <span data-testid="recent-commands-label">Recently used</span>
          </div>
          <div className="space-y-1">
            {recentCommands.map((cmd, index) => (
              <button
                key={index}
                onClick={() => handleSelectSuggestion(cmd)}
                className="w-full text-left p-2 rounded-md hover-elevate transition-all"
                data-testid={`recent-${index}`}
              >
                <code className="text-xs font-mono text-muted-foreground" data-testid={`recent-command-${index}`}>{cmd}</code>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
