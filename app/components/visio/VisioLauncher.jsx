'use client';
import { useState } from 'react';
import VisioStudio from './VisioStudio';

/**
 * Bouton d'entrée dans une visio. Ouvre le `VisioStudio` au clic.
 *  - `variant` : 'standard' (🎥 Rejoindre la visio) | 'live' (🔴 gros bouton pulsant) | 'launch'.
 *  - `canCapture` + `albumTarget` : transmis au studio (capture staff → album).
 */
export default function VisioLauncher({
  roomName,
  title,
  label,
  displayName,
  canCapture = false,
  albumTarget = null,
  variant = 'standard',
  className = '',
}) {
  const [open, setOpen] = useState(false);
  if (!roomName) return null;

  const defaultLabel =
    variant === 'live' ? '🔴 Rejoindre le Direct'
    : variant === 'launch' ? '🎥 Lancer / rejoindre la visio'
    : '🎥 Rejoindre la visio';

  return (
    <>
      <button
        type="button"
        className={`visioLauncher visioLauncher--${variant} ${className}`.trim()}
        onClick={() => setOpen(true)}
      >
        {label || defaultLabel}
      </button>

      {open && (
        <VisioStudio
          roomName={roomName}
          title={title}
          displayName={displayName}
          canCapture={canCapture}
          albumTarget={albumTarget}
          onClose={() => setOpen(false)}
        />
      )}
    </>
  );
}
