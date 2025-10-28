'use client';

import { useState, useTransition } from 'react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/common/card';
import { Button } from '@/components/common/button';
import { Badge } from '@/components/common/badge';
import { Switch } from '@/components/ui/switch';
import { Slider } from '@/components/ui/slider';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/common/dialog';
import { Flag, Loader2 } from 'lucide-react';
import { updateFeatureFlag } from '@/app/actions/config.action';
import { useToast } from '@/libs/hooks/use-toast';
import { FeatureFlag } from '@prisma/client';

interface FeatureFlagCardProps {
  flag: FeatureFlag;
}

export function FeatureFlagCard({ flag: initialFlag }: FeatureFlagCardProps) {
  const [showEdit, setShowEdit] = useState(false);
  const [enabled, setEnabled] = useState(initialFlag.enabled);
  const [percentage, setPercentage] = useState(initialFlag.percentage);
  const [isPending, startTransition] = useTransition();
  const toast = useToast();

  const handleSubmit = () => {
    startTransition(async () => {
      const result = await updateFeatureFlag(initialFlag.name, {
        enabled,
        percentage,
      });

      if (result.success) {
        toast.success('Feature flag updated successfully');
        setShowEdit(false);
      } else {
        toast.error(result?.error || 'Internal server error');
      }
    });
  };

  return (
    <>
      <Card className="transition-shadow hover:shadow-md">
        <CardHeader>
          <div className="flex items-start justify-between">
            <div className="space-y-1">
              <div className="flex items-center gap-3">
                <Flag
                  className={`h-5 w-5 ${initialFlag.enabled ? 'text-green-600' : 'text-muted-foreground'}`}
                />
                <CardTitle className="text-lg">{initialFlag.name}</CardTitle>
                <Badge variant={initialFlag.enabled ? 'default' : 'secondary'}>
                  {initialFlag.enabled ? 'Enabled' : 'Disabled'}
                </Badge>
              </div>
              {initialFlag.description && (
                <CardDescription>{initialFlag.description}</CardDescription>
              )}
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">
                  Rollout Percentage
                </span>
                <span className="font-medium">{initialFlag.percentage}%</span>
              </div>
              <div className="bg-muted h-2 w-full overflow-hidden rounded-full">
                <div
                  className="bg-primary h-full transition-all"
                  style={{ width: `${initialFlag.percentage}%` }}
                />
              </div>
            </div>

            <div className="flex items-center justify-between">
              <span className="text-muted-foreground text-xs">
                Updated {new Date(initialFlag.updatedAt).toLocaleString()}
              </span>
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setEnabled(initialFlag.enabled);
                  setPercentage(initialFlag.percentage);
                  setShowEdit(true);
                }}
              >
                Configure
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      <Dialog open={showEdit} onOpenChange={setShowEdit}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Configure Feature Flag</DialogTitle>
            <DialogDescription>
              <code className="text-sm">{initialFlag.name}</code>
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-6 py-4">
            {initialFlag.description && (
              <p className="text-muted-foreground text-sm">
                {initialFlag.description}
              </p>
            )}

            <div className="flex items-center justify-between">
              <Label htmlFor="enabled">Enable Feature</Label>
              <Switch
                id="enabled"
                checked={enabled}
                onCheckedChange={setEnabled}
              />
            </div>

            {enabled && (
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <Label>Rollout Percentage</Label>
                  <span className="text-sm font-medium">{percentage}%</span>
                </div>
                <Slider
                  value={[percentage]}
                  onValueChange={values => setPercentage(values[0])}
                  min={0}
                  max={100}
                  step={5}
                />
                <div className="text-muted-foreground flex justify-between text-xs">
                  <span>0%</span>
                  <span>50%</span>
                  <span>100%</span>
                </div>
              </div>
            )}
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowEdit(false)}
              disabled={isPending}
            >
              Cancel
            </Button>
            <Button onClick={handleSubmit} disabled={isPending}>
              {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Save Changes
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
