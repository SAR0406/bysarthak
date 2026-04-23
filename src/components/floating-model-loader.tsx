'use client';

import { type PointerEvent as ReactPointerEvent, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { GripHorizontal, Minimize2, MoveDiagonal2, Sparkles } from 'lucide-react';
import { ModelViewport } from './model-viewport';

const MIN_SIZE = 240;
const MAX_SIZE = 560;

export function FloatingModelLoader() {
  const [isOpen, setIsOpen] = useState(true);
  const [size, setSize] = useState(320);
  const [inputValue, setInputValue] = useState('');
  const [modelUrl, setModelUrl] = useState('');
  const [position, setPosition] = useState({ x: 20, y: 120 });
  const [isDragging, setIsDragging] = useState(false);
  const dragOffsetRef = useRef({ x: 0, y: 0 });

  const panelHeight = useMemo(() => Math.round(size * 0.78), [size]);

  const clampPosition = useCallback(
    (x: number, y: number) => {
      const maxX = Math.max(8, window.innerWidth - size - 8);
      const maxY = Math.max(8, window.innerHeight - panelHeight - 8);
      return {
        x: Math.min(Math.max(8, x), maxX),
        y: Math.min(Math.max(8, y), maxY),
      };
    },
    [panelHeight, size]
  );

  const handlePointerMove = useCallback(
    (e: PointerEvent) => {
      if (!isDragging) return;
      const next = clampPosition(e.clientX - dragOffsetRef.current.x, e.clientY - dragOffsetRef.current.y);
      setPosition(next);
    },
    [clampPosition, isDragging]
  );

  const stopDragging = useCallback(() => setIsDragging(false), []);

  useEffect(() => {
    window.addEventListener('pointermove', handlePointerMove);
    window.addEventListener('pointerup', stopDragging);
    return () => {
      window.removeEventListener('pointermove', handlePointerMove);
      window.removeEventListener('pointerup', stopDragging);
    };
  }, [handlePointerMove, stopDragging]);

  useEffect(() => {
    const onResize = () => {
      setPosition((prev) => clampPosition(prev.x, prev.y));
    };
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, [clampPosition]);

  const startDragging = (e: ReactPointerEvent<HTMLDivElement>) => {
    setIsDragging(true);
    dragOffsetRef.current = {
      x: e.clientX - position.x,
      y: e.clientY - position.y,
    };
  };

  const loadModel = () => {
    setModelUrl(inputValue.trim());
  };

  const clearModel = () => {
    setInputValue('');
    setModelUrl('');
  };

  if (!isOpen) {
    return (
      <button
        type="button"
        onClick={() => setIsOpen(true)}
        className="fixed left-4 bottom-5 z-[1200] rounded-full border border-white/20 bg-background/55 px-4 py-2 text-xs font-semibold uppercase tracking-[0.2em] text-white/90 backdrop-blur-xl"
      >
        <span className="inline-flex items-center gap-2">
          <Sparkles className="h-4 w-4" />
          3D Viewer
        </span>
      </button>
    );
  }

  return (
    <div
      className="fixed z-[1200] select-none rounded-2xl border border-white/15 bg-background/35 p-3 shadow-[0_16px_50px_rgba(0,0,0,0.4)] backdrop-blur-xl"
      style={{ width: size, height: panelHeight, transform: `translate3d(${position.x}px, ${position.y}px, 0)` }}
    >
      <div
        className="mb-3 flex cursor-grab items-center justify-between rounded-xl border border-white/10 bg-black/20 px-3 py-2 active:cursor-grabbing"
        onPointerDown={startDragging}
      >
        <div className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.24em] text-white/80">
          <GripHorizontal className="h-3.5 w-3.5" />
          AI 3D Loader
        </div>
        <button
          type="button"
          className="inline-flex h-7 w-7 items-center justify-center rounded-full bg-white/10 text-white/80 hover:bg-white/20"
          onClick={() => setIsOpen(false)}
          aria-label="Minimize floating 3D model loader"
        >
          <Minimize2 className="h-4 w-4" />
        </button>
      </div>

      <div className="mb-3 flex gap-2">
        <input
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          placeholder="Paste AI model URL (.glb / .gltf)"
          className="h-9 w-full rounded-lg border border-white/15 bg-white/10 px-3 text-xs text-white placeholder:text-white/45 outline-none focus:border-primary/60"
        />
        <button
          type="button"
          onClick={loadModel}
          className="h-9 shrink-0 rounded-lg bg-primary px-3 text-xs font-semibold text-primary-foreground"
        >
          Load
        </button>
        <button
          type="button"
          onClick={clearModel}
          className="h-9 shrink-0 rounded-lg border border-white/15 bg-white/5 px-3 text-xs font-semibold text-white/80"
        >
          Clear
        </button>
      </div>

      <div className="h-[calc(100%-116px)] min-h-[150px] rounded-2xl border border-white/10 bg-black/15">
        <ModelViewport modelUrl={modelUrl} className="bg-transparent" />
      </div>

      <div className="mt-3 flex items-center gap-2 text-[10px] uppercase tracking-[0.2em] text-white/70">
        <MoveDiagonal2 className="h-3.5 w-3.5" />
        <span>Size</span>
        <input
          type="range"
          min={MIN_SIZE}
          max={MAX_SIZE}
          value={size}
          onChange={(e) => {
            const nextSize = Number(e.target.value);
            setSize(nextSize);
            setPosition((prev) => clampPosition(prev.x, prev.y));
          }}
          className="h-1 w-full accent-primary"
          aria-label="Resize floating 3D model loader"
        />
      </div>
    </div>
  );
}
