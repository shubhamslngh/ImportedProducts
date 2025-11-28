import { ReactNode } from 'react';

export function PageSection({ children }: { children: ReactNode }) {
  return <section className="pt-2 mb-6">{children}</section>;
}
