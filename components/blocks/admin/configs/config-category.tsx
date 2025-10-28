'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader } from '@/components/common/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/common/badge';
import {
  ChevronDown,
  ChevronRight,
  Settings,
  Shield,
  Mail,
  Wrench,
  Database,
} from 'lucide-react';
import { ConfigCard } from './config-card';
import { SystemConfig } from '@prisma/client';

interface ConfigCategoryProps {
  category: string;
  items: SystemConfig[];
}

const categoryIcons: Record<string, any> = {
  app: Settings,
  rate_limit: Shield,
  security: Shield,
  maintenance: Wrench,
  email: Mail,
  features: Database,
};

export function ConfigCategory({ category, items }: ConfigCategoryProps) {
  const [collapsed, setCollapsed] = useState(false);

  const Icon = categoryIcons[category] || Database;

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader className="px-0 pt-0 pb-3">
          <Button
            variant="ghost"
            className="h-auto w-full justify-start p-0 hover:bg-transparent"
            onClick={() => setCollapsed(!collapsed)}
          >
            <div className="flex w-full items-center justify-between">
              <div className="flex items-center gap-3">
                {collapsed ? (
                  <ChevronRight className="text-muted-foreground h-5 w-5" />
                ) : (
                  <ChevronDown className="text-muted-foreground h-5 w-5" />
                )}
                <Icon className="text-primary h-5 w-5" />
                <div className="text-left">
                  <h3 className="text-lg font-semibold capitalize">
                    {category.replace('_', ' ')}
                  </h3>
                  <p className="text-muted-foreground text-sm">
                    {items.length} configuration{items.length !== 1 ? 's' : ''}
                  </p>
                </div>
              </div>
              <Badge variant="secondary">{items.length}</Badge>
            </div>
          </Button>
        </CardHeader>

        {!collapsed && (
          <CardContent>
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {items.map(config => (
                <ConfigCard key={config.id} config={config} />
              ))}
            </div>
          </CardContent>
        )}
      </Card>
    </div>
  );
}
