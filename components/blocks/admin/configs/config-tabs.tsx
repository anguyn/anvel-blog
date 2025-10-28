'use client';

import { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/common/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Search, Settings, Flag, Database } from 'lucide-react';
import { ConfigCard } from './config-card';
import { FeatureFlagCard } from './feature-flag-card';
import { MetadataCard } from './metadata-card';
import { ConfigCategory } from './config-category';
import {
  SystemConfig,
  FeatureFlag as PrismaFeatureFlag,
  AppMetadata,
} from '@prisma/client';

interface ConfigTabsProps {
  configs: Record<string, SystemConfig[]>;
  features: PrismaFeatureFlag[];
  metadata: AppMetadata[];
}

export function ConfigTabs({ configs, features, metadata }: ConfigTabsProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');

  const categories = Object.keys(configs);

  const filteredConfigs = () => {
    let filtered = configs;

    if (selectedCategory !== 'all') {
      filtered = { [selectedCategory]: configs[selectedCategory] || [] };
    }

    if (searchTerm) {
      const result: Record<string, SystemConfig[]> = {};
      Object.entries(filtered).forEach(([cat, items]) => {
        const matched = items.filter(
          c =>
            c.key.toLowerCase().includes(searchTerm.toLowerCase()) ||
            c.description?.toLowerCase().includes(searchTerm.toLowerCase()),
        );
        if (matched.length > 0) {
          result[cat] = matched;
        }
      });
      return result;
    }

    return filtered;
  };

  return (
    <Tabs defaultValue="configs" className="space-y-6">
      <TabsList className="grid w-full max-w-md grid-cols-3">
        <TabsTrigger
          value="configs"
          className="flex items-center gap-2 hover:cursor-pointer"
        >
          <Settings className="h-4 w-4" />
          System Configs
        </TabsTrigger>
        <TabsTrigger
          value="features"
          className="flex items-center gap-2 hover:cursor-pointer"
        >
          <Flag className="h-4 w-4" />
          Feature Flags
        </TabsTrigger>
        <TabsTrigger
          value="metadata"
          className="flex items-center gap-2 hover:cursor-pointer"
        >
          <Database className="h-4 w-4" />
          App Metadata
        </TabsTrigger>
      </TabsList>

      <TabsContent value="configs" className="space-y-6">
        {/* Search and Filter */}
        <div className="flex gap-4">
          <div className="relative flex-1">
            <Search className="text-muted-foreground absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2" />
            <Input
              placeholder="Search configurations..."
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
          <Select value={selectedCategory} onValueChange={setSelectedCategory}>
            <SelectTrigger className="w-[200px]">
              <SelectValue placeholder="Select category" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Categories</SelectItem>
              {categories.map(cat => (
                <SelectItem key={cat} value={cat}>
                  {cat}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Configs by Category */}
        <div className="space-y-6">
          {Object.entries(filteredConfigs()).map(([category, items]) => (
            <ConfigCategory key={category} category={category} items={items} />
          ))}
        </div>
      </TabsContent>

      <TabsContent value="features" className="space-y-4">
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {features.map(flag => (
            <FeatureFlagCard key={flag.id} flag={flag} />
          ))}
        </div>
      </TabsContent>

      <TabsContent value="metadata" className="space-y-4">
        <div className="grid gap-4 md:grid-cols-2">
          {metadata.map(meta => (
            <MetadataCard key={meta.id} metadata={meta} />
          ))}
        </div>
      </TabsContent>
    </Tabs>
  );
}
