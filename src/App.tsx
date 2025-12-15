import React, { useState, useEffect } from 'react';
import { 
  ClassLevel, Subject, Chapter, AppState, Board, Stream, User, ContentType, SystemSettings
} from './types';
import { fetchChapters, fetchLessonContent } from './services/gemini';
import { BoardSelection } from './components/BoardSelection';
import { ClassSelection } from './components/ClassSelection';
import { SubjectSelection } from './components/SubjectSelection';
import { ChapterSelection } from './components/ChapterSelection';
import { StreamSelection } from './components/StreamSelection';
import { LessonView } from './components/LessonView';
import { Auth } from './components/Auth';
import { AdminDashboard } from './components/AdminDashboard';
import { StudentDashboard } from './components/StudentDashboard';
import { WelcomePopup } from './components/WelcomePopup';
import { PremiumModal } from './components/PremiumModal';
import { LoadingOverlay } from './components/LoadingOverlay';
import { RulesPage } from './components/RulesPage';
import { IICPage } from './components/IICPage';
import { BrainCircuit, Newspaper, KeyRound, Lock, EyeOff, LogOut, FileText } from 'lucide-react';

const TermsPopup: React.FC<{ onClose: () => void }> = ({ onClose }) => (
    <div className="fixed inset-0 z-[100] bg-black/60 backdrop-blur-sm flex items-end md:items-center justify-center p-0 md:p-4 animate-in fade-in duration-300">
        <div className="bg-white w-full max-w-lg md:rounded-3xl rounded-t-3xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
            <div className="bg-white p-6 border-b border-slate-100 flex justify-between items-center sticky top-0 z-10">
                <h3 className="text-xl font-black text-slate-900 flex items-center gap-2">
                    <FileText className="text-blue-600" /> Terms & Conditions
                </h3>
            </div>
            <div className="p-6 overflow-y-auto space-y-4 text-sm text-slate-600 leading-relaxed custom-scrollbar">
                <p className="text-slate-900 font-medium">Please read carefully before using NST AI Assistant.</p>
                <div className="space-y-3">
                    <div className="bg-slate-50 p-3 rounded-lg border border-slate-100">
                        <strong className="block text-slate-800 mb-1">1. Educational Use Only</strong>
                        This app uses AI to generate content. Always verify important information with your official textbooks.
                    </div>
                    <div className="bg-slate-50 p-3 rounded-lg border border-slate-100">
                        <strong className="block text-slate-800 mb-1">2. Data Privacy</strong>
                        Your progress and notes are stored locally on your device. We do not sell your personal data.
                    </div>
                </div>
                <p className="text-xs text-slate-400 mt-4">By continuing, you agree to abide by these rules.</p>
            </div>
            <div className="p-4 border-t border-slate-100 bg-white sticky bottom-0 z-10">
                <button onClick={onClose} className="w-full bg-blue-600 hover:opacity-90 text-white font-bold py-3.5 rounded-xl shadow-lg transition-all active:scale-95">I Agree & Continue</button>
            </div>
        </div>
    </div>
);

const App: React.FC = () => {
  const [state, setState] = useState<AppState>({
    user: null, originalAdmin: null, view: 'BOARDS', selectedBoard: null, selectedClass: null, selectedStream: null, selectedSubject: null, selectedChapter: null, chapters: [], lessonContent: null, loading: false, error: null, language: 'English', showWelcome: false, globalMessage: null,
    settings: {
        appName: 'NST', themeColor: '#3b82f6', maintenanceMode: false, customCSS: '', apiKeys: [], chatCost: 1, dailyReward: 3, signupBonus: 2, isChatEnabled: true, isGameEnabled: true, allowSignup: true, loginMessage: '', allowedClasses: ['6','7','8','9','10','11','12'], storageCapacity: '100 GB', isPaymentEnabled: true, upiId: '8227070298@paytm', upiName: 'NST Admin', qrCodeUrl: '', paymentInstructions: 'Scan QR or Pay to

