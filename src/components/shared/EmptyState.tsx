interface EmptyStateProps {
  icon?: React.ReactNode;
  title: string;
  description?: string;
  action?: React.ReactNode;
}

export function EmptyState({ icon, title, description, action }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-16 px-4 text-center animate-fade-in">
      {icon && (
        <div className="mb-4 opacity-30" style={{ color: "#00E1FF" }}>
          {icon}
        </div>
      )}
      <h3
        className="font-montserrat font-600 text-base mb-2"
        style={{ color: "#8BA3B5" }}
      >
        {title}
      </h3>
      {description && (
        <p
          className="font-montserrat text-sm max-w-xs"
          style={{ color: "rgba(139,163,181,0.6)" }}
        >
          {description}
        </p>
      )}
      {action && <div className="mt-5">{action}</div>}
    </div>
  );
}
