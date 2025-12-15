import React, { useEffect, useState } from 'react';
import { User, ViewState, SystemSettings, Subject, PaymentRequest, CreditPackage, Board, ClassLevel, Stream, Chapter, LessonContent, ContentType, GiftCode } from '../types';
import { Users, Search, Trash2, Gift, Copy, Check, Edit, Eye, BookOpen, Save, X, Zap, Crown, Shield, Cpu, Megaphone, KeyRound, HardDrive, LayoutDashboard, MessageCircle, Settings, Terminal, FileCode, Database, IndianRupee, ShoppingBag, BrainCircuit, Mic, FileEdit, Link as LinkIcon, Download, Upload, Recycle, Wallet, Gamepad2, RotateCcw, Lock, AlertTriangle, Coins } from 'lucide-react';
import { UniversalChat } from './UniversalChat';
import { getSubjectsList } from '../constants';
import { fetchChapters, fetchLessonContent } from '../services/gemini';
import { LessonView } from './LessonView';
import { AudioStudio } from './AudioStudio';
import { GoogleGenAI } from "@google/genai";
import { AdminDevAssistant } from './AdminDevAssistant';

interface Props {
  onNavigate: (view: ViewState) => void;
  settings?: SystemSettings;
  onUpdateSettings?: (s: SystemSettings) => void;
  onImpersonate?: (user: User) => void; 
}

type AdminTab = 'OVERVIEW' | 'USERS' | 'PAYMENTS' | 'STORE' | 'CONTENT' | 'SYSTEM' | 'DATABASE' | 'RECYCLE';

