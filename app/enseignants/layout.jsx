
"use client"

import { useContext,useRef, useEffect, useState } from "react";
import { AiAdminContext } from '../../stores/ai_adminContext';
import EntityModal from '../components/EntityModal';
import PersonCard from '../components/PersonCard';

export default function EcoleAdminEleveLayout({ children }) {
    const ctx = useContext(AiAdminContext);
    if (!ctx) return <div style={{color:'red'}}>Erreur : AiAdminContext non trouvé. Vérifiez que l'application est bien entourée par le provider.</div>;
    const {enseignants, classes, selected, setSelected, showModal, setShowModal} = ctx

    // États pour le filtrage et tri
    const [sortBy, setSortBy] = useState('nom'); // 'nom', 'classe'
    const [sortOrder, setSortOrder] = useState('asc'); // 'asc', 'desc'
    const [searchText, setSearchText] = useState(''); // Recherche textuelle
    const [viewMode, setViewMode] = useState('grid'); // 'grid', 'inline'

    console.log(enseignants);
    console.log(enseignants);
    return (<div>
        <h1>Liste des enseignants <button onClick={() => { setSelected(null); setShowModal(true); }} className={"ecole-admin__nav-btn"}>Ajouter un enseignant</button></h1>
        
        {/* Contrôles de filtrage et tri */}
        <div className="infos_cards__controls">
            {/* Recherche textuelle */}
            <div className="infos_cards__control-group">
                <label htmlFor="search-input-enseignants" className="infos_cards__label">🔍 Rechercher :</label>
                <input 
                    id="search-input-enseignants"
                    type="text"
                    className="infos_cards__search-input"
                    placeholder="Nom, prénom..."
                    value={searchText}
                    onChange={e => setSearchText(e.target.value)}
                    aria-label="Rechercher un enseignant par nom ou prénom"
                />
            </div>

            {/* Contrôles de tri */}
            <div className="infos_cards__control-group">
                <label htmlFor="sort-by-enseignants" className="infos_cards__label">📊 Trier par :</label>
                <select 
                    id="sort-by-enseignants"
                    className="infos_cards__select"
                    value={sortBy}
                    onChange={e => setSortBy(e.target.value)}
                    aria-label="Choisir le critère de tri"
                >
                    <option value="nom">Nom de famille</option>
                    <option value="classe">Nombre de classes</option>
                </select>
            </div>

            <div className="infos_cards__control-group">
                <label htmlFor="sort-order-enseignants" className="infos_cards__label">🔄 Ordre :</label>
                <select 
                    id="sort-order-enseignants"
                    className="infos_cards__select"
                    value={sortOrder}
                    onChange={e => setSortOrder(e.target.value)}
                    aria-label="Choisir l'ordre de tri"
                >
                    <option value="asc">Croissant (A→Z)</option>
                    <option value="desc">Décroissant (Z→A)</option>
                </select>
            </div>

            {/* Bouton de basculement d'affichage */}
            <div className="infos_cards__control-group">
                <label className="infos_cards__label">👁️ Affichage :</label>
                <button 
                    className={`infos_cards__view-toggle ${viewMode === 'grid' ? 'infos_cards__view-toggle--active' : ''}`}
                    onClick={() => setViewMode(viewMode === 'grid' ? 'inline' : 'grid')}
                    aria-label={`Basculer vers l'affichage ${viewMode === 'grid' ? 'en ligne' : 'en grille'}`}
                    title={`Affichage ${viewMode === 'grid' ? 'en ligne' : 'en grille'}`}
                >
                    <span className="infos_cards__view-toggle-icon">
                        {viewMode === 'grid' ? '📋' : '⊞'}
                    </span>
                    <span className="infos_cards__view-toggle-text">
                        {viewMode === 'grid' ? 'Ligne' : 'Grille'}
                    </span>
                </button>
            </div>
        </div>
        
        {enseignants ?
            <div className={`enseignants-list ${viewMode === 'inline' ? 'enseignants-list--inline' : ''}`}>
                {enseignants
                    .filter(enseignant => {
                        // Filtre par recherche textuelle
                        let matchesSearch = true;
                        if (searchText.trim()) {
                            const searchLower = searchText.toLowerCase().trim();
                            const nom = enseignant.nom || '';
                            const prenom = enseignant.prenom || '';
                            const nomComplet = `${nom} ${prenom}`.toLowerCase();
                            matchesSearch = nomComplet.includes(searchLower);
                        }
                        
                        return matchesSearch;
                    })
                    .sort((a, b) => {
                        let comparison = 0;
                        
                        if (sortBy === 'nom') {
                            // Tri par nom de famille puis prénom (avec vérifications de sécurité)
                            const nomA = a.nom || '';
                            const nomB = b.nom || '';
                            const prenomA = a.prenom || '';
                            const prenomB = b.prenom || '';
                            comparison = nomA.localeCompare(nomB) || prenomA.localeCompare(prenomB);
                        } else if (sortBy === 'classe') {
                            // Tri par nombre de classes assignées
                            const nbClassesA = a.current_classes?.length || 0;
                            const nbClassesB = b.current_classes?.length || 0;
                            const nomA = a.nom || '';
                            const nomB = b.nom || '';
                            comparison = nbClassesA - nbClassesB || nomA.localeCompare(nomB);
                        }
                        
                        // Inverser l'ordre si décroissant
                        return sortOrder === 'desc' ? -comparison : comparison;
                    })
                    .map(enseignant => (
                        <PersonCard
                        key={enseignant._id}
                        person={enseignant}
                        classes={enseignant?.current_classes.map(el=>classes.find(c => c._id === el))}
                        type="enseignant"
                        onEdit={e => {console.log(e);
                         setSelected(e); setShowModal(true); }}
                        viewMode={viewMode}
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