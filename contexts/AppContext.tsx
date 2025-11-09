import React, { createContext, useContext, useState, useEffect, useMemo } from 'react';
import type { AppData, MonitoringDoc, Term, Student, NaplanDataSet, EvidenceLogEntry, NumeracyEvidenceEntry, NoteEntry, ClassData, Teacher } from '../types';
import { storageService } from '../services/storageService';
import { BLANK_MONITORING_DOC_SKELETON } from '../constants';

type Theme = 'light' | 'dark';

interface AppContextType {
  data: AppData | null;
  saveData: (data: AppData) => void;
  theme: Theme;
  toggleTheme: () => void;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

// New async migration function for files
const migrateFilesToDb = async (data: any): Promise<AppData> => {
    const dataClone = JSON.parse(JSON.stringify(data));

    const migrateNode = async (node: any) => {
        if (Array.isArray(node)) {
            for (let i = 0; i < node.length; i++) {
                node[i] = await migrateNode(node[i]);
            }
        } else if (node && typeof node === 'object') {
            // Check if it's an old FileUpload object
            if (node.hasOwnProperty('name') && node.hasOwnProperty('content') && !node.hasOwnProperty('id')) {
                const id = `file-${crypto.randomUUID()}`;
                if (typeof node.content === 'string') {
                    await storageService.saveFileContent(id, node.content);
                }
                // Return the new, dehydrated format
                return { id, name: node.name };
            }
            // Recurse
            for (const key in node) {
                if (node.hasOwnProperty(key)) {
                    node[key] = await migrateNode(node[key]);
                }
            }
        }
        return node;
    };
    
    return await migrateNode(dataClone) as AppData;
};


const migrateMonitoringDocs = (docs: any[]): [any[], boolean] => {
    let needsUpdate = false;
    const migratedDocs = docs.map((doc: any) => {
      let docNeedsUpdate = false;
      if (!doc.scannedWorkSamples || !('task1' in doc.scannedWorkSamples)) { docNeedsUpdate = true; }
      const communicationFields: Array<'studentsCausingConcern' | 'illnessMisadventure' | 'malpractice'> = ['studentsCausingConcern', 'illnessMisadventure', 'malpractice'];
      for (const field of communicationFields) { if (doc[field] && doc[field]['1'] && !Array.isArray(doc[field]['1'])) { docNeedsUpdate = true; break; } }
      const assessmentFields: Array<'assessmentTask1' | 'assessmentTask2' | 'assessmentTask3' | 'prePostDiagnostic'> = ['assessmentTask1', 'assessmentTask2', 'assessmentTask3', 'prePostDiagnostic'];
      for (const field of assessmentFields) { if (doc[field] && !Array.isArray(doc[field])) { docNeedsUpdate = true; break; } }
      if (!docNeedsUpdate) { return doc; }
      needsUpdate = true;
      const newDoc: MonitoringDoc = { ...BLANK_MONITORING_DOC_SKELETON, id: doc.id, classId: doc.classId, year: doc.year, };
      newDoc.certifySyllabus = doc.certifySyllabus?.['1'] ?? doc.certifySyllabus ?? false;
      newDoc.scopeAndSequence = doc.scopeAndSequence?.['1'] ?? doc.scopeAndSequence ?? null;
      newDoc.assessmentSchedule = doc.assessmentSchedule?.['1'] ?? doc.assessmentSchedule ?? null;
      assessmentFields.forEach(field => { const oldVal = doc[field]; if (oldVal) { newDoc[field] = Array.isArray(oldVal) ? oldVal : [oldVal]; } else { newDoc[field] = []; } });
      if (doc.semesterReports) newDoc.semesterReports = doc.semesterReports;
      if (doc.marksAndRanks) newDoc.marksAndRanks = doc.marksAndRanks;
      if (doc.teacherSignOff) newDoc.teacherSignOff = doc.teacherSignOff;
      if (doc.headTeacherSignOff) newDoc.headTeacherSignOff = doc.headTeacherSignOff;
      if (doc.teachingPrograms && Array.isArray(doc.teachingPrograms['1'])) newDoc.teachingPrograms = doc.teachingPrograms;
      if (doc.specificLearningNeeds && typeof doc.specificLearningNeeds['1'] === 'boolean') newDoc.specificLearningNeeds = doc.specificLearningNeeds;
      communicationFields.forEach(field => {
          if (doc[field]) {
              const term1Value = doc[field]['1'];
              if (term1Value && !Array.isArray(term1Value)) { const newTermBasedValue = { '1': [], '2': [], '3': [], '4': [] } as any; for (const term of ['1', '2', '3', '4'] as Term[]) { const oldFile = doc[field][term]; if (oldFile) { if (field === 'studentsCausingConcern') { newTermBasedValue[term] = [{ id: `concern-${crypto.randomUUID()}`, file: oldFile, studentIds: [] }]; } else { newTermBasedValue[term] = [oldFile]; } } } newDoc[field] = newTermBasedValue;
              } else if (term1Value && Array.isArray(term1Value)) { newDoc[field] = doc[field]; }
          }
      });
      return newDoc;
    });
    return [migratedDocs, needsUpdate];
};

const migrateStudents = (students: any[]): [any[], boolean] => {
    let needsUpdate = false;
    const migratedStudents = students.map((student: any) => {
      let studentNeedsUpdate = false; const newStudent = { ...student };
      if (!newStudent.academic?.naplan?.year7 || !newStudent.academic?.naplan?.year9) { studentNeedsUpdate = true; if (!newStudent.academic) newStudent.academic = {}; if (!newStudent.academic.naplan) newStudent.academic.naplan = {}; const blankDataSet: NaplanDataSet = { reading: 'Not Assessed', writing: 'Not Assessed', spelling: 'Not Assessed', grammar: 'Not Assessed', numeracy: 'Not Assessed' }; if (newStudent.academic.naplanReading) { newStudent.academic.naplan.year7 = { reading: newStudent.academic.naplanReading, writing: newStudent.academic.naplanWriting, spelling: newStudent.academic.naplanSpelling, grammar: newStudent.academic.naplanGrammar, numeracy: newStudent.academic.naplanNumeracy }; delete newStudent.academic.naplanReading; delete newStudent.academic.naplanWriting; delete newStudent.academic.naplanSpelling; delete newStudent.academic.naplanGrammar; delete newStudent.academic.naplanNumeracy; } else if (!newStudent.academic.naplan.year7) { newStudent.academic.naplan.year7 = { ...blankDataSet }; } if (!newStudent.academic.naplan.year9) { newStudent.academic.naplan.year9 = { ...blankDataSet }; } }
      if (newStudent.evidenceLog && newStudent.evidenceLog.length > 0 && typeof newStudent.evidenceLog[0].tags === 'undefined') { studentNeedsUpdate = true; newStudent.evidenceLog = newStudent.evidenceLog.map((log: EvidenceLogEntry) => ({ ...log, tags: log.adjustment_level ? ['NCCD'] : [] })); }
      if (newStudent.academic?.learningSupportAdjustments || newStudent.hpge?.extendAdjustments || newStudent.cultural) { studentNeedsUpdate = true; delete newStudent.academic?.learningSupportAdjustments; delete newStudent.hpge?.extendAdjustments; delete newStudent.cultural; }
      if (!newStudent.wellbeing?.notes) { studentNeedsUpdate = true; if (!newStudent.wellbeing) newStudent.wellbeing = {}; newStudent.wellbeing.notes = []; }
      if (!newStudent.academic?.notes) { studentNeedsUpdate = true; if (!newStudent.academic) newStudent.academic = {}; newStudent.academic.notes = []; }
      if (!newStudent.hpge?.notes) { studentNeedsUpdate = true; if (!newStudent.hpge) newStudent.hpge = {}; newStudent.hpge.notes = []; }
      if (!newStudent.academic?.learningSupport) { studentNeedsUpdate = true; if (!newStudent.academic) newStudent.academic = {}; newStudent.academic.learningSupport = { isSwan: false, requiresLearningCentreBooking: false, differentiation: [], numeracyEvidence: [], literacyEvidence: [] }; }
      if (newStudent.academic?.learningSupport) { if (newStudent.academic.learningSupport.hasOwnProperty('numeracyNotes') || (newStudent.academic.learningSupport.hasOwnProperty('numeracyEvidence') && !Array.isArray(newStudent.academic.learningSupport.numeracyEvidence))) { studentNeedsUpdate = true; const newNumeracyEvidence: NumeracyEvidenceEntry[] = []; if (Array.isArray(newStudent.academic.learningSupport.numeracyNotes)) { (newStudent.academic.learningSupport.numeracyNotes as NoteEntry[]).forEach((note: NoteEntry) => { newNumeracyEvidence.push({ id: `num-ev-${crypto.randomUUID()}`, date: note.date, note: note.content, numeracyTags: [], newmansTags: [] }); }); } const oldEvidenceFile = newStudent.academic.learningSupport.numeracyEvidence; if (oldEvidenceFile && !Array.isArray(oldEvidenceFile)) { newNumeracyEvidence.push({ id: `num-ev-${crypto.randomUUID()}`, date: new Date().toISOString(), file: oldEvidenceFile, numeracyTags: [], newmansTags: [] }); } newStudent.academic.learningSupport.numeracyEvidence = newNumeracyEvidence; delete newStudent.academic.learningSupport.numeracyNotes; } if (typeof newStudent.academic.learningSupport.numeracyEvidence === 'undefined') { studentNeedsUpdate = true; newStudent.academic.learningSupport.numeracyEvidence = []; } if (typeof newStudent.academic.learningSupport.literacyEvidence === 'undefined') { studentNeedsUpdate = true; newStudent.academic.learningSupport.literacyEvidence = []; } }
      if (studentNeedsUpdate) { needsUpdate = true; } return newStudent;
    });
    return [migratedStudents, needsUpdate];
};

const migrateClasses = (classes: any[]): [any[], boolean] => {
    let needsUpdate = false;
    const migratedClasses = classes.map((c: ClassData) => { if (!c.hasOwnProperty('status')) { needsUpdate = true; return { ...c, status: 'Active' as 'Active' }; } return c; });
    return [migratedClasses, needsUpdate];
};

const migrateTeacherProfile = (data: any): [any, boolean] => {
    let needsUpdate = false;
    if (data.teachers && !data.hasOwnProperty('teacherProfile')) {
        needsUpdate = true;
        const firstTeacher = data.teachers[0];
        data.teacherProfile = firstTeacher ? { name: firstTeacher.name, email: firstTeacher.email } : null;
        delete data.teachers;
    }
    return [data, needsUpdate];
};

const migrateData = (data: any): [AppData, boolean] => {
    let overallNeedsUpdate = false;
    let migratedData = { ...data };

    if (migratedData.monitoringDocs) {
        const [newDocs, needsUpdate] = migrateMonitoringDocs(migratedData.monitoringDocs);
        migratedData.monitoringDocs = newDocs;
        if (needsUpdate) overallNeedsUpdate = true;
    }
    if (migratedData.students) {
        const [newStudents, needsUpdate] = migrateStudents(migratedData.students);
        migratedData.students = newStudents;
        if (needsUpdate) overallNeedsUpdate = true;
    }
    if (migratedData.classes) {
        const [newClasses, needsUpdate] = migrateClasses(migratedData.classes);
        migratedData.classes = newClasses;
        if (needsUpdate) overallNeedsUpdate = true;
    }

    const [dataWithProfile, profileNeedsUpdate] = migrateTeacherProfile(migratedData);
    migratedData = dataWithProfile;
    if (profileNeedsUpdate) overallNeedsUpdate = true;

    if (overallNeedsUpdate) {
        console.log("Structural data migration performed.");
    }

    return [migratedData as AppData, overallNeedsUpdate];
};


export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [data, setData] = useState<AppData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [theme, setTheme] = useState<Theme>(() => {
    // Get theme from localStorage or default to system preference
    const savedTheme = localStorage.getItem('theme') as Theme;
    if (savedTheme) {
        return savedTheme;
    }
    return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
  });

