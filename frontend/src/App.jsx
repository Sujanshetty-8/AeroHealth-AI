import { useState, useRef, useEffect } from 'react';
import { Bot, User, Send, HeartPulse, CheckCircle2, Loader2, AlertCircle } from 'lucide-react';

function App() {
  const [messages, setMessages] = useState([
    {
      id: 1,
      sender: 'assistant',
      text: 'Hello! I am the AeroHealth AI Receptionist. How can I help you today?',
    }
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [sessionId] = useState(() => Math.random().toString(36).substring(2, 15));
  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!input.trim()) return;

    const userMessage = {
      id: Date.now(),
      sender: 'user',
      text: input.trim(),
    };

    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);

    try {
      const response = await fetch('/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          session_id: sessionId,
          message: userMessage.text,
        }),
      });

      if (!response.ok) throw new Error('Failed to get response');

      const data = await response.json();
      
      const assistantMessage = {
        id: Date.now() + 1,
        sender: 'assistant',
        text: data.reply,
        isBookingComplete: data.booking_complete
      };

      setMessages(prev => [...prev, assistantMessage]);
    } catch (error) {
      console.error('Error:', error);
      const errorMessage = {
        id: Date.now() + 1,
        sender: 'system',
        text: 'Sorry, there was an error connecting to the server. Please ensure the backend is running.',
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex flex-col h-[100dvh] overflow-hidden bg-slate-50 font-sans">
      {/* Header */}
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

      {/* Chat Area */}
      <main className="flex-1 overflow-y-auto p-4 sm:p-6 w-full max-w-4xl mx-auto">
        <div className="flex flex-col space-y-6 pb-4">
          {messages.map((msg) => {
            const isAssistant = msg.sender === 'assistant';
            const isSystem = msg.sender === 'system';
            
            return (
              <div key={msg.id} className={`flex items-start gap-4 ${isAssistant || isSystem ? 'justify-start' : 'justify-end'}`}>
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
          })}
          
          {isLoading && (
            <div className="flex items-start gap-4 justify-start">
              <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center shrink-0 shadow-sm">
                <Bot size={20} />
              </div>
              <div className="bg-white text-slate-700 border border-slate-100 px-5 py-4 rounded-2xl rounded-tl-sm shadow-sm flex items-center gap-2">
                <Loader2 size={18} className="animate-spin text-blue-600" />
                <span className="text-sm font-medium text-slate-500">AeroHealth AI is typing...</span>
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>
      </main>

      {/* Input Area */}
      <footer className="bg-white border-t border-slate-200 p-4">
        <div className="max-w-4xl mx-auto relative">
          <form onSubmit={handleSubmit} className="flex items-center gap-2">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Type your message..."
              disabled={isLoading}
              className="flex-1 bg-slate-50 border border-slate-200 text-slate-800 text-base rounded-full pl-6 pr-12 py-3.5 sm:py-4 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all shadow-inner disabled:opacity-50 disabled:cursor-not-allowed"
            />
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
    </div>
  );
}

export default App;
