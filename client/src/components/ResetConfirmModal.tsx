import React from 'react';
import { AlertTriangle } from 'lucide-react';

interface ResetConfirmModalProps {
  isOpen: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

export const ResetConfirmModal: React.FC<ResetConfirmModalProps> = ({
  isOpen,
  onConfirm,
  onCancel,
}) => {
  if (!isOpen) return null;

  return (
    <div className="modal-overlay">
      <div className="modal-content">
        <h3 className="modal-title" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#f43f5e' }}>
          <AlertTriangle size={22} /> Reset Personalization?
        </h3>
        <p className="modal-text">
          This will reset all your learned topic preference weights back to 1.0 and clear your rating feedback history. Your explicit interest selections will remain intact.
        </p>
        <div className="modal-actions">
          <button className="btn-secondary" onClick={onCancel}>
            Cancel
          </button>
          <button
            className="btn-primary"
            style={{ width: 'auto', background: '#f43f5e', color: '#ffffff' }}
            onClick={onConfirm}
          >
            Confirm Reset
          </button>
        </div>
      </div>
    </div>
  );
};
