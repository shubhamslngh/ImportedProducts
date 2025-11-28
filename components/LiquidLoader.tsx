'use client';

import clsx from 'clsx';

declare global {
  namespace JSX {
    interface IntrinsicElements {
      'dotlottie-player': React.DetailedHTMLProps<React.HTMLAttributes<HTMLElement>, HTMLElement> & {
        src?: string;
        background?: string;
        speed?: number | string;
        loop?: boolean;
        autoplay?: boolean;
        mode?: string;
      };
    }
  }
}

interface LiquidLoaderProps {
  message?: string;
  className?: string;
  size?: number;
}

export function LiquidLoader({ message, className, size = 180 }: LiquidLoaderProps) {
  return (
    <div
      className={clsx(
        'flex flex-col items-center justify-center gap-3 rounded-3xl border border-slate-200 bg-white/80 p-6 text-center',
        className
      )}
    >
      <dotlottie-player
        autoplay
        loop
        mode="normal"
        src="/liquid-loader.lottie"
        style={{ width: size, height: size }}
      />
      {message && <p className="text-sm font-semibold text-slate-500">{message}</p>}
    </div>
  );
}
