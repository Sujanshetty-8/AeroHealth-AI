import { Mic, Send } from 'lucide-react';

export default function ChatInput({
  input,
  setInput,
  isLoading,
  handleSubmit,
  isRecording,
  toggleRecording
}) {
  return (
    <footer className="bg-white border-t border-slate-200 p-4">
      <div className="max-w-4xl mx-auto relative">
        <form onSubmit={handleSubmit} className="flex items-center gap-2">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Type your message..."
            disabled={isLoading}
            className="flex-1 bg-slate-50 border border-slate-200 text-slate-800 text-base rounded-full pl-6 pr-[5.5rem] py-3.5 sm:py-4 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all shadow-inner disabled:opacity-50 disabled:cursor-not-allowed"
          />
          <button
            type="button"
            onClick={toggleRecording}
            disabled={isLoading}
            className={`absolute right-12 top-1/2 -translate-y-1/2 p-2 sm:p-2.5 rounded-full transition-colors shadow-sm flex items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed
              ${isRecording ? 'bg-red-500 text-white animate-pulse' : 'bg-slate-200 text-slate-600 hover:bg-slate-300'}`}
          >
            <Mic size={18} />
          </button>
          <button 
            type="submit" 
            disabled={!input.trim() || isLoading} 
            className="absolute right-2 top-1/2 -translate-y-1/2 p-2 sm:p-2.5 bg-blue-600 text-white rounded-full hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed shadow-sm flex items-center justify-center"
          >
            <Send size={18} className="ml-0.5" />
          </button>
        </form>
      </div>
    </footer>
  );
}
