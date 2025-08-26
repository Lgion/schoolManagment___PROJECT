"use client"

// Liste des classes et gestion modale
import { useContext, useState, useEffect } from 'react';
import ClasseCard from './ClasseCard';
import EntityModal from '../components/EntityModal';
import { AiAdminContext } from '../../stores/ai_adminContext';

export default function ClassesPage({children}) {
  const ctx = useContext(AiAdminContext);
  if (!ctx) return <div style={{color:'red'}}>Erreur : AiAdminContext non trouvé. Vérifiez que l'application est bien entourée par le provider.</div>;
  const { classes = [], enseignants, eleves } = ctx;
  const [selected, setSelected] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [selectedYear, setSelectedYear] = useState(null); // null = toutes les années
  // console.log("enseignants");
  // console.log(enseignants);
  // console.log("eleves");
  // console.log(eleves);
  
  

  return (
    <div>
      <h1>Liste des classes <button onClick={() => { setSelected(null); setShowModal(true); }} className={"ecole-admin__nav-btn"}>Ajouter une classe</button></h1>
              
              {/* Badges de filtrage par année */}
              {classes && (
                <div className="year-filter">
                  {selectedYear && (
                    <button 
                      className="year-filter__reset"
                      onClick={() => setSelectedYear(null)}
                      title="Afficher toutes les années"
                    >
                      ✕
                    </button>
                  )}
                  <div className="year-filter__badges">
                    {[...new Set(classes.map(c => c.annee).filter(Boolean))]
                      .sort((a, b) => b.localeCompare(a)) // Ordre décroissant
                      .map(year => (
                        <button
                          key={year}
                          className={`year-filter__badge ${selectedYear === year ? 'year-filter__badge--active' : ''}`}
                          onClick={() => setSelectedYear(selectedYear === year ? null : year)}
                        >
                          {year.replace('-', '/')}
                        </button>
                      ))
                    }
                  </div>
                </div>
              )}
              
              {classes ? 
                  <div className="classes-list">
                        {(() => {
                          // Filtrer les classes selon l'année sélectionnée
                          const filteredClasses = selectedYear 
                            ? classes.filter(c => c.annee === selectedYear)
                            : classes;
                          
                          // Grouper les classes filtrées par année
                          const classesByYear = filteredClasses.reduce((acc, classe) => {
                            const year = classe.annee || 'Sans année';
                            if (!acc[year]) acc[year] = [];
                            acc[year].push(classe);
                            return acc;
                          }, {});
                          
                          // Trier les années par ordre décroissant (plus récente en premier)
                          const sortedYears = Object.keys(classesByYear).sort((a, b) => {
                            if (a === 'Sans année') return 1;
                            if (b === 'Sans année') return -1;
                            return b.localeCompare(a);
                          });
                          
                          return sortedYears.map(year => (
                            <div key={year} className="classes-list__year-group">
                              <div className="classes-list__year-separator">
                                <span className="classes-list__year-label">{year}</span>
                                <hr className="classes-list__year-line" />
                              </div>
                              <div className="classes-list__year-content">
                                {classesByYear[year]
                                  .sort((a, b) => {
                                    // Ordre des niveaux scolaires au sein de chaque année
                                    const niveauOrder = ['CP1', 'CP2', 'CE1', 'CE2', 'CM1', 'CM2'];
                                    const indexA = niveauOrder.indexOf(a.niveau);
                                    const indexB = niveauOrder.indexOf(b.niveau);
                                    
                                    if (indexA !== -1 && indexB !== -1) {
                                      return indexA - indexB;
                                    }
                                    return a.niveau.localeCompare(b.niveau);
                                  })
                                  .map(classe => (
                                    <ClasseCard
                                      key={classe._id}
                                      classe={classe}
                                      enseignants={enseignants}
                                      eleves={eleves.filter(e => e.current_classe === classe._id)}
                                      onEdit={e => { setSelected(e); setShowModal(true); }}
                                    />
                                  ))
                                }
                              </div>
                            </div>
                          ));
                        })()}
                  </div>
                  :
                  <div style={{textAlign:'center',marginTop:'2em',fontSize:'1.3em'}}>Chargement...</div>
              }
      {showModal && <EntityModal type="classe" entity={selected} onClose={() => setShowModal(false)} />}
      {children}
    </div>
  );
}

