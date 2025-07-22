 "use client"

import Link from 'next/link';
import { useContext, useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { AiAdminContext } from '../../..//stores/ai_adminContext';
import Gmap from '../../_/Gmap_plus';

export default function EnseignantDetailPage() {
  const { id } = useParams();
  const router = useRouter();
  const ctx = useContext(AiAdminContext);
  if (!ctx) return <div style={{color:'red'}}>Erreur : contexte non trouvé</div>;
  useEffect(() => {
    ctx.fetchEnseignants && ctx.fetchEnseignants();
    ctx.fetchClasses && ctx.fetchClasses();
  }, []);

  const { setSelected, showModal, setShowModal } = ctx;
  const enseignant = (ctx.enseignants || []).find(e => String(e._id) === String(id));
  const classe = ctx.classes.find(c=>c._id==enseignant.current_classes)
  const [gmapOpen, setGmapOpen] = useState(false)

  if (!enseignant) return <div style={{color:'red'}}>Enseignant introuvable</div>;

  return !enseignant ? <div>....loading.....</div>
    : <div className="person-detail" style={{position:'relative'}}>
      <button
        className="person-detail__close"
        style={{position:'absolute',top:-15,right:5,color:'red',background:'none',border:'none',fontSize:'2em',cursor:'pointer',zIndex:10}}
        aria-label="Fermer"
        onClick={() => router.back()}
      >✕</button>
      {setSelected && !showModal && (
        <button
          type="button"
          className="person-detail__editbtn"
          onClick={e => { e.stopPropagation(); e.preventDefault(); setSelected(enseignant); setShowModal(true); }}
          tabIndex={0}
        >Éditer</button>
      )}
      {showModal && <button
          className="person-detail__editbtn"
          onClick={e => { e.stopPropagation(); e.preventDefault(); setShowModal(false); }}
        >Fermer Édition</button>
      }
      <img className="person-detail__photo" src={enseignant.photo_$_file || '/default-photo.png'} alt="" />
      <h1 className="person-detail__title"><u>Enseignant :</u> {enseignant.nom} {enseignant.prenoms} ({enseignant.sexe}) <span style={{fontWeight:400}}>[<time dateTime={enseignant.naissance_$_date}>{enseignant.naissance_$_date ? new Date(enseignant.naissance_$_date).toLocaleDateString('fr-FR', { year: 'numeric', month: 'long', day: 'numeric' }) : ''}</time>]</span></h1>
      <div className="person-detail__classe" style={{marginBottom:'1em'}}>
        <u>Classe principale :</u> <Link href={`/classes/${classe._id}`}>{classe.niveau} - {classe.alias}</Link>
      </div>
      <div className="person-detail__gmap">
        <u>Domicilié (coordonées gmap): </u>
        <button className="person-detail__gmap-btn" onClick={() => setGmapOpen(o => !o)}>
          {gmapOpen ? 'Cacher' : enseignant.adresse_$_map}
        </button>
        {gmapOpen && (
          <div className="person-detail__gmap-map">
            <Gmap 
              initialPosition={[enseignant.adresse_$_map?.lat, enseignant.adresse_$_map?.lng]} 
              zoom={16}
            />
          </div>
        )}
      </div>
      <div className="person-detail__contact" style={{marginBottom:'1em'}}>
        <u>Contact :</u><br/>
        <span style={{display:'block',margin:'0.3em 0'}}><b>Téléphone : </b>{enseignant.phone_$_tel  || <span style={{color:'grey'}}>Non renseigné</span>}</span>
        <span style={{display:'block',margin:'0.3em 0'}}><b>Email : </b>{enseignant.email_$_email || <span style={{color:'grey'}}>Non renseigné</span>}</span>
      </div>
      {/* Ajoute ici d'autres blocs d'infos si besoin */}
    </div>
}