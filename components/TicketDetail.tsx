
import React, { useState, useRef, useEffect } from 'react';
import { Ticket, AppTier, TicketStatus, ChatMessage, VulnerabilitySeverity, Vulnerability, FinalReport, TeamMember, SecurityFormDetails } from '../types';
import { summarizeDiscussion, analyzeReport, analyzeRetestReport } from '../services/geminiService';
import { CalendarPicker } from './CalendarPicker';
import { 
  Calendar, ArrowLeft, CheckCircle2, 
  Clock, Save, FileText, Activity, 
  MessageSquare, Send, Upload, Download, Bug, AlertOctagon, 
  RotateCcw, X, Check, ShieldAlert, Sparkles, Info, Loader2, Globe, 
  Smartphone, Users, FileArchive, ClipboardList, Database, Lock, Laptop, Server,
  Eye, ChevronDown, ChevronUp, Link as LucideLink, Code2, Terminal, ShieldCheck,
  ListOrdered, ImageIcon, MessageCircle, History, SearchCheck, Timer, Bell,
  PartyPopper, RefreshCw, Box, FileCode
} from 'lucide-react';

interface TicketDetailProps {
  ticket: Ticket;
  role: 'vendor' | 'security';
  teamMembers: TeamMember[];
  onBack: () => void;
  onUpdateTicket: (updatedTicket: Ticket) => void;
}

// Helper component for nested collapsible sections within findings
const CollapsibleFindingSection: React.FC<{
  title: string;
  icon: any;
  content: string;
  defaultExpanded?: boolean;
  themeColor: string;
}> = ({ title, icon: Icon, content, defaultExpanded = true, themeColor }) => {
  const [isExpanded, setIsExpanded] = useState(defaultExpanded);

  return (
    <div className="border border-gray-100 rounded-2xl overflow-hidden bg-white shadow-sm transition-all hover:border-gray-200">
      <button 
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full px-5 py-4 flex items-center justify-between bg-gray-50/50 hover:bg-gray-100/50 transition-colors"
      >
        <div className="flex items-center gap-3">
          <div className={`p-1.5 rounded-lg ${themeColor}`}>
            <Icon className="w-4 h-4" />
          </div>
          <span className="text-[10px] font-black text-gray-500 uppercase tracking-widest">{title}</span>
        </div>
        {isExpanded ? <ChevronUp className="w-4 h-4 text-gray-400" /> : <ChevronDown className="w-4 h-4 text-gray-400" />}
      </button>
      {isExpanded && (
        <div className="p-5 animate-in slide-in-from-top-2 duration-200">
          <div className="text-sm text-gray-700 leading-relaxed whitespace-pre-wrap font-medium">
            {content || `No ${title.toLowerCase()} information provided.`}
          </div>
        </div>
      )}
    </div>
  );
};

