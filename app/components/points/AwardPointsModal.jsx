"use client";
import { useState, useEffect, useMemo } from 'react';
import { fetchLabels, createLabel, awardPoints } from './pointsApi';

/**
 * Modale d'attribution de bons points (côté professeur).
 * Le prof sélectionne d'abord une catégorie (tag visuel vert = bonus, rouge = malus),
 * puis valide pour l'appliquer à tous les élèves destinataires.
 *
 * Props :
 *  - isOpen
 *  - onClose()
 *  - recipients : [{ _id, name }]  élèves destinataires
 *  - onSuccess(result)             callback après attribution réussie
 */
export default function AwardPointsModal({ isOpen, onClose, recipients = [], onSuccess }) {
  const [labels, setLabels] = useState([]);
  const [loadingLabels, setLoadingLabels] = useState(false);
  const [selectedLabel, setSelectedLabel] = useState(null);
  const [amount, setAmount] = useState(1);
  const [comment, setComment] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  // Création de catégorie inline
  const [showCreate, setShowCreate] = useState(false);
  const [newName, setNewName] = useState('');
  const [newType, setNewType] = useState('BONUS');
  const [newIcon, setNewIcon] = useState('⭐');

  const loadLabels = async () => {
    setLoadingLabels(true);
    setError('');
    try {
      setLabels(await fetchLabels());
    } catch (e) {
      setError(e.message);
    } finally {
      setLoadingLabels(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      loadLabels();
      setSelectedLabel(null);
      setComment('');
      setError('');
      setShowCreate(false);
    }
  }, [isOpen]);

  // À la sélection d'un label, pré-remplir le montant dérivé (signé selon le type)
  const selectLabel = (label) => {
    setSelectedLabel(label);
    const base = Number.isInteger(label.defaultAmount) ? Math.abs(label.defaultAmount) : 1;
    setAmount(label.type === 'MALUS' ? -base : base);
  };

  const bonusLabels = useMemo(() => labels.filter(l => l.type === 'BONUS'), [labels]);
  const malusLabels = useMemo(() => labels.filter(l => l.type === 'MALUS'), [labels]);

  const handleCreateLabel = async () => {
    if (!newName.trim()) { setError('Le nom de la catégorie est requis'); return; }
    try {
      const label = await createLabel({
        name: newName.trim(),
        type: newType,
        icon: newIcon,
        defaultAmount: newType === 'MALUS' ? -1 : 1,
      });
      setLabels(prev => [...prev, label]);
      selectLabel(label);
      setShowCreate(false);
      setNewName('');
    } catch (e) {
      setError(e.message);
    }
  };

  const handleSubmit = async () => {
    if (!selectedLabel) { setError('Veuillez sélectionner une catégorie'); return; }
    if (!Number.isInteger(amount) || amount === 0) { setError('Le montant doit être un entier non nul'); return; }
    if (recipients.length === 0) { setError('Aucun élève destinataire'); return; }

    setSubmitting(true);
    setError('');
    try {
      const result = await awardPoints({
        studentIds: recipients.map(r => r._id),
        labelId: selectedLabel._id,
        amount,
        comment: comment.trim(),
      });
      onSuccess && onSuccess(result);
      onClose();
    } catch (e) {
      setError(e.message);
    } finally {
      setSubmitting(false);
    }
  };

  if (!isOpen) return null;

  const renderTag = (label) => (
    <button
      key={label._id}
      type="button"
      className={`pointsModal__tag pointsModal__tag--${label.type.toLowerCase()} ${selectedLabel?._id === label._id ? '--selected' : ''}`}
      onClick={() => selectLabel(label)}
      disabled={submitting}
    >
      <span className="pointsModal__tag-icon">{label.icon || (label.type === 'BONUS' ? '⭐' : '⚠️')}</span>
      <span className="pointsModal__tag-name">{label.name}</span>
    </button>
  );

  return (
    <div className="pointsModal" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="pointsModal__container">
        <div className="pointsModal__header">
          <h3 className="pointsModal__title">Attribuer des bons points</h3>
          <button className="pointsModal__closeBtn" onClick={onClose} disabled={submitting}>✕</button>
        </div>

        {/* Destinataires */}
        <div className="pointsModal__recipients">
          <span className="pointsModal__recipients-label">
            {recipients.length > 1 ? `${recipients.length} élèves` : 'Élève'} :
          </span>
          <span className="pointsModal__recipients-names">
            {recipients.map(r => r.name).join(', ')}
          </span>
        </div>

        {/* Sélection de catégorie */}
        <div className="pointsModal__section">
          <div className="pointsModal__section-head">
            <h4 className="pointsModal__section-title">1. Choisir une catégorie</h4>
            <button type="button" className="pointsModal__createToggle" onClick={() => setShowCreate(s => !s)} disabled={submitting}>
              {showCreate ? 'Annuler' : '+ Nouvelle catégorie'}
            </button>
          </div>

          {showCreate && (
            <div className="pointsModal__create">
              <input
                type="text" className="pointsModal__create-name" placeholder="Nom (ex: Participation)"
                value={newName} onChange={e => setNewName(e.target.value)}
              />
              <input
                type="text" className="pointsModal__create-icon" placeholder="Icône" maxLength={2}
                value={newIcon} onChange={e => setNewIcon(e.target.value)}
              />
              <select className="pointsModal__create-type" value={newType} onChange={e => setNewType(e.target.value)}>
                <option value="BONUS">Bonus</option>
                <option value="MALUS">Malus</option>
              </select>
              <button type="button" className="pointsModal__create-btn" onClick={handleCreateLabel}>Créer</button>
            </div>
          )}

          {loadingLabels ? (
            <div className="pointsModal__loading">Chargement des catégories…</div>
          ) : labels.length === 0 ? (
            <div className="pointsModal__empty">Aucune catégorie. Créez-en une ci-dessus.</div>
          ) : (
            <div className="pointsModal__tags-groups">
              {bonusLabels.length > 0 && (
                <div className="pointsModal__tags-group">
                  <span className="pointsModal__tags-grouplabel pointsModal__tags-grouplabel--bonus">Bonus</span>
                  <div className="pointsModal__tags">{bonusLabels.map(renderTag)}</div>
                </div>
              )}
              {malusLabels.length > 0 && (
                <div className="pointsModal__tags-group">
                  <span className="pointsModal__tags-grouplabel pointsModal__tags-grouplabel--malus">Malus</span>
                  <div className="pointsModal__tags">{malusLabels.map(renderTag)}</div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Réglages (montant + commentaire) */}
        {selectedLabel && (
          <div className="pointsModal__section">
            <h4 className="pointsModal__section-title">2. Ajuster (optionnel)</h4>
            <div className="pointsModal__settings">
              <label className="pointsModal__field">
                <span>Montant</span>
                <div className="pointsModal__amount">
                  <button type="button" onClick={() => setAmount(a => a - 1)} disabled={submitting}>−</button>
                  <input
                    type="number" value={amount}
                    onChange={e => setAmount(parseInt(e.target.value, 10) || 0)}
                    className={amount >= 0 ? '--positive' : '--negative'}
                  />
                  <button type="button" onClick={() => setAmount(a => a + 1)} disabled={submitting}>+</button>
                </div>
              </label>
              <label className="pointsModal__field pointsModal__field--grow">
                <span>Commentaire</span>
                <input
                  type="text" value={comment} placeholder="Précision (facultatif)"
                  onChange={e => setComment(e.target.value)} disabled={submitting}
                />
              </label>
            </div>
          </div>
        )}

        {error && <div className="pointsModal__error">{error}</div>}

        <div className="pointsModal__footer">
          <button className="pointsModal__cancelBtn" onClick={onClose} disabled={submitting}>Annuler</button>
          <button
            className="pointsModal__submitBtn"
            onClick={handleSubmit}
            disabled={submitting || !selectedLabel}
          >
            {submitting
              ? 'Attribution…'
              : selectedLabel
                ? `Attribuer ${amount >= 0 ? '+' : ''}${amount} à ${recipients.length} élève${recipients.length > 1 ? 's' : ''}`
                : 'Attribuer'}
          </button>
        </div>
      </div>
    </div>
  );
}
