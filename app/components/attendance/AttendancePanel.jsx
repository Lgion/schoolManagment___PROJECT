'use client';
import { useState, useEffect, useCallback, useMemo } from 'react';
import { getEleveImagePath } from '../../../utils/imageUtils';
import {
  saveAttendance,
  fetchSession,
  STATUS_META,
  nextStatus,
} from './attendanceApi';

function studentName(e) {
  const prenoms = Array.isArray(e.prenoms) ? e.prenoms.join(' ') : (e.prenoms || '');
  return `${e.nom || ''} ${prenoms}`.trim();
}

// 'YYYY-MM-DD' local (cohérent avec <input type="date">).
function todayLocal() {
  const d = new Date();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${d.getFullYear()}-${m}-${day}`;
}

const PERIOD_OPTIONS = [
  { value: 'MATIN', label: 'Matin' },
  { value: 'APRES_MIDI', label: 'Après-midi' },
];

/**
 * Écran d'appel (côté professeur), inspiré de Klassly.
 * - Trombinoscope : tous les élèves « Présents » (vert) par défaut.
 * - Clic sur une carte : Présent → Absent → Retard → Présent.
 * - Bandeau récapitulatif collant + bouton « Valider l'appel ».
 */
export default function AttendancePanel({ classId, eleves = [] }) {
  const [date, setDate] = useState(todayLocal);
  const [period, setPeriod] = useState('MATIN');
  const [statuses, setStatuses] = useState({}); // { studentId: 'PRESENT' | ... }
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [savedMsg, setSavedMsg] = useState('');
  const [error, setError] = useState('');

  const studentIds = useMemo(() => eleves.map((e) => e._id), [eleves]);

  // Charge la session existante du jour/période et pré-remplit les statuts
  // (tous Présents par défaut, écrasés par ce qui a déjà été enregistré).
  const loadSession = useCallback(async () => {
    if (studentIds.length === 0) { setLoading(false); return; }
    setLoading(true);
    setError('');
    setSavedMsg('');
    try {
      const { entries } = await fetchSession(classId, date, period);
      const saved = {};
      for (const en of entries || []) saved[String(en.studentId)] = en.status;
      const next = {};
      for (const id of studentIds) next[id] = saved[String(id)] || 'PRESENT';
      setStatuses(next);
    } catch (e) {
      setError(e.message);
      // Repli : tout le monde présent
      setStatuses(Object.fromEntries(studentIds.map((id) => [id, 'PRESENT'])));
    } finally {
      setLoading(false);
    }
  }, [classId, date, period, studentIds]);

  useEffect(() => { loadSession(); }, [loadSession]);

  const cycle = (id) => {
    setSavedMsg('');
    setStatuses((prev) => ({ ...prev, [id]: nextStatus(prev[id] || 'PRESENT') }));
  };

  const summary = useMemo(() => {
    const acc = { PRESENT: 0, ABSENT: 0, LATE: 0, EXCUSED: 0 };
    for (const id of studentIds) acc[statuses[id] || 'PRESENT'] += 1;
    return acc;
  }, [statuses, studentIds]);

  const handleValidate = async () => {
    setSaving(true);
    setError('');
    setSavedMsg('');
    try {
      const entries = studentIds.map((id) => ({ studentId: id, status: statuses[id] || 'PRESENT' }));
      const res = await saveAttendance(classId, { date, period, entries });
      setSavedMsg(`Appel validé — ${res.summary.PRESENT} présents, ${res.summary.ABSENT} absents, ${res.summary.LATE} retards.`);
    } catch (e) {
      setError(e.message);
    } finally {
      setSaving(false);
    }
  };

  if (eleves.length === 0) {
    return <p className="attendance__empty">Aucun élève dans cette classe.</p>;
  }

  return (
    <div className="attendance">
      {/* Sélecteurs jour / période */}
      <div className="attendance__controls">
        <label className="attendance__field">
          <span>Date</span>
          <input
            type="date"
            value={date}
            max={todayLocal()}
            onChange={(e) => setDate(e.target.value)}
          />
        </label>
        <div className="attendance__periods" role="group" aria-label="Période">
          {PERIOD_OPTIONS.map((p) => (
            <button
              key={p.value}
              type="button"
              className={`attendance__period ${period === p.value ? '--active' : ''}`}
              onClick={() => setPeriod(p.value)}
            >
              {p.label}
            </button>
          ))}
        </div>
      </div>

      {error && <div className="attendance__error">{error}</div>}

      {/* Trombinoscope */}
      {loading ? (
        <p className="attendance__loading">Chargement de l'appel…</p>
      ) : (
        <ul className="attendance__grid">
          {eleves.map((e) => {
            const status = statuses[e._id] || 'PRESENT';
            const meta = STATUS_META[status];
            return (
              <li key={e._id}>
                <button
                  type="button"
                  className={`attendance__card attendance__card--${meta.mod}`}
                  onClick={() => cycle(e._id)}
                  title={`${studentName(e)} — ${meta.label} (cliquer pour changer)`}
                >
                  <span className="attendance__badge">{meta.icon}</span>
                  <img
                    className="attendance__avatar"
                    src={getEleveImagePath(e)}
                    alt={studentName(e)}
                    onError={(ev) => { ev.target.src = '/school/student.webp'; }}
                  />
                  <span className="attendance__name">{studentName(e)}</span>
                  <span className="attendance__status">{meta.label}</span>
                </button>
              </li>
            );
          })}
        </ul>
      )}

      {/* Bandeau récapitulatif collant */}
      <div className="attendance__summary">
        <div className="attendance__totals">
          <span className="attendance__total attendance__total--present">
            {STATUS_META.PRESENT.icon} {summary.PRESENT} {STATUS_META.PRESENT.short}
          </span>
          <span className="attendance__total attendance__total--absent">
            {STATUS_META.ABSENT.icon} {summary.ABSENT} {STATUS_META.ABSENT.short}
          </span>
          <span className="attendance__total attendance__total--late">
            {STATUS_META.LATE.icon} {summary.LATE} {STATUS_META.LATE.short}
          </span>
        </div>
        {savedMsg && <span className="attendance__saved">{savedMsg}</span>}
        <button
          type="button"
          className="attendance__validate"
          onClick={handleValidate}
          disabled={saving || loading}
        >
          {saving ? 'Enregistrement…' : 'Valider l\'appel'}
        </button>
      </div>
    </div>
  );
}
