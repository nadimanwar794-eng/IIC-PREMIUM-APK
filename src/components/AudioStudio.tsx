import React, { useState, useEffect } from 'react';
import { Play, Square, Volume2, RotateCcw, Copy, Check } from 'lucide-react';
import { Language } from '../types';

interface Props { language: Language; onBack: () => void; }

export const AudioStudio: React.FC<Props> = ({ language, onBack }) => {
  const [text, setText] = useState('');
  const [isPlaying, setIsPlaying] = useState(false);
  const [copied, setCopied] = useState(false);

  useEffect(() => { return () => window.speechSynthesis.cancel(); }, []);

  const handlePlay = () => {
    if (!text.trim()) return;
    window.speechSynthesis.cancel();
    const u = new SpeechSynthesisUtterance(text);
    const voices = window.speechSynthesis.getVoices();
    if (language === 'Hindi') u.lang = 'hi-IN'; else u.lang = 'en-US';
    u.voice = voices.find(v => v.lang.includes(u.lang)) || null;
    u.onend = () => setIsPlaying(false);
    u.onstart = () => setIsPlaying(true);
    window.speechSynthesis.speak(u);
  };

  const handleStop = () => { window.speechSynthesis.cancel(); setIsPlaying(false); };
  const handleCopy = () => { navigator.clipboard.writeText(text); setCopied(true); setTimeout(() => setCopied(false), 2000); };

  return (
    <div className="animate-in fade-in slide-in-from-right-8 duration-500 max-w-3xl mx-auto">
      <div className="flex items-center mb-8"><button onClick={onBack} className="text-slate-500 hover:text-slate-800 mr-4 font-bold">Back</button><h2 className="text-2xl font-bold flex items-center gap-2"><Volume2 className="text-blue-600"/> Audio Studio</h2></div>
      <div className="bg-white rounded-2xl shadow-sm border p-6">
        <div className="flex justify-between mb-4"><span className="font-bold text-slate-500 uppercase">Input Text ({language})</span><button onClick={handleCopy} className="text-blue-600 text-xs font-bold flex gap-1">{copied?<Check size={14}/>:<Copy size={14}/>} {copied?'Copied':'Copy'}</button></div>
        <textarea value={text} onChange={e=>setText(e.target.value)} placeholder={language==='Hindi'?"यहाँ लिखें...":"Type here..."} className="w-full h-64 p-4 bg-slate-50 border rounded-xl resize-none"/>
        <div className="mt-6 flex justify-center gap-4">
          {!isPlaying ? <button onClick={handlePlay} disabled={!text} className="flex gap-2 items-center bg-blue-600 text-white px-8 py-3 rounded-full font-bold shadow-lg disabled:opacity-50"><Play size={20}/> Play Audio</button> : <button onClick={handleStop} className="flex gap-2 items-center bg-red-500 text-white px-8 py-3 rounded-full font-bold shadow-lg"><Square size={20}/> Stop</button>}
          <button onClick={()=>setText('')} className="p-3 text-slate-500 hover:bg-slate-100 rounded-full"><RotateCcw size={20}/></button>
        </div>
        <p className="text-center text-xs text-slate-400 mt-4">Powered by Browser Speech Engine</p>
      </div>
    </div>
  );
};

