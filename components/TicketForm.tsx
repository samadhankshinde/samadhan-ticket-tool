
import React, { useState, useRef, useEffect } from 'react';
import { AppTier, AssessmentType, SecurityQuestionnaire, Ticket, SecurityFormDetails, SubmissionFile, Region } from '../types';
import { analyzeRisk } from '../services/geminiService';
import { 
  Loader2, Sparkles, ShieldCheck, Globe, Mail, 
  Link as LinkIcon, Calendar, ClipboardList, 
  Users, Clock, AlertTriangle, ShieldAlert, 
  Lock, Database, FileCheck, HelpCircle, Laptop, Smartphone,
  Info, ExternalLink, TestTube2, CreditCard, UserPlus, FileUp, Server, Code2, KeyRound, ShieldHalf,
  UserCheck, Timer, Languages, FileWarning, Plus, X, FileCode, Box
} from 'lucide-react';

interface TicketFormProps {
  onSubmit: (ticket: Omit<Ticket, 'id'>) => void;
  onCancel: () => void;
}

const initialDetails: SecurityFormDetails = {
  description: '',
  targetAudienceRegion: '',
  isExternalSite: 'Internal Site for Enterprise Use',
  isTcccOwned: 'TCCC',
  businessOwner: '',
  itProjectManager: '',
  techContact: '',
  goLiveDate: '',
  testingDeadline: '',
  blackoutDates: '',
  expeditedReason: '',
  businessCriticality: 'Class 3',
  confidentialityRating: '1',
  integrityRating: '1',
  availabilityRating: '1',
  calculatedTier: AppTier.LOW,
  devSecOpsImplemented: '',
  allWeaknessesRemediated: false,
  wafDisabled: false,
  environmentPrereqs: '',
  isCustomCoded: 'Custom Coded',
  techStack: '',
  repoUrl: '',
  priorAssessment: '',
  testUrlProvided: '',
  outOfScopeItems: '',
  vendorPermission: false,
  walkthroughInfo: '',
  hasEmailFunctionality: false,
  hasPromotionalActivities: false,
  hasEcommerce: false,
  testAccountsProvided: '',
  piiCollectionDetails: '',
  fileUploadFunctionality: '',
  apiProtocol: 'REST',
  apiTargetAudience: 'Internal',
  apiDocumentation: '',
  apiAuthMechanisms: '',
  apiHandlesSensitiveData: '',
  isProtectedByAuth: true,
  authMechanisms: '',
  sessionExpirationPolicies: '',
  sessionValidationHandled: '',
  passwordPolicies: '',
  cocaColaPiiPolicy: true,
  geoCompliance: '',
  regionSpecificData: '',
  multilingualSupport: '',
  knownSecurityConcerns: ''
};

