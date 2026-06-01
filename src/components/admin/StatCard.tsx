interface StatCardProps {
  label: string;
  value: string | number;
  icon: React.ReactNode;
  accent?: "cyan";
}

export function StatCard({ label, value, icon, accent = "cyan" }: StatCardProps) {
  const color = accent === "cyan" ? "#00E1FF" : "#00E6FF";
  const bg = accent === "cyan" ? "rgba(0,225,255,0.08)" : "rgba(255,162,58,0.08)";

  return (
    <div className="atlas-card p-5 flex items-center gap-4">
      <div
        className="w-12 h-12 rounded-lg flex items-center justify-center flex-shrink-0"
        style={{ background: bg, color }}
      >
        {icon}
      </div>
      <div>
        <p className="font-montserrat text-xs font-600 uppercase tracking-widest mb-1" style={{ color: "rgba(139,163,181,0.7)" }}>
          {label}
        </p>
        <p className="font-orbitron font-bold text-2xl" style={{ color }}>
          {value}
        </p>
      </div>
    </div>
  );
}

