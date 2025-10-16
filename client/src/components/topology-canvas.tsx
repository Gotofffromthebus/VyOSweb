import { useState, useCallback, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { 
  Network, 
  Server, 
  Shield, 
  Router,
  Laptop,
  Plus,
  ZoomIn,
  ZoomOut,
  Maximize2,
  Download
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import type { TopologyNode, TopologyConnection } from "@shared/schema";
import { useMemo } from "react";

const nodeIcons = {
  router: Router,
  switch: Network,
  firewall: Shield,
  server: Server,
  client: Laptop,
};

const nodeColors = {
  router: 'bg-primary/10 border-primary text-primary',
  switch: 'bg-accent/10 border-accent text-accent',
  firewall: 'bg-destructive/10 border-destructive text-destructive',
  server: 'bg-success/10 border-success text-success',
  client: 'bg-muted border-border text-muted-foreground',
};

export function TopologyCanvas() {
  const [zoom, setZoom] = useState(100);
  const [selectedNode, setSelectedNode] = useState<string | null>(null);
  const [draggingNode, setDraggingNode] = useState<string | null>(null);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const [sshOpen, setSshOpen] = useState(false);
  const [sshHost, setSshHost] = useState("");
  const [sshPort, setSshPort] = useState(22);
  const [sshUser, setSshUser] = useState("");

  const { data: nodes = [] } = useQuery<TopologyNode[]>({
    queryKey: ["/api/topology/nodes"],
  });

  const reachability = useMemo(() => new Map<string, { ok: boolean; ms?: number }>(), []);

  useEffect(() => {
    let cancelled = false;
    async function pingNode(n: TopologyNode) {
      if (n.type !== 'router') return;
      const ssh = (n.properties as any)?.ssh;
      if (!ssh?.host) return;
      try {
        const res = await fetch(`/api/routers/check?host=${encodeURIComponent(ssh.host)}&port=${ssh.port || 22}`);
        const ok = res.ok;
        const data = ok ? await res.json() : {};
        if (!cancelled) reachability.set(n.id, { ok, ms: data.ms });
      } catch {
        if (!cancelled) reachability.set(n.id, { ok: false });
      }
    }
    nodes.forEach(pingNode);
    const id = setInterval(() => nodes.forEach(pingNode), 10000);
    return () => { cancelled = true; clearInterval(id); };
  }, [nodes, reachability]);

  const { data: connections = [] } = useQuery<TopologyConnection[]>({
    queryKey: ["/api/topology/connections"],
  });

  const createNodeMutation = useMutation({
    mutationFn: async (data: { type: TopologyNode['type']; label: string; x: number; y: number }) => {
      return apiRequest("POST", "/api/topology/nodes", {
        label: data.label,
        type: data.type,
        position: { x: data.x, y: data.y },
        properties: {},
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/topology/nodes"] });
    },
  });

  const deleteNodeMutation = useMutation({
    mutationFn: async (id: string) => {
      return apiRequest("DELETE", `/api/topology/nodes/${id}`, undefined);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/topology/nodes"] });
      setSelectedNode(null);
    },
  });

  const addNode = (type: TopologyNode['type']) => {
    createNodeMutation.mutate({
      type,
      label: `${type.charAt(0).toUpperCase() + type.slice(1)}-${nodes.length + 1}`,
      x: 200 + Math.random() * 100,
      y: 150 + Math.random() * 100,
    });
  };

  const handleMouseDown = (nodeId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setDraggingNode(nodeId);
    const node = nodes.find(n => n.id === nodeId);
    if (node && typeof node.position === 'object' && 'x' in node.position) {
      setDragOffset({
        x: e.clientX - (node.position.x as number) * (zoom / 100),
        y: e.clientY - (node.position.y as number) * (zoom / 100),
      });
    }
    setSelectedNode(nodeId);
  };

  const handleMouseMove = useCallback((e: MouseEvent) => {
    if (draggingNode) {
      const node = nodes.find(n => n.id === draggingNode);
      if (node) {
        const newX = (e.clientX - dragOffset.x) / (zoom / 100);
        const newY = (e.clientY - dragOffset.y) / (zoom / 100);
        
        queryClient.setQueryData<TopologyNode[]>(["/api/topology/nodes"], (old = []) => 
          old.map(n => n.id === draggingNode ? { ...n, position: { x: newX, y: newY } } : n)
        );
      }
    }
  }, [draggingNode, nodes, dragOffset, zoom]);

  const updateNodeMutation = useMutation({
    mutationFn: async (data: { id: string; position: { x: number; y: number } }) => {
      return apiRequest("PATCH", `/api/topology/nodes/${data.id}`, {
        position: data.position,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/topology/nodes"] });
    },
  });

  const updateNodePropsMutation = useMutation({
    mutationFn: async (data: { id: string; properties: Record<string, any> }) => {
      return apiRequest("PATCH", `/api/topology/nodes/${data.id}`, {
        properties: data.properties,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/topology/nodes"] });
      setSshOpen(false);
    },
  });

  const handleMouseUp = useCallback(() => {
    if (draggingNode) {
      const node = nodes.find(n => n.id === draggingNode);
      if (node && typeof node.position === 'object' && 'x' in node.position) {
        updateNodeMutation.mutate({
          id: draggingNode,
          position: { x: node.position.x as number, y: node.position.y as number },
        });
      }
    }
    setDraggingNode(null);
  }, [draggingNode, nodes]);

  useEffect(() => {
    if (draggingNode) {
      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('mouseup', handleMouseUp);
      return () => {
        window.removeEventListener('mousemove', handleMouseMove);
        window.removeEventListener('mouseup', handleMouseUp);
      };
    }
  }, [draggingNode, handleMouseMove, handleMouseUp]);

  const getNodePosition = (nodeId: string) => {
    const node = nodes.find(n => n.id === nodeId);
    if (node && typeof node.position === 'object' && 'x' in node.position) {
      return { x: node.position.x as number, y: node.position.y as number };
    }
    return { x: 0, y: 0 };
  };

  return (
    <Card className="flex flex-col h-full" data-testid="topology-canvas">
      <div className="p-4 border-b border-border">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Network className="h-4 w-4 text-muted-foreground" />
            <h3 className="text-sm font-semibold">Network Topology</h3>
            <Badge variant="secondary" className="text-xs" data-testid="node-count">
              {nodes.length} {nodes.length === 1 ? 'node' : 'nodes'}
            </Badge>
          </div>
          <div className="flex items-center gap-2">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button size="sm" data-testid="button-add-node">
                  <Plus className="h-4 w-4" />
                  Add Node
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => addNode('router')} data-testid="menu-add-router">
                  <Router className="h-4 w-4 mr-2" />
                  Router
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => addNode('switch')} data-testid="menu-add-switch">
                  <Network className="h-4 w-4 mr-2" />
                  Switch
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => addNode('firewall')} data-testid="menu-add-firewall">
                  <Shield className="h-4 w-4 mr-2" />
                  Firewall
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => addNode('server')} data-testid="menu-add-server">
                  <Server className="h-4 w-4 mr-2" />
                  Server
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => addNode('client')} data-testid="menu-add-client">
                  <Laptop className="h-4 w-4 mr-2" />
                  Client
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
            <div className="flex items-center gap-1 border-l border-border pl-2 ml-1">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setZoom(Math.max(50, zoom - 10))}
                data-testid="button-zoom-out"
              >
                <ZoomOut className="h-4 w-4" />
              </Button>
              <span className="text-xs text-muted-foreground w-12 text-center" data-testid="zoom-level">{zoom}%</span>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setZoom(Math.min(200, zoom + 10))}
                data-testid="button-zoom-in"
              >
                <ZoomIn className="h-4 w-4" />
              </Button>
            </div>
            <Button variant="ghost" size="icon" data-testid="button-fit-view">
              <Maximize2 className="h-4 w-4" />
            </Button>
            <Button variant="ghost" size="icon" data-testid="button-export-topology">
              <Download className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>
      
      <div className="flex-1 relative bg-[linear-gradient(to_right,hsl(var(--border)/0.1)_1px,transparent_1px),linear-gradient(to_bottom,hsl(var(--border)/0.1)_1px,transparent_1px)] bg-[size:20px_20px]">
        <svg 
          className="absolute inset-0 w-full h-full pointer-events-none"
          style={{ transform: `scale(${zoom / 100})`, transformOrigin: 'top left' }}
        >
          {connections.map(conn => {
            const source = getNodePosition(conn.sourceId);
            const target = getNodePosition(conn.targetId);
            return (
              <g key={conn.id}>
                <line
                  x1={source.x + 40}
                  y1={source.y + 40}
                  x2={target.x + 40}
                  y2={target.y + 40}
                  stroke="hsl(var(--border))"
                  strokeWidth="2"
                  strokeDasharray="5,5"
                />
                {conn.protocol && (
                  <text
                    x={(source.x + target.x) / 2 + 40}
                    y={(source.y + target.y) / 2 + 30}
                    fill="hsl(var(--muted-foreground))"
                    fontSize="10"
                    textAnchor="middle"
                  >
                    {conn.protocol}
                  </text>
                )}
              </g>
            );
          })}
        </svg>
        
        <div 
          className="absolute inset-0 p-8"
          style={{ transform: `scale(${zoom / 100})`, transformOrigin: 'top left' }}
        >
          {nodes.map(node => {
            const Icon = nodeIcons[node.type];
            const isSelected = selectedNode === node.id;
            const pos = typeof node.position === 'object' && 'x' in node.position 
              ? { x: node.position.x as number, y: node.position.y as number }
              : { x: 0, y: 0 };
            
            return (
              <div
                key={node.id}
                className={`absolute cursor-move transition-all ${isSelected ? 'z-10' : ''}`}
                style={{ left: pos.x, top: pos.y }}
                onMouseDown={(e) => handleMouseDown(node.id, e)}
                onClick={() => setSelectedNode(node.id)}
                data-testid={`node-${node.id}`}
              >
                <Card className={`p-3 border-2 ${
                  isSelected 
                    ? 'border-primary shadow-lg shadow-primary/20' 
                    : nodeColors[node.type]
                } transition-all hover-elevate`}>
                  <div className="flex flex-col items-center gap-2 min-w-[80px]">
                    <Icon className="h-8 w-8" />
                    <span className="text-xs font-medium text-center flex items-center gap-1">
                      {node.label}
                      {node.type === 'router' && (
                        <span className={`inline-block h-2 w-2 rounded-full ${reachability.get(node.id)?.ok ? 'bg-green-500' : 'bg-red-500'}`} title={reachability.get(node.id)?.ok ? `SSH ${reachability.get(node.id)?.ms ?? ''}ms` : 'unreachable'} />
                      )}
                    </span>
                  </div>
                </Card>
              </div>
            );
          })}
        </div>

        {nodes.length === 0 && (
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="text-center">
              <Network className="h-16 w-16 text-muted-foreground mx-auto mb-4 opacity-20" />
              <h3 className="text-lg font-semibold mb-2">No topology defined</h3>
              <p className="text-sm text-muted-foreground mb-4">
                Add network nodes to visualize your infrastructure
              </p>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button data-testid="button-add-first-node">
                    <Plus className="h-4 w-4" />
                    Add First Node
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent>
                  <DropdownMenuItem onClick={() => addNode('router')} data-testid="menu-add-first-router">
                    <Router className="h-4 w-4 mr-2" />
                    Router
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => addNode('switch')} data-testid="menu-add-first-switch">
                    <Network className="h-4 w-4 mr-2" />
                    Switch
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => addNode('firewall')} data-testid="menu-add-first-firewall">
                    <Shield className="h-4 w-4 mr-2" />
                    Firewall
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        )}
      </div>

      {selectedNode && (
        <div className="p-4 border-t border-border bg-card/50">
          <div className="flex items-center justify-between">
            <div>
              <h4 className="text-sm font-semibold" data-testid="selected-node-label">
                {nodes.find(n => n.id === selectedNode)?.label}
              </h4>
              <p className="text-xs text-muted-foreground capitalize" data-testid="selected-node-type">
                {nodes.find(n => n.id === selectedNode)?.type}
              </p>
            </div>
            <div className="flex gap-2">
              <Button 
                variant="outline" 
                size="sm" 
                data-testid="button-configure-node"
                onClick={() => {
                  const node = nodes.find(n => n.id === selectedNode);
                  const ssh = (node?.properties as any)?.ssh || {};
                  setSshHost(ssh.host || "");
                  setSshPort(ssh.port || 22);
                  setSshUser(ssh.username || "");
                  setSshOpen(true);
                }}
              >
                Configure
              </Button>
              <Button 
                variant="outline" 
                size="sm" 
                onClick={() => deleteNodeMutation.mutate(selectedNode)}
                data-testid="button-delete-node"
              >
                Delete
              </Button>
            </div>
          </div>
        </div>
      )}
      <Dialog open={sshOpen} onOpenChange={setSshOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>SSH Settings</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-2">
            <div className="grid grid-cols-4 items-center gap-2">
              <Label className="text-right">Host</Label>
              <Input className="col-span-3" value={sshHost} onChange={(e) => setSshHost(e.target.value)} placeholder="192.168.0.200" />
            </div>
            <div className="grid grid-cols-4 items-center gap-2">
              <Label className="text-right">Port</Label>
              <Input className="col-span-3" type="number" value={sshPort} onChange={(e) => setSshPort(parseInt(e.target.value || "22", 10))} />
            </div>
            <div className="grid grid-cols-4 items-center gap-2">
              <Label className="text-right">Username</Label>
              <Input className="col-span-3" value={sshUser} onChange={(e) => setSshUser(e.target.value)} placeholder="vyos" />
            </div>
          </div>
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setSshOpen(false)}>Cancel</Button>
            <Button
              onClick={() => {
                if (!selectedNode) return;
                const node = nodes.find(n => n.id === selectedNode);
                const baseProps = (node?.properties as any) || {};
                updateNodePropsMutation.mutate({
                  id: selectedNode,
                  properties: { ...baseProps, ssh: { host: sshHost, port: sshPort, username: sshUser } },
                });
              }}
              disabled={!sshHost || !sshUser || !selectedNode}
            >
              Save
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </Card>
  );
}
