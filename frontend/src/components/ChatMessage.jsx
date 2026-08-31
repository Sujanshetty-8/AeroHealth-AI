import { Bot, User, CheckCircle2, AlertCircle } from 'lucide-react';

export default function ChatMessage({ msg }) {
  const isAssistant = msg.sender === 'assistant';
  const isSystem = msg.sender === 'system';
  
  return (
    <div className={`flex items-start gap-4 ${isAssistant || isSystem ? 'justify-start' : 'justify-end'}`}>
      {(isAssistant || isSystem) && (
        <div className={`w-8 h-8 sm:w-10 sm:h-10 rounded-full flex items-center justify-center shrink-0 shadow-sm ${isSystem ? 'bg-red-100 text-red-600' : 'bg-blue-100 text-blue-700'}`}>
          {isSystem ? <AlertCircle size={18} /> : <Bot size={20} />}
        </div>
      )}
      
      <div className={`flex flex-col gap-1 max-w-[85%] sm:max-w-[75%] ${!isAssistant && !isSystem ? 'items-end' : 'items-start'}`}>
        <div className={`px-4 py-3 sm:px-5 sm:py-3.5 rounded-2xl shadow-sm text-sm sm:text-base leading-relaxed
          ${isAssistant ? 'bg-white text-slate-700 border border-slate-100 rounded-tl-sm' : ''}
          ${!isAssistant && !isSystem ? 'bg-blue-600 text-white rounded-tr-sm' : ''}
          ${isSystem ? 'bg-red-50 text-red-700 border border-red-100 rounded-tl-sm' : ''}
        `}>
          <p className="whitespace-pre-wrap">{msg.text}</p>
          
          {msg.isBookingComplete && (
            <div className="mt-3 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-lg p-3 flex items-center gap-2 text-sm font-medium">
              <CheckCircle2 size={18} className="text-emerald-600" />
              Appointment Confirmed
            </div>
          )}
        </div>
      </div>

      {!isAssistant && !isSystem && (
        <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-slate-200 text-slate-500 flex items-center justify-center shrink-0 shadow-sm">
          <User size={20} />
        </div>
      )}
    </div>
  );
}
