import { Suspense } from 'react'
import SchedulingContent from './SchedulingContent';

/**
 * Page de gestion des emplois du temps
 * /scheduling?classeId=xxx&view=history
 */

function Loading() {
  return (
    <div className="scheduling__loading" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '80vh' }}>
      <div className="scheduling__loading-spinner"></div>
      <p style={{ marginLeft: '1rem' }}>Chargement de la page de planning...</p>
    </div>
  );
}

export default function SchedulingPage() {
  return (
    <Suspense fallback={<Loading />}>
      <SchedulingContent />
    </Suspense>
  )
}
