import React, { useState, useEffect } from 'react';
import { User, Board, ClassLevel, Stream, SystemSettings, RecoveryRequest } from '../types';
import { ADMIN_EMAIL } from '../constants';
import { UserPlus, LogIn, Lock, Check, Copy, ShieldCheck, RefreshCcw, Send, AlertTriangle, XCircle, KeyRound, ShieldAlert } from 'lucide-react';

interface Props { onLogin: (user: User) => void; }

const BLOCKED_DOMAINS = ['tempmail.com', 'throwawaymail.com', 'mailinator.com', 'yopmail.com', '10minutemail.com', 'guerrillamail.com'];

export const Auth: React.FC<Props> = ({ onLogin }) => {
  const [view, setView] = useState<'LOGIN' | 'SIGNUP' | 'ADMIN' | 'RECOVERY' | 'SUCCESS_ID'>('LOGIN');
  const [generatedId, setGeneratedId] = useState('');
  const [formData, setFormData] = useState({ id: '', password: '', name: '', mobile: '', email: '', board: 'CBSE' as Board, classLevel: '10' as ClassLevel, stream: 'Science' as Stream });
  const [showAdminVerify, setShowAdminVerify] = useState(false);
  const [adminAuthCode, setAdminAuthCode] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [settings, setSettings] = useState<SystemSettings | null>(null);
  const [requestSent, setRequestSent] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => { const s = localStorage.getItem('nst_system_settings'); if (s) setSettings(JSON.parse(s)); }, []);
  const handleChange = (e: any) => { setFormData({ ...formData, [e.target.name]: e.target.value }); setError(null); };
  const generateUserId = () => `NST-${formData.name.substring(0, 3).toUpperCase().replace(/[^A-Z]/g, 'X')}-${Math.floor(1000 + Math.random() * 9000)}`;

  const handleRequestLogin = () => {
      const inputId = formData.id;
      if (!inputId) { setError("Enter Login ID or Mobile."); return; }
      const users: User[] = JSON.parse(localStorage.getItem('nst_users') || '[]');
      const user = users.find(u => u.id === inputId || u.mobile === inputId);
      if (!user) { setError("User not found."); return; }
      const requests: RecoveryRequest[] = JSON.parse(localStorage.getItem('nst_recovery_requests') || '[]');
      if (!requests.some(r => r.id === user.id && r.status === 'PENDING')) {
          localStorage.setItem('nst_recovery_requests', JSON.stringify([{ id: user.id, name: user.name, mobile: user.mobile, timestamp: new Date().toISOString(), status: 'PENDING' }, ...requests]));
      }
      setRequestSent(true); setError(null);
  };

  const checkLoginStatus = () => {
      if (!formData.id) return;
      setLoading(true);
      setTimeout(() => {
          const users: User[] = JSON.parse(localStorage.getItem('nst_users') || '[]');
          const user = users.find(u => u.id === formData.id || u.mobile === formData.id);
          if (user) {
              const requests: RecoveryRequest[] = JSON.parse(localStorage.getItem('nst_recovery_requests') || '[]');
              const myRequest = requests.find(r => r.id === user.id);
              if (myRequest && myRequest.status === 'RESOLVED') {
                  const updatedReqs = requests.filter(r => r.id !== user.id);
                  localStorage.setItem('nst_recovery_requests', JSON.stringify(updatedReqs));
                  onLogin(user);
              } else { setError("Admin has not approved yet."); }
          }
          setLoading(false);
      }, 800);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault(); setError(null);
    const users: User[] = JSON.parse(localStorage.getItem('nst_users') || '[]');

    if (view === 'ADMIN') {
        if (!showAdminVerify) {
            if (formData.email.trim() !== ADMIN_EMAIL) { setError('Unauthorized Email.'); return; }
            setShowAdminVerify(true); return;
        }
        if (!['NSTA', 'TNASSR@0319#1108'].includes(adminAuthCode.trim())) { setError('Invalid Code.'); return; }
        let adminUser = users.find(u => u.id === 'ADMIN');
        if (!adminUser) {
            adminUser = { id: 'ADMIN', password: '', name: 'System Admin', mobile: '0000000000', email: ADMIN_EMAIL, role: 'ADMIN', createdAt: new Date().toISOString(), credits: 99999, streak: 999, lastLoginDate: new Date().toISOString(), redeemedCodes: [], progress: {} };
            localStorage.setItem('nst_users', JSON.stringify([...users, adminUser]));
        }
        onLogin(adminUser); return;
    }

    if (view === 'LOGIN') {
      const u = users.find(u => (u.id === formData.id || u.email === formData.id || u.mobile === formData.id) && u.password === formData.password && u.role !== 'ADMIN');
      if (u) { if (u.isArchived) { setError('Account Deleted.'); return; } onLogin(u); } else { setError('Invalid Credentials.'); }
    } else if (view === 'SIGNUP') {
      if (!formData.password

