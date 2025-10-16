import { useEffect, useState } from "react";
import { ConfigEditor } from "@/components/config-editor";
import { AICopilot } from "@/components/ai-copilot";
import { CommandAutocomplete } from "@/components/command-autocomplete";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { useMutation, useQuery } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import type { TopologyNode } from "@shared/schema";

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
  const [applyOpen, setApplyOpen] = useState(false);
  const [routerHost, setRouterHost] = useState("");
  const [routerPort, setRouterPort] = useState(22);
  const [routerUser, setRouterUser] = useState("");
  const [routerPassword, setRouterPassword] = useState("");
  const [dryRun, setDryRun] = useState(false);
  const [selectedNodeId, setSelectedNodeId] = useState<string>("");
  const { toast } = useToast();
  const { data: nodes = [] } = useQuery<TopologyNode[]>({ queryKey: ["/api/topology/nodes"] });

  // Prefill from the first router node with SSH settings when dialog opens
  useEffect(() => {
    if (applyOpen && nodes.length > 0) {
      const withSsh = nodes.find(n => n.type === 'router' && (n as any)?.properties?.ssh?.host);
      if (withSsh) {
        setSelectedNodeId(withSsh.id);
        const ssh = (withSsh as any).properties.ssh;
        if (ssh.host) setRouterHost(ssh.host);
        if (ssh.port) setRouterPort(ssh.port);
        if (ssh.username) setRouterUser(ssh.username);
      }
    }
  }, [applyOpen, nodes]);

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

  const applyMutation = useMutation({
    mutationFn: async () => {
      const payload = {
        host: routerHost,
        port: routerPort,
        username: routerUser,
        password: routerPassword || undefined,
        configuration: config,
        commit: !dryRun,
        save: !dryRun,
        dryRun,
      };
      return await apiRequest<{ applied: boolean; logs: string[] }>("POST", "/api/routers/apply", payload);
    },
    onSuccess: (data) => {
      toast({
        title: data.applied ? "Applied to router" : "Not applied",
        description: data.logs?.slice(-3).join("\n") || "Done",
      });
      setApplyOpen(false);
    },
    onError: (error: Error) => {
      toast({ title: "Apply failed", description: error.message, variant: "destructive" });
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
            onChange={(next) => {
              setConfig(next);
              validateConfig(next);
            }}
          />
          <div className="mt-3 flex gap-2">
            <Button variant="outline" onClick={() => setApplyOpen(true)} data-testid="button-apply-router">
              Apply to Router
            </Button>
          </div>
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

      <Dialog open={applyOpen} onOpenChange={setApplyOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Apply to Router (VyOS)</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-2">
            {/* Optional quick connectivity test */}
            <div className="grid grid-cols-4 items-center gap-2">
              <Label className="text-right">Connectivity</Label>
              <div className="col-span-3 flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  type="button"
                  onClick={async () => {
                    try {
                      const res = await fetch(`/api/routers/check?host=${encodeURIComponent(routerHost)}&port=${routerPort || 22}`);
                      if (res.ok) {
                        const data = await res.json();
                        toast({ title: "SSH reachable", description: `${data.ms ?? ''}ms` });
                      } else {
                        const txt = await res.text();
                        toast({ title: "SSH not reachable", description: txt || res.statusText, variant: "destructive" });
                      }
                    } catch (e: any) {
                      toast({ title: "SSH check failed", description: e.message, variant: "destructive" });
                    }
                  }}
                >
                  Test SSH
                </Button>
              </div>
            </div>
            {nodes.length > 0 && (
              <div className="grid grid-cols-4 items-center gap-2">
                <Label className="text-right">Topology node</Label>
                <select
                  className="col-span-3 h-9 rounded-md border border-border bg-background px-3 text-sm"
                  value={selectedNodeId}
                  onChange={(e) => {
                    const id = e.target.value;
                    setSelectedNodeId(id);
                    const node = nodes.find(n => n.id === id);
                    const ssh = (node?.properties as any)?.ssh || {};
                    if (ssh.host) setRouterHost(ssh.host);
                    if (ssh.port) setRouterPort(ssh.port);
                    if (ssh.username) setRouterUser(ssh.username);
                  }}
                >
                  <option value="">—</option>
                  {nodes.map(n => (
                    <option key={n.id} value={n.id}>{n.label} ({n.type})</option>
                  ))}
                </select>
              </div>
            )}
            <div className="grid grid-cols-4 items-center gap-2">
              <Label className="text-right">Host</Label>
              <Input className="col-span-3" value={routerHost} onChange={(e) => setRouterHost(e.target.value)} placeholder="192.168.1.1" />
            </div>
            <div className="grid grid-cols-4 items-center gap-2">
              <Label className="text-right">Port</Label>
              <Input className="col-span-3" type="number" value={routerPort} onChange={(e) => setRouterPort(parseInt(e.target.value || "22", 10))} />
            </div>
            <div className="grid grid-cols-4 items-center gap-2">
              <Label className="text-right">Username</Label>
              <Input className="col-span-3" value={routerUser} onChange={(e) => setRouterUser(e.target.value)} placeholder="vyos" />
            </div>
            <div className="grid grid-cols-4 items-center gap-2">
              <Label className="text-right">Password</Label>
              <Input className="col-span-3" type="password" value={routerPassword} onChange={(e) => setRouterPassword(e.target.value)} />
            </div>
            <div className="grid grid-cols-4 items-center gap-2">
              <Label className="text-right">Dry run</Label>
              <input className="col-span-3 h-4 w-4" type="checkbox" checked={dryRun} onChange={(e) => setDryRun(e.target.checked)} />
            </div>
          </div>
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setApplyOpen(false)} disabled={applyMutation.isPending}>Cancel</Button>
            {(!config.trim() || !routerHost || !routerUser) && (
              <span className="text-xs text-muted-foreground mr-auto">
                {!config.trim() ? 'Add at least one set/delete line' : !routerHost ? 'Enter Host' : !routerUser ? 'Enter Username' : ''}
              </span>
            )}
            <Button onClick={() => applyMutation.mutate()} disabled={applyMutation.isPending || !routerHost || !routerUser || !config.trim()}>
              {applyMutation.isPending ? "Applying..." : "Apply"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
