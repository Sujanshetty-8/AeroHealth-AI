import { useState, useRef } from 'react';

export function useAudioRecorder(setInput, handleAudioSubmit) {
  const [isRecording, setIsRecording] = useState(false);

  const mediaRecorderRef = useRef(null);
  const streamRef = useRef(null);

  const shouldSubmitRef = useRef(false);

  // =====================================================
  // START RECORDING
  // =====================================================

  const startRecording = async () => {
    try {
      const stream =
        await navigator.mediaDevices.getUserMedia({
          audio: true,
        });

      streamRef.current = stream;

      const mediaRecorder =
        new MediaRecorder(stream);

      mediaRecorderRef.current =
        mediaRecorder;

      const audioChunks = [];

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunks.push(event.data);
        }
      };

      // =================================================
      // WHEN RECORDING STOPS
      // =================================================

      mediaRecorder.onstop = async () => {
        const audioBlob = new Blob(
          audioChunks,
          {
            type: 'audio/webm',
          }
        );

        // Only process the recording if
        // the user pressed SEND.
        if (
          shouldSubmitRef.current &&
          audioBlob.size > 0
        ) {
          await handleAudioSubmit(
            audioBlob
          );
        }

        // Cleanup microphone
        if (streamRef.current) {
          streamRef.current
            .getTracks()
            .forEach(track => track.stop());
        }

        streamRef.current = null;
        mediaRecorderRef.current = null;

        shouldSubmitRef.current = false;

        setIsRecording(false);
      };

      mediaRecorder.start();

      setIsRecording(true);

    } catch (error) {
      console.error(
        'Error accessing microphone:',
        error
      );

      alert(
        'Could not access microphone. Please check microphone permissions.'
      );
    }
  };


  // =====================================================
  // STOP + SUBMIT RECORDING
  // =====================================================

  const stopRecording = () => {
    shouldSubmitRef.current = true;

    if (
      mediaRecorderRef.current &&
      mediaRecorderRef.current.state === 'recording'
    ) {
      mediaRecorderRef.current.stop();
    }
  };


  // =====================================================
  // CANCEL RECORDING
  // =====================================================

  const cancelRecording = () => {
    shouldSubmitRef.current = false;

    if (
      mediaRecorderRef.current &&
      mediaRecorderRef.current.state === 'recording'
    ) {
      mediaRecorderRef.current.stop();
    }

    if (streamRef.current) {
      streamRef.current
        .getTracks()
        .forEach(track => track.stop());
    }

    streamRef.current = null;
    mediaRecorderRef.current = null;

    setIsRecording(false);
  };


  return {
    isRecording,
    startRecording,
    stopRecording,
    cancelRecording,
  };
}