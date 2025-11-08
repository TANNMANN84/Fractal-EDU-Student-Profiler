import React, { useState, useEffect, useRef, useMemo } from 'react';
import { useAppContext } from '../contexts/AppContext';
import type { Student, NaplanDataSet, StudentWellbeing, WorkSample, EvidenceLogEntry, FileUpload, NoteEntry, DifferentiationEntry, LiteracyEvidenceEntry, NumeracyEvidenceEntry } from '../types';
import { ATSI_STATUSES, HPGE_STATUSES, HPGE_DOMAINS, NAPLAN_BANDS, NEWMANS_ANALYSIS_TAGS } from '../constants';
import TagInput from './TagInput'; // Import the new component
import AddEvidenceModal from './AddEvidenceModal';
import InlineFileUpload from './InlineFileUpload';
import NotesSection from './NotesSection';
import AddLiteracyEvidenceModal from './AddLiteracyEvidenceModal';
import AddNumeracyEvidenceModal from './AddNumeracyEvidenceModal';
import { storageService } from '../services/storageService';


const getNaplanBandColor = (band: string): string => {
    switch (band) {
        case 'Exceeding': return 'bg-blue-100 border-blue-300 text-blue-900';
        case 'Strong': return 'bg-green-100 border-green-300 text-green-900';
        case 'Developing': return 'bg-yellow-100 border-yellow-300 text-yellow-900';
        case 'Needs additional support': return 'bg-red-100 border-red-300 text-red-900';
        default: return 'bg-gray-100 border-gray-300 text-gray-800';
    }
};

interface EditStudentModalProps {
  student: Student;
  onClose: () => void;
  onSave: (updatedStudent: Student) => void;
}

// New component for the Tab button
const TabButton: React.FC<{ title: string; isActive: boolean; onClick: () => void }> = ({ title, isActive, onClick }) => (
  <button
    type="button"
    onClick={onClick}
    className={`px-4 py-3 text-sm font-medium border-b-2
      ${isActive
        ? 'border-blue-600 text-blue-700'
        : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
      }
      focus:outline-none transition-colors`}
    role="tab"
    aria-selected={isActive}
  >
    {title}
  </button>
);

// New component for the Tab content panel
const TabPanel: React.FC<{ isActive: boolean; children: React.ReactNode }> = ({ isActive, children }) => (
  <div
    className={`p-6 ${isActive ? '' : 'hidden'}`}
    role="tabpanel"
  >
    {children}
  </div>
);

