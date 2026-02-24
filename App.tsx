
import React, { useState, useEffect } from 'react';
import { TicketList } from './components/TicketList';
import { TicketForm } from './components/TicketForm';
import { TicketDetail } from './components/TicketDetail';
import { LoginPage } from './components/LoginPage';
import { SidebarCalendar } from './components/SidebarCalendar';
import { Ticket, AppTier, AssessmentType, TeamMember, TicketStatus, Vulnerability, VulnerabilitySeverity, Region, SecurityFormDetails, ChatMessage } from './types';
import { LayoutDashboard, ShieldCheck, UserCircle, LogOut, Briefcase, TrendingUp, Search, X, Calendar as CalendarIcon, FileBarChart, Clock3, Plus } from 'lucide-react';

// Added missing UserPortal type definition
type UserPortal = 'vendor' | 'security' | 'manager';

// --- TEAM CONFIG ---
const initialTeamMembers: TeamMember[] = [
    { id: '1', name: 'Samadhan' },
    { id: '2', name: 'Sweety' },
    { id: '3', name: 'Khyati' },
    { id: '4', name: 'Bhumi' },
    { id: '5', name: 'Priya' }
];

const STORAGE_KEY = 'security_portal_tickets_v1';

const TODAY = new Date();
const TODAY_STR = TODAY.toISOString().split('T')[0];
const TOMORROW_STR = new Date(TODAY.getTime() + 86400000).toISOString().split('T')[0];

const SAMPLE_TICKET_BASE = {
  vendorEmail: "owner@coke.com",
  securityAnswers: {
    handlesPII: true,
    internetFacing: true,
    storesPaymentData: false,
    thirdPartyIntegrations: true,
    requiresUserAuth: true
  },
  details: {
    description: "Enterprise grade application security assessment.",
    targetAudienceRegion: "Global",
    isExternalSite: "Public Consumers",
    isTcccOwned: "TCCC",
    businessOwner: "owner@coke.com",
    itProjectManager: "pm@coke.com",
    techContact: "dev@agency.com",
    goLiveDate: "2026-12-01",
    testingDeadline: "2026-11-15",
    blackoutDates: "None",
    businessCriticality: "Class 2",
    confidentialityRating: "2",
    integrityRating: "2",
    availabilityRating: "2",
    calculatedTier: AppTier.MEDIUM,
    devSecOpsImplemented: "GitHub Actions, Snyk",
    allWeaknessesRemediated: true,
    wafDisabled: true,
    environmentPrereqs: "None",
    isCustomCoded: "Custom Coded",
    techStack: "Next.js, Tailwind, PostgreSQL",
    repoUrl: "GitHub",
    priorAssessment: "None",
    testUrlProvided: "https://staging.2026app.coke.com",
    outOfScopeItems: "Legacy SSO",
    vendorPermission: true,
    walkthroughInfo: "Scheduled",
    hasEmailFunctionality: false,
    hasPromotionalActivities: false,
    hasEcommerce: false,
    testAccountsProvided: "Yes",
    piiCollectionDetails: "Email, User Profile",
    fileUploadFunctionality: "None",
    apiProtocol: "REST",
    apiTargetAudience: "Internal",
    apiDocumentation: "Swagger",
    apiAuthMechanisms: "OAuth 2.0",
    apiHandlesSensitiveData: "None",
    isProtectedByAuth: true,
    authMechanisms: "SSO",
    sessionExpirationPolicies: "30m",
    sessionValidationHandled: "JWT",
    passwordPolicies: "Standard",
    cocaColaPiiPolicy: true,
    geoCompliance: "GDPR",
    regionSpecificData: "None",
    multilingualSupport: "EN",
    knownSecurityConcerns: "None"
  } as SecurityFormDetails,
  messages: [] as ChatMessage[]
};

