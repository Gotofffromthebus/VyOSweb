import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { 
  Shield, 
  Lock, 
  Route, 
  Gauge, 
  Network,
  Search,
  FileCode,
  CheckCircle2
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useQuery } from "@tanstack/react-query";
import type { Template } from "@shared/schema";

const templateIcons: Record<string, any> = {
  shield: Shield,
  lock: Lock,
  route: Route,
  gauge: Gauge,
  network: Network,
};

interface TemplateLibraryProps {
  onSelectTemplate?: (template: Template) => void;
}

export function TemplateLibrary({ onSelectTemplate }: TemplateLibraryProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [selectedTemplate, setSelectedTemplate] = useState<Template | null>(null);

  const { data: templates = [], isLoading } = useQuery<Template[]>({
    queryKey: ["/api/templates"],
  });

  const categories = Array.from(new Set(templates.map(t => t.category)));

  const filteredTemplates = templates.filter(template => {
    const matchesSearch = template.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         template.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         (template.tags && template.tags.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase())));
    const matchesCategory = !selectedCategory || template.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const handleUseTemplate = (template: Template) => {
    if (onSelectTemplate) {
      onSelectTemplate(template);
    }
    setSelectedTemplate(null);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <p className="text-muted-foreground" data-testid="loading-templates">Loading templates...</p>
      </div>
    );
  }

  return (
    <>
      <div className="space-y-4">
        <div className="flex items-center gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Search templates..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9"
              data-testid="input-search-templates"
            />
          </div>
        </div>

        <div className="flex gap-2 flex-wrap">
          <Button
            variant={selectedCategory === null ? "default" : "outline"}
            size="sm"
            onClick={() => setSelectedCategory(null)}
            data-testid="filter-all"
          >
            All
          </Button>
          {categories.map(category => (
            <Button
              key={category}
              variant={selectedCategory === category ? "default" : "outline"}
              size="sm"
              onClick={() => setSelectedCategory(category)}
              data-testid={`filter-${category}`}
            >
              {category.charAt(0).toUpperCase() + category.slice(1)}
            </Button>
          ))}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredTemplates.map(template => {
            const Icon = templateIcons[template.icon] || FileCode;
            return (
              <Card 
                key={template.id} 
                className="p-6 hover-elevate cursor-pointer transition-all"
                onClick={() => setSelectedTemplate(template)}
                data-testid={`template-${template.id}`}
              >
                <div className="flex items-start gap-4">
                  <div className={`flex h-12 w-12 items-center justify-center rounded-md ${
                    template.category === 'firewall' ? 'bg-destructive/10 text-destructive' :
                    template.category === 'vpn' ? 'bg-warning/10 text-warning' :
                    template.category === 'routing' ? 'bg-primary/10 text-primary' :
                    template.category === 'qos' ? 'bg-accent/10 text-accent' :
                    'bg-muted text-muted-foreground'
                  }`} data-testid={`template-icon-${template.id}`}>
                    <Icon className="h-6 w-6" />
                  </div>
                  <div className="flex-1">
                    <h3 className="font-semibold text-sm mb-1" data-testid={`template-name-${template.id}`}>{template.name}</h3>
                    <p className="text-xs text-muted-foreground line-clamp-2 mb-3" data-testid={`template-desc-${template.id}`}>
                      {template.description}
                    </p>
                    <div className="flex gap-1 flex-wrap">
                      {template.tags && template.tags.slice(0, 2).map(tag => (
                        <Badge key={tag} variant="secondary" className="text-xs" data-testid={`template-tag-${tag}`}>
                          {tag}
                        </Badge>
                      ))}
                      {template.tags && template.tags.length > 2 && (
                        <Badge variant="secondary" className="text-xs" data-testid="template-more-tags">
                          +{template.tags.length - 2}
                        </Badge>
                      )}
                    </div>
                  </div>
                </div>
              </Card>
            );
          })}
        </div>

        {filteredTemplates.length === 0 && (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <FileCode className="h-16 w-16 text-muted-foreground mb-4 opacity-20" />
            <h3 className="text-lg font-semibold mb-2">No templates found</h3>
            <p className="text-sm text-muted-foreground" data-testid="no-templates-message">
              Try adjusting your search or filter criteria
            </p>
          </div>
        )}
      </div>

      <Dialog open={!!selectedTemplate} onOpenChange={() => setSelectedTemplate(null)}>
        <DialogContent className="max-w-3xl max-h-[80vh]" data-testid="template-dialog">
          <DialogHeader>
            <DialogTitle data-testid="template-dialog-title">{selectedTemplate?.name}</DialogTitle>
            <DialogDescription data-testid="template-dialog-description">{selectedTemplate?.description}</DialogDescription>
          </DialogHeader>
          <ScrollArea className="max-h-[400px]">
            <pre className="p-4 bg-muted rounded-md text-xs font-mono leading-relaxed" data-testid="template-content">
              {selectedTemplate?.content}
            </pre>
          </ScrollArea>
          <DialogFooter>
            <Button variant="outline" onClick={() => setSelectedTemplate(null)} data-testid="button-cancel-template">
              Cancel
            </Button>
            <Button onClick={() => selectedTemplate && handleUseTemplate(selectedTemplate)} data-testid="button-use-template">
              <CheckCircle2 className="h-4 w-4" />
              Use Template
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
