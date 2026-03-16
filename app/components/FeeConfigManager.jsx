"use client"

import React, { useState, useContext, useMemo } from 'react';
import { AiAdminContext } from '../../stores/ai_adminContext';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

const UNITS = ['F', 'kg', 'L', 'u', 'm'];

function generateKey(label) {
  if (!label) return '';
  return label.toLowerCase()
    .normalize("NFD").replace(/[\u0300-\u036f]/g, "") // remove accents
    .replace(/[^a-z0-z0-9]/g, '_') // replace non-alphanumeric with _
    .replace(/_+/g, '_') // collapse underscores
    .replace(/^_|_$/g, ''); // trim underscores
}

function emptyTarget() {
  return { key: '', label: '', amount: '' };
}

function emptyFee() {
  return {
    label: '',
    unit: 'F',
    targets: [],
  };
}

function emptyGlobalTarget() {
  return { key: '', options: ['', ''] };
}

// ──────────────────────────────────────────────
// Helper to handle unit selection
// ──────────────────────────────────────────────
function UnitSelector({ value, onChange }) {
  const isCustom = value && !UNITS.includes(value);
  const [showCustom, setShowCustom] = useState(isCustom);

  const handleSelectChange = (e) => {
    const val = e.target.value;
    if (val === 'CUSTOM') {
      setShowCustom(true);
      onChange('');
    } else {
      setShowCustom(false);
      onChange(val);
    }
  };

  return (
    <div className="fee-config-manager__unit-selector">
      <select
        value={showCustom ? 'CUSTOM' : value}
        onChange={handleSelectChange}
        className="fee-config-manager__select"
      >
        {UNITS.map(u => <option key={u} value={u}>{u}</option>)}
        <option value="CUSTOM">Autre...</option>
      </select>
      {showCustom && (
        <input
          type="text"
          placeholder="Unité (ex: bouteille)"
          value={value}
          onChange={e => onChange(e.target.value)}
          className="fee-config-manager__input fee-config-manager__input--unit"
          autoFocus
        />
      )}
    </div>
  );
}

