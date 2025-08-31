"use client"

import { useContext, useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { AiAdminContext } from '../../../stores/ai_adminContext';
import { useUserRole } from '../../../stores/useUserRole';
import Link from 'next/link';
import { getClasseImagePath } from '../../../utils/imageUtils';
import ScheduleViewer from '../../components/ScheduleViewer';
import EntityModal from '../../components/EntityModal';

export default function ClasseDetailPage() {
  const { id } = useParams();
  const router = useRouter();
  const ctx = useContext(AiAdminContext);
  const { userRole } = useUserRole();
  useEffect(() => {
    ctx.fetchClasses && ctx.fetchClasses();
    ctx.fetchEleves && ctx.fetchEleves();
    ctx.fetchEnseignants && ctx.fetchEnseignants();
  }, []);
  if (!ctx) return <div style={{color:'red'}}>Erreur : contexte non trouvé</div>;
  const { setSelected, showModal, setShowModal } = ctx;
  const classe = (ctx.classes || []).find(c => String(c._id) === String(id));
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
  // Prof principal (optionnel)
  const prof = (ctx.enseignants || []).find(e => e._id === classe.prof_principal_id);
  const onEdit = e => { setSelected(e); setShowModal(true); }

  // console.log(ctx.eleves);
  // console.log(enseignants);
  // console.log(ctx.enseignants);
  // console.log(classe);
  
  return !classe ? <div>....loading.....</div>
    : <div className="person-detail" style={{position:'relative'}}>
      {/* <button
        className="person-detail__close"
        aria-label="Fermer"
        onClick={() => router.back()}
      >✕</button> */}
      <button
        className="person-detail__close"
        aria-label="Fermer"
        title="Réduire la fenêtre"
        onClick={e => {
          e.preventDefault();
          e.target.parentNode.classList.toggle('--reduce')
        }}
      >_</button>
      {onEdit && !showModal &&(
        <button
          type="button"
          className="person-detail__editbtn"
          onClick={e => { 
            e.stopPropagation(); 
            e.preventDefault(); 
            alert("don't work yet")
            onEdit(classe); 
          }}
          tabIndex={0}
        >Éditer</button>
      )}
      {showModal && <button
        className="person-detail__editbtn"
        onClick={e => { e.stopPropagation(); e.preventDefault(); setShowModal(false); }}
      >Fermer Édition</button>}
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
              onClick={e => {
                e.preventDefault();
                e.target.closest('.person-detail').classList.toggle('--reduce')
                e.target.closest('.person-detail').classList.toggle('--')
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
              const student = ctx.eleves.find(el=>el._id===(eleve._id||eleve))
              console.log(student);
              
              
              return (
                <Link key={"eleves_"+student._id} href={`/eleves/${student._id}`} className="person-detail__card">
                  <div className="person-detail__card-avatar">👨‍🎓</div>
                  <div className="person-detail__card-content">
                    <h3 className="person-detail__card-name">{student?.nom} {student?.prenoms}</h3>
                    <p className="person-detail__card-role">Élève</p>
                  </div>
                </Link>
              )
            })}
          </div>
        )}
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
              const teacher = ctx.enseignants.find(el=>el._id===enseignant._id||enseignant)
              console.log(teacher);
              
              return (
                <Link key={teacher?._id} href={`/enseignants/${teacher?._id}`} className="person-detail__card">
                  <div className="person-detail__card-avatar">👨‍🏫</div>
                  <div className="person-detail__card-content">
                    <h3 className="person-detail__card-name">{teacher?.nom} {teacher?.prenoms}</h3>
                    <p className="person-detail__card-role">Enseignant</p>
                  </div>
                </Link>
              )
            })}
          </div>
        )}
      </div>

      </div>
      
      {/* Section Emploi du temps */}
      <div className="person-detail__block person-detail__block--schedule">
        {/* <h2 className="person-detail__subtitle">Emploi du temps</h2> */}
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
}
