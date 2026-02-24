import React, { useState } from 'react';
import { Ticket, AppTier, TeamMember, Vulnerability, AssessmentType, Region } from '../types';
import { 
    AlertCircle, 
    Link as LinkIcon, 
    Smartphone, 
    Globe, 
    Box, 
    Server, 
    ArrowRight, 
    TrendingUp,
    Inbox,
    PlayCircle,
    CheckCircle2,
    XCircle,
    CalendarClock,
    Bug,
    ChevronDown,
    ChevronUp,
    FileText,
    History,
    Timer,
    FileBarChart,
    LayoutGrid,
    SearchCheck,
    LayoutPanelTop,
    Info,
    RotateCcw,
    Map
} from 'lucide-react';

interface TicketListProps {
  tickets: Ticket[];
  userRole: 'vendor' | 'security' | 'manager' | null;
  currentMemberId?: string;
  teamMembers: TeamMember[];
  onAddMember: (name: string) => void;
  onRemoveMember: (id: string) => void;
  onCreateNew: () => void;
  onViewDetail: (ticket: Ticket) => void;
  onBulkUpdateTickets?: (tickets: Ticket[]) => void;
  activeView?: 'list' | 'create' | 'detail' | 'msr' | 'wsr';
}

export const TicketList: React.FC<TicketListProps> = ({ 
    tickets, 
    userRole, 
    currentMemberId,
    onViewDetail,
    activeView = 'list'
}) => {
  const [filterMode, setFilterMode] = useState<'all' | 'my' | 'expedited' | 'retest' | 'current'>('all');
  const [selectedYear, setSelectedYear] = useState<number>(new Date().getFullYear());

  const currentYear = new Date().getFullYear();
  const lastYear = currentYear - 1;

  const getStats = (isWeekly: boolean, targetYear: number) => {
    const now = new Date();
    const lastWeek = new Date();
    lastWeek.setDate(now.getDate() - 7);

    const relevantTickets = isWeekly 
        ? tickets.filter(t => new Date(t.readyDate) >= lastWeek)
        : tickets.filter(t => new Date(t.readyDate).getFullYear() === targetYear);

    const totalCount = relevantTickets.length;
    const completedCount = relevantTickets.filter(t => t.status === 'Completed').length;
    const inProgressCount = relevantTickets.filter(t => t.status === 'In Progress').length;
    const cancelledCount = relevantTickets.filter(t => t.status === 'Rejected').length;
    const scheduledCount = relevantTickets.filter(t => t.status === 'Scheduled').length;
    
    let totalIssuesFound = 0;
    let issuesClosed = 0;
    let issuesOpen = 0;

    const openIssuesData = { Critical: 0, High: 0, Medium: 0, Low: 0, Info: 0 };
    const regionalData: Record<string, number> = { 'APAC': 0, 'EMEA': 0, 'Global': 0, 'Latin America': 0, 'North America': 0 };

    relevantTickets.forEach(t => {
        const v = t.vulnerabilities || [];
        totalIssuesFound += v.length;
        issuesClosed += v.filter(i => i.status === 'Remediated').length;
        issuesOpen += v.filter(i => i.status === 'Open' || i.status === 'Ready for Retest').length;

        v.filter(i => i.status === 'Open' || i.status === 'Ready for Retest').forEach(i => {
            if (i.severity in openIssuesData) openIssuesData[i.severity as keyof typeof openIssuesData]++;
            if (t.region in regionalData) regionalData[t.region]++;
        });
    });

    const remediationRate = totalIssuesFound > 0 ? Math.round((issuesClosed / totalIssuesFound) * 100) : 0;
    const expeditedCount = relevantTickets.filter(t => t.isExpedited).length;

    const regionOrder = ['Global', 'EMEA', 'North America', 'APAC', 'Latin America'];
    const orderedRegionalChartData = regionOrder.map(name => ({
        name,
        value: regionalData[name] || 0
    }));

    return {
        total: totalCount, completed: completedCount, inProgress: inProgressCount, cancelled: cancelledCount, scheduled: scheduledCount,
        totalIssuesFound, issuesClosed, issuesOpen, remediationRate, expeditedCount,
        openIssuesChartData: [
            { label: 'Critical', value: openIssuesData.Critical, color: '#ff3b3b' },
            { label: 'High', value: openIssuesData.High, color: '#ff9500' },
            { label: 'Medium', value: openIssuesData.Medium, color: '#ffcc00' },
            { label: 'Low', value: openIssuesData.Low, color: '#34c759' },
            { label: 'Info', value: openIssuesData.Info, color: '#007aff' }
        ],
        regionalChartData: orderedRegionalChartData
    };
  };

  const isMSR = activeView === 'msr';
  const isWSR = activeView === 'wsr';
  const stats = getStats(isWSR, selectedYear);

  if (isMSR || isWSR) {
      return (
          <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500 pb-20">
              <div className="flex justify-end px-2">
                  <div className="bg-white p-1 rounded-2xl border border-gray-100 shadow-sm flex items-center gap-1">
                      <button onClick={() => setSelectedYear(currentYear)} className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-black uppercase tracking-widest transition-all ${selectedYear === currentYear ? 'bg-gray-900 text-white shadow-md' : 'text-gray-400 hover:text-gray-600'}`}>
                          <LayoutGrid className="w-3.5 h-3.5" /> This Year {currentYear}
                      </button>
                      <button onClick={() => setSelectedYear(lastYear)} className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-black uppercase tracking-widest transition-all ${selectedYear === lastYear ? 'bg-gray-900 text-white shadow-md' : 'text-gray-400 hover:text-gray-600'}`}>
                          <History className="w-3.5 h-3.5" /> Last Year {lastYear}
                      </button>
                  </div>
              </div>

              <div className="bg-white rounded-[40px] shadow-sm border border-gray-100 p-10 relative overflow-hidden group">
                  <div className={`absolute top-0 right-0 w-64 h-64 ${isMSR ? 'bg-emerald-50' : 'bg-blue-50'} rounded-full -mr-20 -mt-20 blur-3xl opacity-50`}></div>
                  <div className="flex flex-col md:flex-row md:items-center justify-between mb-8 relative z-10 gap-6">
                    <div className="flex items-center gap-4">
                        <div className={`p-3 rounded-2xl shadow-sm ${isMSR ? 'bg-emerald-100 text-emerald-600' : 'bg-blue-100 text-blue-600'}`}>
                            {isMSR ? <FileBarChart className="w-6 h-6" /> : <History className="w-6 h-6" />}
                        </div>
                        <div>
                            <div className="flex items-center gap-3">
                                <h2 className="text-xl font-black text-gray-900 uppercase tracking-tighter">
                                    {isMSR ? 'Sr. Leadership Performance Report' : 'Weekly Status Report (WSR)'}
                                </h2>
                                <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest ${isMSR ? 'bg-emerald-50 text-emerald-700' : 'bg-blue-50 text-blue-700'}`}>
                                    {isMSR ? (selectedYear === currentYear ? 'Current YTD' : `Full Year ${selectedYear}`) : 'Weekly Trailing'}
                                </span>
                            </div>
                        </div>
                    </div>
                  </div>

                  <div id="report-text" className="bg-gray-50/50 rounded-3xl p-8 border border-gray-100 relative z-10">
                      <div className="space-y-6 font-mono text-sm text-gray-800 leading-relaxed">
                          <p>Total no. of Assessment Received - <span className="font-black text-emerald-700">{stats.total}</span></p>
                          <p>Total Number of issues found - <span className="font-black text-indigo-600">{stats.totalIssuesFound}</span></p>
                          <p>No of Issue closed - <span className="font-black text-green-600">{stats.issuesClosed}</span></p>
                          <p>No. of Issue Open - <span className="font-black text-red-600">{stats.issuesOpen}</span></p>
                      </div>
                  </div>
              </div>
          </div>
      );
  }

  const renderCurrentDataDashboard = () => {
    const dStats = getStats(false, currentYear);
    
    return (
      <div className="bg-[#121422] rounded-[40px] p-10 text-white shadow-2xl overflow-hidden relative animate-in zoom-in-95 fade-in duration-500">
          <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-indigo-600/10 rounded-full blur-[120px] -mr-64 -mt-64"></div>
          <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-purple-600/10 rounded-full blur-[120px] -ml-64 -mb-64"></div>

          <div className="flex items-center justify-between mb-12 relative z-10">
              <div className="flex items-center gap-5">
                  <div className="p-3 bg-indigo-600 rounded-2xl shadow-lg shadow-indigo-500/20">
                    <TrendingUp className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <h2 className="text-2xl font-black tracking-tight">Security Operations Center</h2>
                    <p className="text-indigo-300/60 text-xs font-bold uppercase tracking-widest mt-1">Real-time assessment metrics and vulnerability intelligence.</p>
                  </div>
              </div>
              <div className="flex items-center gap-1 bg-[#1e2235] p-1.5 rounded-2xl border border-white/5 shadow-inner">
                  <button className="px-5 py-2 bg-indigo-600 text-white rounded-xl text-xs font-black uppercase tracking-widest shadow-lg">Executive</button>
                  <button className="px-5 py-2 text-indigo-300/40 hover:text-indigo-200 transition-colors rounded-xl text-xs font-black uppercase tracking-widest flex items-center gap-2">
                    <LayoutGrid className="w-3.5 h-3.5" /> By Type
                  </button>
              </div>
          </div>

          <div className="grid grid-cols-12 gap-8 relative z-10">
              <div className="col-span-12 lg:col-span-4 flex flex-col gap-6">
                  <div className="bg-gradient-to-br from-indigo-600 to-indigo-800 p-8 rounded-[32px] shadow-xl relative overflow-hidden group transition-transform hover:scale-[1.02]">
                      <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -mr-10 -mt-10 blur-2xl"></div>
                      <p className="text-white/70 text-[10px] font-black uppercase tracking-widest mb-2">Total Assessments</p>
                      <h3 className="text-6xl font-black">{dStats.total}</h3>
                      <div className="flex items-center gap-2 text-white/50 text-[10px] font-black uppercase mt-6 tracking-widest">
                          <Inbox className="w-3 h-3" /> All incoming requests YTD
                      </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                      <div className="bg-[#1e2235] p-6 rounded-[24px] border border-white/5 hover:border-white/10 transition-colors">
                          <div className="w-8 h-8 rounded-lg bg-green-500/10 flex items-center justify-center mb-4"><CheckCircle2 className="w-4 h-4 text-green-500" /></div>
                          <h4 className="text-2xl font-black mb-1">{dStats.completed}</h4>
                          <p className="text-white/40 text-[10px] font-black uppercase tracking-widest">Completed</p>
                      </div>
                      <div className="bg-[#1e2235] p-6 rounded-[24px] border border-white/5 hover:border-white/10 transition-colors">
                          <div className="w-8 h-8 rounded-lg bg-blue-500/10 flex items-center justify-center mb-4"><PlayCircle className="w-4 h-4 text-blue-500" /></div>
                          <h4 className="text-2xl font-black mb-1">{dStats.inProgress}</h4>
                          <p className="text-white/40 text-[10px] font-black uppercase tracking-widest">In Progress</p>
                      </div>
                      <div className="bg-[#1e2235] p-6 rounded-[24px] border border-white/5 hover:border-white/10 transition-colors">
                          <div className="w-8 h-8 rounded-lg bg-indigo-500/10 flex items-center justify-center mb-4"><CalendarClock className="w-4 h-4 text-indigo-500" /></div>
                          <h4 className="text-2xl font-black mb-1">{dStats.scheduled}</h4>
                          <p className="text-white/40 text-[10px] font-black uppercase tracking-widest">Scheduled</p>
                      </div>
                      <div className="bg-[#1e2235] p-6 rounded-[24px] border border-white/5 hover:border-white/10 transition-colors">
                          <div className="w-8 h-8 rounded-lg bg-red-500/10 flex items-center justify-center mb-4"><XCircle className="w-4 h-4 text-red-500" /></div>
                          <h4 className="text-2xl font-black mb-1">{dStats.cancelled}</h4>
                          <p className="text-white/40 text-[10px] font-black uppercase tracking-widest">Rejected</p>
                      </div>
                  </div>

                  <div className="bg-[#1e2235] p-6 rounded-[32px] border border-white/5">
                      <div className="flex items-center gap-2 mb-6">
                        <Bug className="w-4 h-4 text-indigo-400" />
                        <h4 className="text-[10px] font-black uppercase tracking-widest text-white/80">Remediation Status</h4>
                      </div>
                      <div className="flex items-end justify-between mb-4">
                        <div>
                          <h5 className="text-3xl font-black">{dStats.totalIssuesFound}</h5>
                          <p className="text-white/40 text-[10px] font-black uppercase tracking-widest">Findings Found</p>
                        </div>
                        <div className="text-right">
                          <p className="text-green-400 text-xl font-black">{dStats.remediationRate}%</p>
                          <p className="text-white/40 text-[10px] font-black uppercase tracking-widest">Fixed Rate</p>
                        </div>
                      </div>
                      <div className="h-2 w-full bg-[#121422] rounded-full overflow-hidden flex">
                          <div className="h-full bg-green-500" style={{ width: `${dStats.remediationRate}%` }}></div>
                          <div className="h-full bg-red-500" style={{ width: `${100 - dStats.remediationRate}%` }}></div>
                      </div>
                  </div>
              </div>

              <div className="col-span-12 lg:col-span-8 flex flex-col gap-8">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                      <div className="bg-[#1e2235] p-8 rounded-[32px] border border-white/5 flex flex-col">
                          <div className="flex items-center gap-3 mb-8">
                              <Info className="w-4 h-4 text-indigo-400" />
                              <h4 className="text-[10px] font-black uppercase tracking-widest text-white/80">Vulnerability Severity</h4>
                          </div>
                          <div className="flex items-center justify-around flex-1">
                              <div className="relative w-40 h-40">
                                  <svg className="w-full h-full transform -rotate-90">
                                      {(() => {
                                          let offset = 0;
                                          return dStats.openIssuesChartData.map((d, i) => {
                                              const perc = dStats.issuesOpen > 0 ? (d.value / dStats.issuesOpen) * 100 : 0;
                                              const dash = (perc * 314.15) / 100;
                                              const res = (
                                                  <circle key={i} cx="50%" cy="50%" r="50" stroke={d.color} strokeWidth="12" fill="transparent" strokeDasharray={`${dash} 314.15`} strokeDashoffset={-offset} className="transition-all duration-700" />
                                              );
                                              offset += dash;
                                              return res;
                                          });
                                      })()}
                                  </svg>
                                  <div className="absolute inset-0 flex flex-col items-center justify-center">
                                      <span className="text-3xl font-black">{dStats.issuesOpen}</span>
                                      <span className="text-[8px] font-black uppercase tracking-widest text-white/40">Open Issues</span>
                                  </div>
                              </div>
                              <div className="flex flex-col gap-3">
                                  {dStats.openIssuesChartData.map((d, i) => (
                                      <div key={i} className="flex items-center gap-3">
                                          <div className="w-2.5 h-1.5 rounded-full" style={{ backgroundColor: d.color }}></div>
                                          <div className="flex items-center gap-2">
                                            <span className="text-[10px] font-black text-white/50 uppercase tracking-widest min-w-[60px]">{d.label}</span>
                                            <span className="text-xs font-black">{d.value}</span>
                                          </div>
                                      </div>
                                  ))}
                              </div>
                          </div>
                      </div>

                      <div className="bg-[#1e2235] p-8 rounded-[32px] border border-white/5 flex flex-col">
                          <div className="flex items-center gap-3 mb-8">
                              <RotateCcw className="w-4 h-4 text-indigo-400" />
                              <h4 className="text-[10px] font-black uppercase tracking-widest text-white/80">Top Threat Vectors</h4>
                          </div>
                          <div className="flex flex-col gap-4 flex-1 justify-center">
                              {[
                                { name: 'Injection', val: 75, color: 'bg-red-500' },
                                { name: 'Broken Auth', val: 60, color: 'bg-orange-500' },
                                { name: 'Sensitive Data', val: 40, color: 'bg-yellow-500' }
                              ].map((threat, idx) => (
                                <div key={idx} className="space-y-1.5">
                                  <div className="flex justify-between text-[10px] font-black uppercase tracking-widest">
                                    <span className="text-white/60">{threat.name}</span>
                                    <span>{threat.val}%</span>
                                  </div>
                                  <div className="h-1.5 w-full bg-white/5 rounded-full overflow-hidden">
                                    <div className={`h-full ${threat.color}`} style={{ width: `${threat.val}%` }}></div>
                                  </div>
                                </div>
                              ))}
                          </div>
                      </div>
                  </div>

                  <div className="bg-[#1e2235] p-8 rounded-[32px] border border-white/5 flex-1 relative group/chart">
                      <div className="flex items-center justify-between mb-12">
                          <div className="flex items-center gap-3">
                              <Map className="w-4 h-4 text-indigo-400" />
                              <h4 className="text-[10px] font-black uppercase tracking-widest text-white/80">Regional Vulnerability Density</h4>
                          </div>
                          <span className="text-[10px] font-black uppercase tracking-widest text-indigo-400/60">Open Findings by Location</span>
                      </div>
                      
                      <div className="relative h-64 flex items-end justify-between px-4 pb-2">
                          <div className="absolute inset-x-0 bottom-0 h-full flex flex-col justify-between pointer-events-none opacity-10">
                              {[1, 2, 3, 4].map(line => (
                                  <div key={line} className="w-full border-t border-white border-dashed"></div>
                              ))}
                          </div>

                          {dStats.regionalChartData.map((d, i) => {
                              const max = Math.max(...dStats.regionalChartData.map(x => x.value)) || 1;
                              const height = (d.value / max) * 100;
                              return (
                                  <div key={i} className="flex-1 flex flex-col items-center group relative h-full">
                                      <div className={`absolute bottom-full mb-3 opacity-0 group-hover:opacity-100 transition-all duration-300 transform translate-y-2 group-hover:translate-y-0 ${d.value > 0 ? 'opacity-100 translate-y-0' : ''}`}>
                                          <span className="bg-indigo-600 text-[10px] font-black px-2 py-0.5 rounded shadow-lg border border-white/10 whitespace-nowrap">
                                            {d.value} Findings
                                          </span>
                                      </div>

                                      <div className="w-full max-w-[44px] bg-white/5 rounded-t-xl relative overflow-hidden flex flex-col justify-end h-full">
                                          <div className="w-full bg-gradient-to-t from-indigo-700 via-indigo-500 to-indigo-400 rounded-t-xl transition-all duration-1000 group-hover:from-indigo-600 group-hover:to-indigo-300 shadow-[0_0_20px_rgba(79,70,229,0.3)]" style={{ height: `${height}%` }}>
                                              <div className="absolute inset-0 bg-white/10 opacity-0 group-hover:opacity-100 transition-opacity"></div>
                                          </div>
                                      </div>

                                      <span className="text-[9px] font-black text-white/40 uppercase tracking-tighter mt-6 whitespace-nowrap group-hover:text-white transition-colors">
                                          {d.name}
                                      </span>
                                  </div>
                              );
                          })}
                      </div>
                      <div className="w-full h-px bg-white/5 mt-0"></div>
                  </div>
              </div>
          </div>
      </div>
    );
  };

  const filteredTickets = tickets.filter(ticket => {
      if (userRole === 'security') {
          if (filterMode === 'my' && currentMemberId) return ticket.assignedTo === currentMemberId;
          if (filterMode === 'expedited') return ticket.isExpedited;
          if (filterMode === 'retest') return ticket.vulnerabilities?.some(v => v.status === 'Ready for Retest');
      }
      return true;
  });

  const renderTicketSection = (title: string, groupTickets: Ticket[], icon: React.ReactNode, borderColor: string) => {
    if (groupTickets.length === 0) return null;
    return (
        <div className="mb-10">
            <div className={`flex items-center gap-3 mb-4 pb-2 border-b-2 ${borderColor}`}>
                <div className="p-2 rounded-lg bg-white shadow-sm border border-gray-100">{icon}</div>
                <h3 className="text-xl font-bold text-gray-800">{title}</h3>
                <span className="bg-gray-100 text-gray-600 px-2.5 py-0.5 rounded-full text-xs font-bold border border-gray-200">{groupTickets.length}</span>
            </div>
            <div className="bg-white border border-gray-200 rounded-xl overflow-hidden shadow-sm overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50 text-left">
                        <tr>
                            <th className="px-6 py-3 text-xs font-bold text-gray-500 uppercase">Application</th>
                            <th className="px-6 py-3 text-xs font-bold text-gray-500 uppercase">Type</th>
                            <th className="px-6 py-3 text-xs font-bold text-gray-500 uppercase">Tier</th>
                            <th className="px-6 py-3 text-xs font-bold text-gray-500 uppercase">Status</th>
                            <th className="px-6 py-3"></th>
                        </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                        {groupTickets.map((ticket) => (
                            <tr key={ticket.id} onClick={() => onViewDetail(ticket)} className="group cursor-pointer hover:bg-gray-50 transition-colors">
                                <td className="px-6 py-4">
                                    <div className="flex flex-col">
                                        <div className="flex items-center gap-2">
                                            <span className="text-sm font-bold text-gray-900">{ticket.appName}</span>
                                            {ticket.isExpedited && <AlertCircle className="w-4 h-4 text-red-600" />}
                                        </div>
                                        <span className="text-[10px] font-mono text-gray-400">{ticket.id}</span>
                                    </div>
                                </td>
                                <td className="px-6 py-4 text-sm text-gray-600">{ticket.type}</td>
                                <td className="px-6 py-4">
                                    <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-widest border ${
                                        ticket.tier === AppTier.HIGH ? 'bg-red-50 text-red-700 border-red-100' :
                                        ticket.tier === AppTier.MEDIUM ? 'bg-orange-50 text-orange-700 border-orange-100' :
                                        'bg-green-50 text-green-700 border-green-100'
                                    }`}>{ticket.tier}</span>
                                </td>
                                <td className="px-6 py-4">
                                    <span className={`px-2 py-0.5 rounded-md text-[11px] font-black uppercase tracking-widest ${
                                        ticket.status === 'Completed' ? 'bg-emerald-100 text-emerald-800' :
                                        ticket.status === 'In Progress' ? 'bg-blue-100 text-blue-800' :
                                        'bg-gray-100 text-gray-600'
                                    }`}>{ticket.status}</span>
                                </td>
                                <td className="px-6 py-4 text-right">
                                    <ArrowRight className="w-5 h-5 text-gray-400 group-hover:text-emerald-600 transition-colors" />
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
  };

  return (
    <div className="space-y-6">
      {userRole === 'security' && (
        <div className="flex flex-wrap gap-3 border-b border-gray-200 pb-4 mb-6">
            <button onClick={() => setFilterMode('all')} className={`px-5 py-2.5 rounded-xl text-xs font-black uppercase tracking-widest transition-all ${filterMode === 'all' ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-500/30 scale-105' : 'bg-white border border-gray-200 text-gray-500 hover:border-indigo-300'}`}>All Apps</button>
            <button onClick={() => setFilterMode('my')} className={`px-5 py-2.5 rounded-xl text-xs font-black uppercase tracking-widest transition-all ${filterMode === 'my' ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-500/30 scale-105' : 'bg-white border border-gray-200 text-gray-500 hover:border-indigo-300'}`}>My Queue</button>
            <button onClick={() => setFilterMode('retest')} className={`px-5 py-2.5 rounded-xl text-xs font-black uppercase tracking-widest transition-all ${filterMode === 'retest' ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-500/30 scale-105' : 'bg-white border border-gray-200 text-gray-500 hover:border-indigo-300'}`}>Retest Required</button>
            <button onClick={() => setFilterMode('current')} className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-black uppercase tracking-widest transition-all ${filterMode === 'current' ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-500/30 scale-105' : 'bg-white border border-gray-200 text-indigo-600 hover:bg-indigo-50 hover:border-indigo-300'}`}>
                <LayoutPanelTop className="w-3.5 h-3.5" /> Current Data
            </button>
        </div>
      )}

      {filterMode === 'current' ? (
          renderCurrentDataDashboard()
      ) : (
          <>
            {renderTicketSection("Pending Review", filteredTickets.filter(t => t.status === 'Pending'), <Inbox className="text-blue-500" />, "border-blue-500")}
            {renderTicketSection("In Progress", filteredTickets.filter(t => t.status === 'In Progress'), <PlayCircle className="text-emerald-500" />, "border-emerald-500")}
            {renderTicketSection("Scheduled", filteredTickets.filter(t => t.status === 'Scheduled'), <CalendarClock className="text-indigo-500" />, "border-indigo-500")}
            {renderTicketSection("Completed", filteredTickets.filter(t => t.status === 'Completed'), <CheckCircle2 className="text-green-500" />, "border-green-500")}
          </>
      )}
    </div>
  );
};