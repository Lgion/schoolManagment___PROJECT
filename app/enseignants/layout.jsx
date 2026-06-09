
"use client"

import { useContext, useState } from "react";
import { AiAdminContext } from '../../stores/ai_adminContext';
import { useDetailPortal } from '../../stores/useDetailPortal';
import PersonCard from '../components/PersonCard';
import LoadingState from '../components/ui/LoadingState';

export default function EcoleAdminEleveLayout({ children }) {
    const ctx = useContext(AiAdminContext);
    const { openPortal } = useDetailPortal();
    if (!ctx) return <div style={{ color: 'red' }}>Erreur : AiAdminContext non trouvé. Vérifiez que l'application est bien entourée par le provider.</div>;
    const { enseignants, classes, selected, setSelected, showModal, setShowModal, setEditType } = ctx

    // États pour le filtrage et tri
    const [sortBy, setSortBy] = useState('nom'); // 'nom', 'classe'
    const [sortOrder, setSortOrder] = useState('asc'); // 'asc', 'desc'
    const [searchText, setSearchText] = useState(''); // Recherche textuelle
    const [viewMode, setViewMode] = useState('grid'); // 'grid', 'inline'

    return (<>
        <h2 className="page-title">Liste des enseignants</h2>

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
                            classes={(enseignant?.current_classes && Array.isArray(classes) && classes.length > 0) ? enseignant.current_classes.map(el => classes.find(c => c._id === el)).filter(Boolean) : []}
                            type="enseignant"
                            onEdit={e => { setSelected(e); setEditType("enseignant"); setShowModal(true); }}
                            viewMode={viewMode}
                        />
                    ))}
            </div>
            :
            <LoadingState label="Chargement des enseignants…" />
        }

        {children}
    </>)
}