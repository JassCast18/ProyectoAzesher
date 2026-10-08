export default function LoadingIndicator({ label = 'Cargando información…', fullScreen = false }) {
  return <div className={`${fullScreen ? 'fixed inset-0 z-50 bg-slate-50/95' : 'absolute inset-0 z-30 bg-white/90'} flex flex-col items-center justify-center gap-4`} role="status" aria-live="polite">
    <span className="bootstrap-spinner" aria-hidden="true" />
    <span className="text-sm font-semibold text-slate-600">{label}</span>
  </div>;
}
