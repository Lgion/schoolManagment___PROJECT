"use client"

import { useContext, useState } from 'react';
import Link from 'next/link';
import ClasseCard from './ClasseCard';
import { AiAdminContext } from '../../stores/ai_adminContext';
import LoadingState from '../components/ui/LoadingState';

export default function ClassesPage({ children }) {

  const ctx = useContext(AiAdminContext);
  if (!ctx) return <div style={{ color: 'red' }}>Erreur : AiAdminContext non trouvé. Vérifiez que l'application est bien entourée par le provider.</div>;
  const { classes = [], enseignants, eleves, setSelected, setShowModal, setEditType } = ctx;
  const [selectedYear, setSelectedYear] = useState(null); // null = toutes les années

  return (<>
    <h2 className="page-title">Liste des classes
    </h2>

    <div className="ecole-admin__nav-actions">
      <Link href="/scheduling" className="ecole-admin__nav-link-item">
        <span className="icon">📅</span> Accéder au Planning (Schedules)
      </Link>
    </div>

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

          return sortedYears.map(year => {
            // Grouper par niveau au sein de l'année
            const classesByLevel = classesByYear[year].reduce((acc, classe) => {
              const level = classe.niveau || 'Sans niveau';
              if (!acc[level]) acc[level] = [];
              acc[level].push(classe);
              return acc;
            }, {});

            const niveauOrder = ['CP1', 'CP2', 'CE1', 'CE2', 'CM1', 'CM2'];
            const sortedLevels = Object.keys(classesByLevel).sort((a, b) => {
              const indexA = niveauOrder.indexOf(a);
              const indexB = niveauOrder.indexOf(b);
              if (indexA !== -1 && indexB !== -1) return indexA - indexB;
              return a.localeCompare(b);
            });

            return (
              <div key={year} className="classes-list__year-group">
                <div className="classes-list__year-content">
                  {sortedLevels.map(level => (
                    <div key={level} className={`classes-list__level-group classes-list__level-group--multiple`}>
                      {classesByLevel[level].length > 1 && (
                        <h3 className="classes-list__level-title">{level}</h3>
                      )}
                      <div className="classes-list__level-content">
                        {classesByLevel[level].map(classe => (
                          <ClasseCard
                            key={classe._id}
                            classe={classe}
                            enseignants={enseignants}
                            eleves={eleves.filter(e => e.current_classe === classe._id)}
                            onEdit={e => { setSelected(e); setEditType("classe"); setShowModal(true); }}
                          />
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            );
          });
        })()}
      </div>
      :
      <LoadingState label="Chargement des classes…" />
    }

    {children}
  </>
  );
}