const SAMPLES_2026: Ticket[] = [
  {
    ...SAMPLE_TICKET_BASE,
    id: "REQ-2026-001",
    appName: "Visionary Web 2026",
    region: "North America",
    testUrl: "https://visionary.coke.com",
    readyDate: "2026-01-10",
    type: AssessmentType.WEB,
    tier: AppTier.HIGH,
    isExpedited: true,
    status: 'Completed',
    assignedTo: '1',
    finalReport: { fileName: "Visionary_Final_Report.pdf", uploadDate: "2026-01-20" },
    vulnerabilities: [
      { id: 'v26-1', title: 'Reflected XSS in Profile', severity: 'High', status: 'Remediated', impact: 'Account hijacking via session theft', observation: 'User input in profile bio is not sanitized', remediation: 'Use DOMPurify for output sanitization' },
      { id: 'v26-2', title: 'Weak Password Policy', severity: 'Medium', status: 'Remediated', impact: 'Brute force susceptibility', observation: 'Passwords only require 6 characters', remediation: 'Enforce 12+ chars with complexity' }
    ]
  },
  {
    ...SAMPLE_TICKET_BASE,
    id: "REQ-2026-002",
    appName: "CokePay Mobile v2",
    region: "Global",
    testUrl: "Mobile Binary (iOS/Android)",
    readyDate: "2026-02-15",
    type: AssessmentType.MOBILE,
    tier: AppTier.HIGH,
    isExpedited: false,
    status: 'In Progress',
    assignedTo: '2',
    vulnerabilities: [
      { id: 'v26-3', title: 'Hardcoded API Keys', severity: 'Critical', status: 'Open', impact: 'Total backend access', observation: 'Firebase keys found in binary strings', remediation: 'Use secure environment vaults', dueDate: "2026-05-15" }
    ]
  },
  {
    ...SAMPLE_TICKET_BASE,
    id: "REQ-2026-003",
    appName: "Retail Partner API Hub",
    region: "EMEA",
    testUrl: "https://api-hub.retail.coke.com",
    readyDate: "2026-03-20",
    type: AssessmentType.API,
    tier: AppTier.MEDIUM,
    isExpedited: false,
    status: 'Pending',
    vulnerabilities: [
      { id: 'v26-4', title: 'Improper Authorization (IDOR)', severity: 'High', status: 'Open', impact: 'Unauthorized data access', observation: 'User can access other orders by incrementing ID', remediation: 'Implement ownership checks for resources', dueDate: "2026-06-20" }
    ]
  },
  {
    ...SAMPLE_TICKET_BASE,
    id: "REQ-2026-004",
    appName: "Marketing AI Predictor",
    region: "APAC",
    testUrl: "https://ai-predictor.coke.com",
    readyDate: "2026-04-05",
    type: AssessmentType.AI,
    tier: AppTier.HIGH,
    isExpedited: true,
    status: 'Scheduled',
    scheduledDate: "2026-04-15",
    assignedTo: '3',
    vulnerabilities: [
      { id: 'v26-5', title: 'Prompt Injection Risk', severity: 'High', status: 'Open', impact: 'Bypassing safety filters', observation: 'System prompt can be leaked via specific queries', remediation: 'Use robust system-level filtering', dueDate: "2026-07-05" }
    ]
  },
  {
    ...SAMPLE_TICKET_BASE,
    id: "REQ-2026-005",
    appName: "HR Support Bot 2026",
    region: "Latin America",
    testUrl: "https://hr-bot.coke.com",
    readyDate: "2026-05-12",
    type: AssessmentType.CHATBOT,
    tier: AppTier.LOW,
    isExpedited: false,
    status: 'Completed',
    assignedTo: '4',
    finalReport: { fileName: "HR_Bot_Audit.pdf", uploadDate: "2026-05-25" },
    vulnerabilities: [
      { id: 'v26-6', title: 'Sensitive Data Logging', severity: 'Medium', status: 'Remediated', impact: 'Exposure of employee IDs', observation: 'Logs contain PII in plain text', remediation: 'Mask PII before logging' }
    ]
  },
  {
    ...SAMPLE_TICKET_BASE,
    id: "REQ-2026-006",
    appName: "Vending Fleet Dashboard",
    region: "North America",
    testUrl: "https://vending.coke.com",
    readyDate: "2026-06-18",
    type: AssessmentType.WEB,
    tier: AppTier.MEDIUM,
    isExpedited: false,
    status: 'In Progress',
    assignedTo: '5',
    vulnerabilities: [
      { id: 'v26-7', title: 'Missing Security Headers', severity: 'Low', status: 'Open', impact: 'Clickjacking risk', observation: 'X-Frame-Options not set', remediation: 'Configure CSP and X-Frame-Options', dueDate: "2026-09-18" }
    ]
  },
  {
    ...SAMPLE_TICKET_BASE,
    id: "REQ-2026-007",
    appName: "Logistics Real-time API",
    region: "Global",
    testUrl: "https://logistics.coke.com/api",
    readyDate: "2026-07-22",
    type: AssessmentType.API,
    tier: AppTier.HIGH,
    isExpedited: true,
    status: 'Pending',
    vulnerabilities: [
      { id: 'v26-8', title: 'SQL Injection in Tracking', severity: 'Critical', status: 'Open', impact: 'Full database compromise', observation: 'Tracking ID is used directly in query', remediation: 'Use parameterized queries', dueDate: "2026-08-22" }
    ]
  },
  {
    ...SAMPLE_TICKET_BASE,
    id: "REQ-2026-008",
    appName: "Coke Social Mobile",
    region: "EMEA",
    testUrl: "Android App",
    readyDate: "2026-08-30",
    type: AssessmentType.MOBILE,
    tier: AppTier.MEDIUM,
    isExpedited: false,
    status: 'Scheduled',
    scheduledDate: "2026-09-10",
    assignedTo: '1',
    vulnerabilities: [
      { id: 'v26-9', title: 'Insecure Deep Link', severity: 'Medium', status: 'Open', impact: 'Arbitrary redirection', observation: 'App follows deep links without validation', remediation: 'Whitelist authorized domains', dueDate: "2026-11-30" }
    ]
  },
  {
    ...SAMPLE_TICKET_BASE,
    id: "REQ-2026-009",
    appName: "Recipe Gen-AI",
    region: "APAC",
    testUrl: "https://recipe-ai.coke.com",
    readyDate: "2026-09-15",
    type: AssessmentType.AI,
    tier: AppTier.HIGH,
    isExpedited: false,
    status: 'Completed',
    assignedTo: '2',
    finalReport: { fileName: "Recipe_AI_Report.pdf", uploadDate: "2026-09-30" },
    vulnerabilities: [
      { id: 'v26-10', title: 'Information Disclosure', severity: 'Info', status: 'Remediated', impact: 'Server version exposure', observation: 'Server header reveals exact version', remediation: 'Hide server banner' }
    ]
  },
  {
    ...SAMPLE_TICKET_BASE,
    id: "REQ-2026-010",
    appName: "Concierge Chat v3",
    region: "North America",
    testUrl: "https://concierge.coke.com",
    readyDate: "2026-11-01",
    type: AssessmentType.CHATBOT,
    tier: AppTier.MEDIUM,
    isExpedited: false,
    status: 'In Progress',
    assignedTo: '3',
    vulnerabilities: [
      { id: 'v26-11', title: 'No Rate Limiting', severity: 'Medium', status: 'Open', impact: 'DoS risk on chat endpoint', observation: 'Unauthenticated users can flood API', remediation: 'Implement per-IP rate limiting', dueDate: "2027-01-01" }
    ]
  }
];

