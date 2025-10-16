import { TopologyCanvas } from "@/components/topology-canvas";
import { AICopilot } from "@/components/ai-copilot";
import { useState } from "react";
import { useToast } from "@/hooks/use-toast";
import { useMutation } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";

interface AIGenerationResponse {
  configuration: string;
  explanation: string;
}

export default function TopologyPage() {
  const [generatedConfig, setGeneratedConfig] = useState<string>("");
  const { toast } = useToast();

  const generateMutation = useMutation({
    mutationFn: async (intent: string) => {
      const response = await apiRequest<AIGenerationResponse>("POST", "/api/ai/generate", { intent });
      return response;
    },
    onSuccess: (data) => {
      setGeneratedConfig(data.configuration);
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

  const handleConfigGenerated = async (intent: string) => {
    generateMutation.mutate(intent);
  };

  return (
    <div className="flex flex-col h-full gap-6 p-6">
      <div className="flex-1 min-h-0">
        <TopologyCanvas />
      </div>
      <div className="flex-shrink-0">
        <AICopilot 
          onConfigGenerated={handleConfigGenerated}
          isGenerating={generateMutation.isPending}
        />
      </div>
    </div>
  );
}
