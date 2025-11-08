import React, { useState, useEffect, useRef } from 'react';
import type { Student } from '../types';

interface ReportOptions {
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

interface ReportGeneratorModalProps {
    students: Student[];
    className: string;
    onClose: () => void;
    onGenerate: (selectedStudentIds: string[], options: ReportOptions) => void;
}

const ReportGeneratorModal: React.FC<ReportGeneratorModalProps> = ({ students, className, onClose, onGenerate }) => {
    const dialogRef = useRef<HTMLDialogElement>(null);

    // State for selected students
    const [selectedStudentIds, setSelectedStudentIds] = useState<string[]>([]);
    
    // State for report content options
    const [reportOptions, setReportOptions] = useState<ReportOptions>({
        profileDetails: true,
        wellbeingPlans: true,
        wellbeingNotes: false,
        academicNaplan: true,
        academicGrades: false,
        academicNotes: false,
        hpgeProfile: true,
        hpgeNotes: false,
        workSamples: false,
        evidenceLog: true,
    });

    useEffect(() => {
        dialogRef.current?.showModal();
        // Default to all students selected
        setSelectedStudentIds(students.map(s => s.studentId));
    }, [students]);

    const handleClose = () => {
        dialogRef.current?.close();
        onClose();
    };

    const handleGenerate = () => {
        onGenerate(selectedStudentIds, reportOptions);
    };

    const handleOptionChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, checked } = e.target;
        setReportOptions(prev => ({ ...prev, [name]: checked }));
    };

    const handleStudentSelectionChange = (studentId: string) => {
        setSelectedStudentIds(prev =>
            prev.includes(studentId)
                ? prev.filter(id => id !== studentId)
                : [...prev, studentId]
        );
    };

    const handleSelectAllStudents = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.checked) {
            setSelectedStudentIds(students.map(s => s.studentId));
        } else {
            setSelectedStudentIds([]);
        }
    };
    
    const CheckboxOption: React.FC<{ name: keyof typeof reportOptions, label: string }> = ({ name, label }) => (
         <label className="flex items-center p-2 rounded-md hover:bg-gray-100 cursor-pointer">
            <input
                type="checkbox"
                name={name}
                checked={reportOptions[name]}
                onChange={handleOptionChange}
                className="h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
            />
            <span className="ml-3 text-gray-800 text-sm">{label}</span>
        </label>
    );

    return (
        <dialog ref={dialogRef} onClose={onClose} className="p-0 rounded-lg shadow-xl w-11/12 max-w-3xl backdrop:bg-black backdrop:opacity-50 border border-gray-300">
            <div className="flex justify-between items-center p-4 bg-gray-100 border-b border-gray-200 sticky top-0 z-10">
                <h2 className="text-xl font-bold text-gray-900">Generate Student Reports for {className}</h2>
                <button onClick={handleClose} className="text-2xl font-light text-gray-600 hover:text-gray-900 leading-none">&times;</button>
            </div>

            <div className="p-6 bg-white text-gray-900 grid grid-cols-1 md:grid-cols-2 gap-6" style={{ maxHeight: '70vh', overflowY: 'auto' }}>
                {/* Step 1: Select Students */}
                <div>
                    <h3 className="font-semibold text-lg text-gray-800 mb-2 border-b pb-2">1. Select Students</h3>
                    <div className="max-h-80 overflow-y-auto border rounded-md p-2 space-y-1">
                        <label className="flex items-center p-2 rounded-md hover:bg-gray-100 cursor-pointer font-semibold">
                            <input
                                type="checkbox"
                                checked={selectedStudentIds.length === students.length && students.length > 0}
                                onChange={handleSelectAllStudents}
                                className="h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                            />
                            <span className="ml-3 text-gray-900 text-sm">Select All Students</span>
                        </label>
                        <hr/>
                        {students.map(student => (
                            <label key={student.studentId} className="flex items-center p-2 rounded-md hover:bg-gray-100 cursor-pointer">
                                <input
                                    type="checkbox"
                                    checked={selectedStudentIds.includes(student.studentId)}
                                    onChange={() => handleStudentSelectionChange(student.studentId)}
                                    className="h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                                />
                                <span className="ml-3 text-gray-800 text-sm">{student.lastName}, {student.firstName}</span>
                            </label>
                        ))}
                    </div>
                </div>

                {/* Step 2: Select Content */}
                <div>
                    <h3 className="font-semibold text-lg text-gray-800 mb-2 border-b pb-2">2. Select Report Content</h3>
                    <div className="space-y-2">
                        <fieldset className="border rounded-md p-2">
                            <legend className="text-sm font-medium px-1">Core Info</legend>
                            <CheckboxOption name="profileDetails" label="Profile Details & Plans" />
                            <CheckboxOption name="wellbeingPlans" label="At-a-Glance Wellbeing Profile" />
                        </fieldset>
                         <fieldset className="border rounded-md p-2">
                            <legend className="text-sm font-medium px-1">Academic Data</legend>
                            <CheckboxOption name="academicNaplan" label="NAPLAN Results" />
                            <CheckboxOption name="academicGrades" label="Report Grades" />
                        </fieldset>
                         <fieldset className="border rounded-md p-2">
                            <legend className="text-sm font-medium px-1">HPGE</legend>
                            <CheckboxOption name="hpgeProfile" label="HPGE Status & Plan" />
                        </fieldset>
                        <fieldset className="border rounded-md p-2">
                            <legend className="text-sm font-medium px-1">Longitudinal Data</legend>
                            <CheckboxOption name="evidenceLog" label="Full Evidence Log" />
                            <CheckboxOption name="workSamples" label="Work Samples Log" />
                             <CheckboxOption name="wellbeingNotes" label="Wellbeing Notes" />
                             <CheckboxOption name="academicNotes" label="Academic Notes" />
                             <CheckboxOption name="hpgeNotes" label="HPGE Notes" />
                        </fieldset>
                    </div>
                </div>
            </div>

            <div className="p-4 bg-gray-100 border-t border-gray-200 flex justify-end gap-2 sticky bottom-0">
                <button type="button" onClick={handleClose} className="px-4 py-2 bg-gray-300 text-gray-800 rounded-md hover:bg-gray-400 font-semibold transition-colors">Cancel</button>
                <button onClick={handleGenerate} disabled={selectedStudentIds.length === 0} className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:bg-green-300 font-semibold transition-colors">
                    Generate Report ({selectedStudentIds.length})
                </button>
            </div>
        </dialog>
    );
};

export default ReportGeneratorModal;