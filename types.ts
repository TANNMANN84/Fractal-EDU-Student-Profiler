// --- Core Data Structures ---
export interface AppData {
  students: Student[];
  classes: ClassData[];
  monitoringDocs: MonitoringDoc[];
  teacherProfile: Teacher | null;
}

export interface Teacher {
    name: string;
    email: string;
}

export interface Student {
  studentId: string;
  firstName: string;
  lastName: string;
  profile: StudentProfile;
  academic: StudentAcademic;
  wellbeing: StudentWellbeing;
  hpge: StudentHpge;
  evidenceLog: EvidenceLogEntry[];
  workSamples: WorkSample[];
}

export interface ClassData {
  classId: string;
  className: string;
  teacher: string;
  studentIds: string[];
  status: 'Active' | 'Archived';
  studentSortOrder?: string[]; // Optional: For custom drag-and-drop ordering
  seatingCharts?: { [name: string]: SeatingChart };
  activeSeatingChartName?: string;
}

export interface SeatingChart {
  rows: number;
  seatsPerRow: number;
  arrangement: (string | null)[][];
}

export interface MonitoringDoc {
    id: string;
    classId: string;
    year: number;
    certifySyllabus: boolean;
    scopeAndSequence: FileUpload | null;
    teachingPrograms: TermBased<FileUpload[]>;
    semesterReports: TermBased<FileUpload | null>;
    assessmentSchedule: FileUpload | null;
    assessmentTask1: FileUpload[];
    assessmentTask2: FileUpload[];
    assessmentTask3: FileUpload[];
    prePostDiagnostic: FileUpload[];
    marksAndRanks: TermBased<FileUpload | null>;
    scannedWorkSamples: {
        task1: WorkSampleScans;
        task2: WorkSampleScans;
        task3: WorkSampleScans;
    };
    specificLearningNeeds: TermBased<boolean>;
    studentsCausingConcern: TermBased<ConcernEntry[]>;
    illnessMisadventure: TermBased<FileUpload[]>;
    malpractice: TermBased<FileUpload[]>;
    teacherSignOff: TermBased<TermSignOff | { teacherName: string; date: null; }>;
    headTeacherSignOff: TermBased<TermSignOff | { teacherName: string; date: null; }>;
}

// --- Student Sub-types ---

export interface StudentProfile {
  dob: string;
  atsiStatus: 'No' | 'Yes' | 'Not Stated';
  gender: string;
  pronouns: string;
  currentYearGroup: number;
  status: 'Active' | 'Archived';
}

export interface StudentAcademic {
  naplan: {
    year7: NaplanDataSet;
    year9: NaplanDataSet;
  };
  reportGrades: ReportGrade[];
  notes: NoteEntry[];
  learningSupport: LearningSupport;
}

export interface StudentWellbeing {
  hasBehaviourPlan: boolean;
  behaviourPlanLink: string;
  hasLearningPlan: boolean;
  learningPlanLink: string;
  strengths: string[];
  triggers: string[];
  proactiveStrategies: string[];
  deescalationStrategies: string[];
  medicalNeeds: string[];
  attendancePercent: number;
  evidenceLog?: EvidenceLogEntry[];
  sentralBehaviourSummary: string;
  notes: NoteEntry[];
}

export interface StudentHpge {
  status: 'Not Identified' | 'Nominated' | 'Identified';
  domain: 'Not Applicable' | 'Intellectual' | 'Creative' | 'Social-Emotional' | 'Physical';
  identificationEvidence: HpgeEvidence[];
  talentDevelopmentPlan: string;
  notes: NoteEntry[];
}

// --- Generic & Reusable Types ---

export type Term = '1' | '2' | '3' | '4';
export interface TermBased<T> {
  '1': T;
  '2': T;
  '3': T;
  '4': T;
}

export interface FileUpload {
  id: string; // Unique ID for IndexedDB lookup
  name: string;
}

export interface NoteEntry {
    id: string;
    date: string; // ISO string
    author: string;
    content: string;
}

// --- Specific Data Entry Types ---

export type NaplanBand = "Needs additional support" | "Developing" | "Strong" | "Exceeding" | "Not Assessed";

