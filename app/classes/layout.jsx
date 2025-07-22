"use client"

// Liste des classes et gestion modale
import { useContext, useState, useEffect } from 'react';
import ClasseCard from './ClasseCard';
import EntityModal from '../components/EntityModal';
import { AiAdminContext } from '../../stores/ai_adminContext';

export default function ClassesPage({children}) {
  const ctx = useContext(AiAdminContext);
  if (!ctx) return <div style={{color:'red'}}>Erreur : AiAdminContext non trouvé. Vérifiez que l'application est bien entourée par le provider.</div>;
  const { classes = [] } = ctx;
  const [selected, setSelected] = useState(null);
  const [showModal, setShowModal] = useState(false);


  return (
    <div>
      <h1>Liste des classes <button onClick={() => { setSelected(null); setShowModal(true); }} className={"ecole-admin__nav-btn"}>Ajouter une classe</button></h1>
              {classes ? 
                  <div className="classes-list">
                      {classes.map(classe => (
                          <ClasseCard
                          key={classe._id}
                          classe={classe}
                          onEdit={e => { setSelected(e); setShowModal(true); }}
                          />
                      ))}
                  </div>
                  :
                  <div style={{textAlign:'center',marginTop:'2em',fontSize:'1.3em'}}>Chargement...</div>
              }
      {showModal && <EntityModal type="classe" entity={selected} onClose={() => setShowModal(false)} />}
      {children}
    </div>
  );
}

