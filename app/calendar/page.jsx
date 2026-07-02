import { Suspense } from 'react';
import CalendarContent from './CalendarContent';

export const metadata = {
  title: "Agenda de l'école",
};

function Loading() {
  return (
    <div className="calendar__loading">
      <div className="calendar__loading-spinner"></div>
      <p>Chargement de l'agenda…</p>
    </div>
  );
}

export default function CalendarPage() {
  return (
    <Suspense fallback={<Loading />}>
      <CalendarContent />
    </Suspense>
  );
}
