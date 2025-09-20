"use client";
import { useState, useEffect } from 'react';

export default function DuplicateClassModal({ 
  isOpen, 
  onClose, 
  classe,
  onSuccess 
}) {
  const [selectedYear, setSelectedYear] = useState('');
  const [availableYears, setAvailableYears] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Générer les années disponibles (±10 ans de l'année courante)
  useEffect(() => {
    if (!isOpen || !classe) return;

    const generateAvailableYears = async () => {
      try {
        // Récupérer toutes les classes existantes
        const res = await fetch('/api/school_ai/classes');
        if (!res.ok) throw new Error('Erreur lors du chargement des classes');
        
        const allClasses = await res.json();
        
        // Générer la plage d'années (±10 ans)
        const currentYear = new Date().getFullYear();
        const years = [];
        
        for (let i = -10; i <= 10; i++) {
          const startYear = currentYear + i;
          const endYear = startYear + 1;
          const yearString = `${startYear}-${endYear}`;
          years.push(yearString);
        }
        
        // Filtrer les années où cette classe existe déjà
        const existingYears = allClasses
          .filter(c => c.niveau === classe.niveau && c.alias === classe.alias)
          .map(c => c.annee);
        
        const available = years.filter(year => !existingYears.includes(year));
        
        console.log('🔍 Debug DuplicateClassModal:', {
          classeNiveau: classe.niveau,
          classeAlias: classe.alias,
          existingYears,
          availableYears: available
        });
        
        setAvailableYears(available);
        
        // Sélectionner l'année courante par défaut si disponible
        const currentSchoolYear = currentYear >= 7 ? 
          `${currentYear}-${currentYear + 1}` : 
          `${currentYear - 1}-${currentYear}`;
          
        if (available.includes(currentSchoolYear)) {
          setSelectedYear(currentSchoolYear);
        } else if (available.length > 0) {
          setSelectedYear(available[0]);
        }
        
      } catch (error) {
        console.error('Erreur lors du chargement des années:', error);
        setError('Erreur lors du chargement des années disponibles');
      }
    };

    generateAvailableYears();
  }, [isOpen, classe]);

  const handleDuplicate = async () => {
    if (!selectedYear) {
      setError('Veuillez sélectionner une année');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const res = await fetch(`/api/classes/${classe._id}/duplicate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          targetYear: selectedYear
        })
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || 'Erreur lors de la duplication');
      }

      const result = await res.json();
      
      console.log('✅ Classe dupliquée avec succès:', result);
      
      if (onSuccess) {
        onSuccess(result);
      }
      
      onClose();
      
    } catch (error) {
      console.error('Erreur lors de la duplication:', error);
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="duplicateClassModal" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="duplicateClassModal__container">
        <div className="duplicateClassModal__header">
          <h3 className="duplicateClassModal__title">
            Dupliquer la classe {classe?.niveau} {classe?.alias}
          </h3>
          <button 
            className="duplicateClassModal__closeBtn"
            onClick={onClose}
            disabled={loading}
          >
            ✕
          </button>
        </div>

        <div className="duplicateClassModal__body">
          {error && (
            <div className="duplicateClassModal__error">
              {error}
            </div>
          )}

          <div className="duplicateClassModal__info">
            <p>
              Sélectionnez l'année scolaire pour laquelle vous souhaitez dupliquer cette classe.
              La nouvelle classe aura les mêmes informations (niveau, alias, enseignants) mais aucun élève.
            </p>
          </div>

          <div className="duplicateClassModal__field">
            <label className="duplicateClassModal__label">
              Année scolaire cible :
            </label>
            <select
              className="duplicateClassModal__select"
              value={selectedYear}
              onChange={(e) => setSelectedYear(e.target.value)}
              disabled={loading}
            >
              <option value="">-- Sélectionner une année --</option>
              {availableYears.map(year => (
                <option key={year} value={year}>
                  {year}
                </option>
              ))}
            </select>
          </div>

          {availableYears.length === 0 && (
            <div className="duplicateClassModal__warning">
              ⚠️ Aucune année disponible. Cette classe existe déjà pour toutes les années dans la plage ±10 ans.
            </div>
          )}
        </div>

        <div className="duplicateClassModal__actions">
          <button
            className="duplicateClassModal__cancelBtn"
            onClick={onClose}
            disabled={loading}
          >
            Annuler
          </button>
          <button
            className="duplicateClassModal__confirmBtn"
            onClick={handleDuplicate}
            disabled={loading || !selectedYear || availableYears.length === 0}
          >
            {loading ? 'Duplication...' : 'Dupliquer'}
          </button>
        </div>
      </div>
    </div>
  );
}