// ──────────────────────────────────────────────
// Global Targets Manager (Dictionnaire de l'école)
// ──────────────────────────────────────────────
function GlobalTargetsManager({ targets, onSave, saving }) {
  const [form, setForm] = useState(emptyGlobalTarget());
  const [error, setError] = useState('');
  const [profilingType, setProfilingType] = useState('multi'); // 'boolean' | 'single' | 'multi'
  const [isExpanded, setIsExpanded] = useState(false);

  const addOption = () => setForm({ ...form, options: [...form.options, ''] });
  const updateOption = (idx, val) => {
    const next = [...form.options];
    next[idx] = val;
    setForm({ ...form, options: next });
  };
  const removeOption = (idx) => {
    if (form.options.length <= 2) return;
    setForm({ ...form, options: form.options.filter((_, i) => i !== idx) });
  };

  const handleKeyChange = (val) => {
    setForm(prev => ({ ...prev, key: val }));
    // Auto-detect type
    if (val.startsWith('is')) setProfilingType('boolean');
    else if (val.startsWith('do')) setProfilingType('single');
    else if (val.trim() !== '') setProfilingType('multi');
  };

  const handleTypeChange = (type) => {
    setProfilingType(type);
    // Adjust key prefix based on type
    const raw = form.key.replace(/^(is|do)/, '');
    let nextKey = raw;
    if (type === 'boolean') nextKey = 'is' + raw;
    else if (type === 'single') nextKey = 'do' + raw;
    setForm(prev => ({ ...prev, key: nextKey }));
  };

  const handleCreate = async () => {
    if (!form.key.trim()) return setError('Clé requise (ex: isInterne)');
    if (form.options.some(o => !o.trim())) return setError('Toutes les options doivent avoir un label');

    setError('');
    try {
      await onSave([...targets, { key: form.key.trim(), options: form.options.map(o => o.trim()) }]);
      setForm(emptyGlobalTarget());
      setProfilingType('multi');
    } catch (e) {
      setError('Erreur lors de la sauvegarde');
    }
  };

  const handleRemove = async (key) => {
    const msg = `Attention : Supprimer cette cible retirera cette information de TOUS les élèves. Continuer ?`;
    if (!window.confirm(msg)) return;
    try {
      await onSave(targets.filter(t => t.key !== key), key);
    } catch (e) {
      setError('Erreur lors de la suppression');
    }
  };

  const typeConfigs = {
    boolean: {
      desc: `Bascule entre deux états (ex: Interne/Externe). 
      L'élève appartient à la première option si sélectionné, sinon à la seconde (par défaut).`,
      placeholder: "Clé technique (ex: isInterne, isBoursier)",
      optPlaceholder: (idx) => idx === 0 ? "Interne, Boursier, ..." : "Externe, Non boursier, ..."
    },
    single: {
      desc: "Choix d'une seule option parmi plusieurs (Boutons radio). Un seul montant sera appliqué à l'élève.",
      placeholder: "Clé technique (ex: doCantinePlan, doTransport)",
      optPlaceholder: (idx) => `Option ${idx + 1}`
    },
    multi: {
      desc: "Sélection de multiples options possibles (Cases à cocher). Idéal pour les activités ou options cumulables.",
      placeholder: "Clé technique (ex: sport, langue)",
      optPlaceholder: (idx) => `Option ${idx + 1}`
    }
  };

  return (
    <div className={`fee-config-manager__targets ${isExpanded ? 'fee-config-manager__targets--expanded' : 'fee-config-manager__targets--collapsed'}`}>
      <div className="fee-config-manager__targets-header" onClick={() => setIsExpanded(!isExpanded)}>
        <h4 className="fee-config-manager__targets-title">Registre des Cibles d'élèves</h4>
        <span className="fee-config-manager__targets-toggle">{isExpanded ? '🔼 Fermer' : '🔽 Ouvrir le registre'}</span>
      </div>

      <div className="fee-config-manager__targets-content">
        {error && <div className="fee-config-manager__error">{error}</div>}

        <div className="fee-config-manager__targets-list">
          {targets.length === 0 && <p className="fee-config-manager__empty">Aucune cible définie.</p>}
          {targets.map(t => (
            <div key={t.key} className="fee-config-manager__targets-item">
              <div className="fee-config-manager__targets-item-info">
                <span className="fee-config-manager__targets-item-key">{t.key}</span>
                <span className="fee-config-manager__targets-item-options">
                  Options: {t.options.join(', ')}
                </span>
              </div>
              <button
                className="fee-config-manager__remove-btn"
                onClick={(e) => { e.stopPropagation(); handleRemove(t.key); }}
                disabled={saving}
              >×</button>
            </div>
          ))}
        </div>

        <div className="fee-config-manager__targets-form">
          <input
            type="text"
            placeholder={typeConfigs[profilingType].placeholder}
            className="fee-config-manager__input"
            value={form.key}
            onChange={e => handleKeyChange(e.target.value)}
          />
          <nav className="fee-config-manager__nav" id="fee-config-manager__nav">
            <h4 className="fee-config-manager__nav-text">Type de profilage :</h4>
            <div className="fee-config-manager__nav-options">
              <label className="profiling-type-label" title="Bascule entre deux états (ex: Interne/Externe). Utilise le préfixe 'is'.">
                <input
                  type="radio"
                  name="profilingType"
                  value="boolean"
                  checked={profilingType === 'boolean'}
                  onChange={() => handleTypeChange('boolean')}
                />
                <span className="profiling-type-text">1 Booléen</span>
              </label>
              <label className="profiling-type-label" title="Choix d'une seule option parmi plusieurs (ex: Plan de cantine: Premium, Medium, Basic). Utilise le préfixe 'do'.">
                <input
                  type="radio"
                  name="profilingType"
                  value="single"
                  checked={profilingType === 'single'}
                  onChange={() => handleTypeChange('single')}
                />
                <span className="profiling-type-text">0 ou 1 parmi N</span>
              </label>
              <label className="profiling-type-label" title="Sélection de multiple options possibles (ex: Sports pratiqués). Aucun préfixe spécifique.">
                <input
                  type="radio"
                  name="profilingType"
                  value="multi"
                  checked={profilingType === 'multi'}
                  onChange={() => handleTypeChange('multi')}
                />
                <span className="profiling-type-text">n parmi N</span>
              </label>
            </div>
            <p className="fee-config-manager__nav-desc" style={{ fontSize: '0.8rem', color: '#64748b', marginTop: '0.5rem', fontStyle: 'italic' }}>
              {typeConfigs[profilingType].desc}
            </p>
          </nav>
          <h4 className="fee-config-manager__options-label">Labels des options :</h4>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem', marginTop: '0.4rem' }}>
            {form.options.map((opt, idx) => (
              <div key={idx} style={{ display: 'flex', gap: '0.5rem' }}>
                <input
                  type="text"
                  placeholder={typeConfigs[profilingType].optPlaceholder(idx)}
                  className="fee-config-manager__input"
                  value={opt}
                  onChange={e => updateOption(idx, e.target.value)}
                />
                <button
                  type="button"
                  className="fee-config-manager__remove-btn"
                  onClick={() => removeOption(idx)}
                  disabled={form.options.length <= 2}
                >×</button>
              </div>
            ))}
            <button type="button" className="fcm-targets-editor__add-btn" onClick={addOption}>+ Ajouter une option</button>
          </div>
          <button
            type="button"
            className="fee-config-manager__add-btn"
            onClick={handleCreate}
            disabled={saving}
          >
            {saving ? '…' : '+ Créer cette cible'}
          </button>
        </div>
      </div>
    </div>
  );
}

