
"use client"

import { useContext,useRef, useEffect } from "react";
import { AiAdminContext } from '../../stores/ai_adminContext';
import EntityModal from '../components/EntityModal';
import PersonCard from '../components/PersonCard';

export default function EcoleAdminEleveLayout({ children }) {
    const ctx = useContext(AiAdminContext);
    if (!ctx) return <div style={{color:'red'}}>Erreur : AiAdminContext non trouvé. Vérifiez que l'application est bien entourée par le provider.</div>;
    const {enseignants, classes, selected, setSelected, showModal, setShowModal} = ctx

    
    return (<div>
        <h1>Liste des enseignants <button onClick={() => { setSelected(null); setShowModal(true); }} className={"ecole-admin__nav-btn"}>Ajouter un enseignant</button></h1>
        {enseignants ?
            <div className="enseignants-list">
                {enseignants.map(enseignant => (
                    <PersonCard
                    key={enseignant._id}
                    person={enseignant}
                    classe={classes.find(c => c._id === enseignant.current_classe) || {}}
                    type="enseignant"
                    onEdit={e => {console.log(e);
                     setSelected(e); setShowModal(true); }}
                    />
                ))}
            </div>
            :
            <div style={{textAlign:'center',marginTop:'2em',fontSize:'1.3em'}}>Chargement...</div>
        }
        {showModal && <EntityModal type="enseignant" entity={selected} onClose={() => setShowModal(false)} classes={ctx.classes || []} />}
        {children}
    </div>)
}