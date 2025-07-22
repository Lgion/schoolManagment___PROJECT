"use client"

import { useContext, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { AiAdminContext } from '../../../stores/ai_adminContext';
import Link from 'next/link';

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
  // Liste des élèves de la classe
  const eleves = (ctx.eleves || []).filter(e => e.current_classe === classe._id);
  const enseignants = (ctx.enseignants || []).filter(e => e.current_classes === classe._id);
  // Prof principal (optionnel)
  const prof = (ctx.enseignants || []).find(e => e._id === classe.prof_principal_id);

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
        <img className="classe-card__photo" src={classe.photo} alt={classe.niveau + ' ' + classe.alias} />
        <h2 className="person-detail__subtitle">Informations principales</h2>
        <div><b>Année scolaire :</b> {classe.annee}</div>
        <div><b>Niveau :</b> {classe.niveau}</div>
        <div><b>Alias :</b> {classe.alias}</div>
        <div><b>Prof principal :</b> {prof ? `${prof.nom} ${prof.prenoms}` : (classe.prof_principal_nom || '—')}</div>
        <div><b>Effectif :</b> {eleves.length}</div>
      </div>
      <div className="person-detail__block">
        <h2 className="person-detail__subtitle">Liste des élèves</h2>
        {eleves.length === 0 ? <div>Aucun élève dans cette classe.</div> :
          <ul className="classe-detail__eleves-list">
            {eleves.map(eleve => (
              <li key={eleve._id}>
                <Link href={`/admin/ecole/eleves/${eleve._id}`}>{eleve.nom} {eleve.prenoms}</Link>
              </li>
            ))}
          </ul>
        }
      <div className="person-detail__block">
        <h2 className="person-detail__subtitle">Enseignant attitré.e</h2>
        {enseignants.length === 0 ? <div>Aucun élève dans cette classe.</div> :
          <ul className="classe-detail__eleves-list">
            {enseignants.map(enseignant => (
              <li key={enseignant._id}>
                <Link href={`/enseignants/${enseignant._id}`}>{enseignant.nom} {enseignant.prenoms}</Link>
              </li>
            ))}
          </ul>
        }
      </div>

      </div>
      {/* Ajouter d'autres blocs si besoin (documents, emplois du temps, etc) */}
    </div>
}
