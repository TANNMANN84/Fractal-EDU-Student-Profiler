
import React from 'react';
// FIX: Corrected import path to be relative.
import type { Student } from '../types';

interface StudentCardProps {
  student: Student;
  onClick: () => void;
  onRemoveFromClass: () => void;
}

const Badge: React.FC<{ children: React.ReactNode; color: string }> = ({ children, color }) => (
    <span className={`text-xs font-semibold mr-2 px-2.5 py-0.5 rounded ${color}`}>
        {children}
    </span>
);

const StudentCard: React.FC<StudentCardProps> = ({ student, onClick, onRemoveFromClass }) => {
  const handleRemoveClick = (e: React.MouseEvent) => {
    e.stopPropagation(); // Prevent onClick of the parent div from firing
    onRemoveFromClass();
  }

  return (
    <div 
        onClick={onClick} 
        className="relative bg-white border border-gray-200 rounded-lg p-4 cursor-pointer hover:shadow-lg hover:border-blue-500 transition-all duration-200 group"
    >
      <button 
        onClick={handleRemoveClick}
        className="absolute top-1 right-1 p-1 text-gray-400 rounded-full hover:bg-red-100 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity"
        aria-label={`Remove ${student.firstName} from class`}
      >
        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" /></svg>
      </button>

      <h3 className="font-bold text-lg text-gray-900">{student.firstName} {student.lastName}</h3>
      <div className="mt-2 flex flex-wrap gap-1">
        {student.wellbeing.hasBehaviourPlan && <Badge color="bg-red-100 text-red-800">Behaviour</Badge>}
        {student.wellbeing.hasLearningPlan && <Badge color="bg-yellow-100 text-yellow-800">Learning</Badge>}
        {student.hpge.status !== 'Not Identified' && <Badge color="bg-purple-100 text-purple-800">HPGE</Badge>}
      </div>
    </div>
  );
};

export default StudentCard;