"use client"

import { useContext, useState } from 'react';
import { AiAdminContext } from '../../stores/ai_adminContext';
import { useUserRole } from '../../stores/useUserRole';
import Link from 'next/link';
import PermissionGate from "../components/PermissionGate";
import { getClasseImagePath } from '../../utils/imageUtils';
import ScheduleViewer from './ScheduleViewer';
import AddStudentsModal from './AddStudentsModal';

export default function ClasseDetailContent({ entityId }) {
  const ctx = useContext(AiAdminContext);
  const { userRole } = useUserRole();
  const [showAddStudentsModal, setShowAddStudentsModal] = useState(false);

  if (!ctx) return <div style={{ color: 'red' }}>Erreur : contexte non trouvé</div>;

  const classe = (ctx.classes || []).find(c => String(c._id) === String(entityId));
  if (!classe) return <div style={{ color: 'red' }}>Classe introuvable</div>;

  // Déterminer si c'est une classe de l'année actuelle ou historique
  const currentYear = new Date().getFullYear();
  const currentSchoolYear = (new Date().getMonth() + 1) < 7
    ? `${currentYear - 1}-${currentYear}`
    : `${currentYear}-${currentYear + 1}`;

  const isCurrentYear = classe.annee === currentSchoolYear;

  // DEBUG: Logs pour comprendre pourquoi le bouton n'apparaît pas
  console.log('🔍 Debug bouton ajout élèves:', {
    userRole,
    isCurrentYear,
    classeAnnee: classe.annee,
    currentSchoolYear,
    condition: userRole === 'admin' && isCurrentYear
  });

  // Liste des élèves selon le contexte (actuel vs historique)
  const eleves = isCurrentYear
    ? (ctx.eleves || []).filter(e => e.current_classe === classe._id) // Relations dynamiques
    : classe.eleves || []; // Snapshot historique

  const enseignants = isCurrentYear
    ? (ctx.enseignants || []).filter(e =>
      Array.isArray(e.current_classes) && e.current_classes.includes(classe._id)
    ) // Relations dynamiques
    : classe.professeur || []; // Snapshot historique

  return (
    <div className="person-detail">
      {/* En-tête de la classe */}
      <div className="person-detail__header">
        <div className="person-detail__header-content">
          <div className="person-detail__header-info">
            <h1 className="person-detail__title">
              {classe.niveau} {classe.alias}
            </h1>
            <p className="person-detail__subtitle-text">
              Année scolaire {classe.annee}
            </p>
          </div>
          <div className="person-detail__header-image">
            <img
              className="person-detail__photo"
              src={getClasseImagePath(classe)}
              alt={`${classe.niveau} ${classe.alias} - ${classe.annee}`}
              onError={(e) => {
                e.target.src = '/school/classe.webp';
              }}
            />
          </div>
        </div>
      </div>

      {/* Statistiques rapides */}
      <div className="person-detail__stats">
        <div className="person-detail__stat-card">
          <div className="person-detail__stat-icon">👨‍🎓</div>
          <div className="person-detail__stat-content">
            <span className="person-detail__stat-number">{eleves.length}</span>
            <span className="person-detail__stat-label">Élèves</span>
          </div>
        </div>
        <div className="person-detail__stat-card">
          <div className="person-detail__stat-icon">👨‍🏫</div>
          <div className="person-detail__stat-content">
            <span className="person-detail__stat-number">{enseignants.length}</span>
            <span className="person-detail__stat-label">Enseignants</span>
          </div>
        </div>
        <div className="person-detail__stat-card">
          <div className="person-detail__stat-icon">📚</div>
          <div className="person-detail__stat-content">
            <span className="person-detail__stat-number">{classe.niveau}</span>
            <span className="person-detail__stat-label">Niveau</span>
          </div>
        </div>
      </div>

      {/* Liste des élèves */}
      <div className="person-detail__block person-detail__block--students">
        <h2 className="person-detail__subtitle">
          <span className="person-detail__subtitle-icon">👨‍🎓</span>
          Liste des élèvess
          <PermissionGate roles={['admin', 'prof']}>
            <button
              className="person-detail__addBtn"
              onClick={() => setShowAddStudentsModal(true)}
              title="Ajouter des élèves à cette classe"
            >
              + Ajouter
            </button>
          </PermissionGate>
        </h2>
        {eleves.length === 0 ? (
          <div className="person-detail__empty">
            <div className="person-detail__empty-icon">📚</div>
            <p className="person-detail__empty-text">Aucun élève dans cette classe</p>
          </div>
        ) : (
          <div className="person-detail__grid">
            {eleves.map(eleve => {
              const student = ctx.eleves.find(el => el._id === (eleve._id || eleve));
              return (
                <div key={"eleves_" + student._id} className="person-detail__card">
                  <div className="person-detail__card-avatar">👨‍🎓</div>
                  <div className="person-detail__card-content">
                    <h3 className="person-detail__card-name">{student?.nom} {student?.prenoms}</h3>
                    <p className="person-detail__card-role">Élève</p>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Liste des enseignants */}
      <div className="person-detail__block person-detail__block--teachers">
        <h2 className="person-detail__subtitle">
          <span className="person-detail__subtitle-icon">👨‍🏫</span>
          Enseignants attitrés
        </h2>
        {enseignants.length === 0 ? (
          <div className="person-detail__empty">
            <div className="person-detail__empty-icon">👨‍🏫</div>
            <p className="person-detail__empty-text">Aucun enseignant attitré</p>
          </div>
        ) : (
          <div className="person-detail__grid">
            {enseignants.map(enseignant => {
              const teacher = ctx.enseignants.find(el => el._id === (enseignant._id || enseignant));
              return (
                <div key={teacher?._id} className="person-detail__card">
                  <div className="person-detail__card-avatar">👨‍🏫</div>
                  <div className="person-detail__card-content">
                    <h3 className="person-detail__card-name">{teacher?.nom} {teacher?.prenoms}</h3>
                    <p className="person-detail__card-role">Enseignant</p>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Section Emploi du temps */}
      <div className="person-detail__block person-detail__block--schedule">
        <ScheduleViewer
          classeId={classe._id}
          isEditable={userRole === 'admin'}
          onEditSchedule={(data) => {
            if (data.action === 'create' || data.action === 'edit') {
              // Dans le contexte du portal, on ne peut pas naviguer
              console.log('Navigation vers scheduling désactivée dans le portal');
            } else if (data.action === 'history') {
              console.log('Navigation vers scheduling history désactivée dans le portal');
            }
          }}
        />
      </div>

      {/* Modal d'ajout d'élèves */}
      <AddStudentsModal
        isOpen={showAddStudentsModal}
        onClose={() => setShowAddStudentsModal(false)}
        classeId={classe._id}
        classeName={`${classe.niveau} ${classe.alias}`}
        currentStudents={eleves.map(e => e._id || e)}
        onSuccess={() => {
          // Rafraîchir les données
          ctx.fetchEleves && ctx.fetchEleves();
          ctx.fetchClasses && ctx.fetchClasses();
        }}
      />
    </div>
  );
}
