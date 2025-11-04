'use client';

import { useRef, useState, useEffect } from 'react';
import {
  X,
  Pencil,
  Eraser,
  Trash2,
  Download,
  Undo,
  Redo,
  Circle,
} from 'lucide-react';
import { cn } from '@/libs/utils';

interface DrawToolProps {
  onInsert: (dataUrl: string) => void;
  onClose: () => void;
}

export default function DrawTool({ onInsert, onClose }: DrawToolProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const cursorRef = useRef<HTMLDivElement>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [tool, setTool] = useState<'pen' | 'eraser'>('pen');
  const [color, setColor] = useState('#000000');
  const [lineWidth, setLineWidth] = useState(2);
  const [history, setHistory] = useState<ImageData[]>([]);
  const [historyStep, setHistoryStep] = useState(-1);
  const [showCursor, setShowCursor] = useState(false);

  // Effect để điều khiển cursor custom
  useEffect(() => {
    const canvas = canvasRef.current;
    const cursor = cursorRef.current;
    if (!canvas || !cursor) return;

    const updateCursorPosition = (e: MouseEvent) => {
      const rect = canvas.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;

      cursor.style.left = `${x}px`;
      cursor.style.top = `${y}px`;
    };

    canvas.addEventListener('mousemove', updateCursorPosition);
    canvas.addEventListener('mouseenter', () => setShowCursor(true));
    canvas.addEventListener('mouseleave', () => setShowCursor(false));

    return () => {
      canvas.removeEventListener('mousemove', updateCursorPosition);
      canvas.removeEventListener('mouseenter', () => setShowCursor(true));
      canvas.removeEventListener('mouseleave', () => setShowCursor(false));
    };
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Set canvas size
    canvas.width = 800;
    canvas.height = 600;

    // Fill white background
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Save initial state
    saveState();
  }, []);

  const saveState = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    const newHistory = history.slice(0, historyStep + 1);
    newHistory.push(imageData);
    setHistory(newHistory);
    setHistoryStep(newHistory.length - 1);
  };

  const undo = () => {
    if (historyStep <= 0) return;

    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const newStep = historyStep - 1;
    ctx.putImageData(history[newStep], 0, 0);
    setHistoryStep(newStep);
  };

  const redo = () => {
    if (historyStep >= history.length - 1) return;

    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const newStep = historyStep + 1;
    ctx.putImageData(history[newStep], 0, 0);
    setHistoryStep(newStep);
  };

  const startDrawing = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    setIsDrawing(true);
    ctx.beginPath();
    ctx.moveTo(x, y);

    if (tool === 'eraser') {
      ctx.globalCompositeOperation = 'destination-out';
      ctx.lineWidth = lineWidth * 3;
    } else {
      ctx.globalCompositeOperation = 'source-over';
      ctx.strokeStyle = color;
      ctx.lineWidth = lineWidth;
    }

    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
  };

  const draw = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isDrawing) return;

    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    ctx.lineTo(x, y);
    ctx.stroke();
  };

  const stopDrawing = () => {
    if (isDrawing) {
      setIsDrawing(false);
      saveState();
    }
  };

  const clearCanvas = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    saveState();
  };

  const handleInsert = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const dataUrl = canvas.toDataURL('image/png');
    onInsert(dataUrl);
    onClose();
  };

  const downloadDrawing = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const dataUrl = canvas.toDataURL('image/png');
    const link = document.createElement('a');
    link.download = 'drawing.png';
    link.href = dataUrl;
    link.click();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="w-full max-w-4xl rounded-lg border border-[var(--color-border)] bg-[var(--color-background)] shadow-xl">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-[var(--color-border)] p-4">
          <h2 className="text-lg font-semibold">Drawing Tool</h2>
          <button
            onClick={onClose}
            className="rounded p-1 hover:cursor-pointer hover:bg-[var(--color-accent)]"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Toolbar */}
        <div className="flex flex-wrap items-center gap-2 border-b border-[var(--color-border)] bg-[var(--color-muted)] p-3">
          {/* Tools */}
          <button
            onClick={() => setTool('pen')}
            className={`flex items-center gap-2 rounded px-3 py-2 text-sm hover:cursor-pointer ${
              tool === 'pen'
                ? 'bg-[var(--color-primary)] text-white'
                : 'bg-[var(--color-secondary)] hover:bg-[var(--color-accent)]'
            }`}
          >
            <Pencil className="h-4 w-4" />
            Pen
          </button>
          <button
            onClick={() => setTool('eraser')}
            className={`flex items-center gap-2 rounded px-3 py-2 text-sm hover:cursor-pointer ${
              tool === 'eraser'
                ? 'bg-[var(--color-primary)] text-white'
                : 'bg-[var(--color-secondary)] hover:bg-[var(--color-accent)]'
            }`}
          >
            <Eraser className="h-4 w-4" />
            Eraser
          </button>

          <div className="h-8 w-px bg-[var(--color-border)]" />

          {/* Color Picker */}
          <div className="flex items-center gap-2">
            <label className="text-sm">Color:</label>
            <input
              type="color"
              value={color}
              onChange={e => setColor(e.target.value)}
              className="h-8 w-16 cursor-pointer rounded border border-[var(--color-border)]"
            />
          </div>

          {/* Line Width */}
          <div className="flex items-center gap-2">
            <label className="text-sm">Size:</label>
            <input
              type="range"
              min="1"
              max="20"
              value={lineWidth}
              onChange={e => setLineWidth(Number(e.target.value))}
              className="w-24"
            />
            <span className="text-xs">{lineWidth}px</span>
          </div>

          <div className="h-8 w-px bg-[var(--color-border)]" />

          {/* History */}
          <button
            onClick={undo}
            disabled={historyStep <= 0}
            className="rounded p-2 hover:cursor-pointer hover:bg-[var(--color-accent)] disabled:opacity-50"
            title="Undo"
          >
            <Undo className="h-4 w-4" />
          </button>
          <button
            onClick={redo}
            disabled={historyStep >= history.length - 1}
            className="rounded p-2 hover:cursor-pointer hover:bg-[var(--color-accent)] disabled:opacity-50"
            title="Redo"
          >
            <Redo className="h-4 w-4" />
          </button>
          <button
            onClick={clearCanvas}
            className="rounded p-2 hover:cursor-pointer hover:bg-[var(--color-accent)]"
            title="Clear"
          >
            <Trash2 className="h-4 w-4" />
          </button>
        </div>

        <div className="flex justify-center bg-[var(--color-muted)] p-4">
          <div className="relative">
            <canvas
              ref={canvasRef}
              onMouseDown={startDrawing}
              onMouseMove={draw}
              onMouseUp={stopDrawing}
              onMouseLeave={stopDrawing}
              className="cursor-none rounded border border-[var(--color-border)] bg-white shadow-md"
              style={{
                width: '800px',
                height: '600px',
              }}
            />
            {/* Custom Cursor */}
            <div
              ref={cursorRef}
              className={`pointer-events-none absolute rounded-full ${
                !showCursor ? 'hidden' : ''
              } ${
                tool === 'eraser'
                  ? 'border border-red-500'
                  : tool === 'pen'
                    ? 'bg-white'
                    : 'bg-white'
              }`}
              style={{
                width:
                  tool === 'eraser' ? `${lineWidth * 3}px` : `${lineWidth}px`,
                height:
                  tool === 'eraser' ? `${lineWidth * 3}px` : `${lineWidth}px`,
                transform: 'translate(-50%, -50%)',
                backgroundColor: tool === 'pen' ? color : 'transparent',
                pointerEvents: 'none',
                zIndex: 10,
              }}
            >
              {tool === 'eraser' && (
                <>
                  <div className="absolute top-0 left-1/2 h-full w-[1px] -translate-x-1/2 bg-red-500" />
                  <div className="absolute top-1/2 left-0 h-[1px] w-full -translate-y-1/2 bg-red-500" />
                </>
              )}
            </div>
          </div>
        </div>

        <div className="flex items-center justify-end gap-2 border-t border-[var(--color-border)] p-4">
          <button
            onClick={downloadDrawing}
            className="flex items-center gap-2 rounded bg-[var(--color-secondary)] px-4 py-2 text-sm hover:cursor-pointer hover:bg-[var(--color-accent)]"
          >
            <Download className="h-4 w-4" />
            Download
          </button>
          <button
            onClick={handleInsert}
            className="rounded bg-[var(--color-primary)] px-4 py-2 text-sm text-white hover:cursor-pointer hover:opacity-90"
          >
            Insert into Editor
          </button>
        </div>
      </div>
    </div>
  );
}
