"use client"

import { useEffect, useState, useContext } from 'react';
import { createPortal } from 'react-dom';
import { useParams, useRouter } from 'next/navigation';
import { AiAdminContext } from '../stores/ai_adminContext';
import { useUserRole } from '../stores/useUserRole';
import Link from 'next/link';
import { getClasseImagePath } from '../utils/imageUtils';
import ScheduleViewer from '../app/components/ScheduleViewer';
import '../assets/scss/components/MODALS/detailModal.scss';

// Composant pour le contenu de la classe
function ClasseDetailContent({ classeId, onEdit }) {
  const ctx = useContext(AiAdminContext);
  const { userRole } = useUserRole();
  const router = useRouter();
  
  if (!ctx) return <div style={{color:'red'}}>Erreur : contexte non trouvé</div>;
  
  const classe = (ctx.classes || []).find(c => String(c._id) === String(classeId));
  if (!classe) return <div style={{color:'red'}}>Classe introuvable</div>;
  
  // Déterminer si c'est une classe de l'année actuelle ou historique
  const currentYear = new Date().getFullYear();
  const currentSchoolYear = (new Date().getMonth() + 1) < 7 
    ? `${currentYear - 1}-${currentYear}` 
    : `${currentYear}-${currentYear + 1}`;
  
  const isCurrentYear = classe.annee === currentSchoolYear;
  
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
          Liste des élèves
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
                <Link key={"eleves_" + student._id} href={`/eleves/${student._id}`} className="person-detail__card">
                  <div className="person-detail__card-avatar">👨‍🎓</div>
                  <div className="person-detail__card-content">
                    <h3 className="person-detail__card-name">{student?.nom} {student?.prenoms}</h3>
                    <p className="person-detail__card-role">Élève</p>
                  </div>
                </Link>
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
                <Link key={teacher?._id} href={`/enseignants/${teacher?._id}`} className="person-detail__card">
                  <div className="person-detail__card-avatar">👨‍🏫</div>
                  <div className="person-detail__card-content">
                    <h3 className="person-detail__card-name">{teacher?.nom} {teacher?.prenoms}</h3>
                    <p className="person-detail__card-role">Enseignant</p>
                  </div>
                </Link>
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
              router.push(`/scheduling?classeId=${classe._id}`);
            } else if (data.action === 'history') {
              router.push(`/scheduling?classeId=${classe._id}&view=history`);
            }
          }}
        />
      </div>
    </div>
  );
}

// Composant principal DetailModal
export default function DetailModal({ type, entityId, onClose, onEdit }) {
  const [isClosing, setIsClosing] = useState(false);
  
  // Gestion de la fermeture avec animation
  const handleClose = () => {
    setIsClosing(true);
    setTimeout(() => {
      onClose();
    }, 300); // Durée de l'animation de fermeture
  };

  // Gestion des touches clavier
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        handleClose();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    document.body.style.overflow = 'hidden'; // Empêcher le scroll du body

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = 'unset';
    };
  }, []);

  // Gestion du clic sur l'overlay
  const handleOverlayClick = (e) => {
    if (e.target === e.currentTarget) {
      handleClose();
    }
  };

  // Déterminer le titre et l'icône selon le type
  const getModalInfo = () => {
    switch (type) {
      case 'classe':
        return { title: 'Détails de la classe', icon: '🏫' };
      case 'eleve':
        return { title: 'Profil élève', icon: '👨‍🎓' };
      case 'enseignant':
        return { title: 'Profil enseignant', icon: '👨‍🏫' };
      default:
        return { title: 'Détails', icon: '📋' };
    }
  };

  const { title, icon } = getModalInfo();

  // Rendu du contenu selon le type
  const renderContent = () => {
    switch (type) {
      case 'classe':
        return <ClasseDetailContent classeId={entityId} onEdit={onEdit} />;
      case 'eleve':
        // TODO: Implémenter EleveDetailContent
        return <div>Contenu élève à implémenter</div>;
      case 'enseignant':
        // TODO: Implémenter EnseignantDetailContent
        return <div>Contenu enseignant à implémenter</div>;
      default:
        return <div>Type non supporté</div>;
    }
  };

  // Vérifier si on est côté client
  if (typeof window === 'undefined') return null;

  return createPortal(
    <div 
      className={`detailModal ${isClosing ? 'detailModal--closing' : ''}`}
      onClick={handleOverlayClick}
    >
      <div className="detailModal__overlay" />
      <div className="detailModal__container">
        <div className="detailModal__header">
          <h2 className="detailModal__title">
            <span className="detailModal__titleIcon">{icon}</span>
            {title}
          </h2>
          <button 
            className="detailModal__closeBtn"
            onClick={handleClose}
            aria-label="Fermer la modale"
          >
            ✕
          </button>
        </div>
        
        <div className="detailModal__content">
          {renderContent()}
        </div>

        {onEdit && (
          <div className="detailModal__actions">
            <button 
              className="detailModal__actionBtn detailModal__actionBtn--secondary"
              onClick={handleClose}
            >
              Fermer
            </button>
            <button 
              className="detailModal__actionBtn detailModal__actionBtn--primary"
              onClick={() => onEdit && onEdit()}
            >
              ✏️ Éditer
            </button>
          </div>
        )}
      </div>
    </div>,
    document.body
  );
}
