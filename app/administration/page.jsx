"use client"

import { useState, useContext, useEffect, useMemo } from 'react';
import { AiAdminContext } from '../../stores/ai_adminContext';
import { useUserRole } from '../../stores/useUserRole';
import PermissionGate from '../components/PermissionGate';
import Link from 'next/link';

/**
 * Page d'Administration
 * Permet de gérer les 3 schémas principaux : Élèves, Enseignants, Classes
 */
export default function AdministrationPage() {
    const {
        eleves, fetchEleves,
        enseignants, fetchEnseignants,
        classes, fetchClasses,
        setSelected, setShowModal, setEditType
    } = useContext(AiAdminContext);

    const { isAdmin, loading: authLoading } = useUserRole();
    const [activeTab, setActiveTab] = useState('eleves'); // 'eleves', 'enseignants', 'classes'
    const [searchQuery, setSearchQuery] = useState('');

    useEffect(() => {
        fetchEleves();
        fetchEnseignants();
        fetchClasses();
    }, []);

    // Filtrage des données selon la recherche
    const filteredData = useMemo(() => {
        const query = searchQuery.toLowerCase();
        if (activeTab === 'eleves') {
            return eleves.filter(e =>
                e.nom?.toLowerCase().includes(query) ||
                e.prenoms?.toLowerCase().includes(query) ||
                e.matricule?.toLowerCase().includes(query)
            );
        } else if (activeTab === 'enseignants') {
            return enseignants.filter(e =>
                e.nom?.toLowerCase().includes(query) ||
                e.prenoms?.toLowerCase().includes(query) ||
                e.email_$_email?.toLowerCase().includes(query)
            );
        } else if (activeTab === 'classes') {
            return classes.filter(c =>
                c.niveau?.toLowerCase().includes(query) ||
                c.alias?.toLowerCase().includes(query) ||
                c.annee?.toLowerCase().includes(query)
            );
        }
        return [];
    }, [activeTab, searchQuery, eleves, enseignants, classes]);

    const handleEdit = (item, type) => {
        setSelected(item);
        setEditType(type);
        setShowModal(true);
    };

    const handleAdd = (type) => {
        setSelected({});
        setEditType(type);
        setShowModal(true);
    };

    if (authLoading) return <div className="admin-page__loading">Vérification des accès...</div>;

    return (
        <PermissionGate role="admin" fallback={<div className="admin-page__denied">Accès réservé aux administrateurs.</div>}>
            <div className="admin-page">
                <header className="admin-page__header">
                    <div className="admin-page__header-top">
                        <Link href="/" className="admin-page__back">← Retour Accueil</Link>
                        <h1 className="admin-page__title">⚙️ Configuration du Système</h1>
                    </div>

                    <div className="admin-page__stats-row">
                        <div className="admin-page__stat-card">
                            <span className="admin-page__stat-icon">👨‍🎓</span>
                            <div className="admin-page__stat-info">
                                <span className="admin-page__stat-value">{eleves.length}</span>
                                <span className="admin-page__stat-label">Élèves</span>
                            </div>
                        </div>
                        <div className="admin-page__stat-card">
                            <span className="admin-page__stat-icon">👨‍🏫</span>
                            <div className="admin-page__stat-info">
                                <span className="admin-page__stat-value">{enseignants.length}</span>
                                <span className="admin-page__stat-label">Enseignants</span>
                            </div>
                        </div>
                        <div className="admin-page__stat-card">
                            <span className="admin-page__stat-icon">🏫</span>
                            <div className="admin-page__stat-info">
                                <span className="admin-page__stat-value">{classes.length}</span>
                                <span className="admin-page__stat-label">Classes</span>
                            </div>
                        </div>
                    </div>

                    <nav className="admin-page__tabs">
                        <button
                            className={`admin-page__tab-btn ${activeTab === 'eleves' ? '--active' : ''}`}
                            onClick={() => setActiveTab('eleves')}
                        >
                            Élèves
                        </button>
                        <button
                            className={`admin-page__tab-btn ${activeTab === 'enseignants' ? '--active' : ''}`}
                            onClick={() => setActiveTab('enseignants')}
                        >
                            Enseignants
                        </button>
                        <button
                            className={`admin-page__tab-btn ${activeTab === 'classes' ? '--active' : ''}`}
                            onClick={() => setActiveTab('classes')}
                        >
                            Classes
                        </button>
                    </nav>

                    <div className="admin-page__controls">
                        <div className="admin-page__search-wrapper">
                            <input
                                type="text"
                                placeholder={`Rechercher un ${activeTab.slice(0, -1)}...`}
                                className="admin-page__search-input"
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                            />
                        </div>
                        <button className="admin-page__add-btn" onClick={() => handleAdd(activeTab === 'eleves' ? 'eleve' : activeTab === 'enseignants' ? 'enseignant' : 'classe')}>
                            + Ajouter {activeTab === 'eleves' ? 'un élève' : activeTab === 'enseignants' ? 'un enseignant' : 'une classe'}
                        </button>
                    </div>
                </header>

                <main className="admin-page__content">
                    <div className="admin-page__table-container">
                        <table className="admin-page__table">
                            <thead>
                                {activeTab === 'eleves' && (
                                    <tr>
                                        <th>Élève</th>
                                        <th>Sexe</th>
                                        <th>Date de naissance</th>
                                        <th>Classe Actuelle</th>
                                        <th>Actions</th>
                                    </tr>
                                )}
                                {activeTab === 'enseignants' && (
                                    <tr>
                                        <th>Enseignant</th>
                                        <th>Email / Tel</th>
                                        <th>Sexe</th>
                                        <th>Classes</th>
                                        <th>Actions</th>
                                    </tr>
                                )}
                                {activeTab === 'classes' && (
                                    <tr>
                                        <th>Niveau / Alias</th>
                                        <th>Année</th>
                                        <th>Effectif</th>
                                        <th>Prof. Principal</th>
                                        <th>Actions</th>
                                    </tr>
                                )}
                            </thead>
                            <tbody>
                                {filteredData.length > 0 ? filteredData.map((item) => (
                                    <tr key={item._id}>
                                        {activeTab === 'eleves' && (
                                            <>
                                                <td>
                                                    <div className="admin-page__item-identity">
                                                        <strong>{item.nom} {item.prenoms}</strong>
                                                        <span className="admin-page__item-id">{item._id.substring(0, 8)}</span>
                                                    </div>
                                                </td>
                                                <td>{item.sexe}</td>
                                                <td>{item.naissance_$_date ? new Date(item.naissance_$_date).toLocaleDateString() : '-'}</td>
                                                <td>{classes.find(c => c._id === item.current_classe)?.niveau || '-'}</td>
                                            </>
                                        )}
                                        {activeTab === 'enseignants' && (
                                            <>
                                                <td>
                                                    <div className="admin-page__item-identity">
                                                        <strong>{item.nom} {item.prenoms}</strong>
                                                    </div>
                                                </td>
                                                <td>
                                                    <div className="admin-page__item-contact">
                                                        <div>{item.email_$_email || '-'}</div>
                                                        <div className="--phone">{item.phone_$_tel || '-'}</div>
                                                    </div>
                                                </td>
                                                <td>{item.sexe}</td>
                                                <td>{Array.isArray(item.current_classes) ? item.current_classes.length : 0}</td>
                                            </>
                                        )}
                                        {activeTab === 'classes' && (
                                            <>
                                                <td>
                                                    <div className="admin-page__item-identity">
                                                        <strong>{item.niveau} {item.alias}</strong>
                                                    </div>
                                                </td>
                                                <td>{item.annee}</td>
                                                <td>{eleves.filter(e => e.current_classe === item._id).length} élèves</td>
                                                <td>{enseignants.find(e => e._id === item.prof_principal_id)?.nom || '-'}</td>
                                            </>
                                        )}
                                        <td>
                                            <div className="admin-page__actions">
                                                <button className="admin-page__action-btn --edit" onClick={() => handleEdit(item, activeTab === 'eleves' ? 'eleve' : activeTab === 'enseignants' ? 'enseignant' : 'classe')}>Éditer</button>
                                                <Link href={`/${activeTab}/${item._id}`} className="admin-page__action-btn --view">Voir</Link>
                                            </div>
                                        </td>
                                    </tr>
                                )) : (
                                    <tr>
                                        <td colSpan="5" className="admin-page__empty">Aucune donnée trouvée</td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </main>

                <style jsx>{`
                    .admin-page {
                        padding: 2rem;
                        max-width: 1400px;
                        margin: 0 auto;
                        font-family: 'Inter', sans-serif;
                    }
                    .admin-page__header-top {
                        display: flex;
                        align-items: center;
                        gap: 2rem;
                        margin-bottom: 2rem;
                    }
                    .admin-page__back {
                        text-decoration: none;
                        color: #666;
                        font-weight: 500;
                    }
                    .admin-page__title {
                        font-size: 2rem;
                        color: #2c3e50;
                        margin: 0;
                    }
                    .admin-page__stats-row {
                        display: flex;
                        gap: 1.5rem;
                        margin-bottom: 2rem;
                    }
                    .admin-page__stat-card {
                        background: white;
                        padding: 1.5rem;
                        border-radius: 12px;
                        display: flex;
                        align-items: center;
                        gap: 1rem;
                        flex: 1;
                        box-shadow: 0 4px 15px rgba(0,0,0,0.05);
                        border: 1px solid #f0f0f0;
                    }
                    .admin-page__stat-icon {
                        font-size: 2rem;
                        background: #f8f9fa;
                        width: 50px;
                        height: 50px;
                        display: flex;
                        align-items: center;
                        justify-content: center;
                        border-radius: 10px;
                    }
                    .admin-page__stat-value {
                        display: block;
                        font-size: 1.5rem;
                        font-weight: 700;
                        color: #2c3e50;
                    }
                    .admin-page__stat-label {
                        color: #7f8c8d;
                        font-size: 0.9rem;
                    }
                    .admin-page__tabs {
                        display: flex;
                        gap: 1rem;
                        margin-bottom: 2rem;
                        border-bottom: 2px solid #eee;
                        padding-bottom: 0.5rem;
                    }
                    .admin-page__tab-btn {
                        background: none;
                        border: none;
                        padding: 0.8rem 1.5rem;
                        font-size: 1.1rem;
                        font-weight: 600;
                        color: #95a5a6;
                        cursor: pointer;
                        position: relative;
                        transition: all 0.3s;
                    }
                    .admin-page__tab-btn.--active {
                        color: #3498db;
                    }
                    .admin-page__tab-btn.--active::after {
                        content: '';
                        position: absolute;
                        bottom: -0.7rem;
                        left: 0;
                        right: 0;
                        height: 3px;
                        background: #3498db;
                        border-radius: 3px;
                    }
                    .admin-page__controls {
                        display: flex;
                        justify-content: space-between;
                        align-items: center;
                        margin-bottom: 1.5rem;
                        gap: 1rem;
                    }
                    .admin-page__search-wrapper {
                        flex: 1;
                        max-width: 500px;
                    }
                    .admin-page__search-input {
                        width: 100%;
                        padding: 0.8rem 1.2rem;
                        border-radius: 8px;
                        border: 1px solid #ddd;
                        font-size: 1rem;
                    }
                    .admin-page__add-btn {
                        background: #27ae60;
                        color: white;
                        border: none;
                        padding: 0.8rem 1.5rem;
                        border-radius: 8px;
                        font-weight: 600;
                        cursor: pointer;
                        transition: all 0.2s;
                    }
                    .admin-page__add-btn:hover {
                        background: #219150;
                        transform: translateY(-2px);
                    }
                    .admin-page__table-container {
                        background: white;
                        border-radius: 12px;
                        overflow: hidden;
                        box-shadow: 0 4px 20px rgba(0,0,0,0.05);
                        border: 1px solid #eee;
                    }
                    .admin-page__table {
                        width: 100%;
                        border-collapse: collapse;
                        text-align: left;
                    }
                    .admin-page__table th {
                        background: #f8f9fa;
                        padding: 1.2rem;
                        font-weight: 600;
                        color: #2c3e50;
                        border-bottom: 2px solid #eee;
                    }
                    .admin-page__table td {
                        padding: 1.2rem;
                        border-bottom: 1px solid #f0f0f0;
                        vertical-align: middle;
                    }
                    .admin-page__item-identity {
                        display: flex;
                        flex-direction: column;
                    }
                    .admin-page__item-id {
                        font-size: 0.75rem;
                        color: #95a5a6;
                        font-family: monospace;
                    }
                    .admin-page__item-contact {
                        font-size: 0.9rem;
                    }
                    .admin-page__item-contact .--phone {
                        color: #7f8c8d;
                        margin-top: 0.2rem;
                    }
                    .admin-page__actions {
                        display: flex;
                        gap: 0.8rem;
                    }
                    .admin-page__action-btn {
                        padding: 0.5rem 1rem;
                        border-radius: 6px;
                        font-size: 0.85rem;
                        font-weight: 600;
                        cursor: pointer;
                        text-decoration: none;
                        display: inline-block;
                        transition: all 0.2s;
                    }
                    .admin-page__action-btn.--edit {
                        background: #eef7ff;
                        color: #3498db;
                        border: 1px solid #3498db;
                    }
                    .admin-page__action-btn.--view {
                        background: #f8f9fa;
                        color: #2c3e50;
                        border: 1px solid #ddd;
                    }
                    .admin-page__action-btn:hover {
                        opacity: 0.8;
                    }
                    .admin-page__empty {
                        text-align: center;
                        padding: 3rem;
                        color: #95a5a6;
                        font-style: italic;
                    }
                    .admin-page__loading, .admin-page__denied {
                        padding: 5rem;
                        text-align: center;
                        font-size: 1.2rem;
                        color: #666;
                    }
                `}</style>
            </div>
        </PermissionGate>
    );
}
