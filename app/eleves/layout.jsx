
"use client"

import Chart from "chart.js/auto"
import { useContext, useRef, useEffect } from "react";
import { AiAdminContext } from '../../stores/ai_adminContext';
import EntityModal from '../components/EntityModal';
import EleveCard from './EleveCard';
import './EleveCard.scss';

export default function EcoleAdminEleveLayout({ children }) {
    const ctx = useContext(AiAdminContext);
    if (!ctx) return <div style={{color:'red'}}>Erreur : AiAdminContext non trouvé. Vérifiez que l'application est bien entourée par le provider.</div>;
    const {eleves, selected, setSelected, showModal, setShowModal} = ctx
    const canvasRef = useRef();
    const chartInstance = useRef(null);
    
    

    useEffect(()=>{
        const canvaCtx = document.getElementById('camembert').getContext('2d');
        // Détruit le graphique précédent si présent
        if (chartInstance.current) {
        chartInstance.current.destroy();
        }
        const data = eleves.reduce((acc, {sexe}) => {
        acc[sexe] = (acc[sexe] || 0) + 1;
        return acc;
        }, {});
        
        const labels = Object.keys(data).map(el=>el+": "+data[el]);
        const values = Object.values(data);
        chartInstance.current = new Chart(canvaCtx, {
        type: 'pie',
        data: {
            labels,
            datasets: [{
            label: 'Nombre d\'élèves',
            data: values,
            backgroundColor: [
                'rgba(54, 162, 235, 0.2)',
                'rgba(255, 99, 132, 0.2)',
            ],
            borderColor: [
                'rgba(54, 162, 235, 1)',
                'rgba(255, 99, 132, 1)',
            ],
            borderWidth: 1
            }]
        },
        options: {
            plugins: {
            title: {
                display: true,
                text: 'Nombre d\'élèves: '+JSON.parse(localStorage.getItem('eleves'))?.length
            }
            }
        }
        });
    }, [eleves])
    
    return (<div>
        <h1>Liste des élèves <button onClick={() => { setSelected(null); setShowModal(true); }} className={"ecole-admin__nav-btn"}>Ajouter un élève</button></h1>
        <div style={{position: 'relative', width: 200, height: 200}}>
            <canvas ref={canvasRef} id="camembert"></canvas>
        </div>
        

        {eleves ? 
            <div className="eleves-list">
                {eleves.map(eleve => (
                    <EleveCard
                    key={eleve._id}
                    classe={(ctx.classes || []).find(c => c._id === eleve.current_classe) || {}}
                    eleve={eleve}
                    onEdit={e => { setSelected(e); setShowModal(true); }}
                    />
                ))}
            </div>
            :
            <div style={{textAlign:'center',marginTop:'2em',fontSize:'1.3em'}}>Chargement...</div>
        }

        {showModal && <EntityModal type="eleve" entity={selected} onClose={() => setShowModal(false)} classes={ctx.classes || []} />}

        {children}
    </div>)
}