"use client"

import { useState, useMemo, useContext } from 'react';
import { AiAdminContext } from '../../stores/ai_adminContext';

export default function NotesBlock({ eleves, classeId, isCurrentYear }) {
  const ctx = useContext(AiAdminContext);
  const [selectedComposition, setSelectedComposition] = useState('latest');
  const [sortBy, setSortBy] = useState('note'); // 'note', 'nom', 'moyenne'
  const [sortOrder, setSortOrder] = useState('desc'); // 'asc', 'desc'
  const [selectedMatiere, setSelectedMatiere] = useState('all');

  // Résoudre les élèves complets (gérer les cas où eleves contient des IDs)
  const elevesComplets = useMemo(() => {
    if (!ctx.eleves) return [];
    
    return eleves.map(eleve => {
      // Si eleve est juste un ID ou un objet partiel, le résoudre via ctx.eleves
      const student = ctx.eleves.find(el => el._id === (eleve._id || eleve));
      return student || eleve; // Fallback sur eleve si pas trouvé dans ctx
    }).filter(Boolean); // Supprimer les undefined
  }, [eleves, ctx.eleves]);

  // Extraire toutes les compositions de tous les élèves
  const allCompositions = useMemo(() => {
    const compositions = new Map();
    
    elevesComplets.forEach(eleve => {
      if (!eleve.compositions) return;
      
      Object.entries(eleve.compositions).forEach(([annee, trimestres]) => {
        if (!Array.isArray(trimestres)) return;
        
        trimestres.forEach((trimestre, trimestreIndex) => {
          if (!Array.isArray(trimestre)) return;
          
          trimestre.forEach(noteObj => {
            if (noteObj.date) {
              const key = `${noteObj.date}-${trimestreIndex}`;
              if (!compositions.has(key)) {
                compositions.set(key, {
                  date: noteObj.date,
                  trimestre: trimestreIndex + 1,
                  annee,
                  matieres: new Set()
                });
              }
              Object.keys(noteObj).forEach(matiere => {
                if (matiere !== 'date') {
                  compositions.get(key).matieres.add(matiere);
                }
              });
            }
          });
        });
      });
    });

    return Array.from(compositions.values())
      .sort((a, b) => new Date(b.date) - new Date(a.date));
  }, [elevesComplets]);

  // Obtenir toutes les matières disponibles
  const allMatieres = useMemo(() => {
    const matieres = new Set();
    allCompositions.forEach(comp => {
      comp.matieres.forEach(matiere => matieres.add(matiere));
    });
    return Array.from(matieres).sort();
  }, [allCompositions]);

  // Obtenir les notes pour la composition sélectionnée
  const notesData = useMemo(() => {
    if (allCompositions.length === 0) return [];

    const selectedComp = selectedComposition === 'latest' 
      ? allCompositions[0] 
      : allCompositions.find(c => `${c.date}-${c.trimestre}` === selectedComposition);

    if (!selectedComp) return [];

    const notes = [];
    
    elevesComplets.forEach(eleve => {
      if (!eleve.compositions || !eleve.compositions[selectedComp.annee]) return;
      
      const trimestres = eleve.compositions[selectedComp.annee];
      if (!Array.isArray(trimestres)) return;
      
      const trimestre = trimestres[selectedComp.trimestre - 1];
      if (!Array.isArray(trimestre)) return;

      const noteObj = trimestre.find(n => n.date === selectedComp.date);
      if (!noteObj) return;

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

      Object.entries(noteObj).forEach(([matiere, note]) => {
        if (matiere !== 'date' && typeof note === 'number') {
          eleveNotes.notes[matiere] = note;
          sum += note;
          count++;
        }
      });

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
            valueA = a.notes[selectedMatiere] || 0;
            valueB = b.notes[selectedMatiere] || 0;
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
            {allCompositions.map(comp => (
              <option key={`${comp.date}-${comp.trimestre}`} value={`${comp.date}-${comp.trimestre}`}>
                {new Date(comp.date).toLocaleDateString('fr-FR')} - T{comp.trimestre} ({comp.annee})
              </option>
            ))}
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
              <option key={matiere} value={matiere}>{matiere}</option>
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
            <option value="note">Note{selectedMatiere !== 'all' ? ` (${selectedMatiere})` : ' (moyenne)'}</option>
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
                    {allMatieres.map(matiere => (
                      <th key={matiere} className="notes-block__th">{matiere}</th>
                    ))}
                    <th className="notes-block__th notes-block__th--moyenne">Moyenne</th>
                  </>
                ) : (
                  <th className="notes-block__th">{selectedMatiere}</th>
                )}
              </tr>
            </thead>
            <tbody>
              {filteredAndSortedNotes.map((noteData, index) => (
                <tr key={noteData.eleve._id} className="notes-block__tr">
                  <td className="notes-block__td notes-block__td--rang">{index + 1}</td>
                  <td className="notes-block__td notes-block__td--eleve">
                    {noteData.eleve.nom} {noteData.eleve.prenoms}
                  </td>
                  {selectedMatiere === 'all' ? (
                    <>
                      {allMatieres.map(matiere => (
                        <td key={matiere} className="notes-block__td notes-block__td--note">
                          {noteData.notes[matiere] !== undefined ? 
                            `${noteData.notes[matiere]}/20` : 
                            '-'
                          }
                        </td>
                      ))}
                      <td className="notes-block__td notes-block__td--moyenne">
                        {noteData.moyenne.toFixed(2)}/20
                      </td>
                    </>
                  ) : (
                    <td className="notes-block__td notes-block__td--note">
                      {noteData.notes[selectedMatiere] !== undefined ? 
                        `${noteData.notes[selectedMatiere]}/20` : 
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
