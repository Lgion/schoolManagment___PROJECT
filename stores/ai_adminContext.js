"use client"

import { createContext, useState, useCallback, useEffect } from 'react';
import { getLSItem, setLSItem, clearLS } from '../utils/localStorageManager';

export const AiAdminContext = createContext({});

export const AdminContextProvider = ({ children }) => {
  // States
  const [eleves, setEleves] = useState([]);
  const [enseignants, setEnseignants] = useState([]);
  const [classes, setClasses] = useState([]);
  const [selected, setSelected] = useState(null);
  const [editType, setEditType] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [dynamicSubjects, setDynamicSubjects] = useState([]);
  const [subjectsLoaded, setSubjectsLoaded] = useState(false);

  // --- DYNAMIC FEES CONFIGURATION ---
  // Default legacy mapping for runtime normalization
  const LEGACY_FEE_MAP = { 'argent': 'scol_cash', 'riz': 'scol_nature' };

  const [feeDefinitions, setFeeDefinitions] = useState([
    {
      id: 'scol_cash',
      label: 'Frais Scolaires (Espèce)',
      unit: 'F',
      targets: { interne: 45000, externe: 18000 }
    },
    {
      id: 'scol_nature',
      label: 'Frais Scolaires (Nature)',
      unit: 'kg',
      targets: { interne: 50, externe: 25 }
    }
  ]);

  // Utility to normalize legacy entries to the new dynamic format
  const normalizeFeeItem = useCallback((item) => {
    if (!item) return null;
    // Check if it's a legacy item by looking for keys in LEGACY_FEE_MAP
    const legacyKey = Object.keys(LEGACY_FEE_MAP).find(key => item[key] !== undefined);
    if (legacyKey) {
      return {
        feeId: LEGACY_FEE_MAP[legacyKey],
        amount: Number(item[legacyKey]),
        timestamp: item.timestamp || Date.now()
      };
    }
    return item; // Already new format
  }, []);



  // --- ELEVE CRUD ---
  const fetchEleves = useCallback(async () => {
    let data = getLSItem('eleves');
    if (data && Array.isArray(data) && data.length > 0) {
      setEleves(data);
    } else {
      const res = await fetch('/api/school_ai/eleves');
      data = await res.json();
      if (Array.isArray(data)) {
        setEleves(data);
        setLSItem('eleves', data);
      } else {
        console.error('Erreur lors du fetch des élèves:', data);
        setEleves([]);
      }
    }
  }, []);

  const saveEleve = useCallback(async (data) => {
    const method = data._id ? 'PUT' : 'POST';

    // Mise à jour optimiste
    setEleves(prev => {
      let newList;
      if (data._id) {
        newList = prev.map(e => e._id === data._id ? { ...e, ...data } : e);
      } else {
        const tempId = 'temp_' + Date.now();
        newList = [...prev, { ...data, _id: tempId }];
      }
      setLSItem('eleves', newList);
      return newList;
    });

    try {
      const res = await fetch('/api/school_ai/eleves', {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });

      if (!res.ok) throw new Error('Request failed');
      const saved = await res.json();

      // Mise à jour finale avec les données du serveur (incluant les IDs réels, timestamps, etc.)
      setEleves(prev => {
        const newList = prev.map(e => (e._id === saved._id || (e._id && e._id.startsWith('temp_'))) ? saved : e);
        // S'assurer de supprimer tout doublon temporaire si c'était une création
        const uniqueList = Array.from(new Map(newList.map(item => [item._id, item])).values());
        setLSItem('eleves', uniqueList);
        return uniqueList;
      });

      // Mettre à jour 'selected' si c'est l'élément actuellement sélectionné
      setSelected(prev => (prev && prev._id === saved._id) ? saved : prev);

      return saved;
    } catch (err) {
      console.error("Erreur saveEleve, annulation mise à jour optimiste", err);
      // Forcer un rechargement propre en cas d'erreur
      const res = await fetch('/api/school_ai/eleves', { cache: 'no-store' });
      const freshData = await res.json();
      setEleves(freshData);
      setLSItem('eleves', freshData);
      throw err;
    }
  }, []);

  const deleteEleve = useCallback(async (_id) => {
    // Optimistic Update
    setEleves(prev => {
      const newList = prev.filter(e => e._id !== _id);
      setLSItem('eleves', newList);
      return newList;
    });

    try {
      const res = await fetch('/api/school_ai/eleves', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ _id }),
      });

      if (!res.ok) throw new Error('Request failed');

      const updated = await fetch('/api/school_ai/eleves');
      const newList = await updated.json();
      setEleves(newList);
      setLSItem('eleves', newList);
    } catch (err) {
      console.error("Optimistic UI revert for deleteEleve", err);
      fetchEleves();
      throw err;
    }
  }, [fetchEleves]);

  // --- ENSEIGNANT CRUD ---
  const fetchEnseignants = useCallback(async () => {
    let data = getLSItem('enseignants');
    if (data && Array.isArray(data) && data.length > 0) {
      setEnseignants(data);
    } else {
      const res = await fetch('/api/school_ai/enseignants');
      data = await res.json();
      if (Array.isArray(data)) {
        setEnseignants(data);
        setLSItem('enseignants', data);
      } else {
        console.error('Erreur lors du fetch des enseignants:', data);
        setEnseignants([]);
      }
    }
  }, []);

  const saveEnseignant = useCallback(async (data) => {
    const method = data._id ? 'PUT' : 'POST';

    setEnseignants(prev => {
      let newList;
      if (data._id) {
        newList = prev.map(e => e._id === data._id ? { ...e, ...data } : e);
      } else {
        const tempId = 'temp_' + Date.now();
        newList = [...prev, { ...data, _id: tempId }];
      }
      setLSItem('enseignants', newList);
      return newList;
    });

    try {
      const res = await fetch('/api/school_ai/enseignants', {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });

      if (!res.ok) throw new Error('Request failed');
      const saved = await res.json();

      setEnseignants(prev => {
        const newList = prev.map(e => (e._id === saved._id || (e._id && e._id.startsWith('temp_'))) ? saved : e);
        const uniqueList = Array.from(new Map(newList.map(item => [item._id, item])).values());
        setLSItem('enseignants', uniqueList);
        return uniqueList;
      });

      setSelected(prev => (prev && prev._id === saved._id) ? saved : prev);

      return saved;
    } catch (err) {
      console.error("Erreur saveEnseignant, annulation mise à jour optimiste", err);
      const res = await fetch('/api/school_ai/enseignants', { cache: 'no-store' });
      const freshData = await res.json();
      setEnseignants(freshData);
      setLSItem('enseignants', freshData);
      throw err;
    }
  }, []);

  const deleteEnseignant = useCallback(async (_id) => {
    // Optimistic Update
    setEnseignants(prev => {
      const newList = prev.filter(e => e._id !== _id);
      setLSItem('enseignants', newList);
      return newList;
    });

    try {
      const res = await fetch('/api/school_ai/enseignants', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ _id }),
      });

      if (!res.ok) throw new Error('Request failed');

      const updated = await fetch('/api/school_ai/enseignants');
      const newList = await updated.json();
      setEnseignants(newList);
      setLSItem('enseignants', newList);
    } catch (err) {
      console.error("Optimistic UI revert for deleteEnseignant", err);
      fetchEnseignants();
      throw err;
    }
  }, [fetchEnseignants]);

  // --- CLASSE CRUD ---
  const fetchClasses = useCallback(async () => {
    let data = getLSItem('classes');
    if (data && Array.isArray(data) && data.length > 0) {
      setClasses(data);
    } else {
      const res = await fetch('/api/school_ai/classes');
      data = await res.json();
      if (Array.isArray(data)) {
        setClasses(data);
        setLSItem('classes', data);
      } else {
        console.error('Erreur lors du fetch des classes:', data);
        setClasses([]);
      }
    }
  }, []);

  const saveClasse = useCallback(async (data) => {
    const method = data._id ? 'PUT' : 'POST';

    setClasses(prev => {
      let newList;
      if (data._id) {
        newList = prev.map(c => c._id === data._id ? { ...c, ...data } : c);
      } else {
        const tempId = 'temp_' + Date.now();
        newList = [...prev, { ...data, _id: tempId }];
      }
      setLSItem('classes', newList);
      return newList;
    });

    try {
      const res = await fetch('/api/school_ai/classes', {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });

      if (!res.ok) throw new Error('Request failed');
      const saved = await res.json();

      setClasses(prev => {
        const newList = prev.map(c => (c._id === saved._id || (c._id && c._id.startsWith('temp_'))) ? saved : c);
        const uniqueList = Array.from(new Map(newList.map(item => [item._id, item])).values());
        setLSItem('classes', uniqueList);
        return uniqueList;
      });

      setSelected(prev => (prev && prev._id === saved._id) ? saved : prev);

      return saved;
    } catch (err) {
      console.error("Erreur saveClasse, annulation mise à jour optimiste", err);
      const res = await fetch('/api/school_ai/classes', { cache: 'no-store' });
      const freshData = await res.json();
      setClasses(freshData);
      setLSItem('classes', freshData);
      throw err;
    }
  }, []);

  const deleteClasse = useCallback(async (_id) => {
    // Optimistic Update
    setClasses(prev => {
      const newList = prev.filter(c => c._id !== _id);
      setLSItem('classes', newList);
      return newList;
    });

    try {
      const res = await fetch('/api/school_ai/classes', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ _id })
      });

      if (!res.ok) throw new Error('Request failed');

      const updated = await fetch('/api/school_ai/classes');
      const newList = await updated.json();
      setClasses(newList);
      setLSItem('classes', newList);
    } catch (err) {
      console.error("Optimistic UI revert for deleteClasse", err);
      fetchClasses();
      throw err;
    }
  }, [fetchClasses]);

  // --- NOTES & ABSENCES (Story 1.4) ---
  // Mise à jour sécurisée des notes d'un élève (compositions)
  const saveEleveNotes = useCallback(async (eleveId, compositions) => {
    try {
      const res = await fetch(`/api/school_ai/eleves/${eleveId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ compositions }),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || 'Request failed');
      }
      const updated = await res.json();
      // Synchroniser l'état et le LocalStorage SEULEMENT après validation (Confirmation back-end)
      setEleves(prev => {
        const newList = prev.map(e => e._id === eleveId ? updated : e);
        setLSItem('eleves', newList);
        return newList;
      });
      return updated;
    } catch (err) {
      console.error('Erreur lors de la sauvegarde des notes:', err);
      // Plus besoin de fetchEleves() en cas de revert car aucune donnée corrompue n'est injectée
      throw err;
    }
  }, []);

  // Mise à jour sécurisée des absences d'un élève
  const saveEleveAbsences = useCallback(async (eleveId, absences) => {
    try {
      const res = await fetch(`/api/school_ai/eleves/${eleveId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ absences }),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || 'Request failed');
      }
      const updated = await res.json();
      // Synchroniser l'état et le LocalStorage SEULEMENT après validation
      setEleves(prev => {
        const newList = prev.map(e => e._id === eleveId ? updated : e);
        setLSItem('eleves', newList);
        return newList;
      });
      return updated;
    } catch (err) {
      console.error('Erreur lors de la sauvegarde des absences:', err);
      throw err;
    }
  }, []);

  // --- SUBJECTS ---
  const fetchSubjects = useCallback(async () => {
    try {
      const parsedSubjects = getLSItem('app_subjects');
      if (parsedSubjects && Array.isArray(parsedSubjects) && parsedSubjects.length > 0) {
        setDynamicSubjects(parsedSubjects);
        setSubjectsLoaded(true);
        return;
      }

      const response = await fetch('/api/subjects');
      const data = await response.json();
      if (data.success && data.data) {
        const sortedData = data.data
          .filter(subject => subject.isActive)
          .sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));

        const subjects = sortedData.map(subject => ({
          id: subject._id || subject.id,
          nom: subject.nom
        }));

        setLSItem('app_subjects', subjects);
        setDynamicSubjects(subjects);
        setSubjectsLoaded(true);
      }
    } catch (error) {
      console.error('Erreur chargement matières context:', error);
      setSubjectsLoaded(true);
    }
  }, []);

  // --- UPLOAD ---
  const uploadFile = useCallback(async (payload) => {
    const { file, type, documents, ...payload_ } = payload;
    let json = JSON.stringify(payload_);
    const formData = new FormData();
    if (file) formData.append('file', file);
    if (documents && Array.isArray(documents)) {
      documents.forEach(doc => {
        formData.append('file', doc.file);
      });
      // Ajoute la meta des noms personnalisés dans l'ordre
      formData.append('documentsMeta', JSON.stringify(documents.map(doc => doc.customName)));
    }
    formData.append('type', type);
    formData.append('payload', json);
    payload.entityType && formData.append('entityType', payload.entityType);
    const res = await fetch('/api/school_ai/media', {
      method: 'POST',
      body: formData
    });
    return await res.json(); // { paths }
  }, []);

  useEffect(() => {
    // Initialisation
  }, [])
  // --- AUTO FETCH CLASSES AU MONTAGE ---
  useEffect(() => {
    if (classes.length === 0) fetchClasses();
    if (dynamicSubjects.length === 0) fetchSubjects();
  }, [classes.length, fetchClasses, dynamicSubjects.length, fetchSubjects]);







  return (
    <AiAdminContext.Provider
      value={{
        eleves, fetchEleves, saveEleve, deleteEleve,
        saveEleveNotes, saveEleveAbsences,
        enseignants, fetchEnseignants, saveEnseignant, deleteEnseignant,
        classes, fetchClasses, saveClasse, deleteClasse,
        dynamicSubjects, fetchSubjects, subjectsLoaded,
        feeDefinitions, setFeeDefinitions, normalizeFeeItem,
        uploadFile,
        selected, setSelected, showModal, setShowModal, editType, setEditType
      }}
    >
      {children}
    </AiAdminContext.Provider>
  );
};
