import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { History, CheckCircle2, XCircle, Clock, FileCode } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { useQuery } from "@tanstack/react-query";
import type { IntentHistory } from "@shared/schema";

export default function HistoryPage() {
  const { data: history = [], isLoading } = useQuery<IntentHistory[]>({
    queryKey: ["/api/history"],
  });

  if (isLoading) {
    return (
      <div className="h-full p-6 flex items-center justify-center">
        <p className="text-muted-foreground">Loading history...</p>
      </div>
    );
  }

  return (
    <div className="h-full p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-semibold mb-2">Intent History</h1>
        <p className="text-sm text-muted-foreground">
          View and replay previously generated configurations
        </p>
      </div>

      {history.length === 0 ? (
        <div className="flex flex-col items-center justify-center h-[400px] text-center">
          <History className="h-16 w-16 text-muted-foreground mb-4 opacity-20" />
          <h3 className="text-lg font-semibold mb-2">No history yet</h3>
          <p className="text-sm text-muted-foreground">
            Your AI-generated configurations will appear here
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {history.map((item) => (
            <Card key={item.id} className="p-6" data-testid={`history-item-${item.id}`}>
              <div className="space-y-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1">
                    <p className="font-medium text-sm mb-2">{item.intent}</p>
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <Clock className="h-3 w-3" />
                      <span>{formatDistanceToNow(new Date(item.createdAt), { addSuffix: true })}</span>
                    </div>
                  </div>
                  <Badge variant={item.applied === 'true' ? "secondary" : "outline"} className={`gap-1 ${
                    item.applied === 'true'
                      ? 'bg-success/10 text-success border-success/20' 
                      : 'bg-muted/50 text-muted-foreground border-border'
                  }`}>
                    {item.applied === 'true' ? (
                      <>
                        <CheckCircle2 className="h-3 w-3" />
                        Applied
                      </>
                    ) : (
                      <>
                        <XCircle className="h-3 w-3" />
                        Not Applied
                      </>
                    )}
                  </Badge>
                </div>

                <div className="rounded-md bg-muted/50 p-3">
                  <div className="flex items-center gap-2 mb-2">
                    <FileCode className="h-3 w-3 text-muted-foreground" />
                    <span className="text-xs font-medium text-muted-foreground">Generated Configuration</span>
                  </div>
                  <ScrollArea className="max-h-[120px]">
                    <pre className="text-xs font-mono leading-relaxed text-foreground">
                      {item.generatedConfig}
                    </pre>
                  </ScrollArea>
                </div>

                <div className="flex gap-2">
                  <Button variant="outline" size="sm" className="flex-1" data-testid={`button-view-${item.id}`}>
                    View Details
                  </Button>
                  <Button variant="outline" size="sm" className="flex-1" data-testid={`button-reuse-${item.id}`}>
                    Reuse Config
                  </Button>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
