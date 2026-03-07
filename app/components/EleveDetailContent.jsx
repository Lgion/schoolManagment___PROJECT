"use client"

import { useContext, useEffect, useState } from "react";
import { AiAdminContext } from '../../stores/ai_adminContext';
import { Parent, DocumentsBlock, IsInterneBlock, AddNoteForm, CompositionsBlock, SchoolHistoryBlock, ScolarityFeesBlock, CommentairesBlock, AbsencesBlock, BonusBlock, ManusBlock } from '../components/EntityModal.jsx';
import Gmap from '../_/Gmap_plus';
import PermissionGate from "../components/PermissionGate";
import { useEntityDetail, ClasseDisplay } from '../../utils/classeUtils';
import ClasseEnseignantDisplay from '../components/ClasseEnseignantDisplay';
import { getEleveImagePath } from '../../utils/imageUtils';
import HistoriqueBlock from '../components/HistoriqueBlock';

export default function EleveDetailContent({ entityId }) {
  const ctx = useContext(AiAdminContext);
  if (!ctx) return <div className="person-detail__error">Erreur : contexte non trouvé</div>;

  const getDefaultSchoolYear = (compositions) => {
    const keys = Object.keys(compositions || {});
    if (keys.length > 0) return keys[0];
    const now = new Date();
    return (now.getMonth() + 1) < 7 ? (now.getFullYear() - 1) + "-" + now.getFullYear() : now.getFullYear() + "-" + (now.getFullYear() + 1);
  };

  useEffect(() => {
    ctx.fetchEleves && ctx.fetchEleves();
    ctx.fetchClasses && ctx.fetchClasses();
    ctx.fetchSubjects && ctx.fetchSubjects();
  }, []);

  const { setSelected, showModal, setShowModal, dynamicSubjects, subjectsLoaded, classes } = ctx;
  const { entity: eleve, classe } = useEntityDetail(entityId, ctx, 'eleves');
  const [gmapOpen, setGmapOpen] = useState(false);
  const [schoolYear, setSchoolYear] = useState(getDefaultSchoolYear(eleve?.compositions || {}));

  if (!eleve) return <div className="person-detail__error">Élève introuvable</div>;

  // Récupère toutes les années de scolarité pour progression globale
  const allFees = eleve.scolarity_fees_$_checkbox || {};
  const onEdit = e => { setSelected(e); setShowModal(true); }

  // Fusionne tous les dépôts pour une progression globale
  let totalArgent = 0, totalRiz = 0;
  Object.values(allFees).forEach(fees => {
    Object.values(fees || {}).forEach(v => {
      if (v.argent) totalArgent += Number(v.argent);
      if (v.riz) totalRiz += Number(v.riz);
    });
  });
  return (
    <main className="person-detail">
      <PermissionGate roles={['admin', 'prof']}>
        {onEdit && !showModal && (
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
      </PermissionGate>
      <img className="person-detail__photo"
        src={getEleveImagePath(eleve)}
        alt=""
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

      <AbsencesBlock absences={eleve.absences} />

      <BonusBlock bonus={eleve.bonus} />

      <ManusBlock manus={eleve.manus} />

      <CompositionsBlock
        compositions={eleve.compositions}
        schoolYear={schoolYear}
        dynamicSubjects={dynamicSubjects}
        subjectsLoaded={subjectsLoaded}
        classes={classes}
      />

      <AddNoteForm notes={eleve.notes} />

      <div className="person-detail__block person-detail__block--history">
        <h2 className="person-detail__subtitle">Historique des écoles</h2>
        <SchoolHistoryBlock schoolHistory={eleve.school_history} />
      </div>
      <div className="person-detail__block person-detail__block--fees">
        <h2 className="person-detail__subtitle">Frais de scolarité</h2>
        {Object.keys(allFees).length === 0 ? <div>Aucun dépôt enregistré</div> :
          Object.entries(allFees).map(([year, fees]) => (
            <div key={year} className="person-detail__fees-year">
              <div className="person-detail__fees-year-label">{year}</div>
              <ScolarityFeesBlock fees={fees} schoolYear={year} />
            </div>
          ))
        }
        <div className="person-detail__fees-total">
          <b>Total sur toutes années :</b> {totalArgent} F | {totalRiz} kg riz
        </div>
      </div>
      <div className="person-detail__block person-detail__block--commentaires">
        <h2 className="person-detail__subtitle">Commentaires</h2>
        <CommentairesBlock commentaires={eleve.commentaires} />
      </div>

      {/* Story 1.5: Historique Inaltérable — Admin uniquement (Task 3) */}
      <PermissionGate roles={['admin']}>
        <div className="person-detail__block person-detail__block--historique">
          <HistoriqueBlock eleveId={entityId} />
        </div>
      </PermissionGate>
    </main>
  );
}