// ──────────────────────────────────────────────
// Targets Editor for a Fee Definition
// ──────────────────────────────────────────────
function TargetsEditor({ targets, onChange, globalTargets }) {
  const allOptions = useMemo(() => {
    const list = [];
    globalTargets.forEach(gt => {
      gt.options.forEach(opt => {
        list.push({ label: opt, value: opt, group: gt.key });
      });
    });
    return list;
  }, [globalTargets]);

  const update = (idx, field, val) => {
    const next = targets.map((t, i) => {
      if (i === idx) {
        const updated = { ...t, [field]: val };
        if (field === 'label') {
          updated.key = generateKey(val);
        }
        return updated;
      }
      return t;
    });
    onChange(next);
  };

  const addTarget = () => onChange([...targets, emptyTarget()]);

  const removeTarget = (idx) => {
    if (targets.length <= 1) return;
    onChange(targets.filter((_, i) => i !== idx));
  };

  return (
    <div className="fcm-targets-editor">
      {targets.map((t, idx) => (
        <div key={idx} className="fcm-targets-editor__row">
          <input
            className="fcm-targets-editor__label-input"
            type="text"
            placeholder="Label (ex: Interne)"
            value={t.label}
            onChange={e => update(idx, 'label', e.target.value)}
            readOnly
            title="Label personnalisable affiché à l'utilisateur"
          />

          <input
            className="fcm-targets-editor__key-input"
            type="text"
            placeholder="Clé (auto)"
            value={t.key}
            readOnly
            title="Clé technique générée automatiquement"
          />
          <input
            className="fcm-targets-editor__amount-input"
            type="number"
            placeholder="Montant"
            value={t.amount}
            onChange={e => update(idx, 'amount', e.target.value)}
          />
          {/* <button
            type="button"
            className="fcm-targets-editor__remove-btn"
            onClick={() => removeTarget(idx)}
            disabled={targets.length <= 1}
            title="Supprimer ce target"
          >−</button> */}
        </div>
      ))}
    </div>
  );
}

