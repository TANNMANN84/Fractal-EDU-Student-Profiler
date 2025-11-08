
import React, { useState, useEffect, useRef } from 'react';
// FIX: Corrected import paths to be relative.
import type { Student, EvidenceLogEntry } from '../types';
import { useAppContext } from '../contexts/AppContext';
import EditStudentModal from './EditStudentModal';
import AddEvidenceModal from './AddEvidenceModal';

interface StudentProfileModalProps {
  student: Student;
  onClose: () => void;
}

const DetailItem: React.FC<{ label: string, value: React.ReactNode }> = ({ label, value }) => (
    <div>
        <dt className="text-sm font-medium text-gray-500">{label}</dt>
        <dd className="mt-1 text-sm text-gray-900">{value || 'N/A'}</dd>
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


const StudentProfileModal: React.FC<StudentProfileModalProps> = ({ student, onClose }) => {
  const { data, saveData } = useAppContext();
  const [isEditing, setIsEditing] = useState(false);
  const [isAddingEvidence, setIsAddingEvidence] = useState(false);
  const dialogRef = useRef<HTMLDialogElement>(null);

  const currentStudentState = data?.students.find(s => s.studentId === student.studentId) || student;

  useEffect(() => {
    dialogRef.current?.showModal();
  }, []);

  const handleSaveStudent = (updatedStudent: Student) => {
    if (!data) return;
    const updatedStudents = data.students.map(s => s.studentId === student.studentId ? updatedStudent : s);
    saveData({ ...data, students: updatedStudents });
    setIsEditing(false); // Close edit modal if it was open
  }

  const handleSaveLog = (newLog: EvidenceLogEntry) => {
    if (!data) return;
    const updatedStudents = data.students.map(s => 
        s.studentId === student.studentId 
            ? { ...s, evidenceLog: [newLog, ...(s.evidenceLog || [])] } 
            : s
    );
    saveData({ ...data, students: updatedStudents });
    setIsAddingEvidence(false);
  };
  
  const handleClose = () => {
    dialogRef.current?.close();
    onClose();
  }

  return (
    <>
      <dialog ref={dialogRef} onClose={onClose} className="p-0 rounded-lg shadow-xl w-11/12 max-w-4xl backdrop:bg-black backdrop:opacity-50 border border-gray-300">
        <div className="sticky top-0 z-10 bg-gray-100 p-4 border-b border-gray-200">
            <div className="flex justify-between items-center">
                <div className="flex items-center gap-4">
                     <h2 className="text-2xl font-bold text-gray-900">{currentStudentState.firstName} {currentStudentState.lastName}</h2>
                     <button onClick={() => setIsEditing(true)} className="bg-gray-200 text-gray-800 px-3 py-1 rounded-md hover:bg-gray-300 text-sm font-semibold">
                        Edit Profile
                    </button>
                    <button onClick={() => setIsAddingEvidence(true)} className="bg-blue-600 text-white px-3 py-1 rounded-md hover:bg-blue-700 text-sm font-semibold">
                        Quick Add Evidence
                    </button>
                </div>
                <button onClick={handleClose} className="text-2xl font-light text-gray-600 hover:text-gray-900 leading-none">&times;</button>
            </div>
        </div>

        <div className="p-6 bg-white text-gray-900" style={{maxHeight: '75vh', overflowY: 'auto'}}>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                    <div className="bg-gray-50 p-4 rounded-lg border">
                        <h3 className="font-semibold text-lg mb-2 text-gray-800">Profile Details</h3>
                        <dl className="space-y-2">
                           <DetailItem label="Current Year Group" value={currentStudentState.profile.currentYearGroup} />
                           <DetailItem label="Status" value={currentStudentState.profile.status} />
                           <DetailItem label="ATSI Status" value={currentStudentState.profile.atsiStatus} />
                           <DetailItem label="Has Behaviour Plan" value={currentStudentState.wellbeing.hasBehaviourPlan ? 'Yes' : 'No'} />
                           <DetailItem label="Has Learning Plan" value={currentStudentState.wellbeing.hasLearningPlan ? 'Yes' : 'No'} />
                           <DetailItem label="HPGE Status" value={currentStudentState.hpge.status} />
                           {currentStudentState.hpge.status !== 'Not Identified' && <DetailItem label="HPGE Domain" value={currentStudentState.hpge.domain} />}
                        </dl>
                    </div>
                </div>
                <div className="space-y-4">
                     <div className="bg-gray-50 p-4 rounded-lg border">
                        <h3 className="font-semibold text-lg mb-2 text-gray-800">Academic Snapshot</h3>
                        {currentStudentState.academic.naplan && (
                            <>
                                <h4 className="font-medium text-md text-gray-700 mt-1">Year 7 NAPLAN</h4>
                                <dl className="space-y-1 pl-2 border-l mt-1">
                                   <DetailItem label="Reading" value={<NaplanBandBadge band={currentStudentState.academic.naplan.year7.reading} />} />
                                   <DetailItem label="Writing" value={<NaplanBandBadge band={currentStudentState.academic.naplan.year7.writing} />} />
                                   <DetailItem label="Numeracy" value={<NaplanBandBadge band={currentStudentState.academic.naplan.year7.numeracy} />} />
                                </dl>
                                {currentStudentState.profile.currentYearGroup >= 9 && (
                                    <>
                                        <h4 className="font-medium text-md text-gray-700 mt-3">Year 9 NAPLAN</h4>
                                        <dl className="space-y-1 pl-2 border-l mt-1">
                                        <DetailItem label="Reading" value={<NaplanBandBadge band={currentStudentState.academic.naplan.year9.reading} />} />
                                        <DetailItem label="Writing" value={<NaplanBandBadge band={currentStudentState.academic.naplan.year9.writing} />} />
                                        <DetailItem label="Numeracy" value={<NaplanBandBadge band={currentStudentState.academic.naplan.year9.numeracy} />} />
                                        </dl>
                                    </>
                                )}
                            </>
                        )}
                    </div>
                </div>
            </div>
        </div>
      </dialog>
      {isEditing && <EditStudentModal student={currentStudentState} onClose={() => setIsEditing(false)} onSave={handleSaveStudent} />}
      {isAddingEvidence && <AddEvidenceModal onClose={() => setIsAddingEvidence(false)} onSaveLog={handleSaveLog} />}
    </>
  );
};

export default StudentProfileModal;