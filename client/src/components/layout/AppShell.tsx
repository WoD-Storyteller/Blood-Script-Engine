import { ReactNode } from 'react';
import Sidebar from './Sidebar';

export default function AppShell({ children }: { children: ReactNode }) {
  return (
    <div className="h-screen w-screen bg-blood-night text-blood-bone flex overflow-hidden">
      <Sidebar />

      <main className="flex-1 overflow-y-auto bg-gradient-to-br from-blood-night via-blood-dark to-blood-ash">
        {children}
      </main>
    </div>
  );
}
