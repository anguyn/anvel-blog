'use client';

import { useState } from 'react';
import { Card, CardContent } from '@/components/common/card';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { motion } from 'framer-motion';
import {
  Sun,
  Moon,
  Monitor,
  Palette,
  Type,
  Code2,
  Maximize2,
  Zap,
  Hash,
} from 'lucide-react';
import { useTheme } from 'next-themes';

interface AppearanceSettingsFormProps {
  user: any;
  translations: any;
}

const COLOR_SCHEMES = [
  { value: 'default', label: 'Default', color: 'bg-blue-500' },
  { value: 'purple', label: 'Purple', color: 'bg-purple-500' },
  { value: 'green', label: 'Green', color: 'bg-green-500' },
  { value: 'orange', label: 'Orange', color: 'bg-orange-500' },
  { value: 'pink', label: 'Pink', color: 'bg-pink-500' },
];

const CODE_THEMES = [
  { value: 'github-dark', label: 'GitHub Dark' },
  { value: 'github-light', label: 'GitHub Light' },
  { value: 'monokai', label: 'Monokai' },
  { value: 'dracula', label: 'Dracula' },
  { value: 'nord', label: 'Nord' },
  { value: 'tokyo-night', label: 'Tokyo Night' },
];

const FONT_FAMILIES = [
  { value: 'inter', label: 'Inter (Default)' },
  { value: 'system', label: 'System UI' },
  { value: 'roboto', label: 'Roboto' },
  { value: 'open-sans', label: 'Open Sans' },
];

