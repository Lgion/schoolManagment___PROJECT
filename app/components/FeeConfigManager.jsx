"use client"

import React, { useState, useContext } from 'react';
import { AiAdminContext } from '../../stores/ai_adminContext';

const UNITS = ['F', 'kg', 'L', 'u', 'm'];

function emptyTarget() {
  return { key: '', label: '', amount: '' };
}

function emptyFee() {
  return {
    label: '',
    unit: 'F',
    targets: [
      { key: 'interne', label: 'Interne', amount: '' },
      { key: 'externe', label: 'Externe', amount: '' },
    ],
  };
}

// ──────────────────────────────────────────────
// Sub-component : editable list of targets
// ──────────────────────────────────────────────
function TargetsEditor({ targets, onChange }) {
  const update = (idx, field, val) => {
    const next = targets.map((t, i) =>
      i === idx ? { ...t, [field]: field === 'amount' ? val : val } : t
    );
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
            title="Label personnalisable affiché à l'utilisateur"
          />
          <input
            className="fcm-targets-editor__key-input"
            type="text"
            placeholder="Clé (ex: interne)"
            value={t.key}
            onChange={e => update(idx, 'key', e.target.value.toLowerCase().replace(/\s+/g, '_'))}
            title="Clé technique (minuscules, sans espaces)"
          />
          <input
            className="fcm-targets-editor__amount-input"
            type="number"
            placeholder="Montant"
            value={t.amount}
            onChange={e => update(idx, 'amount', e.target.value)}
          />
          <button
            type="button"
            className="fcm-targets-editor__remove-btn"
            onClick={() => removeTarget(idx)}
            disabled={targets.length <= 1}
            title="Supprimer ce target"
          >−</button>
        </div>
      ))}
      <button type="button" className="fcm-targets-editor__add-btn" onClick={addTarget}>
        + Ajouter un target
      </button>
    </div>
  );
}

// ──────────────────────────────────────────────
// Main component
// ──────────────────────────────────────────────
export default function FeeConfigManager() {
  const { feeDefinitions, feeDefinitionsLoaded, saveFeeDefinitions } = useContext(AiAdminContext);

  const [form, setForm] = useState(emptyFee());
  const [editingId, setEditingId] = useState(null);   // id of fee being edited
  const [editForm, setEditForm] = useState(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  // ── Validation ──────────────────────────────
  const validate = (fee) => {
    if (!fee.label.trim()) return 'Le libellé est requis.';
    if (!fee.unit.trim()) return 'L\'unité est requise.';
    if (!fee.targets.length) return 'Au moins un target est requis.';
    for (const t of fee.targets) {
      if (!t.key.trim()) return 'Chaque target doit avoir une clé.';
      if (!t.label.trim()) return 'Chaque target doit avoir un label.';
      if (t.amount === '' || isNaN(Number(t.amount))) return 'Chaque target doit avoir un montant valide.';
    }
    return null;
  };

  // ── Add ─────────────────────────────────────
  const handleAdd = async () => {
    const err = validate(form);
    if (err) { setError(err); return; }
    setError('');
    const newFee = {
      id: 'fee_' + Date.now(),
      label: form.label.trim(),
      unit: form.unit,
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

  // ── Delete ───────────────────────────────────
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

  // ── Edit ─────────────────────────────────────
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
              unit: editForm.unit,
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

  // ── Render ───────────────────────────────────
  if (!feeDefinitionsLoaded) {
    return <div className="fee-config-manager fee-config-manager--loading">Chargement des frais…</div>;
  }

  return (
    <div className="fee-config-manager">
      <h3 className="fee-config-manager__title">Configuration des Frais</h3>

      {error && <div className="fee-config-manager__error">{error}</div>}

      {/* ── Existing fees list ───────────────────────── */}
      <div className="fee-config-manager__list">
        {feeDefinitions.length === 0 && (
          <p className="fee-config-manager__empty">Aucun frais configuré. Créez-en un ci-dessous.</p>
        )}
        {feeDefinitions.map(def => (
          <div key={def.id} className={`fee-config-manager__item ${editingId === def.id ? 'fee-config-manager__item--editing' : ''}`}>

            {editingId === def.id ? (
              /* ── Inline edit form ── */
              <div className="fee-config-manager__edit-form">
                <div className="fee-config-manager__edit-row">
                  <input
                    type="text"
                    value={editForm.label}
                    onChange={e => setEditForm({ ...editForm, label: e.target.value })}
                    placeholder="Libellé"
                    className="fee-config-manager__input"
                  />
                  <select
                    value={editForm.unit}
                    onChange={e => setEditForm({ ...editForm, unit: e.target.value })}
                    className="fee-config-manager__select"
                  >
                    {UNITS.map(u => <option key={u} value={u}>{u}</option>)}
                  </select>
                </div>
                <TargetsEditor
                  targets={editForm.targets}
                  onChange={newTargets => setEditForm({ ...editForm, targets: newTargets })}
                />
                <div className="fee-config-manager__edit-actions">
                  <button type="button" className="fee-config-manager__save-btn" onClick={handleSaveEdit} disabled={saving}>
                    {saving ? '…' : '✓ Sauvegarder'}
                  </button>
                  <button type="button" className="fee-config-manager__cancel-btn" onClick={cancelEdit}>
                    Annuler
                  </button>
                </div>
              </div>
            ) : (
              /* ── Read-only row ── */
              <>
                <div className="fee-config-manager__item-info">
                  <strong className="fee-config-manager__item-label">{def.label}</strong>
                  <span className="fee-config-manager__item-unit">({def.unit})</span>
                  <div className="fee-config-manager__item-targets">
                    {Array.isArray(def.targets)
                      ? def.targets.map(t => (
                          <span key={t.key} className="fee-config-manager__target-chip">
                            {t.label} : {t.amount} {def.unit}
                          </span>
                        ))
                      : null
                    }
                  </div>
                </div>
                <div className="fee-config-manager__item-actions">
                  <button
                    type="button"
                    className="fee-config-manager__edit-btn"
                    onClick={() => startEdit(def)}
                    title="Modifier"
                  >✏️</button>
                  <button
                    type="button"
                    className="fee-config-manager__remove-btn"
                    onClick={() => handleRemove(def.id)}
                    disabled={saving}
                    title="Supprimer"
                  >×</button>
                </div>
              </>
            )}
          </div>
        ))}
      </div>

      {/* ── Add new fee form ─────────────────────────── */}
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
          <select
            value={form.unit}
            onChange={e => setForm({ ...form, unit: e.target.value })}
            className="fee-config-manager__select"
          >
            {UNITS.map(u => <option key={u} value={u}>{u}</option>)}
          </select>
        </div>

        <TargetsEditor
          targets={form.targets}
          onChange={newTargets => setForm({ ...form, targets: newTargets })}
        />

        <button
          type="button"
          className="fee-config-manager__add-btn"
          onClick={handleAdd}
          disabled={saving}
        >
          {saving ? 'Sauvegarde…' : '+ Ajouter ce type de frais'}
        </button>
      </div>
    </div>
  );
}
