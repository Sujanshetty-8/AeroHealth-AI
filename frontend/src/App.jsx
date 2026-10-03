import { useState, useRef, useEffect } from 'react';
import VoiceChat from './components/VoiceChat';
import Header from './components/Header';
import ChatMessage from './components/ChatMessage';
import ChatInput from './components/ChatInput';
import LoadingIndicator from './components/LoadingIndicator';

import Login from './pages/Login';
import Signup from './pages/Signup';

import { supabase } from './lib/supabase';

import { useAudioRecorder } from './hooks/useAudioRecorder';

import {
  Bot,
  CalendarDays,
  ClipboardList,
  User,
  ArrowRight,
  LogOut,
  HeartPulse,
  Clock3,
  Stethoscope,
  MessageCircle,
  Mic,
} from 'lucide-react';


function App() {

  // =====================================================
  // AUTHENTICATION
  // =====================================================

  const [user, setUser] = useState(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [showSignup, setShowSignup] = useState(false);


  // =====================================================
  // CHECK SESSION
  // =====================================================

  useEffect(() => {

    const getSession = async () => {

      const {
        data: { session },
      } = await supabase.auth.getSession();

      setUser(session?.user ?? null);
      setAuthLoading(false);

    };

    getSession();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        setUser(session?.user ?? null);
      }
    );

    return () => {
      subscription.unsubscribe();
    };

  }, []);


  // =====================================================
  // LOGOUT
  // =====================================================

  const handleLogout = async () => {

    await supabase.auth.signOut();

    setUser(null);

  };


  // =====================================================
  // AUTH LOADING
  // =====================================================

  if (authLoading) {

    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="text-slate-600">
          Loading AeroHealth AI...
        </div>
      </div>
    );

  }


  // =====================================================
  // LOGIN / SIGNUP
  // =====================================================

  if (!user) {

    if (showSignup) {

      return (
        <Signup
          onSignup={(newUser) => {
            setUser(newUser);
          }}
          onBackToLogin={() => {
            setShowSignup(false);
          }}
        />
      );

    }

    return (
      <Login
        onLogin={(loggedInUser) => {
          setUser(loggedInUser);
        }}
        onCreateAccount={() => {
          setShowSignup(true);
        }}
      />
    );

  }


  // =====================================================
  // LOGGED-IN APPLICATION
  // =====================================================

  return (
    <Receptionist
      user={user}
      onLogout={handleLogout}
    />
  );

}


// =========================================================
// RECEPTIONIST COMPONENT
// =========================================================