export function AppearanceSettingsForm({
  user,
  translations,
}: AppearanceSettingsFormProps) {
  const { theme, setTheme } = useTheme();

  const [colorScheme, setColorScheme] = useState('default');
  const [fontSize, setFontSize] = useState('medium');
  const [codeTheme, setCodeTheme] = useState('github-dark');
  const [fontFamily, setFontFamily] = useState('inter');
  const [compactMode, setCompactMode] = useState(false);
  const [reduceAnimations, setReduceAnimations] = useState(false);
  const [showLineNumbers, setShowLineNumbers] = useState(true);

  const handleToggle = async (key: string, value: boolean) => {
    // TODO: Implement API call
    // await fetch('/api/user/preferences', {
    //   method: 'PATCH',
    //   body: JSON.stringify({ [key]: value })
    // });
    console.log(`Updated ${key} to ${value}`);
  };

  const handleSelectChange = async (key: string, value: string) => {
    // TODO: Implement API call
    console.log(`Updated ${key} to ${value}`);
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardContent className="p-6 pt-6">
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
          >
            <div className="mb-4 flex items-center gap-3">
              <div className="rounded-lg bg-[var(--color-secondary)] p-2">
                <Sun className="h-5 w-5" />
              </div>
              <div className="space-y-2">
                <h3 className="font-semibold">{translations.theme}</h3>
                <p className="text-sm text-[var(--color-muted-foreground)]">
                  {translations.themeDescription}
                </p>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-3">
              <button
                onClick={() => setTheme('light')}
                className={`rounded-lg border-2 p-4 transition-all ${
                  theme === 'light'
                    ? 'border-[var(--color-primary)] bg-[var(--color-primary)]/5'
                    : 'border-[var(--color-border)] hover:border-[var(--color-primary)]/50'
                }`}
              >
                <Sun className="mx-auto mb-2 h-6 w-6" />
                <p className="text-sm font-medium">{translations.light}</p>
              </button>

              <button
                onClick={() => setTheme('dark')}
                className={`rounded-lg border-2 p-4 transition-all ${
                  theme === 'dark'
                    ? 'border-[var(--color-primary)] bg-[var(--color-primary)]/5'
                    : 'border-[var(--color-border)] hover:border-[var(--color-primary)]/50'
                }`}
              >
                <Moon className="mx-auto mb-2 h-6 w-6" />
                <p className="text-sm font-medium">{translations.dark}</p>
              </button>

              <button
                onClick={() => setTheme('system')}
                className={`rounded-lg border-2 p-4 transition-all ${
                  theme === 'system'
                    ? 'border-[var(--color-primary)] bg-[var(--color-primary)]/5'
                    : 'border-[var(--color-border)] hover:border-[var(--color-primary)]/50'
                }`}
              >
                <Monitor className="mx-auto mb-2 h-6 w-6" />
                <p className="text-sm font-medium">{translations.system}</p>
              </button>
            </div>
          </motion.div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-6 pt-6">
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: 0.1 }}
          >
            <div className="mb-4 flex items-center gap-3">
              <div className="rounded-lg bg-[var(--color-secondary)] p-2">
                <Palette className="h-5 w-5" />
              </div>
              <div className="space-y-2">
                <h3 className="font-semibold">{translations.colorScheme}</h3>
                <p className="text-sm text-[var(--color-muted-foreground)]">
                  {translations.colorSchemeDescription}
                </p>
              </div>
            </div>

            <div className="grid grid-cols-5 gap-3">
              {COLOR_SCHEMES.map(scheme => (
                <button
                  key={scheme.value}
                  onClick={() => {
                    setColorScheme(scheme.value);
                    handleSelectChange('colorScheme', scheme.value);
                  }}
                  className={`rounded-lg border-2 p-3 transition-all ${
                    colorScheme === scheme.value
                      ? 'border-[var(--color-primary)] ring-2 ring-[var(--color-primary)]/20'
                      : 'border-[var(--color-border)] hover:border-[var(--color-primary)]/50'
                  }`}
                >
                  <div
                    className={`h-8 w-8 rounded-full ${scheme.color} mx-auto mb-2`}
                  />
                  <p className="text-xs font-medium">{scheme.label}</p>
                </button>
              ))}
            </div>
          </motion.div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-6 pt-6">
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: 0.2 }}
          >
            <div className="mb-4 flex items-center gap-3">
              <div className="rounded-lg bg-[var(--color-secondary)] p-2">
                <Type className="h-5 w-5" />
              </div>
              <div className="space-y-2">
                <h3 className="font-semibold">{translations.fontSize}</h3>
                <p className="text-sm text-[var(--color-muted-foreground)]">
                  {translations.fontSizeDescription}
                </p>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-3">
              <button
                onClick={() => {
                  setFontSize('small');
                  handleSelectChange('fontSize', 'small');
                }}
                className={`rounded-lg border-2 p-4 transition-all ${
                  fontSize === 'small'
                    ? 'border-[var(--color-primary)] bg-[var(--color-primary)]/5'
                    : 'border-[var(--color-border)] hover:border-[var(--color-primary)]/50'
                }`}
              >
                <p className="mb-1 text-sm font-medium">{translations.small}</p>
                <p className="text-xs text-[var(--color-muted-foreground)]">
                  Aa
                </p>
              </button>

              <button
                onClick={() => {
                  setFontSize('medium');
                  handleSelectChange('fontSize', 'medium');
                }}
                className={`rounded-lg border-2 p-4 transition-all ${
                  fontSize === 'medium'
                    ? 'border-[var(--color-primary)] bg-[var(--color-primary)]/5'
                    : 'border-[var(--color-border)] hover:border-[var(--color-primary)]/50'
                }`}
              >
                <p className="mb-1 text-sm font-medium">
                  {translations.medium}
                </p>
                <p className="text-base text-[var(--color-muted-foreground)]">
                  Aa
                </p>
              </button>

              <button
                onClick={() => {
                  setFontSize('large');
                  handleSelectChange('fontSize', 'large');
                }}
                className={`rounded-lg border-2 p-4 transition-all ${
                  fontSize === 'large'
                    ? 'border-[var(--color-primary)] bg-[var(--color-primary)]/5'
                    : 'border-[var(--color-border)] hover:border-[var(--color-primary)]/50'
                }`}
              >
                <p className="mb-1 text-sm font-medium">{translations.large}</p>
                <p className="text-lg text-[var(--color-muted-foreground)]">
                  Aa
                </p>
              </button>
            </div>
          </motion.div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-6 pt-6">
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: 0.3 }}
          >
            <div className="mb-4 flex items-center gap-3">
              <div className="rounded-lg bg-[var(--color-secondary)] p-2">
                <Code2 className="h-5 w-5" />
              </div>
              <div className="space-y-2">
                <h3 className="font-semibold">{translations.codeTheme}</h3>
                <p className="text-sm text-[var(--color-muted-foreground)]">
                  {translations.codeThemeDescription}
                </p>
              </div>
            </div>

            <Select
              value={codeTheme}
              onValueChange={value => {
                setCodeTheme(value);
                handleSelectChange('codeTheme', value);
              }}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {CODE_THEMES.map(theme => (
                  <SelectItem key={theme.value} value={theme.value}>
                    {theme.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </motion.div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-6 pt-6">
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: 0.4 }}
          >
            <div className="mb-4 flex items-center gap-3">
              <div className="rounded-lg bg-[var(--color-secondary)] p-2">
                <Type className="h-5 w-5" />
              </div>
              <div className="space-y-2">
                <h3 className="font-semibold">{translations.fontFamily}</h3>
                <p className="text-sm text-[var(--color-muted-foreground)]">
                  {translations.fontFamilyDescription}
                </p>
              </div>
            </div>

            <Select
              value={fontFamily}
              onValueChange={value => {
                setFontFamily(value);
                handleSelectChange('fontFamily', value);
              }}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {FONT_FAMILIES.map(font => (
                  <SelectItem key={font.value} value={font.value}>
                    {font.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </motion.div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-6 pt-6">
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: 0.5 }}
          >
            <div className="mb-6 flex items-center gap-3">
              <div className="rounded-lg bg-[var(--color-secondary)] p-2">
                <Maximize2 className="h-5 w-5" />
              </div>
              <div className="space-y-2">
                <h3 className="font-semibold">Display Options</h3>
                <p className="text-sm text-[var(--color-muted-foreground)]">
                  Customize how content is displayed
                </p>
              </div>
            </div>

            <div className="space-y-4">
              <div className="flex items-center justify-between border-b border-[var(--color-border)] py-3">
                <div className="flex items-center gap-3">
                  <Maximize2 className="h-4 w-4 text-[var(--color-muted-foreground)]" />
                  <div className="space-y-1">
                    <Label className="font-medium">
                      {translations.compactMode}
                    </Label>
                    <p className="text-xs text-[var(--color-muted-foreground)]">
                      {translations.compactModeDescription}
                    </p>
                  </div>
                </div>
                <Switch
                  checked={compactMode}
                  onCheckedChange={checked => {
                    setCompactMode(checked);
                    handleToggle('compactMode', checked);
                  }}
                />
              </div>

              <div className="flex items-center justify-between border-b border-[var(--color-border)] py-3">
                <div className="flex items-center gap-3">
                  <Zap className="h-4 w-4 text-[var(--color-muted-foreground)]" />
                  <div className="space-y-1">
                    <Label className="font-medium">
                      {translations.reduceAnimations}
                    </Label>
                    <p className="text-xs text-[var(--color-muted-foreground)]">
                      {translations.reduceAnimationsDescription}
                    </p>
                  </div>
                </div>
                <Switch
                  checked={reduceAnimations}
                  onCheckedChange={checked => {
                    setReduceAnimations(checked);
                    handleToggle('reduceAnimations', checked);
                  }}
                />
              </div>

              <div className="flex items-center justify-between py-3">
                <div className="flex items-center gap-3">
                  <Hash className="h-4 w-4 text-[var(--color-muted-foreground)]" />
                  <div className="space-y-1">
                    <Label className="font-medium">
                      {translations.showLineNumbers}
                    </Label>
                    <p className="text-xs text-[var(--color-muted-foreground)]">
                      {translations.showLineNumbersDescription}
                    </p>
                  </div>
                </div>
                <Switch
                  checked={showLineNumbers}
                  onCheckedChange={checked => {
                    setShowLineNumbers(checked);
                    handleToggle('showLineNumbers', checked);
                  }}
                />
              </div>
            </div>
          </motion.div>
        </CardContent>
      </Card>
    </div>
  );
}
