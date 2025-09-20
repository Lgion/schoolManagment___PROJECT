"use client";
import { useState, useEffect } from 'react';
import { getEleveImagePath } from '../../utils/imageUtils';

export default function AddStudentsModal({ 
  isOpen, 
  onClose, 
  classeId, 
  classeName,
  classeAnnee,
  currentStudents = [],
  onSuccess 
}) {
  const [availableStudents, setAvailableStudents] = useState([]);
  const [filteredStudents, setFilteredStudents] = useState([]);
  const [selectedStudents, setSelectedStudents] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState('all'); // 'all' ou 'no-class'
  const [loading, setLoading] = useState(false);
  const [loadingStudents, setLoadingStudents] = useState(true);
  const [classes, setClasses] = useState([]);

  // Charger tous les élèves au montage
  useEffect(() => {
    if (isOpen) {
      fetchAvailableStudents();
    }
  }, [isOpen]);

  // Filtrer les élèves selon la recherche et le type
  useEffect(() => {
    let filtered = [...availableStudents];
    
    console.log('🔍 Debug filtrage:', {
      availableStudents: availableStudents.length,
      currentStudents,
      filterType
    });
    
    // Exclure les élèves déjà dans cette classe
    const beforeExclusion = filtered.length;
    filtered = filtered.filter(eleve => {
      const eleveId = String(eleve._id);
      const isInCurrentClass = currentStudents.some(id => String(id) === eleveId);
      return !isInCurrentClass;
    });
    console.log(`📊 Après exclusion classe actuelle: ${beforeExclusion} → ${filtered.length}`);
    
    // Appliquer le filtre par type
    if (filterType === 'no-class') {
      const beforeTypeFilter = filtered.length;
      filtered = filtered.filter(eleve => !eleve.current_classe);
      console.log(`📊 Après filtre "sans classe": ${beforeTypeFilter} → ${filtered.length}`);
    }
    
    // Appliquer la recherche
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      const beforeSearch = filtered.length;
      filtered = filtered.filter(eleve => 
        eleve.nom?.toLowerCase().includes(query) ||
        eleve.prenoms?.some(p => p.toLowerCase().includes(query))
      );
      console.log(`📊 Après recherche "${searchQuery}": ${beforeSearch} → ${filtered.length}`);
    }
    
    console.log('✅ Élèves filtrés finaux:', filtered.length);
    setFilteredStudents(filtered);
  }, [searchQuery, filterType, availableStudents, currentStudents]);

  const fetchAvailableStudents = async () => {
    setLoadingStudents(true);
    try {
      // Charger les élèves et les classes en parallèle
      const [elevesRes, classesRes] = await Promise.all([
        fetch('/api/school_ai/eleves'),
        fetch('/api/school_ai/classes')
      ]);
      
      if (elevesRes.ok && classesRes.ok) {
        const elevesData = await elevesRes.json();
        const classesData = await classesRes.json();
        
        console.log('🔍 Debug AddStudentsModal:', {
          totalEleves: elevesData.length,
          totalClasses: classesData.length,
          currentStudents,
          classeId,
          elevesAvecClasse: elevesData.filter(e => e.current_classe).length,
          elevesSansClasse: elevesData.filter(e => !e.current_classe).length
        });
        
        setAvailableStudents(elevesData);
        setClasses(classesData);
      }
    } catch (error) {
      console.error('Erreur lors du chargement des données:', error);
      alert('Erreur lors du chargement des données');
    } finally {
      setLoadingStudents(false);
    }
  };

  const handleToggleStudent = (studentId) => {
    setSelectedStudents(prev => 
      prev.includes(studentId)
        ? prev.filter(id => id !== studentId)
        : [...prev, studentId]
    );
  };

  const handleSelectAll = () => {
    if (selectedStudents.length === filteredStudents.length) {
      setSelectedStudents([]);
    } else {
      setSelectedStudents(filteredStudents.map(s => s._id));
    }
  };

  // Fonction pour récupérer le nom de la classe
  const getClasseName = (classeId) => {
    if (!classeId) return null;
    const classe = classes.find(c => String(c._id) === String(classeId));
    return classe ? `${classe.niveau} ${classe.alias}` : classeId;
  };

  const handleConfirm = async () => {
    if (selectedStudents.length === 0) {
      alert('Veuillez sélectionner au moins un élève');
      return;
    }

    // Confirmation pour les élèves ayant déjà une classe
    const studentsWithClass = selectedStudents
      .map(id => availableStudents.find(s => s._id === id))
      .filter(s => s?.current_classe);
    
    if (studentsWithClass.length > 0) {
      const confirmMessage = `${studentsWithClass.length} élève(s) sélectionné(s) ont déjà une classe.\n` +
        `Voulez-vous les transférer vers ${classeName} ?`;
      if (!confirm(confirmMessage)) {
        return;
      }
    }

    setLoading(true);
    try {
      const res = await fetch(`/api/classes/${classeId}/add-students`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ studentIds: selectedStudents })
      });

      const data = await res.json();
      
      if (res.ok) {
        alert(data.message || `${selectedStudents.length} élève(s) ajouté(s) avec succès`);
        setSelectedStudents([]);
        onSuccess && onSuccess(data);
        onClose();
      } else {
        throw new Error(data.error || 'Erreur lors de l\'ajout');
      }
    } catch (error) {
      console.error('Erreur:', error);
      alert(error.message || 'Erreur lors de l\'ajout des élèves');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="addStudentsModal" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="addStudentsModal__container">
        <div className="addStudentsModal__header">
          <h3 className="addStudentsModal__title">
            Ajouter des élèves à {classeName} ({classeAnnee})
          </h3>
          <button 
            className="addStudentsModal__closeBtn"
            onClick={onClose}
            disabled={loading}
          >
            ✕
          </button>
        </div>

        <div className="addStudentsModal__filters">
          <input 
            type="text"
            className="addStudentsModal__search"
            placeholder="Rechercher un élève..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            disabled={loading}
          />
          <select 
            className="addStudentsModal__filter"
            value={filterType}
            onChange={(e) => setFilterType(e.target.value)}
            disabled={loading}
          >
            <option value="all">Tous les élèves</option>
            <option value="no-class">Sans classe uniquement</option>
          </select>
          {filteredStudents.length > 0 && (
            <button 
              className="addStudentsModal__selectAll"
              onClick={handleSelectAll}
              disabled={loading}
            >
              {selectedStudents.length === filteredStudents.length 
                ? 'Tout désélectionner' 
                : 'Tout sélectionner'}
            </button>
          )}
        </div>

        <div className="addStudentsModal__counter">
          <button
            className="addStudentsModal__counter-clearBtn"
            onClick={() => setSelectedStudents([])}
            disabled={loading || selectedStudents.length === 0}
            title="Tout décocher"
          >
            Tout décocher
          </button>
          <div className="addStudentsModal__counter-text">
            <span className="addStudentsModal__counter-selected">{selectedStudents.length}</span>
            <span className="addStudentsModal__counter-separator">/</span>
            <span className="addStudentsModal__counter-total">{filteredStudents.length}</span>
            <span className="addStudentsModal__counter-label">
              élève{filteredStudents.length > 1 ? 's' : ''} affiché{filteredStudents.length > 1 ? 's' : ''}
            </span>
          </div>
        </div>

        <div className="addStudentsModal__list">
          {loadingStudents ? (
            <div className="addStudentsModal__loading">Chargement des élèves...</div>
          ) : filteredStudents.length === 0 ? (
            <div className="addStudentsModal__empty">
              {searchQuery || filterType === 'no-class' 
                ? 'Aucun élève trouvé avec ces critères'
                : 'Tous les élèves sont déjà dans cette classe'}
            </div>
          ) : (
            filteredStudents.map(eleve => (
              <label 
                key={eleve._id}
                className={`addStudentsModal__student ${
                  selectedStudents.includes(eleve._id) ? 'addStudentsModal__student--selected' : ''
                }`}
              >
                <input 
                  type="checkbox"
                  checked={selectedStudents.includes(eleve._id)}
                  onChange={() => handleToggleStudent(eleve._id)}
                  disabled={loading}
                />
                <img 
                  src={getEleveImagePath(eleve)}
                  alt={eleve.nom}
                  className="addStudentsModal__studentPhoto"
                />
                <div className="addStudentsModal__studentInfo">
                  <span className="addStudentsModal__studentName">
                    {eleve.nom} {eleve.prenoms?.join(' ')}
                  </span>
                  {eleve.current_classe && (
                    <span className="addStudentsModal__studentClass">
                      Classe actuelle: {getClasseName(eleve.current_classe)}
                    </span>
                  )}
                </div>
                <span className={`addStudentsModal__badge ${
                  eleve.current_classe ? 'addStudentsModal__badge--warning' : 'addStudentsModal__badge--success'
                }`}>
                  {eleve.current_classe ? 'A transférer' : 'Sans classe'}
                </span>
              </label>
            ))
          )}
        </div>

        <div className="addStudentsModal__actions">
          <span className="addStudentsModal__count">
            {selectedStudents.length} élève(s) sélectionné(s)
          </span>
          <div className="addStudentsModal__buttons">
            <button 
              className="addStudentsModal__cancelBtn"
              onClick={onClose}
              disabled={loading}
            >
              Annuler
            </button>
            <button 
              className="addStudentsModal__confirmBtn"
              onClick={handleConfirm}
              disabled={loading || selectedStudents.length === 0}
            >
              {loading ? 'Ajout en cours...' : 'Ajouter à la classe'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