function Receptionist({ user, onLogout }) {

  // =====================================================
  // PAGE
  // =====================================================

  const [page, setPage] = useState('home');


  // =====================================================
  // CURRENT APPOINTMENT
  // =====================================================

  const [appointment, setAppointment] = useState(null);
  const [appointmentLoading, setAppointmentLoading] = useState(true);


  // =====================================================
  // PAST RECORDS
  // =====================================================

  const [pastRecords, setPastRecords] = useState([]);
  const [pastRecordsLoading, setPastRecordsLoading] = useState(true);


  // =====================================================
  // PROFILE
  // =====================================================

  const [profile, setProfile] = useState(null);
  const [profileLoading, setProfileLoading] = useState(true);


  // =====================================================
  // CHAT
  // =====================================================

  const [messages, setMessages] = useState([
    {
      id: 1,
      sender: 'assistant',
      text:
        'Hello! I am the AeroHealth AI Receptionist. How can I help you today?',
    },
  ]);

  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [voiceMode, setVoiceMode] = useState(false);


  // =====================================================
  // SESSION ID
  // =====================================================

  const [sessionId] = useState(
    () =>
      Math.random()
        .toString(36)
        .substring(2, 15)
  );


  const messagesEndRef = useRef(null);
  const isSubmittingRef = useRef(false);


  // =====================================================
  // USERNAME
  // =====================================================

  const username =
    user?.email?.split('@')[0] || 'Patient';


  // =====================================================
  // FETCH CURRENT APPOINTMENT
  // =====================================================

  const fetchAppointment = async () => {

    if (!user?.id) {
      setAppointmentLoading(false);
      return;
    }

    setAppointmentLoading(true);

    try {

      const today =
        new Date()
          .toISOString()
          .split('T')[0];


      const {
        data,
        error,
      } = await supabase
        .from('appointments')
        .select(
          'id, user_id, slot_id, doctor_id, appointment_date, appointment_time, status'
        )
        .eq('user_id', user.id)
        .gte('appointment_date', today)
        .neq('status', 'cancelled')
        .order('appointment_date', {
          ascending: true,
        })
        .order('appointment_time', {
          ascending: true,
        })
        .limit(1);


      if (error) {

        console.error(
          'Error fetching appointment:',
          error
        );

        setAppointment(null);
        return;

      }


      if (!data || data.length === 0) {

        setAppointment(null);
        return;

      }


      const appointmentData = data[0];


      // Get doctor name
      const {
        data: doctorData,
        error: doctorError,
      } = await supabase
        .from('doctors')
        .select('name')
        .eq('id', appointmentData.doctor_id)
        .single();


      if (doctorError) {

        console.error(
          'Error fetching doctor:',
          doctorError
        );

      }


      setAppointment({
        ...appointmentData,
        doctor_name:
          doctorData?.name || 'Doctor',
      });


    } catch (error) {

      console.error(
        'Appointment fetch error:',
        error
      );

      setAppointment(null);

    } finally {

      setAppointmentLoading(false);

    }

  };


  // =====================================================
  // FETCH PAST APPOINTMENTS
  // =====================================================

  const fetchPastRecords = async () => {

    if (!user?.id) {

      setPastRecordsLoading(false);
      return;

    }

    setPastRecordsLoading(true);

    try {

      const today =
        new Date()
          .toISOString()
          .split('T')[0];


      const {
        data,
        error,
      } = await supabase
        .from('appointments')
        .select(
          'id, user_id, slot_id, doctor_id, appointment_date, appointment_time, status'
        )
        .eq('user_id', user.id)
        .lt('appointment_date', today)
        .order('appointment_date', {
          ascending: false,
        })
        .order('appointment_time', {
          ascending: false,
        });


      if (error) {

        console.error(
          'Error fetching past appointments:',
          error
        );

        setPastRecords([]);
        return;

      }


      if (!data || data.length === 0) {

        setPastRecords([]);
        return;

      }


      // Get doctor name for every appointment
      const recordsWithDoctors = await Promise.all(

        data.map(async (record) => {

          const {
            data: doctorData,
            error: doctorError,
          } = await supabase
            .from('doctors')
            .select('name')
            .eq('id', record.doctor_id)
            .single();


          if (doctorError) {

            console.error(
              'Error fetching doctor for past record:',
              doctorError
            );

          }


          return {
            ...record,
            doctor_name:
              doctorData?.name || 'Doctor',
          };

        })

      );


      setPastRecords(recordsWithDoctors);


    } catch (error) {

      console.error(
        'Past records fetch error:',
        error
      );

      setPastRecords([]);

    } finally {

      setPastRecordsLoading(false);

    }

  };


  // =====================================================
  // FETCH USER PROFILE
  // =====================================================

  const fetchProfile = async () => {

    if (!user?.id) {

      setProfileLoading(false);
      return;

    }

    setProfileLoading(true);

    try {

      const {
        data,
        error,
      } = await supabase
        .from('profiles')
        .select(
          'id, name, age, phone, username, created_at'
        )
        .eq('id', user.id)
        .single();


      if (error) {

        console.error(
          'Error fetching profile:',
          error
        );

        setProfile(null);
        return;

      }


      setProfile(data);


    } catch (error) {

      console.error(
        'Profile fetch error:',
        error
      );

      setProfile(null);

    } finally {

      setProfileLoading(false);

    }

  };


  // =====================================================
  // FETCH DASHBOARD DATA
  // =====================================================

  useEffect(() => {

    if (page === 'home') {

      fetchAppointment();
      fetchPastRecords();
      fetchProfile();

    }

  }, [user?.id, page]);


  // =====================================================
  // AUDIO / SPEECH TO TEXT
  // =====================================================

  const handleAudioSubmit = async (audioBlob) => {

    if (isSubmittingRef.current) return;

    try {

      const formData = new FormData();

      formData.append(
        'audio',
        audioBlob,
        'recording.webm'
      );


      const transcribeRes = await fetch(
        '/transcribe',
        {
          method: 'POST',
          body: formData,
        }
      );


      if (!transcribeRes.ok) {

        throw new Error(
          'Transcription failed'
        );

      }


      const transcribeData =
        await transcribeRes.json();


      const transcribedText =
        transcribeData.text;


      if (
        !transcribedText ||
        transcribedText.trim() === ''
      ) {

        return;

      }


      setInput(transcribedText);


    } catch (error) {

      console.error(
        'Error:',
        error
      );


      const errorMessage = {
        id: Date.now() + 1,
        sender: 'system',
        text:
          'Sorry, there was an error processing your voice message.',
      };


      setMessages((prev) => [
        ...prev,
        errorMessage,
      ]);

    }

  };


  const {
    isRecording,
    toggleRecording,
  } = useAudioRecorder(
    setInput,
    handleAudioSubmit
  );


  // =====================================================
  // SCROLL CHAT TO BOTTOM
  // =====================================================

  const scrollToBottom = () => {

    messagesEndRef.current?.scrollIntoView({
      behavior: 'smooth',
    });

  };


  useEffect(() => {

    if (page === 'chat') {
      scrollToBottom();
    }

  }, [messages, page]);


  // =====================================================
// SEND MESSAGE TO AI
// =====================================================

const sendMessage = async (messageText) => {

  if (!messageText?.trim()) return;

  const userMessage = {
    id: Date.now(),
    sender: 'user',
    text: messageText.trim(),
  };

  setMessages(prev => [
    ...prev,
    userMessage
  ]);

  setInput('');
  setIsLoading(true);


  try {

    const response = await fetch(
      '/chat',
      {
        method: 'POST',

        headers: {
          'Content-Type': 'application/json',
        },

        body: JSON.stringify({
          session_id: sessionId,
          message: userMessage.text,
          user_id: user.id,
        }),

      }
    );


    if (!response.ok) {
      throw new Error(
        'Failed to get response'
      );
    }


    const data =
      await response.json();


    const assistantMessage = {

      id: Date.now() + 1,

      sender: 'assistant',

      text: data.reply,

      isBookingComplete:
        data.booking_complete,

    };


    setMessages(prev => [
      ...prev,
      assistantMessage
    ]);


    if (data.booking_complete) {
      await fetchAppointment();
    }

    return data.reply;


  } catch (error) {

    console.error(
      'Error:',
      error
    );


    const errorMessage = {

      id: Date.now() + 1,

      sender: 'system',

      text:
        'Sorry, there was an error connecting to the server. Please ensure the backend is running.',

    };


    setMessages(prev => [
      ...prev,
      errorMessage
    ]);

  } finally {

    setIsLoading(false);

    isSubmittingRef.current = false;

  }

};


// =====================================================
// TEXT CHAT SUBMIT
// =====================================================

const handleSubmit = async (e) => {

  e.preventDefault();

  if (!input.trim()) return;

  if (isLoading) return;

  isSubmittingRef.current = true;

  await sendMessage(
    input.trim()
  );

};


  // =====================================================
  // FORMAT DATE
  // =====================================================

  const formatDate = (dateString) => {

    if (!dateString) return '';

    const date = new Date(
      `${dateString}T00:00:00`
    );


    return date.toLocaleDateString(
      'en-IN',
      {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
      }
    );

  };


  // =====================================================
  // FORMAT TIME
  // =====================================================

  const formatTime = (timeString) => {

    if (!timeString) return '';

    const [hour, minute] =
      timeString.split(':');


    const date = new Date();

    date.setHours(
      Number(hour),
      Number(minute),
      0,
      0
    );


    return date.toLocaleTimeString(
      'en-IN',
      {
        hour: 'numeric',
        minute: '2-digit',
        hour12: true,
      }
    );

  };


  // =====================================================
  // HOME / DASHBOARD
  // =====================================================

  if (page === 'home') {

    return (

      <div className="min-h-screen bg-slate-50 font-sans">

        <Header />


        {/* =================================================
            USER BAR
        ================================================= */}

        <div className="bg-white border-b px-6 py-3">

          <div className="max-w-6xl mx-auto flex items-center justify-between">

            <div className="text-sm text-slate-600">

              Welcome back,

              <span className="font-semibold text-slate-800 ml-1">

                {username}

              </span>

            </div>


            <button
              onClick={onLogout}
              className="flex items-center gap-2 text-sm text-red-600 hover:text-red-700 font-medium"
            >

              <LogOut size={16} />

              Logout

            </button>

          </div>

        </div>


        {/* =================================================
            MAIN
        ================================================= */}

        <main className="max-w-6xl mx-auto px-6 py-10">


          {/* =================================================
              GREETING
          ================================================= */}

          <div className="mb-8">

            <p className="text-blue-600 font-medium mb-2">

              AeroHealth AI

            </p>


            <h1 className="text-3xl sm:text-4xl font-bold text-slate-800">

              Good to see you, {username} 👋

            </h1>


            <p className="text-slate-500 mt-2">

              Your personal healthcare assistant is ready to help.

            </p>

          </div>


          {/* =================================================
              AI AGENT
          ================================================= */}

          <div className="relative overflow-hidden bg-gradient-to-r from-blue-600 to-blue-500 rounded-3xl p-7 sm:p-9 text-white shadow-lg mb-8">

            <div className="relative flex flex-col md:flex-row md:items-center md:justify-between gap-7">

              <div className="flex items-start gap-5">

                <div className="w-16 h-16 rounded-2xl bg-white/15 flex items-center justify-center shrink-0">

                  <Bot size={34} />

                </div>


                <div>

                  <div className="flex items-center gap-2 mb-2">

                    <span className="w-2.5 h-2.5 bg-green-300 rounded-full" />

                    <span className="text-sm text-blue-100">

                      AI Receptionist Online

                    </span>

                  </div>


                  <h2 className="text-2xl font-bold">

                    Talk to AeroHealth AI

                  </h2>


                  <p className="text-blue-100 mt-2 max-w-xl">

                    Book appointments, find available doctors,
                    and get assistance from our AI healthcare receptionist.

                  </p>

                </div>

              </div>


              <button
                onClick={() => setPage('chat')}
                className="relative flex items-center justify-center gap-2 bg-white text-blue-600 font-semibold px-6 py-3 rounded-xl hover:bg-blue-50 transition shadow-sm whitespace-nowrap"
              >

                <MessageCircle size={19} />

                Talk to AI

                <ArrowRight size={18} />

              </button>

            </div>

          </div>


          {/* =================================================
              DASHBOARD CARDS
          ================================================= */}

          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">


            {/* =================================================
                CURRENT APPOINTMENT
            ================================================= */}

            <div className="bg-white rounded-2xl border border-slate-200 p-6 hover:shadow-md transition">

              <div className="flex items-center justify-between mb-5">

                <div className="w-11 h-11 rounded-xl bg-blue-50 flex items-center justify-center">

                  <CalendarDays
                    size={22}
                    className="text-blue-600"
                  />

                </div>


                <span className="text-xs font-medium text-slate-400">

                  UPCOMING

                </span>

              </div>


              <h3 className="font-semibold text-slate-800 text-lg">

                Current Appointment

              </h3>


              {appointmentLoading && (

                <div className="mt-3">

                  <p className="text-sm text-slate-400">

                    Loading appointment...

                  </p>

                </div>

              )}


              {!appointmentLoading && !appointment && (

                <>

                  <p className="text-sm text-slate-500 mt-2">

                    No upcoming appointments.

                  </p>


                  <button
                    onClick={() => setPage('chat')}
                    className="mt-5 text-sm text-blue-600 font-medium flex items-center gap-1 hover:gap-2 transition-all"
                  >

                    Book an appointment

                    <ArrowRight size={15} />

                  </button>

                </>

              )}


              {!appointmentLoading && appointment && (

                <div className="mt-4 space-y-3">


                  <div>

                    <p className="text-xs text-slate-400">
                      Doctor
                    </p>

                    <p className="font-semibold text-slate-800">
                      {appointment.doctor_name}
                    </p>

                  </div>


                  <div className="flex items-center gap-2 text-sm text-slate-600">

                    <CalendarDays size={16} />

                    <span>
                      {formatDate(
                        appointment.appointment_date
                      )}
                    </span>

                  </div>


                  <div className="flex items-center gap-2 text-sm text-slate-600">

                    <Clock3 size={16} />

                    <span>
                      {formatTime(
                        appointment.appointment_time
                      )}
                    </span>

                  </div>


                  <div className="pt-2">

                    <span className="inline-flex px-3 py-1 rounded-full bg-green-50 text-green-600 text-xs font-medium capitalize">

                      {appointment.status || 'Confirmed'}

                    </span>

                  </div>

                </div>

              )}

            </div>


            {/* =================================================
                PAST RECORDS
            ================================================= */}

            <div className="bg-white rounded-2xl border border-slate-200 p-6 hover:shadow-md transition">

              <div className="flex items-center justify-between mb-5">

                <div className="w-11 h-11 rounded-xl bg-purple-50 flex items-center justify-center">

                  <ClipboardList
                    size={22}
                    className="text-purple-600"
                  />

                </div>


                <span className="text-xs font-medium text-slate-400">

                  HISTORY

                </span>

              </div>


              <h3 className="font-semibold text-slate-800 text-lg">

                Past Records

              </h3>


              {pastRecordsLoading && (

                <p className="text-sm text-slate-400 mt-3">

                  Loading records...

                </p>

              )}


              {!pastRecordsLoading &&
                pastRecords.length === 0 && (

                  <p className="text-sm text-slate-500 mt-3">

                    No previous appointments found.

                  </p>

              )}


              {!pastRecordsLoading &&
                pastRecords.length > 0 && (

                  <div className="mt-4 space-y-3">

                    {pastRecords
                      .slice(0, 3)
                      .map((record) => (

                        <div
                          key={record.id}
                          className="border border-slate-100 rounded-xl p-3 bg-slate-50"
                        >

                          <p className="font-medium text-slate-800 text-sm">

                            {record.doctor_name}

                          </p>


                          <div className="flex items-center gap-2 text-xs text-slate-500 mt-1">

                            <CalendarDays size={13} />

                            <span>
                              {formatDate(
                                record.appointment_date
                              )}
                            </span>


                            <Clock3 size={13} />

                            <span>
                              {formatTime(
                                record.appointment_time
                              )}
                            </span>

                          </div>


                          <span className="inline-flex mt-2 px-2 py-1 rounded-full bg-slate-200 text-slate-600 text-[11px] font-medium capitalize">

                            {record.status || 'completed'}

                          </span>

                        </div>

                    ))}


                    {pastRecords.length > 3 && (

                      <p className="text-xs text-purple-600 font-medium pt-1">

                        + {pastRecords.length - 3} more previous appointments

                      </p>

                    )}

                  </div>

              )}

            </div>


            {/* =================================================
                PROFILE
            ================================================= */}

            <div className="bg-white rounded-2xl border border-slate-200 p-6 hover:shadow-md transition">

              <div className="flex items-center justify-between mb-5">

                <div className="w-11 h-11 rounded-xl bg-green-50 flex items-center justify-center">

                  <User
                    size={22}
                    className="text-green-600"
                  />

                </div>


                <span className="text-xs font-medium text-slate-400">

                  PROFILE

                </span>

              </div>


              <h3 className="font-semibold text-slate-800 text-lg">

                My Profile

              </h3>


              {profileLoading && (

                <p className="text-sm text-slate-400 mt-3">

                  Loading profile...

                </p>

              )}


              {!profileLoading && profile && (

                <div className="mt-4 space-y-2.5 text-sm">


                  {/* NAME */}

                  <div className="flex justify-between gap-3">

                    <span className="text-slate-400">
                      Name
                    </span>

                    <span className="font-medium text-slate-700 text-right">

                      {profile.name || 'Not provided'}

                    </span>

                  </div>


                  {/* USERNAME */}

                  <div className="flex justify-between gap-3">

                    <span className="text-slate-400">
                      Username
                    </span>

                    <span className="font-medium text-slate-700 text-right">

                      {profile.username || username}

                    </span>

                  </div>


                  {/* AGE */}

                  <div className="flex justify-between gap-3">

                    <span className="text-slate-400">
                      Age
                    </span>

                    <span className="font-medium text-slate-700 text-right">

                      {profile.age ?? 'Not provided'}

                    </span>

                  </div>


                  {/* PHONE */}

                  <div className="flex justify-between gap-3">

                    <span className="text-slate-400">
                      Phone
                    </span>

                    <span className="font-medium text-slate-700 text-right">

                      {profile.phone || 'Not provided'}

                    </span>

                  </div>

                </div>

              )}


              {!profileLoading && !profile && (

                <p className="text-sm text-slate-500 mt-3">

                  Profile information is not available.

                </p>

              )}

            </div>

          </div>


          {/* =================================================
              QUICK ACTIONS
          ================================================= */}

          <div className="mt-8">

            <h2 className="text-lg font-semibold text-slate-800 mb-4">

              Quick Actions

            </h2>


            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">


              {/* FIND DOCTOR */}

              <button
                onClick={() => setPage('chat')}
                className="bg-white border border-slate-200 rounded-xl p-4 text-left hover:border-blue-300 hover:shadow-sm transition"
              >

                <Stethoscope
                  size={21}
                  className="text-blue-600 mb-3"
                />


                <p className="font-medium text-slate-800">

                  Find a Doctor

                </p>


                <p className="text-xs text-slate-500 mt-1">

                  Ask the AI

                </p>

              </button>


              {/* BOOK APPOINTMENT */}

              <button
                onClick={() => setPage('chat')}
                className="bg-white border border-slate-200 rounded-xl p-4 text-left hover:border-blue-300 hover:shadow-sm transition"
              >

                <CalendarDays
                  size={21}
                  className="text-blue-600 mb-3"
                />


                <p className="font-medium text-slate-800">

                  Book Appointment

                </p>


                <p className="text-xs text-slate-500 mt-1">

                  Use AI receptionist

                </p>

              </button>


              {/* HEALTH ASSISTANCE */}

              <button
                onClick={() => setPage('chat')}
                className="bg-white border border-slate-200 rounded-xl p-4 text-left hover:border-blue-300 hover:shadow-sm transition"
              >

                <HeartPulse
                  size={21}
                  className="text-blue-600 mb-3"
                />


                <p className="font-medium text-slate-800">

                  Health Assistance

                </p>


                <p className="text-xs text-slate-500 mt-1">

                  Ask a question

                </p>

              </button>


              {/* AI RECEPTIONIST */}

              <button
                onClick={() => setPage('chat')}
                className="bg-white border border-slate-200 rounded-xl p-4 text-left hover:border-blue-300 hover:shadow-sm transition"
              >

                <Bot
                  size={21}
                  className="text-blue-600 mb-3"
                />


                <p className="font-medium text-slate-800">

                  AI Receptionist

                </p>


                <p className="text-xs text-slate-500 mt-1">

                  Start conversation

                </p>

              </button>

            </div>

          </div>

        </main>

      </div>

    );

  }


// =====================================================
// CHAT PAGE
// =====================================================

return (

  <div className="
    flex
    flex-col
    h-[100dvh]
    overflow-hidden
    bg-slate-50
    font-sans
  ">


    {/* =================================================
        CHAT HEADER
    ================================================= */}

    <div className="
      bg-white
      border-b
      border-slate-200
      shrink-0
    ">

      <div className="
        flex
        items-center
        justify-between
        px-4
        sm:px-6
        py-3
        max-w-7xl
        mx-auto
      ">


        {/* BACK */}

        <button
          onClick={() => setPage('home')}
          className="
            flex
            items-center
            gap-2
            text-sm
            text-slate-600
            hover:text-blue-600
            font-medium
            transition
          "
        >

          ← Back to Home

        </button>


        {/* STATUS */}

        <div className="
          flex
          items-center
          gap-2
        ">

          <div className="
            w-2.5
            h-2.5
            bg-green-500
            rounded-full
          " />

          <span className="
            text-sm
            text-slate-600
            hidden
            sm:block
          ">

            AI Receptionist Online

          </span>

        </div>


        {/* LOGOUT */}

        <button
          onClick={onLogout}
          className="
            flex
            items-center
            gap-2
            text-sm
            text-red-600
            hover:text-red-700
            font-medium
          "
        >

          <LogOut size={16} />

          Logout

        </button>

      </div>

    </div>


    {/* =================================================
        CONTENT
    ================================================= */}

    <div className="
      flex
      flex-1
      min-h-0
      max-w-7xl
      w-full
      mx-auto
    ">


      {/* =================================================
          LEFT MODE SIDEBAR
      ================================================= */}

      <aside className="
        hidden
        md:flex
        w-56
        shrink-0
        bg-white
        border-r
        border-slate-200
        p-4
        flex-col
      ">


        <div className="
          text-xs
          font-semibold
          text-slate-400
          uppercase
          tracking-wider
          px-3
          mb-3
        ">

          Conversation

        </div>


        {/* TEXT CHAT */}

        <button
          onClick={() => setVoiceMode(false)}
          className={`
            flex
            items-center
            gap-3
            px-4
            py-3
            rounded-xl
            text-sm
            font-medium
            transition
            ${
              !voiceMode
                ? 'bg-blue-50 text-blue-600'
                : 'text-slate-600 hover:bg-slate-50'
            }
          `}
        >

          <MessageCircle
            size={19}
          />

          Text Chat

        </button>


        {/* VOICE CHAT */}

        <button
          onClick={() => setVoiceMode(true)}
          className={`
            flex
            items-center
            gap-3
            px-4
            py-3
            mt-2
            rounded-xl
            text-sm
            font-medium
            transition
            ${
              voiceMode
                ? 'bg-blue-50 text-blue-600'
                : 'text-slate-600 hover:bg-slate-50'
            }
          `}
        >

          <Mic
            size={19}
          />

          Voice Chat

        </button>


        <div className="
          mt-auto
          p-4
          rounded-xl
          bg-slate-50
          border
          border-slate-100
        ">

          <p className="
            text-xs
            font-medium
            text-slate-700
          ">

            AeroHealth AI

          </p>

          <p className="
            text-xs
            text-slate-400
            mt-1
            leading-relaxed
          ">

            Choose how you'd like to
            communicate with your
            AI receptionist.

          </p>

        </div>

      </aside>


      {/* =================================================
          MAIN CHAT / VOICE AREA
      ================================================= */}

      <div className="
        flex
        flex-col
        flex-1
        min-w-0
        min-h-0
      ">


        {/* ===============================================
            MOBILE MODE SWITCHER
        =============================================== */}

        <div className="
          md:hidden
          flex
          gap-2
          p-3
          bg-white
          border-b
          border-slate-200
        ">


          <button
            onClick={() => setVoiceMode(false)}
            className={`
              flex-1
              flex
              items-center
              justify-center
              gap-2
              py-2.5
              rounded-xl
              text-sm
              font-medium
              ${
                !voiceMode
                  ? 'bg-blue-50 text-blue-600'
                  : 'bg-slate-50 text-slate-500'
              }
            `}
          >

            <MessageCircle size={17} />

            Text Chat

          </button>


          <button
            onClick={() => setVoiceMode(true)}
            className={`
              flex-1
              flex
              items-center
              justify-center
              gap-2
              py-2.5
              rounded-xl
              text-sm
              font-medium
              ${
                voiceMode
                  ? 'bg-blue-50 text-blue-600'
                  : 'bg-slate-50 text-slate-500'
              }
            `}
          >

            <Mic size={17} />

            Voice Chat

          </button>

        </div>


        {/* ===============================================
            VOICE MODE
        =============================================== */}

        {voiceMode ? (

          <VoiceChat

            onBack={() =>
              setVoiceMode(false)
            }

            onSendMessage={
              sendMessage
            }

            messages={messages}

            isLoading={isLoading}

          />

        ) : (


          /* =============================================
             TEXT MODE
          ============================================= */

          <>

            {/* CHAT MESSAGES */}

            <main className="
              flex-1
              overflow-y-auto
              p-4
              sm:p-6
              w-full
            ">

              <div className="
                flex
                flex-col
                space-y-6
                pb-6
                max-w-4xl
                mx-auto
              ">


                {messages.map((msg) => (

                  <ChatMessage
                    key={msg.id}
                    msg={msg}
                  />

                ))}


                {isLoading && (

                  <LoadingIndicator />

                )}


                <div
                  ref={messagesEndRef}
                />

              </div>

            </main>


            {/* TEXT INPUT */}

            <div className="
              shrink-0
              bg-white
              border-t
              border-slate-200
              p-3
              sm:p-4
            ">

              <div className="
                max-w-4xl
                mx-auto
              ">

                <ChatInput

                  input={input}

                  setInput={setInput}

                  isLoading={isLoading}

                  handleSubmit={
                    handleSubmit
                  }

                  isRecording={false}

                  toggleRecording={() =>
                    setVoiceMode(true)
                  }

                />

              </div>

            </div>

          </>

        )}

      </div>

    </div>

  </div>

);

}


export default App;