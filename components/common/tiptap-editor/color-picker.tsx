'use client';

import { useState, useEffect } from 'react';
import { Palette, X } from 'lucide-react';
import { DEFAULT_COLORS } from './editor-constants';
import { useColorStore } from '@/store/colors';

interface ColorPickerProps {
  currentColor: string;
  onColorChange: (color: string) => void;
  type: 'text' | 'highlight';
  onClose: () => void;
}

export default function ColorPicker({
  currentColor,
  onColorChange,
  type,
  onClose,
}: ColorPickerProps) {
  const [customColor, setCustomColor] = useState(currentColor);
  const [colorInput, setColorInput] = useState(currentColor);

  const {
    textColors,
    highlightColors,
    addTextColor,
    addHighlightColor,
    removeTextColor,
    removeHighlightColor,
  } = useColorStore();

  const savedColors = type === 'text' ? textColors : highlightColors;
  const addColor = type === 'text' ? addTextColor : addHighlightColor;
  const removeColor = type === 'text' ? removeTextColor : removeHighlightColor;

  const rgbToHex = (rgb: string): string => {
    if (rgb.startsWith('#')) return rgb;
    const rgbMatch = rgb.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)/);
    if (!rgbMatch) return '#000000';
    const [, r, g, b] = rgbMatch;
    return (
      '#' +
      [parseInt(r), parseInt(g), parseInt(b)]
        .map(x => x.toString(16).padStart(2, '0'))
        .join('')
        .toUpperCase()
    );
  };

  useEffect(() => {
    const hexColor = rgbToHex(currentColor);
    setCustomColor(hexColor);
    setColorInput(hexColor);
  }, [currentColor]);

  const handleColorSelect = (color: string) => {
    onColorChange(color);
    setCustomColor(color);
    setColorInput(color);
  };

  const handleCustomColorChange = (color: string) => {
    setCustomColor(color);
    setColorInput(color);
  };

  const handleApplyCustomColor = () => {
    const hexRegex = /^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/;
    if (hexRegex.test(colorInput)) {
      onColorChange(colorInput);
      setCustomColor(colorInput);
    }
  };

  const handleSaveColor = (e: React.MouseEvent<HTMLButtonElement>) => {
    e.preventDefault();
    addColor(customColor);
  };

  const handleRemoveSavedColor = (color: string) => {
    removeColor(color);
  };

  return (
    <div className="w-80 rounded-lg border border-[var(--color-border)] bg-[var(--color-background)] p-4 shadow-lg">
      <div className="mb-3 flex items-center justify-between">
        <h3 className="text-sm font-semibold text-[var(--color-foreground)]">
          {type === 'text' ? 'Text Color' : 'Highlight Color'}
        </h3>
        <button
          onClick={e => {
            e.preventDefault();
            onClose();
          }}
          className="rounded p-1 hover:bg-[var(--color-accent)]"
        >
          <X className="h-4 w-4" />
        </button>
      </div>

      <div className="mb-4">
        <p className="mb-2 text-xs font-medium text-[var(--color-muted-foreground)]">
          Default Colors
        </p>
        <div className="grid grid-cols-5 gap-2">
          {DEFAULT_COLORS.map(({ name, value }) => (
            <button
              key={value}
              onClick={e => {
                e.preventDefault();
                handleColorSelect(value);
              }}
              className={`h-8 w-8 rounded border-2 transition-all hover:scale-110 ${
                customColor === value
                  ? 'border-[var(--color-primary)] ring-2 ring-[var(--color-primary)] ring-offset-2'
                  : 'border-[var(--color-border)]'
              }`}
              style={{ backgroundColor: value }}
              title={name}
            />
          ))}
        </div>
      </div>

      <div className="mb-4">
        <p className="mb-2 text-xs font-medium text-[var(--color-muted-foreground)]">
          Custom Color
        </p>
        <div className="flex gap-2">
          <input
            type="text"
            value={colorInput}
            onChange={e => setColorInput(e.target.value)}
            onBlur={handleApplyCustomColor}
            onKeyDown={e => {
              if (e.key === 'Enter') {
                handleApplyCustomColor();
              }
            }}
            placeholder="#000000"
            className="flex-1 rounded border border-[var(--color-border)] bg-[var(--color-background)] px-3 py-2 text-sm text-[var(--color-foreground)]"
          />
          <input
            type="color"
            value={customColor}
            onChange={e => handleCustomColorChange(e.target.value)}
            onBlur={() => onColorChange(customColor)}
            className="h-10 w-10 cursor-pointer rounded border border-[var(--color-border)]"
          />
        </div>
      </div>

      {savedColors.length > 0 && (
        <div className="mb-4">
          <p className="mb-2 text-xs font-medium text-[var(--color-muted-foreground)]">
            Saved Colors
          </p>
          <div className="grid grid-cols-6 gap-2">
            {savedColors.map(color => (
              <div key={color} className="group relative">
                <button
                  onClick={e => {
                    e.preventDefault();
                    handleColorSelect(color);
                  }}
                  className={`h-8 w-8 rounded border-2 transition-all hover:scale-110 ${
                    customColor === color
                      ? 'border-[var(--color-primary)] ring-2 ring-[var(--color-primary)] ring-offset-2'
                      : 'border-[var(--color-border)]'
                  }`}
                  style={{ backgroundColor: color }}
                />
                <button
                  onClick={e => {
                    e.preventDefault();
                    handleRemoveSavedColor(color);
                  }}
                  className="absolute -top-1 -right-1 hidden rounded-full bg-red-500 p-0.5 text-white group-hover:block"
                >
                  <X className="h-3 w-3" />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="flex gap-2">
        <button
          onClick={handleSaveColor}
          className="flex flex-1 items-center justify-center gap-1 rounded bg-[var(--color-secondary)] px-3 py-2 text-sm hover:bg-[var(--color-accent)]"
        >
          <Palette className="h-4 w-4" />
          Save Color
        </button>
        <button
          onClick={e => {
            e.preventDefault();
            handleColorSelect('transparent');
          }}
          className="rounded border border-[var(--color-border)] px-3 py-2 text-sm hover:bg-[var(--color-accent)]"
        >
          Clear
        </button>
      </div>
    </div>
  );
}
