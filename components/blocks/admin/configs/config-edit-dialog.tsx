'use client';

import { useState, useTransition } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/common/dialog';
import { Button } from '@/components/common/button';
import { Input } from '@/components/common/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/common/textarea';
import { Switch } from '@/components/ui/switch';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertCircle, Loader2 } from 'lucide-react';
import { updateConfig } from '@/app/actions/config.action';
import { useToast } from '@/libs/hooks/use-toast';
import { SystemConfig } from '@prisma/client';
import { Badge } from '@/components/common/badge';

interface ConfigEditDialogProps {
  config: SystemConfig;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function ConfigEditDialog({
  config,
  open,
  onOpenChange,
}: ConfigEditDialogProps) {
  const [value, setValue] = useState(config.value);
  const [reason, setReason] = useState('');
  const [isPending, startTransition] = useTransition();
  const toast = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!reason.trim()) {
      toast.error('Please provide a reason for this change');
      return;
    }

    startTransition(async () => {
      const result = await updateConfig(config.key, value, reason);

      if (result.success) {
        toast.success(result?.message || 'Succesfully!');
        onOpenChange(false);
        setReason('');
      } else {
        toast.error(result?.error || 'Internal error');
      }
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[525px]">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>Edit Configuration</DialogTitle>
            <DialogDescription>
              Make changes to system configuration. All changes are logged.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Key</Label>
              <code className="bg-muted block w-full rounded-md px-3 py-2 text-sm">
                {config.key}
              </code>
            </div>

            <div className="space-y-2">
              <Label>Type</Label>
              <Badge variant="secondary">{config.type}</Badge>
            </div>

            <div className="space-y-2">
              <Label htmlFor="value">Value</Label>
              {config.type === 'BOOLEAN' ? (
                <div className="flex items-center space-x-2">
                  <Switch
                    id="value"
                    checked={value === 'true'}
                    onCheckedChange={checked =>
                      setValue(checked ? 'true' : 'false')
                    }
                  />
                  <Label htmlFor="value">
                    {value === 'true' ? 'Enabled' : 'Disabled'}
                  </Label>
                </div>
              ) : config.type === 'NUMBER' ? (
                <Input
                  id="value"
                  type="number"
                  value={value}
                  onChange={e => setValue(e.target.value)}
                  required
                />
              ) : (
                <Input
                  id="value"
                  type="text"
                  value={value}
                  onChange={e => setValue(e.target.value)}
                  required
                />
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="reason">Reason for change *</Label>
              <Textarea
                id="reason"
                placeholder="Explain why you're making this change..."
                value={reason}
                onChange={e => setReason(e.target.value)}
                rows={3}
                required
              />
            </div>

            {config.description && (
              <Alert>
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{config.description}</AlertDescription>
              </Alert>
            )}
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isPending}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isPending}>
              {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Save Changes
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
