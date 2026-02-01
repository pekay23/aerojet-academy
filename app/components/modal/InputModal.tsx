"use client";
import React, { useState, useEffect } from 'react';

type InputModalProps = {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (value: string) => void;
  title: string;
  message: string;
  defaultValue?: string;
  placeholder?: string;
};

export default function InputModal({ 
  isOpen, 
  onClose, 
  onConfirm,
  title,
  message,
  defaultValue = "",
  placeholder = ""
}: InputModalProps) {
  const [value, setValue] = useState(defaultValue);

  // Reset value when modal opens
  useEffect(() => {
    if (isOpen) setValue(defaultValue || "");
  }, [isOpen, defaultValue]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-xl shadow-2xl p-8 max-w-sm w-full animate-in fade-in zoom-in-95 duration-200">
        <h2 className="text-xl font-bold text-slate-800 mb-2">{title}</h2>
        <p className="text-sm text-slate-600 mb-6">{message}</p>
        
        <input 
            type="text" 
            value={value}
            onChange={(e) => setValue(e.target.value)}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none mb-6 font-mono text-lg"
            placeholder={placeholder}
            autoFocus
        />

        <div className="flex justify-end gap-3">
          <button 
            onClick={onClose}
            className="px-4 py-2 rounded-lg font-bold text-sm text-gray-600 bg-gray-100 hover:bg-gray-200 transition"
          >
            Cancel
          </button>
          <button 
            onClick={() => { onConfirm(value); onClose(); }}
            className="px-6 py-2 rounded-lg font-bold text-sm text-white bg-blue-600 hover:bg-blue-700 transition"
          >
            Save
          </button>
        </div>
      </div>
    </div>
  );
}
