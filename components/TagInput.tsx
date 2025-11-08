
import React, { useState } from 'react';

interface TagInputProps {
  value: string[];
  onChange: (newValue: string[]) => void;
  placeholder?: string;
  disabled?: boolean;
}

const TagInput: React.FC<TagInputProps> = ({ value = [], onChange, placeholder, disabled = false }) => {
  const [inputValue, setInputValue] = useState('');

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (disabled) return;
    if (e.key === 'Enter' && inputValue.trim()) {
      e.preventDefault();
      if (!value.includes(inputValue.trim())) {
        onChange([...value, inputValue.trim()]);
      }
      setInputValue('');
    } else if (e.key === 'Backspace' && !inputValue && value.length > 0) {
      e.preventDefault();
      onChange(value.slice(0, -1));
    }
  };

  const removeTag = (tagToRemove: string) => {
    if (disabled) return;
    onChange(value.filter(tag => tag !== tagToRemove));
  };

  return (
    <div className={`w-full flex flex-wrap items-center gap-2 p-2 rounded-md border shadow-sm min-h-[42px] ${disabled ? 'bg-gray-100 cursor-not-allowed' : 'bg-white border-gray-300'}`}>
      {value.map((tag) => (
        <span key={tag} className="flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-blue-100 text-blue-800 text-sm font-medium">
          {tag}
          {!disabled && (
            <button
              type="button"
              onClick={() => removeTag(tag)}
              className="text-blue-600 hover:text-blue-800 font-bold"
              aria-label={`Remove ${tag}`}
            >
              &times;
            </button>
          )}
        </span>
      ))}
      <input
        type="text"
        value={inputValue}
        onChange={(e) => setInputValue(e.target.value)}
        onKeyDown={handleKeyDown}
        placeholder={placeholder || "Type and press Enter..."}
        className="flex-1 p-0.5 bg-transparent border-none focus:ring-0 focus:outline-none text-sm text-gray-900 disabled:cursor-not-allowed"
        disabled={disabled}
      />
    </div>
  );
};

export default TagInput;