export const AdminDashboard: React.FC<Props> = ({ onNavigate, settings, onUpdateSettings, onImpersonate }) => {
  const [activeTab, setActiveTab] = useState<AdminTab>('OVERVIEW');
  const [users, setUsers] = useState<User[]>([]);
  const [codes, setCodes] = useState<GiftCode[]>([]);
  const [chatMessages, setChatMessages] = useState<any[]>([]);
  const [paymentRequests, setPaymentRequests] = useState<PaymentRequest[]>([]);
  const [search, setSearch] = useState('');
  const [storageStats, setStorageStats] = useState({ usedMB: '0.00', totalNotes: 0, totalMCQs: 0, totalPDFs: 0, percentUsed: 0 });
  
  const [localSettings, setLocalSettings] = useState<SystemSettings>(settings || {
      appName: 'NST', themeColor: '#3b82f6', maintenanceMode: false, customCSS: '', apiKeys: [], chatCost: 1, dailyReward: 3, signupBonus: 2, isChatEnabled: true, isGameEnabled: true, allowSignup: true, loginMessage: '', allowedClasses: ['6', '7', '8', '9', '10', '11', '12'], storageCapacity: '100 GB', noteGenerationPrompt: '', isPaymentEnabled: true, paymentDisabledMessage: '', upiId: '', upiName: '', qrCodeUrl: '', paymentInstructions: '', packages: []
  });
  
  const [newApiKey, setNewApiKey] = useState('');
  const [editingUser, setEditingUser] = useState<User | null>(null); 
  const [actionCreditAmount, setActionCreditAmount] = useState<number | ''>(''); 
  const [showChat, setShowChat] = useState(false);
  const [broadcastMsg, setBroadcastMsg] = useState('');
  const [editingPkgId, setEditingPkgId] = useState<string | null>(null); 
  const [pkgName, setPkgName] = useState('');
  const [pkgCredits, setPkgCredits] = useState<number | ''>('');
  const [pkgPrice, setPkgPrice] = useState<number | ''>('');
  const [pkgPopular, setPkgPopular] = useState(false);
  const [contentBoard, setContentBoard] = useState<Board>('CBSE');
  const [contentClass, setContentClass] = useState<ClassLevel>('10');
  const [contentStream, setContentStream] = useState<Stream>('Science');
  const [contentSubject, setContentSubject] = useState<Subject | null>(null);
  const [contentChapters, setContentChapters] = useState<Chapter[]>([]);
  const [selectedChapter, setSelectedChapter] = useState<Chapter | null>(null);
  const [generatedContent, setGeneratedContent] = useState<LessonContent | null>(null);
  const [showAudioStudio, setShowAudioStudio] = useState(false);
  const [showDevConsole, setShowDevConsole] = useState(false);
  const [showGenOptions, setShowGenOptions] = useState(false);
  const [manualEditMode, setManualEditMode] = useState<ContentType | null>(null);
  const [manualText, setManualText] = useState('');
  const [giftAmount, setGiftAmount] = useState<number | ''>('');
  const [giftQuantity, setGiftQuantity] = useState<number>(1);

  const adminUser: User = { id: 'ADMIN', name: 'System Admin', role: 'ADMIN', credits: 99999, email: 'admin@nst.com', password: '', mobile: '', createdAt: '', streak: 0, lastLoginDate: '', redeemedCodes: [], progress: {} };

  useEffect(() => { loadData(); calculateStorage(); }, [activeTab]);

  const loadData = () => {
    setUsers(JSON.parse(localStorage.getItem('nst_users') || '[]'));
    setCodes(JSON.parse(localStorage.getItem('nst_admin_codes') || '[]'));
    setChatMessages(JSON.parse(localStorage.getItem('nst_universal_chat') || '[]'));
    setPaymentRequests(JSON.parse(localStorage.getItem('nst_payment_requests') || '[]'));
  };

  const calculateStorage = () => {
      let totalBytes = 0, notesCount = 0, mcqCount = 0, pdfCount = 0;
      for (let i = 0; i < localStorage.length; i++) {
          const key = localStorage.key(i);
          if (key) {
              const value = localStorage.getItem(key) || '';
              totalBytes += (key.length + value.length) * 2; 
              if (key.startsWith('nst_custom_lesson_')) {
                  if (key.includes('MCQ')) mcqCount++; else if (key.includes('PDF')) pdfCount++; else notesCount++;
              }
          }
      }
      setStorageStats({ usedMB: (totalBytes / (1024 * 1024)).toFixed(2), totalNotes: notesCount, totalMCQs: mcqCount, totalPDFs: pdfCount, percentUsed: Math.min((totalBytes / (100 * 1024 * 1024)) * 100, 100) });
  };

  const handleBroadcast = () => { 
      if (!broadcastMsg.trim()) localStorage.removeItem('nst_global_message'); else localStorage.setItem('nst_global_message', broadcastMsg); 
      alert("Broadcast Updated!");
  };

  const handleSaveSettings = () => { onUpdateSettings?.(localSettings); alert("Settings Saved!"); };
  
  const handleAddKey = () => { if (!newApiKey.trim()) return; setLocalSettings({ ...localSettings, apiKeys: [...(localSettings.apiKeys || []), newApiKey.trim()] }); setNewApiKey(''); };

  const handleSavePackage = () => { 
      if (!pkgName || !pkgCredits || !pkgPrice) return; 
      const newPkg: CreditPackage = { id: editingPkgId || Date.now().toString(), name: pkgName, credits: Number(pkgCredits), price: Number(pkgPrice), isPopular: pkgPopular }; 
      const updatedPackages = editingPkgId ? localSettings.packages.map(p => p.id === editingPkgId ? newPkg : p) : [...localSettings.packages, newPkg];
      setLocalSettings({...localSettings, packages: updatedPackages}); setEditingPkgId(null); setPkgName(''); setPkgCredits(''); setPkgPrice('');
  };
  
  const handleProcessPayment = (reqId: string, action: 'APPROVE' | 'REJECT') => { 
      const request = paymentRequests.find(r => r.id === reqId); if (!request) return; 
      if (action === 'APPROVE') { 
          const uIdx = users.findIndex(u => u.id === request.userId); 
          if (uIdx !== -1) { users[uIdx].credits = (users[uIdx].credits || 0) + request.amount; setUsers([...users]); localStorage.setItem('nst_users', JSON.stringify(users)); } 
      } 
      const updatedReqs = paymentRequests.map(r => r.id === reqId ? { ...r, status: action === 'APPROVE' ? 'APPROVED' : 'REJECTED' as any } : r ); 
      setPaymentRequests(updatedReqs); localStorage.setItem('nst_payment_requests', JSON.stringify(updatedReqs));
  };

  const handleGenerateCodes = () => {
      if (!giftAmount || !giftQuantity) return;
      const newCodes: GiftCode[] = Array(giftQuantity).fill(0).map(() => ({ code: `NST-${Math.floor(Math.random()*10000)}-${Math.random().toString(36).substring(7).toUpperCase()}`, amount: Number(giftAmount), createdAt: new Date().toISOString(), isRedeemed: false, generatedBy: 'ADMIN' }));
      const updated = [...newCodes, ...codes]; setCodes(updated); localStorage.setItem('nst_admin_codes', JSON.stringify(updated));
      alert(`${giftQuantity} Codes Generated!`);
  };

  const handleExportData = () => { 
      const data = { users: localStorage.getItem('nst_users'), chat: localStorage.getItem('nst_universal_chat'), codes: localStorage.getItem('nst_admin_codes'), settings: localStorage.getItem('nst_system_settings'), payments: localStorage.getItem('nst_payment_requests') };
      const blob = new Blob([JSON.stringify(data)], { type: 'application/json' }); const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = `NST_Backup.json`; a.click();
  };
  
  const handleImportData = (e: React.ChangeEvent<HTMLInputElement>) => { 
      const file = e.target.files?.[0]; if (!file) return; 
      const reader = new FileReader(); reader.onload = (ev) => { try { const data = JSON.parse(ev.target?.result as string); 
          if (data.users) localStorage.setItem('nst_users', data.users); 
          if (data.settings) localStorage.setItem('nst_system_settings', data.settings); 
          alert("Restored! Reloading..."); window.location.reload(); 
      } catch (err) { alert("Invalid File!"); } }; reader.readAsText(file); 
  };

  const handleContentSubjectSelect = async (subject: Subject) => {
      setContentSubject(subject);
      try { const chapters = await fetchChapters(contentBoard, contentClass, contentStream, subject, contentBoard === 'BSEB' ? 'Hindi' : 'English'); setContentChapters(chapters); } catch (e) {}
  };

  const handleManualSave = () => {
      if(!selectedChapter || !contentSubject || !manualEditMode) return;
      const content: LessonContent = { id: Date.now().toString(), title: selectedChapter.title, subtitle: manualEditMode === 'PDF_NOTES' ? "PDF Link" : "Manual", content: manualText, type: manualEditMode, dateCreated: new Date().toISOString(), subjectName: contentSubject.name };
      const key = `${contentBoard}-${contentClass}${contentStream ? '-'+contentStream : ''}-${contentSubject.name}-${selectedChapter.id}-${manualEditMode}`;
      localStorage.setItem(`nst_custom_lesson_${key}`, JSON.stringify(content));
      alert("Saved!"); setManualEditMode(null); calculateStorage();
  };

  if (showChat) return <div className="p-4"><button onClick={() => setShowChat(false)} className="mb-4 text-blue-600 font-bold">&larr; Back</button><UniversalChat currentUser={adminUser} onUserUpdate={()=>{}} isAdminView={true} settings={localSettings} /></div>;
  if (showAudioStudio) return <AudioStudio language={contentBoard === 'BSEB' ? 'Hindi' : 'English'} onBack={() => setShowAudioStudio(false)} />;
  if (showDevConsole) return <AdminDevAssistant onClose={() => setShowDevConsole(false)} />;
  if (manualEditMode && selectedChapter) return (
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white p-6 rounded-2xl w-full max-w-lg">
              <h3 className="font-bold mb-4">{manualEditMode === 'PDF_NOTES' ? 'Add PDF URL' : 'Edit Content'}</h3>
              <textarea value={manualText} onChange={e => setManualText(e.target.value)} className="w-full h-64 p-3 border rounded-xl" placeholder={manualEditMode === 'PDF_NOTES' ? 'Paste PDF Link' : 'Type content...'} />
              <div className="flex gap-2 mt-4"><button onClick={() => setManualEditMode(null)} className="flex-1 py-2 bg-slate-100 rounded-lg">Cancel</button><button onClick={handleManualSave} className="flex-1 py-2 bg-blue-600 text-white rounded-lg">Save</button></div>
          </div>
      </div>
  );

  return (
    <div className="pb-20">
      <div className="bg-white rounded-2xl p-2 mb-6 flex flex-wrap gap-2 sticky top-2 z-20 shadow-sm border border-slate-200">
          {['OVERVIEW','USERS','PAYMENTS','STORE','CONTENT','SYSTEM','DATABASE'].map(t => (
              <button key={t} onClick={() => setActiveTab(t as AdminTab)} className={`flex-1 py-2 px-3 rounded-lg text-xs font-bold ${activeTab === t ? 'bg-slate-900 text-white' : 'hover:bg-slate-50'}`}>{t}</button>
          ))}
      </div>

      {activeTab === 'OVERVIEW' && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="bg-white p-6 rounded-2xl border border-slate-200"><div className="text-xs font-bold text-slate-500">Users</div><div className="text-3xl font-black">{users.length}</div></div>
              <div className="bg-white p-6 rounded-2xl border border-slate-200 cursor-pointer" onClick={() => setShowChat(true)}><div className="text-xs font-bold text-slate-500">Chat Msgs</div><div className="text-3xl font-black">{chatMessages.length}</div></div>
              <div className="bg-white p-6 rounded-2xl border border-slate-200"><div className="text-xs font-bold text-slate-500">Pending Pay</div><div className="text-3xl font-black text-orange-500">{paymentRequests.filter(p => p.status === 'PENDING').length}</div></div>
              <div className="col-span-2 md:col-span-4 bg-white p-6 rounded-2xl border border-slate-200 mt-2">
                  <h3 className="font-bold mb-2">Broadcast Message</h3>
                  <div className="flex gap-2"><input value={broadcastMsg} onChange={e => setBroadcastMsg(e.target.value)} className="flex-1 p-2 border rounded-lg" placeholder="Type announcement..." /><button onClick={handleBroadcast} className="bg-blue-600 text-white px-4 rounded-lg font-bold">Post</button></div>
              </div>
          </div>
      )}

      {activeTab === 'USERS' && (
          <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
              <div className="p-4 border-b"><input placeholder="Search Users..." value={search} onChange={e => setSearch(e.target.value)} className="w-full p-2 border rounded-lg" /></div>
              <div className="max-h-[600px] overflow-y-auto">
                  {users.filter(u => !u.isArchived && u.name.toLowerCase().includes(search.toLowerCase())).map(user => (
                      <div key={user.id} className="p-4 border-b flex justify-between items-center hover:bg-slate-50">
                          <div><div className="font-bold">{user.name}</div><div className="text-xs text-slate-400">{user.id} | {user.credits} Cr</div></div>
                          <button onClick={() => setEditingUser(user)} className="p-2 text-blue-600"><Edit size={18} /></button>
                      </div>
                  ))}
              </div>
          </div>
      )}

      {activeTab === 'PAYMENTS' && (
          <div className="bg-white rounded-2xl border border-slate-200">
              {paymentRequests.filter(p => p.status === 'PENDING').map(req => (
                  <div key={req.id} className="p-4 border-b flex justify-between items-center">
                      <div><div className="font-bold">{req.userName}</div><div className="text-xs">{req.packageName} (₹{req.amount}) | TXN: {req.txnId}</div></div>
                      <div className="flex gap-2"><button onClick={() => handleProcessPayment(req.id, 'REJECT')} className="bg-red-50 text-red-600 px-3 py-1 rounded font-bold">Reject</button><button onClick={() => handleProcessPayment(req.id, 'APPROVE')} className="bg-green-600 text-white px-3 py-1 rounded font-bold">Approve</button></div>
                  </div>
              ))}
              {paymentRequests.filter(p => p.status === 'PENDING').length === 0 && <div className="p-8 text-center text-slate-400">No pending requests.</div>}
          </div>
      )}

      {activeTab === 'STORE' && (
          <div className="space-y-6">
              <div className="bg-white p-6 rounded-2xl border border-slate-200">
                  <h3 className="font-bold mb-4">Packages</h3>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      {localSettings.packages.map(pkg => (
                          <div key={pkg.id} className="border p-4 rounded-xl relative group">
                              <button onClick={() => { const up = localSettings.packages.filter(p=>p.id!==pkg.id); setLocalSettings({...localSettings, packages: up}); }} className="absolute top-2 right-2 text-red-500"><X size={16}/></button>
                              <div className="font-bold">{pkg.name}</div><div className="text-blue-600 font-black">₹{pkg.price}</div>
                          </div>
                      ))}
                      <div className="border border-dashed p-4 rounded-xl flex flex-col gap-2 bg-slate-50">
                          <input placeholder="Name" value={pkgName} onChange={e=>setPkgName(e.target.value)} className="p-1 border rounded text-sm"/>
                          <div className="flex gap-1"><input placeholder="Cr" type="number" value={pkgCredits} onChange={e=>setPkgCredits(Number(e.target.value))} className="w-1/2 p-1 border rounded text-sm"/><input placeholder="Price" type="number" value={pkgPrice} onChange={e=>setPkgPrice(Number(e.target.value))} className="w-1/2 p-1 border rounded text-sm"/></div>
                          <button onClick={handleSavePackage} className="bg-blue-600 text-white rounded py-1 text-sm font-bold">Add</button>
                      </div>
                  </div>
              </div>
              <div className="bg-white p-6 rounded-2xl border border-slate-200">
                  <h3 className="font-bold mb-4">Gift Codes</h3>
                  <div className="flex gap-2 mb-4"><input type="number" placeholder="Amt" value={giftAmount} onChange={e=>setGiftAmount(Number(e.target.value))} className="border rounded p-2 flex-1"/><input type="number" placeholder="Qty" value={giftQuantity} onChange={e=>setGiftQuantity(Number(e.target.value))} className="border rounded p-2 w-20"/><button onClick={handleGenerateCodes} className="bg-slate-900 text-white px-4 rounded font-bold">Generate</button></div>
                  <div className="max-h-40 overflow-y-auto space-y-1">
                      {codes.filter(c=>!c.isRedeemed).map(c=><div key={c.code} className="flex justify-between p-2 bg-slate-50 rounded border text-xs"><span className="font-mono font-bold">{c.code}</span><span className="text-green-600">{c.amount}Cr</span></div>)}
                  </div>
              </div>
          </div>
      )}

      {activeTab === 'CONTENT' && (
          <div className="bg-white p-6 rounded-2xl border border-slate-200">
              <div className="flex gap-2 mb-4 overflow-x-auto">
                  <select value={contentClass} onChange={e => setContentClass(e.target.value as any)} className="p-2 border rounded-lg"><option value="10">Class 10</option><option value="12">Class 12</option></select>
                  {getSubjectsList(contentClass, contentStream).map(s => <button key={s.id} onClick={() => handleContentSubjectSelect(s)} className={`p-2 border rounded-lg whitespace-nowrap ${contentSubject?.id === s.id ? 'bg-blue-600 text-white' : ''}`}>{s.name}</button>)}
              </div>
              {contentSubject && (
                  <div className="space-y-2">
                      {contentChapters.map(ch => (
                          <div key={ch.id} className="p-3 border rounded-xl flex justify-between items-center bg-slate-50">
                              <div className="font-bold text-sm">{ch.title}</div>
                              <div className="flex gap-2">
                                  <button onClick={()=>{setSelectedChapter(ch); setManualEditMode('PDF_NOTES');}} className="px-2 py-1 bg-white border text-xs font-bold rounded">Link PDF</button>
                                  <button onClick={()=>{setSelectedChapter(ch); setManualEditMode('NOTES_PREMIUM');}} className="px-2 py-1 bg-white border text-xs font-bold rounded">Edit Text</button>
                              </div>
                          </div>
                      ))}
                  </div>
              )}
          </div>
      )}

      {activeTab === 'SYSTEM' && (
          <div className="bg-white p-6 rounded-2xl border border-slate-200 space-y-6">
              <div><h3 className="font-bold mb-2">API Keys</h3><div className="flex gap-2"><input value={newApiKey} onChange={e=>setNewApiKey(e.target.value)} className="flex-1 border rounded p-2" placeholder="Paste Gemini Key"/><button onClick={handleAddKey} className="bg-blue-600 text-white px-4 rounded font-bold">Add</button></div><div className="mt-2 space-y-1">{localSettings.apiKeys.map((k,i)=><div key={i} className="text-xs bg-slate-50 p-2 rounded border truncate">{k} <button onClick={()=>{const n=[...localSettings.apiKeys];n.splice(i,1);setLocalSettings({...localSettings,apiKeys:n})}} className="text-red-500 font-bold ml-2">X</button></div>)}</div></div>
              <div className="flex items-center justify-between p-3 bg-slate-50 rounded-xl"><span className="font-bold">Maintenance Mode</span><button onClick={()=>setLocalSettings({...localSettings, maintenanceMode:!localSettings.maintenanceMode})} className={`px-3 py-1 rounded font-bold ${localSettings.maintenanceMode?'bg-red-500 text-white':'bg-slate-200'}`}>{localSettings.maintenanceMode?'ON':'OFF'}</button></div>
              <button onClick={() => setShowDevConsole(true)} className="w-full bg-slate-900 text-white p-3 rounded-xl font-bold flex items-center justify-center gap-2"><Terminal size={18}/> Open Developer Console</button>
              <button onClick={handleSaveSettings} className="w-full bg-blue-600 text-white p-3 rounded-xl font-bold">Save All Settings</button>
          </div>
      )}

      {activeTab === 'DATABASE' && (
          <div className="bg-white p-6 rounded-2xl border border-slate-200 space-y-4">
              <div className="text-center"><div className="text-4xl font-black">{storageStats.usedMB} MB</div><div className="text-xs text-slate-500">Storage Used</div></div>
              <button onClick={handleExportData} className="w-full border p-3 rounded-xl font-bold flex items-center justify-center gap-2"><Download size={18}/> Backup Data</button>
              <label className="w-full border p-3 rounded-xl font-bold flex items-center justify-center gap-2 cursor-pointer bg-slate-50"><Upload size={18}/> Restore Data <input type="file" onChange={handleImportData} className="hidden" accept=".json"/></label>
          </div>
      )}

      {editingUser && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center p-4 z-50">
            <div className="bg-white w-full max-w-md rounded-2xl overflow-hidden">
                <div className="bg-slate-900 p-4 text-white flex justify-between items-center"><h3 className="font-bold">{editingUser.name}</h3><button onClick={()=>setEditingUser(null)}><X/></button></div>
                <div className="p-6 space-y-4">
                    <div className="flex justify-between items-center p-3 border rounded-xl bg-slate-50"><span className="font-bold">Credits: {editingUser.credits}</span><div className="flex gap-1"><button onClick={()=>{const u={...editingUser, credits:(editingUser.credits||0)+10}; setEditingUser(u); users[users.findIndex(us=>us.id===u.id)]=u; localStorage.setItem('nst_users', JSON.stringify(users));}} className="bg-green-500 text-white px-2 py-1 rounded text-xs">+10</button><button onClick={()=>{const u={...editingUser, credits:(editingUser.credits||0)-10}; setEditingUser(u); users[users.findIndex(us=>us.id===u.id)]=u; localStorage.setItem('nst_users', JSON.stringify(users));}} className="bg-red-500 text-white px-2 py-1 rounded text-xs">-10</button></div></div>
                    <div className="space-y-2">
                        <button onClick={()=>{const u={...editingUser, isLocked:!editingUser.isLocked}; setEditingUser(u); users[users.findIndex(us=>us.id===u.id)]=u; localStorage.setItem('nst_users', JSON.stringify(users));}} className={`w-full p-2 border rounded font-bold ${editingUser.isLocked ? 'bg-red-100 text-red-600' : 'bg-slate-50'}`}>{editingUser.isLocked ? 'Unlock Account' : 'Lock Account'}</button>
                        <button onClick={()=>{const u={...editingUser, isChatBanned:!editingUser.isChatBanned}; setEditingUser(u); users[users.findIndex(us=>us.id===u.id)]=u; localStorage.setItem('nst_users', JSON.stringify(users));}} className={`w-full p-2 border rounded font-bold ${editingUser.isChatBanned ? 'bg-red-100 text-red-600' : 'bg-slate-50'}`}>{editingUser.isChatBanned ? 'Unban Chat' : 'Ban Chat'}</button>
                        {onImpersonate && <button onClick={() => onImpersonate(editingUser)} className="w-full p-2 bg-purple-100 text-purple-700 font-bold rounded flex items-center justify-center gap-2"><Eye size={16}/> View as User</button>}
                    </div>
                </div>
            </div>
        </div>
      )}
    </div>
  );
};