const App: React.FC = () => {
  const [selectedPortal, setSelectedPortal] = useState<UserPortal | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>(initialTeamMembers);
  const [currentMemberId, setCurrentMemberId] = useState<string | undefined>(undefined);
  const [view, setView] = useState<'list' | 'create' | 'detail' | 'msr' | 'wsr'>('list');
  const [searchQuery, setSearchQuery] = useState('');
  
  const [tickets, setTickets] = useState<Ticket[]>(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    // Combine standard samples with the new 2026 set
    const initialSamples = [...SAMPLES_2026];
    
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        return parsed.length > 0 ? parsed : initialSamples;
      } catch (e) {
        return initialSamples;
      }
    }
    return initialSamples;
  });
  
  const [selectedTicket, setSelectedTicket] = useState<Ticket | null>(null);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(tickets));
  }, [tickets]);

  const role = isAuthenticated ? selectedPortal : null;

  const handleLogin = (memberId?: string) => {
      setIsAuthenticated(true);
      if (memberId) setCurrentMemberId(memberId);
  };

  const handleAddMember = (name: string) => {
      setTeamMembers([...teamMembers, { id: Date.now().toString(), name }]);
  };

  const handleRemoveMember = (id: string) => {
      setTeamMembers(teamMembers.filter(m => m.id !== id));
  };

  const generateRequestId = (existingTickets: Ticket[]) => {
    const currentYear = new Date().getFullYear();
    const prefix = `REQ-${currentYear}-`;
    const existingIds = existingTickets.map(t => t.id).filter(id => id.startsWith(prefix));
    let maxSeq = 0;
    existingIds.forEach(id => {
      const parts = id.split('-');
      if (parts.length === 3) {
        const seq = parseInt(parts[2], 10);
        if (!isNaN(seq) && seq > maxSeq) maxSeq = seq;
      }
    });
    return `${prefix}${(maxSeq + 1).toString().padStart(5, '0')}`;
  };

  const handleCreateTicket = (ticketData: Omit<Ticket, 'id'>) => {
    const newId = generateRequestId(tickets);
    const newTicket: Ticket = {
      ...ticketData,
      id: newId,
      messages: [],
      unreadFor: null,
      vulnerabilities: [],
      remediationDeadline: undefined,
      slaBreachNotificationSent: undefined,
      assignedTo: undefined
    };
    setTickets([newTicket, ...tickets]);
    setView('list');
  };

  const handleUpdateTicket = (updatedTicket: Ticket) => {
    setTickets(tickets.map(t => t.id === updatedTicket.id ? updatedTicket : t));
    setSelectedTicket(updatedTicket);
  };

  const handleBulkUpdateTickets = (updatedTickets: Ticket[]) => {
    const updateMap = new Map(updatedTickets.map(t => [t.id, t]));
    setTickets(tickets.map(t => updateMap.get(t.id) || t));
  };

  const handleViewDetail = (ticket: Ticket) => {
    setSelectedTicket(ticket);
    setView('detail');
  };

  const handleBackToList = () => {
    setSelectedTicket(null);
    setView('list');
  };

  const logout = () => {
    setIsAuthenticated(false);
    setSelectedPortal(null);
    setCurrentMemberId(undefined);
    setView('list');
    setSelectedTicket(null);
    setSearchQuery('');
  };

  if (!selectedPortal) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-6 text-gray-900">
        <div className="max-w-6xl w-full animate-in fade-in duration-500">
           <div className="text-center mb-12">
             <div className="inline-flex items-center justify-center p-3 bg-blue-100 rounded-xl mb-4">
               <ShieldCheck className="w-10 h-10 text-blue-600" />
             </div>
             <h1 className="text-4xl font-bold text-gray-900 mb-2">Application Security Portal</h1>
             <p className="text-gray-600 text-lg">Select your portal to continue</p>
           </div>
           
           <div className="grid md:grid-cols-3 gap-6">
             <button onClick={() => setSelectedPortal('vendor')} className="group bg-white p-8 rounded-2xl shadow-sm border border-gray-200 hover:shadow-xl hover:border-blue-300 transition-all text-left">
                <div className="h-12 w-12 bg-green-100 rounded-lg flex items-center justify-center mb-6"><UserCircle className="w-7 h-7 text-green-700" /></div>
                <h2 className="text-2xl font-bold text-gray-900 mb-2">Developer</h2>
                <p className="text-gray-500 mb-6">Submit new applications and track status.</p>
                <span className="text-blue-600 font-medium">Enter Portal &rarr;</span>
             </button>
             <button onClick={() => setSelectedPortal('security')} className="group bg-white p-8 rounded-2xl shadow-sm border border-gray-200 hover:shadow-xl hover:border-indigo-300 transition-all text-left">
                <div className="h-12 w-12 bg-indigo-100 rounded-lg flex items-center justify-center mb-6"><Briefcase className="w-7 h-7 text-indigo-700" /></div>
                <h2 className="text-2xl font-bold text-gray-900 mb-2">Security Team</h2>
                <p className="text-gray-500 mb-6">Manage assessment queues and risk profiles.</p>
                <span className="text-indigo-600 font-medium">Enter SecOps &rarr;</span>
             </button>
             <button onClick={() => setSelectedPortal('manager')} className="group bg-white p-8 rounded-2xl shadow-sm border border-gray-200 hover:shadow-xl hover:border-emerald-300 transition-all text-left">
                <div className="h-12 w-12 bg-emerald-100 rounded-lg flex items-center justify-center mb-6"><TrendingUp className="w-7 h-7 text-emerald-700" /></div>
                <h2 className="text-2xl font-bold text-gray-900 mb-2">Manager</h2>
                <p className="text-gray-500 mb-6">Executive dashboards and vulnerability metrics.</p>
                <span className="text-emerald-600 font-medium">Enter View &rarr;</span>
             </button>
           </div>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <LoginPage portal={selectedPortal} teamMembers={teamMembers} onLogin={handleLogin} onBack={() => setSelectedPortal(null)} />;
  }

  const isSecurity = role === 'security';
  const isManager = role === 'manager';
  const isVendor = role === 'vendor';

  const filteredTickets = tickets.filter(t => 
    t.appName.toLowerCase().includes(searchQuery.toLowerCase()) || 
    t.id.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col md:flex-row text-gray-900">
      <aside className={`w-full md:w-64 bg-white border-r fixed md:h-full flex flex-col z-20 ${isManager ? 'border-r-emerald-100' : isSecurity ? 'border-r-indigo-100' : 'border-r-gray-200'}`}>
        <div className="h-16 flex items-center justify-between px-6 border-b border-gray-200">
          <div className={`flex items-center gap-2 font-bold text-xl ${isManager ? 'text-emerald-700' : isSecurity ? 'text-indigo-700' : 'text-blue-600'}`}>
             <ShieldCheck className="w-7 h-7" />
             <span>{isManager ? 'Exec' : isSecurity ? 'SecOps' : 'Portal'}</span>
          </div>
          <button onClick={logout} className="md:hidden text-gray-500"><LogOut className="w-5 h-5"/></button>
        </div>
        
        <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
          <button onClick={() => { setView('list'); setSelectedTicket(null); setSearchQuery(''); }} className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium ${view === 'list' ? (isManager ? 'bg-emerald-50 text-emerald-700' : isSecurity ? 'bg-indigo-50 text-indigo-700' : 'bg-blue-50 text-blue-700') : 'text-gray-700 hover:bg-gray-50'}`}>
            <LayoutDashboard className="w-5 h-5" /> Dashboard
          </button>
          
          {isManager && (
            <div className="pt-6 mt-4 border-t border-emerald-50">
               <h3 className="px-3 text-xs font-semibold text-emerald-400 uppercase tracking-wider mb-2">Leadership Reports</h3>
               <div className="space-y-1">
                 <button onClick={() => setView('msr')} className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium ${view === 'msr' ? 'bg-emerald-50 text-emerald-700' : 'text-gray-700 hover:bg-gray-50'}`}>
                   <FileBarChart className="w-5 h-5" /> MSR Report
                 </button>
                 <button onClick={() => setView('wsr')} className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium ${view === 'wsr' ? 'bg-emerald-50 text-emerald-700' : 'text-gray-700 hover:bg-gray-50'}`}>
                   <Clock3 className="w-5 h-5" /> WSR Report
                 </button>
               </div>
            </div>
          )}
          
          {isSecurity && (
            <div className="pt-6 mt-4 border-t border-indigo-50">
                <h3 className="px-3 text-xs font-semibold text-indigo-400 uppercase tracking-wider mb-2 flex items-center gap-2"><CalendarIcon size={12} /> New Assessment Requests</h3>
                <SidebarCalendar tickets={tickets} onViewDetail={handleViewDetail} />
                <div className="pt-6 mt-4 border-t border-indigo-50">
                    <h3 className="px-3 text-xs font-semibold text-indigo-400 uppercase tracking-wider mb-2">Team Members</h3>
                    <div className="space-y-1">
                      {teamMembers.map(member => {
                          const totalAssigned = tickets.filter(t => t.assignedTo === member.id).length;
                          const inProgressCount = tickets.filter(t => t.assignedTo === member.id && t.status === 'In Progress').length;
                          
                          return (
                          <div key={member.id} className="px-3 py-2.5 rounded-lg hover:bg-gray-50 transition-colors">
                              <div className="flex items-center gap-3">
                                  <div className={`w-2 h-2 rounded-full flex-shrink-0 ${member.id === currentMemberId ? 'bg-green-500' : 'bg-gray-300'}`}></div>
                                  <div className="flex-1 overflow-hidden">
                                      <div className="flex items-center justify-between gap-2">
                                          <span className={`text-sm truncate ${member.id === currentMemberId ? 'font-bold text-indigo-700' : 'text-gray-700'}`}>
                                              {member.name}
                                          </span>
                                          {member.id === currentMemberId && <span className="text-[10px] bg-indigo-100 text-indigo-600 px-1.5 rounded font-black uppercase">You</span>}
                                      </div>
                                      <div className="flex gap-3 mt-1">
                                          <div className="flex items-center gap-1">
                                              <span className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">Total:</span>
                                              <span className="text-xs font-black text-gray-800">{totalAssigned}</span>
                                          </div>
                                          <div className="flex items-center gap-1">
                                              <span className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">Active:</span>
                                              <span className={`text-xs font-black ${inProgressCount > 0 ? 'text-blue-600' : 'text-gray-400'}`}>{inProgressCount}</span>
                                          </div>
                                      </div>
                                  </div>
                              </div>
                          </div>
                          );
                      })}
                    </div>
                </div>
            </div>
          )}
        </nav>
        
        <div className="p-4 border-t border-gray-200">
           <button onClick={logout} className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium text-gray-600 hover:bg-red-50 hover:text-red-700 transition-colors"><LogOut className="w-5 h-5" /> Sign Out</button>
        </div>
      </aside>

      <main className="flex-1 md:ml-64 p-6 lg:p-10 pt-20 md:pt-10">
        <div className="w-full mx-auto">
          <div className="mb-8 flex flex-col md:flex-row md:items-center justify-between gap-6">
              <h1 className="text-2xl font-bold text-gray-900">
                {view === 'create' ? 'New Submission' : 
                 view === 'detail' ? 'Request Details' : 
                 view === 'msr' ? 'Monthly Leadership Report' :
                 view === 'wsr' ? 'Weekly Status Report' :
                 'Security Operations'}
              </h1>
              <div className="flex flex-col md:flex-row items-center gap-4 w-full md:w-auto">
                  {view === 'list' && isVendor && (
                    <button 
                      onClick={() => setView('create')}
                      className="w-full md:w-auto flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-6 py-2.5 rounded-2xl text-sm font-bold shadow-xl shadow-blue-500/20 transition-all active:scale-95"
                    >
                      <Plus className="w-4 h-4" /> New Assessment Request
                    </button>
                  )}
                  {view === 'list' && (
                    <div className="relative w-full md:w-80 group">
                      <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                      <input type="text" placeholder="Search apps..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="w-full pl-11 pr-10 py-2.5 bg-white border border-gray-200 rounded-2xl text-sm outline-none shadow-sm focus:ring-2 focus:ring-indigo-500/20" />
                    </div>
                  )}
              </div>
          </div>

          {view === 'list' && (
            <TicketList 
              tickets={filteredTickets} 
              userRole={role} 
              currentMemberId={currentMemberId} 
              teamMembers={teamMembers} 
              onAddMember={handleAddMember} 
              onRemoveMember={handleRemoveMember} 
              onCreateNew={() => setView('create')} 
              onViewDetail={handleViewDetail} 
              onBulkUpdateTickets={handleBulkUpdateTickets}
              activeView={view}
            />
          )}
          {view === 'msr' && (
            <TicketList 
              tickets={filteredTickets} 
              userRole={role} 
              currentMemberId={currentMemberId} 
              teamMembers={teamMembers} 
              onAddMember={handleAddMember} 
              onRemoveMember={handleRemoveMember} 
              onCreateNew={() => setView('create')} 
              onViewDetail={handleViewDetail} 
              onBulkUpdateTickets={handleBulkUpdateTickets}
              activeView="msr"
            />
          )}
          {view === 'wsr' && (
            <TicketList 
              tickets={filteredTickets} 
              userRole={role} 
              currentMemberId={currentMemberId} 
              teamMembers={teamMembers} 
              onAddMember={handleAddMember} 
              onRemoveMember={handleRemoveMember} 
              onCreateNew={() => setView('create')} 
              onViewDetail={handleViewDetail} 
              onBulkUpdateTickets={handleBulkUpdateTickets}
              activeView="wsr"
            />
          )}
          {view === 'create' && <TicketForm onSubmit={handleCreateTicket} onCancel={handleBackToList} />}
          {view === 'detail' && selectedTicket && role && <TicketDetail ticket={selectedTicket} role={role === 'manager' ? 'security' : role} teamMembers={teamMembers} onBack={handleBackToList} onUpdateTicket={handleUpdateTicket} />}
        </div>
      </main>
    </div>
  );
};

export default App;
