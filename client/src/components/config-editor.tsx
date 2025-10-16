import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { 
  AlertCircle, 
  CheckCircle2, 
  AlertTriangle, 
  Copy, 
  Download, 
  Save,
  Code2
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface ValidationError {
  line: number;
  message: string;
  severity: 'error' | 'warning' | 'info';
}

interface ConfigEditorProps {
  initialConfig?: string;
  validation?: ValidationError[];
  onSave?: (config: string) => void;
  readOnly?: boolean;
  onChange?: (config: string) => void;
}

export function ConfigEditor({ 
  initialConfig = "", 
  validation = [], 
  onSave,
  readOnly = false,
  onChange,
}: ConfigEditorProps) {
  const [config, setConfig] = useState(initialConfig);
  const [activeTab, setActiveTab] = useState("editor");
  const { toast } = useToast();

  useEffect(() => {
    setConfig(initialConfig);
  }, [initialConfig]);

  const errorCount = validation.filter(v => v.severity === 'error').length;
  const warningCount = validation.filter(v => v.severity === 'warning').length;
  const isValid = errorCount === 0;

  const handleCopy = () => {
    navigator.clipboard.writeText(config);
    toast({
      title: "Copied to clipboard",
      description: "Configuration copied successfully",
    });
  };

  const handleDownload = () => {
    const blob = new Blob([config], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'vyos-config.txt';
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleSave = () => {
    if (onSave) {
      onSave(config);
    }
  };

  return (
    <Card className="flex flex-col h-full">
      <div className="p-4 border-b border-border">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Code2 className="h-4 w-4 text-muted-foreground" />
            <h3 className="text-sm font-semibold">VyOS Configuration</h3>
          </div>
          <div className="flex items-center gap-2">
            {validation.length > 0 && (
              <div className="flex items-center gap-2">
                {isValid ? (
                  <Badge variant="secondary" className="gap-1 bg-success/10 text-success border-success/20">
                    <CheckCircle2 className="h-3 w-3" />
                    Valid
                  </Badge>
                ) : (
                  <>
                    {errorCount > 0 && (
                      <Badge variant="secondary" className="gap-1 bg-destructive/10 text-destructive border-destructive/20">
                        <AlertCircle className="h-3 w-3" />
                        {errorCount} {errorCount === 1 ? 'error' : 'errors'}
                      </Badge>
                    )}
                    {warningCount > 0 && (
                      <Badge variant="secondary" className="gap-1 bg-warning/10 text-warning border-warning/20">
                        <AlertTriangle className="h-3 w-3" />
                        {warningCount} {warningCount === 1 ? 'warning' : 'warnings'}
                      </Badge>
                    )}
                  </>
                )}
              </div>
            )}
            <Button
              variant="ghost"
              size="sm"
              onClick={handleCopy}
              data-testid="button-copy-config"
            >
              <Copy className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleDownload}
              data-testid="button-download-config"
            >
              <Download className="h-4 w-4" />
            </Button>
            {!readOnly && onSave && (
              <Button
                size="sm"
                onClick={handleSave}
                disabled={!isValid}
                data-testid="button-save-config"
              >
                <Save className="h-4 w-4" />
                Save
              </Button>
            )}
          </div>
        </div>
      </div>
      
      <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 flex flex-col">
        <div className="px-4 pt-2">
          <TabsList className="grid w-full max-w-md grid-cols-2">
            <TabsTrigger value="editor" data-testid="tab-editor">Editor</TabsTrigger>
            <TabsTrigger value="validation" data-testid="tab-validation">
              Validation {validation.length > 0 && `(${validation.length})`}
            </TabsTrigger>
          </TabsList>
        </div>

        <TabsContent value="editor" className="flex-1 p-4 pt-2 mt-0">
          <ScrollArea className="h-full rounded-md border border-border">
            <textarea
              value={config}
              onChange={(e) => {
                const next = e.target.value;
                setConfig(next);
                if (onChange) onChange(next);
              }}
              className="w-full h-full min-h-[400px] p-4 bg-transparent font-mono text-sm leading-relaxed focus:outline-none resize-none"
              placeholder="Enter VyOS configuration here..."
              readOnly={readOnly}
              data-testid="textarea-config-editor"
              spellCheck={false}
            />
          </ScrollArea>
        </TabsContent>

        <TabsContent value="validation" className="flex-1 p-4 pt-2 mt-0">
          <ScrollArea className="h-full">
            {validation.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-[400px] text-center">
                <CheckCircle2 className="h-12 w-12 text-muted-foreground mb-3" />
                <p className="text-sm text-muted-foreground">No validation issues found</p>
              </div>
            ) : (
              <div className="space-y-2" data-testid="validation-list">
                {validation.map((item, index) => (
                  <Card key={index} className={`p-3 ${
                    item.severity === 'error' ? 'border-destructive/50 bg-destructive/5' :
                    item.severity === 'warning' ? 'border-warning/50 bg-warning/5' :
                    'border-info/50 bg-info/5'
                  }`}>
                    <div className="flex items-start gap-3">
                      {item.severity === 'error' && <AlertCircle className="h-4 w-4 text-destructive mt-0.5" />}
                      {item.severity === 'warning' && <AlertTriangle className="h-4 w-4 text-warning mt-0.5" />}
                      {item.severity === 'info' && <AlertCircle className="h-4 w-4 text-info mt-0.5" />}
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <Badge variant="outline" className="text-xs">
                            Line {item.line}
                          </Badge>
                          <Badge variant="outline" className="text-xs capitalize">
                            {item.severity}
                          </Badge>
                        </div>
                        <p className="text-sm">{item.message}</p>
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            )}
          </ScrollArea>
        </TabsContent>
      </Tabs>
    </Card>
  );
}