// ──────────────────────────────────────────────
// Main component
// ──────────────────────────────────────────────
export default function FeeConfigManager() {
  const {
    feeDefinitions, feeDefinitionsLoaded, saveFeeDefinitions,
    targetDefinitions, targetDefinitionsLoaded, saveTargetDefinitions
  } = useContext(AiAdminContext);

  const [form, setForm] = useState(emptyFee());
  const [editingId, setEditingId] = useState(null);
  const [editForm, setEditForm] = useState(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [draftAmounts, setDraftAmounts] = useState({});

  // Sync draft amounts when targets change in any form
  const syncDrafts = (newTargets) => {
    const nextDrafts = { ...draftAmounts };
    let changed = false;
    newTargets.forEach(t => {
      if (t.amount !== '' && t.amount !== draftAmounts[t.key]) {
        nextDrafts[t.key] = t.amount;
        changed = true;
      }
    });
    if (changed) setDraftAmounts(nextDrafts);
  };

  const handleTargetsChange = (newTargets) => {
    setForm(prev => ({ ...prev, targets: newTargets }));
    syncDrafts(newTargets);
  };

  const handleEditTargetsChange = (newTargets) => {
    setEditForm(prev => ({ ...prev, targets: newTargets }));
    syncDrafts(newTargets);
  };

  // ── Validation ──────────────────────────────
  const validate = (fee) => {
    if (!fee.label.trim()) return 'Le libellé est requis.';
    if (!fee.unit.trim()) return 'L\'unité est requise.';
    if (!fee.targets.length) return 'Au moins un target est requis.';
    for (const t of fee.targets) {
      if (t.amount === '' || isNaN(Number(t.amount))) return 'Chaque target doit avoir un montant valide.';
    }
    return null;
  };

  const isFormIncomplete = (f) => {
    if (!f) return true;
    return !f.label.trim() || !f.unit.trim() || f.targets.length === 0 || f.targets.some(t => t.amount === '' || isNaN(Number(t.amount)));
  };

  // ── Handlers ────────────────────────────────
  const handleAdd = async () => {
    const err = validate(form);
    if (err) { setError(err); return; }
    setError('');
    const newFee = {
      id: 'fee_' + Date.now(),
      label: form.label.trim(),
      unit: form.unit.trim(),
      targets: form.targets.map(t => ({ key: t.key.trim(), label: t.label.trim(), amount: Number(t.amount) })),
    };
    setSaving(true);
    try {
      await saveFeeDefinitions([...feeDefinitions, newFee]);
      setForm(emptyFee());
    } catch {
      setError('Erreur lors de la sauvegarde.');
    } finally {
      setSaving(false);
    }
  };

  const handleRemove = async (id) => {
    if (!window.confirm('Supprimer ce type de frais ?')) return;
    setSaving(true);
    try {
      await saveFeeDefinitions(feeDefinitions.filter(d => d.id !== id));
    } catch {
      setError('Erreur lors de la suppression.');
    } finally {
      setSaving(false);
    }
  };

  const startEdit = (def) => {
    setEditingId(def.id);
    setEditForm({
      label: def.label,
      unit: def.unit,
      targets: def.targets.map(t => ({ ...t, amount: String(t.amount) })),
    });
  };

  const handleSaveEdit = async () => {
    const err = validate(editForm);
    if (err) { setError(err); return; }
    setError('');
    setSaving(true);
    try {
      const updated = feeDefinitions.map(d =>
        d.id === editingId
          ? {
            ...d,
            label: editForm.label.trim(),
            unit: editForm.unit.trim(),
            targets: editForm.targets.map(t => ({ key: t.key.trim(), label: t.label.trim(), amount: Number(t.amount) })),
          }
          : d
      );
      await saveFeeDefinitions(updated);
      setEditingId(null);
      setEditForm(null);
    } catch {
      setError('Erreur lors de la sauvegarde.');
    } finally {
      setSaving(false);
    }
  };

  const cancelEdit = () => { setEditingId(null); setEditForm(null); setError(''); };

  // ── PDF Export ──────────────────────────────
  const downloadPaymentSheet = () => {
    const doc = new jsPDF();
    const title = "Fiche de Recueil des Paiements Scolaires";
    
    doc.setFontSize(18);
    doc.text(title, 105, 20, { align: 'center' });

    // Formatting logic for Fee columns
    const fees = feeDefinitions;
    const feeColumns = [];
    const groupedInfo = []; // Track which columns are grouped (2 fees)

    for (let i = 0; i < fees.length; i++) {
        const f = fees[i];
        const label = f.label.length > 10 ? f.label.substring(0, 10) + '.' : f.label;
        
        if (i < 3) {
            // Standard individual columns
            feeColumns.push(`${label}\n(${f.unit})`);
            groupedInfo.push(false);
        } else {
            // Group by 2 starting from the 4th fee
            const f1 = fees[i];
            const f2 = fees[i + 1];
            const label1 = f1.label.length > 10 ? f1.label.substring(0, 10) + '.' : f1.label;
            
            if (f2) {
                const label2 = f2.label.length > 10 ? f2.label.substring(0, 10) + '.' : f2.label;
                feeColumns.push(`${label1} (${f1.unit})\n${label2} (${f2.unit})`);
                groupedInfo.push(true);
                i++; // Skip next since it's grouped
            } else {
                feeColumns.push(`${label1}\n(${f1.unit})`);
                groupedInfo.push(false);
            }
        }
    }

    const head = [["Nom de l'élève", "Date / Mois", ...feeColumns]];
    const body = Array.from({ length: 25 }, () => head[0].map(() => ""));

    // Width calculations (Total 100%)
    // Nom: 55%, Date: 15%, Fees: 30%
    const pageWidth = doc.internal.pageSize.getWidth();
    const margin = 14; 
    const printableWidth = pageWidth - (margin * 2);
    
    const nomWidth = printableWidth * 0.55;
    const dateWidth = printableWidth * 0.15;
    const feesTotalWidth = printableWidth * 0.30;
    const feeColWidth = feeColumns.length > 0 ? (feesTotalWidth / feeColumns.length) : 0;

    const columnStyles = {
        0: { cellWidth: nomWidth },
        1: { cellWidth: dateWidth }
    };
    feeColumns.forEach((_, i) => {
        columnStyles[i + 2] = { cellWidth: feeColWidth };
    });

    autoTable(doc, {
      startY: 30,
      head: head,
      body: body,
      theme: 'grid',
      headStyles: { 
        fillColor: [240, 240, 240], 
        textColor: [0, 0, 0], 
        lineWidth: 0.1, 
        fontSize: 9, 
        halign: 'center',
        valign: 'middle'
      },
      styles: { 
        cellPadding: 2, 
        fontSize: 10, 
        minCellHeight: 12,
        lineWidth: 0.1,
        lineColor: [0, 0, 0]
      },
      columnStyles: columnStyles,
      didDrawCell: (data) => {
        // Draw horizontal divider for grouped fee columns in the body
        const colIdx = data.column.index;
        if (colIdx >= 2 && groupedInfo[colIdx - 2] && data.section === 'body') {
            const x = data.cell.x;
            const y = data.cell.y + data.cell.height / 2;
            const w = data.cell.width;
            doc.setDrawColor(0, 0, 0);
            doc.setLineWidth(0.1);
            doc.line(x, y, x + w, y);
        }
      }
    });

    doc.save("Fiche_Paiements.pdf");
  };

  // ── Render ───────────────────────────────────
  if (!feeDefinitionsLoaded || !targetDefinitionsLoaded) {
    return <div className="fee-config-manager fee-config-manager--loading">Chargement de la configuration…</div>;
  }

  return (
    <div className="fee-config-manager">
      <div className="fee-config-manager__header-main">
        <h3 className="fee-config-manager__title">Configuration des Frais & Cibles</h3>
        <button 
          type="button" 
          className="fee-config-manager__pdf-btn"
          onClick={downloadPaymentSheet}
          title="Télécharger la fiche de recueil des paiements (PDF)"
        >
          📄 Télécharger PDF
        </button>
      </div>

      {error && <div className="fee-config-manager__error">{error}</div>}

      {/* ── Existing fees list ───────────────────────── */}
      <div className="fee-config-manager__list">
        {feeDefinitions.length === 0 && (
          <p className="fee-config-manager__empty">Aucun frais configuré.</p>
        )}
        {feeDefinitions.map(def => (
          <div key={def.id} className={`fee-config-manager__item ${editingId === def.id ? 'fee-config-manager__item--editing' : ''}`}>
            {editingId === def.id ? (
              <div className="fee-config-manager__edit-form">
                <div className="fee-config-manager__edit-row">
                  <input
                    type="text"
                    value={editForm.label}
                    onChange={e => setEditForm({ ...editForm, label: e.target.value })}
                    placeholder="Libellé"
                    className="fee-config-manager__input"
                  />
                  <UnitSelector
                    value={editForm.unit}
                    onChange={val => setEditForm({ ...editForm, unit: val })}
                  />
                  <select
                    className="fee-config-manager__select fee-config-manager__target-selector"
                    style={{ flex: 1.2 }}
                    onChange={e => {
                      const groupKey = e.target.value;
                      if (!groupKey) return;
                      const group = targetDefinitions.find(gt => gt.key === groupKey);
                      if (group) {
                        const newTargets = group.options.map(opt => {
                          const k = generateKey(opt);
                          return {
                            key: k,
                            label: opt,
                            amount: draftAmounts[k] || ''
                          };
                        });
                        setEditForm({ ...editForm, targets: newTargets });
                      }
                      e.target.value = '';
                    }}
                    value=""
                  >
                    <option value="">-- Choisir une cible --</option>
                    {targetDefinitions.map(gt => (
                      <option key={gt.key} value={gt.key}>{gt.key}</option>
                    ))}
                  </select>
                </div>
                <TargetsEditor
                  targets={editForm.targets}
                  onChange={handleEditTargetsChange}
                  globalTargets={targetDefinitions}
                />
                <div className="fee-config-manager__edit-actions">
                  <button
                    type="button"
                    className="fee-config-manager__save-btn"
                    onClick={handleSaveEdit}
                    disabled={saving || isFormIncomplete(editForm)}
                  >
                    {saving ? '…' : '✓ Sauvegarder'}
                  </button>
                  <button type="button" className="fee-config-manager__cancel-btn" onClick={cancelEdit}>Annuler</button>
                </div>
              </div>
            ) : (
              <>
                <div className="fee-config-manager__item-info">
                  <strong className="fee-config-manager__item-label">{def.label}</strong>
                  <span className="fee-config-manager__item-unit">({def.unit})</span>
                  <div className="fee-config-manager__item-targets">
                    {def.targets.map(t => (
                      <span key={t.key} className="fee-config-manager__target-chip">{t.label} : {t.amount} {def.unit}</span>
                    ))}
                  </div>
                </div>
                <div className="fee-config-manager__item-actions">
                  <button type="button" className="fee-config-manager__edit-btn" onClick={() => startEdit(def)}>✏️</button>
                  <button type="button" className="fee-config-manager__remove-btn" onClick={() => handleRemove(def.id)} disabled={saving}>×</button>
                </div>
              </>
            )}
          </div>
        ))}
      </div>

      {/* ── Global Targets Manager ────────────────────── */}
      <GlobalTargetsManager
        targets={targetDefinitions}
        onSave={saveTargetDefinitions}
        saving={saving}
      />

      {/* ── Add new fee form ──────────────────────────── */}
      <div className="fee-config-manager__form">
        <h4 className="fee-config-manager__form-title">Nouveau type de frais</h4>
        <div className="fee-config-manager__form-row">
          <input
            type="text"
            placeholder="Libellé (ex: Cantine)"
            value={form.label}
            onChange={e => setForm({ ...form, label: e.target.value })}
            className="fee-config-manager__input"
          />
          <UnitSelector
            value={form.unit}
            onChange={val => setForm({ ...form, unit: val })}
          />
          <select
            className="fee-config-manager__select fee-config-manager__target-selector"
            style={{ flex: 1.2 }}
            onChange={e => {
              const groupKey = e.target.value;
              if (!groupKey) return;
              const group = targetDefinitions.find(gt => gt.key === groupKey);
              if (group) {
                const newTargets = group.options.map(opt => {
                  const k = generateKey(opt);
                  return {
                    key: k,
                    label: opt,
                    amount: draftAmounts[k] || ''
                  };
                });
                setForm({ ...form, targets: newTargets });
              }
              e.target.value = '';
            }}
            value=""
          >
            <option value="">-- Choisir une cible --</option>
            {targetDefinitions.map(gt => (
              <option key={gt.key} value={gt.key}>{gt.key}</option>
            ))}
          </select>
        </div>

        <TargetsEditor
          targets={form.targets}
          onChange={handleTargetsChange}
          globalTargets={targetDefinitions}
        />

        <button
          type="button"
          className="fee-config-manager__add-btn"
          onClick={handleAdd}
          disabled={saving || isFormIncomplete(form)}
        >
          {saving ? 'Sauvegarde…' : '+ Ajouter ce type de frais'}
        </button>
      </div>
    </div>
  );
}
