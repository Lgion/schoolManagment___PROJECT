 "use client";
import { useContext,useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { AiAdminContext } from '../../../stores/ai_adminContext';
import { Parent, DocumentsBlock, IsInterneBlock, AddNoteForm, CompositionsBlock, SchoolHistoryBlock, ScolarityFeesBlock, CommentairesBlock, AbsencesBlock, BonusBlock, ManusBlock } from '../../components/EntityModal.jsx';
import Gmap from '../../_/Gmap_plus';
import { useEntityDetail, ClasseDisplay } from '../../../utils/classeUtils';
import ClasseEnseignantDisplay from '../../components/ClasseEnseignantDisplay';
import { useDetailPortal } from '../../../stores/useDetailPortal';
import DetailPortal from "../../components/DetailPortal"

export default function ElevePage() {
  const { id } = useParams();
  const router = useRouter();
  const ctx = useContext(AiAdminContext);
  const [isReduced, setIsReduced] = useState(false);
  
  if (!ctx) return <div style={{color:'red'}}>Erreur : contexte non trouvé</div>;
  const getDefaultSchoolYear = (compositions) => {
    const keys = Object.keys(compositions || {});
    if (keys.length > 0) return keys[0];
    const now = new Date();
    return (now.getMonth() + 1) < 7 ? (now.getFullYear() - 1) + "-" + now.getFullYear() : now.getFullYear() + "-" + (now.getFullYear() + 1);
  };
    useEffect(() => { 
        ctx.fetchEleves && ctx.fetchEleves(); 
        ctx.fetchClasses && ctx.fetchClasses(); 
    }, []);
  
  // DEBUG : log ids pour comprendre le bug
  console.log('params id:', id, 'eleves ids:', (ctx.eleves||[]).map(e=>e._id));
  console.log(ctx.eleves);
  const { setSelected, showModal, setShowModal, setEditType } = ctx;
  
  const { entity: eleve, classe } = useEntityDetail(id, ctx, 'eleves');
  const [gmapOpen, setGmapOpen] = useState(false)
  const [schoolYear, setSchoolYear] = useState(getDefaultSchoolYear(eleve?.compositions || {}));
  if (!eleve) return <div style={{color:'red'}}>Élève introuvable</div>;


  // Récupère toutes les années de scolarité pour progression globale
  const allFees = eleve.scolarity_fees_$_checkbox || {};
  const onEdit = e => { setSelected(e); setEditType("eleve"); setShowModal(true); }
  // Fusionne tous les dépôts pour une progression globale
  let totalArgent = 0, totalRiz = 0;
  Object.values(allFees).forEach(fees => {
    Object.values(fees||{}).forEach(v => {
      if (v.argent) totalArgent += Number(v.argent);
      if (v.riz) totalRiz += Number(v.riz);
    });
  });
  console.log(eleve);
  
  return !eleve ? <div>....loading.....</div>
    : 
    <DetailPortal
      isOpen={true}
      onClose={()=>router.back()}
      title={`Élève ${eleve.nom} ${eleve.prenoms}`}
      icon={"📋"}
      reduced={[isReduced,setIsReduced]}
    ><main className={`person-detail ${isReduced ? '--reduce' : ''}`}>
      {/* <button
        className="person-detail__close"
        aria-label="Fermer"
        onClick={() => router.back()}
      >✕</button> */}

      {onEdit &&(
        <button
          type="button"
          className="person-detail__editbtn"
          onClick={e => { e.stopPropagation(); e.preventDefault(); onEdit(eleve); }}
          tabIndex={0}
        >Éditer</button>
      )}
      {showModal && <button
          className="person-detail__editbtn"
          onClick={e => { e.stopPropagation(); e.preventDefault(); setShowModal(false); }}
        >Fermer Édition</button>
      }
      <img className="person-detail__photo" 
        src={eleve.photo_$_file} 
        alt="" 
        title="Réduire la fenêtre"
        onClick={e => {
          // e.target.parentNode.classList.toggle('--reduce')
          setIsReduced(!isReduced)
        }}
      />
      <h1 className="person-detail__title"><u>Élève:</u> {eleve.nom} {eleve.prenoms} ({eleve.sexe}) (<time dateTime={eleve.naissance_$_date}>{new Date(eleve.naissance_$_date).toLocaleDateString('fr-FR', { year: 'numeric', month: 'long', day: 'numeric' })}</time>)</h1>
      <ClasseDisplay classe={classe} label="En classe de:" />
      <ClasseEnseignantDisplay classe={classe} label="Enseignant de la classe:" />
       
      <div className="person-detail__gmap">
        <u>Domicilié (coordonées gmap): </u>
        <button className="person-detail__gmap-btn" onClick={() => setGmapOpen(o => !o)}>
          {gmapOpen ? 'Cacher' : eleve.adresse_$_map}
        </button>
        {gmapOpen && (
          <div className="person-detail__gmap-map">
            <Gmap 
              initialPosition={[eleve.adresse_$_map?.lat, eleve.adresse_$_map?.lng]} 
              zoom={16}
            />
          </div>
        )}
      </div>

      <Parent parents={eleve.parents} />

      <IsInterneBlock form={eleve} />

      {/* <DocumentsBlock form={eleve} readOnly={true} /> */}

      <AbsencesBlock absences={eleve.absences} />

      <BonusBlock bonus={eleve.bonus} />

      <ManusBlock manus={eleve.manus} />

      <CompositionsBlock compositions={eleve.compositions} schoolYear={schoolYear} onChangeYear={setSchoolYear} />
              
      <AddNoteForm notes={eleve.notes} />

      <div className="person-detail__block person-detail__block--history">
        <h2 className="person-detail__subtitle">Historique des écoles</h2>
        <SchoolHistoryBlock schoolHistory={eleve.school_history} />
      </div>
      <div className="person-detail__block person-detail__block--fees">
        <h2 className="person-detail__subtitle">Frais de scolarité</h2>
        {Object.keys(allFees).length === 0 ? <div>Aucun dépôt enregistré</div> :
          Object.entries(allFees).map(([year, fees]) => (
            <div key={year} style={{marginBottom:'1.3em'}}>
              <div style={{fontWeight:600,marginBottom:4}}>{year}</div>
              <ScolarityFeesBlock fees={fees} schoolYear={year} />
            </div>
          ))
        }
        <div style={{marginTop:'1em',fontSize:'0.97em',color:'#444'}}>
          <b>Total sur toutes années :</b> {totalArgent} F | {totalRiz} kg riz
        </div>
      </div>
      <div style={{margin:'2em 0 1em 0'}}>
        <h2>Commentaires</h2>
        <CommentairesBlock commentaires={eleve.commentaires} />
      </div>
    </main></DetailPortal>
}