import { useState } from "react";
import { ConfigEditor } from "@/components/config-editor";
import { AICopilot } from "@/components/ai-copilot";
import { CommandAutocomplete } from "@/components/command-autocomplete";
import { Card } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { useMutation, useQuery } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";

interface AIGenerationResponse {
  configuration: string;
  explanation: string;
}

interface ValidationResult {
  valid: boolean;
  errors: Array<{ line: number; message: string; severity: 'error' | 'warning' | 'info' }>;
  warnings: Array<{ line: number; message: string }>;
}

export default function ConfigurationsPage() {
  const [config, setConfig] = useState("");
  const [validation, setValidation] = useState<ValidationResult['errors']>([]);
  const { toast } = useToast();

  const generateMutation = useMutation({
    mutationFn: async (intent: string) => {
      const response = await apiRequest<AIGenerationResponse>("POST", "/api/ai/generate", { intent });
      return response;
    },
    onSuccess: (data) => {
      setConfig(data.configuration);
      validateConfig(data.configuration);
      toast({
        title: "Configuration Generated",
        description: data.explanation,
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Generation Failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const validateMutation = useMutation({
    mutationFn: async (configuration: string) => {
      const response = await apiRequest<ValidationResult>("POST", "/api/validate", { configuration });
      return response;
    },
    onSuccess: (data) => {
      setValidation(data.errors);
    },
  });

  const saveMutation = useMutation({
    mutationFn: async (configuration: string) => {
      const response = await apiRequest("POST", "/api/configurations", {
        name: "Generated Configuration",
        content: configuration,
        type: "custom",
      });
      return response;
    },
    onSuccess: () => {
      toast({
        title: "Configuration Saved",
        description: "Your configuration has been saved successfully",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/configurations"] });
    },
    onError: (error: Error) => {
      toast({
        title: "Save Failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const handleConfigGenerated = (intent: string) => {
    generateMutation.mutate(intent);
  };

  const validateConfig = (cfg: string) => {
    if (cfg.trim()) {
      validateMutation.mutate(cfg);
    }
  };

  const handleCommandSelected = (command: string) => {
    const newConfig = config + (config ? '\n' : '') + command;
    setConfig(newConfig);
    validateConfig(newConfig);
  };

  const handleSave = (cfg: string) => {
    saveMutation.mutate(cfg);
  };

  return (
    <div className="flex flex-col h-full gap-6 p-6">
      <div className="flex-shrink-0">
        <AICopilot 
          onConfigGenerated={handleConfigGenerated}
          isGenerating={generateMutation.isPending}
        />
      </div>
      
      <div className="flex-1 min-h-0 grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <ConfigEditor 
            initialConfig={config}
            validation={validation}
            onSave={handleSave}
          />
        </div>
        
        <div className="space-y-6">
          <Card className="p-4">
            <h3 className="text-sm font-semibold mb-4">Command Assistant</h3>
            <CommandAutocomplete onSelectCommand={handleCommandSelected} />
          </Card>
          
          <Card className="p-4">
            <h3 className="text-sm font-semibold mb-3">Quick Actions</h3>
            <div className="space-y-2 text-sm">
              <div className="p-2 rounded-md bg-muted/50">
                <p className="text-xs text-muted-foreground">Syntax: VyOS 1.4+</p>
              </div>
              <div className="p-2 rounded-md bg-muted/50">
                <p className="text-xs text-muted-foreground">Lines: {config.split('\n').filter(l => l.trim()).length}</p>
              </div>
              {validation.length > 0 && (
                <div className="p-2 rounded-md bg-muted/50">
                  <p className="text-xs text-muted-foreground">
                    Issues: {validation.filter(v => v.severity === 'error').length} errors, {validation.filter(v => v.severity === 'warning').length} warnings
                  </p>
                </div>
              )}
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
