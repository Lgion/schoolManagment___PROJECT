// État de chargement réutilisable (spinner + libellé), accessible.
// Utilisé par les layouts élèves / enseignants / classes.
export default function LoadingState({ label }) {
  return (
    <div className="loading-state" role="status" aria-live="polite" aria-busy="true">
      <span className="loading-state__spinner" aria-hidden="true" />
      {label}
    </div>
  );
}
