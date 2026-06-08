import React, { useState, useEffect, useContext, useMemo, useRef, Fragment } from 'react';
import { AiAdminContext } from '../../stores/ai_adminContext';
import { MATIERES_SCOLAIRES, COEFFICIENTS_MATIERES } from '../../utils/matieres'; // Keep for structure mapping only
import { getLSItem, setLSItem } from '../../utils/localStorageManager';
import { Parent, CommentairesBlock, SchoolHistoryBlock, ScolarityFeesBlock, CoefficientsManager, CompositionsBlock, AbsencesBlock, BonusBlock, ManusBlock, AddNoteForm, TargetsProfilingBlock, DocumentsBlock, CompositionsManager, generateSchoolYears } from './entityBlocks';

// type: 'eleve' | 'enseignant' | 'classe'


export default function EntityModal({ type, entity, onClose, classes = [] }) {
  // --- Gestion de l'année scolaire sélectionnée pour les compositions ---
  const getDefaultSchoolYear = (compositions) => {
    const keys = Object.keys(compositions || {});
    if (keys.length > 0) return keys[0];
    const now = new Date();
    return (now.getMonth() + 1) < 7 ? (now.getFullYear() - 1) + "-" + now.getFullYear() : now.getFullYear() + "-" + (now.getFullYear() + 1);
  };
  const [schoolYear, setSchoolYear] = useState(getDefaultSchoolYear(entity?.compositions || {}));
  // Absences
  const [showAbsencePicker, setShowAbsencePicker] = useState(false);
  const [newAbsenceDate, setNewAbsenceDate] = useState('');
  // Bonus
  const [showBonusPicker, setShowBonusPicker] = useState(false);
  const [newBonusDate, setNewBonusDate] = useState('');
  const [newBonusReason, setNewBonusReason] = useState('');
  // Manus
  const [showManusPicker, setShowManusPicker] = useState(false);
  const [newManusDate, setNewManusDate] = useState('');
  const [newManusReason, setNewManusReason] = useState('');
  const ctx = useContext(AiAdminContext);
  const { dynamicSubjects, subjectsLoaded } = ctx;
  const fileInput = useRef();

  // État pour la duplication de classe
  const [duplicateYear, setDuplicateYear] = useState('');
  const [duplicating, setDuplicating] = useState(false);
  const [availableYears, setAvailableYears] = useState([]);

  // Fonction utilitaire pour convertir timestamp en format YYYY-MM-DD
  const timestampToDateString = (timestamp) => {
    if (!timestamp) return '';
    const date = new Date(timestamp);
    return date.toISOString().split('T')[0]; // Format YYYY-MM-DD
  };

  // Initialiser le formulaire avec conversion des dates
  const initializeForm = (entityData) => {
    if (!entityData) return {};

    const formData = { ...entityData };

    // Convertir le timestamp en format date pour l'input
    if (formData.naissance_$_date && typeof formData.naissance_$_date === 'number') {
      formData.naissance_$_date = timestampToDateString(formData.naissance_$_date);
    }

    // Normaliser l'adresse (objet {lat,lng} → chaîne "lat,lng") pour éviter "[object Object]" dans l'input
    if (formData.adresse_$_map && typeof formData.adresse_$_map === 'object') {
      const { lat, lng } = formData.adresse_$_map;
      formData.adresse_$_map = (lat != null && lng != null) ? `${lat},${lng}` : '';
    }

    // S'assurer que les coefficients sont toujours initialisés pour les classes
    if (type === 'classe' && !formData.coefficients) {
      formData.coefficients = {};
    }

    return formData;
  };

  const [form, setForm] = useState(initializeForm(entity));
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState('');

  // Charger les années disponibles pour la duplication
  useEffect(() => {
    if (type === 'classe' && entity) {
      loadAvailableYears();
    }
  }, [type, entity]);

  const loadAvailableYears = async () => {
    try {
      // Récupérer toutes les classes existantes
      const res = await fetch('/api/school_ai/classes');
      if (!res.ok) throw new Error('Erreur lors du chargement des classes');

      const allClasses = await res.json();

      // Générer la plage d'années (±10 ans de l'année courante)
      const currentYear = new Date().getFullYear();
      const years = [];

      for (let i = -10; i <= 10; i++) {
        const startYear = currentYear + i;
        const endYear = startYear + 1;
        const yearString = `${startYear}-${endYear}`;
        years.push(yearString);
      }

      // Filtrer les années où cette classe existe déjà
      const existingYears = allClasses
        .filter(c => c.niveau === entity.niveau && c.alias === entity.alias)
        .map(c => c.annee);

      const available = years.filter(year => !existingYears.includes(year));

      console.log('🔍 Debug années disponibles:', {
        classeNiveau: entity.niveau,
        classeAlias: entity.alias,
        classeAnneeActuelle: entity.annee,
        existingYears,
        availableYears: available
      });

      setAvailableYears(available);

    } catch (error) {
      console.error('Erreur lors du chargement des années:', error);
    }
  };

  // Fonction pour dupliquer une classe
  const handleDuplicateClass = async () => {
    if (!duplicateYear) {
      alert('Veuillez sélectionner une année pour la duplication');
      return;
    }

    console.log('🔍 Duplication classe:', {
      selectedYear: duplicateYear,
      currentClassYear: entity.annee
    });

    if (duplicateYear === entity.annee) {
      alert('Impossible de dupliquer vers la même année scolaire');
      return;
    }

    const confirmMessage = `Dupliquer la classe ${entity.niveau} ${entity.alias} vers l'année ${duplicateYear} ?\n\nLa nouvelle classe aura les mêmes informations mais aucun élève ni enseignant.`;

    if (!confirm(confirmMessage)) return;

    setDuplicating(true);

    try {
      const res = await fetch(`/api/classes/${entity._id}/duplicate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          targetYear: duplicateYear
        })
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || 'Erreur lors de la duplication');
      }

      const result = await res.json();

      alert(`✅ Classe dupliquée avec succès pour l'année ${duplicateYear} !`);

      // Rafraîchir les données
      if (ctx.fetchClasses) {
        ctx.fetchClasses();
      }

      // Recharger les années disponibles
      loadAvailableYears();

      // Réinitialiser la sélection
      setDuplicateYear('');

    } catch (error) {
      console.error('❌ Erreur lors de la duplication:', error);
      alert(`❌ Erreur: ${error.message}`);
    } finally {
      setDuplicating(false);
    }
  };
  const [selectedFile, setSelectedFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState('');
  const [showMap, setShowMap] = useState(false);

  // États pour les coefficients de classe
  const [classCoefficients, setClassCoefficients] = useState({});
  const [classCoefficientsLoaded, setClassCoefficientsLoaded] = useState(false);

  // États pour la capture caméra
  const [showCamera, setShowCamera] = useState(false);

  // Pré-remplissage par défaut selon l'entité
  useEffect(() => {
    if (entity) {
      // Mode édition : initialiser avec les données de l'entité (avec conversion des dates)
      setForm(initializeForm(entity));
    } else {
      // Mode création : initialiser avec des valeurs par défaut
      if (type === 'eleve') setForm({ nom: '', prenoms: [''], naissance_$_date: '', adresse_$_map: '', parents: { mere: '', pere: '', phone: '' }, photo_$_file: '', current_classe: '', documents: [], ...form });
      if (type === 'enseignant') setForm({ nom: '', prenoms: [''], naissance_$_date: '', adresse_$_map: '', photo_$_file: '', phone_$_tel: '', email_$_email: '', current_classes: [], ...form });
      if (type === 'classe') setForm({ annee: '', niveau: '', alias: '', photo: '', coefficients: {}, ...form });
    }
    // Chargement des données fictives
    if (!entity) {
      if (type === 'eleve') {
        setForm({
          nom: 'Doe',
          prenoms: ['John'],
          naissance_$_date: '2006-01-01',
          adresse_$_map: { lat: 5.333333, lng: 3.866667 },
          parents: { mere: 'Jane', pere: 'Jean', phone: '01 23 45 67 89' },
          targetsList: {},

        });
      }
      if (type === 'enseignant') {
        setForm({
          nom: 'Dupont',
          prenoms: ['Jean'],
          naissance_$_date: '1970-01-01',
          adresse_$_map: "5.333333, 3.866667",
          photo_$_file: '/school/prof.webp',
          phone_$_tel: '01 23 45 67 89',
          email_$_email: 'jdupont@ecole.com',
        });
      }
      if (type === 'classe') {
        setForm({
          annee: '',
          niveau: '6e',
          alias: 'a',
          photo: '/school/classe.webp',

        });
      }
    }
  }, [type, entity])
  const [selectedDocuments, setSelectedDocuments] = useState([]);



  // Charger les coefficients de classe quand l'élève a une classe assignée
  useEffect(() => {
    if (type === 'eleve' && form.current_classe) {
      loadClassCoefficients(form.current_classe);
    }
  }, [type, form.current_classe]);

  // Chargement des coefficients de classe avec priorité localStorage (selon règles projet)
  const loadClassCoefficients = async (classeId) => {
    try {
      console.log('🎓 [EntityModal] Chargement des coefficients de classe - priorité localStorage...', classeId);

      // 1. PRIORITÉ ABSOLUE : Vérifier localStorage d'abord
      const localStorageKey = `app_class_coefficients_${classeId}`;
      const parsedCoefficients = getLSItem(localStorageKey);
      if (parsedCoefficients) {
        if (typeof parsedCoefficients === 'object' && parsedCoefficients !== null) {
          console.log('✅ [EntityModal] Coefficients trouvés dans localStorage:', parsedCoefficients);
          setClassCoefficients(parsedCoefficients);
          setClassCoefficientsLoaded(true);
          return; // Utiliser localStorage, pas besoin de fallback
        }
      }

      console.log('📡 [EntityModal] Pas de coefficients dans localStorage, fallback MongoDB...');

      // 2. FALLBACK : Charger depuis MongoDB et sauvegarder dans localStorage
      const response = await fetch(`/api/classes/${classeId}`, {
        credentials: 'include'
      });

      if (response.ok) {
        const data = await response.json();
        console.log('📊 [EntityModal] Données classe reçues:', data);

        if (data.success && data.data && data.data.coefficients) {
          console.log('✅ [EntityModal] Coefficients MongoDB chargés:', data.data.coefficients);

          // IMPORTANT: Sauvegarder dans localStorage pour les prochaines fois
          setLSItem(localStorageKey, data.data.coefficients);
          console.log('💾 [EntityModal] Coefficients sauvegardés dans localStorage');

          setClassCoefficients(data.data.coefficients);
        } else {
          console.log('⚠️ [EntityModal] Pas de coefficients configurés pour cette classe');
          // Sauvegarder objet vide dans localStorage
          setLSItem(localStorageKey, {});
          setClassCoefficients({});
        }
      } else {
        console.log('❌ [EntityModal] Erreur lors du chargement de la classe (404 normal si API pas implémentée)');
        // 3. FALLBACK FINAL : Utiliser coefficients par défaut et sauvegarder
        const defaultCoefficients = {};
        const defaultCoeff = parseInt(process.env.NEXT_PUBLIC_SUBJECT_COEFF || '2');

        // Créer des coefficients par défaut pour les 4 premières matières
        for (let i = 0; i < 4; i++) {
          defaultCoefficients[i.toString()] = defaultCoeff;
        }

        setLSItem(localStorageKey, defaultCoefficients);
        console.log('💾 [EntityModal] Coefficients par défaut sauvegardés dans localStorage');
        setClassCoefficients(defaultCoefficients);
      }

      setClassCoefficientsLoaded(true);
    } catch (error) {
      console.error('❌ [EntityModal] Erreur lors du chargement des coefficients de classe:', error);

      // En cas d'erreur, utiliser coefficients par défaut et sauvegarder
      const defaultCoefficients = {};
      const defaultCoeff = parseInt(process.env.NEXT_PUBLIC_SUBJECT_COEFF || '2');

      for (let i = 0; i < 4; i++) {
        defaultCoefficients[i.toString()] = defaultCoeff;
      }

      const localStorageKey = `app_class_coefficients_${classeId}`;
      setLSItem(localStorageKey, defaultCoefficients);
      setClassCoefficients(defaultCoefficients);
      setClassCoefficientsLoaded(true);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm(f => ({ ...f, [name]: value }));
  };

  const handleFile = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setSelectedFile(file);
    setPreviewUrl(URL.createObjectURL(file));
  };

  // Gestionnaire pour la capture caméra
  const handleCameraCapture = (file) => {
    setSelectedFile(file);
    setPreviewUrl(URL.createObjectURL(file));
    setShowCamera(false);
    console.log('📷 Photo capturée depuis la caméra:', file.name);
  };

  const handleDocumentChange = (index, customName) => {
    setSelectedDocuments(docs => docs.map((doc, i) => i === index ? { ...doc, customName } : doc));
  };

  const handleDocumentSelect = (e) => {
    const files = Array.from(e.target.files);
    setSelectedDocuments(files.map(file => ({ file, customName: file.name })));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    console.log(form);

    // Activer le loading spinner dès le début de la soumission
    setUploading(true);

    let newForm = { ...form };
    // alert(type)
    // Si un fichier a été sélectionné, on l'upload maintenant
    if (selectedFile || (selectedDocuments && selectedDocuments.length > 0)) {
      setUploading(true);
      // Pour une classe, on envoie annee, niveau, alias pour le backend
      let uploadPayload = { file: selectedFile, type };
      uploadPayload.entityType = type; // Toujours transmettre le type en props comme entityType
      if (selectedDocuments && selectedDocuments.length > 0) {
        // On transmet documents: [{file, customName}]
        uploadPayload.documents = selectedDocuments;
      }
      if (type === 'classe') {
        uploadPayload.annee = form.annee;
        uploadPayload.niveau = form.niveau;
        uploadPayload.alias = form.alias;
      }
      if (type === 'eleve' || type === 'enseignant') {
        console.log(form['nom']);
        console.log(+form['prenoms']);
        console.log(form['naissance_$_date']);
        console.log(+new Date(form['naissance_$_date'] + ""));


        uploadPayload.nom = form.nom;
        // Prend le premier prénom si tableau, sinon la string
        uploadPayload.prenoms = Array.isArray(form.prenoms) ? form.prenoms[0] : form.prenoms;
        uploadPayload['naissance_$_date'] = +new Date(form['naissance_$_date'] + "");
        console.log("rrrrrrrrrrrrrrrrrrrrrr");
        console.log(uploadPayload);
        console.log("rrrrrrrrrrrrrrrrrrrrrr");

      }
      const uploadRes = await ctx.uploadFile(uploadPayload);
      console.log('🎉 UPLOAD RESULT:', uploadRes);
      console.log('🎉 UPLOAD RESULT - cloudinaryResults:', uploadRes.cloudinaryResults);
      console.log('🎉 UPLOAD RESULT - success:', uploadRes.success);
      const { paths, error, cloudinaryResults, success } = uploadRes;

      setUploading(false);

      if (error || !paths) {
        setError("Erreur lors de l'upload du fichier : " + (error || 'aucun chemin de fichier retourné'));
        return;
      }

      // 🚀 NOUVEAU : Si upload Cloudinary réussi, ajouter l'objet cloudinary
      console.log('🔍 DEBUG EntityModal - uploadRes:', uploadRes);
      console.log('🔍 DEBUG EntityModal - success:', success);
      console.log('🔍 DEBUG EntityModal - cloudinaryResults:', cloudinaryResults);

      if (success && cloudinaryResults && cloudinaryResults.length > 0) {
        console.log('🔍 DEBUG EntityModal - cloudinaryResults[0]:', cloudinaryResults[0]);
        console.log('🔍 DEBUG EntityModal - cloudinaryResults length:', cloudinaryResults.length);
        console.log('🔍 DEBUG EntityModal - cloudinaryResults full:', JSON.stringify(cloudinaryResults, null, 2));

        const cloudinaryData = cloudinaryResults[0]; // Premier fichier uploadé
        console.log('🔍 DEBUG EntityModal - cloudinaryData:', cloudinaryData);

        // Vérifier que les données Cloudinary sont valides
        if (cloudinaryData && cloudinaryData.url && typeof cloudinaryData.url === 'string') {
          // FORCER le remplacement complet de l'objet cloudinary
          // D'abord supprimer l'ancien objet
          delete newForm.cloudinary;

          // Puis créer le nouvel objet cloudinary complet
          newForm.cloudinary = {
            url: cloudinaryData.url,
            publicId: cloudinaryData.publicId,
            thumbnail: cloudinaryData.url.replace('/upload/', '/upload/c_thumb,w_150,h_150,f_auto,q_auto/'),
            medium: cloudinaryData.url.replace('/upload/', '/upload/c_scale,w_400,f_auto,q_auto/'),
            large: cloudinaryData.url.replace('/upload/', '/upload/c_scale,w_800,f_auto,q_auto/'),
            migratedAt: new Date()
          };

          console.log('🔄 Ancien objet cloudinary supprimé et remplacé');

          console.log('☁️ Objet Cloudinary ajouté:', newForm.cloudinary);
        } else {
          console.warn('⚠️ Données Cloudinary invalides:', cloudinaryData);
        }
      }
      if (type === 'classe') {
        // Filtrer les paths valides avant de chercher
        const validPaths = paths.filter(p => p && typeof p === 'string');
        newForm.photo = validPaths.find(p => p.endsWith('photo.webp'));

        console.log('📁 Paths classe traités:', { paths, validPaths, photo: newForm.photo });

        uploadPayload.annee = form.annee;
        uploadPayload.niveau = form.niveau;
        uploadPayload.alias = form.alias;
      }
      if (type === 'eleve' || type === 'enseignant') {
        // Filtrer les paths valides avant de chercher
        const validPaths = paths.filter(p => p && typeof p === 'string');
        // Accepter tous les formats d'image, pas seulement .webp
        newForm.photo_$_file = validPaths.find(p =>
          p.includes('photo') ||
          p.match(/\.(jpg|jpeg|png|webp|gif)$/i) ||
          validPaths.length === 1 // Si un seul fichier, c'est probablement la photo
        ) || validPaths[0]; // Fallback vers le premier fichier

        newForm.documents = validPaths;

        console.log('📁 Paths traités:', { paths, validPaths, photo: newForm.photo_$_file });
      }
    }
    if (type === 'eleve') {
      if (!newForm.current_classe || !newForm.photo_$_file) {
        setUploading(false);
        return setError('Classe et photo obligatoires.');
      }
      // Nettoyage du form pour Mongoose :
      if (newForm.current_classe === "") delete newForm.current_classe;
      // absences : toujours tableau d'objets
      if (typeof newForm.absences === 'string') {
        try {
          newForm.absences = JSON.parse(newForm.absences);
        } catch (e) {
          newForm.absences = [];
        }
      }
      if (!Array.isArray(newForm.absences)) newForm.absences = [];
      // adresse_$_map : toujours string "lat,lng"
      if (typeof newForm['adresse_$_map'] === 'object' && newForm['adresse_$_map'] !== null) {
        if ('lat' in newForm['adresse_$_map'] && 'lng' in newForm['adresse_$_map']) {
          newForm['adresse_$_map'] = `${newForm['adresse_$_map'].lat},${newForm['adresse_$_map'].lng}`;
        }
      }
      setError('');
      console.log('💾 DEBUG EntityModal - newForm avant saveEleve:', newForm);
      console.log('💾 DEBUG EntityModal - newForm.cloudinary:', newForm.cloudinary);

      await ctx.saveEleve(newForm);
      console.log('✅ Élève sauvegardé avec succès');
      setUploading(false);
      onClose();
      return; // Sortir de la fonction
    } else if (type === 'enseignant') {
      if (!newForm.nom || !newForm.photo_$_file) {
        setUploading(false);
        return setError('Nom et photo obligatoires.');
      }
      setError('');
      if (typeof newForm['adresse_$_map'] === 'object' && newForm['adresse_$_map'] !== null) {
        if ('lat' in newForm['adresse_$_map'] && 'lng' in newForm['adresse_$_map']) {
          newForm['adresse_$_map'] = `${newForm['adresse_$_map'].lat},${newForm['adresse_$_map'].lng}`;
        }
      }
      // Correction current_classe(s) - ne supprimer que si vraiment vide
      if ('current_classes' in newForm && (!newForm.current_classes || (Array.isArray(newForm.current_classes) && newForm.current_classes.length === 0))) {
        // Pour les enseignants, on peut avoir un array vide (pas de classe assignée)
        // Ne pas supprimer le champ, juste s'assurer qu'il est un array vide
        if (type === 'enseignant') {
          newForm.current_classes = [];
        } else {
          delete newForm.current_classes;
        }
      }
      // Correction naissance_$_date
      if (typeof newForm['naissance_$_date'] === 'string' && newForm['naissance_$_date'].length > 0) {
        newForm['naissance_$_date'] = +new Date(newForm['naissance_$_date']);
      }
      setError('');
      console.log('🔍 DEBUG ENSEIGNANT - Données avant sauvegarde:', newForm);
      console.log('🔍 DEBUG ENSEIGNANT - Type de current_classes:', typeof newForm.current_classes);
      console.log('🔍 DEBUG ENSEIGNANT - Valeur current_classes:', newForm.current_classes);
      console.log('🔍 DEBUG ENSEIGNANT - Est un array?', Array.isArray(newForm.current_classes));

      await ctx.saveEnseignant(newForm);
    } else if (type === 'classe') {
      console.log('DEBUG SUBMIT CLASSE - Avant traitement:', newForm);

      if (!newForm.niveau || !newForm.alias) {
        setUploading(false);
        return setError('Niveau et alias obligatoires.');
      }

      // Si aucune photo personnalisée n'a été uploadée (utilise encore l'image par défaut)
      if (!newForm.photo || newForm.photo === '/school/classe.webp' || newForm.photo === '/school/prof.webp') {
        console.log('📁 Utilisation de l\'image par défaut pour la classe...');
        setUploading(true);

        try {
          // Charger l'image par défaut depuis /school/classe.webp
          const defaultImagePath = type === 'enseignant' ? '/school/prof.webp' : '/school/classe.webp';
          console.log('🖼️ Chargement de l\'image par défaut:', defaultImagePath);

          // Télécharger l'image par défaut et la convertir en Blob
          const response = await fetch(defaultImagePath);
          if (!response.ok) throw new Error('Image par défaut introuvable');

          const blob = await response.blob();
          const file = new File([blob], 'photo.webp', { type: 'image/webp' });

          // Uploader l'image par défaut vers le dossier de la classe
          const uploadPayload = {
            file: file,
            type: 'classe',
            entityType: 'classe',
            annee: newForm.annee,
            niveau: newForm.niveau,
            alias: newForm.alias
          };

          const uploadRes = await ctx.uploadFile(uploadPayload);
          console.log('📤 Résultat copie image par défaut:', uploadRes);

          const { paths, error } = uploadRes;

          if (error || !paths) {
            throw new Error(error || 'Aucun chemin de fichier retourné');
          }

          // Assigner le chemin de la photo copiée
          newForm.photo = paths.find(p => p.endsWith('photo.webp'));
          console.log('✅ Image par défaut copiée:', newForm.photo);

        } catch (error) {
          console.error('❌ Erreur lors de la copie de l\'image par défaut:', error);
          setError('Erreur lors de la copie de l\'image par défaut: ' + error.message);
          setUploading(false);
          return;
        } finally {
          setUploading(false);
        }
      }

      setError('');
      console.log('DEBUG SUBMIT CLASSE - Après traitement:', newForm);

      // Sauvegarder la classe d'abord
      const savedClasse = await ctx.saveClasse(newForm);

      // Ensuite, sauvegarder les coefficients si configurés
      console.log('🔍 [EntityModal] Vérification des coefficients à sauvegarder:', {
        hasCoefficients: !!form.coefficients,
        coefficientsType: typeof form.coefficients,
        coefficientsKeys: form.coefficients ? Object.keys(form.coefficients) : 'N/A',
        coefficientsContent: form.coefficients
      });

      if (form.coefficients && Object.keys(form.coefficients).length > 0) {
        console.log('💾 [EntityModal] Sauvegarde des coefficients de classe:', form.coefficients);

        try {
          const classeId = entity?._id || savedClasse?._id || savedClasse?.data?._id;
          if (classeId) {
            const response = await fetch(`/api/classes/${classeId}`, {
              method: 'PUT',
              headers: {
                'Content-Type': 'application/json',
              },
              credentials: 'include',
              body: JSON.stringify({
                coefficients: form.coefficients
              })
            });

            if (response.ok) {
              const result = await response.json();
              console.log('✅ [EntityModal] Coefficients sauvegardés avec succès:', result);

              // Mettre à jour le localStorage aussi
              const localStorageKey = `app_class_coefficients_${classeId}`;
              setLSItem(localStorageKey, form.coefficients);
              console.log('💾 [EntityModal] Coefficients mis à jour dans localStorage');
            } else {
              console.error('❌ [EntityModal] Erreur lors de la sauvegarde des coefficients:', response.status);
            }
          } else {
            console.warn('⚠️ [EntityModal] Impossible de récupérer l\'ID de la classe pour sauvegarder les coefficients');
          }
        } catch (error) {
          console.error('❌ [EntityModal] Erreur lors de la sauvegarde des coefficients:', error);
        }
      }
    }

    // Désactiver le loading spinner à la fin
    setUploading(false);
    onClose();
  };
  const handleMapClick = (coords) => {
    const lat = coords.lat.toFixed(6);
    const lng = coords.lng.toFixed(6);
    setForm(f => ({ ...f, adresse_$_map: `${lat},${lng}` }));
    // setShowMap(false);
  };

  // Rendu dynamique selon le type
  return (
    <div className="modal">
      <div className="modal__container">
        <header className="modal__header">
          <h2 className="modal__title">
            {type === 'eleve' && (entity ? 'Modifier l\'élève' : 'Ajouter un élève')}
            {type === 'enseignant' && (entity ? 'Modifier l\'enseignant' : 'Ajouter un enseignant')}
            {type === 'classe' && (entity ? 'Modifier la classe' : 'Ajouter une classe')}
          </h2>

          {/* Contrôles du header pour les élèves */}
          {type === 'eleve' && (
            <div className="modal__headerControls">
              <select
                className="modal__yearSelect"
                value={schoolYear}
                onChange={e => setSchoolYear(e.target.value)}
              >
                {(() => {
                  // Utilise la même logique que CompositionsBlock
                  const { years, currentYearStart } = generateSchoolYears(entity?.compositions);

                  return years.map(y => {
                    const start = parseInt(y.split('-')[0], 10);
                    let color = '';
                    if (start === currentYearStart) color = 'green';
                    else if (start < currentYearStart) color = 'red';
                    else color = 'blue';
                    return <option key={y} value={y} className={"option_" + color}>{y}</option>;
                  });
                })()}
              </select>
            </div>
          )}

          {/* Contrôles du header pour les classes - Duplication */}
          {type === 'classe' && entity && (
            <div className="modal__headerControls">
              <div className="modal__duplicateControls">
                <select
                  className="modal__duplicateDate"
                  value={duplicateYear}
                  onChange={(e) => setDuplicateYear(e.target.value)}
                  disabled={duplicating}
                  title="Sélectionner une année pour dupliquer la classe"
                >
                  <option value="">-- Choisir une année --</option>
                  {availableYears.map(year => (
                    <option key={year} value={year}>
                      {year}
                    </option>
                  ))}
                </select>
                <button
                  type="button"
                  className="modal__duplicateBtn"
                  onClick={handleDuplicateClass}
                  disabled={duplicating || !duplicateYear || availableYears.length === 0}
                  title="Dupliquer la classe pour l'année scolaire sélectionnée"
                >
                  {duplicating ? '⏳' : '📋'}
                </button>
              </div>
            </div>
          )}

          <button type="button" className="modal__closeBtn" onClick={onClose} aria-label="Fermer">
            ✕
          </button>
        </header>

        {(uploading || (typeof window !== 'undefined' && ctx && ctx.showModal && uploading)) && (
          <div className="modal__loadingOverlay">
            <div className="modal__loadingSpinner"></div>
            <span>Enregistrement en cours...</span>
          </div>
        )}

        <div className="modal__body">
          {error && (
            <div className="modal__errorMessage">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} id="modalPersonForm" className="modal__form">








            {type === 'eleve' && <>
              <div className="modal__fieldGroup modal__fieldGroup--grid">
                <div className="modal__fieldGroup">
                  <label htmlFor="input-nom" className="modal__label">Nom</label>
                  <input
                    id="input-nom"
                    name="nom"
                    value={form.nom || ''}
                    onChange={handleChange}
                    placeholder="Nom de famille"
                    className="modal__input"
                    required
                  />
                </div>

                <div className="modal__fieldGroup">
                  <label htmlFor="input-prenoms" className="modal__label">Prénoms</label>
                  <input
                    id="input-prenoms"
                    name="prenoms"
                    value={Array.isArray(form.prenoms) ? form.prenoms.join(',') : form.prenoms || ''}
                    onChange={e => setForm(f => ({ ...f, prenoms: e.target.value.split(',') }))}
                    placeholder="Prénoms (séparés par des virgules)"
                    className="modal__input"
                    required
                  />
                </div>
              </div>

              <div className="modal__fieldGroup modal__fieldGroup--grid">
                <div className="modal__fieldGroup">
                  <label htmlFor="input-sexe" className="modal__label">Sexe</label>
                  <select id="input-sexe" name="sexe" value={form.sexe || ''} onChange={handleChange} className="modal__select" required>
                    <option value="">Sélectionnez le sexe</option>
                    <option value="M">Masculin</option>
                    <option value="F">Féminin</option>
                  </select>
                </div>

                <div className="modal__fieldGroup">
                  <label htmlFor="input-naissance" className="modal__label">Date de naissance</label>
                  <input
                    id="input-naissance"
                    type="date"
                    name="naissance_$_date"
                    value={form.naissance_$_date || ''}
                    onChange={handleChange}
                    className="modal__input"
                    required
                  />
                </div>
              </div>

              <div className="modal__fieldGroup">
                <label htmlFor="input-adresse" className="modal__label">Adresse (facultatif)</label>
                <div className="modal__fieldGroup modal__fieldGroup--row">
                  <input
                    id="input-adresse"
                    name="adresse_$_map"
                    value={typeof form.adresse_$_map === 'object' && form.adresse_$_map
                      ? `${form.adresse_$_map.lat ?? ''},${form.adresse_$_map.lng ?? ''}`
                      : (form.adresse_$_map || '')}
                    onChange={handleChange}
                    placeholder="Adresse"
                    className="modal__input"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowMap(true)}
                    className="modal__btn modal__btn--secondary input-adresseBtn"
                    title="Ouvrir la carte"
                  >
                    📍
                  </button>
                </div>
              </div>
              {showMap && (
                <div className="modal__map-container">
                  <Gmap
                    // Pass initial center based on current state (which might be from datas)
                    // initialCenter={{ lat: parseFloat(latitude) || 5.36, lng: parseFloat(longitude) || -4.00 }}
                    onCoordinatesClick={handleMapClick} // Pass the callback function
                  />
                  <button
                    type="button"
                    onClick={() => setShowMap(false)}
                    className="modal__btn modal__btn--secondary"
                  >
                    Fermer la carte
                  </button>
                </div>
              )}
              <Parent form={form} setForm={setForm} />
              <div className="modal__fieldGroup">
                <label htmlFor="input-classe" className="modal__label">Classe actuelle</label>
                <select id="input-classe" name="current_classe" value={form.current_classe || ''} onChange={handleChange} className="modal__select" required>
                <option value="">Sélectionnez une classe</option>
                {ctx.classes && (() => {
                  // Logique dynamique : filtrer les classes de l'année courante et suivante
                  const currentDate = new Date();
                  const currentMonth = currentDate.getMonth(); // 0-11
                  const currentYear = currentDate.getFullYear();

                  // Déterminer l'année scolaire courante (septembre à août)
                  const schoolYearStart = currentMonth >= 8 ? currentYear : currentYear - 1;

                  // Générer l'année scolaire courante et suivante
                  const relevantSchoolYears = [
                    `${schoolYearStart}-${schoolYearStart + 1}`,     // Année courante
                    `${schoolYearStart + 1}-${schoolYearStart + 2}`  // Année suivante
                  ];

                  // Filtrer les classes par années pertinentes
                  let filteredClasses = ctx.classes.filter(classe => relevantSchoolYears.includes(classe.annee));

                  // Si on édite un élève et que sa classe actuelle n'est pas dans la liste, l'ajouter
                  if (entity && form.current_classe) {
                    const currentClasseExists = filteredClasses.some(classe => classe._id === form.current_classe);
                    if (!currentClasseExists) {
                      const currentClasse = ctx.classes.find(classe => classe._id === form.current_classe);
                      if (currentClasse) {
                        filteredClasses = [currentClasse, ...filteredClasses];
                      }
                    }
                  }

                  return filteredClasses
                    .sort((a, b) => b.annee.localeCompare(a.annee)) // Trier par année décroissante
                    .map(classe => (
                      <option key={classe._id} value={classe._id}>
                        {classe.niveau} {classe.alias} ({classe.annee})
                        {entity && form.current_classe === classe._id ? ' (Actuelle)' : ''}
                      </option>
                    ));
                })()}
                </select>
              </div>

              <div className="modal__fieldGroup">
                <label className="modal__label">Photo de l'élève</label>

                <div className="modal__photo-controls">
                  <input
                    id="input-photo"
                    type="file"
                    ref={fileInput}
                    accept="image/*"
                    required={!form.photo_$_file && !previewUrl}
                    onChange={handleFile}
                    className="modal__input modal__input--file"
                  />

                  <button
                    type="button"
                    onClick={() => setShowCamera(true)}
                    className="modal__camera-btn"
                    title="Prendre une photo avec la caméra"
                  >
                    <span className="modal__camera-btn-icon">📷</span>
                    <span className="modal__camera-btn-text">Caméra</span>
                  </button>
                </div>

                {(previewUrl || form.photo_$_file) && (
                  <div className="modal__photo-preview">
                    <img
                      src={previewUrl || form.photo_$_file || "/school/classe.webp"}
                      alt="Photo de l'élève"
                      className="modal__preview-image"
                    />
                    {previewUrl && (
                      <button
                        type="button"
                        onClick={() => {
                          setPreviewUrl('');
                          setSelectedFile(null);
                          if (fileInput.current) fileInput.current.value = '';
                        }}
                        className="modal__remove-photo-btn"
                        title="Supprimer la photo"
                      >
                        ✕
                      </button>
                    )}
                  </div>
                )}
              </div>

              <TargetsProfilingBlock form={form} setForm={setForm} />
              <AbsencesBlock absences={form.absences} setForm={setForm} />
              <BonusBlock bonus={form.bonus} setForm={setForm} />
              <ManusBlock manus={form.manus} setForm={setForm} />
              <CommentairesBlock
                commentaires={Array.isArray(form.commentaires) ? form.commentaires : []}
                setForm={setForm}
              />
              <input type="hidden" name="commentaires" value={JSON.stringify(Array.isArray(form.commentaires) ? form.commentaires : [])} />
              <DocumentsBlock form={form} setForm={setForm} selectedDocuments={selectedDocuments} setSelectedDocuments={setSelectedDocuments} />

              <label>Notes</label>
              {/* <AddNoteForm
              notes={form.notes || {}}
              onAdd={noteObj => setForm(f => ({ ...f, notes: { ...f.notes, ...noteObj } }))}
              onRemove={timestamp => setForm(f => { const newNotes = { ...f.notes }; delete newNotes[timestamp]; return { ...f, notes: newNotes }; })}
            /> */}

              <label>Compositions</label>
              {/* Bloc de gestion des compositions par trimestre */}
              <CompositionsBlock
                compositions={form.compositions || {}}
                schoolYear={schoolYear}
                onChange={newCompo => setForm(f => ({ ...f, compositions: newCompo }))}
                studentData={form}
                dynamicSubjects={dynamicSubjects}
                subjectsLoaded={subjectsLoaded}
                classCoefficients={classCoefficients}
                classes={classes}
              />
              <textarea readOnly name="compositions" value={form.compositions ? JSON.stringify(form.compositions) : ''}
              // onChange={e => setForm(f => ({ ...f, compositions: e.target.value ? JSON.parse(e.target.value) : {} }))} 
              />
              {/* <label>Moyenne trimetriel (JSON)
              <textarea name="moyenne_trimetriel" value={form.moyenne_trimetriel ? JSON.stringify(form.moyenne_trimetriel) : ''} onChange={e => setForm(f => ({ ...f, moyenne_trimetriel: e.target.value ? JSON.parse(e.target.value) : {} }))} />
            </label> */}
              <label>Frais de scolarité</label>
              <ScolarityFeesBlock
                fees={form.scolarity_fees_$_checkbox?.[schoolYear] || {}}
                onChange={newFees => setForm(f => ({
                  ...f,
                  scolarity_fees_$_checkbox: {
                    ...f.scolarity_fees_$_checkbox,
                    [schoolYear]: newFees
                  }
                }))}
                schoolYear={schoolYear}
                targetsList={form.targetsList || {}}
              />
              <textarea readOnly name="scolarity_fees_$_checkbox_" value={form.scolarity_fees_$_checkbox ? JSON.stringify(form.scolarity_fees_$_checkbox) : ''}
              // onChange={e => setForm(f => ({ ...f, scolarity_fees_$_checkbox: e.target.value ? JSON.parse(e.target.value) : {} }))} 
              />
              <label>Historique scolaire
              </label>
              <SchoolHistoryBlock
                schoolHistory={(() => {
                  const now = new Date();
                  const currentYearStart = (now.getMonth() + 1) < 7 ? now.getFullYear() - 1 : now.getFullYear();
                  const currentYearStr = `${currentYearStart}-${currentYearStart + 1}`;
                  return {
                    [currentYearStr]: "Martin de Porrès de Bolobi",
                    ...(form.school_history || {})
                  };
                })()}
                onChange={newHistory => setForm(f => ({ ...f, school_history: newHistory }))}
              />
              <textarea readOnly name="school_history_" value={form.school_history ? JSON.stringify(form.school_history) : ''}
              // onChange={e => setForm(f => ({ ...f, bolobi_class_history_$_ref_µ_classes: e.target.value ? JSON.parse(e.target.value) : {} }))} 
              />
            </>}







            {type === 'enseignant' && <>
              <div className="modal__fieldGroup modal__fieldGroup--grid">
                <div className="modal__fieldGroup">
                  <label htmlFor="input-nom" className="modal__label">Nom: </label>
                  <input
                    id="input-nom"
                    name="nom"
                    value={form.nom || ''}
                    onChange={handleChange}
                    placeholder="Nom"
                    className="modal__input"
                    required
                  />
                </div>

                <div className="modal__fieldGroup">
                  <label htmlFor="input-prenoms" className="modal__label">Prénoms: </label>
                  <input
                    id="input-prenoms"
                    name="prenoms"
                    value={Array.isArray(form.prenoms) ? form.prenoms.join(', ') : (form.prenoms || '')}
                    onChange={e => setForm(f => ({ ...f, prenoms: e.target.value.split(',') }))}
                    placeholder="Prénoms (séparés par des virgules)"
                    className="modal__input"
                    required
                  />
                </div>
              </div>

              <div className="modal__fieldGroup">
                <label htmlFor="input-sexe" className="modal__label">Sexe: </label>
                <select
                  id="input-sexe"
                  name="sexe"
                  value={form.sexe || ''}
                  onChange={handleChange}
                  className="modal__select"
                  required
                >
                  <option value="">Sélectionnez le sexe</option>
                  <option value="M">Masculin</option>
                  <option value="F">Féminin</option>
                </select>
              </div>
              <div className="modal__fieldGroup">
                <label htmlFor="input-classes" className="modal__label">Classes assignées: </label>
                <select
                  id="input-classes"
                  name="current_classes"
                  multiple
                  value={Array.isArray(form.current_classes) ? form.current_classes : []}
                  onChange={e => {
                    const selectedValues = Array.from(e.target.selectedOptions, option => option.value);
                    console.log('🔍 DEBUG SELECT - Classes sélectionnées:', selectedValues);
                    console.log('🔍 DEBUG SELECT - Type:', typeof selectedValues);
                    console.log('🔍 DEBUG SELECT - Est array?', Array.isArray(selectedValues));
                    setForm(f => ({ ...f, current_classes: selectedValues }));
                  }}
                  className="modal__select"
                  required
                >
                  {ctx.classes && (() => {
                    // Logique dynamique : filtrer les classes des 2 dernières années scolaires
                    const currentDate = new Date();
                    const currentMonth = currentDate.getMonth(); // 0-11
                    const currentYear = currentDate.getFullYear();

                    // Déterminer l'année scolaire courante (septembre à août)
                    const schoolYearStart = currentMonth >= 8 ? currentYear : currentYear - 1;

                    // Générer l'année scolaire courante et suivante
                    const relevantSchoolYears = [
                      `${schoolYearStart}-${schoolYearStart + 1}`,     // Année courante
                      `${schoolYearStart + 1}-${schoolYearStart + 2}`  // Année suivante
                    ];

                    return ctx.classes
                      .filter(classe => relevantSchoolYears.includes(classe.annee))
                      .sort((a, b) => b.annee.localeCompare(a.annee)) // Trier par année décroissante
                      .map(classe => (
                        <option key={classe._id} value={classe._id}>
                          {classe.niveau} {classe.alias} ({classe.annee})
                        </option>
                      ));
                  })()}
                </select>
              </div>

              <div className="modal__fieldGroup">
                <label htmlFor="input-naissance" className="modal__label">Date de naissance: </label>
                <input
                  id="input-naissance"
                  type="date"
                  name="naissance_$_date"
                  value={form.naissance_$_date || ''}
                  onChange={handleChange}
                  className="modal__input"
                  required
                />
              </div>

              <div className="modal__fieldGroup">
                <label htmlFor="input-adresse" className="modal__label">Adresse (facultatif): </label>
                <div className="modal__fieldGroup modal__fieldGroup--row">
                  <input
                    id="input-adresse"
                    name="adresse_$_map"
                    value={typeof form.adresse_$_map === 'object' && form.adresse_$_map
                      ? `${form.adresse_$_map.lat ?? ''},${form.adresse_$_map.lng ?? ''}`
                      : (form.adresse_$_map || '')}
                    onChange={handleChange}
                    placeholder="Adresse"
                    className="modal__input"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowMap(true)}
                    className="modal__btn modal__btn--secondary input-adresseBtn"
                    title="Ouvrir la carte"
                  >
                    📍
                  </button>
                </div>
              </div>
              {showMap && (
                <div className="modal__map-container">
                  <Gmap
                    onCoordinatesClick={handleMapClick}
                  />
                  <button
                    type="button"
                    onClick={() => setShowMap(false)}
                    className="modal__btn modal__btn--secondary"
                  >
                    Fermer la carte
                  </button>
                </div>
              )}

              <div className="modal__fieldGroup modal__fieldGroup--grid">
                <div className="modal__fieldGroup">
                  <label htmlFor="input-tel" className="modal__label">N° Téléphone: </label>
                  <input
                    id="input-tel"
                    name="phone_$_tel"
                    value={form.phone_$_tel || ''}
                    onChange={handleChange}
                    placeholder="Téléphone"
                    className="modal__input"
                    required
                  />
                </div>

                <div className="modal__fieldGroup">
                  <label htmlFor="input-email" className="modal__label">Email: </label>
                  <input
                    id="input-email"
                    name="email_$_email"
                    value={form.email_$_email || ''}
                    onChange={handleChange}
                    placeholder="Email"
                    className="modal__input"
                    type="email"
                    required
                  />
                </div>
              </div>
              <div className="modal__fieldGroup">
                <label className="modal__label">Photo de l'enseignant: </label>

                <div className="modal__photo-controls">
                  <input
                    id="input-photo"
                    type="file"
                    ref={fileInput}
                    accept="image/*"
                    required={!form.photo_$_file && !previewUrl}
                    onChange={handleFile}
                    className="modal__input modal__input--file"
                  />

                  <button
                    type="button"
                    onClick={() => setShowCamera(true)}
                    className="modal__camera-btn"
                    title="Prendre une photo avec la caméra"
                  >
                    <span className="modal__camera-btn-icon">📷</span>
                    <span className="modal__camera-btn-text">Caméra</span>
                  </button>
                </div>

                {(previewUrl || form.photo_$_file) && (
                  <div className="modal__photo-preview">
                    <img
                      src={previewUrl || form.photo_$_file || "/school/prof.webp"}
                      alt="Photo de l'enseignant"
                      className="modal__preview-image"
                    />
                    {previewUrl && (
                      <button
                        type="button"
                        onClick={() => {
                          setPreviewUrl('');
                          setSelectedFile(null);
                          if (fileInput.current) fileInput.current.value = '';
                        }}
                        className="modal__remove-photo-btn"
                        title="Supprimer la photo"
                      >
                        ✕
                      </button>
                    )}
                  </div>
                )}
              </div>

            </>}









            {type === 'classe' && <>
              <div className="modal__fieldGroup">
                <label htmlFor="input-annee" className="modal__label">Année scolaire</label>
                <select
                  id="input-annee"
                  name="annee"
                  value={form.annee || ''}
                  onChange={handleChange}
                  className="modal__select"
                  required
                >
                  <option value="">Sélectionnez l'année scolaire</option>
                  {(() => {
                    const currentYear = new Date().getFullYear()
                    const currentMonth = new Date().getMonth() + 1
                    // Si nous sommes avant juillet, l'année scolaire actuelle a commencé l'année précédente
                    const schoolYearStart = currentMonth < 7 ? currentYear - 1 : currentYear
                    const years = []
                    // Générer 5 années (2 précédentes, actuelle, 2 suivantes)
                    for (let i = -2; i <= 2; i++) {
                      const startYear = schoolYearStart + i
                      const endYear = startYear + 1
                      years.push(`${startYear}-${endYear}`)
                    }
                    return years.map(year => (
                      <option key={year} value={year}>{year}</option>
                    ))
                  })()}
                </select>
              </div>

              <div className="modal__fieldGroup modal__fieldGroup--grid">
                <div className="modal__fieldGroup">
                  <label htmlFor="input-niveau" className="modal__label">Niveau de classe</label>
                  <select
                    id="input-niveau"
                    name="niveau"
                    value={form.niveau || ''}
                    onChange={handleChange}
                    className="modal__select"
                    required
                  >
                    <option value="">Sélectionnez le niveau</option>
                    {["CP1", "CP2", "CE1", "CE2", "CM1", "CM2"].map(n => <option key={n} value={n}>{n}</option>)}
                  </select>
                </div>

                <div className="modal__fieldGroup">
                  <label htmlFor="input-alias" className="modal__label">Alias de la classe</label>
                  <input
                    id="input-alias"
                    name="alias"
                    value={form.alias || ''}
                    onChange={handleChange}
                    placeholder="Alias (ex: 4B, A, Rouge...)"
                    className="modal__input"
                    required
                  />
                </div>
              </div>

              <div className="modal__fieldGroup">
                <label className="modal__label">Photo de la classe</label>

                <div className="modal__photo-controls">
                  <input
                    id="input-photo-classe"
                    type="file"
                    ref={fileInput}
                    accept="image/*"
                    required={!form.photo && !previewUrl}
                    onChange={handleFile}
                    className="modal__input modal__input--file"
                  />

                  <button
                    type="button"
                    onClick={() => setShowCamera(true)}
                    className="modal__camera-btn"
                    title="Prendre une photo avec la caméra"
                  >
                    <span className="modal__camera-btn-icon">📷</span>
                    <span className="modal__camera-btn-text">Caméra</span>
                  </button>
                </div>

                {(previewUrl || form.photo) && (
                  <div className="modal__photo-preview">
                    <img
                      src={previewUrl || form.photo || "/school/classe.webp"}
                      alt="Photo de la classe"
                      className="modal__preview-image"
                    />
                    {previewUrl && (
                      <button
                        type="button"
                        onClick={() => {
                          setPreviewUrl('');
                          setSelectedFile(null);
                          if (fileInput.current) fileInput.current.value = '';
                        }}
                        className="modal__remove-photo-btn"
                        title="Supprimer la photo"
                      >
                        ✕
                      </button>
                    )}
                  </div>
                )}
              </div>

              {/* Section Coefficients des matières */}
              <div className="modal__fieldGroup modal__fieldGroup--coefficients">
                <h3 className="modal__sectionTitle">Coefficients des matières</h3>
                <p className="modal__sectionDescription">
                  Configurez les coefficients pour chaque matière de cette classe.
                  Si non configuré, le coefficient par défaut sera {process.env.NEXT_PUBLIC_SUBJECT_COEFF || '2'}.
                </p>

                <CoefficientsManager
                  coefficients={form.coefficients || {}}
                  onChange={(newCoefficients) => setForm(f => ({ ...f, coefficients: newCoefficients }))}
                  subjectGroup={process.env.NEXT_PUBLIC_SUBJECT_GROUP || '[0,1,2,3]'}
                  dynamicSubjects={dynamicSubjects}
                  subjectsLoaded={subjectsLoaded}
                />
              </div>

              {/* Section Gestion des compositions */}
              <div className="modal__fieldGroup modal__fieldGroup--compositions">
                <h3 className="modal__sectionTitle">Dates de compositions</h3>
                <p className="modal__sectionDescription">
                  Définissez les dates de compositions pour cette classe. Ces dates seront disponibles lors de la saisie des notes d'élèves.
                </p>

                <CompositionsManager
                  compositions={form.compositions || []}
                  onChange={(newCompositions) => setForm(f => ({ ...f, compositions: newCompositions }))}
                />
              </div>

              <div className="form-info-note">
                <p><strong>ℹ️ Information :</strong> Les professeurs et élèves seront assignés à cette classe lors de leur création/modification individuelle.</p>
              </div>

            </>}

          </form>
        </div>

        <footer className="modal__actions">
          <button type="submit" form="modalPersonForm" className="modal__actions-btn modal__actions-btn--primary">
            {uploading ? (
              <>
                <span className="modal__loadingSpinner"></span>
                Enregistrement...
              </>
            ) : (
              'Enregistrer'
            )}
          </button>

          {entity && entity._id && (
            <button
              type="button"
              className="modal__actions-btn modal__actions-btn--danger"
              onClick={() => {
                if (type === 'eleve') ctx.deleteEleve(entity._id);
                if (type === 'enseignant') ctx.deleteEnseignant(entity._id);
                if (type === 'classe') ctx.deleteClasse(entity._id);
                onClose();
              }}
            >
              Supprimer
            </button>
          )}

          <button type="button" className="modal__actions-btn modal__actions-btn--secondary" onClick={onClose}>
            Annuler
          </button>
        </footer>
      </div>

      {/* Modal de capture caméra */}
      {showCamera && (
        <CameraCapture
          onCapture={handleCameraCapture}
          onClose={() => setShowCamera(false)}
          facingMode="user"
        />
      )}
    </div>
  );
}

// Re-export des sous-composants (déplacés vers ./entityBlocks) pour conserver la compatibilité des imports existants
export { SchoolHistoryBlock, ScolarityFeesBlock, TargetsProfilingBlock, AddNoteForm, CompositionsBlock, CommentairesBlock, Parent, AbsencesBlock, BonusBlock, ManusBlock, DocumentsBlock, CompositionsManager } from './entityBlocks';
