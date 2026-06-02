"use client";

import React, { useState } from 'react';

export default function ConfirmModal({ open, title, message, onConfirm, onCancel, requireDetails = false }: {
  open: boolean;
  title?: string;
  message: string;
  onConfirm: (details?: string) => void;
  onCancel: () => void;
  requireDetails?: boolean;
}) {
  const [details, setDetails] = useState('');
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/40" onClick={onCancel} />
      <div className="bg-card border border-border rounded-2xl shadow-modal w-full max-w-md p-6 z-10">
        {title && <h3 className="text-lg font-700 mb-2">{title}</h3>}
        <p className="text-[14px] text-muted-foreground mb-4">{message}</p>
        {requireDetails && (
          <textarea
            value={details}
            onChange={(e) => setDetails(e.target.value)}
            placeholder="Add a short reason or details (required)"
            className="w-full mb-4 px-3 py-2 bg-muted border border-border rounded-xl text-[14px] text-foreground placeholder:text-muted-foreground focus:outline-none h-24"
          />
        )}
        <div className="flex items-center justify-end gap-3">
          <button onClick={onCancel} className="px-3 py-2 bg-muted rounded-xl">Cancel</button>
          <button
            onClick={() => onConfirm(details)}
            className="px-3 py-2 bg-primary text-white rounded-xl"
            disabled={requireDetails && details.trim().length === 0}
          >
            Confirm
          </button>
        </div>
      </div>
    </div>
  );
}
