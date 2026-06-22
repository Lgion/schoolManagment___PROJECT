'use client';
import { useCallback, useEffect, useRef, useState } from 'react';
import { captureSnapshot } from './galleryApi';

// Jitsi Meet IFrame API — chargée à la volée (aucune dépendance npm).
const JITSI_DOMAIN = 'meet.jit.si';
const JITSI_SCRIPT = `https://${JITSI_DOMAIN}/external_api.js`;

function loadJitsiScript() {
  return new Promise((resolve, reject) => {
    if (typeof window === 'undefined') return reject(new Error('SSR'));
    if (window.JitsiMeetExternalAPI) return resolve();
    const existing = document.querySelector(`script[data-jitsi="1"]`);
    if (existing) {
      existing.addEventListener('load', () => resolve());
      existing.addEventListener('error', () => reject(new Error('Chargement Jitsi impossible')));
      return;
    }
    const s = document.createElement('script');
    s.src = JITSI_SCRIPT;
    s.async = true;
    s.dataset.jitsi = '1';
    s.onload = () => resolve();
    s.onerror = () => reject(new Error('Chargement Jitsi impossible'));
    document.body.appendChild(s);
  });
}

/**
 * Studio de visioconférence plein écran (modale).
 *  - `roomName`   : nom du salon Jitsi (cryptique, fourni par le backend).
 *  - `canCapture` : affiche le bouton « 📸 Prendre une photo » (STAFF uniquement).
 *  - `albumTarget`: { eventId } ou { classId } — destination des captures.
 *                   Sans cible, aucune capture possible (ex : RDV 1-à-1).
 */
export default function VisioStudio({ roomName, title, displayName, canCapture = false, albumTarget = null, onClose }) {
  const containerRef = useRef(null);
  const apiRef = useRef(null);
  const screenStreamRef = useRef(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  const [flash, setFlash] = useState(false);
  const [toast, setToast] = useState('');
  const [capturing, setCapturing] = useState(false);

  useEffect(() => {
    let mounted = true;
    loadJitsiScript()
      .then(() => {
        if (!mounted || !containerRef.current) return;
        const api = new window.JitsiMeetExternalAPI(JITSI_DOMAIN, {
          roomName,
          parentNode: containerRef.current,
          width: '100%',
          height: '100%',
          userInfo: { displayName: displayName || 'Participant' },
          configOverwrite: { prejoinPageEnabled: true, disableDeepLinking: true },
          interfaceConfigOverwrite: { MOBILE_APP_PROMO: false, SHOW_JITSI_WATERMARK: false },
        });
        apiRef.current = api;
        api.addListener('videoConferenceJoined', () => setLoading(false));
        api.addListener('readyToClose', () => onClose?.());
      })
      .catch((e) => { if (mounted) { setError(e.message); setLoading(false); } });

    return () => {
      mounted = false;
      try { apiRef.current?.dispose(); } catch (_) { /* noop */ }
      try { screenStreamRef.current?.getTracks().forEach((t) => t.stop()); } catch (_) { /* noop */ }
      screenStreamRef.current = null;
    };
  }, [roomName, displayName, onClose]);

  // Le flux de capture vient du Screen Capture API : on photographie l'écran en
  // direct (la grille de visio). Le flux Jitsi vit dans une iframe cross-origin
  // qu'on ne peut pas lire via <canvas> directement — la capture d'écran contourne
  // proprement cette limite. Le 1er clic ouvre le sélecteur ; les suivants réutilisent le flux.
  const ensureScreenStream = useCallback(async () => {
    if (screenStreamRef.current && screenStreamRef.current.active) return screenStreamRef.current;
    const stream = await navigator.mediaDevices.getDisplayMedia({ video: { frameRate: 10 }, audio: false });
    screenStreamRef.current = stream;
    stream.getVideoTracks()[0]?.addEventListener('ended', () => { screenStreamRef.current = null; });
    return stream;
  }, []);

  const handleCapture = useCallback(async () => {
    if (!albumTarget) return;
    setCapturing(true);
    setError('');
    let video;
    try {
      const stream = await ensureScreenStream();
      video = document.createElement('video');
      video.srcObject = stream;
      video.muted = true;
      await video.play();
      await new Promise((r) => setTimeout(r, 250)); // laisser une frame se peindre

      const w = video.videoWidth || 1280;
      const h = video.videoHeight || 720;
      const canvas = document.createElement('canvas');
      canvas.width = w;
      canvas.height = h;
      canvas.getContext('2d').drawImage(video, 0, 0, w, h);
      const dataUrl = canvas.toDataURL('image/jpeg', 0.85);

      setFlash(true);
      setTimeout(() => setFlash(false), 350);

      await captureSnapshot({ ...albumTarget, image: dataUrl });
      setToast("Photo enregistrée dans l'album de l'événement !");
      setTimeout(() => setToast(''), 2800);
    } catch (e) {
      setError(e?.name === 'NotAllowedError' ? 'Capture annulée.' : (e?.message || 'Échec de la capture'));
    } finally {
      if (video) { try { video.pause(); video.srcObject = null; } catch (_) { /* noop */ } }
      setCapturing(false);
    }
  }, [albumTarget, ensureScreenStream]);

  return (
    <div className="visioStudio" role="dialog" aria-modal="true" aria-label={title || 'Visioconférence'}>
      <header className="visioStudio__bar">
        <span className="visioStudio__title">🎥 {title || 'Visioconférence'}</span>
        <button type="button" className="visioStudio__close" onClick={onClose}>✕ Quitter</button>
      </header>

      <div className="visioStudio__frame" ref={containerRef}>
        {loading && !error && (
          <div className="visioStudio__status"><span className="visioStudio__spinner" /> Connexion au salon…</div>
        )}
        {error && <div className="visioStudio__error">⚠️ {error}</div>}
      </div>

      {canCapture && albumTarget && (
        <button type="button" className="visioStudio__capture" onClick={handleCapture} disabled={capturing}>
          {capturing ? '⏳ Capture…' : '📸 Prendre une photo'}
        </button>
      )}

      {flash && <div className="visioStudio__flash" aria-hidden="true" />}
      {toast && <div className="visioStudio__toast" role="status">✅ {toast}</div>}
    </div>
  );
}
