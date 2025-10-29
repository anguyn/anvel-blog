'use client';

import { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/common/dialog';
import { Badge } from '@/components/common/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Loader2 } from 'lucide-react';
import { getConfigHistory } from '@/app/actions/config.action';
import { ConfigHistory } from '@prisma/client';

interface ConfigHistoryDialogProps {
  configKey: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function ConfigHistoryDialog({
  configKey,
  open,
  onOpenChange,
}: ConfigHistoryDialogProps) {
  const [history, setHistory] = useState<ConfigHistory[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (open) {
      loadHistory();
    }
  }, [open, configKey]);

  const loadHistory = async () => {
    setLoading(true);
    const result = await getConfigHistory(configKey);
    if (result.success) {
      setHistory(result.data || []);
    }
    setLoading(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[700px]">
        <DialogHeader>
          <DialogTitle>Configuration History</DialogTitle>
          <DialogDescription>
            <code className="text-sm">{configKey}</code>
          </DialogDescription>
        </DialogHeader>

        <ScrollArea className="h-[400px] pr-4">
          {loading ? (
            <div className="flex h-40 items-center justify-center">
              <Loader2 className="text-muted-foreground h-8 w-8 animate-spin" />
            </div>
          ) : history.length === 0 ? (
            <div className="text-muted-foreground py-12 text-center">
              <p className="leading-normal">No history available</p>
            </div>
          ) : (
            <div className="space-y-4">
              {history.map((item, index) => (
                <div
                  key={item.id}
                  className="border-muted relative border-l-2 pb-4 pl-6 last:border-0"
                >
                  <div className="bg-primary border-background absolute top-0 -left-2 h-4 w-4 rounded-full border-4" />
                  <div className="bg-muted/50 space-y-2 rounded-lg p-4">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium">
                        {item.changedBy || 'System'}
                      </span>
                      <span className="text-muted-foreground text-xs">
                        {new Date(item.createdAt).toLocaleString()}
                      </span>
                    </div>

                    {item.reason && (
                      <p className="text-muted-foreground text-sm">
                        {item.reason}
                      </p>
                    )}

                    <div className="flex items-center gap-4 text-sm">
                      <div className="flex items-center gap-2">
                        <span className="text-muted-foreground">From:</span>
                        <Badge variant="destructive" className="font-mono">
                          {item.oldValue || 'null'}
                        </Badge>
                      </div>
                      <span className="text-muted-foreground">→</span>
                      <div className="flex items-center gap-2">
                        <span className="text-muted-foreground">To:</span>
                        <Badge
                          variant="default"
                          className="bg-green-600 font-mono"
                        >
                          {item.newValue}
                        </Badge>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}