export const TicketForm: React.FC<TicketFormProps> = ({ onSubmit, onCancel }) => {
  const [appName, setAppName] = useState('');
  const [type, setType] = useState<AssessmentType>(AssessmentType.WEB);
  const [region, setRegion] = useState<Region>('North America');
  const [isExpedited, setIsExpedited] = useState(false);
  const [details, setDetails] = useState<SecurityFormDetails>(initialDetails);
  const [artifacts, setArtifacts] = useState<SubmissionFile[]>([]);
  const [ciaScore, setCiaScore] = useState<number>(1.0);
  
  const artifactInputRef = useRef<HTMLInputElement>(null);

  const updateDetail = (key: keyof SecurityFormDetails, value: any) => {
    setDetails(prev => ({ ...prev, [key]: value }));
  };

  useEffect(() => {
    const c = parseInt(details.confidentialityRating);
    const i = parseInt(details.integrityRating);
    const a = parseInt(details.availabilityRating);
    const score = (c + i + a) / 3;
    setCiaScore(Number(score.toFixed(2)));
    
    let newTier = AppTier.LOW;
    if (score >= 2.33) newTier = AppTier.HIGH;
    else if (score >= 1.67) newTier = AppTier.MEDIUM;
    
    if (details.calculatedTier !== newTier) {
      updateDetail('calculatedTier', newTier);
    }
  }, [details.confidentialityRating, details.integrityRating, details.availabilityRating]);

  const inputClass = "w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all outline-none text-sm text-gray-900 shadow-sm";
  const labelClass = "block text-[11px] font-bold text-gray-500 uppercase tracking-widest mb-2 ml-1 leading-relaxed";
  const sectionCard = "bg-white p-8 rounded-3xl border border-gray-100 shadow-sm space-y-8";

  const handleArtifactUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;

    // Fixed: Explicitly typed 'file' as File to resolve 'unknown' property access errors
    const newArtifacts: SubmissionFile[] = Array.from(files).map((file: File) => ({
      name: file.name,
      url: URL.createObjectURL(file),
      uploadDate: new Date().toLocaleDateString(),
      size: (file.size / 1024 / 1024).toFixed(2) + ' MB',
      type: file.name.split('.').pop()?.toLowerCase()
    }));

    setArtifacts(prev => [...prev, ...newArtifacts]);
  };

  const removeArtifact = (idx: number) => {
    setArtifacts(prev => prev.filter((_, i) => i !== idx));
  };

  const getFileIcon = (type?: string) => {
    if (type === 'apk' || type === 'ipa') return <Smartphone className="w-5 h-5" />;
    if (type === 'json') return <FileCode className="w-5 h-5" />;
    return <FileUp className="w-5 h-5" />;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const securityAnswers: SecurityQuestionnaire = {
        handlesPII: !!details.piiCollectionDetails,
        internetFacing: details.isExternalSite !== 'Internal Site for Enterprise Use',
        storesPaymentData: details.hasEcommerce,
        thirdPartyIntegrations: !!details.apiProtocol,
        requiresUserAuth: details.isProtectedByAuth
    };

    onSubmit({
      appName,
      vendorEmail: details.businessOwner,
      region,
      testUrl: details.testUrlProvided,
      readyDate: details.goLiveDate,
      type,
      tier: details.calculatedTier,
      isExpedited,
      securityAnswers,
      details,
      artifacts,
      status: 'Pending',
      messages: []
    });
  };

  return (
    <div className="w-full space-y-12 pb-20">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 px-4">
        <div>
          <h2 className="text-3xl font-extrabold text-gray-900 tracking-tight">Security Assessment Request</h2>
          <p className="text-gray-500 mt-2 font-medium">Complete the form below to initiate a security review for your application.</p>
        </div>
        <div className="flex items-center gap-4">
           <button type="button" onClick={onCancel} className="px-6 py-3 rounded-2xl text-sm font-bold text-gray-500 hover:bg-gray-100 transition-colors">Cancel</button>
           <button form="request-form" type="submit" className="px-10 py-3 rounded-2xl text-sm font-bold bg-blue-600 text-white shadow-xl shadow-blue-500/20 hover:bg-blue-700 active:scale-95 transition-all">Submit Request</button>
        </div>
      </div>

      <form id="request-form" onSubmit={handleSubmit} className="space-y-10">
        
        {/* Section 1: Application Information */}
        <section className={sectionCard}>
          <div className="flex items-center gap-4 border-b border-gray-100 pb-6">
             <div className="p-3 bg-blue-50 rounded-2xl text-blue-600"><ClipboardList className="w-6 h-6" /></div>
             <div>
                <h3 className="text-xl font-bold text-gray-800">1. Application Information</h3>
                <p className="text-xs text-gray-400 font-medium uppercase tracking-wider">Project Identity & Classification</p>
             </div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="space-y-1">
              <label className={labelClass}>1) Application Name</label>
              <input required type="text" value={appName} onChange={(e) => setAppName(e.target.value)} className={inputClass} placeholder="Project Name" />
            </div>
            <div className="space-y-1">
              <label className={labelClass}>2) Application Type</label>
              <select value={type} onChange={(e) => setType(e.target.value as AssessmentType)} className={inputClass}>
                {Object.values(AssessmentType).map((t) => <option key={t} value={t}>{t}</option>)}
              </select>
            </div>
            <div className="md:col-span-2">
              <label className={labelClass}>3) Application Descriptions</label>
              <textarea required rows={3} value={details.description} onChange={(e) => updateDetail('description', e.target.value)} className={inputClass} placeholder="Describe the application purpose and functionality..." />
            </div>
            <div className="space-y-1">
              <label className={labelClass}>4) Target Audience Region</label>
              <select value={region} onChange={(e) => { setRegion(e.target.value as Region); updateDetail('targetAudienceRegion', e.target.value); }} className={inputClass}>
                <option value="APAC">APAC</option>
                <option value="EMEA">EMEA</option>
                <option value="Global">Global</option>
                <option value="Latin America">Latin America</option>
                <option value="North America">North America</option>
              </select>
            </div>
            <div className="space-y-1">
              <label className={labelClass}>6) Developed By</label>
              <select value={details.isTcccOwned} onChange={(e) => updateDetail('isTcccOwned', e.target.value)} className={inputClass}>
                <option value="TCCC">TCCC</option>
                <option value="Partner">Partner</option>
                <option value="Bottler">Bottler</option>
              </select>
            </div>
             <div className="md:col-span-2 space-y-1">
              <label className={labelClass}>5) External/Internal Audience Type</label>
              <select value={details.isExternalSite} onChange={(e) => updateDetail('isExternalSite', e.target.value)} className={inputClass}>
                <option value="Public Consumers">Public Consumers</option>
                <option value="Exclusive Business Partners">Exclusive Business Partners</option>
                <option value="Internal Site for Enterprise Use">Internal Site for Enterprise Use</option>
              </select>
            </div>
          </div>
        </section>

        {/* NEW SECTION: Assessment Artifacts */}
        <section className={sectionCard}>
          <div className="flex items-center gap-4 border-b border-gray-100 pb-6">
             <div className="p-3 bg-emerald-50 rounded-2xl text-emerald-600"><Box className="w-6 h-6" /></div>
             <div>
                <h3 className="text-xl font-bold text-gray-800">Assessment Artifacts</h3>
                <p className="text-xs text-gray-400 font-medium uppercase tracking-wider">Upload APK, IPA, JSON, or Workflow Docs</p>
             </div>
          </div>
          
          <div className="space-y-6">
            <div 
              onClick={() => artifactInputRef.current?.click()}
              className="border-2 border-dashed border-gray-200 rounded-3xl p-10 flex flex-col items-center justify-center hover:border-emerald-400 hover:bg-emerald-50/30 transition-all cursor-pointer group"
            >
                <div className="p-4 bg-white rounded-2xl shadow-sm border border-gray-100 mb-4 group-hover:scale-110 transition-transform">
                    <FileUp className="w-8 h-8 text-gray-400 group-hover:text-emerald-500" />
                </div>
                <h4 className="font-bold text-gray-800">Upload Files</h4>
                <p className="text-sm text-gray-500 mt-1">Select APK, IPA, JSON or documentation</p>
                <input 
                  type="file" 
                  ref={artifactInputRef} 
                  multiple 
                  onChange={handleArtifactUpload} 
                  className="hidden" 
                  accept=".apk,.ipa,.json,.pdf,.docx,.xlsx"
                />
            </div>

            {artifacts.length > 0 && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {artifacts.map((file, idx) => (
                  <div key={idx} className="p-4 bg-white border border-gray-100 rounded-2xl flex items-center justify-between group/file hover:border-emerald-200 transition-colors shadow-sm">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-gray-50 rounded-xl text-emerald-600">
                        {getFileIcon(file.type)}
                      </div>
                      <div>
                        <p className="text-sm font-bold text-gray-900 truncate max-w-[150px]">{file.name}</p>
                        <p className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">{file.size} • {file.type}</p>
                      </div>
                    </div>
                    <button 
                      type="button" 
                      onClick={() => removeArtifact(idx)}
                      className="p-2 text-gray-300 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </section>

        {/* Section 2: Contacts */}
        <section className={sectionCard}>
          <div className="flex items-center gap-4 border-b border-gray-100 pb-6">
             <div className="p-3 bg-indigo-50 rounded-2xl text-indigo-600"><Users className="w-6 h-6" /></div>
             <div>
                <h3 className="text-xl font-bold text-gray-800">2. Contacts</h3>
                <p className="text-xs text-gray-400 font-medium uppercase tracking-wider">Stakeholders & Responsibility</p>
             </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="space-y-1">
              <label className={labelClass}>Business Owner (Email)</label>
              <div className="relative">
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input required type="email" value={details.businessOwner} onChange={(e) => updateDetail('businessOwner', e.target.value)} className={`${inputClass} pl-12`} placeholder="owner@coke.com" />
              </div>
            </div>
            <div className="space-y-1">
              <label className={labelClass}>IT Project Manager (Email)</label>
              <div className="relative">
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input required type="email" value={details.itProjectManager} onChange={(e) => updateDetail('itProjectManager', e.target.value)} className={`${inputClass} pl-12`} />
              </div>
            </div>
            <div className="space-y-1 md:col-span-2">
              <label className={labelClass}>Technical/QA Contact (Email)</label>
              <div className="relative">
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input required type="email" value={details.techContact} onChange={(e) => updateDetail('techContact', e.target.value)} className={`${inputClass} pl-12`} />
              </div>
            </div>
          </div>
        </section>

        {/* Section 3: Timeline */}
        <section className={sectionCard}>
          <div className="flex items-center gap-4 border-b border-gray-100 pb-6">
             <div className="p-3 bg-orange-50 rounded-2xl text-orange-600"><Clock className="w-6 h-6" /></div>
             <div>
                <h3 className="text-xl font-bold text-gray-800">3. Timeline & Urgency</h3>
                <p className="text-xs text-gray-400 font-medium uppercase tracking-wider">Scheduling Requirements</p>
             </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="space-y-1">
              <label className={labelClass}>Go-Live Date</label>
              <input required type="date" value={details.goLiveDate} onChange={(e) => updateDetail('goLiveDate', e.target.value)} className={inputClass} />
            </div>
            <div className="space-y-1">
              <label className={labelClass}>Testing Deadline</label>
              <input required type="date" value={details.testingDeadline} onChange={(e) => updateDetail('testingDeadline', e.target.value)} className={inputClass} />
            </div>
            <div className="space-y-1">
              <label className={labelClass}>Blackout Dates</label>
              <input type="text" value={details.blackoutDates} onChange={(e) => updateDetail('blackoutDates', e.target.value)} className={inputClass} placeholder="e.g. Dec 24-26" />
            </div>
          </div>
          <div className={`p-6 rounded-2xl border transition-all ${isExpedited ? 'bg-red-50 border-red-200' : 'bg-gray-50 border-gray-100'}`}>
             <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                   <ShieldAlert className={`w-5 h-5 ${isExpedited ? 'text-red-600' : 'text-gray-400'}`} />
                   <h4 className="font-bold text-gray-800">Expedite Assessment?</h4>
                </div>
                <button type="button" onClick={() => setIsExpedited(!isExpedited)} className={`w-14 h-8 rounded-full transition-colors relative ${isExpedited ? 'bg-red-600' : 'bg-gray-300'}`}>
                  <div className={`absolute top-1 w-6 h-6 bg-white rounded-full transition-all shadow-sm ${isExpedited ? 'left-7' : 'left-1'}`}></div>
                </button>
             </div>
             {isExpedited && (
               <textarea rows={2} value={details.expeditedReason} onChange={(e) => updateDetail('expeditedReason', e.target.value)} className="w-full bg-white border border-red-200 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-red-500/20 focus:border-red-500 outline-none" placeholder="State the business justification for urgency..." />
             )}
          </div>
        </section>

        {/* Section 4: Tier Determination */}
        <section className={sectionCard}>
          <div className="flex items-center gap-4 border-b border-gray-100 pb-6">
             <div className="p-3 bg-red-50 rounded-2xl text-red-600"><ShieldCheck className="w-6 h-6" /></div>
             <div>
                <h3 className="text-xl font-bold text-gray-800">4. Tier Determination</h3>
                <p className="text-xs text-gray-400 font-medium uppercase tracking-wider">Risk Profiling & Impact Analysis</p>
             </div>
          </div>
          <div className="space-y-8">
             <div className="space-y-1">
                <label className={labelClass}>1) What is the Application business criticality? (Class 0 is severely critical, Class 3 is least critical)?</label>
                <select value={details.businessCriticality} onChange={(e) => updateDetail('businessCriticality', e.target.value)} className={inputClass}>
                  <option value="Class 0">Class 0 - Severely Critical</option>
                  <option value="Class 1">Class 1 - Highly Critical</option>
                  <option value="Class 2">Class 2 - Moderately Critical</option>
                  <option value="Class 3">Class 3 - Least Critical</option>
                </select>
             </div>
             <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                <div className="space-y-1">
                   <label className={labelClass}>2) Confidentiality rating? (Data Privacy)</label>
                   <select value={details.confidentialityRating} onChange={(e) => updateDetail('confidentialityRating', e.target.value)} className={inputClass}>
                     <option value="1">1 (Low)</option>
                     <option value="2">2 (Medium)</option>
                     <option value="3">3 (High)</option>
                   </select>
                </div>
                <div className="space-y-1">
                   <label className={labelClass}>3) Availability rating? (System Uptime)</label>
                   <select value={details.availabilityRating} onChange={(e) => updateDetail('availabilityRating', e.target.value)} className={inputClass}>
                     <option value="1">1 (Low)</option>
                     <option value="2">2 (Medium)</option>
                     <option value="3">3 (High)</option>
                   </select>
                </div>
                <div className="space-y-1">
                   <label className={labelClass}>4) Integrity rating? (Data Correctness)</label>
                   <select value={details.integrityRating} onChange={(e) => updateDetail('integrityRating', e.target.value)} className={inputClass}>
                     <option value="1">1 (Low)</option>
                     <option value="2">2 (Medium)</option>
                     <option value="3">3 (High)</option>
                   </select>
                </div>
             </div>
             <div className="pt-6 border-t border-gray-100 flex flex-col md:flex-row md:items-center justify-between gap-6">
                <div className="max-w-md">
                  <label className={labelClass}>5) Application Tier based on selected CIA value (low medium, high)</label>
                  <p className="text-xs text-gray-400">Score = (C+I+A)/3. Current Score: <span className="font-bold text-gray-700">{ciaScore}</span></p>
                </div>
                <div className={`px-8 py-3 rounded-2xl text-sm font-black uppercase tracking-widest border transition-all shadow-sm ${
                    details.calculatedTier === AppTier.HIGH ? 'bg-red-50 border-red-200 text-red-700' :
                    details.calculatedTier === AppTier.MEDIUM ? 'bg-orange-50 border-orange-200 text-orange-700' :
                    'bg-green-50 border-green-200 text-green-700'
                }`}>
                    {details.calculatedTier} Priority
                </div>
             </div>
          </div>
        </section>

        {/* Section 5: Pre-Requisites & Tech Stack */}
        <section className={sectionCard}>
          <div className="flex items-center gap-4 border-b border-gray-100 pb-6">
             <div className="p-3 bg-blue-50 rounded-2xl text-blue-600"><Database className="w-6 h-6" /></div>
             <div>
                <h3 className="text-xl font-bold text-gray-800">5. Pre-Requisites & Tech Stack</h3>
                <p className="text-xs text-gray-400 font-medium uppercase tracking-wider">DevSecOps & Hosting Environment</p>
             </div>
          </div>

          <div className="space-y-8">
            <div className="space-y-4">
              <div className="flex flex-col gap-2">
                <label className={labelClass}>1) Have CodeQL (SAST), Dependency scanning, Secret scanning, and StackHawk (DAST) been implemented for this application?</label>
                <div className="p-4 bg-amber-50 rounded-2xl border border-amber-100 flex items-start gap-3">
                  <Info className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
                  <div className="text-xs text-amber-800 leading-relaxed">
                    <span className="font-bold">Note:</span> It is Mandatory for all applications to go through these scans and provide the reports. If not, please clarify the reason.
                    <a href="https://wiki.coke.com/confluence/pages/viewpage.action?spaceKey=infomix&title=DevSecOps+Security+Offering" target="_blank" rel="noopener noreferrer" className="block mt-1 text-blue-600 font-bold hover:underline flex items-center gap-1">
                      More details refer here <ExternalLink className="w-3 h-3" />
                    </a>
                  </div>
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <select 
                  value={details.devSecOpsImplemented ? 'Yes' : 'No'} 
                  onChange={(e) => updateDetail('devSecOpsImplemented', e.target.value === 'Yes' ? 'Scans implemented' : '')} 
                  className={inputClass}
                >
                  <option value="Yes">Yes</option>
                  <option value="No">No</option>
                </select>
                <div className="md:col-span-3">
                  <textarea 
                    rows={2}
                    value={details.devSecOpsImplemented} 
                    onChange={(e) => updateDetail('devSecOpsImplemented', e.target.value)} 
                    className={inputClass} 
                    placeholder="If yes, provide latest scan results/reports URL. If no, provide justification..."
                  />
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="space-y-1">
                <label className={labelClass}>2) Have all SAST/DAST/Dependency level weaknesses been remediated?</label>
                <select 
                  value={details.allWeaknessesRemediated ? 'Yes' : 'No'} 
                  onChange={(e) => updateDetail('allWeaknessesRemediated', e.target.value === 'Yes')} 
                  className={inputClass}
                >
                  <option value="Yes">Yes</option>
                  <option value="No">No</option>
                </select>
              </div>
              <div className="space-y-1">
                <label className={labelClass}>3) Is the Web Application Firewall (WAF) turned off for security testing?</label>
                <select 
                  value={details.wafDisabled ? 'Yes' : 'No'} 
                  onChange={(e) => updateDetail('wafDisabled', e.target.value === 'Yes')} 
                  className={inputClass}
                >
                  <option value="Yes">Yes</option>
                  <option value="No">No</option>
                </select>
              </div>
            </div>

            <div className="space-y-1">
              <label className={labelClass}>4) Are there any environment-specific prerequisites (e.g., IP whitelisting, test data)?</label>
              <textarea rows={2} value={details.environmentPrereqs} onChange={(e) => updateDetail('environmentPrereqs', e.target.value)} className={inputClass} />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="space-y-1">
                <label className={labelClass}>5) Coding Strategy</label>
                <select value={details.isCustomCoded} onChange={(e) => updateDetail('isCustomCoded', e.target.value)} className={inputClass}>
                  <option value="Custom Coded">Custom Coded</option>
                  <option value="COTS">COTS</option>
                  <option value="Open Source">Open Source</option>
                  <option value="AI Generated Code">AI Generated Code</option>
                  <option value="Augmented Reality">Augmented Reality</option>
                </select>
              </div>
              <div className="space-y-1">
                <label className={labelClass}>7) Source Code Management Platform</label>
                <input type="text" value={details.repoUrl} onChange={(e) => updateDetail('repoUrl', e.target.value)} className={inputClass} placeholder="e.g. GitHub, Azure DevOps" />
              </div>
            </div>

            <div className="space-y-1">
              <label className={labelClass}>6) Tech Stack, Architecture, Hosting & Storage</label>
              <textarea rows={2} value={details.techStack} onChange={(e) => updateDetail('techStack', e.target.value)} className={inputClass} />
            </div>

            <div className="space-y-1">
              <label className={labelClass}>8) Prior Security Assessments</label>
              <textarea rows={2} value={details.priorAssessment} onChange={(e) => updateDetail('priorAssessment', e.target.value)} className={inputClass} />
            </div>

            <div className="space-y-1">
              <label className={labelClass}>9) Test/Staging/UAT URL provided?</label>
              <input type="url" value={details.testUrlProvided} onChange={(e) => updateDetail('testUrlProvided', e.target.value)} className={inputClass} placeholder="https://..." />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="space-y-1">
                <label className={labelClass}>10) Areas not to be tested / Out of Scope</label>
                <textarea rows={2} value={details.outOfScopeItems} onChange={(e) => updateDetail('outOfScopeItems', e.target.value)} className={inputClass} />
              </div>
              <div className="space-y-1">
                <label className={labelClass}>11) Vendor permission for 3rd party components?</label>
                <select value={details.vendorPermission ? 'Yes' : 'No'} onChange={(e) => updateDetail('vendorPermission', e.target.value === 'Yes')} className={inputClass}>
                  <option value="Yes">Yes</option>
                  <option value="No">No</option>
                </select>
              </div>
            </div>
          </div>
        </section>

        {/* Section 6: Web App Testing Information */}
        <section className={sectionCard}>
          <div className="flex items-center gap-4 border-b border-gray-100 pb-6">
             <div className="p-3 bg-purple-50 rounded-2xl text-purple-600"><Laptop className="w-6 h-6" /></div>
             <div>
                <h3 className="text-xl font-bold text-gray-800">6. Web App Testing Information</h3>
                <p className="text-xs text-gray-400 font-medium uppercase tracking-wider">Execution Prerequisites</p>
             </div>
          </div>

          <div className="space-y-8">
            <div className="space-y-1">
              <label className={labelClass}>1) Key User Transactions & Walkthrough Session Availability</label>
              <textarea 
                rows={3} 
                value={details.walkthroughInfo} 
                onChange={(e) => updateDetail('walkthroughInfo', e.target.value)} 
                className={inputClass} 
                placeholder="Key transactions, walkthrough document links, and earliest availability..."
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="space-y-1">
                <label className={labelClass}>2) Email Functionality?</label>
                <div className="relative">
                  <Mail className="absolute left-3 top-3 w-4 h-4 text-gray-400" />
                  <select 
                    value={details.hasEmailFunctionality ? 'Yes' : 'No'} 
                    onChange={(e) => updateDetail('hasEmailFunctionality', e.target.value === 'Yes')} 
                    className={`${inputClass} pl-10`}
                  >
                    <option value="No">No</option>
                    <option value="Yes">Yes</option>
                  </select>
                </div>
              </div>

              <div className="space-y-1">
                <label className={labelClass}>3) Prize-based rewards or Promo/PIN codes?</label>
                <select 
                  value={details.hasPromotionalActivities ? 'Yes' : 'No'} 
                  onChange={(e) => updateDetail('hasPromotionalActivities', e.target.value === 'Yes')} 
                  className={inputClass}
                >
                  <option value="No">No</option>
                  <option value="Yes">Yes</option>
                </select>
              </div>
            </div>

            <div className="space-y-4">
              <div className="space-y-1">
                <label className={labelClass}>4) Ecommerce or third-party payment processing?</label>
                <div className="relative">
                  <CreditCard className="absolute left-3 top-3 w-4 h-4 text-gray-400" />
                  <select 
                    value={details.hasEcommerce ? 'Yes' : 'No'} 
                    onChange={(e) => updateDetail('hasEcommerce', e.target.value === 'Yes')} 
                    className={`${inputClass} pl-10`}
                  >
                    <option value="No">No</option>
                    <option value="Yes">Yes</option>
                  </select>
                </div>
              </div>
            </div>

            <div className="space-y-1">
              <label className={labelClass}>5) Provide two test accounts for each user role and one for each admin role.</label>
              <div className="relative">
                <UserPlus className="absolute left-3 top-3 w-4 h-4 text-gray-400" />
                <textarea 
                  rows={3} 
                  value={details.testAccountsProvided} 
                  onChange={(e) => updateDetail('testAccountsProvided', e.target.value)} 
                  className={`${inputClass} pl-10`} 
                  placeholder="Role: [Username/Password]..."
                />
              </div>
            </div>

            <div className="space-y-1">
              <label className={labelClass}>6) Pll Collection Details (full name, email, birth date, etc.)</label>
              <textarea 
                rows={2} 
                value={details.piiCollectionDetails} 
                onChange={(e) => updateDetail('piiCollectionDetails', e.target.value)} 
                className={inputClass} 
              />
            </div>

            <div className="space-y-1">
              <label className={labelClass}>7) File Upload Functionality (type and maximum allowed size)</label>
              <div className="relative">
                <FileUp className="absolute left-3 top-3 w-4 h-4 text-gray-400" />
                <textarea 
                  rows={2} 
                  value={details.fileUploadFunctionality} 
                  onChange={(e) => updateDetail('fileUploadFunctionality', e.target.value)} 
                  className={`${inputClass} pl-10`} 
                />
              </div>
            </div>
          </div>
        </section>

        {/* Section 7: API Testing */}
        <section className={sectionCard}>
          <div className="flex items-center gap-4 border-b border-gray-100 pb-6">
             <div className="p-3 bg-indigo-50 rounded-2xl text-indigo-600"><Server className="w-6 h-6" /></div>
             <div>
                <h3 className="text-xl font-bold text-gray-800">7. API Testing</h3>
                <p className="text-xs text-gray-400 font-medium uppercase tracking-wider">Integrations & Data Exchange</p>
             </div>
          </div>

          <div className="space-y-8">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="space-y-1">
                <label className={labelClass}>1) API protocol and architectural style</label>
                <div className="relative">
                  <Code2 className="absolute left-3 top-3 w-4 h-4 text-gray-400" />
                  <select 
                    value={details.apiProtocol} 
                    onChange={(e) => updateDetail('apiProtocol', e.target.value)} 
                    className={`${inputClass} pl-10`}
                  >
                    <option value="REST">REST</option>
                    <option value="SOAP">SOAP</option>
                    <option value="GraphQL">GraphQL</option>
                    <option value="gRPC">gRPC</option>
                    <option value="Other">Other</option>
                  </select>
                </div>
              </div>

              <div className="space-y-1">
                <label className={labelClass}>2) Is the API Public, Partner (B2B), or Internal?</label>
                <select 
                  value={details.apiTargetAudience} 
                  onChange={(e) => updateDetail('apiTargetAudience', e.target.value)} 
                  className={inputClass}
                >
                  <option value="Public">Public</option>
                  <option value="Partner (B2B)">Partner (B2B)</option>
                  <option value="Internal">Internal</option>
                </select>
              </div>
            </div>

            <div className="space-y-1">
              <label className={labelClass}>3) API documentation or test templates (Swagger/OpenAPI, Postman)</label>
              <textarea 
                rows={2} 
                value={details.apiDocumentation} 
                onChange={(e) => updateDetail('apiDocumentation', e.target.value)} 
                className={inputClass} 
                placeholder="Provide links to Swagger UI, Postman Cloud, or instructions..."
              />
            </div>

            <div className="space-y-1">
              <label className={labelClass}>4) What authentication and authorization mechanisms are used?</label>
              <div className="relative">
                <KeyRound className="absolute left-3 top-3 w-4 h-4 text-gray-400" />
                <textarea 
                  rows={2} 
                  value={details.apiAuthMechanisms} 
                  onChange={(e) => updateDetail('apiAuthMechanisms', e.target.value)} 
                  className={`${inputClass} pl-10`} 
                  placeholder="e.g. API keys, OAuth 2.0, JWT, MFA, Basic login..."
                />
              </div>
            </div>

            <div className="space-y-1">
              <label className={labelClass}>5) Does the API handle or store any sensitive, restricted, or highly restricted data?</label>
              <div className="relative">
                <ShieldHalf className="absolute left-3 top-3 w-4 h-4 text-gray-400" />
                <textarea 
                  rows={2} 
                  value={details.apiHandlesSensitiveData} 
                  onChange={(e) => updateDetail('apiHandlesSensitiveData', e.target.value)} 
                  className={`${inputClass} pl-10`} 
                  placeholder="Detail any PII, financial, or health data handled by the API..."
                />
              </div>
            </div>
          </div>
        </section>

        {/* Section 8: Authentication and Authorization */}
        <section className={sectionCard}>
          <div className="flex items-center gap-4 border-b border-gray-100 pb-6">
             <div className="p-3 bg-red-50 rounded-2xl text-red-600"><Lock className="w-6 h-6" /></div>
             <div>
                <h3 className="text-xl font-bold text-gray-800">8. Authentication and Authorization</h3>
                <p className="text-xs text-gray-400 font-medium uppercase tracking-wider">Access Controls & Session Security</p>
             </div>
          </div>

          <div className="space-y-8">
            {/* Q1: Is application protected by auth */}
            <div className="space-y-1">
              <label className={labelClass}>1) Is the application protected by authentication, and do end-users need to log in?</label>
              <div className="flex gap-4">
                <select 
                  value={details.isProtectedByAuth ? 'Yes' : 'No'} 
                  onChange={(e) => updateDetail('isProtectedByAuth', e.target.value === 'Yes')} 
                  className={inputClass}
                >
                  <option value="Yes">Yes</option>
                  <option value="No">No</option>
                </select>
              </div>
            </div>

            {/* Q2: Auth Mechanisms */}
            <div className="space-y-1">
              <label className={labelClass}>2) What authentication mechanisms are used (e.g., username/password, OAuth, SSO, MFA)?</label>
              <div className="relative">
                <UserCheck className="absolute left-3 top-3 w-4 h-4 text-gray-400" />
                <textarea 
                  rows={2} 
                  value={details.authMechanisms} 
                  onChange={(e) => updateDetail('authMechanisms', e.target.value)} 
                  className={`${inputClass} pl-10`} 
                  placeholder="Describe user login flow, integration with Azure AD/Okta, multi-factor usage..."
                />
              </div>
            </div>

            {/* Q3: Session Policies */}
            <div className="space-y-1">
              <label className={labelClass}>3) What session expiration and token lifecycle policies are enforced?</label>
              <div className="relative">
                <Timer className="absolute left-3 top-3 w-4 h-4 text-gray-400" />
                <textarea 
                  rows={2} 
                  value={details.sessionExpirationPolicies} 
                  onChange={(e) => updateDetail('sessionExpirationPolicies', e.target.value)} 
                  className={`${inputClass} pl-10`} 
                  placeholder="Inactivity timeout, absolute session lifespan, token TTL..."
                />
              </div>
            </div>

            {/* Q4: Token Validation */}
            <div className="space-y-1">
              <label className={labelClass}>4) How is session management and token validation handled (e.g., JWT signature, rotation, revocation)?</label>
              <div className="relative">
                <ShieldCheck className="absolute left-3 top-3 w-4 h-4 text-gray-400" />
                <textarea 
                  rows={2} 
                  value={details.sessionValidationHandled} 
                  onChange={(e) => updateDetail('sessionValidationHandled', e.target.value)} 
                  className={`${inputClass} pl-10`} 
                  placeholder="Signing algorithm used, key rotation procedures, logout handling..."
                />
              </div>
            </div>

            {/* Q5: Password Policies */}
            <div className="space-y-1">
              <label className={labelClass}>5) What password, account lockout, and credential reset policies are implemented?</label>
              <div className="relative">
                <KeyRound className="absolute left-3 top-3 w-4 h-4 text-gray-400" />
                <textarea 
                  rows={2} 
                  value={details.passwordPolicies} 
                  onChange={(e) => updateDetail('passwordPolicies', e.target.value)} 
                  className={`${inputClass} pl-10`} 
                  placeholder="Lockout after X attempts, password complexity, reset token expiry..."
                />
              </div>
            </div>
          </div>
        </section>

        {/* Section 9: Compliance and Security Concerns */}
        <section className={sectionCard}>
          <div className="flex items-center gap-4 border-b border-gray-100 pb-6">
             <div className="p-3 bg-amber-50 rounded-2xl text-amber-600"><ShieldCheck className="w-6 h-6" /></div>
             <div>
                <h3 className="text-xl font-bold text-gray-800">9. Compliance and Security Concerns</h3>
                <p className="text-xs text-gray-400 font-medium uppercase tracking-wider">Policy Enforcement & Global Regulations</p>
             </div>
          </div>

          <div className="space-y-8">
            {/* Q1: Coca-Cola Policy */}
            <div className="space-y-1">
              <label className={labelClass}>1) Is the Coca-Cola policy related to handle PII data implemented?</label>
              <select 
                value={details.cocaColaPiiPolicy ? 'Yes' : 'No'} 
                onChange={(e) => updateDetail('cocaColaPiiPolicy', e.target.value === 'Yes')} 
                className={inputClass}
              >
                <option value="Yes">Yes</option>
                <option value="No">No</option>
              </select>
            </div>

            {/* Q2: Geo-Restriction / Compliance */}
            <div className="space-y-1">
              <label className={labelClass}>2) Does the application enforce any geo-restriction policies or fall under specific regulatory/compliance requirements (e.g., GDPR, PCI-DSS)?</label>
              <div className="relative">
                <Globe className="absolute left-3 top-3 w-4 h-4 text-gray-400" />
                <textarea 
                  rows={2} 
                  value={details.geoCompliance} 
                  onChange={(e) => updateDetail('geoCompliance', e.target.value)} 
                  className={`${inputClass} pl-10`} 
                  placeholder="Specify applicable regions and regulations if yes..."
                />
              </div>
            </div>

            {/* Q3: Region-Specific Data */}
            <div className="space-y-1">
              <label className={labelClass}>3) Does the security assessment require region-specific data such as phone numbers, addresses, or account details?</label>
              <div className="relative">
                <FileCheck className="absolute left-3 top-3 w-4 h-4 text-gray-400" />
                <textarea 
                  rows={2} 
                  value={details.regionSpecificData} 
                  onChange={(e) => updateDetail('regionSpecificData', e.target.value)} 
                  className={`${inputClass} pl-10`} 
                  placeholder="Provide necessary sample data if yes..."
                />
              </div>
            </div>

            {/* Q4: Multilingual Support */}
            <div className="space-y-1">
              <label className={labelClass}>4) Does the application provide multilingual support?</label>
              <div className="relative">
                <Languages className="absolute left-3 top-3 w-4 h-4 text-gray-400" />
                <textarea 
                  rows={2} 
                  value={details.multilingualSupport} 
                  onChange={(e) => updateDetail('multilingualSupport', e.target.value)} 
                  className={`${inputClass} pl-10`} 
                  placeholder="Specify languages (e.g., Chinese, Japanese, French)..."
                />
              </div>
            </div>

            {/* Q5: Known Concerns */}
            <div className="space-y-1">
              <label className={labelClass}>5) Do you have any known security concerns or specific areas for focus?</label>
              <div className="relative">
                <FileWarning className="absolute left-3 top-3 w-4 h-4 text-gray-400" />
                <textarea 
                  rows={2} 
                  value={details.knownSecurityConcerns} 
                  onChange={(e) => updateDetail('knownSecurityConcerns', e.target.value)} 
                  className={`${inputClass} pl-10`} 
                  placeholder="Detail any specific risks or prior issues..."
                />
              </div>
            </div>
          </div>
        </section>

      </form>
    </div>
  );
};
