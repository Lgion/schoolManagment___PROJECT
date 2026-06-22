"use client";

import { useCallback, useEffect, useState } from 'react';
import AppointmentModal from './AppointmentModal';
import {
  fetchAppointments,
  updateAppointment,
  statusMeta,
  formatMeta,
  personLabel,
  formatRange,
  MEETING_FORMAT_META,
} from './appointmentsApi';

/**
 * Centre de gestion des rendez-vous (cartes) — utilisable sur la page élève
 * (scopé à un studentId) ou sur une page prof/parent (tous mes RDV).
 *
 * Props :
 *   - studentId : limite les RDV à cet élève (optionnel)
 *   - initiatorRole : 'parent' | 'prof' — active le bouton de création adapté
 *   - teachers : enseignants proposables quand un parent crée (optionnel)
 *   - canCreate : affiche le bouton de demande/convocation
 */
export default function AppointmentsPanel({ studentId, initiatorRole, teachers = [], canCreate = false }) {
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [picks, setPicks] = useState({}); // { [apptId]: { dateIndex, format } }
  const [busyId, setBusyId] = useState(null);

  const load = useCallback(async () => {
    try {
      const data = await fetchAppointments({ studentId });
      setAppointments(data);
      setError('');
    } catch (err) {
      setError(err.message || 'Erreur');
    } finally {
      setLoading(false);
    }
  }, [studentId]);

  useEffect(() => { load(); }, [load]);

  const setPick = (id, key, val) =>
    setPicks((prev) => ({ ...prev, [id]: { ...prev[id], [key]: val } }));

  const act = async (appt, action) => {
    setBusyId(appt._id);
    setError('');
    try {
      const body = { action };
      if (action === 'accept') {
        const pick = picks[appt._id] || {};
        body.agreedDateIndex = appt.proposedDates.length === 1 ? 0 : Number(pick.dateIndex);
        body.agreedFormat = appt.meetingFormatOptions.length === 1 ? appt.meetingFormatOptions[0] : pick.format;
      }
      const updated = await updateAppointment(appt._id, body);
      setAppointments((prev) => prev.map((a) => (a._id === updated._id ? { ...updated, iAmInitiator: a.iAmInitiator, iAmRecipient: a.iAmRecipient } : a)));
    } catch (err) {
      setError(err.message || 'Erreur');
    } finally {
      setBusyId(null);
    }
  };

  return (
    <div className="appointments">
      {canCreate && (
        <div className="appointments__toolbar">
          <button type="button" className="appointments__add" onClick={() => setModalOpen(true)}>
            {initiatorRole === 'prof' ? '+ Solliciter / Convoquer' : '+ Demander un RDV'}
          </button>
        </div>
      )}

      {error && <p className="appointments__error">{error}</p>}

      {loading ? (
        <p className="appointments__hint">Chargement…</p>
      ) : appointments.length === 0 ? (
        <p className="appointments__hint">Aucun rendez-vous pour le moment.</p>
      ) : (
        <ul className="appointments__list">
          {appointments.map((a) => {
            const sm = statusMeta(a.meetingStatus);
            const pick = picks[a._id] || {};
            const canAccept = a.iAmRecipient && a.meetingStatus === 'PENDING';
            const canCancel = (a.iAmInitiator || a.iAmRecipient) && ['PENDING', 'ACCEPTED'].includes(a.meetingStatus);
            const canComplete = (a.iAmInitiator || a.iAmRecipient) && a.meetingStatus === 'ACCEPTED';
            return (
              <li key={a._id} className="appointments__item" style={{ '--status-color': sm.color }}>
                <div className="appointments__item-head">
                  <span className="appointments__item-label">{a.statusLabel}</span>
                  <span className="appointments__item-status">{sm.icon} {sm.label}</span>
                </div>
                {a.title && <p className="appointments__item-title">{a.title}</p>}
                <p className="appointments__item-meta">
                  Élève : <strong>{personLabel(a.studentId)}</strong>
                  {a.teacherRef && <> · Prof : <strong>{personLabel(a.teacherRef)}</strong></>}
                  {' · '}{a.iAmInitiator ? 'Demande envoyée' : 'Demande reçue'}
                </p>
                {a.message && <p className="appointments__item-message">{a.message}</p>}

                {a.meetingStatus === 'ACCEPTED' && a.agreedDate ? (
                  <p className="appointments__item-agreed">
                    📅 {formatRange(a.agreedDate)} · {formatMeta(a.agreedFormat)?.icon} {formatMeta(a.agreedFormat)?.label}
                    {a.agreedFormat === 'VISIO' && (
                      <span className="appointments__visio" title="Module visio à venir"> · 🎥 Visio : {a.visioRoomName} (à venir)</span>
                    )}
                  </p>
                ) : (
                  <div className="appointments__item-proposed">
                    <span className="appointments__item-proposed-label">Créneaux proposés :</span>
                    {canAccept && a.proposedDates.length > 1 ? (
                      a.proposedDates.map((d, i) => (
                        <label key={i} className="appointments__radio">
                          <input
                            type="radio"
                            name={`date-${a._id}`}
                            checked={Number(pick.dateIndex) === i}
                            onChange={() => setPick(a._id, 'dateIndex', i)}
                          />
                          {formatRange(d)}
                        </label>
                      ))
                    ) : (
                      <ul className="appointments__dates">
                        {a.proposedDates.map((d, i) => <li key={i}>{formatRange(d)}</li>)}
                      </ul>
                    )}
                    <span className="appointments__item-formats">
                      Format : {a.meetingFormatOptions.map((f) => `${MEETING_FORMAT_META[f]?.icon || ''} ${MEETING_FORMAT_META[f]?.label || f}`).join(' / ')}
                    </span>
                    {canAccept && a.meetingFormatOptions.length > 1 && (
                      <span className="appointments__formatPick">
                        {a.meetingFormatOptions.map((f) => (
                          <label key={f} className="appointments__radio">
                            <input
                              type="radio"
                              name={`fmt-${a._id}`}
                              checked={pick.format === f}
                              onChange={() => setPick(a._id, 'format', f)}
                            />
                            {MEETING_FORMAT_META[f]?.label || f}
                          </label>
                        ))}
                      </span>
                    )}
                  </div>
                )}

                <div className="appointments__item-actions">
                  {canAccept && (
                    <>
                      <button type="button" className="appointments__btn appointments__btn--accept" disabled={busyId === a._id} onClick={() => act(a, 'accept')}>Accepter</button>
                      <button type="button" className="appointments__btn appointments__btn--reject" disabled={busyId === a._id} onClick={() => act(a, 'reject')}>Refuser</button>
                    </>
                  )}
                  {canComplete && (
                    <button type="button" className="appointments__btn" disabled={busyId === a._id} onClick={() => act(a, 'complete')}>Marquer terminé</button>
                  )}
                  {canCancel && (
                    <button type="button" className="appointments__btn appointments__btn--cancel" disabled={busyId === a._id} onClick={() => act(a, 'cancel')}>Annuler</button>
                  )}
                </div>
              </li>
            );
          })}
        </ul>
      )}

      {modalOpen && (
        <AppointmentModal
          initiatorRole={initiatorRole}
          studentId={studentId}
          teachers={teachers}
          onClose={() => setModalOpen(false)}
          onCreated={(appt) => setAppointments((prev) => [{ ...appt, iAmInitiator: true, iAmRecipient: false }, ...prev])}
        />
      )}
    </div>
  );
}
