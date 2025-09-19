 "use client"

import { useContext, useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { AiAdminContext } from '../../../stores/ai_adminContext';
import { Parent, DocumentsBlock, IsInterneBlock, AddNoteForm, CompositionsBlock, SchoolHistoryBlock, ScolarityFeesBlock, CommentairesBlock, AbsencesBlock, BonusBlock, ManusBlock } from '../../components/EntityModal.jsx';
import Gmap from '../../_/Gmap_plus';
import { useEntityDetail, ClasseDisplay } from '../../../utils/classeUtils';
import { getEnseignantImagePath } from '../../../utils/imageUtils';
import DetailPortal from "../../components/DetailPortal";

export default function EnseignantDetailPage() {
  const { id } = useParams();
  const router = useRouter();
  const ctx = useContext(AiAdminContext);
  const [isReduced, setIsReduced] = useState(false);
  
  if (!ctx) return <div style={{color:'red'}}>Erreur : contexte non trouvé</div>;
  useEffect(() => {
    ctx.fetchEnseignants && ctx.fetchEnseignants();
    ctx.fetchClasses && ctx.fetchClasses();
    ctx.fetchEleves && ctx.fetchEleves();
  }, []);

  const { setSelected, showModal, setShowModal, setEditType } = ctx;
  const { entity: enseignant, classe } = useEntityDetail(id, ctx, 'enseignants');
  const [gmapOpen, setGmapOpen] = useState(false);

  if (!enseignant) return <div style={{color:'red'}}>Enseignant introuvable</div>;

  // Récupérer les classes assignées à cet enseignant
  const classesAssignees = (ctx.classes || []).filter(c => 
    Array.isArray(enseignant.current_classes) && enseignant.current_classes.includes(c._id)
  );

  // Récupérer tous les élèves des classes de cet enseignant
  const elevesEnseignes = (ctx.eleves || []).filter(e => 
    classesAssignees.some(c => e.current_classe === c._id)
  );

  return !enseignant ? <div>....loading.....</div>
    : 
    <DetailPortal
      isOpen={true}
      onClose={()=>router.back()}
      title={`Enseignant ${enseignant.nom} ${enseignant.prenoms}`}
      icon={"👨‍🏫"}
      reduced={[isReduced,setIsReduced]}
    ><main className={`person-detail ${isReduced ? '--reduce' : ''}`}>
      {setSelected && !showModal && (
        <button
          type="button"
          className="person-detail__editbtn"
          onClick={e => { e.stopPropagation(); e.preventDefault(); setSelected(enseignant); setEditType("enseignant"); setShowModal(true); }}
          tabIndex={0}
        >Éditer</button>
      )}
      {showModal && <button
          className="person-detail__editbtn"
          onClick={e => { e.stopPropagation(); e.preventDefault(); setShowModal(false); }}
        >Fermer Édition</button>
      }

      {/* En-tête de l'enseignant */}
      <div className="person-detail__header">
        <div className="person-detail__header-content">
          <div className="person-detail__header-info">
            <h1 className="person-detail__title">
              {enseignant.nom} {enseignant.prenoms}
            </h1>
            <p className="person-detail__subtitle-text">
              Enseignant • {enseignant.sexe === 'M' ? 'Homme' : 'Femme'}
            </p>
            {enseignant.naissance_$_date && (
              <p className="person-detail__subtitle-text">
                Né(e) le {new Date(enseignant.naissance_$_date).toLocaleDateString('fr-FR', { 
                  year: 'numeric', month: 'long', day: 'numeric' 
                })}
              </p>
            )}
          </div>
          <div className="person-detail__header-image">
            <img 
              className="person-detail__photo" 
              src={getEnseignantImagePath(enseignant)} 
              alt={`${enseignant.nom} ${enseignant.prenoms}`}
              onError={(e) => {
                e.target.src = '/school/default-teacher.webp';
              }}
              onClick={e => {
                e.preventDefault();
                // e.target.closest('.person-detail').classList.toggle('--reduce')
                // e.target.closest('.person-detail').classList.toggle('--')
                setIsReduced(!isReduced)
              }}  
            />
          </div>
        </div>
      </div>

      {// Statistiques rapides 
      }
{/*
      <div className="person-detail__stats">
        <div className="person-detail__stat-card">
          <div className="person-detail__stat-icon">🏫</div>
          <div className="person-detail__stat-content">
            <span className="person-detail__stat-number">{classesAssignees.length}</span>
            <span className="person-detail__stat-label">Classes</span>
          </div>
        </div>
        <div className="person-detail__stat-card">
          <div className="person-detail__stat-icon">👨‍🎓</div>
          <div className="person-detail__stat-content">
            <span className="person-detail__stat-number">{elevesEnseignes.length}</span>
            <span className="person-detail__stat-label">Élèves</span>
          </div>
        </div>
        <div className="person-detail__stat-card">
          <div className="person-detail__stat-icon">📞</div>
          <div className="person-detail__stat-content">
            <span className="person-detail__stat-number">{enseignant.phone_$_tel ? '✓' : '✗'}</span>
            <span className="person-detail__stat-label">Contact</span>
          </div>
        </div>
      </div>
*/}

      {/* Classes assignées */}
      <div className="person-detail__block person-detail__block--classes">
        <h2 className="person-detail__subtitle">
          <span className="person-detail__subtitle-icon">🏫</span>
          Classes assignées
        </h2>
        {classesAssignees.length === 0 ? (
          <div className="person-detail__empty">
            <div className="person-detail__empty-icon">🏫</div>
            <p className="person-detail__empty-text">Aucune classe assignée</p>
          </div>
        ) : (
          <div className="person-detail__grid">
            {classesAssignees.map(classe => (
              <div key={classe._id} className="person-detail__card">
                <div className="person-detail__card-avatar">🏫</div>
                <div className="person-detail__card-content">
                  <h3 className="person-detail__card-name">{classe.niveau} {classe.alias}</h3>
                  <p className="person-detail__card-role">Année {classe.annee}</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Informations de contact */}
      <div className="person-detail__block person-detail__block--contact">
        <h2 className="person-detail__subtitle">
          <span className="person-detail__subtitle-icon">📞</span>
          Informations de contact
        </h2>
        <div className="person-detail__contact-info">
          <div className="person-detail__contact-item">
            <span className="person-detail__contact-label">Téléphone :</span>
            <span className="person-detail__contact-value">
              {enseignant.phone_$_tel || <span style={{color:'grey'}}>Non renseigné</span>}
            </span>
          </div>
          <div className="person-detail__contact-item">
            <span className="person-detail__contact-label">Email :</span>
            <span className="person-detail__contact-value">
              {enseignant.email_$_email || <span style={{color:'grey'}}>Non renseigné</span>}
            </span>
          </div>
        </div>
      </div>

      {/* Localisation */}
      {enseignant.adresse_$_map && (
        <div className="person-detail__block person-detail__block--location">
          <h2 className="person-detail__subtitle">
            <span className="person-detail__subtitle-icon">📍</span>
            Localisation
          </h2>
          <div className="person-detail__location">
            <button 
              className="person-detail__location-btn" 
              onClick={() => setGmapOpen(o => !o)}
            >
              {gmapOpen ? '🔼 Masquer la carte' : '🔽 Afficher sur la carte'}
            </button>
            {gmapOpen && (
              <div className="person-detail__location-map">
                <Gmap 
                  initialPosition={[enseignant.adresse_$_map?.lat, enseignant.adresse_$_map?.lng]} 
                  zoom={16}
                />
              </div>
            )}
          </div>
        </div>
      )}
    </main>
    </DetailPortal>
}