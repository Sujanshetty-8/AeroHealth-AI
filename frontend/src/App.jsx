import { useState, useRef, useEffect } from 'react';
import Header from './components/Header';
import ChatMessage from './components/ChatMessage';
import ChatInput from './components/ChatInput';
import LoadingIndicator from './components/LoadingIndicator';
import { useAudioRecorder } from './hooks/useAudioRecorder';

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
  const isSubmittingRef = useRef(false);

  const handleAudioSubmit = async (audioBlob) => {
    if (isSubmittingRef.current) return;
    try {
      const formData = new FormData();
      formData.append('audio', audioBlob, 'recording.webm');
      
      const transcribeRes = await fetch('/transcribe', {
        method: 'POST',
        body: formData,
      });
      
      if (!transcribeRes.ok) throw new Error('Transcription failed');
      const transcribeData = await transcribeRes.json();
      const transcribedText = transcribeData.text;
      
      if (!transcribedText || transcribedText.trim() === '') {
         return; // Ignore empty audio
      }

      // Populate input with final transcription from server
      setInput(transcribedText);
      
    } catch (error) {
      console.error('Error:', error);
      const errorMessage = {
        id: Date.now() + 1,
        sender: 'system',
        text: 'Sorry, there was an error processing your voice message.',
      };
      setMessages(prev => [...prev, errorMessage]);
    }
  };

  const { isRecording, startRecording, stopRecording, toggleRecording } = useAudioRecorder(setInput, handleAudioSubmit);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!input.trim()) return;

    isSubmittingRef.current = true;
    if (isRecording) {
      stopRecording();
    }

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
      isSubmittingRef.current = false;
    }
  };

  return (
    <div className="flex flex-col h-[100dvh] overflow-hidden bg-slate-50 font-sans">
      <Header />

      <main className="flex-1 overflow-y-auto p-4 sm:p-6 w-full max-w-4xl mx-auto">
        <div className="flex flex-col space-y-6 pb-4">
          {messages.map((msg) => (
            <ChatMessage key={msg.id} msg={msg} />
          ))}
          
          {isLoading && <LoadingIndicator />}
          <div ref={messagesEndRef} />
        </div>
      </main>

      <ChatInput 
        input={input}
        setInput={setInput}
        isLoading={isLoading}
        handleSubmit={handleSubmit}
        isRecording={isRecording}
        toggleRecording={toggleRecording}
      />
    </div>
  );
}

export default App;
