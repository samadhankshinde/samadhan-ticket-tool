
import React, { useState } from 'react';
import { ShieldCheck, UserCircle, Briefcase, Lock, ArrowLeft, Loader2, TrendingUp } from 'lucide-react';
import { TeamMember } from '../types';

interface LoginPageProps {
  portal: 'vendor' | 'security' | 'manager';
  teamMembers: TeamMember[];
  onLogin: (memberId?: string) => void;
  onBack: () => void;
}

export const LoginPage: React.FC<LoginPageProps> = ({ portal, teamMembers, onLogin, onBack }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const isSecurity = portal === 'security';
  const isManager = portal === 'manager';

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    
    setIsLoading(true);

    // Mock authentication delay
    setTimeout(() => {
      if (!email) {
        setError('Please enter email.');
        setIsLoading(false);
        return;
      }
      setIsLoading(false);
      // For security login, we default to the first member (admin) or a generic ID for this demo
      onLogin(isSecurity ? '1' : undefined); 
    }, 800);
  };

  const getTheme = () => {
      if (isManager) {
          return {
            bg: 'bg-emerald-950',
            card: 'bg-emerald-900 border-emerald-800',
            textMain: 'text-white',
            textSub: 'text-emerald-300',
            input: 'bg-emerald-950 border-emerald-800 text-white focus:border-emerald-500 focus:ring-emerald-500 placeholder-emerald-700',
            button: 'bg-emerald-500 hover:bg-emerald-600 focus:ring-emerald-500',
            iconBg: 'bg-emerald-500/10 text-emerald-400',
            label: 'text-emerald-100'
          };
      }
      if (isSecurity) {
          return {
            bg: 'bg-slate-900',
            card: 'bg-slate-800 border-slate-700',
            textMain: 'text-white',
            textSub: 'text-slate-400',
            input: 'bg-slate-900 border-slate-700 text-white focus:border-indigo-500 focus:ring-indigo-500 placeholder-slate-500',
            button: 'bg-indigo-600 hover:bg-indigo-700 focus:ring-indigo-500',
            iconBg: 'bg-indigo-500/10 text-indigo-400',
            label: 'text-slate-300'
          };
      }
      return {
        bg: 'bg-gray-50',
        card: 'bg-white border-gray-200',
        textMain: 'text-gray-900',
        textSub: 'text-gray-500',
        input: 'bg-white border-gray-300 text-gray-900 focus:border-blue-500 focus:ring-blue-500 placeholder-gray-400',
        button: 'bg-blue-600 hover:bg-blue-700 focus:ring-blue-500',
        iconBg: 'bg-blue-50 text-blue-600',
        label: 'text-gray-700'
      };
  };

  const themeClasses = getTheme();

  return (
    <div className={`min-h-screen flex items-center justify-center p-4 transition-colors duration-300 ${themeClasses.bg}`}>
      
      {/* Back Button */}
      <button 
        onClick={onBack}
        className={`absolute top-6 left-6 flex items-center gap-2 text-sm font-medium transition-colors ${
            !portal || portal === 'vendor' ? 'text-gray-500 hover:text-gray-900' : 'text-white/60 hover:text-white'
        }`}
      >
        <ArrowLeft className="w-4 h-4" />
        Back to Portal Selection
      </button>

      <div className={`w-full max-w-md rounded-2xl shadow-xl border p-8 ${themeClasses.card}`}>
        
        {/* Header */}
        <div className="text-center mb-8">
          <div className={`inline-flex items-center justify-center p-3 rounded-xl mb-4 ${themeClasses.iconBg}`}>
            {isManager ? <TrendingUp className="w-8 h-8" /> : isSecurity ? <Briefcase className="w-8 h-8" /> : <UserCircle className="w-8 h-8" />}
          </div>
          <h2 className={`text-2xl font-bold mb-2 ${themeClasses.textMain}`}>
            {isManager ? 'Manager Portal' : isSecurity ? 'Security Operations' : 'Vendor Portal'}
          </h2>
          <p className={`text-sm ${themeClasses.textSub}`}>
            {isManager 
              ? 'Executive dashboard access.' 
              : isSecurity 
              ? 'Sign in with your corporate credentials.' 
              : 'Sign in to submit and manage your assessments.'}
          </p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-6">
          
          <div>
            <label className={`block text-sm font-medium mb-2 ${themeClasses.label}`}>Email Address</label>
            <div className="relative">
            <UserCircle className={`w-5 h-5 absolute left-3 top-2.5 ${!portal || portal === 'vendor' ? 'text-gray-400' : 'text-white/30'}`} />
            <input 
                type="email" 
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className={`w-full pl-10 pr-4 py-2 rounded-lg border focus:ring-2 focus:ring-offset-0 outline-none transition-all ${themeClasses.input}`}
                placeholder={isManager ? "manager@corp.com" : isSecurity ? "analyst@security.com" : "contact@vendor.com"}
            />
            </div>
          </div>

          <div>
            <label className={`block text-sm font-medium mb-2 ${themeClasses.label}`}>Password</label>
            <div className="relative">
              <Lock className={`w-5 h-5 absolute left-3 top-2.5 ${!portal || portal === 'vendor' ? 'text-gray-400' : 'text-white/30'}`} />
              <input 
                type="password" 
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className={`w-full pl-10 pr-4 py-2 rounded-lg border focus:ring-2 focus:ring-offset-0 outline-none transition-all ${themeClasses.input}`}
                placeholder="••••••••"
              />
            </div>
          </div>

          {error && (
            <div className={`text-sm text-center ${(!portal || portal === 'vendor') ? 'text-red-600' : 'text-red-400'}`}>
              {error}
            </div>
          )}

          <button 
            type="submit"
            disabled={isLoading}
            className={`w-full py-2.5 rounded-lg text-white font-medium shadow-sm flex justify-center items-center gap-2 transition-all transform active:scale-[0.98] focus:outline-none focus:ring-2 focus:ring-offset-2 ${themeClasses.button} ${(!portal || portal === 'vendor') ? 'focus:ring-offset-white' : 'focus:ring-offset-slate-800'}`}
          >
            {isLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Sign In'}
          </button>
        </form>

        <div className="mt-6 text-center">
            <p className={`text-xs ${themeClasses.textSub}`}>
                For demonstration, use any email/password.
            </p>
        </div>
      </div>
    </div>
  );
};
