import { ReactNode } from 'react';

export function PageWrapper({ children }: { children: ReactNode }) {
  return (
    <div className="flex-1 w-full max-w-screen-2xl px-4 py-4 mx-auto">{children}</div>
  );
}
