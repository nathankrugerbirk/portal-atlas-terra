"use client";

interface ConfirmDeleteModalProps {
  isOpen: boolean;
  title: string;
  description: string;
  onConfirm: () => void;
  onCancel: () => void;
  loading?: boolean;
}

export function ConfirmDeleteModal({
  isOpen,
  title,
  description,
  onConfirm,
  onCancel,
  loading,
}: ConfirmDeleteModalProps) {
  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: "rgba(0,7,15,0.85)" }}
    >
      <div
        className="atlas-card w-full max-w-md p-6 animate-slide-up"
        style={{ boxShadow: "0 0 40px rgba(255,77,77,0.1), 0 20px 60px rgba(0,0,0,0.6)" }}
      >
        <div className="flex items-center gap-3 mb-4">
          <div
            className="w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0"
            style={{ background: "rgba(255,77,77,0.12)", border: "1px solid rgba(255,77,77,0.25)" }}
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#ff6b6b" strokeWidth="2.5">
              <path d="M3 6h18M19 6l-1 14H6L5 6M10 11v6M14 11v6M9 6V4h6v2"/>
            </svg>
          </div>
          <h3 className="font-orbitron font-bold text-base" style={{ color: "#F2F2F2" }}>
            {title}
          </h3>
        </div>
        <p className="font-montserrat text-sm mb-6" style={{ color: "#8BA3B5" }}>
          {description}
        </p>
        <div className="flex gap-3 justify-end">
          <button onClick={onCancel} className="btn-atlas-outline" disabled={loading}>
            Cancelar
          </button>
          <button onClick={onConfirm} className="btn-atlas-danger" disabled={loading}>
            {loading ? "Excluindo..." : "Confirmar exclusão"}
          </button>
        </div>
      </div>
    </div>
  );
}
