import { TemplateLibrary } from "@/components/template-library";
import { useState } from "react";
import { ConfigEditor } from "@/components/config-editor";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useQuery } from "@tanstack/react-query";
import type { Template } from "@shared/schema";

export default function TemplatesPage() {
  const [selectedTemplate, setSelectedTemplate] = useState<Template | null>(null);

  const { data: templates = [], isLoading } = useQuery<Template[]>({
    queryKey: ["/api/templates"],
  });

  const handleSelectTemplate = (template: Template) => {
    setSelectedTemplate(template);
  };

  return (
    <div className="h-full p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-semibold mb-2">Configuration Templates</h1>
        <p className="text-sm text-muted-foreground">
          Pre-built configurations for common network scenarios
        </p>
      </div>
      
      {isLoading ? (
        <div className="flex items-center justify-center h-64">
          <p className="text-muted-foreground">Loading templates...</p>
        </div>
      ) : (
        <TemplateLibrary onSelectTemplate={handleSelectTemplate} />
      )}

      <Dialog open={!!selectedTemplate} onOpenChange={() => setSelectedTemplate(null)}>
        <DialogContent className="max-w-5xl max-h-[90vh]">
          <DialogHeader>
            <DialogTitle>{selectedTemplate?.name}</DialogTitle>
          </DialogHeader>
          <div className="flex-1">
            {selectedTemplate && (
              <ConfigEditor 
                initialConfig={selectedTemplate.content}
                readOnly={true}
              />
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
