'use client';

import { useState } from 'react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/common/card';
import { Button } from '@/components/common/button';
import { Badge } from '@/components/common/badge';
import { History, Edit } from 'lucide-react';
import { ConfigEditDialog } from './config-edit-dialog';
import { ConfigHistoryDialog } from './config-history-dialog';
import { SystemConfig } from '@prisma/client';

interface ConfigCardProps {
  config: SystemConfig;
}

export function ConfigCard({ config }: ConfigCardProps) {
  const [showEdit, setShowEdit] = useState(false);
  const [showHistory, setShowHistory] = useState(false);

  return (
    <>
      <Card className="transition-shadow hover:shadow-md">
        <CardHeader className="pb-3">
          <div className="flex items-start justify-between">
            <div className="space-y-1">
              <CardTitle className="font-mono text-base text-blue-600">
                {config.key}
              </CardTitle>
              {config.description && (
                <CardDescription>{config.description}</CardDescription>
              )}
            </div>
            <div className="flex items-center gap-2">
              {config.isPublic && (
                <Badge
                  variant="secondary"
                  className="border-green-200 bg-green-50 text-green-700"
                >
                  Public
                </Badge>
              )}
              <Badge variant="outline">{config.type}</Badge>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <p className="text-muted-foreground text-sm">Current Value</p>
              <p className="leading-normal font-medium">{config.value}</p>
              <p className="text-muted-foreground text-xs">
                Updated {new Date(config.updatedAt).toLocaleDateString()}
              </p>
            </div>
            <div className="flex gap-2">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setShowHistory(true)}
              >
                <History className="h-4 w-4" />
              </Button>
              <Button
                variant="default"
                size="sm"
                onClick={() => setShowEdit(true)}
              >
                <Edit className="mr-2 h-4 w-4" />
                Edit
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      <ConfigEditDialog
        config={config}
        open={showEdit}
        onOpenChange={setShowEdit}
      />

      <ConfigHistoryDialog
        configKey={config.key}
        open={showHistory}
        onOpenChange={setShowHistory}
      />
    </>
  );
}
