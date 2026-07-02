"use client"

import React, { useState, useEffect, useRef } from 'react'
import {
  validateEvents,
  planningToEvents,
  daysToDisplay,
  dayOfWeekToJour,
  timeToMinutes,
  minutesToTime,
} from '../../utils/scheduleEvents'
import SubjectsPalette from './SubjectsPalette'
import ImageScanner from './ui/ImageScanner'

/**
 * ScheduleEditor — édition d'un emploi du temps au format `events[]`.
 *
 * Refonte : abandon de la grille à heures figées. On édite une liste d'événements
 * par jour (horaires libres), avec des cours et des pauses. La position visuelle
 * proportionnelle est gérée par le Viewer ; ici on privilégie une saisie fiable.
 */
const subjectIdOf = (subjectId) =>
  subjectId && typeof subjectId === 'object' ? (subjectId._id || subjectId.id || '') : (subjectId || '')

const ScheduleEditor = ({ classeId, classe, schedule, onSave, onCancel }) => {
  const [subjects, setSubjects] = useState([])
  const [teachers, setTeachers] = useState([])
  const [label, setLabel] = useState('')
  const [events, setEvents] = useState([])
  const [validFrom, setValidFrom] = useState('')
  const [validUntil, setValidUntil] = useState('')
  const [mediaSourceUrls, setMediaSourceUrls] = useState([])
  const [pendingMediaFile, setPendingMediaFile] = useState(null)
  const [pendingMediaPreview, setPendingMediaPreview] = useState(null)
  const [uploadingMedia, setUploadingMedia] = useState(false)
  const [saving, setSaving] = useState(false)
  const [validationErrors, setValidationErrors] = useState([])
  const [aiAnalysisResults, setAiAnalysisResults] = useState(null)
  
  const subjectsPaletteRef = useRef(null)

  // Identifiant client stable par événement : indispensable pour conserver le focus
  // des inputs quand les créneaux se réordonnent (tri par heure) en cours de saisie.
  const uidRef = useRef(0)
  const nextUid = () => (uidRef.current += 1)

  useEffect(() => {
    loadSubjects()
    loadTeachers()
  }, [])

  useEffect(() => {
    if (schedule) {
      setLabel(schedule.label || '')
      const initial = Array.isArray(schedule.events) && schedule.events.length
        ? schedule.events
        : planningToEvents(schedule.planning)
      setEvents(initial.map((e) => ({ ...e, subjectId: subjectIdOf(e.subjectId), _uid: nextUid() })))
      setValidFrom(schedule.validFrom ? String(schedule.validFrom).slice(0, 10) : '')
      setValidUntil(schedule.validUntil ? String(schedule.validUntil).slice(0, 10) : '')
      setMediaSourceUrls(schedule.mediaSourceUrls || [])
    } else {
      setLabel('')
      setEvents([])
      setValidFrom('')
      setValidUntil('')
      setMediaSourceUrls([])
    }
  }, [schedule])

  const loadSubjects = async () => {
    try {
      const response = await fetch('/api/subjects', { credentials: 'include' })
      const data = await response.json()
      if (data.success) {
        setSubjects(data.data)
      } else {
        const publicResponse = await fetch('/api/public/subjects', { credentials: 'include' })
        const publicData = await publicResponse.json()
        if (publicData.success && publicData.data) setSubjects(publicData.data)
      }
    } catch (error) {
      console.error('Erreur lors du chargement des matières:', error)
    }
  }

  const loadTeachers = async () => {
    try {
      const response = await fetch('/api/school_ai/enseignants', { credentials: 'include' })
      const data = await response.json()
      if (Array.isArray(data)) {
        setTeachers(data)
      }
    } catch (error) {
      console.error('Erreur lors du chargement des enseignants:', error)
    }
  }

  // Jours affichés : lun–ven + tout jour ayant déjà un événement.
  const days = daysToDisplay(events)

  const addEvent = (dayOfWeek, type) => {
    // Place le nouvel événement après le dernier du jour, sinon à 08:00.
    const dayEvents = events.filter((e) => e.dayOfWeek === dayOfWeek)
    const last = dayEvents.sort((a, b) => timeToMinutes(b.endTime) - timeToMinutes(a.endTime))[0]
    const startTime = last ? last.endTime : '08:00'
    const startMin = timeToMinutes(startTime)
    const duration = type === 'BREAK' ? 15 : 60
    const endTime = minutesToTime(startMin + duration)
    
    setEvents((prev) => [
      ...prev,
      {
        _uid: nextUid(),
        dayOfWeek,
        startTime,
        endTime,
        type,
        subjectId: type === 'COURSE' ? (subjects[0]?._id || '') : null,
        teacherId: '',
        label: type === 'COURSE' ? '' : (type === 'BREAK' ? 'Pause' : 'Événement'),
        notes: '',
      },
    ])
  }

  const adjustEventDuration = (target, deltaMinutes) => {
    setEvents((prev) => prev.map((e) => {
      if (e !== target) return e;
      const startMin = timeToMinutes(e.startTime);
      const endMin = timeToMinutes(e.endTime);
      let newEndMin = endMin + deltaMinutes;
      if (newEndMin <= startMin) newEndMin = startMin + 5; // minimum 5 mins
      if (newEndMin > 24 * 60 - 1) newEndMin = 24 * 60 - 1;
      return { ...e, endTime: minutesToTime(newEndMin) };
    }));
  };

  const moveEvent = (dow, index, direction) => {
    setEvents((prev) => {
      const dayEvents = prev.filter(e => e.dayOfWeek === dow).sort((a, b) => timeToMinutes(a.startTime) - timeToMinutes(b.startTime));
      if (index + direction < 0 || index + direction >= dayEvents.length) return prev;
      
      const target = dayEvents[index];
      const swapWith = dayEvents[index + direction];
      
      return prev.map(e => {
        if (e === target) {
          return { ...e, startTime: swapWith.startTime, endTime: swapWith.endTime };
        }
        if (e === swapWith) {
          return { ...e, startTime: target.startTime, endTime: target.endTime };
        }
        return e;
      });
    });
  };

  const updateEvent = (target, field, value) =>
    setEvents((prev) => prev.map((e) => (e === target ? { ...e, [field]: value } : e)))

  const removeEvent = (target) =>
    setEvents((prev) => prev.filter((e) => e !== target))

  const handleImageCapture = async (file) => {
    if (!file) return;
    try {
      setUploadingMedia(true);
      
      // 1. Stocker le fichier localement sans l'uploader vers Cloudinary tout de suite
      setPendingMediaFile(file);
      setPendingMediaPreview(URL.createObjectURL(file));

      // 2. Traitement IA immédiat
      try {
        const aiFormData = new FormData();
        aiFormData.append('image', file);
        aiFormData.append('subjects', JSON.stringify(subjects));
        
        // Récupère les infos de classe pour l'IA (nom/alias)
        aiFormData.append('classeId', classeId);
        if (classe) {
          aiFormData.append('classeNiveau', classe.niveau || '');
          aiFormData.append('classeAlias', classe.alias || '');
        }

        const aiRes = await fetch('/api/school_ai/extract-schedule', {
          method: 'POST',
          body: aiFormData
        });

        const aiData = await aiRes.json();
        if (aiData.success && aiData.data) {
           const matched = [];
           const unmatched = [];
           
           const newEvents = aiData.data.map(item => {
              let subjectId = null;
              if (item.type === 'COURS' && item.subjectName) {
                 const match = subjects.find(s => s.nom.toLowerCase() === item.subjectName.toLowerCase());
                 if (match) {
                   subjectId = match._id;
                   if (!matched.includes(match.nom)) matched.push(match.nom);
                 } else {
                   if (!unmatched.includes(item.subjectName)) unmatched.push(item.subjectName);
                 }
              }

              return {
                 _uid: nextUid(),
                 dayOfWeek: parseInt(item.jour) || 1,
                 startTime: item.startTime,
                 endTime: item.endTime,
                 type: item.type === 'PAUSE' ? 'BREAK' : 'COURSE',
                 subjectId: subjectId,
                 label: item.type === 'PAUSE' ? 'Pause' : '',
                 notes: ''
              };
           });
           
           setAiAnalysisResults({
             show: true,
             matched,
             unmatched,
             newEvents,
             totalExtracted: newEvents.length,
             isWrongClass: aiData.isWrongClass,
             confidenceScore: aiData.confidenceScore,
             remarks: aiData.remarks
           });
           
        } else {
           setValidationErrors(prev => [...prev, aiData.error || "Erreur lors de l'analyse IA du document"]);
        }
      } catch (aiErr) {
        console.error(aiErr);
        setValidationErrors(prev => [...prev, "Erreur réseau lors de l'analyse IA"]);
      }
    } catch (err) {
      setValidationErrors(prev => [...prev, err.message || "Erreur de traitement de l'image"]);
    } finally {
      setUploadingMedia(false);
    }
  };

  const handleSave = async () => {
    try {
      setSaving(true)
      const validation = validateEvents(events)
      if (!validation.isValid) {
        setValidationErrors(validation.errors)
        return
      }
      setValidationErrors([])

      let finalMediaUrls = [...mediaSourceUrls];
      
      // Upload le fichier en attente vers Cloudinary SEULEMENT à la sauvegarde
      if (pendingMediaFile) {
        try {
          const formData = new FormData();
          formData.append('type', 'schedule');
          formData.append('entityType', 'schedule');
          formData.append('payload', JSON.stringify({ classeId }));
          formData.append('file', pendingMediaFile);

          const res = await fetch('/api/school_ai/media', {
            method: 'POST',
            body: formData,
          });

          const data = await res.json();
          if (data.success && data.paths && data.paths.length > 0) {
            finalMediaUrls.push(data.paths[0]);
          } else {
            setValidationErrors([data.error || "Erreur lors de l'upload du document final"]);
            setSaving(false);
            return;
          }
        } catch (err) {
          console.error(err);
          setValidationErrors(["Erreur réseau lors de l'upload du document"]);
          setSaving(false);
          return;
        }
      }

      // _id absent (création ou duplication) ⇒ POST ; sinon mise à jour.
      const isEdit = Boolean(schedule && schedule._id)
      const url = isEdit ? `/api/schedules/${schedule._id}` : '/api/schedules'
      const method = isEdit ? 'PUT' : 'POST'
      const payload = {
        classeId,
        label,
        events: events.map(({ _uid, ...e }) => e), // retire l'id client
        validFrom: validFrom || undefined,
        validUntil: validUntil || null,
        mediaSourceUrls: finalMediaUrls,
      }

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(payload),
      })
      const data = await response.json()

      if (data.success) {
        onSave()
      } else {
        if (Array.isArray(data.details)) setValidationErrors(data.details)
        throw new Error(data.error || 'Erreur lors de la sauvegarde')
      }
    } catch (error) {
      console.error('Erreur lors de la sauvegarde:', error)
    } finally {
      setSaving(false)
    }
  }

  const subjectColor = (id) => subjects.find((s) => s._id === id)?.couleur || '#95a5a6'

  return (
    <div className="scheduleEditor">
      <header className="scheduleEditor__header">
        <div className="scheduleEditor__header-content">
          <h2 className="scheduleEditor__title">
            {schedule?._id ? 'Modifier l\'emploi du temps' : 'Créer un emploi du temps'}
          </h2>

          <div className="scheduleEditor__form-group">
            <label className="scheduleEditor__label">Nom de l'emploi du temps</label>
            <input
              type="text"
              className="scheduleEditor__input"
              value={label}
              onChange={(e) => setLabel(e.target.value)}
              placeholder="Ex: Emploi du temps CM1 - Semestre 1"
            />
          </div>

          <div className="scheduleEditor__validity">
            <label className="scheduleEditor__form-group">
              <span className="scheduleEditor__label">Valable à partir du</span>
              <input type="date" className="scheduleEditor__input" value={validFrom} onChange={(e) => setValidFrom(e.target.value)} />
            </label>
            <label className="scheduleEditor__form-group">
              <span className="scheduleEditor__label">Jusqu'au (optionnel)</span>
              <input type="date" className="scheduleEditor__input" value={validUntil} onChange={(e) => setValidUntil(e.target.value)} />
            </label>
          </div>
          
          <div className="scheduleEditor__document" style={{ marginTop: '1rem', padding: '1rem', background: 'rgba(0,0,0,0.02)', borderRadius: '8px' }}>
             <label className="scheduleEditor__label">Document original (optionnel)</label>
             <p style={{ fontSize: '0.85rem', color: '#666', marginBottom: '10px' }}>Chargez un scan, une photo ou un PDF de l'emploi du temps complet de la classe.</p>
             {(mediaSourceUrls.length > 0 || pendingMediaPreview) && (
               <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px', marginBottom: '10px' }}>
                 {mediaSourceUrls.map((url, i) => (
                   <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '10px', background: 'white', padding: '4px 8px', borderRadius: '6px', border: '1px solid #eee' }}>
                     <span style={{ color: 'green', fontSize: '0.8rem', fontWeight: 'bold' }}>✅ Page {i + 1} attachée</span>
                     <button type="button" className="scheduleEditor__remove-btn" onClick={() => setMediaSourceUrls(prev => prev.filter((_, idx) => idx !== i))} style={{ padding: '2px 6px', width: 'auto', height: 'auto', position: 'static', opacity: 1 }}>Retirer</button>
                   </div>
                 ))}
                 {pendingMediaPreview && (
                   <div style={{ display: 'flex', alignItems: 'center', gap: '10px', background: '#fff3e0', padding: '4px 8px', borderRadius: '6px', border: '1px solid #ffe0b2' }}>
                     <span style={{ color: '#e65100', fontSize: '0.8rem', fontWeight: 'bold' }}>⏳ Document en attente (sauvegarder pour l'attacher)</span>
                     <button type="button" className="scheduleEditor__remove-btn" onClick={() => { setPendingMediaFile(null); setPendingMediaPreview(null); }} style={{ padding: '2px 6px', width: 'auto', height: 'auto', position: 'static', opacity: 1, color: '#d84315' }}>Retirer</button>
                   </div>
                 )}
               </div>
             )}
             <ImageScanner
               label={uploadingMedia ? "Envoi en cours..." : "Charger un document visuel"}
               onCapture={handleImageCapture}
               disabled={uploadingMedia}
               acceptTypes="image/*,application/pdf"
               className="--compact"
             />
             
             {aiAnalysisResults && aiAnalysisResults.show && (
               <div style={{ padding: '15px', background: '#e1f5fe', borderRadius: '8px', marginBottom: '20px', border: '1px solid #81d4fa' }}>
                 <h4 style={{ margin: '0 0 10px 0', color: '#0277bd' }}>🤖 Analyse IA terminée ({aiAnalysisResults.totalExtracted} créneaux trouvés)</h4>
                 
                 {aiAnalysisResults.isWrongClass && (
                   <div style={{ padding: '10px', background: '#fff3cd', color: '#856404', borderRadius: '6px', marginBottom: '10px', border: '1px solid #ffeeba' }}>
                     <strong>⚠️ Classe incorrecte :</strong> L'IA a détecté que ce document ne correspond pas à la classe sélectionnée !
                   </div>
                 )}
                 {aiAnalysisResults.remarks && (
                   <div style={{ padding: '10px', background: '#f8f9fa', color: '#495057', borderRadius: '6px', marginBottom: '10px', border: '1px solid #dee2e6' }}>
                     <strong>💡 Remarque de l'IA :</strong> {aiAnalysisResults.remarks}
                   </div>
                 )}
                 {aiAnalysisResults.confidenceScore < 7 && (
                   <div style={{ padding: '10px', background: '#fff0f0', color: '#c62828', borderRadius: '6px', marginBottom: '10px', border: '1px solid #ffcdd2' }}>
                     <strong>🔍 Lisibilité moyenne :</strong> L'IA a eu du mal à lire certaines parties ({aiAnalysisResults.confidenceScore}/10). Vérifiez bien les créneaux.
                   </div>
                 )}

                 <div style={{ display: 'flex', gap: '20px', fontSize: '0.9rem', marginBottom: '15px' }}>
                   <div style={{ flex: 1 }}>
                     <strong style={{ color: '#2e7d32' }}>Matières reconnues ({aiAnalysisResults.matched.length}) :</strong>
                     <ul style={{ paddingLeft: '20px', margin: '5px 0' }}>
                       {aiAnalysisResults.matched.map(m => <li key={m}>{m}</li>)}
                     </ul>
                   </div>
                   <div style={{ flex: 1 }}>
                     <strong style={{ color: '#c62828' }}>Matières non reconnues ({aiAnalysisResults.unmatched.length}) :</strong>
                     <ul style={{ paddingLeft: '20px', margin: '5px 0', listStyle: 'none' }}>
                       {aiAnalysisResults.unmatched.map(u => (
                         <li key={u} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '4px' }}>
                           <span>{u}</span>
                           <button 
                             type="button" 
                             onClick={() => subjectsPaletteRef.current?.openSubjectModal(null, u)}
                             style={{ background: '#3498db', color: 'white', border: 'none', borderRadius: '4px', padding: '2px 6px', cursor: 'pointer', fontSize: '0.7rem' }}
                           >
                             Créer
                           </button>
                         </li>
                       ))}
                     </ul>
                   </div>
                 </div>
                 
                 <div style={{ display: 'flex', gap: '10px' }}>
                   <button 
                     type="button" 
                     onClick={() => {
                       setEvents(aiAnalysisResults.newEvents);
                       setAiAnalysisResults(null);
                     }}
                     style={{ background: '#0277bd', color: 'white', border: 'none', padding: '6px 12px', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold' }}
                   >
                     Remplacer l'emploi du temps
                   </button>
                   <button 
                     type="button" 
                     onClick={() => {
                       setEvents(prev => [...prev, ...aiAnalysisResults.newEvents]);
                       setAiAnalysisResults(null);
                     }}
                     style={{ background: '#fff', color: '#0277bd', border: '1px solid #0277bd', padding: '6px 12px', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold' }}
                   >
                     Ajouter les créneaux
                   </button>
                 </div>
               </div>
             )}
          </div>
        </div>

        <div className="scheduleEditor__actions">
          <button className="scheduleEditor__btn scheduleEditor__btn--cancel" onClick={onCancel}>Annuler</button>
          <button className="scheduleEditor__btn scheduleEditor__btn--save" onClick={handleSave} disabled={saving}>
            {saving ? 'Sauvegarde...' : 'Sauvegarder'}
          </button>
        </div>
      </header>

      {validationErrors.length > 0 && (
        <div className="scheduleEditor__errors">
          <h3 className="scheduleEditor__errors-title">⚠️ Erreurs de validation</h3>
          <ul className="scheduleEditor__errors-list">
            {validationErrors.map((error, index) => (
              <li key={index} className="scheduleEditor__error">{error}</li>
            ))}
          </ul>
        </div>
      )}

      <div style={{ background: '#e3f2fd', padding: '15px 20px', borderRadius: '8px', border: '1px solid #bbdefb', display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px', gap: '20px', flexWrap: 'wrap' }}>
        <div style={{ flex: '1 1 300px' }}>
          <h4 style={{ margin: '0 0 5px 0', color: '#1565c0', fontSize: '1rem' }}>📄 Modèle d'emploi du temps officiel</h4>
          <p style={{ margin: 0, color: '#1e88e5', fontSize: '0.85rem', lineHeight: '1.4' }}>Téléchargez ce modèle vierge, remplissez-le et scannez-le ci-dessus pour que l'IA remplisse la grille automatiquement avec 100% de fiabilité.</p>
        </div>
        <a href="/templates/modele-emploi-du-temps.pdf" target="_blank" rel="noopener noreferrer" style={{ background: '#1976d2', color: 'white', padding: '8px 16px', borderRadius: '6px', textDecoration: 'none', fontWeight: 'bold', fontSize: '0.9rem', whiteSpace: 'nowrap' }}>
          ⬇️ Télécharger le modèle PDF
        </a>
      </div>

      <div className="scheduleEditor__days">
        {days.map((dow) => {
          const jour = dayOfWeekToJour(dow)
          const dayEvents = events
            .filter((e) => e.dayOfWeek === dow)
            .sort((a, b) => timeToMinutes(a.startTime) - timeToMinutes(b.startTime))
          return (
            <section key={dow} className="scheduleEditor__day">
              <h3 className="scheduleEditor__day-title">{jour.charAt(0).toUpperCase() + jour.slice(1)}</h3>

              <div className="scheduleEditor__day-events">
                {dayEvents.length === 0 && (
                  <p className="scheduleEditor__day-empty">Aucun créneau</p>
                )}
                {dayEvents.map((e, index) => (
                  <div
                    key={e._uid}
                    className={`scheduleEditor__row scheduleEditor__row--${e.type.toLowerCase()}`}
                  >
                    <div className="scheduleEditor__controls">
                      <button className="scheduleEditor__ctrl-btn" disabled={index === 0} onClick={() => moveEvent(dow, index, -1)}>↑</button>
                      <button className="scheduleEditor__ctrl-btn" disabled={index === dayEvents.length - 1} onClick={() => moveEvent(dow, index, 1)}>↓</button>
                    </div>
                    <input
                      type="time"
                      className="scheduleEditor__time"
                      value={e.startTime}
                      onChange={(ev) => updateEvent(e, 'startTime', ev.target.value)}
                    />
                    <span className="scheduleEditor__time-sep">→</span>
                    <input
                      type="time"
                      className="scheduleEditor__time"
                      value={e.endTime}
                      onChange={(ev) => updateEvent(e, 'endTime', ev.target.value)}
                    />
                    {e.type === 'BREAK' && (
                      <div className="scheduleEditor__break-controls">
                        <button className="scheduleEditor__ctrl-btn" onClick={() => adjustEventDuration(e, -5)} title="-5 min">-</button>
                        <button className="scheduleEditor__ctrl-btn" onClick={() => adjustEventDuration(e, 5)} title="+5 min">+</button>
                      </div>
                    )}

                    {e.type === 'COURSE' ? (
                      <>
                        <div className="scheduleEditor__course-controls" style={{ display: 'flex', gap: '4px', margin: '0 8px' }}>
                          <button className="scheduleEditor__ctrl-btn" onClick={() => adjustEventDuration(e, -15)} title="-15 min">-</button>
                          <button className="scheduleEditor__ctrl-btn" onClick={() => adjustEventDuration(e, 15)} title="+15 min">+</button>
                        </div>
                        <select
                          className="scheduleEditor__subject-select"
                          value={e.subjectId || ''}
                          onChange={(ev) => updateEvent(e, 'subjectId', ev.target.value)}
                          style={{ backgroundColor: subjectColor(e.subjectId) }}
                        >
                          <option value="">— Matière —</option>
                          {subjects.map((subject) => (
                            <option key={subject._id} value={subject._id}>{subject.nom}</option>
                          ))}
                        </select>
                        <select
                          className="scheduleEditor__subject-select scheduleEditor__teacher-select"
                          value={e.teacherId || ''}
                          onChange={(ev) => updateEvent(e, 'teacherId', ev.target.value)}
                          style={{ backgroundColor: e.teacherId ? '#e1f5fe' : '#f5f5f5', color: e.teacherId ? '#0277bd' : '#666' }}
                        >
                          <option value="">— Prof (Auto) —</option>
                          {teachers.map((t) => (
                            <option key={t._id} value={t._id}>
                              {t.nom} {Array.isArray(t.prenoms) ? t.prenoms.join(' ') : t.prenoms}
                            </option>
                          ))}
                        </select>
                      </>
                    ) : (
                      <input
                        type="text"
                        className="scheduleEditor__label-input"
                        placeholder={e.type === 'BREAK' ? 'Pause' : 'Événement'}
                        value={e.label || ''}
                        onChange={(ev) => updateEvent(e, 'label', ev.target.value)}
                      />
                    )}

                    <input
                      type="text"
                      className="scheduleEditor__notes-input"
                      placeholder="Notes..."
                      value={e.notes || ''}
                      onChange={(ev) => updateEvent(e, 'notes', ev.target.value)}
                    />

                    <button className="scheduleEditor__remove-btn" onClick={() => removeEvent(e)}>✕</button>
                  </div>
                ))}
              </div>

              <div className="scheduleEditor__day-add">
                <button className="scheduleEditor__add-btn" onClick={() => addEvent(dow, 'COURSE')}>+ Cours</button>
                <button className="scheduleEditor__add-btn scheduleEditor__add-btn--break" onClick={() => addEvent(dow, 'BREAK')}>+ Pause</button>
              </div>
            </section>
          )
        })}
      </div>

      <SubjectsPalette 
        ref={subjectsPaletteRef}
        classeId={classeId}
        onSubjectsChange={(updatedSubjects) => setSubjects(updatedSubjects)} 
      />
    </div>
  )
}

export default ScheduleEditor
