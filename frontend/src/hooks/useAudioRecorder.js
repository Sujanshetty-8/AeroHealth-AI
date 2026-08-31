import { useState, useRef } from 'react';

export function useAudioRecorder(setInput, handleAudioSubmit) {
  const [isRecording, setIsRecording] = useState(false);
  const mediaRecorderRef = useRef(null);
  const streamRef = useRef(null);
  const isTranscribingRef = useRef(false);
  const sessionActiveRef = useRef(false);

  const startRecording = async () => {
    sessionActiveRef.current = true;
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;
      
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      
      const audioChunks = [];
      mediaRecorder.ondataavailable = async (event) => {
        if (event.data.size > 0) {
          audioChunks.push(event.data);
          
          if (!isTranscribingRef.current && audioChunks.length > 0) {
            isTranscribingRef.current = true;
            try {
              const currentBlob = new Blob(audioChunks, { type: 'audio/webm' });
              const formData = new FormData();
              formData.append('audio', currentBlob, 'recording.webm');
              
              const res = await fetch('/transcribe', { method: 'POST', body: formData });
              if (res.ok) {
                const data = await res.json();
                if (sessionActiveRef.current && data.text) {
                  setInput(data.text);
                }
              }
            } catch (err) {
              console.error("Live transcription error", err);
            } finally {
              isTranscribingRef.current = false;
            }
          }
        }
      };

      mediaRecorder.onstop = async () => {
        const audioBlob = new Blob(audioChunks, { type: 'audio/webm' });
        await handleAudioSubmit(audioBlob);
        
        // Cleanup stream
        if (streamRef.current) {
          streamRef.current.getTracks().forEach(track => track.stop());
        }
        setIsRecording(false);
      };

      mediaRecorder.start(1000);
      setIsRecording(true);
      
    } catch (error) {
      console.error("Error accessing microphone:", error);
      alert("Could not access microphone. Please check permissions.");
    }
  };

  const stopRecording = () => {
    sessionActiveRef.current = false;
    if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
      mediaRecorderRef.current.stop();
    }
  };

  const toggleRecording = () => {
    if (isRecording) {
      stopRecording();
    } else {
      startRecording();
    }
  };

  return { isRecording, startRecording, stopRecording, toggleRecording };
}