export const TicketDetail: React.FC<TicketDetailProps> = ({ ticket, role, teamMembers, onBack, onUpdateTicket }) => {
  const [activeTab, setActiveTab] = useState<'overview' | 'discussion' | 'report' | 'findings'>('overview');
  const [scheduleDate, setScheduleDate] = useState(ticket.scheduledDate || '');
  const [status, setStatus] = useState<TicketStatus>(ticket.status);
  const [isSaving, setIsSaving] = useState(false);
  const [assignedTo, setAssignedTo] = useState<string>(ticket.assignedTo || '');
  
  const [newMessage, setNewMessage] = useState('');
  const [isSummarizing, setIsSummarizing] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [isAnalyzingRetest, setIsAnalyzingRetest] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const retestInputRef = useRef<HTMLInputElement>(null);

  const [expandedVulnId, setExpandedVulnId] = useState<string | null>(null);
  const [editingComment, setEditingComment] = useState<{ [key: string]: string }>({});
  
  // Notification State
  const [lastMsgCount, setLastMsgCount] = useState(ticket.messages.length);
  const [notification, setNotification] = useState<{text: string, subtext?: string, type: 'msg' | 'retest' | 'alert', show: boolean}>({text: '', type: 'msg', show: false});

  // Function to trigger notifications manually
  const triggerNotification = (text: string, subtext: string, type: 'msg' | 'retest' | 'alert') => {
    setNotification({ text, subtext, type, show: true });
    setTimeout(() => setNotification(prev => ({ ...prev, show: false })), 5000);
  };

  // --- Automated SLA Reminder Logic ---
  useEffect(() => {
    const now = new Date();
    now.setHours(0, 0, 0, 0);
    
    let hasChanges = false;
    const updatedVulns = [...(ticket.vulnerabilities || [])];
    const newMessages = [...ticket.messages];

    updatedVulns.forEach((v, idx) => {
      if (v.status === 'Open' && v.dueDate && !v.slaReminderSent) {
        const dueDate = new Date(v.dueDate);
        const diffTime = dueDate.getTime() - now.getTime();
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        
        if (diffDays <= 2) {
          const statusText = diffDays < 0 ? 'OVERDUE' : diffDays === 0 ? 'DUE TODAY' : `DUE IN ${diffDays} DAYS`;
          const msg: ChatMessage = {
            id: `sla-alert-${v.id}-${Date.now()}`,
            sender: 'security',
            text: `[SYSTEM ALERT] Finding "${v.title}" is ${statusText} (Deadline: ${v.dueDate}). Please provide a remediation update in this thread immediately.`,
            timestamp: new Date().toLocaleString()
          };
          
          newMessages.push(msg);
          updatedVulns[idx] = { ...v, slaReminderSent: true };
          hasChanges = true;
        }
      }
    });

    if (hasChanges) {
      const timer = setTimeout(() => {
        onUpdateTicket({
          ...ticket,
          vulnerabilities: updatedVulns,
          messages: newMessages
        });
      }, 500);
      return () => clearTimeout(timer);
    }
  }, [ticket.id]);

  // --- New Message Notification Logic ---
  useEffect(() => {
    if (ticket.messages.length > lastMsgCount) {
      const lastMsg = ticket.messages[ticket.messages.length - 1];
      // Notify if message is from the other party or a system alert
      if (lastMsg.sender !== role || lastMsg.text.includes('[SYSTEM ALERT]')) {
        if (activeTab !== 'discussion') {
          triggerNotification(
            lastMsg.text.includes('[SYSTEM ALERT]') ? 'Urgent System Alert' : 'New Message Received',
            lastMsg.text.length > 60 ? lastMsg.text.substring(0, 60) + '...' : lastMsg.text,
            lastMsg.text.includes('[SYSTEM ALERT]') ? 'alert' : 'msg'
          );
        }
      }
      setLastMsgCount(ticket.messages.length);
    }
  }, [ticket.messages, activeTab]);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [ticket.messages, activeTab]);

  const calculateDueDate = (severity: VulnerabilitySeverity): string => {
      const now = new Date();
      let daysToAdd = 90;
      if (severity === 'Critical') daysToAdd = 7;
      else if (severity === 'High') daysToAdd = 14;
      else if (severity === 'Medium') daysToAdd = 60;
      
      now.setDate(now.getDate() + daysToAdd);
      return now.toISOString().split('T')[0];
  };

  const getSLAInfo = (dueDate?: string, status?: string) => {
    if (!dueDate || status === 'Remediated') return null;
    const due = new Date(dueDate);
    const today = new Date();
    today.setHours(0,0,0,0);
    const diffTime = due.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays < 0) return { label: `Overdue by ${Math.abs(diffDays)}d`, color: 'text-red-600 bg-red-50 border-red-100', isOverdue: true };
    if (diffDays === 0) return { label: `Due Today`, color: 'text-orange-600 bg-orange-50 border-orange-100', isOverdue: false };
    if (diffDays <= 3) return { label: `Due in ${diffDays}d`, color: 'text-orange-600 bg-orange-50 border-orange-100', isOverdue: false };
    return { label: `Due in ${diffDays}d`, color: 'text-gray-500 bg-gray-50 border-gray-100', isOverdue: false };
  };

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim()) return;

    const message: ChatMessage = {
      id: Date.now().toString(),
      sender: role,
      text: newMessage,
      timestamp: new Date().toLocaleString()
    };

    onUpdateTicket({
      ...ticket,
      messages: [...ticket.messages, message],
      unreadFor: role === 'vendor' ? 'security' : 'vendor'
    });
    setNewMessage('');
    // For feedback
    triggerNotification('Message Sent', 'Your comment has been added to the discussion.', 'msg');
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsAnalyzing(true);
    const reader = new FileReader();
    reader.onload = async (event) => {
      const base64 = (event.target?.result as string).split(',')[1];
      const findings = await analyzeReport(base64, file.type);
      
      const newVulns: Vulnerability[] = findings.map((f, i) => ({
        id: `v-${Date.now()}-${i}`,
        title: f.title,
        severity: f.severity as VulnerabilitySeverity,
        status: 'Open',
        impact: f.impact,
        observation: f.observation,
        affectedUrl: f.affectedUrl,
        remediation: f.remediation,
        dueDate: calculateDueDate(f.severity as VulnerabilitySeverity)
      }));

      // Generate the completion summary message
      const crit = newVulns.filter(v => v.severity === 'Critical');
      const high = newVulns.filter(v => v.severity === 'High');
      const med = newVulns.filter(v => v.severity === 'Medium');
      const low = newVulns.filter(v => v.severity === 'Low' || v.severity === 'Info');

      const analystName = teamMembers.find(m => m.id === (assignedTo || ticket.assignedTo))?.name || 'Security Analyst';

      const summaryText = `Hi Team,
We've completed the web application security assessment on ${ticket.appName}. 

Vulnerability Summary: -
Critical - ${crit.length.toString().padStart(2, '0')}
${crit.map(v => `- ${v.title}`).join('\n') || 'None identified.'}

High - ${high.length.toString().padStart(2, '0')}
${high.map(v => `- ${v.title}`).join('\n') || 'None identified.'}

Medium – ${med.length.toString().padStart(2, '0')}
${med.map(v => `- ${v.title}`).join('\n') || 'None identified.'}

Low – ${low.length.toString().padStart(2, '0')}
${low.map(v => `- ${v.title}`).join('\n') || 'None identified.'}

Documentation has been attached to this assessment request. Please note that high-risk vulnerabilities must be remediated, and the site must pass a retest conducted by the assessment team before it is allowed to go live. The team will have 60 days after the go-live date to address medium-risk issues and pass our retesting. Low risk vulnerabilities are optional based on the project team's decision.

To request a retest: After vulnerabilities have been remediated, please send an email to our group inbox (appsecassessment@test.com), and include any additional information we may need (Change of URL, credentials, etc.).

Regards,
${analystName}`;

      const completionMessage: ChatMessage = {
        id: `completion-${Date.now()}`,
        sender: 'security',
        text: summaryText,
        timestamp: new Date().toLocaleString()
      };

      const report: FinalReport = {
        fileName: file.name,
        uploadDate: new Date().toLocaleDateString(),
        fileUrl: URL.createObjectURL(file)
      };

      onUpdateTicket({
        ...ticket,
        status: 'Completed',
        finalReport: report,
        vulnerabilities: [...(ticket.vulnerabilities || []), ...newVulns],
        messages: [...ticket.messages, completionMessage]
      });
      setIsAnalyzing(false);
      setActiveTab('findings');
      triggerNotification('Report Uploaded', 'Assessment results have been parsed and published.', 'msg');
    };
    reader.readAsDataURL(file);
  };

  const handleRetestUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsAnalyzingRetest(true);
    const reader = new FileReader();
    reader.onload = async (event) => {
      const base64 = (event.target?.result as string).split(',')[1];
      const retestFindings = await analyzeRetestReport(base64, file.type);
      
      const updatedVulns = (ticket.vulnerabilities || []).map(vuln => {
          const match = retestFindings.find(f => f.title.toLowerCase().includes(vuln.title.toLowerCase()) || vuln.title.toLowerCase().includes(f.title.toLowerCase()));
          if (match) {
              const newComments = [...(vuln.vendorFixComments || [])];
              if (match.comment) {
                  newComments.push({
                      text: `[SYSTEM RETEST]: ${match.comment}`,
                      timestamp: new Date().toLocaleString()
                  });
              }
              return { 
                  ...vuln, 
                  status: (match.status === 'Remediated' ? 'Remediated' : 'Open') as any,
                  vendorFixComments: newComments 
              };
          }
          return vuln;
      });

      const report: FinalReport = {
        fileName: file.name,
        uploadDate: new Date().toLocaleDateString(),
        fileUrl: URL.createObjectURL(file)
      };

      onUpdateTicket({
        ...ticket,
        retestReports: [...(ticket.retestReports || []), report],
        vulnerabilities: updatedVulns as any
      });
      setIsAnalyzingRetest(false);
      setActiveTab('findings');
      triggerNotification('Retest Verified', `AI Verification complete. Findings updated based on the retest report.`, 'msg');
    };
    reader.readAsDataURL(file);
  };

  const handleUpdateVulnStatus = (vulnId: string, newStatus: 'Open' | 'Ready for Retest' | 'Remediated') => {
    const updatedVulns = (ticket.vulnerabilities || []).map(v => 
      v.id === vulnId ? { ...v, status: newStatus } : v
    );
    onUpdateTicket({ ...ticket, vulnerabilities: updatedVulns });

    // Trigger Notification for 'Ready for Retest'
    if (newStatus === 'Ready for Retest') {
        const vTitle = ticket.vulnerabilities?.find(v => v.id === vulnId)?.title || 'Finding';
        triggerNotification(
            'Ready for Retest', 
            `"${vTitle}" has been queued for security verification.`, 
            'retest'
        );
    } else if (newStatus === 'Remediated') {
        triggerNotification('Finding Remediated', 'The security finding has been officially closed.', 'msg');
    }
  };

  const handleSaveVulnComment = (vulnId: string) => {
    const rawComment = editingComment[vulnId] ?? '';
    if (!rawComment.trim()) return;

    const timestamp = new Date().toLocaleString();
    const newCommentObj = { text: rawComment.trim(), timestamp };

    const updatedVulns = (ticket.vulnerabilities || []).map(v => {
      if (v.id === vulnId) {
        return {
          ...v,
          vendorFixComments: [...(v.vendorFixComments || []), newCommentObj]
        };
      }
      return v;
    });

    onUpdateTicket({ ...ticket, vulnerabilities: updatedVulns });
    
    // Clear the temporary editing state for this ID
    setEditingComment(prev => {
      const newState = { ...prev };
      delete newState[vulnId];
      return newState;
    });

    triggerNotification('Comment Saved', 'Your remediation note has been added to history.', 'msg');
  };

  const handleUpdateGeneral = () => {
    setIsSaving(true);
    setTimeout(() => {
      const updatedMessages = [...ticket.messages];
      
      // Feature: Add tiered SLA message when status transitions to 'In Progress'
      if (status === 'In Progress' && ticket.status !== 'In Progress') {
        let slaDays = 3;
        if (ticket.tier === AppTier.HIGH) slaDays = 7;
        else if (ticket.tier === AppTier.MEDIUM) slaDays = 5;

        const slaMessage: ChatMessage = {
          id: `sla-notification-${Date.now()}`,
          sender: 'security',
          text: `Hi Team, Since this is a ${ticket.tier} tier application, you will get assessment result within ${slaDays} business days.`,
          timestamp: new Date().toLocaleString()
        };
        updatedMessages.push(slaMessage);
      }

      onUpdateTicket({
        ...ticket,
        status,
        scheduledDate: scheduleDate,
        assignedTo,
        messages: updatedMessages,
        unreadFor: (status === 'In Progress' && ticket.status !== 'In Progress') ? 'vendor' : ticket.unreadFor
      });
      setIsSaving(false);
      triggerNotification('Details Updated', 'Application metadata has been saved successfully.', 'msg');
    }, 1000);
  };

  const SectionHeader = ({ icon: Icon, title, subtitle }: { icon: any, title: string, subtitle: string }) => (
    <div className="flex items-center gap-4 border-b border-gray-100 pb-4 mb-6 mt-10 first:mt-0">
      <div className="p-2.5 bg-gray-50 rounded-xl text-gray-600"><Icon className="w-5 h-5" /></div>
      <div>
        <h3 className="text-lg font-bold text-gray-800">{title}</h3>
        <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">{subtitle}</p>
      </div>
    </div>
  );

  const Property = ({ label, value, fullWidth = false, isStatus = false }: { label: string, value: any, fullWidth?: boolean, isStatus?: boolean }) => (
    <div className={`${fullWidth ? 'col-span-2' : ''} space-y-1`}>
      <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest leading-relaxed">{label}</label>
      <div className={`text-sm font-medium ${isStatus ? 'inline-block' : 'block text-gray-900'}`}>
        {typeof value === 'boolean' ? (
          <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${value ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'}`}>
            {value ? 'Yes' : 'No'}
          </span>
        ) : value || <span className="text-gray-300 italic">Not Provided</span>}
      </div>
    </div>
  );

  const calculateNumericalScore = (details: SecurityFormDetails) => {
    const c = parseInt(details.confidentialityRating || '1');
    const i = parseInt(details.integrityRating || '1');
    const a = parseInt(details.availabilityRating || '1');
    return ((c + i + a) / 3).toFixed(2);
  };

  const getFileIcon = (type?: string) => {
    if (type === 'apk' || type === 'ipa') return <Smartphone className="w-4 h-4" />;
    if (type === 'json') return <FileCode className="w-4 h-4" />;
    return <FileText className="w-4 h-4" />;
  };

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-300 pb-20 relative">
      
      {/* Enhanced Global Toast Notification */}
      <div className={`fixed top-8 right-8 z-[100] transition-all duration-500 transform ${notification.show ? 'translate-x-0 opacity-100' : 'translate-x-12 opacity-0 pointer-events-none'}`}>
        <div 
          onClick={() => { if (notification.type === 'msg' || notification.type === 'alert') setActiveTab('discussion'); else setActiveTab('findings'); }}
          className={`bg-white border-2 shadow-2xl rounded-2xl p-4 flex items-center gap-4 cursor-pointer min-w-[320px] max-w-md hover:scale-105 transition-transform ${
            notification.type === 'retest' ? 'border-blue-500 bg-blue-50/50' : 
            notification.type === 'alert' ? 'border-red-500 bg-red-50/50' : 'border-indigo-100'
          }`}
        >
          <div className={`p-3 rounded-xl ${
            notification.type === 'retest' ? 'bg-blue-600 text-white' : 
            notification.type === 'alert' ? 'bg-red-600 text-white' : 'bg-indigo-600 text-white'
          }`}>
            {notification.type === 'retest' ? <RefreshCw className="w-6 h-6 animate-spin-slow" /> : 
             notification.type === 'alert' ? <AlertOctagon className="w-6 h-6 animate-pulse" /> : <MessageSquare className="w-6 h-6" />}
          </div>
          <div className="flex-1">
            <div className="flex items-center justify-between">
                <p className={`text-[10px] font-black uppercase tracking-widest ${
                    notification.type === 'retest' ? 'text-blue-600' : 
                    notification.type === 'alert' ? 'text-red-600' : 'text-indigo-600'
                }`}>{notification.type === 'retest' ? 'Verification Queue' : 'Activity Alert'}</p>
                <button onClick={(e) => { e.stopPropagation(); setNotification(p => ({ ...p, show: false })); }} className="text-gray-400 hover:text-gray-600"><X className="w-4 h-4" /></button>
            </div>
            <p className="text-sm font-black text-gray-900 mt-0.5">{notification.text}</p>
            {notification.subtext && <p className="text-xs text-gray-500 mt-1 line-clamp-2 leading-relaxed">{notification.subtext}</p>}
          </div>
        </div>
      </div>

      <button onClick={onBack} className="flex items-center gap-2 text-sm text-gray-500 hover:text-gray-900 transition-colors group">
        <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" /> Back to Dashboard
      </button>

      {/* Hero Header */}
      <div className="bg-white rounded-[32px] shadow-sm border border-gray-200 p-8 flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
        <div className="flex gap-6 items-center">
            <div className={`w-16 h-16 rounded-2xl flex items-center justify-center border ${
                ticket.tier === AppTier.HIGH ? 'bg-red-50 border-red-100 text-red-600' :
                ticket.tier === AppTier.MEDIUM ? 'bg-orange-50 border-orange-100 text-orange-600' :
                'bg-green-50 border-green-100 text-green-600'
            }`}>
               {ticket.type === 'Mobile' ? <Smartphone className="w-8 h-8" /> : <Globe className="w-8 h-8" />}
            </div>
            <div>
                <div className="flex items-center gap-3 mb-1">
                    <h1 className="text-2xl font-black text-gray-900">{ticket.appName}</h1>
                    <span className="text-xs font-mono text-gray-400 px-2 py-0.5 bg-gray-50 rounded">#{ticket.id}</span>
                </div>
                <div className="flex items-center gap-4 text-sm font-medium text-gray-500">
                    <span className="flex items-center gap-1.5"><Globe className="w-4 h-4" /> {ticket.region}</span>
                    <span className="text-gray-300">•</span>
                    <span className={`font-bold ${
                        ticket.tier === AppTier.HIGH ? 'text-red-600' :
                        ticket.tier === AppTier.MEDIUM ? 'text-orange-600' :
                        'text-green-600'
                    }`}>{ticket.tier} Priority</span>
                </div>
            </div>
        </div>
        <div className={`px-5 py-2 rounded-2xl text-sm font-black border uppercase tracking-widest ${
            ticket.status === 'Completed' ? 'bg-green-100 text-green-800 border-green-200' :
            ticket.status === 'In Progress' ? 'bg-blue-100 text-blue-800 border-blue-200' :
            'bg-gray-100 text-gray-600 border-gray-200'
        }`}> {ticket.status} </div>
      </div>

      <div className="flex gap-1 bg-gray-100 p-1.5 rounded-2xl w-fit relative">
          {['overview', 'discussion', 'report', 'findings'].map(tab => (
              <button 
                key={tab} 
                onClick={() => setActiveTab(tab as any)}
                className={`px-6 py-2.5 rounded-xl text-sm font-bold transition-all capitalize relative ${activeTab === tab ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
              >
                {tab}
                {tab === 'discussion' && activeTab !== 'discussion' && ticket.unreadFor === role && (
                   <span className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full border-2 border-white animate-pulse" />
                )}
              </button>
          ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-8">
          
          {activeTab === 'overview' && ticket.details && (
              <div className="bg-white rounded-[32px] shadow-sm border border-gray-200 p-8 space-y-2">
                  {/* Artifacts Section at the top of overview for easy access */}
                  <SectionHeader icon={Box} title="Submission Artifacts" subtitle="APK, IPA, JSON, and Workflow Docs" />
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-10">
                    {(!ticket.artifacts || ticket.artifacts.length === 0) ? (
                      <div className="col-span-2 p-6 bg-gray-50 rounded-2xl border border-dashed border-gray-200 text-center">
                        <p className="text-xs text-gray-400 italic">No additional artifacts provided with this submission.</p>
                      </div>
                    ) : (
                      ticket.artifacts.map((art, idx) => (
                        <div key={idx} className="p-4 bg-white border border-gray-100 rounded-2xl flex items-center justify-between shadow-sm hover:border-emerald-200 transition-colors">
                          <div className="flex items-center gap-3 overflow-hidden">
                            <div className="p-2 bg-emerald-50 rounded-xl text-emerald-600 flex-shrink-0">
                              {getFileIcon(art.type)}
                            </div>
                            <div className="min-w-0">
                              <p className="text-sm font-bold text-gray-900 truncate">{art.name}</p>
                              <p className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">{art.size || 'Unknown size'} • {art.type}</p>
                            </div>
                          </div>
                          <a href={art.url} download={art.name} className="p-2 text-gray-400 hover:text-emerald-600 transition-colors">
                            <Download className="w-4 h-4" />
                          </a>
                        </div>
                      ))
                    )}
                  </div>

                  <SectionHeader icon={ClipboardList} title="1. Application Information" subtitle="Project Identity & Classification" />
                  <div className="grid grid-cols-2 gap-8">
                      <Property label="1) Application Name" value={ticket.appName} />
                      <Property label="2) Application Type" value={ticket.type} />
                      <Property label="3) Application Descriptions" value={ticket.details.description} fullWidth />
                      <Property label="4) Target Audience Region" value={ticket.details.targetAudienceRegion || ticket.region} />
                      <Property label="6) Developed By" value={ticket.details.isTcccOwned} />
                      <Property label="5) External/Internal Audience Type" value={ticket.details.isExternalSite} fullWidth />
                  </div>

                  <SectionHeader icon={Users} title="2. Contacts" subtitle="Stakeholders & Responsibility" />
                  <div className="grid grid-cols-2 gap-8">
                      <Property label="Business Owner" value={ticket.details.businessOwner} />
                      <Property label="IT Project Manager" value={ticket.details.itProjectManager} />
                      <Property label="Technical Contact" value={ticket.details.techContact} />
                  </div>

                  <SectionHeader icon={Clock} title="3. Timeline & Urgency" subtitle="Scheduling Requirements" />
                  <div className="grid grid-cols-2 gap-8">
                      <Property label="Go Live Date" value={ticket.details.goLiveDate} />
                      <Property label="Testing Deadline" value={ticket.details.testingDeadline} />
                      <Property label="Blackout Dates" value={ticket.details.blackoutDates} />
                      <Property label="Expedited?" value={ticket.isExpedited} isStatus />
                      {ticket.isExpedited && <Property label="Expedite Reason" value={ticket.details.expeditedReason} fullWidth />}
                  </div>

                  <SectionHeader icon={ShieldCheck} title="4. Tier Determination" subtitle="CIA Risk Profile" />
                  <div className="grid grid-cols-2 gap-8">
                      <Property label="1) Business Criticality" value={ticket.details.businessCriticality} />
                      <Property label="2) Confidentiality Rating" value={`${ticket.details.confidentialityRating}/3`} />
                      <Property label="3) Availability Rating" value={`${ticket.details.availabilityRating}/3`} />
                      <Property label="4) Integrity Rating" value={`${ticket.details.integrityRating}/3`} />
                      <div className="col-span-2 p-4 bg-gray-50 rounded-2xl flex items-center justify-between mt-2">
                        <Property label="5) Application Tier" value={ticket.details.calculatedTier} />
                        <div className="text-right">
                          <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Numerical CIA Score</span>
                          <div className="text-lg font-black text-gray-900">{calculateNumericalScore(ticket.details)}</div>
                        </div>
                      </div>
                  </div>

                  <SectionHeader icon={Database} title="5. Pre-Requisites & Tech Stack" subtitle="DevSecOps & Hosting" />
                  <div className="grid grid-cols-2 gap-8">
                      <Property label="1) DevSecOps Implementation Status" value={ticket.details.devSecOpsImplemented} fullWidth />
                      <Property label="2) Weaknesses Remediated?" value={ticket.details.allWeaknessesRemediated} isStatus />
                      <Property label="3) WAF Turned Off for Testing?" value={ticket.details.wafDisabled} isStatus />
                      <Property label="4) Environment Prerequisites" value={ticket.details.environmentPrereqs} fullWidth />
                      <Property label="5) Coding Strategy" value={ticket.details.isCustomCoded} />
                      <Property label="7) Code Repository Platform" value={ticket.details.repoUrl} />
                      <Property label="6) Technology Stack & Hosting" value={ticket.details.techStack} fullWidth />
                      <Property label="8) Prior Security Assessments" value={ticket.details.priorAssessment} fullWidth />
                      <Property label="9) Staging URL Provided" value={ticket.details.testUrlProvided} fullWidth />
                      <Property label="10) Out of Scope Areas" value={ticket.details.outOfScopeItems} fullWidth />
                      <Property label="11) Vendor Permission Granted?" value={ticket.details.vendorPermission} isStatus />
                  </div>

                  <SectionHeader icon={Laptop} title="6. Web App Testing Information" subtitle="Execution Prerequisites" />
                  <div className="grid grid-cols-2 gap-8">
                      <Property label="1) Key Transactions & Walkthrough Docs" value={ticket.details.walkthroughInfo} fullWidth />
                      <Property label="2) Email Functionality?" value={ticket.details.hasEmailFunctionality} isStatus />
                      <Property label="3) Prize-based Rewards/PIN Codes?" value={ticket.details.hasPromotionalActivities} isStatus />
                      {ticket.details.hasPromotionalActivities && <Property label="PIN Codes / Promo Details" value={ticket.details.knownSecurityConcerns} fullWidth />}
                      <Property label="4) Ecommerce/Payment Functionality?" value={ticket.details.hasEcommerce} isStatus />
                      {ticket.details.hasEcommerce && <Property label="Dynamic Payment Field Details" value={ticket.details.apiHandlesSensitiveData} fullWidth />}
                      <Property label="5) Test Accounts (Users/Admins)" value={ticket.details.testAccountsProvided} fullWidth />
                      <Property label="6) PII Collection Details" value={ticket.details.piiCollectionDetails} fullWidth />
                      <Property label="7) File Upload Details" value={ticket.details.fileUploadFunctionality} fullWidth />
                  </div>

                  <SectionHeader icon={Server} title="7. API Testing" subtitle="Integrations & Data Exchange" />
                  <div className="grid grid-cols-2 gap-8">
                      <Property label="1) API Protocol & Style" value={ticket.details.apiProtocol} />
                      <Property label="2) Target Audience" value={ticket.details.apiTargetAudience} />
                      <Property label="3) API Documentation" value={ticket.details.apiDocumentation} fullWidth />
                      <Property label="4) Auth Mechanisms" value={ticket.details.apiAuthMechanisms} fullWidth />
                      <Property label="5) Sensitive Data Handled" value={ticket.details.apiHandlesSensitiveData} fullWidth />
                  </div>

                  <SectionHeader icon={Lock} title="8. Authentication and Authorization" subtitle="Access Controls & Session Security" />
                  <div className="grid grid-cols-2 gap-8">
                      <Property label="1) Protected by Auth?" value={ticket.details.isProtectedByAuth} isStatus />
                      <Property label="2) Auth Mechanisms" value={ticket.details.authMechanisms} fullWidth />
                      <Property label="3) Session & Token Policies" value={ticket.details.sessionExpirationPolicies} fullWidth />
                      <Property label="4) Session Management Details" value={ticket.details.sessionValidationHandled} fullWidth />
                      <Property label="5) Password & Lockout Policies" value={ticket.details.passwordPolicies} fullWidth />
                  </div>

                  <SectionHeader icon={ShieldAlert} title="9. Compliance and Security Concerns" subtitle="Policy & Global Risk" />
                  <div className="grid grid-cols-2 gap-8">
                      <Property label="1) Coca-Cola PII Policy?" value={ticket.details.cocaColaPiiPolicy} isStatus />
                      <Property label="2) Geo-Compliance / GDPR / PCI" value={ticket.details.geoCompliance} fullWidth />
                      <Property label="3) Region-Specific Data" value={ticket.details.regionSpecificData} fullWidth />
                      <Property label="4) Multilingual Support" value={ticket.details.multilingualSupport} fullWidth />
                      <Property label="5) Known Security Concerns" value={ticket.details.knownSecurityConcerns} fullWidth />
                  </div>
              </div>
          )}

          {activeTab === 'discussion' && (
            <div className="bg-white rounded-[32px] shadow-sm border border-gray-200 flex flex-col h-[600px] overflow-hidden">
                <div className="p-6 border-b border-gray-100 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <MessageSquare className="w-5 h-5 text-blue-600" />
                        <h3 className="font-bold text-gray-800">Discussion History</h3>
                    </div>
                    <button 
                      onClick={async () => {
                        setIsSummarizing(true);
                        const summary = await summarizeDiscussion(ticket.messages);
                        alert(summary);
                        setIsSummarizing(false);
                      }}
                      className="text-xs font-bold text-blue-600 hover:text-blue-700 flex items-center gap-1 bg-blue-50 px-3 py-1.5 rounded-lg transition-colors"
                    >
                        {isSummarizing ? <Loader2 className="w-3 h-3 animate-spin" /> : <Sparkles className="w-3 h-3" />}
                        AI Summarize
                    </button>
                </div>
                
                <div ref={scrollRef} className="flex-1 overflow-y-auto p-6 space-y-4 bg-gray-50/50">
                    {ticket.messages.length === 0 ? (
                        <div className="h-full flex flex-col items-center justify-center text-gray-400 gap-2">
                            <MessageSquare className="w-12 h-12 opacity-20" />
                            <p className="text-sm font-medium">No messages yet. Start the conversation.</p>
                        </div>
                    ) : (
                        ticket.messages.map((msg) => {
                          const isSystemAlert = msg.text.includes('[SYSTEM ALERT]');
                          const senderIsMe = msg.sender === role;
                          
                          return (
                            <div key={msg.id} className={`flex flex-col ${senderIsMe ? 'items-end' : 'items-start'}`}>
                                <div className={`max-w-[80%] rounded-2xl p-4 shadow-sm ${
                                    isSystemAlert 
                                    ? 'bg-red-600 text-white border-none' 
                                    : senderIsMe 
                                    ? 'bg-blue-600 text-white rounded-tr-none' 
                                    : 'bg-white border border-gray-200 text-gray-800 rounded-tl-none'
                                }`}>
                                    {isSystemAlert && (
                                      <div className="flex items-center gap-2 mb-2 pb-2 border-b border-white/20">
                                         <AlertOctagon className="w-4 h-4" />
                                         <span className="text-[10px] font-black uppercase tracking-widest">Urgent System Alert</span>
                                      </div>
                                    )}
                                    <p className="text-sm leading-relaxed whitespace-pre-wrap">{msg.text}</p>
                                </div>
                                <span className="text-[10px] text-gray-400 mt-1 font-bold px-1 uppercase tracking-widest">{msg.timestamp}</span>
                            </div>
                          );
                        })
                    )}
                </div>

                <form onSubmit={handleSendMessage} className="p-4 border-t border-gray-100 bg-white">
                    <div className="flex gap-2">
                        <input 
                          type="text" 
                          value={newMessage}
                          onChange={(e) => setNewMessage(e.target.value)}
                          placeholder="Type your message..."
                          className="flex-1 px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none text-sm transition-all"
                        />
                        <button type="submit" className="p-3 bg-blue-600 text-white rounded-xl hover:bg-blue-700 active:scale-95 transition-all shadow-lg shadow-blue-500/20">
                            <Send className="w-5 h-5" />
                        </button>
                    </div>
                </form>
            </div>
          )}

          {activeTab === 'report' && (
            <div className="space-y-8">
                {/* Final Assessment Report Section */}
                <div className="bg-white rounded-[32px] shadow-sm border border-gray-200 p-8">
                    <SectionHeader icon={FileArchive} title="Final Assessment Report" subtitle="Official Security Documentation" />
                    
                    {ticket.finalReport ? (
                        <div className="p-6 bg-gray-50 rounded-2xl border border-gray-200 flex items-center justify-between">
                            <div className="flex items-center gap-4">
                                <div className="p-3 bg-red-100 rounded-xl text-red-600">
                                    <FileText className="w-8 h-8" />
                                </div>
                                {ticket.finalReport && (
                                  <div>
                                      <h4 className="font-bold text-gray-800">{ticket.finalReport.fileName}</h4>
                                      <p className="text-xs text-gray-400">Uploaded on {ticket.finalReport.uploadDate}</p>
                                  </div>
                                )}
                            </div>
                            <div className="flex gap-2">
                                <a 
                                  href={ticket.finalReport.fileUrl} 
                                  download={ticket.finalReport.fileName}
                                  className="p-2 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors shadow-sm"
                                >
                                    <Download className="w-5 h-5 text-gray-600" />
                                </a>
                                {role === 'security' && (
                                    <button 
                                      onClick={() => fileInputRef.current?.click()}
                                      className="p-2 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors shadow-sm"
                                    >
                                        <RotateCcw className="w-5 h-5 text-blue-600" />
                                    </button>
                                )}
                            </div>
                        </div>
                    ) : (
                        <div className="flex flex-col items-center justify-center py-12 bg-gray-50 rounded-2xl border-2 border-dashed border-gray-200 group">
                            <div className="p-4 bg-white rounded-2xl shadow-sm border border-gray-100 mb-4 group-hover:scale-110 transition-transform">
                                <Upload className="w-8 h-8 text-gray-400" />
                            </div>
                            <h4 className="font-bold text-gray-800">No Final Report Available</h4>
                            <p className="text-sm text-gray-500 mb-6 text-center px-4">Initial assessment results will be generated here once uploaded.</p>
                            
                            {role === 'security' && (
                                <button 
                                  onClick={() => fileInputRef.current?.click()}
                                  disabled={isAnalyzing}
                                  className="px-8 py-3 bg-blue-600 text-white rounded-2xl font-bold text-sm hover:bg-blue-700 transition-all shadow-xl shadow-blue-500/20 active:scale-95 flex items-center gap-2"
                                >
                                    {isAnalyzing ? <Loader2 className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />}
                                    {isAnalyzing ? 'Analyzing with AI...' : 'Upload & Analyze Final Report'}
                                </button>
                            )}
                        </div>
                    )}
                    <input type="file" ref={fileInputRef} onChange={handleFileUpload} className="hidden" accept=".pdf,.png,.jpg,.jpeg" />
                </div>

                {/* Retest Reports Section */}
                <div className="bg-white rounded-[32px] shadow-sm border border-gray-200 p-8">
                    <div className="flex items-center justify-between mb-8">
                        <SectionHeader icon={History} title="Retest & Verification Reports" subtitle="Remediation Validation History" />
                        {role === 'security' && (
                             <button 
                                onClick={() => retestInputRef.current?.click()}
                                disabled={isAnalyzingRetest}
                                className="px-6 py-2.5 bg-indigo-600 text-white rounded-xl font-bold text-xs hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-500/20 active:scale-95 flex items-center gap-2"
                             >
                                 {isAnalyzingRetest ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <SearchCheck className="w-3.5 h-3.5" />}
                                 {isAnalyzingRetest ? 'AI Verification...' : 'Upload Retest Report'}
                             </button>
                        )}
                    </div>

                    <div className="space-y-4">
                        {(!ticket.retestReports || ticket.retestReports.length === 0) ? (
                            <div className="flex flex-col items-center justify-center py-10 bg-gray-50/50 rounded-2xl border border-gray-100">
                                <p className="text-sm text-gray-400 italic">No retest reports uploaded yet.</p>
                            </div>
                        ) : (
                            ticket.retestReports.map((report, idx) => (
                                <div key={idx} className="p-4 bg-white border border-gray-100 rounded-2xl flex items-center justify-between shadow-sm hover:border-indigo-200 transition-colors">
                                    <div className="flex items-center gap-4">
                                        <div className="p-2 bg-indigo-50 rounded-xl text-indigo-600">
                                            <FileText className="w-5 h-5" />
                                        </div>
                                        <div>
                                            <h4 className="text-sm font-bold text-gray-800">{report.fileName}</h4>
                                            <p className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">Retest Date: {report.uploadDate}</p>
                                        </div>
                                    </div>
                                    <a 
                                      href={report.fileUrl} 
                                      download={report.fileName}
                                      className="p-2 text-gray-400 hover:text-indigo-600 transition-colors"
                                    >
                                        <Download className="w-5 h-5" />
                                    </a>
                                </div>
                            ))
                        )}
                    </div>
                    <input type="file" ref={retestInputRef} onChange={handleRetestUpload} className="hidden" accept=".pdf,.png,.jpg,.jpeg" />
                </div>
            </div>
          )}

          {activeTab === 'findings' && (
            <div className="space-y-6">
                 <div className="bg-white rounded-[32px] shadow-sm border border-gray-200 overflow-hidden">
                    <div className="p-6 border-b border-gray-100 flex flex-wrap items-center justify-between bg-gray-50/50 gap-4">
                        <div className="flex items-center gap-3">
                            <Bug className="w-5 h-5 text-red-600" />
                            <h3 className="font-bold text-gray-800">Security Findings</h3>
                        </div>
                        
                        {/* Finding Counts */}
                        <div className="flex flex-wrap gap-2 items-center">
                            {/* Severity Counts Section */}
                            <div className="flex gap-1.5 mr-2 pr-3 border-r border-gray-200">
                                {(() => {
                                    const v = ticket.vulnerabilities || [];
                                    const c = v.filter(i => i.severity === 'Critical').length;
                                    const h = v.filter(i => i.severity === 'High').length;
                                    const m = v.filter(i => i.severity === 'Medium').length;
                                    return (
                                        <>
                                            {c > 0 && <span className="text-[10px] font-black uppercase tracking-widest bg-red-600 text-white px-2 py-1 rounded-lg shadow-sm">{c} Critical</span>}
                                            {h > 0 && <span className="text-[10px] font-black uppercase tracking-widest bg-orange-500 text-white px-2 py-1 rounded-lg shadow-sm">{h} High</span>}
                                            {m > 0 && <span className="text-[10px] font-black uppercase tracking-widest bg-yellow-500 text-white px-2 py-1 rounded-lg shadow-sm">{m} Medium</span>}
                                        </>
                                    );
                                })()}
                            </div>
                            
                            {/* Status Counts Section */}
                            <span className="text-[10px] font-black uppercase tracking-widest bg-white text-red-600 border border-red-100 px-3 py-1 rounded-lg shadow-sm">
                                {(ticket.vulnerabilities || []).filter(v => v.status === 'Open').length} Open
                            </span>
                            <span className="text-[10px] font-black uppercase tracking-widest bg-blue-50 text-blue-700 border border-blue-100 px-3 py-1 rounded-lg shadow-sm">
                                {(ticket.vulnerabilities || []).filter(v => v.status === 'Ready for Retest').length} In Retest
                            </span>
                            <span className="text-[10px] font-black uppercase tracking-widest bg-green-100 text-green-700 px-3 py-1 rounded-lg shadow-sm">
                                {(ticket.vulnerabilities || []).filter(v => v.status === 'Remediated').length} Fixed
                            </span>
                        </div>
                    </div>
                    
                    <div className="divide-y divide-gray-100">
                        {(!ticket.vulnerabilities || ticket.vulnerabilities.length === 0) ? (
                            <div className="p-20 text-center text-gray-400 flex flex-col items-center">
                                <CheckCircle2 className="w-12 h-12 text-green-500 opacity-20 mb-3" />
                                <p className="font-medium">No vulnerabilities reported.</p>
                            </div>
                        ) : (
                            ticket.vulnerabilities.map((vuln) => {
                                const isExpanded = expandedVulnId === vuln.id;
                                const currentDraft = editingComment[vuln.id] ?? '';
                                const slaInfo = getSLAInfo(vuln.dueDate, vuln.status);
                                
                                return (
                                <div key={vuln.id} className="transition-all duration-300">
                                    <div 
                                        onClick={() => setExpandedVulnId(isExpanded ? null : vuln.id)}
                                        className={`p-6 hover:bg-gray-50 transition-colors group cursor-pointer flex items-start justify-between gap-4 ${isExpanded ? 'bg-gray-50/80 border-l-4 border-l-blue-600' : ''}`}
                                    >
                                        <div className="flex gap-4">
                                            <div className={`mt-1 p-2 rounded-lg ${
                                                vuln.severity === 'Critical' ? 'bg-red-100 text-red-600' :
                                                vuln.severity === 'High' ? 'bg-orange-100 text-orange-600' :
                                                vuln.severity === 'Medium' ? 'bg-yellow-100 text-yellow-600' :
                                                'bg-blue-100 text-blue-600'
                                            }`}>
                                                <AlertOctagon className="w-5 h-5" />
                                            </div>
                                            <div>
                                                <h4 className="font-bold text-gray-900 leading-tight group-hover:text-blue-600 transition-colors">{vuln.title}</h4>
                                                <div className="flex items-center flex-wrap gap-y-2 gap-x-3 mt-2">
                                                    <span className={`text-[10px] font-black uppercase tracking-widest px-2 py-0.5 rounded ${
                                                        vuln.severity === 'Critical' ? 'bg-red-50 text-red-700' :
                                                        vuln.severity === 'High' ? 'bg-orange-50 text-orange-700' :
                                                        'bg-yellow-50 text-yellow-700'
                                                    }`}>
                                                        {vuln.severity}
                                                    </span>
                                                    <span className="text-gray-300">•</span>
                                                    <span className={`text-[10px] font-black uppercase tracking-widest ${
                                                      vuln.status === 'Remediated' ? 'text-green-600' : 
                                                      vuln.status === 'Ready for Retest' ? 'text-blue-600' : 'text-red-500'
                                                    }`}>
                                                        {vuln.status}
                                                    </span>
                                                    {slaInfo && (
                                                        <>
                                                            <span className="text-gray-300">•</span>
                                                            <span className={`text-[10px] font-black uppercase tracking-widest px-2 py-0.5 rounded border flex items-center gap-1.5 ${slaInfo.color}`}>
                                                                <Timer className={`w-3 h-3 ${slaInfo.isOverdue ? 'animate-pulse' : ''}`} />
                                                                {slaInfo.label}
                                                            </span>
                                                        </>
                                                    )}
                                                    {vuln.affectedUrl && (
                                                        <>
                                                            <span className="text-gray-300">•</span>
                                                            <div className="flex items-center gap-1 text-[10px] text-gray-400 font-medium truncate max-w-[200px]">
                                                                <LucideLink className="w-3 h-3" /> {vuln.affectedUrl}
                                                            </div>
                                                        </>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                        
                                        <div className="flex items-center gap-2">
                                            {/* Action Buttons for Findings */}
                                            {role === 'vendor' ? (
                                              <>
                                                {vuln.status === 'Open' && (
                                                  <button 
                                                    onClick={(e) => { e.stopPropagation(); handleUpdateVulnStatus(vuln.id, 'Ready for Retest'); }}
                                                    className="px-4 py-2 bg-white border border-gray-200 rounded-xl text-xs font-bold text-gray-600 hover:bg-blue-50 hover:text-blue-700 hover:border-blue-100 transition-all shadow-sm flex items-center gap-2"
                                                  >
                                                      <Check className="w-3.5 h-3.5" />
                                                      Mark as Fixed
                                                  </button>
                                                )}
                                                {vuln.status === 'Ready for Retest' && (
                                                  <span className="px-4 py-2 bg-blue-50 text-blue-700 rounded-xl text-xs font-bold border border-blue-100 flex items-center gap-2 opacity-60">
                                                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                                                      Pending Retest
                                                  </span>
                                                )}
                                              </>
                                            ) : (
                                              /* Security Role Buttons */
                                              <div className="flex items-center gap-2">
                                                {vuln.status === 'Ready for Retest' && (
                                                  <>
                                                    <button 
                                                      onClick={(e) => { e.stopPropagation(); handleUpdateVulnStatus(vuln.id, 'Remediated'); }}
                                                      className="px-4 py-2 bg-green-600 text-white rounded-xl text-xs font-bold hover:bg-green-700 transition-all shadow-sm flex items-center gap-2"
                                                    >
                                                        <CheckCircle2 className="w-3.5 h-3.5" />
                                                        Verify & Close
                                                    </button>
                                                    <button 
                                                      onClick={(e) => { e.stopPropagation(); handleUpdateVulnStatus(vuln.id, 'Open'); }}
                                                      className="px-4 py-2 bg-white border border-red-200 rounded-xl text-xs font-bold text-red-600 hover:bg-red-50 transition-all shadow-sm flex items-center gap-2"
                                                    >
                                                        <X className="w-3.5 h-3.5" />
                                                        Reject Fix
                                                    </button>
                                                  </>
                                                )}
                                                {vuln.status === 'Open' && (
                                                  <button 
                                                    onClick={(e) => { e.stopPropagation(); handleUpdateVulnStatus(vuln.id, 'Remediated'); }}
                                                    className="px-4 py-2 bg-white border border-gray-200 rounded-xl text-xs font-bold text-gray-600 hover:bg-green-50 hover:text-green-700 hover:border-green-100 transition-all shadow-sm flex items-center gap-2"
                                                  >
                                                      <Check className="w-3.5 h-3.5" />
                                                      Force Remediate
                                                  </button>
                                                )}
                                                {vuln.status === 'Remediated' && (
                                                  <button 
                                                    onClick={(e) => { e.stopPropagation(); handleUpdateVulnStatus(vuln.id, 'Open'); }}
                                                    className="px-4 py-2 bg-white border border-gray-200 rounded-xl text-xs font-bold text-gray-600 hover:bg-red-50 hover:text-red-700 hover:border-red-100 transition-all shadow-sm flex items-center gap-2"
                                                  >
                                                      <RotateCcw className="w-3.5 h-3.5" />
                                                      Re-open Finding
                                                  </button>
                                                )}
                                              </div>
                                            )}
                                            <div className="p-2 text-gray-400">
                                                {isExpanded ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
                                            </div>
                                        </div>
                                    </div>

                                    {/* Detailed Finding View */}
                                    {isExpanded && (
                                        <div className="px-10 md:px-20 py-10 bg-white border-t border-gray-100 space-y-6 animate-in slide-in-from-top-4 duration-300 border-b border-gray-50">
                                            
                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                                <CollapsibleFindingSection 
                                                  title="Impact Assessment" 
                                                  icon={Activity} 
                                                  content={vuln.impact || ''} 
                                                  themeColor="bg-red-50 text-red-500"
                                                />
                                                <CollapsibleFindingSection 
                                                  title="Observations & Findings" 
                                                  icon={Eye} 
                                                  content={vuln.observation || ''} 
                                                  themeColor="bg-purple-50 text-purple-500"
                                                />
                                            </div>

                                            <CollapsibleFindingSection 
                                              title="Remediation Recommendation" 
                                              icon={CheckCircle2} 
                                              content={vuln.remediation || ''} 
                                              themeColor="bg-green-50 text-green-500"
                                            />

                                            {/* Immutable Remediation History */}
                                            <div className="space-y-4 pt-4 border-t border-gray-100 relative">
                                                <h5 className="text-[10px] font-black text-gray-400 uppercase tracking-widest flex items-center gap-2 border-b border-gray-100 pb-2">
                                                    <MessageCircle className="w-4 h-4 text-blue-500" /> Remediation Comment History
                                                </h5>
                                                
                                                <div className="space-y-3">
                                                    {(!vuln.vendorFixComments || vuln.vendorFixComments.length === 0) ? (
                                                        <div className="text-xs text-gray-400 italic">No remediation comments provided yet.</div>
                                                    ) : (
                                                        vuln.vendorFixComments.map((c, idx) => (
                                                            <div key={idx} className="bg-gray-50 rounded-xl p-4 border border-gray-100 relative group/comment">
                                                                <div className="flex items-center justify-between mb-1">
                                                                    <span className="text-[9px] font-black text-blue-600 uppercase tracking-tighter">Saved Note #{idx + 1}</span>
                                                                    <span className="text-[9px] font-bold text-gray-400">{c.timestamp}</span>
                                                                </div>
                                                                <p className="text-sm text-gray-800 leading-relaxed whitespace-pre-wrap">{c.text}</p>
                                                            </div>
                                                        ))
                                                    )}
                                                </div>

                                                {/* New Comment Input (Vendors Only) */}
                                                {role === 'vendor' && (
                                                    <div className="space-y-3 pt-4 mt-6 border-t border-gray-50 bg-blue-50/20 p-6 rounded-2xl border border-dashed border-blue-100">
                                                        <label className="text-[10px] font-black text-blue-600 uppercase tracking-widest mb-1 block">Add New Remediation Update</label>
                                                        <textarea 
                                                            rows={3}
                                                            value={currentDraft}
                                                            onChange={(e) => setEditingComment(prev => ({ ...prev, [vuln.id]: e.target.value }))}
                                                            placeholder="Describe how this vulnerability was remediated. Once saved, this note cannot be edited."
                                                            className="w-full px-4 py-3 bg-white border border-gray-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all outline-none text-sm text-gray-900 shadow-sm"
                                                        />
                                                        <div className="flex items-center gap-3">
                                                            <button 
                                                                onClick={() => handleSaveVulnComment(vuln.id)}
                                                                disabled={!currentDraft.trim()}
                                                                className="px-6 py-2 bg-blue-600 text-white rounded-xl text-xs font-bold hover:bg-blue-700 transition-all shadow-lg shadow-blue-500/20 flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                                                            >
                                                                <Save className="w-3.5 h-3.5" />
                                                                Save New Comment
                                                            </button>
                                                        </div>
                                                    </div>
                                                )}
                                            </div>

                                            <div className="pt-6 border-t border-gray-100 flex flex-wrap gap-8">
                                                {vuln.affectedUrl && (
                                                    <div className="flex items-center gap-4">
                                                        <div className="flex items-center gap-2">
                                                            <LucideLink className="w-4 h-4 text-gray-400" />
                                                            <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Affected Endpoint</span>
                                                        </div>
                                                        <code className="text-xs bg-gray-100 px-4 py-2 rounded-xl text-blue-700 font-bold border border-gray-200 break-all">
                                                            {vuln.affectedUrl}
                                                        </code>
                                                    </div>
                                                )}
                                                {vuln.dueDate && (
                                                    <div className="flex items-center gap-4">
                                                        <div className="flex items-center gap-2">
                                                            <Calendar className="w-4 h-4 text-gray-400" />
                                                            <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Remediation Deadline</span>
                                                        </div>
                                                        <span className="text-sm font-bold text-gray-700">
                                                            {new Date(vuln.dueDate).toLocaleDateString()}
                                                        </span>
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    )}
                                </div>
                                );
                            })
                        )}
                    </div>
                 </div>
            </div>
          )}
        </div>

        {/* Sidebar Controls */}
        <div className="space-y-6">
            <div className="bg-white rounded-[32px] shadow-sm border border-gray-200 p-8 space-y-8 sticky top-6">
                <div>
                    <h4 className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-4">Assessment Status</h4>
                    <select 
                      disabled={role !== 'security'}
                      value={status}
                      onChange={(e) => setStatus(e.target.value as TicketStatus)}
                      className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl font-bold text-sm text-gray-800 outline-none focus:ring-2 focus:ring-blue-500/20"
                    >
                        <option value="Pending">Pending Review</option>
                        <option value="In Review">Under Review</option>
                        <option value="Scheduled">Scheduled</option>
                        <option value="In Progress">Assessment in Progress</option>
                        <option value="Completed">Assessment Completed</option>
                        <option value="Rejected">Rejected</option>
                    </select>
                    
                    {/* Assessment Completion Date (Non-editable) */}
                    {ticket.status === 'Completed' && ticket.finalReport && (
                        <div className="mt-4 p-4 bg-emerald-50 rounded-2xl border border-emerald-100 animate-in fade-in slide-in-from-top-1">
                            <h5 className="text-[9px] font-black text-emerald-600 uppercase tracking-widest flex items-center gap-1.5 mb-1">
                                <CheckCircle2 className="w-3 h-3" /> Assessment Finalized
                            </h5>
                            <p className="text-xs font-bold text-emerald-900">{ticket.finalReport.uploadDate}</p>
                        </div>
                    )}

                    {/* Retest Info (Non-editable) */}
                    {ticket.retestReports && ticket.retestReports.length > 0 && (
                        <div className="mt-2 p-4 bg-blue-50 rounded-2xl border border-blue-100 animate-in fade-in slide-in-from-top-1">
                            <h5 className="text-[9px] font-black text-blue-600 uppercase tracking-widest flex items-center gap-1.5 mb-1">
                                <SearchCheck className="w-3 h-3" /> Retest Statistics
                            </h5>
                            <div className="flex justify-between items-end">
                                <div>
                                    <p className="text-[10px] text-blue-800 font-medium">Last Verification</p>
                                    <p className="text-xs font-bold text-blue-900">{ticket.retestReports[ticket.retestReports.length - 1].uploadDate}</p>
                                </div>
                                <div className="text-right">
                                    <p className="text-[10px] text-blue-800 font-medium">Count</p>
                                    <p className="text-xs font-black text-blue-900">{ticket.retestReports.length}</p>
                                </div>
                            </div>
                        </div>
                    )}
                </div>

                <div>
                    <h4 className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-4">Assigned Analyst</h4>
                    <select 
                      disabled={role !== 'security'}
                      value={assignedTo}
                      onChange={(e) => setAssignedTo(e.target.value)}
                      className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl font-bold text-sm text-gray-800 outline-none focus:ring-2 focus:ring-blue-500/20"
                    >
                        <option value="">Unassigned</option>
                        {teamMembers.map(m => (
                            <option key={m.id} value={m.id}>{m.name}</option>
                        ))}
                    </select>
                </div>

                <div>
                    <h4 className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-4">Scheduled Date</h4>
                    <CalendarPicker 
                      value={scheduleDate} 
                      onChange={setScheduleDate} 
                      disabled={role !== 'security'} 
                    />
                </div>

                {role === 'security' && (
                    <button 
                      onClick={handleUpdateGeneral}
                      disabled={isSaving}
                      className="w-full py-4 bg-gray-900 text-white rounded-[20px] font-black text-sm hover:bg-black transition-all shadow-xl active:scale-95 flex justify-center items-center gap-2"
                    >
                        {isSaving ? <Loader2 className="w-5 h-5 animate-spin" /> : <Save className="w-5 h-5" />}
                        {isSaving ? 'Updating...' : 'Save Changes'}
                    </button>
                )}

                <div className="p-6 bg-blue-50 rounded-[24px] border border-blue-100">
                    <div className="flex items-center gap-3 mb-3">
                        <Info className="w-4 h-4 text-blue-600" />
                        <h5 className="text-xs font-black text-blue-900 uppercase tracking-widest">Next Actions</h5>
                    </div>
                    <p className="text-[11px] text-blue-800 font-medium leading-relaxed">
                        {status === 'Pending' ? 'Review initial application details and assign a security analyst.' :
                         status === 'In Review' ? 'Review documentation and schedule a walkthrough session.' :
                         status === 'Scheduled' ? 'Conduct assessment on the scheduled date.' :
                         status === 'In Progress' ? 'Perform manual testing and identify vulnerabilities.' :
                         'Remediate any open findings to receive a final sign-off.'}
                    </p>
                </div>
            </div>
        </div>
      </div>
    </div>
  );
};
