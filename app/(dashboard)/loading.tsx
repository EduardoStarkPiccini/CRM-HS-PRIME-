export default function DashboardLoading() {
  return (
    <div className="flex min-h-[60vh] items-center justify-center">
      <div className="flex flex-col items-center gap-3">
        <div className="h-9 w-9 animate-spin rounded-full border-2 border-gold/30 border-t-gold" />
        <p className="text-xs uppercase tracking-wide text-ink-dim">Carregando...</p>
      </div>
    </div>
  );
}
