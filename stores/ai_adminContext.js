"use client"

import { createContext, useState, useCallback, useEffect } from 'react';

export const AiAdminContext = createContext({});

export const AdminContextProvider = ({ children }) => {
  // States
  const [eleves, setEleves] = useState([]);
  const [enseignants, setEnseignants] = useState([]);
  const [classes, setClasses] = useState([]);
  const [selected, setSelected] = useState(null);
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
    const res = await fetch('/api/school_ai/eleves', {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    const updated = await fetch('/api/school_ai/eleves');
    const newList = await updated.json();
    setEleves(newList);
    saveToStorage('eleves', newList);
    return await res.json();
  }, []);

  const deleteEleve = useCallback(async (_id) => {
    await fetch('/api/school_ai/eleves', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ _id }),
    });
    const updated = await fetch('/api/school_ai/eleves');
    const newList = await updated.json();
    setEleves(newList);
    saveToStorage('eleves', newList);
  }, []);

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
    const res = await fetch('/api/school_ai/enseignants', {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    const updated = await fetch('/api/school_ai/enseignants');
    const newList = await updated.json();
    setEnseignants(newList);
    saveToStorage('enseignants', newList);
    return await res.json();
  }, []);

  const deleteEnseignant = useCallback(async (_id) => {
    await fetch('/api/school_ai/enseignants', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ _id }),
    });
    const updated = await fetch('/api/school_ai/enseignants');
    const newList = await updated.json();
    setEnseignants(newList);
    saveToStorage('enseignants', newList);
  }, []);

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
    const res = await fetch('/api/school_ai/classes', {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    const updated = await fetch('/api/school_ai/classes');
    const newList = await updated.json();
    setClasses(newList);
    saveToStorage('classes', newList);
    return await res.json();
  }, []);

  const deleteClasse = useCallback(async (_id) => {
    await fetch('/api/school_ai/classes', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ _id })
    });
    const updated = await fetch('/api/school_ai/classes');
    const newList = await updated.json();
    setClasses(newList);
    saveToStorage('classes', newList);
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

  // --- AUTO FETCH CLASSES AU MONTAGE ---
  useEffect(() => {
    if (classes.length === 0) fetchClasses();
  }, [classes.length, fetchClasses]);







  return (
    <AiAdminContext.Provider
      value={{
        eleves, fetchEleves, saveEleve, deleteEleve,
        enseignants, fetchEnseignants, saveEnseignant, deleteEnseignant,
        classes, fetchClasses, saveClasse, deleteClasse,
        uploadFile,
        selected, setSelected, showModal, setShowModal
      }}
    >
      {children}
    </AiAdminContext.Provider>
  );
};
