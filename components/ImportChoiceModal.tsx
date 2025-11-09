import React, { useEffect, useRef } from 'react';
import type { ReviewPackage } from '../types';

interface ImportChoiceModalProps {
    packageData: any;
    importType: 'review' | 'students';
    onClose: () => void;
    onReview: (pkg: ReviewPackage) => void;
    onMerge: (pkg: ReviewPackage) => void;
    onMergeStudents: (studentsData: any[]) => void;
}

const ImportChoiceModal: React.FC<ImportChoiceModalProps> = ({ packageData, importType, onClose, onReview, onMerge, onMergeStudents }) => {
    const dialogRef = useRef<HTMLDialogElement>(null);

    useEffect(() => {
        dialogRef.current?.showModal();
    }, []);

    const handleClose = () => {
        dialogRef.current?.close();
        onClose();
    };
    
    const renderContent = () => {
        if (importType === 'review') {
            const reviewPkg = packageData as ReviewPackage;
            return (
                 <>
                    <p className="text-gray-700">
                        The file you imported is a review package for the class: <strong className="text-indigo-700">{reviewPkg.classData.className}</strong>.
                    </p>
                    <p className="text-gray-600">Please choose how you would like to proceed:</p>
                    <div className="mt-4 space-y-3">
                        <button
                            onClick={() => onReview(reviewPkg)}
                            type="button"
                            className="w-full text-left p-4 border border-blue-300 rounded-lg hover:bg-blue-50 transition-colors"
                        >
                            <h3 className="font-bold text-blue-800">Open in Review Mode</h3>
                            <p className="text-sm text-blue-700">Choose this if you are a **Head Teacher** or reviewer. This will open the document in a safe, read-only mode for you to sign.</p>
                        </button>
                        
                        <button
                            onClick={() => onMerge(reviewPkg)}
                            type="button"
                            className="w-full text-left p-4 border border-green-300 rounded-lg hover:bg-green-50 transition-colors"
                        >
                            <h3 className="font-bold text-green-800">Merge Signatures</h3>
                            <p className="text-sm text-green-700">Choose this if you are the **original teacher** and have received the signed document back. This will merge the Head Teacher's signature into your data.</p>
                        </button>
                    </div>
                </>
            );
        }
        
        if (importType === 'students') {
            return (
                <>
                    <p className="text-gray-700">
                       You have uploaded a student CSV file. This will add <strong className="text-indigo-700">{packageData.length}</strong> new students to your database.
                    </p>
                    <p className="text-gray-600 mt-2">Existing students with the same name and date of birth will be skipped to avoid duplicates.</p>
                    <div className="mt-6 flex justify-end">
                         <button
                            onClick={() => onMergeStudents(packageData)}
                            type="button"
                            className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 font-semibold"
                        >
                            Confirm and Merge Students
                        </button>
                    </div>
                </>
            );
        }

        return <p>Invalid import type.</p>;
    }

    return (
        <dialog ref={dialogRef} onClose={handleClose} className="p-0 rounded-lg shadow-xl w-11/12 max-w-lg backdrop:bg-black backdrop:opacity-50 border border-gray-300">
            <div className="flex justify-between items-center p-4 bg-gray-100 border-b border-gray-200">
                <h2 className="text-xl font-bold text-gray-900">
                    {importType === 'review' ? 'Review Package Detected' : 'Confirm Student Import'}
                </h2>
                <button onClick={handleClose} className="text-2xl font-light text-gray-600 hover:text-gray-900 leading-none">&times;</button>
            </div>
            <div className="p-6 bg-white space-y-4">
               {renderContent()}
            </div>
            <div className="p-4 bg-gray-50 flex justify-end gap-2 border-t">
                <button onClick={handleClose} className="px-4 py-2 bg-gray-300 text-gray-800 rounded-md hover:bg-gray-400 font-semibold">Cancel</button>
            </div>
        </dialog>
    );
};

export default ImportChoiceModal;