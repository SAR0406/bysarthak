'use client';

import React, { useRef, useEffect, useCallback, ReactNode } from 'react';

interface ElectricBorderProps {
  children: ReactNode;
  color?: string;
  speed?: number;
  chaos?: number;
  thickness?: number;
  style?: React.CSSProperties;
  className?: string;
}

const ElectricBorder: React.FC<ElectricBorderProps> = ({
  children,
  color = '#00ffff',
  speed = 1,
  chaos = 0.5,
  thickness = 1,
  style = {},
  className = '',
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationFrameRef = useRef<number>();

  const draw = useCallback((ctx: CanvasRenderingContext2D, frameCount: number) => {
    const { width, height } = ctx.canvas;
    const chaosFactor = chaos * 10;
    const effectiveSpeed = speed * 0.1;

    ctx.clearRect(0, 0, width, height);
    ctx.lineWidth = thickness;
    ctx.strokeStyle = color;
    ctx.shadowColor = color;
    ctx.shadowBlur = 10;

    const points = [
      { x: 0, y: 0 },
      { x: width, y: 0 },
      { x: width, y: height },
      { x: 0, y: height },
    ];

    ctx.beginPath();
    ctx.moveTo(points[3].x, points[3].y);

    for (let i = 0; i < points.length; i++) {
      const p1 = points[i];
      const p2 = points[(i + 1) % points.length];
      const distance = Math.hypot(p2.x - p1.x, p2.y - p1.y);
      const segments = Math.max(Math.floor(distance / (20 - chaos * 10)), 5);

      for (let j = 1; j <= segments; j++) {
        const t = j / segments;
        let x = p1.x + t * (p2.x - p1.x);
        let y = p1.y + t * (p2.y - p1.y);

        const noiseX = (Math.random() - 0.5) * chaosFactor * (1 - Math.abs(t * 2 - 1));
        const noiseY = (Math.random() - 0.5) * chaosFactor * (1 - Math.abs(t * 2 - 1));

        const animOffset = Math.sin((frameCount * effectiveSpeed + i * Math.PI) / 2 + t * 5);
        x += noiseX * animOffset;
        y += noiseY * animOffset;

        ctx.lineTo(x, y);
      }
    }

    ctx.closePath();
    ctx.stroke();
  }, [chaos, color, speed, thickness]);

  useEffect(() => {
    const canvas = canvasRef.current;
    const context = canvas?.getContext('2d');
    
    if (!canvas || !context) return;

    let frameCount = 0;
    const resizeObserver = new ResizeObserver(entries => {
      const entry = entries[0];
      canvas.width = entry.contentRect.width;
      canvas.height = entry.contentRect.height;
    });

    if (containerRef.current) {
        resizeObserver.observe(containerRef.current);
    }
    
    const render = () => {
      frameCount++;
      draw(context, frameCount);
      animationFrameRef.current = requestAnimationFrame(render);
    };

    render();

    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
      resizeObserver.disconnect();
    };
  }, [draw]);

  return (
    <div ref={containerRef} style={{ ...style, position: 'relative' }} className={className}>
      {children}
      <canvas
        ref={canvasRef}
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          width: '100%',
          height: '100%',
          pointerEvents: 'none',
          borderRadius: style.borderRadius || 0
        }}
      />
    </div>
  );
};

export default ElectricBorder;
