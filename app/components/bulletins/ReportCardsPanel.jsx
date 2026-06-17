'use client';
import { useState, useEffect, useMemo, useCallback } from 'react';
import { computeClassReport, PERIOD_LABELS } from '../../../utils/bulletins';
import {
  generateReportCards,
  fetchClassReportCards,
  APPRECIATION_BANK,
} from './bulletinsApi';
import { downloadBulletinPdf } from './bulletinPdf';

function studentName(e) {
  const prenoms = Array.isArray(e.prenoms) ? e.prenoms.join(' ') : (e.prenoms || '');
  return `${e.nom || ''} ${prenoms}`.trim();
}

const PERIODS = ['TRIMESTRE_1', 'TRIMESTRE_2', 'TRIMESTRE_3', 'ANNUEL'];

/**
 * Génération des bulletins (côté professeur) : saisie des appréciations,
 * aperçu des moyennes calculées, génération (gel en base) puis téléchargement PDF.
 */
export default function ReportCardsPanel({ classId, eleves = [], defaultYear, className }) {
  // Années disponibles : config classe + années présentes dans les données élèves.
  const years = useMemo(() => {
    const set = new Set();
    if (defaultYear) set.add(defaultYear);
    eleves.forEach((e) => {
      Object.keys(e.compositions || {}).forEach((y) => set.add(y));
      Object.keys(e.notes || {}).forEach((y) => set.add(y));
    });
    return Array.from(set).sort().reverse();
  }, [eleves, defaultYear]);

  const [schoolYear, setSchoolYear] = useState(defaultYear || years[0] || '');
  const [period, setPeriod] = useState('TRIMESTRE_1');
  const [appreciations, setAppreciations] = useState({}); // { studentId: { general } }
  const [generatedMap, setGeneratedMap] = useState({}); // studentId -> card
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState('');
  const [msg, setMsg] = useState('');

  // Aperçu calculé localement (même moteur que le serveur)
  const report = useMemo(
    () => computeClassReport(eleves, schoolYear, period),
    [eleves, schoolYear, period]
  );

  // Charge les bulletins déjà générés pour pré-remplir appréciations + téléchargements.
  const loadExisting = useCallback(async () => {
    if (!schoolYear) return;
    setError('');
    setMsg('');
    try {
      const cards = await fetchClassReportCards(classId, { schoolYear, period });
      const map = {};
      const appr = {};
      for (const c of cards) {
        map[String(c.studentId)] = c;
        appr[String(c.studentId)] = { general: c.generalAppreciation || '' };
      }
      setGeneratedMap(map);
      setAppreciations(appr);
    } catch (e) {
      setError(e.message);
    }
  }, [classId, schoolYear, period]);

  useEffect(() => { loadExisting(); }, [loadExisting]);

  const setGeneral = (studentId, value) =>
    setAppreciations((prev) => ({ ...prev, [studentId]: { ...prev[studentId], general: value } }));

  const appendPhrase = (studentId, phrase) =>
    setAppreciations((prev) => {
      const cur = prev[studentId]?.general || '';
      const next = cur ? `${cur} ${phrase}` : phrase;
      return { ...prev, [studentId]: { ...prev[studentId], general: next } };
    });

  const handleGenerate = async () => {
    setGenerating(true);
    setError('');
    setMsg('');
    try {
      const res = await generateReportCards(classId, { schoolYear, period, appreciations });
      const map = {};
      for (const c of res.cards) map[String(c.studentId)] = c;
      setGeneratedMap(map);
      setMsg(`${res.count} bulletin(s) généré(s) pour ${PERIOD_LABELS[period]} ${schoolYear}.`);
    } catch (e) {
      setError(e.message);
    } finally {
      setGenerating(false);
    }
  };

  const download = (studentId) => {
    const card = generatedMap[studentId];
    const eleve = eleves.find((e) => String(e._id) === String(studentId));
    if (card) downloadBulletinPdf(card, { studentName: studentName(eleve || {}), className });
  };

  const hasData = report.perStudent.some((p) => p.general !== null);
  // Notes simples (format `notes`) : pas de ventilation par trimestre → moyennes
  // identiques quelle que soit la période. On le signale honnêtement au prof.
  const notesOnly = hasData && report.perStudent
    .filter((p) => p.general !== null)
    .every((p) => p.source === 'notes');

  return (
    <div className="bulletins">
      <div className="bulletins__controls">
        <label className="bulletins__field">
          <span>Année</span>
          <select value={schoolYear} onChange={(e) => setSchoolYear(e.target.value)}>
            {years.map((y) => <option key={y} value={y}>{y}</option>)}
          </select>
        </label>
        <label className="bulletins__field">
          <span>Période</span>
          <select value={period} onChange={(e) => setPeriod(e.target.value)}>
            {PERIODS.map((p) => <option key={p} value={p}>{PERIOD_LABELS[p]}</option>)}
          </select>
        </label>
        <button
          type="button"
          className="bulletins__generate"
          onClick={handleGenerate}
          disabled={generating || !hasData}
        >
          {generating ? 'Génération…' : `Générer les bulletins`}
        </button>
      </div>

      {error && <div className="bulletins__error">{error}</div>}
      {msg && <div className="bulletins__msg">{msg}</div>}
      {notesOnly && (
        <div className="bulletins__notice">
          ⓘ Notes simples (non ventilées par trimestre) : la moyenne sera identique pour toutes les périodes.
        </div>
      )}

      {!hasData ? (
        <p className="bulletins__empty">
          Aucune note exploitable pour {PERIOD_LABELS[period]} {schoolYear}.
        </p>
      ) : (
        <ul className="bulletins__list">
          {report.perStudent
            .filter((p) => p.general !== null)
            .sort((a, b) => b.general - a.general)
            .map((p) => {
              const eleve = eleves.find((e) => String(e._id) === String(p.studentId)) || {};
              const card = generatedMap[p.studentId];
              return (
                <li key={p.studentId} className="bulletins__row">
                  <div className="bulletins__head">
                    <span className="bulletins__rank">{report.rank[p.studentId]}</span>
                    <span className="bulletins__name">{studentName(eleve)}</span>
                    <span className="bulletins__avg">{p.general.toFixed(2)}/20</span>
                    {card && (
                      <button type="button" className="bulletins__dl" onClick={() => download(p.studentId)}>
                        📄 PDF
                      </button>
                    )}
                  </div>
                  <textarea
                    className="bulletins__appr"
                    rows={2}
                    placeholder="Appréciation générale…"
                    value={appreciations[p.studentId]?.general || ''}
                    onChange={(e) => setGeneral(p.studentId, e.target.value)}
                  />
                  <div className="bulletins__bank">
                    {APPRECIATION_BANK.map((phrase) => (
                      <button
                        key={phrase}
                        type="button"
                        className="bulletins__tag"
                        onClick={() => appendPhrase(p.studentId, phrase)}
                      >
                        {phrase}
                      </button>
                    ))}
                  </div>
                </li>
              );
            })}
        </ul>
      )}
    </div>
  );
}