const NaplanBandBadge: React.FC<{ band: string }> = ({ band }) => {
    let colorClasses = 'bg-gray-100 text-gray-800'; // Default for "Not Assessed"
    switch (band) {
        case 'Exceeding':
            colorClasses = 'bg-blue-100 text-blue-800';
            break;
        case 'Strong':
            colorClasses = 'bg-green-100 text-green-800';
            break;
        case 'Developing':
            colorClasses = 'bg-yellow-100 text-yellow-800';
            break;
        case 'Needs additional support':
            colorClasses = 'bg-red-100 text-red-800';
            break;
    }

    return (
        <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${colorClasses}`}>
            {band}
        </span>
    );
};


const EvidenceLogList: React.FC<{ logs: EvidenceLogEntry[], title: string }> = ({ logs, title }) => {
    if (logs.length === 0) {
        return null;
    }

    return (
        <div className="mt-6">
            <h4 className="font-semibold text-gray-800 border-b pb-2 mb-4">{title}</h4>
            <div className="space-y-3 max-h-64 overflow-y-auto pr-2">
                {logs.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()).map(log => (
                    <div key={log.logId} className="bg-white border border-gray-200 p-3 rounded-lg shadow-sm">
                        <div className="flex justify-between items-start">
                             <p className="text-xs text-gray-500">
                                {new Date(log.date).toLocaleDateString('en-AU', { year: 'numeric', month: 'long', day: 'numeric' })}
                            </p>
                            <div className="flex flex-col items-end text-sm gap-1">
                                {log.evidenceLink && <a href={log.evidenceLink} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline font-semibold">View Link</a>}
                                {log.evidenceFile && <button onClick={() => storageService.triggerDownload(log.evidenceFile!)} className="text-blue-600 hover:underline font-semibold">Download File</button>}
                            </div>
                        </div>
                        <p className="mt-1 text-sm text-gray-700 whitespace-pre-wrap">{log.note}</p>
                        {log.adjustments_used && log.adjustments_used.length > 0 && (
                            <div className="mt-2 pt-2 border-t">
                                <p className="text-xs font-semibold text-gray-600">Adjustments:</p>
                                <ul className="list-disc list-inside text-xs text-gray-600">
                                    {log.adjustments_used.map(adj => <li key={adj}>{adj}</li>)}
                                </ul>
                            </div>
                        )}
                         {log.tags?.includes('NCCD') && log.adjustment_level && (
                            <p className="text-xs font-semibold text-gray-600 mt-2">Level: {log.adjustment_level}</p>
                        )}
                    </div>
                ))}
            </div>
        </div>
    );
};

const EditStudentModal: React.FC<EditStudentModalProps> = ({ student, onClose, onSave }) => {
  const { data } = useAppContext();
  const [formData, setFormData] = useState<Student>(student);
  const [isCoreInfoLocked, setIsCoreInfoLocked] = useState(true);
  const [genderSelection, setGenderSelection] = useState<'M' | 'F' | 'Other'>('M');
  const [genderOther, setGenderOther] = useState('');
  const [activeTab, setActiveTab] = useState('Profile'); // State for active tab

  // States for new list inputs
  const [newGradePeriod, setNewGradePeriod] = useState('');
  const [newGradeValue, setNewGradeValue] = useState('');
  
  // States for HPGE Evidence form
  const [newHpgeEvidenceNote, setNewHpgeEvidenceNote] = useState('');
  const [newHpgeEvidenceLink, setNewHpgeEvidenceLink] = useState('');
  const [newHpgeEvidenceFile, setNewHpgeEvidenceFile] = useState<FileUpload | null>(null);

  // States for Work Sample form
  const [newSampleTitle, setNewSampleTitle] = useState('');
  const [newSampleLink, setNewSampleLink] = useState('');
  const [newSampleFileUpload, setNewSampleFileUpload] = useState<FileUpload | null>(null);
  const [newSampleComments, setNewSampleComments] = useState('');

  // States for Differentiation form
  const [newDifferentiationNote, setNewDifferentiationNote] = useState('');
  const [newDifferentiationFile, setNewDifferentiationFile] = useState<FileUpload | null>(null);


  // State for Evidence Log modal
  const [isAddingEvidence, setIsAddingEvidence] = useState(false);
  const [isAddingLiteracyEvidence, setIsAddingLiteracyEvidence] = useState(false);
  const [isAddingNumeracyEvidence, setIsAddingNumeracyEvidence] = useState(false);

  const dialogRef = useRef<HTMLDialogElement>(null);

  const wellbeingLogs = useMemo(() => formData.evidenceLog?.filter(log => log.tags?.includes('Wellbeing')) || [], [formData.evidenceLog]);
  const learningSupportLogs = useMemo(() => formData.evidenceLog?.filter(log => log.tags?.includes('Learning Support')) || [], [formData.evidenceLog]);
  const hpgeLogs = useMemo(() => formData.evidenceLog?.filter(log => log.tags?.includes('HPGE')) || [], [formData.evidenceLog]);

  useEffect(() => {
    dialogRef.current?.showModal();
    const currentGender = student.profile.gender;
    if (currentGender === 'M' || currentGender === 'F') {
      setGenderSelection(currentGender);
      setGenderOther('');
    } else {
      setGenderSelection('Other');
      setGenderOther(currentGender);
    }
  }, [student]);
  
  const handleClose = () => {
    dialogRef.current?.close();
    onClose();
  };

  // Generic handler for nested form data
  const handleDeepChange = (path: string, value: any) => {
    setFormData(prev => {
      const keys = path.split('.');
      let currentLevel = { ...prev } as any;
      let finalLevel: any = currentLevel;
      
      for (let i = 0; i < keys.length - 1; i++) {
        finalLevel = finalLevel[keys[i]] = { ...finalLevel[keys[i]] };
      }
      
      finalLevel[keys[keys.length - 1]] = value;
      return currentLevel;
    });
  };

  const handleNaplanChange = (year: 'year7' | 'year9', field: keyof NaplanDataSet, value: string) => {
    handleDeepChange(`academic.naplan.${year}.${field}`, value);
  };

  const handleSave = () => {
    const finalGender = genderSelection === 'Other' ? genderOther.trim() : genderSelection;
    const updatedStudent: Student = {
      ...formData,
      profile: {
        ...formData.profile,
        gender: finalGender,
      }
    };
    onSave(updatedStudent);
    handleClose();
  };

  // --- List Management Handlers ---

  const handleAddReportGrade = () => {
    if (!newGradePeriod || !newGradeValue) return;
    const newGrade = { id: crypto.randomUUID(), period: newGradePeriod, grade: newGradeValue };
    handleDeepChange('academic.reportGrades', [...formData.academic.reportGrades, newGrade]);
    setNewGradePeriod('');
    setNewGradeValue('');
  };
  
  const handleAddHpgeEvidence = () => {
    if (!newHpgeEvidenceNote.trim()) {
      alert('Please provide a note for the evidence.');
      return;
    }
    const newEvidence = {
      id: `hpge-ev-${crypto.randomUUID()}`,
      note: newHpgeEvidenceNote.trim(),
      fileLink: newHpgeEvidenceLink.trim() ? newHpgeEvidenceLink.trim() : undefined,
      evidenceFile: newHpgeEvidenceFile || undefined,
    };
    handleDeepChange('hpge.identificationEvidence', [...formData.hpge.identificationEvidence, newEvidence]);
    setNewHpgeEvidenceNote('');
    setNewHpgeEvidenceLink('');
    setNewHpgeEvidenceFile(null);
  };

  const handleAddWorkSample = () => {
    if (!newSampleTitle.trim() || (!newSampleLink.trim() && !newSampleFileUpload)) {
      alert('Please provide a title and either a file link or an uploaded file.');
      return;
    }

    const newSample: WorkSample = {
      id: `ws-${crypto.randomUUID()}`,
      title: newSampleTitle.trim(),
      comments: newSampleComments.trim() ? newSampleComments.trim() : undefined,
      fileLink: newSampleLink.trim() ? newSampleLink.trim() : undefined,
      fileUpload: newSampleFileUpload || undefined,
    };

    handleDeepChange('workSamples', [...(formData.workSamples || []), newSample]);
    setNewSampleTitle('');
    setNewSampleLink('');
    setNewSampleFileUpload(null);
    setNewSampleComments('');
  };

  const handleAddDifferentiation = () => {
    if (!newDifferentiationNote.trim()) {
        alert('Please provide a note for the differentiation entry.');
        return;
    }
    const newEntry: DifferentiationEntry = {
        id: `diff-${crypto.randomUUID()}`,
        date: new Date().toISOString(),
        note: newDifferentiationNote.trim(),
        file: newDifferentiationFile || undefined,
    };
    handleDeepChange('academic.learningSupport.differentiation', [...formData.academic.learningSupport.differentiation, newEntry]);
    setNewDifferentiationNote('');
    setNewDifferentiationFile(null);
  };

  const handleSaveLog = (newLog: EvidenceLogEntry) => {
    const updatedLogs = [newLog, ...(formData.evidenceLog || [])];
    handleDeepChange('evidenceLog', updatedLogs);
    setIsAddingEvidence(false);
  };
  
  const handleSaveLiteracyEvidence = (newLog: LiteracyEvidenceEntry) => {
    const updatedLogs = [newLog, ...(formData.academic.learningSupport.literacyEvidence || [])];
    handleDeepChange('academic.learningSupport.literacyEvidence', updatedLogs);
    setIsAddingLiteracyEvidence(false);
  };

  const handleSaveNumeracyEvidence = (newLog: NumeracyEvidenceEntry) => {
    const updatedLogs = [newLog, ...(formData.academic.learningSupport.numeracyEvidence || [])];
    handleDeepChange('academic.learningSupport.numeracyEvidence', updatedLogs);
    setIsAddingNumeracyEvidence(false);
  };
  
  const handleAddNote = (path: 'wellbeing.notes' | 'academic.notes' | 'hpge.notes', content: string) => {
    const keys = path.split('.');
    const newNote: NoteEntry = {
        id: `note-${crypto.randomUUID()}`,
        date: new Date().toISOString(),
        author: data?.teacherProfile?.name || 'Teacher',
        content: content,
    };
    
    let currentNotes: any = formData;
    for(let i = 0; i < keys.length; i++) {
        currentNotes = currentNotes[keys[i]];
    }
    
    handleDeepChange(path, [...(currentNotes || []), newNote]);
  };

  const labelClass = "block text-sm font-medium text-gray-700 mb-1";
  const inputClass = "mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm p-2 bg-white text-gray-900 disabled:bg-gray-100 disabled:cursor-not-allowed";
  const selectClass = inputClass;
  const fieldsetClass = "space-y-4 p-4 border border-gray-200 rounded-md";
  
  const isYear9NaplanApplicable = formData.profile.currentYearGroup >= 9;
  
  const NaplanDisplay: React.FC<{ title: string, band: string }> = ({ title, band }) => (
    <div className="flex justify-between items-center text-sm">
        <span className="text-gray-600 font-medium">{title}:</span>
        <NaplanBandBadge band={band} />
    </div>
);


  const NaplanEditor: React.FC<{ year: 'year7' | 'year9', disabled?: boolean }> = ({ year, disabled = false }) => (
    <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
      {(['reading', 'writing', 'spelling', 'grammar', 'numeracy'] as const).map(field => {
          const bandValue = formData.academic.naplan[year][field];
          const colorClass = getNaplanBandColor(bandValue);
          return (
              <div key={field}>
                  <label className={`block text-sm font-medium capitalize ${disabled ? 'text-gray-400' : 'text-gray-700'}`}>{field}</label>
                  <select 
                      value={bandValue}
                      onChange={(e) => handleNaplanChange(year, field, e.target.value)}
                      className={`${selectClass} ${!disabled ? colorClass : ''} transition-colors`}
                      disabled={disabled}
                  >
                      {NAPLAN_BANDS.map(band => <option key={band} value={band}>{band}</option>)}
                  </select>
              </div>
          );
      })}
    </div>
  );

  return (
    <>
      <dialog ref={dialogRef} onClose={handleClose} className="p-0 rounded-lg shadow-xl w-11/12 max-w-4xl backdrop:bg-black backdrop:opacity-50 border border-gray-300">
        <div className="flex justify-between items-center p-4 bg-gray-100 border-b border-gray-200 sticky top-0 z-10">
          <h2 className="text-xl font-bold text-gray-900">Edit Profile: {student.firstName} {student.lastName}</h2>
          <button onClick={handleClose} className="text-2xl font-light text-gray-600 hover:text-gray-900 leading-none">&times;</button>
        </div>
        
        {/* --- TAB NAVIGATION --- */}
        <div className="border-b border-gray-200 bg-white sticky top-[65px] z-10">
          <nav className="-mb-px flex space-x-4 overflow-x-auto" aria-label="Tabs">
            <TabButton title="Profile" isActive={activeTab === 'Profile'} onClick={() => setActiveTab('Profile')} />
            <TabButton title="Wellbeing & Plans" isActive={activeTab === 'Wellbeing & Plans'} onClick={() => setActiveTab('Wellbeing & Plans')} />
            <TabButton title="Academic" isActive={activeTab === 'Academic'} onClick={() => setActiveTab('Academic')} />
            <TabButton title="Learning Support" isActive={activeTab === 'Learning Support'} onClick={() => setActiveTab('Learning Support')} />
            <TabButton title="HPGE Profile" isActive={activeTab === 'HPGE Profile'} onClick={() => setActiveTab('HPGE Profile')} />
            <TabButton title="Work Samples" isActive={activeTab === 'Work Samples'} onClick={() => setActiveTab('Work Samples')} />
            <TabButton title="Evidence Log" isActive={activeTab === 'Evidence Log'} onClick={() => setActiveTab('Evidence Log')} />
          </nav>
        </div>

        <div className="bg-gray-50 text-gray-900" style={{ maxHeight: '70vh', overflowY: 'auto' }}>
          
          {/* --- TAB 1: PROFILE --- */}
          <TabPanel isActive={activeTab === 'Profile'}>
            <div className="space-y-4">
              <div className="flex justify-end items-center border-b pb-4">
                <button type="button" onClick={() => setIsCoreInfoLocked(prev => !prev)} className="text-sm font-medium text-indigo-600 hover:text-indigo-800">
                  {isCoreInfoLocked ? 'Unlock Core Info' : 'Lock Core Info'}
                </button>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div><label className={labelClass}>First Name</label><input type="text" value={formData.firstName} onChange={(e) => handleDeepChange('firstName', e.target.value)} className={inputClass} disabled={isCoreInfoLocked}/></div>
                <div><label className={labelClass}>Last Name</label><input type="text" value={formData.lastName} onChange={(e) => handleDeepChange('lastName', e.target.value)} className={inputClass} disabled={isCoreInfoLocked}/></div>
                <div><label className={labelClass}>Date of Birth</label><input type="date" value={formData.profile.dob} onChange={(e) => handleDeepChange('profile.dob', e.target.value)} className={inputClass} disabled={isCoreInfoLocked}/></div>
                <div>
                  <label className={labelClass}>Gender</label>
                  <select value={genderSelection} onChange={(e) => setGenderSelection(e.target.value as 'M'|'F'|'Other')} className={selectClass} disabled={isCoreInfoLocked}>
                    <option value="M">M</option>
                    <option value="F">F</option>
                    <option value="Other">Other</option>
                  </select>
                </div>
                {genderSelection === 'Other' && (
                  <div>
                    <label className={labelClass}>Specify Gender</label>
                    <input type="text" value={genderOther} onChange={(e) => setGenderOther(e.target.value)} className={inputClass} disabled={isCoreInfoLocked} />
                  </div>
                )}
                <div><label className={labelClass}>Pronouns</label><input type="text" value={formData.profile.pronouns} onChange={(e) => handleDeepChange('profile.pronouns', e.target.value)} className={inputClass} /></div>
                <div><label className={labelClass}>Current Year Group</label><input type="number" value={formData.profile.currentYearGroup} onChange={(e) => handleDeepChange('profile.currentYearGroup', e.target.valueAsNumber)} className={inputClass} /></div>
                <div>
                  <label className={labelClass}>ATSI Status</label>
                  <select value={formData.profile.atsiStatus} onChange={(e) => handleDeepChange('profile.atsiStatus', e.target.value)} className={selectClass}>
                    {ATSI_STATUSES.map(s => <option key={s} value={s}>{s}</option>)}
                  </select>
                </div>
                <div>
                  <label className={labelClass}>Student Status</label>
                  <select value={formData.profile.status} onChange={(e) => handleDeepChange('profile.status', e.target.value)} className={selectClass}>
                    <option value="Active">Active</option>
                    <option value="Archived">Archived</option>
                  </select>
                </div>
              </div>
            </div>
          </TabPanel>
          
          {/* --- TAB 2: WELLBEING & PLANS --- */}
          <TabPanel isActive={activeTab === 'Wellbeing & Plans'}>
            <div className="space-y-6">
              <fieldset className={fieldsetClass}>
                <legend className="text-base font-semibold text-gray-700 px-2">Official Plans</legend>
                <div className="flex items-center">
                  <input type="checkbox" id="hasBehaviourPlan" checked={formData.wellbeing.hasBehaviourPlan} onChange={(e) => handleDeepChange('wellbeing.hasBehaviourPlan', e.target.checked)} className="h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500" />
                  <label htmlFor="hasBehaviourPlan" className="ml-2 text-sm font-medium text-gray-900">Has Behaviour Support Plan</label>
                </div>
                {formData.wellbeing.hasBehaviourPlan && (
                  <div>
                    <label className={labelClass}>Behaviour Plan Link</label>
                    <input type="text" value={formData.wellbeing.behaviourPlanLink} onChange={(e) => handleDeepChange('wellbeing.behaviourPlanLink', e.target.value)} placeholder="Paste link to SharePoint/Sentral plan..." className={inputClass} />
                  </div>
                )}
                <div className="flex items-center">
                  <input type="checkbox" id="hasLearningPlan" checked={formData.wellbeing.hasLearningPlan} onChange={(e) => handleDeepChange('wellbeing.hasLearningPlan', e.target.checked)} className="h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500" />
                  <label htmlFor="hasLearningPlan" className="ml-2 text-sm font-medium text-gray-900">Has Individual Learning Plan</label>
                </div>
                {formData.wellbeing.hasLearningPlan && (
                  <div>
                    <label className={labelClass}>Learning Plan Link</label>
                    <input type="text" value={formData.wellbeing.learningPlanLink} onChange={(e) => handleDeepChange('wellbeing.learningPlanLink', e.target.value)} placeholder="Paste link to SharePoint/Sentral plan..." className={inputClass} />
                  </div>
                )}
              </fieldset>

              <fieldset className={fieldsetClass}>
                <legend className="text-base font-semibold text-gray-700 px-2">At-a-Glance Profile</legend>
                <div>
                  <label className={labelClass}>Wellbeing Strengths & Positives</label>
                  <TagInput value={formData.wellbeing.strengths} onChange={(tags) => handleDeepChange('wellbeing.strengths', tags)} placeholder="e.g., Responds well to praise..." />
                  <p className="text-xs text-gray-500 mt-1">Type a value and press Enter to add it to the list.</p>
                </div>
                <div>
                  <label className={labelClass}>Known Triggers & Agitators</label>
                  <TagInput value={formData.wellbeing.triggers} onChange={(tags) => handleDeepChange('wellbeing.triggers', tags)} placeholder="e.g., Loud noises, Unstructured time..." />
                   <p className="text-xs text-gray-500 mt-1">Type a value and press Enter to add it to the list.</p>
                </div>
                <div>
                  <label className={labelClass}>Proactive Strategies (What to DO)</label>
                  <TagInput value={formData.wellbeing.proactiveStrategies} onChange={(tags) => handleDeepChange('wellbeing.proactiveStrategies', tags)} placeholder="e.g., Give 5-min warning..." />
                   <p className="text-xs text-gray-500 mt-1">Type a value and press Enter to add it to the list.</p>
                </div>
                <div>
                  <label className={labelClass}>De-escalation Strategies (When an issue occurs)</label>
                  <TagInput value={formData.wellbeing.deescalationStrategies} onChange={(tags) => handleDeepChange('wellbeing.deescalationStrategies', tags)} placeholder="e.g., Offer quiet space, Speak calmly..." />
                   <p className="text-xs text-gray-500 mt-1">Type a value and press Enter to add it to the list.</p>
                </div>
              </fieldset>

              <fieldset className={fieldsetClass}>
                <legend className="text-base font-semibold text-gray-700 px-2">Context & Medical</legend>
                <div>
                  <label className={labelClass}>Medical Needs</label>
                  <TagInput value={formData.wellbeing.medicalNeeds} onChange={(tags) => handleDeepChange('wellbeing.medicalNeeds', tags)} placeholder="e.g., Asthma, Anaphylaxis (Peanuts)..." />
                  <p className="text-xs text-gray-500 mt-1">Type a value and press Enter to add it to the list.</p>
                </div>
                <div>
                  <label className={labelClass}>Attendance (%)</label>
                  <input type="number" value={formData.wellbeing.attendancePercent} onChange={(e) => handleDeepChange('wellbeing.attendancePercent', e.target.valueAsNumber || 0)} className={inputClass} />
                </div>
                <div>
                  <label className={labelClass}>Sentral Behaviour Summary</label>
                  <textarea value={formData.wellbeing.sentralBehaviourSummary} onChange={(e) => handleDeepChange('wellbeing.sentralBehaviourSummary', e.target.value)} rows={4} placeholder="Summarise historical behaviour from Sentral here. e.g., '5 minor incidents in T1...'" className={inputClass} />
                </div>
              </fieldset>
              <NotesSection title="Wellbeing Notes" notes={formData.wellbeing.notes || []} onAddNote={(content) => handleAddNote('wellbeing.notes', content)} />
              <EvidenceLogList logs={wellbeingLogs} title="Related Wellbeing Evidence" />
            </div>
          </TabPanel>

          {/* --- TAB 3: ACADEMIC --- */}
          <TabPanel isActive={activeTab === 'Academic'}>
            <div className="space-y-6">
              <div className="p-4 border border-gray-200 rounded-lg bg-white shadow-sm">
                <h4 className="font-semibold text-gray-800 border-b pb-2 mb-4">NAPLAN Results</h4>
                <div className="space-y-4">
                  <div>
                    <h5 className="font-medium text-gray-700 mb-2">Year 7</h5>
                    <NaplanEditor year="year7" />
                  </div>
                  <div>
                    <h5 className={`font-medium mb-2 ${isYear9NaplanApplicable ? 'text-gray-700' : 'text-gray-400'}`}>Year 9</h5>
                    <NaplanEditor year="year9" disabled={!isYear9NaplanApplicable} />
                  </div>
                </div>
              </div>
              <div className="p-4 border border-gray-200 rounded-lg bg-white shadow-sm">
                <h4 className="font-semibold text-gray-800 border-b pb-2 mb-4">Report Grades</h4>
                <ul className="space-y-2 mb-4">
                  {formData.academic.reportGrades.map((grade) => (
                    <li key={grade.id} className="text-sm"><strong>{grade.period}:</strong> {grade.grade}</li>
                  ))}
                </ul>
                <div className="flex gap-2">
                  <input type="text" value={newGradePeriod} onChange={(e) => setNewGradePeriod(e.target.value)} placeholder="Period (e.g., Y10S1)" className={inputClass + " w-1/2"} />
                  <input type="text" value={newGradeValue} onChange={(e) => setNewGradeValue(e.target.value)} placeholder="Grade" className={inputClass + " w-1/4"} />
                  <button type="button" onClick={handleAddReportGrade} className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 font-semibold transition-colors">Add</button>
                </div>
              </div>
              <NotesSection title="Academic Notes" notes={formData.academic.notes || []} onAddNote={(content) => handleAddNote('academic.notes', content)} />
            </div>
          </TabPanel>

          {/* --- TAB 4: LEARNING SUPPORT --- */}
          <TabPanel isActive={activeTab === 'Learning Support'}>
             <div className="space-y-6">
                 <fieldset className={fieldsetClass}>
                    <legend className="text-base font-semibold text-gray-700 px-2">Numeracy</legend>
                    <div className="p-2 border rounded-md bg-white space-y-2">
                        <NaplanDisplay title="Year 7 NAPLAN" band={formData.academic.naplan.year7.numeracy} />
                        {isYear9NaplanApplicable && <NaplanDisplay title="Year 9 NAPLAN" band={formData.academic.naplan.year9.numeracy} />}
                    </div>
                     <div className="flex justify-end mt-4">
                        <button onClick={() => setIsAddingNumeracyEvidence(true)} className="bg-blue-600 text-white px-3 py-1 rounded-md hover:bg-blue-700 text-sm font-semibold">
                            + Add Numeracy Evidence
                        </button>
                    </div>
                     <div className="space-y-3 max-h-64 overflow-y-auto pr-2">
                        {formData.academic.learningSupport.numeracyEvidence?.sort((a,b) => new Date(b.date).getTime() - new Date(a.date).getTime()).map(entry => (
                            <div key={entry.id} className="bg-white border p-3 rounded-lg shadow-sm">
                                <div className="flex justify-between items-start">
                                    <p className="text-xs text-gray-500">{new Date(entry.date).toLocaleDateString()}</p>
                                    {entry.file && <button onClick={() => storageService.triggerDownload(entry.file!)} className="text-xs text-blue-600 hover:underline">Download Evidence</button>}
                                </div>
                                {entry.note && <p className="text-sm mt-1 whitespace-pre-wrap">{entry.note}</p>}
                                <div className="mt-2 pt-2 border-t flex flex-wrap gap-2">
                                    {entry.numeracyTags.map(tag => (
                                        <span key={tag} className="text-xs bg-indigo-100 text-indigo-800 px-2 py-0.5 rounded-full">{tag}</span>
                                    ))}
                                    {entry.newmansTags.map(tag => {
                                        const tagInfo = NEWMANS_ANALYSIS_TAGS.find(t => t.name === tag);
                                        return (
                                            <span key={tag} className={`text-xs ${tagInfo?.color || 'bg-gray-200'} ${tagInfo?.textColor || 'text-gray-800'} px-2 py-0.5 rounded-full`}>{tag}</span>
                                        )
                                    })}
                                </div>
                            </div>
                        ))}
                    </div>
                </fieldset>
                
                <fieldset className={fieldsetClass}>
                    <legend className="text-base font-semibold text-gray-700 px-2">Literacy</legend>
                    <div className="p-2 border rounded-md bg-white grid grid-cols-2 gap-2">
                        <NaplanDisplay title="Reading (Y7)" band={formData.academic.naplan.year7.reading} />
                        {isYear9NaplanApplicable && <NaplanDisplay title="Reading (Y9)" band={formData.academic.naplan.year9.reading} />}
                         <NaplanDisplay title="Writing (Y7)" band={formData.academic.naplan.year7.writing} />
                        {isYear9NaplanApplicable && <NaplanDisplay title="Writing (Y9)" band={formData.academic.naplan.year9.writing} />}
                         <NaplanDisplay title="Spelling (Y7)" band={formData.academic.naplan.year7.spelling} />
                        {isYear9NaplanApplicable && <NaplanDisplay title="Spelling (Y9)" band={formData.academic.naplan.year9.spelling} />}
                         <NaplanDisplay title="Grammar (Y7)" band={formData.academic.naplan.year7.grammar} />
                        {isYear9NaplanApplicable && <NaplanDisplay title="Grammar (Y9)" band={formData.academic.naplan.year9.grammar} />}
                    </div>
                     <div className="flex justify-end mt-4">
                        <button onClick={() => setIsAddingLiteracyEvidence(true)} className="bg-blue-600 text-white px-3 py-1 rounded-md hover:bg-blue-700 text-sm font-semibold">
                            + Add Literacy Evidence
                        </button>
                    </div>
                    <div className="space-y-3 max-h-64 overflow-y-auto pr-2">
                        {formData.academic.learningSupport.literacyEvidence?.sort((a,b) => new Date(b.date).getTime() - new Date(a.date).getTime()).map(entry => (
                            <div key={entry.id} className="bg-white border p-3 rounded-lg shadow-sm">
                                <div className="flex justify-between items-start">
                                    <p className="text-xs text-gray-500">{new Date(entry.date).toLocaleDateString()}</p>
                                    {entry.file && <button onClick={() => storageService.triggerDownload(entry.file!)} className="text-xs text-blue-600 hover:underline">Download Evidence</button>}
                                </div>
                                {entry.note && <p className="text-sm mt-1 whitespace-pre-wrap">{entry.note}</p>}
                                <div className="mt-2 pt-2 border-t flex flex-wrap gap-2">
                                    {entry.tags.map(tag => (
                                        <span key={tag} className="text-xs bg-gray-200 text-gray-800 px-2 py-0.5 rounded-full">{tag}</span>
                                    ))}
                                </div>
                            </div>
                        ))}
                    </div>
                </fieldset>

                <fieldset className={fieldsetClass}>
                    <legend className="text-base font-semibold text-gray-700 px-2">Status & Differentiation</legend>
                     <div className="flex items-center">
                        <input type="checkbox" id="isSwan" checked={formData.academic.learningSupport?.isSwan} onChange={(e) => handleDeepChange('academic.learningSupport.isSwan', e.target.checked)} className="h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500" />
                        <label htmlFor="isSwan" className="ml-2 text-sm font-medium text-gray-900">SWAN (Student with additional needs)</label>
                    </div>
                    <div className={!formData.academic.learningSupport?.isSwan ? 'opacity-50 pointer-events-none' : ''}>
                        <div className="space-y-3 max-h-64 overflow-y-auto pr-2">
                            {formData.academic.learningSupport?.differentiation.map(item => (
                                <div key={item.id} className="bg-white border p-2 rounded">
                                    <p className="text-xs text-gray-500">{new Date(item.date).toLocaleDateString()}</p>
                                    <p className="text-sm mt-1">{item.note}</p>
                                    {item.file && <button onClick={() => storageService.triggerDownload(item.file!)} className="text-xs text-blue-600 hover:underline">Download Evidence</button>}
                                </div>
                            ))}
                        </div>
                        <div className="border-t pt-4">
                             <h5 className="text-sm font-semibold text-gray-700 mb-2">Log New Differentiation</h5>
                             <textarea value={newDifferentiationNote} onChange={e => setNewDifferentiationNote(e.target.value)} rows={3} placeholder="Note of differentiation provided..." className={inputClass} />
                             <div className="mt-2">
                                <InlineFileUpload file={newDifferentiationFile} onUpload={setNewDifferentiationFile} onRemove={() => setNewDifferentiationFile(null)} />
                             </div>
                             <div className="text-right mt-2">
                                <button onClick={handleAddDifferentiation} className="text-sm bg-blue-600 text-white px-3 py-1 rounded hover:bg-blue-700">Add Entry</button>
                             </div>
                        </div>
                    </div>
                </fieldset>
                
                <fieldset className={fieldsetClass}>
                    <legend className="text-base font-semibold text-gray-700 px-2">Learning Support Centre</legend>
                    <div className="flex items-center">
                        <input type="checkbox" id="requiresBooking" checked={formData.academic.learningSupport?.requiresLearningCentreBooking} onChange={(e) => handleDeepChange('academic.learningSupport.requiresLearningCentreBooking', e.target.checked)} className="h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500" />
                        <label htmlFor="requiresBooking" className="ml-2 text-sm font-medium text-gray-900">Student requires booking into learning centre for assessments</label>
                    </div>
                </fieldset>

                <EvidenceLogList logs={learningSupportLogs} title="Related General Learning Support Evidence" />
             </div>
          </TabPanel>

          {/* --- TAB 5: HPGE PROFILE --- */}
          <TabPanel isActive={activeTab === 'HPGE Profile'}>
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className={labelClass}>HPGE Status</label>
                  <select value={formData.hpge.status} onChange={(e) => handleDeepChange('hpge.status', e.target.value)} className={selectClass}>
                    {HPGE_STATUSES.map(s => <option key={s} value={s}>{s}</option>)}
                  </select>
                </div>
                <div>
                  <label className={labelClass}>HPGE Domain</label>
                  <select value={formData.hpge.domain} onChange={(e) => handleDeepChange('hpge.domain', e.target.value)} className={selectClass}>
                    {HPGE_DOMAINS.map(d => <option key={d} value={d}>{d}</option>)}
                  </select>
                </div>
              </div>
              <div>
                <label className={labelClass}>Talent Development Plan</label>
                <textarea value={formData.hpge.talentDevelopmentPlan} onChange={(e) => handleDeepChange('hpge.talentDevelopmentPlan', e.target.value)} rows={4} className={inputClass} />
              </div>
              <div>
                <h4 className="font-semibold text-gray-800 mb-2">Identification Evidence</h4>
                <ul className="space-y-2 mb-4">
                  {formData.hpge.identificationEvidence.map((ev) => (
                    <li key={ev.id} className="text-sm bg-gray-100 p-2 border rounded">
                      <p className="text-gray-800">{ev.note}</p>
                      {(ev.fileLink || ev.evidenceFile) && (
                          <div className="flex items-center gap-4 mt-1">
                              {ev.fileLink && <a href={ev.fileLink} target="_blank" rel="noopener noreferrer" className="text-xs text-indigo-600 hover:underline font-semibold">View Link</a>}
                              {ev.evidenceFile && <button onClick={() => storageService.triggerDownload(ev.evidenceFile!)} className="text-xs text-indigo-600 hover:underline font-semibold">Download File</button>}
                          </div>
                      )}
                    </li>
                  ))}
                </ul>
                <div className="p-4 bg-gray-100 border rounded-lg space-y-3">
                    <h5 className="text-sm font-semibold text-gray-700">Add New Evidence</h5>
                    <div>
                        <label className={labelClass}>Note</label>
                        <textarea value={newHpgeEvidenceNote} onChange={(e) => setNewHpgeEvidenceNote(e.target.value)} rows={3} placeholder="Add new evidence note..." className={inputClass} />
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-start">
                        <div>
                            <label className={labelClass}>Link (optional)</label>
                            <input type="url" value={newHpgeEvidenceLink} onChange={(e) => setNewHpgeEvidenceLink(e.target.value)} placeholder="https://..." className={inputClass} />
                        </div>
                        <div>
                            <label className={labelClass}>File (optional)</label>
                            <InlineFileUpload file={newHpgeEvidenceFile} onUpload={setNewHpgeEvidenceFile} onRemove={() => setNewHpgeEvidenceFile(null)} />
                        </div>
                    </div>
                     <div className="flex justify-end">
                        <button type="button" onClick={handleAddHpgeEvidence} className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 font-semibold transition-colors text-sm">Add Evidence</button>
                    </div>
                </div>
              </div>
              <NotesSection title="HPGE Notes" notes={formData.hpge.notes || []} onAddNote={(content) => handleAddNote('hpge.notes', content)} />
              <EvidenceLogList logs={hpgeLogs} title="Related HPGE Evidence" />
            </div>
          </TabPanel>
          
          {/* --- TAB 6: WORK SAMPLES --- */}
          <TabPanel isActive={activeTab === 'Work Samples'}>
            <div className="space-y-6">
                <div>
                    <h3 className="font-semibold text-lg text-gray-800 mb-2">Add New Work Sample</h3>
                    <div className="p-4 bg-gray-100 border rounded-lg space-y-4">
                        <div>
                          <label className={labelClass}>Title</label>
                          <input type="text" value={newSampleTitle} onChange={e => setNewSampleTitle(e.target.value)} className={inputClass} placeholder="e.g., Formative Task 1" required />
                        </div>
                         <div>
                            <label className={labelClass}>Teacher Comments (optional)</label>
                            <textarea value={newSampleComments} onChange={e => setNewSampleComments(e.target.value)} className={inputClass} rows={3} placeholder="e.g., Student demonstrated strong understanding of..."></textarea>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-start">
                             <div>
                                <label className={labelClass}>File Link (optional)</label>
                                <input type="url" value={newSampleLink} onChange={e => setNewSampleLink(e.target.value)} className={inputClass} placeholder="https://..." />
                            </div>
                            <div>
                                <label className={labelClass}>Or Upload File (optional)</label>
                                <InlineFileUpload
                                    file={newSampleFileUpload}
                                    onUpload={setNewSampleFileUpload}
                                    onRemove={() => setNewSampleFileUpload(null)}
                                />
                            </div>
                        </div>
                      <div className="flex justify-end">
                        <button type="button" onClick={handleAddWorkSample} className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 font-semibold text-sm">
                          + Add Sample
                        </button>
                      </div>
                    </div>
                </div>
                <div>
                    <h3 className="font-semibold text-lg text-gray-800 mb-2">Logged Work Samples</h3>
                    <div className="border rounded-lg overflow-hidden">
                      <ul className="divide-y divide-gray-200">
                        {formData.workSamples && formData.workSamples.length > 0 ? (
                          formData.workSamples.map(sample => (
                            <li key={sample.id} className="p-3 flex flex-col items-start hover:bg-gray-50">
                                <div className="w-full flex justify-between items-center">
                                    <span className="font-medium text-gray-800 truncate pr-4">{sample.title}</span>
                                    <div className="flex items-center gap-4 flex-shrink-0">
                                        {sample.fileLink && (
                                            <a href={sample.fileLink} target="_blank" rel="noopener noreferrer" className="text-sm text-indigo-600 hover:underline font-semibold">
                                                View Link
                                            </a>
                                        )}
                                        {sample.fileUpload && (
                                            <>
                                                <button onClick={() => storageService.triggerDownload(sample.fileUpload!)} className="text-sm text-indigo-600 hover:underline font-semibold">
                                                    Download File
                                                </button>
                                            </>
                                        )}
                                    </div>
                                </div>
                                {sample.comments && (
                                    <p className="mt-2 text-sm text-gray-700 bg-gray-50 p-2 rounded w-full border-l-4 border-gray-200 whitespace-pre-wrap">{sample.comments}</p>
                                )}
                            </li>
                          ))
                        ) : (
                          <li className="p-4 text-center text-gray-500">No work samples have been logged for this student.</li>
                        )}
                      </ul>
                    </div>
                </div>
            </div>
          </TabPanel>

          {/* --- TAB 7: EVIDENCE LOG --- */}
          <TabPanel isActive={activeTab === 'Evidence Log'}>
            <div className="space-y-4">
                <div className="flex justify-between items-center">
                    <h3 className="font-semibold text-lg text-gray-800">Evidence Log</h3>
                    <button onClick={() => setIsAddingEvidence(true)} className="bg-blue-600 text-white px-3 py-1 rounded-md hover:bg-blue-700 text-sm font-semibold">
                        + Add Entry
                    </button>
                </div>
                <div className="space-y-4">
                    {formData.evidenceLog.length > 0 ? (
                        formData.evidenceLog.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()).map(log => (
                            <div key={log.logId} className="bg-white border border-gray-200 p-3 rounded-lg shadow-sm">
                                <div className="flex justify-between items-start">
                                    <div>
                                        <p className="font-semibold text-gray-800">{log.tags?.includes('NCCD') && log.adjustment_level ? log.adjustment_level : 'General Observation'}</p>
                                        <p className="text-xs text-gray-500">
                                            {new Date(log.date).toLocaleDateString('en-AU', { year: 'numeric', month: 'long', day: 'numeric' })} by {log.teacher}
                                        </p>
                                    </div>
                                    <div className="flex flex-col items-end text-sm gap-1">
                                        {log.evidenceLink && <a href={log.evidenceLink} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline font-semibold">View Link</a>}
                                        {log.evidenceFile && <button onClick={() => storageService.triggerDownload(log.evidenceFile!)} className="text-blue-600 hover:underline font-semibold">Download File</button>}
                                    </div>
                                </div>
                                <p className="mt-2 text-sm text-gray-700 whitespace-pre-wrap">{log.note}</p>
                                {log.adjustments_used && log.adjustments_used.length > 0 && (
                                    <div className="mt-2 pt-2 border-t">
                                        <p className="text-xs font-semibold text-gray-600">Adjustments Used:</p>
                                        <ul className="list-disc list-inside text-xs text-gray-600">
                                            {log.adjustments_used.map(adj => <li key={adj}>{adj}</li>)}
                                        </ul>
                                    </div>
                                )}
                                {log.tags && log.tags.length > 0 && (
                                    <div className="mt-2 pt-2 border-t flex items-center gap-2">
                                        <p className="text-xs font-semibold text-gray-600">Tags:</p>
                                        <div className="flex flex-wrap gap-1">
                                            {log.tags.map(tag => (
                                                <span key={tag} className="text-xs bg-gray-200 text-gray-800 px-2 py-0.5 rounded-full">{tag}</span>
                                            ))}
                                        </div>
                                    </div>
                                )}
                            </div>
                        ))
                    ) : (
                        <p className="text-sm text-gray-500 text-center py-4">No evidence logs recorded for this student.</p>
                    )}
                </div>
            </div>
          </TabPanel>

        </div>

        <div className="p-4 bg-gray-100 border-t border-gray-200 flex justify-end gap-2 sticky bottom-0">
          <button type="button" onClick={handleClose} className="px-4 py-2 bg-gray-300 text-gray-800 rounded-md hover:bg-gray-400 font-semibold transition-colors">Cancel</button>
          <button onClick={handleSave} className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 font-semibold transition-colors">Save Changes</button>
        </div>
      </dialog>
      {isAddingEvidence && <AddEvidenceModal onClose={() => setIsAddingEvidence(false)} onSaveLog={handleSaveLog} />}
      {isAddingLiteracyEvidence && <AddLiteracyEvidenceModal onClose={() => setIsAddingLiteracyEvidence(false)} onSave={handleSaveLiteracyEvidence} />}
      {isAddingNumeracyEvidence && <AddNumeracyEvidenceModal onClose={() => setIsAddingNumeracyEvidence(false)} onSave={handleSaveNumeracyEvidence} />}
    </>
  );
};

export default EditStudentModal;
