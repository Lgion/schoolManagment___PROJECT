"use client"

import { createContext, useState, useCallback, useEffect } from 'react';

export const AiAdminContext = createContext({});

export const AdminContextProvider = ({ children }) => {
  // States
  const [eleves, setEleves] = useState([]);
  const [enseignants, setEnseignants] = useState([]);
  const [classes, setClasses] = useState([]);
  const [selected, setSelected] = useState(null);
  const [editType, setEditType] = useState(null);
  const [showModal, setShowModal] = useState(false);

  // --- UTILS LOCALSTORAGE ---
  const loadFromStorage = (key) => {
    if (typeof window === 'undefined') return null;
    try {
      const val = localStorage.getItem(key);
      return val ? JSON.parse(val) : null;
    } catch {
      return null;
    }
  };
  const saveToStorage = (key, val) => {
    if (typeof window !== 'undefined') {
      localStorage.setItem(key, JSON.stringify(val));
    }
  };

  // --- ELEVE CRUD ---
  const fetchEleves = useCallback(async () => {
    let data = loadFromStorage('eleves');
    if (data && Array.isArray(data) && data.length > 0) {
      setEleves(data);
    } else {
      const res = await fetch('/api/school_ai/eleves');
      data = await res.json();
      setEleves(data);
      saveToStorage('eleves', data);
    }
  }, []);

  const saveEleve = useCallback(async (data) => {
    const method = data._id ? 'PUT' : 'POST';

    // Optimistic Update
    setEleves(prev => {
      let newList;
      if (data._id) {
        newList = prev.map(e => e._id === data._id ? { ...e, ...data } : e);
      } else {
        const tempId = 'temp_' + Date.now();
        newList = [...prev, { ...data, _id: tempId }];
      }
      saveToStorage('eleves', newList);
      return newList;
    });

    try {
      const res = await fetch('/api/school_ai/eleves', {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });

      if (!res.ok) throw new Error('Request failed');

      const updated = await fetch('/api/school_ai/eleves');
      const newList = await updated.json();
      setEleves(newList);
      saveToStorage('eleves', newList);
      return await res.json();
    } catch (err) {
      console.error("Optimistic UI revert for saveEleve", err);
      fetchEleves();
      throw err;
    }
  }, [fetchEleves]);

  const deleteEleve = useCallback(async (_id) => {
    // Optimistic Update
    setEleves(prev => {
      const newList = prev.filter(e => e._id !== _id);
      saveToStorage('eleves', newList);
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
      saveToStorage('eleves', newList);
    } catch (err) {
      console.error("Optimistic UI revert for deleteEleve", err);
      fetchEleves();
      throw err;
    }
  }, [fetchEleves]);

  // --- ENSEIGNANT CRUD ---
  const fetchEnseignants = useCallback(async () => {
    let data = loadFromStorage('enseignants');
    if (data && Array.isArray(data) && data.length > 0) {
      setEnseignants(data);
    } else {
      const res = await fetch('/api/school_ai/enseignants');
      data = await res.json();
      setEnseignants(data);
      saveToStorage('enseignants', data);
    }
  }, []);

  const saveEnseignant = useCallback(async (data) => {
    const method = data._id ? 'PUT' : 'POST';

    // Optimistic Update
    setEnseignants(prev => {
      let newList;
      if (data._id) {
        newList = prev.map(e => e._id === data._id ? { ...e, ...data } : e);
      } else {
        const tempId = 'temp_' + Date.now();
        newList = [...prev, { ...data, _id: tempId }];
      }
      saveToStorage('enseignants', newList);
      return newList;
    });

    try {
      const res = await fetch('/api/school_ai/enseignants', {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });

      if (!res.ok) throw new Error('Request failed');

      const updated = await fetch('/api/school_ai/enseignants');
      const newList = await updated.json();
      setEnseignants(newList);
      saveToStorage('enseignants', newList);
      return await res.json();
    } catch (err) {
      console.error("Optimistic UI revert for saveEnseignant", err);
      fetchEnseignants();
      throw err;
    }
  }, [fetchEnseignants]);

  const deleteEnseignant = useCallback(async (_id) => {
    // Optimistic Update
    setEnseignants(prev => {
      const newList = prev.filter(e => e._id !== _id);
      saveToStorage('enseignants', newList);
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
      saveToStorage('enseignants', newList);
    } catch (err) {
      console.error("Optimistic UI revert for deleteEnseignant", err);
      fetchEnseignants();
      throw err;
    }
  }, [fetchEnseignants]);

  // --- CLASSE CRUD ---
  const fetchClasses = useCallback(async () => {
    let data = loadFromStorage('classes');
    if (data && Array.isArray(data) && data.length > 0) {
      setClasses(data);
    } else {
      const res = await fetch('/api/school_ai/classes');
      data = await res.json();
      setClasses(data);
      saveToStorage('classes', data);
    }
  }, []);

  const saveClasse = useCallback(async (data) => {
    const method = data._id ? 'PUT' : 'POST';

    // Optimistic Update
    setClasses(prev => {
      let newList;
      if (data._id) {
        newList = prev.map(c => c._id === data._id ? { ...c, ...data } : c);
      } else {
        const tempId = 'temp_' + Date.now();
        newList = [...prev, { ...data, _id: tempId }];
      }
      saveToStorage('classes', newList);
      return newList;
    });

    try {
      const res = await fetch('/api/school_ai/classes', {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });

      if (!res.ok) throw new Error('Request failed');

      const updated = await fetch('/api/school_ai/classes');
      const newList = await updated.json();
      setClasses(newList);
      saveToStorage('classes', newList);
      return await res.json();
    } catch (err) {
      console.error("Optimistic UI revert for saveClasse", err);
      fetchClasses();
      throw err;
    }
  }, [fetchClasses]);

  const deleteClasse = useCallback(async (_id) => {
    // Optimistic Update
    setClasses(prev => {
      const newList = prev.filter(c => c._id !== _id);
      saveToStorage('classes', newList);
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
      saveToStorage('classes', newList);
    } catch (err) {
      console.error("Optimistic UI revert for deleteClasse", err);
      fetchClasses();
      throw err;
    }
  }, [fetchClasses]);

  // --- NOTES & ABSENCES (Story 1.4) ---
  // Mise à jour optimiste des notes d'un élève (compositions)
  const saveEleveNotes = useCallback(async (eleveId, compositions) => {
    // Optimistic Update : mettre à jour le store avant la réponse réseau
    setEleves(prev => {
      const newList = prev.map(e =>
        e._id === eleveId ? { ...e, compositions } : e
      );
      saveToStorage('eleves', newList);
      return newList;
    });

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
      // Synchroniser avec la valeur réelle du serveur
      setEleves(prev => {
        const newList = prev.map(e => e._id === eleveId ? updated : e);
        saveToStorage('eleves', newList);
        return newList;
      });
      return updated;
    } catch (err) {
      console.error('Optimistic UI revert for saveEleveNotes', err);
      fetchEleves();
      throw err;
    }
  }, [fetchEleves]);

  // Mise à jour optimiste des absences d'un élève
  const saveEleveAbsences = useCallback(async (eleveId, absences) => {
    // Optimistic Update
    setEleves(prev => {
      const newList = prev.map(e =>
        e._id === eleveId ? { ...e, absences } : e
      );
      saveToStorage('eleves', newList);
      return newList;
    });

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
      setEleves(prev => {
        const newList = prev.map(e => e._id === eleveId ? updated : e);
        saveToStorage('eleves', newList);
        return newList;
      });
      return updated;
    } catch (err) {
      console.error('Optimistic UI revert for saveEleveAbsences', err);
      fetchEleves();
      throw err;
    }
  }, [fetchEleves]);

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

    if (process.env.NEXT_PUBLIC_MODE === 'test') {
      localStorage.clear()
    }
  }, [])
  // --- AUTO FETCH CLASSES AU MONTAGE ---
  useEffect(() => {
    if (classes.length === 0) fetchClasses();
  }, [classes.length, fetchClasses]);







  return (
    <AiAdminContext.Provider
      value={{
        eleves, fetchEleves, saveEleve, deleteEleve,
        saveEleveNotes, saveEleveAbsences,
        enseignants, fetchEnseignants, saveEnseignant, deleteEnseignant,
        classes, fetchClasses, saveClasse, deleteClasse,
        uploadFile,
        selected, setSelected, showModal, setShowModal, editType, setEditType
      }}
    >
      {children}
    </AiAdminContext.Provider>
  );
};
