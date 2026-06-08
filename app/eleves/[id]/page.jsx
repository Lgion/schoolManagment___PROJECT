"use client";
import { useContext, useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { AiAdminContext } from '../../../stores/ai_adminContext';
import { Parent, DocumentsBlock, TargetsProfilingBlock, AddNoteForm, CompositionsBlock, SchoolHistoryBlock, ScolarityFeesBlock, CommentairesBlock, AbsencesBlock, BonusBlock, ManusBlock } from '../../components/EntityModal.jsx';
import { generateSchoolYears } from '../../components/entityBlocks';
import Gmap from '../../_/Gmap_plus';
import PermissionGate from "../../components/PermissionGate";
import { useEntityDetail, ClasseDisplay } from '../../../utils/classeUtils';
import ClasseEnseignantDisplay from '../../components/ClasseEnseignantDisplay';
import { getEleveImagePath } from '../../../utils/imageUtils';
import { useDetailPortal } from '../../../stores/useDetailPortal';
import DetailPortal from "../../components/DetailPortal"

export default function ElevePage() {
  const { id } = useParams();
  const router = useRouter();
  const ctx = useContext(AiAdminContext);

  if (!ctx) return <div style={{ color: 'red' }}>Erreur : contexte non trouvé</div>;
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

  const { setSelected, showModal, setShowModal, setEditType, dynamicSubjects, subjectsLoaded, classes, feeDefinitions, normalizeFeeItem } = ctx;

  const { entity: eleve, classe } = useEntityDetail(id, ctx, 'eleves');
  const [gmapOpen, setGmapOpen] = useState(false)
  const [schoolYear, setSchoolYear] = useState(getDefaultSchoolYear(eleve?.compositions || {}));
  if (!eleve) return <div style={{ color: 'red' }}>Élève introuvable</div>;

  const onEdit = e => { setSelected(e); setEditType("eleve"); setShowModal(true); }

  // Créer le select d'année scolaire pour le header
  const yearSelectControl = (
    <select
      className="detailModal__yearSelect"
      value={schoolYear}
      onChange={e => setSchoolYear(e.target.value)}
    >
      {(() => {
        // generateSchoolYears est désormais partagé depuis entityBlocks (même logique que CompositionsBlock)
        const { years, currentYearStart } = generateSchoolYears(eleve?.compositions);

        return years.map(y => {
          const start = parseInt(y.split('-')[0], 10);
          let color = '';
          if (start === currentYearStart) color = 'green';
          else if (start < currentYearStart) color = 'red';
          else color = 'blue';
          return <option key={y} value={y} className={"option_" + color}>{y}</option>;
        });
      })()}
    </select>
  );

  return !eleve ? <div>....loading.....</div>
    :
    <DetailPortal
      isOpen={true}
      onClose={() => router.back()}
      title={`${eleve.nom} ${Array.isArray(eleve.prenoms) ? eleve.prenoms.join(' ') : eleve.prenoms}`}
      icon="🎓"
      headerControls={yearSelectControl}
    ><main className="person-detail">

        <PermissionGate roles={['admin', 'prof']}>
          {onEdit && (
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
          alt={`${eleve.nom} ${Array.isArray(eleve.prenoms) ? eleve.prenoms.join(' ') : eleve.prenoms}`}
        />
        <h1 className="person-detail__title"><u>Élève:</u> {eleve.nom} {Array.isArray(eleve.prenoms) ? eleve.prenoms.join(' ') : eleve.prenoms} ({eleve.sexe}) (<time dateTime={eleve.naissance_$_date}>{new Date(eleve.naissance_$_date).toLocaleDateString('fr-FR', { year: 'numeric', month: 'long', day: 'numeric' })}</time>)</h1>
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

        <TargetsProfilingBlock form={eleve} />

        {/* <DocumentsBlock form={eleve} readOnly={true} /> */}
        <section>
          <AbsencesBlock absences={eleve.absences} />

          <BonusBlock bonus={eleve.bonus} />

          <ManusBlock manus={eleve.manus} />
        </section>

        <CompositionsBlock
          compositions={eleve.compositions}
          schoolYear={schoolYear}
          dynamicSubjects={dynamicSubjects}
          subjectsLoaded={subjectsLoaded}
          classes={classes}
        />

        {/* <AddNoteForm notes={eleve.notes} /> */}

        <div className="person-detail__block person-detail__block--history">
          <h2 className="person-detail__subtitle">Historique des écoles</h2>
          <SchoolHistoryBlock schoolHistory={eleve.school_history} />
        </div>
        <PermissionGate role="admin">
          {(() => {
            // Financial data computation - only executed for admins
            const allFees = eleve.scolarity_fees_$_checkbox || {};
            const totals = {};
            feeDefinitions.forEach(def => totals[def.id] = 0);

            Object.values(allFees).forEach(yearEntries => {
              Object.values(yearEntries || {}).forEach(deposits => {
                const entriesList = Array.isArray(deposits) ? deposits : [deposits];
                entriesList.forEach(d => {
                  const normalized = normalizeFeeItem(d);
                  if (normalized && totals[normalized.feeId] !== undefined) {
                    totals[normalized.feeId] += normalized.amount;
                  }
                });
              });
            });
            return (
              <div className="person-detail__block person-detail__block--fees">
                <h2 className="person-detail__subtitle">Frais de scolarité</h2>
                {Object.keys(allFees).length === 0 ? <div>Aucun dépôt enregistré</div> :
                  Object.entries(allFees).map(([year, fees]) => (
                    <div key={year} style={{ marginBottom: '1.3em' }}>
                      <div style={{ fontWeight: 600, marginBottom: 4 }}>{year}</div>
                      <ScolarityFeesBlock fees={fees} schoolYear={year} targetsList={eleve.targetsList || {}} />
                    </div>
                  ))
                }
                <div style={{ marginTop: '1em', fontSize: '0.97em', color: '#444' }}>
                  <b>Total sur toutes années :</b> {feeDefinitions.map((def, idx) => (
                    <span key={def.id}>
                      {totals[def.id]} {def.unit}{idx < feeDefinitions.length - 1 ? ' | ' : ''}
                    </span>
                  ))}
                </div>
              </div>
            );
          })()}
        </PermissionGate>
        <div style={{ margin: '2em 0 1em 0' }}>
          <h2>Commentaires</h2>
          <CommentairesBlock commentaires={eleve.commentaires} />
        </div>
      </main></DetailPortal>
}