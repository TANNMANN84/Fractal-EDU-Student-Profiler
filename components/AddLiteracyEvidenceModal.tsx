
import React, { useState, useEffect, useRef } from 'react';
import type { FileUpload, LiteracyTag, LiteracyEvidenceEntry } from '../types';
import { LITERACY_DOMAINS } from '../constants';
import InlineFileUpload from './InlineFileUpload';

interface AddLiteracyEvidenceModalProps {
  onClose: () => void;
  onSave: (newLog: LiteracyEvidenceEntry) => void;
}

const AddLiteracyEvidenceModal: React.FC<AddLiteracyEvidenceModalProps> = ({ onClose, onSave }) => {
  const [note, setNote] = useState('');
  const [file, setFile] = useState<FileUpload | null>(null);
  const [tags, setTags] = useState<LiteracyTag[]>([]);
  const dialogRef = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    dialogRef.current?.showModal();
  }, []);

  const handleToggleTag = (tag: LiteracyTag) => {
    setTags(prev => 
      prev.includes(tag) ? prev.filter(t => t !== tag) : [...prev, tag]
    );
  };

  const handleSave = () => {
    if (!note.trim() && !file) {
      alert("Please provide either a note or upload a file.");
      return;
    }
    if (tags.length === 0) {
      alert("Please select at least one literacy domain tag.");
      return;
    }
    
    const newEntry: LiteracyEvidenceEntry = {
      id: `lit-ev-${crypto.randomUUID()}`,
      date: new Date().toISOString(),
      note: note.trim() ? note.trim() : undefined,
      file: file ?? undefined,
      tags: tags,
    };
    onSave(newEntry);
  };
  
  const handleClose = () => {
    dialogRef.current?.close();
    onClose();
  }
  
  const labelStyle = "block font-semibold text-gray-700";
  const inputStyle = "w-full p-2 border border-gray-300 rounded bg-white focus:ring-blue-500 focus:border-blue-500";

  return (
    <dialog ref={dialogRef} onClose={onClose} className="p-0 rounded-lg shadow-xl w-11/12 max-w-xl backdrop:bg-black backdrop:opacity-50 border border-gray-300">
        <div className="flex justify-between items-center p-4 bg-gray-100 border-b border-gray-200 sticky top-0">
            <h2 className="text-xl font-bold text-gray-900">Add Literacy Evidence</h2>
            <button onClick={handleClose} className="text-2xl font-light text-gray-600 hover:text-gray-900 leading-none">&times;</button>
        </div>
        
        <div className="p-6 space-y-4 bg-white text-gray-900">
            <div>
                <label className={labelStyle}>Tags (at least one required)</label>
                <div className="flex flex-wrap gap-2 mt-2">
                    {LITERACY_DOMAINS.map(tag => (
                        <button
                            key={tag}
                            type="button"
                            onClick={() => handleToggleTag(tag)}
                            className={`px-3 py-1 text-sm font-medium rounded-full border transition-colors ${
                                tags.includes(tag)
                                ? 'bg-blue-600 text-white border-blue-600'
                                : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-100'
                            }`}
                        >
                            {tag}
                        </button>
                    ))}
                </div>
            </div>
            
            <div>
                <label className={labelStyle}>Note (optional)</label>
                <textarea value={note} onChange={e => setNote(e.target.value)} className={inputStyle} rows={4} placeholder="Describe the evidence or observation..."></textarea>
            </div>

            <div>
                <label className={labelStyle}>Upload File (optional)</label>
                <InlineFileUpload
                    file={file}
                    onUpload={setFile}
                    onRemove={() => setFile(null)}
                />
            </div>
        </div>

        <div className="p-4 bg-gray-100 border-t border-gray-200 flex justify-end gap-2 sticky bottom-0">
            <button onClick={handleClose} className="px-4 py-2 bg-gray-300 text-gray-800 rounded-md hover:bg-gray-400 font-semibold transition-colors">Cancel</button>
            <button onClick={handleSave} className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 font-semibold transition-colors">Save Evidence</button>
        </div>
    </dialog>
  );
};

export default AddLiteracyEvidenceModal;