  useEffect(() => {
      // Apply theme class to the root element and save to localStorage
      const root = window.document.documentElement;
      root.classList.remove(theme === 'dark' ? 'light' : 'dark');
      root.classList.add(theme);
      localStorage.setItem('theme', theme);
  }, [theme]);



  useEffect(() => {
    const initializeApp = async () => {
      await storageService.initDB();
      let loadedData: any = storageService.loadData();
      
      // Check for data version to decide on file migration
      if (!loadedData?.version || loadedData.version < 2) {
          console.log("Starting file migration from localStorage to IndexedDB...");
          const fileMigratedData = await migrateFilesToDb(loadedData);
          const [structuralMigratedData] = migrateData(fileMigratedData);
          const finalMigratedData = { ...structuralMigratedData, version: 2 };
          storageService.saveData(finalMigratedData);
          setData(finalMigratedData);
          alert("Application data has been upgraded to a new, more efficient format. This is a one-time process.");
      } else {
          // No file migration needed, just run structural migrations
          const [structuralMigratedData, needsSave] = migrateData(loadedData);
          if (needsSave) {
              // Preserve or update version number, ensuring 'version' is only added if it exists in loadedData
              storageService.saveData({ ...structuralMigratedData, ...(loadedData.version && { version: loadedData.version }) });
          }
          setData(structuralMigratedData);
      }
      setIsLoading(false);
    };

    initializeApp();
  }, []);

  const saveData = (newData: AppData) => {
    storageService.saveData(newData);
    setData(newData);
  };

  const toggleTheme = () => {
    setTheme(prevTheme => (prevTheme === 'light' ? 'dark' : 'light'));
  };

  const contextValue = useMemo(() => ({ data, saveData, theme, toggleTheme }), [data, theme]);
  
  if (isLoading) {
      return <div className="p-8 text-center">Loading and preparing data...</div>;
  }

  return (
    <AppContext.Provider value={contextValue}>
      {children}
    </AppContext.Provider>
  );
};

export const useAppContext = () => {
  const context = useContext(AppContext);
  if (context === undefined) {
    throw new Error('useAppContext must be used within an AppProvider');
  }
  return context;
};
