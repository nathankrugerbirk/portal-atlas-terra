export function LoadingState({ message = "Carregando..." }: { message?: string }) {
  return (
    <div className="flex flex-col items-center justify-center py-16 gap-4 animate-fade-in">
      <div className="relative w-10 h-10">
        <div
          className="absolute inset-0 rounded-full border-2 border-transparent animate-spin"
          style={{ borderTopColor: "#00E1FF" }}
        />
        <div
          className="absolute inset-1 rounded-full border border-transparent animate-spin"
          style={{ borderTopColor: "rgba(0,225,255,0.4)", animationDirection: "reverse", animationDuration: "0.8s" }}
        />
      </div>
      <p className="font-montserrat text-sm" style={{ color: "rgba(139,163,181,0.7)" }}>
        {message}
      </p>
    </div>
  );
}
