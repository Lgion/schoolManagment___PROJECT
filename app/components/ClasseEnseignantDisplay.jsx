"use client";

import { useContext } from 'react';
import { AiAdminContext } from '../../stores/ai_adminContext';
import Link from 'next/link';

export default function ClasseEnseignantDisplay({ classe, label = "Enseignant de la classe:" }) {
  const ctx = useContext(AiAdminContext);
  
  if (!classe || !ctx) return null;
  
  // Déterminer si c'est une classe de l'année actuelle ou historique
  const currentYear = new Date().getFullYear();
  const currentSchoolYear = (new Date().getMonth() + 1) < 7 
    ? `${currentYear - 1}-${currentYear}` 
    : `${currentYear}-${currentYear + 1}`;
  
  const isCurrentYear = classe.annee === currentSchoolYear;
  
  // Récupérer l'enseignant selon le contexte (actuel vs historique)
  let enseignant = null;
  
  if (isCurrentYear) {
    // Relations dynamiques pour l'année actuelle
    enseignant = (ctx.enseignants || []).find(e => 
      Array.isArray(e.current_classes) && e.current_classes.includes(classe._id)
    );
  } else {
    // Snapshot historique pour les années passées
    const enseignantId = classe.professeur && classe.professeur[0];
    if (enseignantId) {
      enseignant = (ctx.enseignants || []).find(e => e._id === enseignantId);
    }
  }
  
  return (
    <div className="classe-enseignant-display">
      <span className="classe-enseignant-display__label">{label}</span>
      {enseignant ? (
        <Link 
          href={`/enseignants/${enseignant._id}`}
          className="classe-enseignant-display__link"
        >
          <div className="classe-enseignant-display__card">
            <img 
              className="classe-enseignant-display__photo" 
              src={enseignant.photo_$_file} 
              alt={`${enseignant.nom} ${enseignant.prenoms}`}
            />
            <div className="classe-enseignant-display__info">
              <div className="classe-enseignant-display__name">
                {enseignant.nom} {enseignant.prenoms}
              </div>
              <div className="classe-enseignant-display__role">
                Professeur principal
              </div>
            </div>
          </div>
        </Link>
      ) : (
        <div className="classe-enseignant-display__empty">
          Aucun enseignant attribué à cette classe (<b>{classe.niveau} - {classe.alias}</b>)
        </div>
      )}
    </div>
  );
}
