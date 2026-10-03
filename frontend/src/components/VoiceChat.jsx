import {
  useState,
  useRef,
  useEffect,
} from 'react';

import {
  ArrowLeft,
  Mic,
  Send,
  X,
  Bot,
  Globe2,
} from 'lucide-react';


function VoiceChat({
  onBack,
  onSendMessage,
  messages,
  isLoading,
}) {

  // =====================================================
  // STATE
  // =====================================================

  const [isRecording, setIsRecording] =
    useState(false);

  const [isProcessing, setIsProcessing] =
    useState(false);

  const [error, setError] =
    useState('');

  const [transcript, setTranscript] =
    useState('');


  // =====================================================
  // TEXT TO SPEECH STATE
  // =====================================================

  const [isSpeaking, setIsSpeaking] =
    useState(false);

  const [voices, setVoices] =
    useState([]);


  // =====================================================
  // SELECTED LANGUAGE
  // =====================================================

  const [selectedLanguage, setSelectedLanguage] =
    useState('en');


  // =====================================================
  // SPEECH RECOGNITION REF
  // =====================================================

  const recognitionRef =
    useRef(null);

  const finalTranscriptRef =
    useRef('');

  const voiceSendRequestedRef =
    useRef(false);


  // =====================================================
  // TTS REF
  // =====================================================

  const speechRef =
    useRef(null);

  const greetingPlayedRef =
    useRef(false);


  // =====================================================
  // CONVERSATION SCROLL REF
  // =====================================================

  const conversationEndRef =
    useRef(null);


  // =====================================================
  // AUTO SCROLL CONVERSATION
  // =====================================================

  useEffect(() => {

    conversationEndRef.current?.scrollIntoView({
      behavior: 'smooth',
    });

  }, [
    messages,
    isLoading,
  ]);


  // =====================================================
  // LOAD BROWSER TTS VOICES
  // =====================================================

  useEffect(() => {

    if (
      typeof window === 'undefined' ||
      !window.speechSynthesis
    ) {
      return;
    }


    const loadVoices = () => {

      const availableVoices =
        window.speechSynthesis.getVoices();


      console.log(
        '🔊 Available TTS voices:',
        availableVoices
      );


      setVoices(
        availableVoices
      );

    };


    // Load immediately

    loadVoices();


    // Chrome may load voices asynchronously

    window.speechSynthesis.onvoiceschanged =
      loadVoices;


    return () => {

      window.speechSynthesis.cancel();

      window.speechSynthesis.onvoiceschanged =
        null;

    };

  }, []);


  // =====================================================
  // SPEAK AI RESPONSE
  // =====================================================

  const speakResponse = (text) => {

    if (!text) {
      return;
    }


    if (
      typeof window === 'undefined' ||
      !window.speechSynthesis
    ) {

      console.error(
        '❌ Speech synthesis is not supported.'
      );

      return;

    }


    // Stop any previous speech

    window.speechSynthesis.cancel();


    // =================================================
    // DETERMINE LANGUAGE
    // =================================================

    const speechLanguage =
      selectedLanguage === 'en'
        ? 'en-IN'
        : 'kn-IN';


    console.log(
      '🔊 TTS language:',
      speechLanguage
    );


    // =================================================
    // CREATE UTTERANCE
    // =================================================

    const utterance =
      new SpeechSynthesisUtterance(
        text
      );


    utterance.lang =
      speechLanguage;


    // =================================================
    // FIND SUITABLE VOICE
    // =================================================

    let matchingVoice = null;


    if (
      selectedLanguage === 'kn'
    ) {

      // First try exact Kannada voice

      matchingVoice =
        voices.find(
          (voice) =>
            voice.lang
              .toLowerCase() === 'kn-in'
        );


      // Then try any Kannada voice

      if (!matchingVoice) {

        matchingVoice =
          voices.find(
            (voice) =>
              voice.lang
                .toLowerCase()
                .startsWith('kn')
          );

      }

    } else {

      // First try Indian English

      matchingVoice =
        voices.find(
          (voice) =>
            voice.lang
              .toLowerCase()
              .startsWith('en-in')
        );


      // Then fall back to any English voice

      if (!matchingVoice) {

        matchingVoice =
          voices.find(
            (voice) =>
              voice.lang
                .toLowerCase()
                .startsWith('en')
          );

      }

    }


    // =================================================
    // APPLY VOICE
    // =================================================

    if (matchingVoice) {

      utterance.voice =
        matchingVoice;


      console.log(
        '🔊 Using voice:',
        matchingVoice.name,
        matchingVoice.lang
      );

    } else {

      console.warn(
        '⚠️ No matching TTS voice found for:',
        speechLanguage
      );


      console.log(
        'Available voices:',
        voices.map(
          (voice) =>
            `${voice.name} (${voice.lang})`
        )
      );

    }


    // =================================================
    // SPEECH SETTINGS
    // =================================================

    utterance.rate =
      0.95;

    utterance.pitch =
      1;

    utterance.volume =
      1;


    // =================================================
    // SPEECH START
    // =================================================

    utterance.onstart = () => {

      console.log(
        '🔊 AeroHealth AI started speaking'
      );


      setIsSpeaking(
        true
      );

    };


    // =================================================
    // SPEECH END
    // =================================================

    utterance.onend = () => {

      console.log(
        '🔊 AeroHealth AI finished speaking'
      );


      setIsSpeaking(
        false
      );


      speechRef.current =
        null;

    };


    // =================================================
    // SPEECH ERROR
    // =================================================

    utterance.onerror = (event) => {

      console.error(
        '❌ TTS error:',
        event
      );


      setIsSpeaking(
        false
      );


      speechRef.current =
        null;

    };


    // Keep reference

    speechRef.current =
      utterance;


    // Speak

    window.speechSynthesis.speak(
      utterance
    );

  };


  // =====================================================
  // PLAY INITIAL GREETING WHEN VOICE CHAT OPENS
  // =====================================================

  useEffect(() => {
console.log('🟢 Greeting effect started');

  if (greetingPlayedRef.current) {
    console.log('🟡 Greeting already played');
    return;
  }

  if (
    typeof window === 'undefined' ||
    !window.speechSynthesis
  ) {
    console.log('🔴 Speech synthesis not available');
    return;
  }

  const greeting =
    messages?.find(
      (message) =>
        message.id === 1 &&
        message.sender === 'assistant'
    );

  console.log('🟢 Greeting found:', greeting);

  if (!greeting?.text) {
    console.log('🔴 Greeting text not found');
    return;
  }

  console.log(
    '🟢 Scheduling greeting speech:',
    greeting.text
  );

  const timer = setTimeout(() => {

    // Mark as played only when we actually start it
    greetingPlayedRef.current = true;

    console.log(
      '🟢 Calling speakResponse now'
    );

    speakResponse(
      greeting.text
    );

  }, 500);

  return () => {
    clearTimeout(timer);
  };

}, []);


  // =====================================================
  // LANGUAGE CHANGE
  // =====================================================

  const handleLanguageChange = (event) => {

    const newLanguage =
      event.target.value;


    // Don't allow changing language
    // while recording.

    if (isRecording) {
      return;
    }


    // Stop current speech if any

    if (
      window.speechSynthesis
    ) {

      window.speechSynthesis.cancel();

    }


    setIsSpeaking(false);


    setSelectedLanguage(
      newLanguage
    );

    setTranscript('');
    setError('');


    finalTranscriptRef.current =
      '';

  };


  // =====================================================
  // GET SPEECH RECOGNITION LANGUAGE
  // =====================================================

  const getRecognitionLanguage = () => {

    if (
      selectedLanguage === 'en'
    ) {

      return 'en-IN';

    }

    return 'kn-IN';

  };


  // =====================================================
  // GET LANGUAGE DISPLAY NAME
  // =====================================================

  const getLanguageName = () => {

    if (
      selectedLanguage === 'en'
    ) {

      return 'English';

    }

    return 'ಕನ್ನಡ';

  };


  // =====================================================
  // START SPEECH RECOGNITION
  // =====================================================

  const handleStart = () => {

    // Stop previous AI speech

    if (
      window.speechSynthesis
    ) {

      window.speechSynthesis.cancel();

    }


    setIsSpeaking(false);


    setError('');
    setTranscript('');


    finalTranscriptRef.current =
      '';


    voiceSendRequestedRef.current =
      false;


    // =================================================
    // BROWSER COMPATIBILITY
    // =================================================

    const SpeechRecognition =
      window.SpeechRecognition ||
      window.webkitSpeechRecognition;


    if (!SpeechRecognition) {

      setError(
        'Speech recognition is not supported in this browser. Please use Google Chrome.'
      );

      return;

    }


    const recognition =
      new SpeechRecognition();


    // =================================================
    // SELECTED LANGUAGE
    // =================================================

    const recognitionLanguage =
      getRecognitionLanguage();


    recognition.lang =
      recognitionLanguage;


    console.log(
      '🎤 Recognition language:',
      recognitionLanguage
    );


    // =================================================
    // RECOGNITION SETTINGS
    // =================================================

    recognition.continuous =
      true;


    recognition.interimResults =
      true;


    recognition.maxAlternatives =
      1;


    recognitionRef.current =
      recognition;


    // =================================================
    // RECOGNITION START
    // =================================================

    recognition.onstart = () => {

      console.log(
        '🎤 Speech recognition started'
      );


      console.log(
        '🌐 Selected language:',
        getLanguageName()
      );


      setIsRecording(
        true
      );


      setIsProcessing(
        false
      );


      setError('');

    };


    // =================================================
    // RECOGNITION RESULT
    // =================================================

    recognition.onresult = (
      event
    ) => {

      let finalText =
        '';

      let interimText =
        '';


      for (
        let i = event.resultIndex;
        i < event.results.length;
        i++
      ) {

        const result =
          event.results[i];


        if (
          result.isFinal
        ) {

          finalText +=
            result[0].transcript +
            ' ';

        } else {

          interimText +=
            result[0].transcript;

        }

      }


      // =================================================
      // SAVE FINAL TRANSCRIPTION
      // =================================================

      if (finalText) {

        finalTranscriptRef.current +=
          finalText;

      }


      // =================================================
      // COMBINED TRANSCRIPT
      // =================================================

      const combinedText =
        (
          finalTranscriptRef.current +
          interimText
        ).trim();


      setTranscript(
        combinedText
      );


      console.log(
        '📝 Transcript:',
        combinedText
      );

    };


    // =================================================
    // RECOGNITION ERROR
    // =================================================

    recognition.onerror = (
      event
    ) => {

      console.error(
        'Speech recognition error:',
        event.error
      );


      if (
        event.error ===
        'not-allowed'
      ) {

        setError(
          'Microphone permission was denied. Please allow microphone access.'
        );

      } else if (
        event.error ===
        'network'
      ) {

        setError(
          'Speech recognition requires an internet connection.'
        );

      } else if (
        event.error ===
        'no-speech'
      ) {

        console.log(
          'No speech detected.'
        );

      } else {

        setError(
          'Could not recognize your speech. Please try again.'
        );

      }


      setIsRecording(
        false
      );

    };


    // =================================================
    // RECOGNITION END
    // =================================================

    recognition.onend = () => {

      console.log(
        '🛑 Speech recognition ended'
      );


      /*
       * Chrome may automatically stop recognition
       * after a pause even when continuous=true.
       *
       * If the user has NOT pressed Send,
       * restart recognition automatically.
       */

      if (
        !voiceSendRequestedRef.current &&
        recognitionRef.current ===
          recognition
      ) {

        try {

          recognition.start();


          console.log(
            '🔄 Restarting speech recognition...'
          );

        } catch (err) {

          console.log(
            'Recognition restart skipped:',
            err
          );

        }

      } else {

        setIsRecording(
          false
        );

      }

    };


    // =================================================
    // START RECOGNITION
    // =================================================

    try {

      recognition.start();

    } catch (err) {

      console.error(
        'Could not start recognition:',
        err
      );


      setError(
        'Could not start speech recognition. Please try again.'
      );


      setIsRecording(
        false
      );

    }

  };


  // =====================================================
  // SEND VOICE MESSAGE
  // =====================================================

  const handleSend = async () => {

    if (!isRecording) {
      return;
    }


    const recognition =
      recognitionRef.current;


    // Tell onend that we intentionally
    // stopped recognition.

    voiceSendRequestedRef.current =
      true;


    // =================================================
    // STOP RECOGNITION
    // =================================================

    if (recognition) {

      try {

        recognition.stop();

      } catch (err) {

        console.log(
          'Recognition stop error:',
          err
        );

      }

    }


    const finalText =
      finalTranscriptRef.current.trim();


    setIsRecording(
      false
    );


    // =================================================
    // CHECK TRANSCRIPT
    // =================================================

    if (!finalText) {

      setError(
        'I could not hear anything. Please try again.'
      );


      voiceSendRequestedRef.current =
        false;


      return;

    }


    // =================================================
    // SEND TO AI
    // =================================================

    setIsProcessing(
      true
    );


    setError('');


    console.log(
      '📤 Sending transcript to AeroHealth:',
      finalText
    );


    console.log(
      '🌐 Language:',
      getLanguageName()
    );


    try {

      // IMPORTANT:
      // App.jsx returns data.reply.
      // We speak this exact response instead
      // of searching the messages array.

      const reply =
        await onSendMessage(
          finalText
        );


      if (reply) {

        speakResponse(
          reply
        );

      }

    } catch (err) {

      console.error(
        'Voice message error:',
        err
      );


      setError(
        'Sorry, I could not process your voice message.'
      );

    } finally {

      setIsProcessing(
        false
      );


      voiceSendRequestedRef.current =
        false;


      recognitionRef.current =
        null;


      finalTranscriptRef.current =
        '';


      setTranscript('');

    }

  };


  // =====================================================
  // CANCEL RECORDING
  // =====================================================

  const handleCancel = () => {

    voiceSendRequestedRef.current =
      true;


    const recognition =
      recognitionRef.current;


    if (recognition) {

      try {

        recognition.abort();

      } catch (err) {

        console.log(
          'Recognition abort error:',
          err
        );

      }

    }


    recognitionRef.current =
      null;


    finalTranscriptRef.current =
      '';


    setTranscript('');


    setIsRecording(
      false
    );


    setIsProcessing(
      false
    );


    setError('');

  };


  // =====================================================
  // BACK TO TEXT CHAT
  // =====================================================

  const handleBack = () => {

    // Stop AI speech

    if (
      window.speechSynthesis
    ) {

      window.speechSynthesis.cancel();

    }


    setIsSpeaking(
      false
    );


    if (isRecording) {

      handleCancel();

    }


    onBack();

  };


  // =====================================================
  // UI
  // =====================================================

  return (

    <div className="
      h-full
      w-full
      bg-white
      flex
      flex-col
    ">


      {/* =================================================
          HEADER
      ================================================= */}

      <div className="
        shrink-0
        flex
        items-center
        justify-between
        px-6
        py-4
        border-b
        border-slate-200
      ">


        {/* BACK */}

        <button
          onClick={handleBack}
          className="
            flex
            items-center
            gap-2
            text-sm
            font-medium
            text-slate-600
            hover:text-blue-600
            transition
          "
        >

          <ArrowLeft
            size={18}
          />

          Back to Text Chat

        </button>


        {/* ONLINE STATUS */}

        <div className="
          flex
          items-center
          gap-2
        ">

          <span className="
            w-2.5
            h-2.5
            rounded-full
            bg-green-500
          " />

          <span className="
            text-sm
            text-slate-600
          ">

            AI Receptionist Online

          </span>

        </div>

      </div>


      {/* =================================================
          MAIN VOICE AREA
      ================================================= */}

      <div className="
        flex-1
        min-h-0
        flex
        flex-col
        items-center
        px-6
        text-center
        overflow-y-auto
        py-8
      ">


        {/* =================================================
            LANGUAGE SELECTOR
        ================================================= */}

        <div className="
          w-full
          max-w-xs
          mb-6
        ">

          <label className="
            flex
            items-center
            justify-center
            gap-2
            text-sm
            font-medium
            text-slate-600
            mb-2
          ">

            <Globe2
              size={16}
              className="text-blue-600"
            />

            Select Voice Language

          </label>


          <select
            value={selectedLanguage}
            onChange={
              handleLanguageChange
            }
            disabled={
              isRecording ||
              isProcessing ||
              isSpeaking
            }
            className="
              w-full
              px-4
              py-3
              rounded-xl
              border
              border-slate-200
              bg-white
              text-slate-700
              text-sm
              font-medium
              text-center
              outline-none
              focus:border-blue-500
              focus:ring-2
              focus:ring-blue-100
              disabled:bg-slate-50
              disabled:text-slate-400
              cursor-pointer
              disabled:cursor-not-allowed
            "
          >

            <option value="en">
              English
            </option>

            <option value="kn">
              ಕನ್ನಡ (Kannada)
            </option>

          </select>


          <p className="
            text-xs
            text-slate-400
            mt-2
          ">

            Speak in the selected language

          </p>

        </div>


        {/* =================================================
            AI ICON
        ================================================= */}

        <div className="
          w-14
          h-14
          rounded-2xl
          bg-blue-50
          flex
          items-center
          justify-center
          mb-5
          shrink-0
        ">

          <Bot
            size={28}
            className="text-blue-600"
          />

        </div>


        {/* =================================================
            TITLE
        ================================================= */}

        <h1 className="
          text-2xl
          sm:text-3xl
          font-semibold
          text-slate-800
        ">

          Talk to AeroHealth AI

        </h1>


        <p className="
          text-slate-500
          mt-2
          text-sm
          sm:text-base
          max-w-md
        ">

          Speak naturally and I'll help
          you with your appointment.

        </p>


        {/* =================================================
            CURRENT LANGUAGE BADGE
        ================================================= */}

        <div className="
          mt-4
          inline-flex
          items-center
          gap-2
          px-3
          py-1.5
          rounded-full
          bg-blue-50
          text-blue-600
          text-xs
          font-medium
        ">

          <span className="
            w-1.5
            h-1.5
            rounded-full
            bg-blue-600
          " />

          {getLanguageName()}
          {' '}
          voice mode

        </div>


        {/* =================================================
            VOICE CIRCLE
        ================================================= */}

        <div className="
          relative
          mt-10
          mb-7
          shrink-0
        ">


          {/* OUTER PULSE */}

          {isRecording && (

            <>

              <div className="
                absolute
                inset-[-18px]
                rounded-full
                bg-blue-100
                opacity-60
                animate-ping
              " />


              <div className="
                absolute
                inset-[-30px]
                rounded-full
                bg-blue-50
                opacity-50
                animate-pulse
              " />

            </>

          )}


          {/* MAIN CIRCLE */}

          <div
            className={`
              relative
              w-44
              h-44
              sm:w-52
              sm:h-52
              rounded-full
              flex
              items-center
              justify-center
              shadow-xl
              transition-all
              duration-300

              ${
                isRecording
                  ? 'bg-blue-600 scale-105'
                  : 'bg-slate-100'
              }
            `}
          >


            {/* LISTENING WAVE */}

            {isRecording ? (

              <div className="
                flex
                items-center
                justify-center
                gap-1.5
                h-20
              ">

                <div className="
                  w-1.5
                  h-7
                  bg-white
                  rounded-full
                  animate-pulse
                " />

                <div className="
                  w-1.5
                  h-12
                  bg-white
                  rounded-full
                  animate-pulse
                  [animation-delay:100ms]
                " />

                <div className="
                  w-1.5
                  h-20
                  bg-white
                  rounded-full
                  animate-pulse
                  [animation-delay:200ms]
                " />

                <div className="
                  w-1.5
                  h-14
                  bg-white
                  rounded-full
                  animate-pulse
                  [animation-delay:300ms]
                " />

                <div className="
                  w-1.5
                  h-9
                  bg-white
                  rounded-full
                  animate-pulse
                  [animation-delay:400ms]
                " />

                <div className="
                  w-1.5
                  h-16
                  bg-white
                  rounded-full
                  animate-pulse
                  [animation-delay:500ms]
                " />

                <div className="
                  w-1.5
                  h-11
                  bg-white
                  rounded-full
                  animate-pulse
                  [animation-delay:600ms]
                " />

              </div>

            ) : (

              <Mic
                size={52}
                className="text-slate-400"
              />

            )}

          </div>

        </div>


        {/* =================================================
            LISTENING STATUS
        ================================================= */}

        {isRecording &&
          !isProcessing && (

          <div>

            <div className="
              flex
              items-center
              justify-center
              gap-2
              text-blue-600
              font-semibold
            ">

              <span className="
                w-2
                h-2
                rounded-full
                bg-blue-600
                animate-pulse
              " />

              Listening in
              {' '}
              {getLanguageName()}...

            </div>


            <p className="
              text-xs
              text-slate-400
              mt-2
            ">

              Speak naturally. Press Send
              when you are finished.

            </p>

          </div>

        )}


        {/* =================================================
            LIVE TRANSCRIPT
        ================================================= */}

        {isRecording &&
          transcript && (

          <div className="
            mt-5
            max-w-lg
            px-5
            py-3
            rounded-2xl
            bg-slate-50
            border
            border-slate-200
            text-sm
            text-slate-700
          ">

            {transcript}

          </div>

        )}


        {/* =================================================
            PROCESSING
        ================================================= */}

        {isProcessing && (

          <div>

            <div className="
              flex
              items-center
              justify-center
              gap-2
              text-slate-700
              font-medium
            ">

              <div className="
                w-4
                h-4
                border-2
                border-slate-300
                border-t-blue-600
                rounded-full
                animate-spin
              " />

              Processing your voice...

            </div>


            <p className="
              text-xs
              text-slate-400
              mt-2
            ">

              Sending your message to AeroHealth AI

            </p>

          </div>

        )}


        {/* =================================================
            AI SPEAKING
        ================================================= */}

        {isSpeaking && (

          <div className="
            mt-4
            flex
            items-center
            justify-center
            gap-2
            text-green-600
            font-semibold
          ">

            <span className="
              w-2
              h-2
              rounded-full
              bg-green-600
              animate-pulse
            " />

            AeroHealth AI is speaking...

          </div>

        )}


        {/* =================================================
            INITIAL STATE
        ================================================= */}

        {!isRecording &&
          !isProcessing &&
          !isSpeaking && (

          <p className="
            text-sm
            text-slate-400
          ">

            Click the microphone to start

          </p>

        )}


        {/* =================================================
            ERROR
        ================================================= */}

        {error && (

          <div className="
            mt-4
            max-w-md
            px-4
            py-3
            rounded-xl
            bg-red-50
            border
            border-red-100
            text-sm
            text-red-600
          ">

            {error}

          </div>

        )}


        {/* =================================================
            CONTROLS
        ================================================= */}

        <div className="
          mt-8
          flex
          items-center
          gap-5
          shrink-0
        ">


          {/* CANCEL */}

          {isRecording ? (

            <button
              onClick={handleCancel}
              className="
                w-14
                h-14
                rounded-full
                bg-slate-100
                border
                border-slate-200
                flex
                items-center
                justify-center
                text-slate-600
                hover:bg-slate-200
                transition
              "
              title="Cancel recording"
            >

              <X
                size={23}
              />

            </button>

          ) : (

            <div
              className="
                w-14
                h-14
              "
            />

          )}


          {/* START / SEND */}

          {!isRecording ? (

            <button
              onClick={handleStart}
              disabled={
                isProcessing ||
                isSpeaking
              }
              className="
                w-16
                h-16
                rounded-full
                bg-blue-600
                text-white
                flex
                items-center
                justify-center
                shadow-lg
                hover:bg-blue-700
                hover:scale-105
                transition
                disabled:opacity-50
              "
              title="Start voice chat"
            >

              <Mic
                size={27}
              />

            </button>

          ) : (

            <button
              onClick={handleSend}
              disabled={isProcessing}
              className="
                w-16
                h-16
                rounded-full
                bg-blue-600
                text-white
                flex
                items-center
                justify-center
                shadow-lg
                hover:bg-blue-700
                hover:scale-105
                transition
                disabled:opacity-50
              "
              title="Send voice message"
            >

              <Send
                size={25}
              />

            </button>

          )}

        </div>


        {/* =================================================
            SEND HINT
        ================================================= */}

        {isRecording && (

          <p className="
            mt-3
            text-xs
            text-slate-400
          ">

            Press

            <span className="
              font-medium
              text-slate-600
              mx-1
            ">

              Send

            </span>

            when you finish speaking.

          </p>

        )}


        {/* =================================================
            VOICE CONVERSATION TEXT
        ================================================= */}

        <div className="
          w-full
          max-w-3xl
          mt-8
          border-t
          border-slate-200
          pt-5
          pb-6
        ">


          {/* CONVERSATION HEADER */}

          <div className="
            flex
            items-center
            justify-between
            mb-4
          ">

            <h2 className="
              text-sm
              font-semibold
              text-slate-700
            ">

              Conversation

            </h2>


            {isLoading && (

              <div className="
                flex
                items-center
                gap-2
                text-xs
                text-blue-600
              ">

                <span className="
                  w-2
                  h-2
                  rounded-full
                  bg-blue-600
                  animate-pulse
                " />

                AeroHealth AI is thinking...

              </div>

            )}

          </div>


          {/* =================================================
              MESSAGES
          ================================================= */}

          <div className="
            max-h-64
            overflow-y-auto
            space-y-4
            pr-2
            text-left
          ">


            {messages
              ?.filter(
                (message) =>
                  !(
                    message.id === 1 &&
                    message.sender === 'assistant'
                  )
              )
              .map(
                (message) => (

              <div
                key={message.id}
                className={`
                  flex

                  ${
                    message.sender === 'user'
                      ? 'justify-end'
                      : 'justify-start'
                  }
                `}
              >

                <div
                  className={`
                    max-w-[80%]
                    px-4
                    py-3
                    rounded-2xl
                    text-sm
                    leading-relaxed

                    ${
                      message.sender === 'user'

                        ? `
                          bg-blue-600
                          text-white
                          rounded-br-md
                        `

                        : `
                          bg-slate-100
                          text-slate-700
                          rounded-bl-md
                        `
                    }
                  `}
                >

                  <p className="
                    text-[11px]
                    font-medium
                    mb-1
                    opacity-70
                  ">

                    {
                      message.sender === 'user'
                        ? 'You'
                        : message.sender === 'assistant'
                          ? 'AeroHealth AI'
                          : 'System'
                    }

                  </p>


                  <p className="
                    whitespace-pre-wrap
                  ">

                    {message.text}

                  </p>

                </div>

              </div>

            ))}


            {/* THINKING INDICATOR */}

            {isLoading && (

              <div className="
                flex
                justify-start
              ">

                <div className="
                  bg-slate-100
                  rounded-2xl
                  rounded-bl-md
                  px-4
                  py-3
                  text-sm
                  text-slate-400
                ">

                  AeroHealth AI is typing...

                </div>

              </div>

            )}


            {/* AUTO SCROLL TARGET */}

            <div
              ref={conversationEndRef}
            />

          </div>

        </div>

      </div>

    </div>

  );

}


export default VoiceChat;