export interface NaplanDataSet {
    reading: NaplanBand;
    writing: NaplanBand;
    spelling: NaplanBand;
    grammar: NaplanBand;
    numeracy: NaplanBand;
}

export interface ReportGrade {
    id: string;
    period: string; // e.g., "Y7S1"
    grade: string;
}

export interface LearningSupport {
    isSwan: boolean;
    requiresLearningCentreBooking: boolean;
    differentiation: DifferentiationEntry[];
    numeracyEvidence: NumeracyEvidenceEntry[];
    literacyEvidence: LiteracyEvidenceEntry[];
}

export interface DifferentiationEntry {
    id: string;
    date: string; // ISO string
    note: string;
    file?: FileUpload;
}

export interface LiteracyEvidenceEntry {
    id: string;
    date: string; // ISO string
    note?: string;
    file?: FileUpload;
    tags: LiteracyTag[];
}

export interface NumeracyEvidenceEntry {
    id: string;
    date: string; // ISO string
    note?: string;
    file?: FileUpload;
    numeracyTags: NumeracyTag[];
    newmansTags: NewmansTag[];
}

export interface HpgeEvidence {
    id: string;
    note: string;
    fileLink?: string;
    evidenceFile?: FileUpload;
}

export interface EvidenceLogEntry {
  logId: string;
  date: string; // ISO String
  teacher: string;
  note: string;
  tags: EvidenceTag[];
  adjustment_level?: string;
  adjustments_used?: string[];
  evidenceLink?: string;
  evidenceFile?: FileUpload;
}

export interface WorkSample {
    id: string;
    title: string;
    comments?: string;
    fileLink?: string;
    fileUpload?: FileUpload;
}

export interface WorkSampleScans {
    top: FileUpload | null;
    middle: FileUpload | null;
    low: FileUpload | null;
}

export interface ConcernEntry {
    id: string;
    file: FileUpload;
    studentIds: string[];
}

export interface TermSignOff {
    teacherName: string;
    date: string; // ISO String
    signatureImage?: string; // Base64 encoded image
}

// --- Tag Types ---
export type EvidenceTag = 'Wellbeing' | 'Learning Support' | 'HPGE' | 'NCCD' | 'Cultural';
export type LiteracyTag = 'Reading' | 'Writing' | 'Spelling' | 'Grammar';
export type NumeracyTag = 'Number' | 'Algebra' | 'Measurement' | 'Geometry' | 'Statistics' | 'ProblemSolving' | 'Reasoning' | 'Calculating';
export type NewmansTag = 'Read it' | 'What' | 'How' | 'Have a Go' | 'Answer it';


// --- Import/Export Types ---
export interface ReviewPackage {
    dataType: 'reviewPackage';
    classData: ClassData;
    monitoringDoc: MonitoringDoc;
    students: Student[];
    profilerSnapshot: StudentProfilerSnapshotEntry[];
}

export interface StudentProfilerSnapshotEntry {
    studentId: string;
    firstName: string;
    lastName: string;
    hasWellbeingNotes: boolean;
    hasAcademicNotes: boolean;
    hasHpgeNotes: boolean;
    hasDifferentiation: boolean;
    hasEvidenceLogs: boolean;
    hasWorkSamples: boolean;
    naplan: {
        year7: { reading: NaplanBand, writing: NaplanBand, numeracy: NaplanBand },
        year9: { reading: NaplanBand, writing: NaplanBand, numeracy: NaplanBand },
    };
}

export interface StudentTransferPackage {
    dataType: 'studentTransfer';
    student: Student;
    files: { [id: string]: string };
}

export interface ClassTransferPackage {
    dataType: 'classTransfer';
    classData: ClassData;
    students: Student[];
    monitoringDoc: MonitoringDoc | null;
    files: { [id:string]: string };
}

export interface ReportOptions {
    profileDetails: boolean;
    wellbeingPlans: boolean;
    wellbeingNotes: boolean;
    academicNaplan: boolean;
    academicGrades: boolean;
    academicNotes: boolean;
    hpgeProfile: boolean;
    hpgeNotes: boolean;
    workSamples: boolean;
    evidenceLog: boolean;
}

export interface BackupFile {
    dataType: 'fullBackup';
    appData: AppData;
    files: { [id: string]: string };
}