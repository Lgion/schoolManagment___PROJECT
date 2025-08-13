"use client"

import Chart from "chart.js/auto"
import { useContext, useRef, useEffect, useState } from "react";
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
    const [filterByClasse, setFilterByClasse] = useState('toutes'); // 'toutes' ou niveau spécifique
    const [filterByGender, setFilterByGender] = useState('tous'); // 'tous', 'M', 'F'
    
    

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
            borderWidth: 1,
            hoverBackgroundColor: [
                'rgba(54, 162, 235, 0.4)',
                'rgba(255, 99, 132, 0.4)',
            ],
            hoverBorderWidth: 3
            }]
        },
        options: {
            plugins: {
            title: {
                display: true,
                text: 'Nombre d\'élèves: '+JSON.parse(localStorage.getItem('eleves'))?.length
            },
            legend: {
                onClick: (e, legendItem, legend) => {
                // Empêcher le comportement par défaut de masquer les sections
                e.stopPropagation();
                // Récupérer le genre cliqué
                const clickedGender = Object.keys(data)[legendItem.index];
                setFilterByGender(filterByGender === clickedGender ? 'tous' : clickedGender);
                }
            }
            },
            onClick: (event, elements) => {
            if (elements.length > 0) {
                // Récupérer l'index de la section cliquée
                const clickedElementIndex = elements[0].index;
                const clickedGender = Object.keys(data)[clickedElementIndex];
                
                // Basculer le filtre par genre
                setFilterByGender(filterByGender === clickedGender ? 'tous' : clickedGender);
                
                console.log(`Clic sur la section: ${clickedGender}`);
            }
            },
            onHover: (event, elements) => {
            // Changer le curseur au survol
            event.native.target.style.cursor = elements.length > 0 ? 'pointer' : 'default';
            }
        }
        });
    }, [eleves])
    
    return (<div>
        <h1>Liste des élèves <button onClick={() => { setSelected(null); setShowModal(true); }} className={"ecole-admin__nav-btn"}>Ajouter un élève</button></h1>
        <div className="infos_cards" style={{position: 'relative', width: 200, height: 200, display: "flex", alignItems: 'center', gap: '20px'}}>
            <canvas ref={canvasRef} id="camembert"></canvas>
            <div className="infos_cards__controls">
                <label htmlFor="filter-select" className="infos_cards__label">Filtrer par classe :</label>
                <select 
                    id="filter-select"
                    className="infos_cards__select"
                    value={filterByClasse} 
                    onChange={e => setFilterByClasse(e.target.value)}
                >
                    <option value="toutes">Toutes les classes</option>
                    <option value="CP1">CP1</option>
                    <option value="CP2">CP2</option>
                    <option value="CE1">CE1</option>
                    <option value="CE2">CE2</option>
                    <option value="CM1">CM1</option>
                    <option value="CM2">CM2</option>
                </select>
                
                <label htmlFor="gender-filter" className="infos_cards__label">Filtrer par genre :</label>
                <select 
                    id="gender-filter"
                    className="infos_cards__select"
                    value={filterByGender} 
                    onChange={e => setFilterByGender(e.target.value)}
                >
                    <option value="tous">Tous les genres</option>
                    <option value="M">Garçons (M)</option>
                    <option value="F">Filles (F)</option>
                </select>
            </div>
        </div>
        

        {eleves ? 
            <div className="eleves-list">
                {eleves
                    .filter(eleve => {
                        // Filtre par classe
                        let matchesClasse = true;
                        if (filterByClasse !== 'toutes') {
                            const classe = (ctx.classes || []).find(c => c._id === eleve.current_classe);
                            matchesClasse = classe?.niveau === filterByClasse;
                        }
                        
                        // Filtre par genre
                        let matchesGender = true;
                        if (filterByGender !== 'tous') {
                            matchesGender = eleve.sexe === filterByGender;
                        }
                        
                        return matchesClasse && matchesGender;
                    })
                    .sort((a, b) => a.nom.localeCompare(b.nom)) // Toujours trier par nom
                    .map(eleve => (
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