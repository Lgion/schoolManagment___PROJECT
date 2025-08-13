"use client"

import { useContext, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { AiAdminContext } from '../../../stores/ai_adminContext';
import Link from 'next/link';
import { getClasseImagePath } from '../../../utils/imageUtils';

export default function ClasseDetailPage() {
  const { id } = useParams();
  const router = useRouter();
  const ctx = useContext(AiAdminContext);
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
    ? (ctx.enseignants || []).filter(e => e.current_classes === classe._id) // Relations dynamiques
    : classe.professeur || []; // Snapshot historique
  // Prof principal (optionnel)
  const prof = (ctx.enseignants || []).find(e => e._id === classe.prof_principal_id);

  console.log(ctx.eleves);
  console.log(enseignants);
  console.log(ctx.enseignants);
  console.log(classe);
  
  return !classe ? <div>....loading.....</div>
      : <div className="person-detail" style={{position:'relative'}}>
      <button
        className="person-detail__close"
        style={{position:'absolute',top:-15,right:5,color:'red',background:'none',border:'none',fontSize:'2em',cursor:'pointer',zIndex:10}}
        aria-label="Fermer"
        onClick={() => router.back()}
      >✕</button>
      {showModal && <button
        className="person-detail__editbtn"
        onClick={e => { e.stopPropagation(); e.preventDefault(); setShowModal(false); }}
      >Fermer Édition</button>}
      <div className="person-detail__block">
        <img 
          className="classe-card__photo" 
          src={getClasseImagePath(classe)} 
          alt={`${classe.niveau} ${classe.alias} - ${classe.annee}`}
          onError={(e) => {
            e.target.src = '/school/default-classe.webp';
          }}
        />
        <h2 className="person-detail__subtitle">Informations principales</h2>
        <div><b>Année scolaire :</b> {classe.annee}</div>
        <div><b>Niveau classe:</b> {classe.niveau}</div>
        <div><b>Alias classe :</b> {classe.alias}</div>
        {/* <div><b>Prof principal :</b> {prof ? `${prof.nom} ${prof.prenoms}` : (classe.prof_principal_nom || '—')}</div> */}
        <div><b>Effectif élèves:</b> {eleves.length}</div>
      </div>
      <div className="person-detail__block">
        <h2 className="person-detail__subtitle">Liste des élèves</h2>
        {eleves.length === 0 ? <div>Aucun élève dans cette classe.</div> :
          <ul className="classe-detail__eleves-list">
            {eleves.map(eleve => {
              const student = ctx.eleves.find(el=>el._id===eleve)
              return <li key={eleve._id}>
                <Link href={`/eleves/${eleve}`}>{student.nom} {student.prenoms}</Link>
              </li>
            })}
          </ul>
        }
      <div className="person-detail__block">
        <h2 className="person-detail__subtitle">Enseignant attitré.e</h2>
        {enseignants.length === 0 ? <div>Aucun élève dans cette classe.</div> :
          <ul className="classe-detail__eleves-list">
            {enseignants.map(enseignant => {
              const teacher = ctx.enseignants.find(el=>el._id===enseignant)
              return <li key={enseignant._id}>
                <Link href={`/enseignants/${enseignant}`}>{teacher.nom} {teacher.prenoms}</Link>
              </li>
}           )}
          </ul>
        }
      </div>

      </div>
      {/* Ajouter d'autres blocs si besoin (documents, emplois du temps, etc) */}
    </div>
}
