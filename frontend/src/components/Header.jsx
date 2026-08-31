import { HeartPulse } from 'lucide-react';

export default function Header() {
  return (
    <header className="bg-white border-b border-slate-200 px-6 py-4 flex items-center justify-between sticky top-0 z-10 shadow-sm">
      <div className="flex items-center gap-3">
        <div className="bg-blue-600 p-2 rounded-xl text-white shadow-sm">
          <HeartPulse size={24} />
        </div>
        <div>
          <h1 className="text-xl font-semibold text-slate-800 tracking-tight">AeroHealth AI</h1>
          <p className="text-xs font-medium text-slate-500 flex items-center gap-1.5 mt-0.5">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
            Receptionist Online
          </p>
        </div>
      </div>
    </header>
  );
}
