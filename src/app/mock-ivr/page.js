"use client";

import { useState, useRef, useEffect } from "react";
import { Phone, PhoneOff, Delete, Hash, Globe, Loader2, Send, CheckCircle2 } from "lucide-react";
import Link from "next/link";

export default function MockIvrPage() {
  const [phoneNumber, setPhoneNumber] = useState("9876543210");
  const [digits, setDigits] = useState("");
  const [log, setLog] = useState([]);
  const [loading, setLoading] = useState(false);
  const [botMessage, setBotMessage] = useState("Call not started. Enter phone number and press Dial.");
  const [isCalling, setIsCalling] = useState(false);
  const [isCompleted, setIsCompleted] = useState(false);

  const logEndRef = useRef(null);

  useEffect(() => {
    logEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [log]);

  const addLog = (side, msg) => {
    setLog(prev => [...prev, { side, msg, time: new Date().toLocaleTimeString() }]);
  };

  const handleDial = async () => {
    if (!phoneNumber) return;
    setLoading(true);
    setIsCalling(true);
    setLog([]);
    setDigits("");
    setIsCompleted(false);

    try {
      const formData = new FormData();
      formData.append("CallFrom", phoneNumber);
      formData.append("Digits", "");

      const res = await fetch("/api/ivr/webhook", {
        method: "POST",
        body: formData,
      });

      const xml = await res.text();
      const sayMatch = xml.match(/<Say>(.*?)<\/Say>/);
      const message = sayMatch ? sayMatch[1] : "System Error: No message from bot.";
      
      setBotMessage(message);
      addLog("bot", message);
    } catch (e) {
      addLog("error", "Failed to connect to IVR Webhook.");
    } finally {
      setLoading(false);
    }
  };

  const sendDigits = async (forcedDigits = null) => {
    const digitToSend = forcedDigits !== null ? forcedDigits : digits;
    if (digitToSend === "" && isCalling) return;

    setLoading(true);
    addLog("user", digitToSend || "(Started Call)");
    setDigits("");

    try {
      const formData = new FormData();
      formData.append("CallFrom", phoneNumber);
      formData.append("Digits", digitToSend);

      const res = await fetch("/api/ivr/webhook", {
        method: "POST",
        body: formData,
      });

      const xml = await res.text();
      const sayMatch = xml.match(/<Say>(.*?)<\/Say>/);
      const message = sayMatch ? sayMatch[1] : "System Error: No message from bot.";
      
      setBotMessage(message);
      addLog("bot", message);

      if (xml.includes("<Hangup/>") || message.toLowerCase().includes("successfully") || message.toLowerCase().includes("goodbye")) {
        setIsCalling(false);
        setIsCompleted(true);
      }
    } catch (e) {
      addLog("error", "Failed to connect to IVR Webhook.");
    } finally {
      setLoading(false);
    }
  };

  const pressKey = (key) => {
    if (!isCalling) return;
    setDigits(prev => prev + key);
  };

  return (
    <div className="min-h-screen bg-slate-900 text-slate-100 flex flex-col items-center p-4 md:p-10 font-sans">
      
      {/* Header */}
      <div className="max-w-4xl w-full flex flex-col md:flex-row justify-between items-center gap-6 mb-10">
        <div>
          <h1 className="text-4xl font-black tracking-tight flex items-center gap-3">
            <span className="p-2 bg-emerald-600 rounded-2xl shadow-lg shadow-emerald-900/20">
              <Phone className="w-8 h-8 text-white" />
            </span>
            IVR <span className="text-emerald-500">Simulator</span>
          </h1>
          <p className="text-slate-400 font-medium mt-2">Hackathon Debug Tool — Test your voicebot without a real phone.</p>
        </div>
        <Link href="/admin" className="text-xs font-bold text-slate-400 hover:text-white transition uppercase tracking-widest border border-slate-700 px-4 py-2 rounded-full">
          Back to Admin
        </Link>
      </div>

      <div className="max-w-6xl w-full grid grid-cols-1 lg:grid-cols-2 gap-8 items-start">
        
        {/* Left: Interactive Phone UI */}
        <div className="bg-slate-800 rounded-[3rem] p-8 border border-slate-700 shadow-2xl flex flex-col items-center">
          
          {/* Mock Phone Screen */}
          <div className="w-full bg-slate-950 rounded-[2rem] p-6 mb-8 border border-slate-800 min-h-[160px] flex flex-col items-center justify-center text-center relative overflow-hidden">
            <div className="absolute top-2 left-1/2 -translate-x-1/2 w-16 h-1 bg-slate-800 rounded-full" />
            
            {loading ? (
              <Loader2 className="w-10 h-10 text-emerald-500 animate-spin" />
            ) : (
              <div className="animate-in fade-in zoom-in duration-300">
                <p className="text-xs font-black text-emerald-500 uppercase tracking-widest mb-2">
                  {isCalling ? "🟢 On Call..." : isCompleted ? "⚪ Call Ended" : "🔴 Ready"}
                </p>
                <h2 className="text-lg font-bold text-slate-200 leading-tight">
                  {botMessage}
                </h2>
              </div>
            )}
          </div>

          {/* Controls */}
          <div className="w-full flex flex-col gap-4">
            {!isCalling ? (
              <div className="flex flex-col gap-2">
                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Caller Phone Number</label>
                <div className="flex gap-2">
                  <input 
                    type="tel"
                    value={phoneNumber}
                    onChange={e => setPhoneNumber(e.target.value)}
                    placeholder="Enter phone number"
                    className="flex-1 bg-slate-900 border border-slate-700 rounded-2xl px-4 py-3 text-lg font-mono focus:ring-2 focus:ring-emerald-500 outline-none"
                  />
                  <button 
                    onClick={handleDial}
                    className="bg-emerald-600 hover:bg-emerald-500 text-white p-4 rounded-2xl transition shadow-lg shadow-emerald-900/40 active:scale-95"
                  >
                    <Phone className="w-6 h-6" />
                  </button>
                </div>
              </div>
            ) : (
              <div className="flex flex-col gap-6 items-center">
                
                {/* Input Display */}
                <div className="bg-slate-900 w-full rounded-2xl px-6 py-4 flex items-center justify-between border border-slate-700">
                  <span className="text-2xl font-mono tracking-tighter text-emerald-400">{digits || "..."}</span>
                  <button onClick={() => setDigits("")} className="text-slate-500 hover:text-rose-500 transition">
                    <Delete className="w-5 h-5" />
                  </button>
                </div>

                {/* Keypad */}
                <div className="grid grid-cols-3 gap-4">
                  {["1", "2", "3", "4", "5", "6", "7", "8", "9", "*", "0", "#"].map(key => (
                    <button
                      key={key}
                      onClick={() => pressKey(key)}
                      className="w-16 h-16 bg-slate-700 hover:bg-slate-600 rounded-full flex flex-col items-center justify-center text-xl font-bold transition border border-slate-600 active:scale-90"
                    >
                      {key}
                      {key === "1" && <span className="text-[8px] opacity-40">VOICE</span>}
                      {key === "2" && <span className="text-[8px] opacity-40">ABC</span>}
                    </button>
                  ))}
                </div>

                <div className="flex gap-4 w-full">
                  <button 
                    onClick={() => setIsCalling(false)}
                    className="flex-1 bg-rose-600 hover:bg-rose-500 text-white py-4 rounded-2xl font-black uppercase tracking-widest flex items-center justify-center gap-2 transition active:scale-95"
                  >
                    <PhoneOff className="w-5 h-5" /> End Call
                  </button>
                  <button 
                    onClick={() => sendDigits()}
                    disabled={loading || !digits}
                    className="flex-1 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white py-4 rounded-2xl font-black uppercase tracking-widest flex items-center justify-center gap-2 transition active:scale-95"
                  >
                    <Send className="w-5 h-5" /> Submit
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Right: Live Log */}
        <div className="flex flex-col gap-4 h-full lg:max-h-[700px]">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-black text-slate-500 uppercase tracking-[0.2em] flex items-center gap-2">
              <Globe className="w-4 h-4" /> Live Webhook Log
            </h3>
            {isCompleted && (
              <span className="flex items-center gap-1 text-[10px] bg-emerald-900/30 text-emerald-400 font-black px-2 py-1 rounded-full border border-emerald-900/50">
                <CheckCircle2 className="w-3 h-3" /> SESSION SAVED
              </span>
            )}
          </div>
          
          <div className="flex-1 bg-slate-950 border border-slate-800 rounded-[2rem] p-6 overflow-y-auto flex flex-col gap-4 scrollbar-hide shadow-inner">
            {log.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-slate-700 gap-2 opacity-50">
                <Phone className="w-8 h-8" />
                <p className="text-sm font-medium italic">Waiting for call activity...</p>
              </div>
            ) : (
              log.map((entry, i) => (
                <div key={i} className={`flex flex-col ${entry.side === 'user' ? 'items-end' : entry.side === 'error' ? 'items-center' : 'items-start'} animate-in slide-in-from-bottom-2 duration-300`}>
                  <div className={`max-w-[85%] px-4 py-3 rounded-2xl text-sm font-medium ${
                    entry.side === 'user' 
                      ? 'bg-emerald-600 text-white rounded-br-none' 
                      : entry.side === 'error'
                        ? 'bg-rose-900/40 text-rose-400 border border-rose-900/50'
                        : 'bg-slate-800 text-slate-200 rounded-bl-none border border-slate-700'
                  }`}>
                    {entry.msg}
                  </div>
                  <span className="text-[9px] font-black text-slate-600 mt-1 uppercase tracking-tighter">
                    {entry.side === 'user' ? 'Dialed Digits' : entry.side === 'bot' ? 'Bot Response' : 'System Message'} • {entry.time}
                  </span>
                </div>
              ))
            )}
            <div ref={logEndRef} />
          </div>
          
          {/* Quick Shortcuts (Hackathon Special) */}
          <div className="bg-slate-800/50 border border-slate-700 p-4 rounded-2xl">
            <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-3">Quick Scenarios</p>
            <div className="flex flex-wrap gap-2">
              <button 
                onClick={() => { if(!isCalling) handleDial(); else sendDigits("1"); }}
                className="text-[10px] font-bold bg-slate-700 hover:bg-slate-600 px-3 py-1.5 rounded-lg border border-slate-600"
              >
                💧 Water Request
              </button>
              <button 
                onClick={() => { if(!isCalling) handleDial(); else sendDigits("2"); }}
                className="text-[10px] font-bold bg-slate-700 hover:bg-slate-600 px-3 py-1.5 rounded-lg border border-slate-600"
              >
                ⚡ Electricity Bill
              </button>
              <button 
                onClick={() => { if(!isCalling) handleDial(); else sendDigits("3"); }}
                className="text-[10px] font-bold bg-slate-700 hover:bg-slate-600 px-3 py-1.5 rounded-lg border border-slate-600"
              >
                🥘 Surplus Food
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
