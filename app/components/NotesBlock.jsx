"use client"
import Link from 'next/link';

import { useState, useMemo, useContext } from 'react';
import { AiAdminContext } from '../../stores/ai_adminContext';

export default function NotesBlock({ eleves, classeId, isCurrentYear, allSubjects = [] }) {
  const ctx = useContext(AiAdminContext);
  const [selectedComposition, setSelectedComposition] = useState('latest');
  const [sortBy, setSortBy] = useState('note'); // 'note', 'nom', 'moyenne'
  const [sortOrder, setSortOrder] = useState('desc'); // 'asc', 'desc'
  const [selectedMatiere, setSelectedMatiere] = useState('all');

  const getSubName = (id) => {
    const sub = allSubjects.find(s => s.id === id);
    return sub ? sub.nom : id;
  };

  // Résoudre les élèves complets (gérer les cas où eleves contient des IDs)
  const elevesComplets = useMemo(() => {
    if (!ctx.eleves) return [];

    return eleves.map(eleve => {
      // Si eleve est juste un ID ou un objet partiel, le résoudre via ctx.eleves
      const student = ctx.eleves.find(el => el._id === (eleve._id || eleve));
      return student || eleve; // Fallback sur eleve si pas trouvé dans ctx
    }).filter(Boolean); // Supprimer les undefined
  }, [eleves, ctx.eleves]);

  // Extraire toutes les compositions de tous les élèves (nouvelle structure)
  const allCompositions = useMemo(() => {
    const compositions = new Map();

    elevesComplets.forEach(eleve => {
      if (!eleve.compositions) return;

      Object.entries(eleve.compositions).forEach(([annee, trimestres]) => {
        if (!Array.isArray(trimestres)) return;

        trimestres.forEach((trimestre, trimestreIndex) => {
          // Nouvelle structure : {officiel: {timestamp: {matiere: {note, sur}}}, unOfficiel: {...}}
          if (trimestre && typeof trimestre === 'object' && (trimestre.officiel || trimestre.unOfficiel)) {
            ['officiel', 'unOfficiel'].forEach(category => {
              const categoryData = trimestre[category] || {};

              Object.entries(categoryData).forEach(([timestamp, subjects]) => {
                const date = new Date(parseInt(timestamp));
                const dateStr = date.toISOString().split('T')[0];
                const key = `${timestamp}-${trimestreIndex}-${category}`;

                if (!compositions.has(key)) {
                  compositions.set(key, {
                    timestamp: parseInt(timestamp),
                    date: dateStr,
                    trimestre: trimestreIndex + 1,
                    annee,
                    category,
                    isOfficiel: category === 'officiel',
                    matieres: new Set()
                  });
                }

                Object.keys(subjects || {}).forEach(matiere => {
                  compositions.get(key).matieres.add(matiere);
                });
              });
            });
          }
          // Support ancien format pour compatibilité
          else if (Array.isArray(trimestre)) {
            trimestre.forEach(noteObj => {
              if (noteObj.date) {
                const key = `${noteObj.date}-${trimestreIndex}-legacy`;
                if (!compositions.has(key)) {
                  compositions.set(key, {
                    date: noteObj.date,
                    trimestre: trimestreIndex + 1,
                    annee,
                    category: 'legacy',
                    isOfficiel: noteObj.officiel !== undefined ? noteObj.officiel : true,
                    matieres: new Set()
                  });
                }
                Object.keys(noteObj).forEach(matiere => {
                  if (matiere !== 'date' && matiere !== 'officiel') {
                    compositions.get(key).matieres.add(matiere);
                  }
                });
              }
            });
          }
        });
      });
    });

    return Array.from(compositions.values())
      .sort((a, b) => (b.timestamp || new Date(b.date).getTime()) - (a.timestamp || new Date(a.date).getTime()));
  }, [elevesComplets]);

  // Obtenir toutes les matières disponibles avec tri par nom résolu
  const allMatieres = useMemo(() => {
    const matieres = new Set();
    allCompositions.forEach(comp => {
      comp.matieres.forEach(matiere => matieres.add(matiere));
    });
    return Array.from(matieres).sort((a, b) => {
      const nomA = getSubName(a).toLowerCase();
      const nomB = getSubName(b).toLowerCase();
      return nomA.localeCompare(nomB);
    });
  }, [allCompositions, allSubjects]);

  // Obtenir les coefficients des matières pour la composition sélectionnée
  const matiereCoefficients = useMemo(() => {
    const coefficients = {};

    // Parcourir tous les élèves pour extraire les coefficients
    elevesComplets.forEach(eleve => {
      if (!eleve.compositions) return;

      Object.entries(eleve.compositions).forEach(([annee, trimestres]) => {
        if (!Array.isArray(trimestres)) return;

        trimestres.forEach((trimestre) => {
          if (trimestre && typeof trimestre === 'object' && (trimestre.officiel || trimestre.unOfficiel)) {
            ['officiel', 'unOfficiel'].forEach(category => {
              const categoryData = trimestre[category] || {};

              Object.entries(categoryData).forEach(([timestamp, subjects]) => {
                Object.entries(subjects || {}).forEach(([matiere, noteData]) => {
                  if (noteData && typeof noteData === 'object' && noteData.sur !== undefined) {
                    coefficients[matiere] = noteData.sur;
                  }
                });
              });
            });
          }
        });
      });
    });

    return coefficients;
  }, [elevesComplets]);

  // Obtenir les notes pour la composition sélectionnée
  const notesData = useMemo(() => {
    if (allCompositions.length === 0) return [];

    const selectedComp = selectedComposition === 'latest'
      ? allCompositions[0]
      : allCompositions.find(c => {
        if (c.category === 'legacy') {
          return `${c.date}-${c.trimestre}` === selectedComposition;
        } else {
          return `${c.timestamp}-${c.trimestre}-${c.category}` === selectedComposition;
        }
      });

    if (!selectedComp) return [];

    const notes = [];

    elevesComplets.forEach(eleve => {
      if (!eleve.compositions || !eleve.compositions[selectedComp.annee]) return;

      const trimestres = eleve.compositions[selectedComp.annee];
      if (!Array.isArray(trimestres)) return;

      const trimestre = trimestres[selectedComp.trimestre - 1];
      if (!trimestre) return;

      const eleveNotes = {
        eleve: {
          _id: eleve._id,
          nom: eleve.nom,
          prenoms: eleve.prenoms
        },
        notes: {},
        moyenne: 0,
        totalNotes: 0
      };

      let sum = 0;
      let count = 0;

      // Nouvelle structure
      if (trimestre && typeof trimestre === 'object' && (trimestre.officiel || trimestre.unOfficiel)) {
        const categoryData = trimestre[selectedComp.category] || {};
        const compositionNotes = categoryData[selectedComp.timestamp] || {};

        Object.entries(compositionNotes).forEach(([matiere, noteData]) => {
          const noteValue = noteData.note;
          const sur = noteData.sur || 20;
          // Garder la note avec son coefficient d'origine
          eleveNotes.notes[matiere] = { note: noteValue, sur: sur };
          // Pour le calcul de moyenne (sur 10) :
          // noteValue est sur 'sur' (ex: 9 sur 10), donc noteSur10 = (noteValue / sur) * 10
          const noteSur10 = (noteValue / sur) * 10;
          sum += noteSur10;
          count++;
        });
      }
      // Ancien format (legacy)
      else if (Array.isArray(trimestre)) {
        const noteObj = trimestre.find(n => n.date === selectedComp.date);
        if (noteObj) {
          Object.entries(noteObj).forEach(([matiere, note]) => {
            if (matiere !== 'date' && matiere !== 'officiel' && typeof note === 'number') {
              // Ancien format : note directe sur 20, garder tel quel
              eleveNotes.notes[matiere] = { note: note, sur: 20 };
              // Pour le calcul de moyenne, convertir vers /10
              const noteSur10 = (note / 20) * 10;
              sum += noteSur10;
              count++;
            }
          });
        }
      }

      if (count > 0) {
        eleveNotes.moyenne = sum / count;
        eleveNotes.totalNotes = count;
        notes.push(eleveNotes);
      }
    });

    return notes;
  }, [elevesComplets, selectedComposition, allCompositions]);

  // Filtrer et trier les notes
  const filteredAndSortedNotes = useMemo(() => {
    let filtered = [...notesData];

    // Filtrer par matière si nécessaire
    if (selectedMatiere !== 'all') {
      filtered = filtered.filter(note => note.notes[selectedMatiere] !== undefined);
    }

    // Trier
    filtered.sort((a, b) => {
      let valueA, valueB;

      switch (sortBy) {
        case 'nom':
          valueA = `${a.eleve.nom} ${a.eleve.prenoms}`.toLowerCase();
          valueB = `${b.eleve.nom} ${b.eleve.prenoms}`.toLowerCase();
          break;
        case 'moyenne':
          valueA = a.moyenne;
          valueB = b.moyenne;
          break;
        case 'note':
          if (selectedMatiere !== 'all') {
            const noteA = a.notes[selectedMatiere];
            const noteB = b.notes[selectedMatiere];
            valueA = noteA ? noteA.note / noteA.sur : 0;
            valueB = noteB ? noteB.note / noteB.sur : 0;
          } else {
            valueA = a.moyenne;
            valueB = b.moyenne;
          }
          break;
        default:
          valueA = a.moyenne;
          valueB = b.moyenne;
      }

      if (sortOrder === 'desc') {
        return valueB > valueA ? 1 : valueB < valueA ? -1 : 0;
      } else {
        return valueA > valueB ? 1 : valueA < valueB ? -1 : 0;
      }
    });

    return filtered;
  }, [notesData, selectedMatiere, sortBy, sortOrder]);

  if (allCompositions.length === 0) {
    return (
      <div className="notes-block__empty">
        <div className="notes-block__empty-icon">📊</div>
        <p className="notes-block__empty-text">Aucune composition trouvée pour cette classe</p>
      </div>
    );
  }

  return (
    <div className="notes-block">
      {/* Contrôles de filtrage */}
      <div className="notes-block__controls">
        <div className="notes-block__control-group">
          <label className="notes-block__label">Composition :</label>
          <select
            className="notes-block__select"
            value={selectedComposition}
            onChange={(e) => setSelectedComposition(e.target.value)}
          >
            <option value="latest">Dernière composition</option>
            {allCompositions.map(comp => {
              const key = comp.category === 'legacy'
                ? `${comp.date}-${comp.trimestre}`
                : `${comp.timestamp}-${comp.trimestre}-${comp.category}`;
              const dateStr = comp.timestamp
                ? new Date(comp.timestamp).toLocaleDateString('fr-FR')
                : new Date(comp.date).toLocaleDateString('fr-FR');
              const statusStr = comp.isOfficiel ? 'Officiel' : 'Non officiel';

              return (
                <option key={key} value={key}>
                  {dateStr} - T{comp.trimestre} ({comp.annee}) - {statusStr}
                </option>
              );
            })}
          </select>
        </div>

        <div className="notes-block__control-group">
          <label className="notes-block__label">Matière :</label>
          <select
            className="notes-block__select"
            value={selectedMatiere}
            onChange={(e) => setSelectedMatiere(e.target.value)}
          >
            <option value="all">Toutes les matières</option>
            {allMatieres.map(matiere => (
              <option key={matiere} value={matiere}>{getSubName(matiere)}</option>
            ))}
          </select>
        </div>

        <div className="notes-block__control-group">
          <label className="notes-block__label">Trier par :</label>
          <select
            className="notes-block__select"
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
          >
            <option value="note">Note{selectedMatiere !== 'all' ? ` (${getSubName(selectedMatiere)})` : ' (moyenne)'}</option>
            <option value="nom">Nom alphabétique</option>
            <option value="moyenne">Moyenne générale</option>
          </select>
        </div>

        <div className="notes-block__control-group">
          <label className="notes-block__label">Ordre :</label>
          <select
            className="notes-block__select"
            value={sortOrder}
            onChange={(e) => setSortOrder(e.target.value)}
          >
            <option value="desc">Décroissant</option>
            <option value="asc">Croissant</option>
          </select>
        </div>
      </div>

      {/* Tableau des notes */}
      {filteredAndSortedNotes.length === 0 ? (
        <div className="notes-block__empty">
          <p className="notes-block__empty-text">Aucune note trouvée pour les critères sélectionnés</p>
        </div>
      ) : (
        <div className="notes-block__table-container">
          <table className="notes-block__table">
            <thead>
              <tr>
                <th className="notes-block__th">Rang</th>
                <th className="notes-block__th">Élève</th>
                {selectedMatiere === 'all' ? (
                  <>
                    {allMatieres.map(matiere => {
                      const val = matiereCoefficients[matiere];
                      const maxDisplay = val ? (val >= 10 ? val : val * 10) : '';
                      return (
                        <th key={matiere} className="notes-block__th">
                          {getSubName(matiere)} {maxDisplay ? `(/${maxDisplay})` : ''}
                        </th>
                      );
                    })}
                    <th className="notes-block__th notes-block__th--moyenne">Moyenne (/10)</th>
                  </>
                ) : (
                  <th className="notes-block__th">
                    {getSubName(selectedMatiere)}
                    {matiereCoefficients[selectedMatiere] && (
                      <span className="notes-block__coefficient">
                        (/{matiereCoefficients[selectedMatiere] >= 10 ? matiereCoefficients[selectedMatiere] : matiereCoefficients[selectedMatiere] * 10})
                      </span>
                    )}
                  </th>
                )}
              </tr>
            </thead>
            <tbody>
              {filteredAndSortedNotes.map((noteData, index) => (
                <tr key={noteData.eleve._id} className="notes-block__tr">
                  <td className="notes-block__td notes-block__td--rang">{index + 1}</td>
                  <td className="notes-block__td notes-block__td--eleve">
                    <Link href={`/eleves/${noteData.eleve._id}`} className="notes-block__link">
                      {noteData.eleve.nom} {noteData.eleve.prenoms}
                    </Link>
                  </td>
                  {selectedMatiere === 'all' ? (
                    <>
                      {allMatieres.map(matiere => {
                        const noteObj = noteData.notes[matiere];
                        if (!noteObj) return <td key={matiere} className="notes-block__td notes-block__td--note">-</td>;
                        const val = noteObj.sur;
                        const maxNote = val >= 10 ? val : val * 10;
                        return (
                          <td key={matiere} className="notes-block__td notes-block__td--note">
                            {noteObj.note}/{maxNote}
                          </td>
                        );
                      })}
                      <td className="notes-block__td notes-block__td--moyenne">
                        {noteData.moyenne.toFixed(2)}/10
                      </td>
                    </>
                  ) : (
                    <td className="notes-block__td notes-block__td--note">
                      {noteData.notes[selectedMatiere] !== undefined ?
                        (() => {
                          const n = noteData.notes[selectedMatiere];
                          const m = n.sur >= 10 ? n.sur : n.sur * 10;
                          return `${n.note}/${m}`;
                        })() :
                        '-'
                      }
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
