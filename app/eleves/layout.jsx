"use client"

import Chart from "chart.js/auto"
import { useContext, useRef, useEffect, useState, useMemo } from "react";
import { AiAdminContext } from '../../stores/ai_adminContext';
import PermissionGate from '../components/PermissionGate';
import EleveCard from './EleveCard';
import './EleveCard.scss';
import { getLSItem } from "../../utils/localStorageManager";
import ImageScanner from '../components/ui/ImageScanner';
import ReviewFeesModal from '../components/ui/ReviewFeesModal';
import LoadingState from '../components/ui/LoadingState';
import { fetchBalance } from '../components/points/pointsApi';

export default function EcoleAdminEleveLayout({ children }) {
    const ctx = useContext(AiAdminContext);
    if (!ctx) return <div style={{ color: 'red' }}>Erreur : AiAdminContext non trouvé. Vérifiez que l'application est bien entourée par le provider.</div>;
    const { eleves, selected, setSelected, showModal, setShowModal, setEditType } = ctx
    const canvasRef = useRef();
    const chartInstance = useRef(null);
    const [filterByClasse, setFilterByClasse] = useState('toutes'); // 'toutes' ou niveau spécifique
    const [filterByGender, setFilterByGender] = useState('tous'); // 'tous', 'M', 'F'
    const [filterByInterne, setFilterByInterne] = useState('tous'); // 'tous', 'interne', 'externe'
    const [sortBy, setSortBy] = useState('nom'); // 'nom', 'classe'
    const [sortOrder, setSortOrder] = useState('asc'); // 'asc', 'desc'
    const [searchText, setSearchText] = useState(''); // Recherche textuelle
    const [viewMode, setViewMode] = useState('grid'); // 'grid', 'inline'
    const [isFilterPanelOpen, setIsFilterPanelOpen] = useState(false); // Toggle panneau des filtres
    const [balances, setBalances] = useState({});
    const [loadingBalances, setLoadingBalances] = useState(true);

    useEffect(() => {
        if (!Array.isArray(eleves) || eleves.length === 0) {
            setLoadingBalances(false);
            return;
        }
        setLoadingBalances(true);
        (async () => {
            try {
                const results = await Promise.all(
                    eleves.map(e => fetchBalance(e._id).then(b => [e._id, b.balance]).catch(() => [e._id, 0]))
                );
                if (results) {
                    setBalances(Object.fromEntries(results));
                }
            } catch (err) {
                console.error("Erreur chargement balances élèves:", err);
            } finally {
                setLoadingBalances(false);
            }
        })();
    }, [eleves]);

    const topStudents = useMemo(() => {
        if (loadingBalances) return [];
        return eleves
            .map(e => ({ student: e, balance: balances[e._id] ?? 0 }))
            .filter(item => item.balance > 0)
            .sort((a, b) => b.balance - a.balance)
            .slice(0, 3);
    }, [eleves, balances, loadingBalances]);

    // IA Analyse Fees States
    const [scanResult, setScanResult] = useState(null);
    const [validatedScannedData, setValidatedScannedData] = useState(null);

    const classOrderPriority = {
        CP1: 0,
        CP2: 1,
        CE1: 2,
        CE2: 3,
        CM1: 4,
        CM2: 5,
    };


    useEffect(() => {
        if (!Array.isArray(eleves)) return;

        const canvaCtx = document.getElementById('camembert').getContext('2d');
        // Détruit le graphique précédent si présent
        if (chartInstance.current) {
            chartInstance.current.destroy();
        }
        const data = eleves.reduce((acc, { sexe }) => {
            acc[sexe] = (acc[sexe] || 0) + 1;
            return acc;
        }, {});

        const labels = Object.keys(data).map(el => el + ": " + data[el]);
        const values = Object.values(data);
        chartInstance.current = new Chart(canvaCtx, {
            type: 'doughnut',
            data: {
                labels,
                datasets: [{
                    label: 'Nombre d\'élèves',
                    data: values,
                    backgroundColor: [
                        '#3b82f6', // Bleu vif pour Garçons
                        '#ec4899', // Rose vif pour Filles
                    ],
                    borderColor: '#ffffff',
                    borderWidth: 2,
                    hoverOffset: 15
                }]
            },
            options: {
                plugins: {
                    title: {
                        display: true,
                        text: 'Répartition par genre (Total: ' + (eleves.length || 0) + ')',
                        color: '#1E3A8A',
                        font: {
                            family: "'Inter', sans-serif",
                            size: 16,
                            weight: 'bold'
                        },
                        padding: {
                            bottom: 20
                        }
                    },
                    legend: {
                        position: 'bottom',
                        labels: {
                            color: '#495057',
                            padding: 20,
                            usePointStyle: true,
                            font: {
                                family: "'Poppins', sans-serif",
                                size: 12
                            }
                        },
                        onClick: (e, legendItem, legend) => {
                            e.stopPropagation();
                            const clickedGender = Object.keys(data)[legendItem.index];
                            setFilterByGender(filterByGender === clickedGender ? 'tous' : clickedGender);
                        }
                    }
                },
                onClick: (event, elements) => {
                    if (elements.length > 0) {
                        const clickedElementIndex = elements[0].index;
                        const clickedGender = Object.keys(data)[clickedElementIndex];
                        setFilterByGender(filterByGender === clickedGender ? 'tous' : clickedGender);
                    }
                },
                onHover: (event, elements) => {
                    event.native.target.style.cursor = elements.length > 0 ? 'pointer' : 'default';
                },
                responsive: false,
                maintainAspectRatio: false,
                cutout: '65%' // Pour un effet anneau plus élégant
            }
        });
    }, [eleves])

    // Calculer les statistiques pour les filtres
    const totalEleves = Array.isArray(eleves) ? eleves.length : 0;
    const internesCount = Array.isArray(eleves)
        ? eleves.filter(eleve => eleve.targetsList?.isInterne === "Interne").length
        : 0;
    const externesCount = totalEleves - internesCount;

    const handleValidateFees = async (validatedRows) => {
        setValidatedScannedData(validatedRows);

        // Obtenir l'année scolaire courante pour la clé
        const now = new Date();
        const year = now.getFullYear();
        const month = now.getMonth() + 1;
        const anneeKey = month < 7 ? `${year - 1}-${year}` : `${year}-${year + 1}`;

        // Mettre à jour chaque élève sélectionné
        for (const row of validatedRows) {
            if (!row.matchedStudentId) continue;

            const eleveToUpdate = eleves.find(e => e._id === row.matchedStudentId);
            if (!eleveToUpdate) continue;

            // Format de la date de paiement en timestamp (zéro heure) attendu par ScolarityFeesBlock
            let parsedDate = new Date(now.getTime());
            if (row.date) {
                parsedDate = new Date(row.date);
                if (isNaN(parsedDate.getTime())) {
                    parsedDate = new Date(now.getTime());
                }
            }
            parsedDate.setHours(0, 0, 0, 0);
            const paymentDateKey = parsedDate.getTime().toString();

            try {
                // Prépare le nouvel objet scolarity_fees_$_checkbox
                const existingFees = eleveToUpdate.scolarity_fees_$_checkbox || {};
                const yearFees = existingFees[anneeKey] || {};
                const dayFees = yearFees[paymentDateKey] || [];

                // Normaliser dayFees en tableau si c'est un objet (ancien format)
                const standardizedDayFees = Array.isArray(dayFees) ? [...dayFees] : [dayFees];

                // Ajouter le nouveau paiement (dynamic fees format)
                if (row.fees) {
                    // New dynamic format: row.fees = { scol_cash: 15000, scol_nature: 25 }
                    Object.entries(row.fees).forEach(([feeId, amount]) => {
                        if (amount > 0) {
                            standardizedDayFees.push({ feeId, amount, timestamp: Date.now() });
                        }
                    });
                } else {
                    // Legacy fallback (direct argent/riz from old callers)
                    if (row.argent > 0) {
                        standardizedDayFees.push({ feeId: 'scol_cash', amount: row.argent, timestamp: Date.now() });
                    }
                    if (row.riz > 0) {
                        standardizedDayFees.push({ feeId: 'scol_nature', amount: row.riz, timestamp: Date.now() });
                    }
                }

                const newScolarityFees = {
                    ...existingFees,
                    [anneeKey]: {
                        ...yearFees,
                        [paymentDateKey]: standardizedDayFees
                    }
                };

                // Appeler ctx.saveEleve
                await ctx.saveEleve({
                    _id: eleveToUpdate._id,
                    scolarity_fees_$_checkbox: newScolarityFees
                });
            } catch (error) {
                console.error("Erreur lors de la mise à jour des frais pour", eleveToUpdate.nom, error);
            }
        }

        // Fermer la fenetre
        setScanResult(null);
    };

    // Index classe par id (lookup O(1) au lieu d'un .find() par carte/comparaison)
    const classesById = useMemo(() => {
        const m = new Map();
        (ctx.classes || []).forEach(c => m.set(c._id, c));
        return m;
    }, [ctx.classes]);

    // Liste filtrée + triée mémoïsée : ne recalcule que si une dépendance change
    const displayedEleves = useMemo(() => {
        if (!Array.isArray(eleves)) return [];
        return eleves
            .filter(eleve => {
                let matchesClasse = true;
                if (filterByClasse !== 'toutes') {
                    const classe = classesById.get(eleve.current_classe);
                    matchesClasse = classe?.niveau === filterByClasse;
                }

                let matchesGender = true;
                if (filterByGender !== 'tous') {
                    matchesGender = eleve.sexe === filterByGender;
                }

                let matchesInterne = true;
                if (filterByInterne !== 'tous') {
                    if (filterByInterne === 'interne') {
                        matchesInterne = eleve.targetsList?.isInterne === "Interne";
                    } else if (filterByInterne === 'externe') {
                        matchesInterne = !eleve.targetsList?.isInterne || eleve.targetsList?.isInterne !== "Interne";
                    }
                }

                let matchesSearch = true;
                if (searchText.trim()) {
                    const searchLower = searchText.toLowerCase().trim();
                    const nom = eleve.nom || '';
                    const prenom = (Array.isArray(eleve.prenoms) ? eleve.prenoms.join('') : eleve.prenoms || '')
                        .normalize('NFD').replace(/[̀-ͯ]/g, "");
                    const nomComplet = `${nom} ${prenom}`.toLowerCase();
                    matchesSearch = nomComplet.includes(searchLower);
                }

                return matchesClasse && matchesGender && matchesInterne && matchesSearch;
            })
            .sort((a, b) => {
                let comparison = 0;
                if (sortBy === 'nom') {
                    const nomA = a.nom || '';
                    const nomB = b.nom || '';
                    const prenomA = (Array.isArray(a.prenoms) ? a.prenoms.join(' ') : a.prenoms) || '';
                    const prenomB = (Array.isArray(b.prenoms) ? b.prenoms.join(' ') : b.prenoms) || '';
                    comparison = nomA.localeCompare(nomB) || prenomA.localeCompare(prenomB);
                } else if (sortBy === 'classe') {
                    const niveauA = classesById.get(a.current_classe)?.niveau || '';
                    const niveauB = classesById.get(b.current_classe)?.niveau || '';
                    const priorityA = classOrderPriority?.[niveauA] ?? Number.MAX_SAFE_INTEGER;
                    const priorityB = classOrderPriority?.[niveauB] ?? Number.MAX_SAFE_INTEGER;
                    const nomA = a.nom || '';
                    const nomB = b.nom || '';
                    comparison = priorityA - priorityB || nomA.localeCompare(nomB);
                }
                return sortOrder === 'desc' ? -comparison : comparison;
            });
    }, [eleves, classesById, filterByClasse, filterByGender, filterByInterne, searchText, sortBy, sortOrder]);

    return (<>
        <h2 className="page-title">Liste des élèves</h2>
        
        <div className="eleves-header-grid">
            <div className="eleves-header-card --camembert">
                <canvas ref={canvasRef} id="camembert"
                    width={220}
                    height={220}
                    role="img"
                    aria-label={`Répartition des élèves par genre (total : ${totalEleves})`}
                ></canvas>
            </div>
            
            <div className="eleves-header-card --honors">
                <h3 className="eleves-header-card__title">🏆 Élèves à l'Honneur (Bons Points)</h3>
                {loadingBalances ? (
                    <div className="eleves-header-card__loading">Chargement des distinctions...</div>
                ) : topStudents.length === 0 ? (
                    <div className="eleves-header-card__empty">Aucun élève distingué pour le moment.</div>
                ) : (
                    <div className="eleves-header-card__honors-list">
                        {topStudents.map((item, idx) => {
                            const rankEmojis = ['🥇', '🥈', '🥉'];
                            const photo = item.student.cloudinary?.url || item.student.photo_$_file || item.student.photo || '/default-avatar.png';
                            const pName = Array.isArray(item.student.prenoms) ? item.student.prenoms.join(' ') : item.student.prenoms;
                            return (
                                <div key={item.student._id} className="eleves-header-card__honor-item">
                                    <span className="eleves-header-card__rank">{rankEmojis[idx] || '🎖️'}</span>
                                    <img src={photo} alt="" className="eleves-header-card__honor-avatar" />
                                    <div className="eleves-header-card__honor-info">
                                        <span className="eleves-header-card__honor-name">
                                            {item.student.nom} {pName}
                                        </span>
                                        <span className="eleves-header-card__honor-points">Solde : {item.balance} points</span>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>
        </div>

        <form className="infos_cards">
            {/* --- Top Bar: Search and Actions --- */}
            <div className="infos_cards__top-bar">
                {/* Recherche textuelle */}
                <div className="infos_cards__search-wrapper">
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor" width="18" height="18">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" />
                    </svg>
                    <input
                        id="search-input"
                        type="text"
                        className="infos_cards__search-input"
                        placeholder="Rechercher : Nom, prénom..."
                        value={searchText}
                        onChange={e => setSearchText(e.target.value)}
                        aria-label="Rechercher un élève par nom ou prénom"
                    />
                </div>

                <div className="infos_cards__top-bar-controls">
                    {/* Bouton Filtres */}
                    <button 
                        type="button" 
                        className={`infos_cards__btn infos_cards__btn--icon ${isFilterPanelOpen ? 'infos_cards__btn--active' : ''}`}
                        onClick={() => setIsFilterPanelOpen(!isFilterPanelOpen)}
                        title="Afficher/Masquer les filtres"
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor" width="16" height="16">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 6h9.75M10.5 6a1.5 1.5 0 11-3 0 1.5 1.5 0 013 0zm0 0H4.5m4.5 12h9.75M10.5 18a1.5 1.5 0 11-3 0 1.5 1.5 0 013 0zm0 0H4.5m4.5-6h9.75M10.5 12a1.5 1.5 0 11-3 0 1.5 1.5 0 013 0zm0 0H4.5" />
                        </svg>
                        Filtres
                    </button>

                    {/* Bouton Analyse IA — wrapper flex pour aligner au meme niveau */}
                    <PermissionGate roles={['admin', 'prof']}>
                        <ImageScanner
                            apiEndpoint="/api/school_ai/extract-fees"
                            label="🤖 Analyse IA"
                            className="infos_cards__btn infos_cards__btn--ai"
                            title="Scanner une liste de paiements de scolarité avec l'IA"
                            onScanComplete={(result) => {
                                if (result.success) {
                                    setScanResult(result);
                                } else {
                                    alert(result.error || "Erreur lors du scan");
                                }
                            }}
                        />
                    </PermissionGate>

                    {/* Bouton Ajouter */}
                    <PermissionGate roles={['admin', 'prof']}>
                        <button type="button" onClick={() => { setSelected(null); setEditType("eleve"); setShowModal(true); }} className="infos_cards__btn infos_cards__btn--primary">
                            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="2.5" stroke="currentColor" width="15" height="15">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
                            </svg>
                            Ajouter un élève
                        </button>
                    </PermissionGate>
                </div>
            </div>

            {/* --- Filter Panel --- */}
            <div className={`infos_cards__filter-panel ${isFilterPanelOpen ? 'infos_cards__filter-panel--open' : ''}`}>
                <div className="infos_cards__filter-header">
                    <h3 className="infos_cards__filter-title">Filtrer les élèves</h3>
                    <button type="button" className="infos_cards__filter-close" onClick={() => setIsFilterPanelOpen(false)} aria-label="Fermer le panneau de filtrage">✕</button>
                </div>

                {/* Filtre Classes */}
                <details className="infos_cards__control-group" open>
                    <summary className="infos_cards__label">Filtrer par classe</summary>
                    <div className="infos_cards__content">
                        <select
                            id="filter-select"
                            className="infos_cards__select"
                            value={filterByClasse}
                            onChange={e => setFilterByClasse(e.target.value)}
                            aria-label="Filtrer les élèves par classe"
                        >
                            <option value="toutes">Toutes les classes</option>
                            <option value="CP1">CP1</option>
                            <option value="CP2">CP2</option>
                            <option value="CE1">CE1</option>
                            <option value="CE2">CE2</option>
                            <option value="CM1">CM1</option>
                            <option value="CM2">CM2</option>
                        </select>
                    </div>
                </details>

                {/* Filtre Genre */}
                <details className="infos_cards__control-group">
                    <summary className="infos_cards__label">Filtrer par genre</summary>
                    <div className="infos_cards__content">
                        <select
                            id="gender-filter"
                            className="infos_cards__select"
                            value={filterByGender}
                            onChange={e => setFilterByGender(e.target.value)}
                            aria-label="Filtrer les élèves par genre"
                        >
                            <option value="tous">Tous les genres</option>
                            <option value="M">Garçons (M)</option>
                            <option value="F">Filles (F)</option>
                        </select>
                    </div>
                </details>

                {/* Ordre d'affichage (Sort) */}
                <details className="infos_cards__control-group" open>
                    <summary className="infos_cards__label">Ordre d'affichage</summary>
                    <div className="infos_cards__content" style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                        <select
                            id="sort-order"
                            className="infos_cards__select"
                            style={{ width: '100%', maxWidth: '300px' }}
                            value={sortOrder}
                            onChange={e => setSortOrder(e.target.value)}
                            aria-label="Choisir l'ordre de tri"
                        >
                            <option value="asc">Croissant (A → Z)</option>
                            <option value="desc">Décroissant (Z → A)</option>
                        </select>
                        <select
                            id="sort-by"
                            className="infos_cards__select"
                            style={{ width: '100%', maxWidth: '300px' }}
                            value={sortBy}
                            onChange={e => setSortBy(e.target.value)}
                            aria-label="Choisir le critère de tri"
                        >
                            <option value="nom">Trier par: Nom de famille</option>
                            <option value="classe">Trier par: Classe</option>
                        </select>
                        <small style={{ color: '#94a3b8', fontStyle: 'italic' }}>Le tri sera appliqué sur la sélection choisie ci-dessus</small>
                    </div>
                </details>

                {/* Filtre par statut interne/externe */}
                <details className="infos_cards__control-group" open>
                    <summary className="infos_cards__label">Filtrer par Status</summary>
                    <div className="infos_cards__content">
                        <select
                            id="interne-filter"
                            className="infos_cards__select"
                            value={filterByInterne}
                            onChange={e => setFilterByInterne(e.target.value)}
                            aria-label="Filtrer les élèves par statut interne/externe"
                        >
                            <option value="tous">Tous les status</option>
                            <option value="interne">Internes uniquement</option>
                            <option value="externe">Externes uniquement</option>
                        </select>
                    </div>
                </details>

                {/* Bouton de basculement d'affichage */}
                <div className="infos_cards__control-group infos_cards__layout-control">
                    <div className="infos_cards__label">Affichage</div>
                    <div className="infos_cards__content">
                        <button
                            type="button"
                            className={`infos_cards__view-toggle ${viewMode === 'grid' ? 'infos_cards__view-toggle--active' : ''}`}
                            onClick={() => setViewMode(viewMode === 'grid' ? 'inline' : 'grid')}
                            aria-label={`Basculer vers l'affichage ${viewMode === 'grid' ? 'en ligne' : 'en grille'}`}
                            title={`Affichage ${viewMode === 'grid' ? 'en ligne' : 'en grille'}`}
                        >
                            <span className="infos_cards__view-toggle-icon" aria-hidden="true">
                                {viewMode === 'grid' ? (
                                    // Icône « liste » (passer en affichage en ligne)
                                    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                        <line x1="8" y1="6" x2="21" y2="6" /><line x1="8" y1="12" x2="21" y2="12" /><line x1="8" y1="18" x2="21" y2="18" />
                                        <line x1="3" y1="6" x2="3.01" y2="6" /><line x1="3" y1="12" x2="3.01" y2="12" /><line x1="3" y1="18" x2="3.01" y2="18" />
                                    </svg>
                                ) : (
                                    // Icône « grille » (passer en affichage en grille)
                                    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                        <rect x="3" y="3" width="7" height="7" /><rect x="14" y="3" width="7" height="7" /><rect x="14" y="14" width="7" height="7" /><rect x="3" y="14" width="7" height="7" />
                                    </svg>
                                )}
                            </span>
                        </button>
                    </div>
                </div>
            </div>
        </form>

        {scanResult && scanResult.success && scanResult.file && (
            <ReviewFeesModal
                file={scanResult.file}
                extractedData={scanResult.data}
                students={eleves}
                onClose={() => setScanResult(null)}
                onValidate={handleValidateFees}
            />
        )}

        <hr />

        {Array.isArray(eleves) ?
            <ul className={`eleves-list ${viewMode === 'inline' ? 'eleves-list--inline' : ''}`}>
                {displayedEleves.map(eleve => (
                    <EleveCard
                        key={eleve._id}
                        classe={classesById.get(eleve.current_classe) || {}}
                        eleve={eleve}
                        onEdit={e => { setSelected(e); setEditType("eleve"); setShowModal(true); }}
                        viewMode={viewMode}
                    />
                ))}
            </ul>
            :
            <LoadingState label="Chargement des élèves…" />
        }

        {children}
    </>)
}