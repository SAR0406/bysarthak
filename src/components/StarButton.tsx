
'use client';

import React from 'react';
import { cn } from '@/lib/utils';

interface StarButtonProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
  ariaLabel?: string;
}

/**
 * StarButton component refactored to use a <div> to prevent hydration mismatches
 * when nested inside <Link> components (which render as <a>).
 */
const StarButton = React.forwardRef<HTMLDivElement, StarButtonProps>(
  ({ children, className, ariaLabel, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={cn("star-button inline-flex", className)}
        role="button"
        tabIndex={0}
        aria-label={ariaLabel}
        {...props}
      >
        <span className="relative z-10">{children}</span>
        {[1, 2, 3, 4, 5, 6].map((i) => (
          <div key={i} className={`star-${i}`} aria-hidden="true">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              xmlSpace="preserve"
              version="1.1"
              className="w-full h-auto"
              style={{
                shapeRendering: 'geometricPrecision',
                textRendering: 'geometricPrecision',
                imageRendering: 'optimizeQuality',
                fillRule: 'evenodd',
                clipRule: 'evenodd',
              }}
              viewBox="0 0 784.11 815.53"
            >
              <path
                className="fil0"
                d="M392.05 0c-20.9,210.08 -184.06,378.41 -392.05,407.78 207.96,29.37 371.12,197.68 392.05,407.74 20.93,-210.06 184.09,-378.37 392.05,-407.74 -207.98,-29.38 -371.16,-197.69 -392.06,-407.78z"
              />
            </svg>
          </div>
        ))}
      </div>
    );
  }
);

StarButton.displayName = "StarButton";

export default StarButton;