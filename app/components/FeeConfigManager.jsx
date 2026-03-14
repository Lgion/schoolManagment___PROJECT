"use client"

import React, { useState, useContext } from 'react';
import { AiAdminContext } from '../../stores/ai_adminContext';
import { setLSItem } from '../../utils/localStorageManager';

// --- Composant de gestion des frais dynamiques (Admin) ---
export default function FeeConfigManager() {
  const { feeDefinitions, setFeeDefinitions } = useContext(AiAdminContext);
  const [newFee, setNewFee] = useState({ label: '', unit: 'F', interne: '', externe: '' });

  const handleAdd = () => {
    if (!newFee.label || !newFee.interne || !newFee.externe) return;
    const id = 'fee_' + Date.now();
    const updated = [
      ...feeDefinitions,
      {
        id,
        label: newFee.label,
        unit: newFee.unit,
        targets: { interne: Number(newFee.interne), externe: Number(newFee.externe) }
      }
    ];
    setFeeDefinitions(updated);
    setLSItem('fee_definitions', updated); // Persistence locale
    setNewFee({ label: '', unit: 'F', interne: '', externe: '' });
  };

  const handleRemove = (id) => {
    if (id === 'scol_cash' || id === 'scol_nature') {
      alert("Ces frais par défaut ne peuvent pas être supprimés.");
      return;
    }
    const updated = feeDefinitions.filter(d => d.id !== id);
    setFeeDefinitions(updated);
    setLSItem('fee_definitions', updated);
  };

  return (
    <div className="fee-config-manager">
      <h3 className="fee-config-manager__title">Configuration des Frais</h3>

      <div className="fee-config-manager__form">
        <input
          type="text"
          placeholder="Libellé (ex: Cantine)"
          value={newFee.label}
          onChange={e => setNewFee({ ...newFee, label: e.target.value })}
        />
        <select value={newFee.unit} onChange={e => setNewFee({ ...newFee, unit: e.target.value })}>
          <option value="F">Francs (F)</option>
          <option value="kg">Kilogrammes (kg)</option>
          <option value="u">Unités (u)</option>
        </select>
        <div className="fee-config-manager__input-group">
          <label>Interne :</label>
          <input
            className='fee-config-manager__type--1'
            type="number"
            placeholder="Target Interne"
            value={newFee.interne}
            onChange={e => setNewFee({ ...newFee, interne: e.target.value })}
          />
        </div>
        <div className="fee-config-manager__input-group">
          <label>Externe :</label>
          <input
            className='fee-config-manager__type--2'
            type="number"
            placeholder="Target Externe"
            value={newFee.externe}
            onChange={e => setNewFee({ ...newFee, externe: e.target.value })}
          />
        </div>
        <button type="button" onClick={handleAdd}>Ajouter</button>
      </div>

      <div className="fee-config-manager__list">
        {feeDefinitions.map(def => (
          <div key={def.id} className="fee-config-manager__item">
            <div className="fee-config-manager__item-info">
              <strong>{def.label}</strong> ({def.unit})
              <div className="fee-config-manager__item-targets">
                Interne: {def.targets.interne} | Externe: {def.targets.externe}
              </div>
            </div>
            <button
              type="button"
              className="fee-config-manager__remove-btn"
              onClick={() => handleRemove(def.id)}
              disabled={def.id === 'scol_cash' || def.id === 'scol_nature'}
            >×</button>
          </div>
        ))}
      </div>
    </div>
  );
}
