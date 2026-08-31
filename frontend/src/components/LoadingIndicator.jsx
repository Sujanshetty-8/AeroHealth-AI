import { Bot, Loader2 } from 'lucide-react';

export default function LoadingIndicator() {
  return (
    <div className="flex items-start gap-4 justify-start">
      <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center shrink-0 shadow-sm">
        <Bot size={20} />
      </div>
      <div className="bg-white text-slate-700 border border-slate-100 px-5 py-4 rounded-2xl rounded-tl-sm shadow-sm flex items-center gap-2">
        <Loader2 size={18} className="animate-spin text-blue-600" />
        <span className="text-sm font-medium text-slate-500">AeroHealth AI is typing...</span>
      </div>
    </div>
  );
}
