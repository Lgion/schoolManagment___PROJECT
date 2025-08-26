import { useContext, useState, useEffect, useRef, Fragment } from 'react';
import { AiAdminContext } from '../../stores/ai_adminContext';
import { MATIERES_SCOLAIRES, convertOldNotesToNew, extractMatiereNote } from '../../utils/matieres';
import Gmap from '../_/Gmap_plus';

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
  const fileInput = useRef();
  
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
    
    return formData;
  };
  
  const [form, setForm] = useState(initializeForm(entity));
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState('');
  const [selectedFile, setSelectedFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState('');
  const [showMap, setShowMap] = useState(false);

  // Pré-remplissage par défaut selon l'entité
  useEffect(() => {
    if (entity) {
      // Mode édition : initialiser avec les données de l'entité (avec conversion des dates)
      setForm(initializeForm(entity));
    } else {
      // Mode création : initialiser avec des valeurs par défaut
      if (type === 'eleve') setForm({ nom: '', prenoms: [''], naissance_$_date: '', adresse_$_map: '', parents: { mere: '', pere: '', phone: '' }, photo_$_file: '', current_classe: '', documents: [], ...form });
      if (type === 'enseignant') setForm({ nom: '', prenoms: [''], naissance_$_date: '', adresse_$_map: '', photo_$_file: '', phone_$_tel: '', email_$_email: '', current_classes: [], ...form });
      if (type === 'classe') setForm({ annee: '', niveau: '', alias: '', photo: '', ...form });
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
          isInterne: true,

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
      console.log('UPLOAD RESULT', uploadRes);
      const { paths, error } = uploadRes;
      console.log(paths);
      
      console.log("\n\n\nkkkkkkkkkkkkkkkk");
      
      console.log(uploadRes);
      
      setUploading(false);
      console.log(error);
      console.log(paths);
      
      if (error || !paths) {
        setError("Erreur lors de l'upload du fichier : " + (error || 'aucun chemin de fichier retourné'));
        return;
      }
      if (type === 'classe') {
        newForm.photo = paths.find(p => p.endsWith('photo.webp'));
        
        uploadPayload.annee = form.annee;
        uploadPayload.niveau = form.niveau;
        uploadPayload.alias = form.alias;
      }
      if (type === 'eleve' || type === 'enseignant') {
        newForm.photo_$_file = paths.find(p => p.endsWith('photo.webp'));
        newForm.documents = paths.filter(p => p.endsWith('photo.webp'));
      }
    }
    if (type === 'eleve') {
      if (!newForm.current_classe || !newForm.photo_$_file) return setError('Classe et photo obligatoires.');
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
      console.log(newForm);

      await ctx.saveEleve(newForm);
    } else if (type === 'enseignant') {
      if (!newForm.nom || !newForm.photo_$_file) return setError('Nom et photo obligatoires.');
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

      if (!newForm.niveau || !newForm.alias) return setError('Niveau et alias obligatoires.');
      
      // Si aucune photo personnalisée n'a été uploadée (utilise encore l'image par défaut)
      if (!newForm.photo || newForm.photo === '/school/classe.webp'|| newForm.photo === '/school/prof.webp') {
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
      await ctx.saveClasse(newForm);
    }
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

            <label htmlFor="input-adresse">Adresse</label>
            <div style={{ display: 'flex', alignItems: 'center' }}>
              <input
                id="input-adresse"
                name="adresse_$_map"
                value={form.adresse_$_map}
                onChange={handleChange}
                placeholder="Adresse"
                required
                style={{ flex: 1 }}
              />
              <button type="button" onClick={() => setShowMap(true)} style={{ marginLeft: 8 }}>
                📍
              </button>
            </div>
            {showMap && (
              <div style={{ margin: '10px 0' }}>
                <Gmap
                  // Pass initial center based on current state (which might be from datas)
                  // initialCenter={{ lat: parseFloat(latitude) || 5.36, lng: parseFloat(longitude) || -4.00 }}
                  onCoordinatesClick={handleMapClick} // Pass the callback function
                />
                <button type="button" onClick={() => setShowMap(false)}>Fermer la carte</button>
              </div>
            )}
            <Parent form={form} setForm={setForm} />
            {console.log(ctx.classes)}
            <label htmlFor="input-classe">Classe actuelle</label>
            <select id="input-classe" name="current_classe" value={form.current_classe || ''} onChange={handleChange} required>
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

            <label htmlFor="input-photo">Photo de l'élève</label>
            <input id="input-photo" type="file" ref={fileInput} accept="image/*" required={!form.photo_$_file} onChange={handleFile} />
            {<img src={previewUrl || "/school/classe.webp" || form.photo_$_file} alt="photo" className="previewImageAddForm" />}

            <IsInterneBlock form={form} setForm={setForm} />
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
            <AddNoteForm
              notes={form.notes || {}}
              onAdd={noteObj => setForm(f => ({ ...f, notes: { ...f.notes, ...noteObj } }))}
              onRemove={timestamp => setForm(f => { const newNotes = { ...f.notes }; delete newNotes[timestamp]; return { ...f, notes: newNotes }; })}
            />

            <label>Compositions (JSON)</label>
            {/* Bloc de gestion des compositions par trimestre */}
            <CompositionsBlock
              compositions={form.compositions || {}}
              schoolYear={schoolYear}
              onChange={newCompo => setForm(f => ({ ...f, compositions: newCompo }))}
              onChangeYear={setSchoolYear}
            />
            <textarea readOnly name="compositions" value={form.compositions ? JSON.stringify(form.compositions) : ''}
            // onChange={e => setForm(f => ({ ...f, compositions: e.target.value ? JSON.parse(e.target.value) : {} }))} 
            />
            {/* <label>Moyenne trimetriel (JSON)
              <textarea name="moyenne_trimetriel" value={form.moyenne_trimetriel ? JSON.stringify(form.moyenne_trimetriel) : ''} onChange={e => setForm(f => ({ ...f, moyenne_trimetriel: e.target.value ? JSON.parse(e.target.value) : {} }))} />
            </label> */}
            <label>Scolarity fees (JSON)</label>
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
            />
            <textarea readOnly name="scolarity_fees_$_checkbox_" value={form.scolarity_fees_$_checkbox ? JSON.stringify(form.scolarity_fees_$_checkbox) : ''}
            // onChange={e => setForm(f => ({ ...f, scolarity_fees_$_checkbox: e.target.value ? JSON.parse(e.target.value) : {} }))} 
            />
            <label>Bolobi class history (JSON)
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
            <label htmlFor="input-nom">Nom</label>
            <input name="nom" value={form.nom || ''} onChange={handleChange} placeholder="Nom" required />
            <label htmlFor="input-prenoms">Prénoms</label>
            <input name="prenoms" value={Array.isArray(form.prenoms) ? form.prenoms.join(', ') : (form.prenoms || '')} onChange={e => setForm(f => ({ ...f, prenoms: e.target.value.split(',') }))} placeholder="Prénoms (séparés par des virgules)" required />            
            <label htmlFor="input-sexe">Sexe</label>
            <select id="input-sexe" name="sexe" value={form.sexe || ''} onChange={handleChange} required>
              <option value="">Sélectionnez le sexe</option>
              <option value="M">Masculin</option>
              <option value="F">Féminin</option>
            </select>
            <label htmlFor="input-classes">Classes assignées</label>
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
              required>
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
            <label htmlFor="input-naissance">Date de naissance</label>
            <input id="input-naissance" type="date" name="naissance_$_date" value={form.naissance_$_date || ''} onChange={handleChange} required />
            <label htmlFor="input-adresse">Adresse</label>
            <div style={{ display: 'flex', alignItems: 'center' }}>
              <input
                id="input-adresse"
                name="adresse_$_map"
                value={form.adresse_$_map}
                onChange={handleChange}
                placeholder="Adresse"
                required
                style={{ flex: 1 }}
              />
              <button type="button" onClick={() => setShowMap(true)} style={{ marginLeft: 8 }}>
                📍
              </button>
            </div>
            {showMap && (
              <div style={{ margin: '10px 0' }}>
                <Gmap
                  // Pass initial center based on current state (which might be from datas)
                  // initialCenter={{ lat: parseFloat(latitude) || 5.36, lng: parseFloat(longitude) || -4.00 }}
                  onCoordinatesClick={handleMapClick} // Pass the callback function
                />
                <button type="button" onClick={() => setShowMap(false)}>Fermer la carte</button>
              </div>
            )}
            <label htmlFor="input-tel">N° Téléphone</label>
            <input id="input-tel" name="phone_$_tel" value={form.phone_$_tel || ''} onChange={handleChange} placeholder="Téléphone" required />
            <label htmlFor="input-email">Email</label>
            <input id="input-email" name="email_$_email" value={form.email_$_email || ''} onChange={handleChange} placeholder="Email" required />
            <label htmlFor="input-photo">Photo de l'enseignant</label>
            <input id="input-photo" type="file" ref={fileInput} accept="image/*" onChange={handleFile} required={!form.photo_$_file && !previewUrl} />
            {(previewUrl || form.photo_$_file) && <img src={previewUrl || form.photo_$_file} alt="photo" className="previewImageAddForm" />}

          </>}









          {type === 'classe' && <>
            <label htmlFor="input-annee">Année scolaire</label>
            <select id="input-annee" name="annee" value={form.annee || ''} onChange={handleChange} required>
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
            
            <label htmlFor="input-niveau">Niveau de classe</label>
            <select id="input-niveau" name="niveau" value={form.niveau || ''} onChange={handleChange} required>
              <option value="">Sélectionnez le niveau</option>
              {["CP1", "CP2", "CE1", "CE2", "CM1", "CM2"].map(n => <option key={n} value={n}>{n}</option>)}
            </select>
            
            <label htmlFor="input-alias">Alias de la classe</label>
            <input id="input-alias" name="alias" value={form.alias || ''} onChange={handleChange} placeholder="Alias (ex: 4B, A, Rouge...)" required />
            
            <label htmlFor="input-photo-classe">Photo de la classe</label>
            <input id="input-photo-classe" type="file" ref={fileInput} accept="image/*" onChange={handleFile} required={!form.photo && !previewUrl} />
            {(previewUrl || form.photo) && <img src={previewUrl || form.photo} alt="photo" className="previewImageAddForm" />}
            
            <div className="form-info-note">
              <p><strong>ℹ️ Information :</strong> Les professeurs et élèves seront assignés à cette classe lors de leur création/modification individuelle.</p>
            </div>

          </>}
          
          </form>
        </div>
        
        <footer className="modal__actions">
          <button type="submit" form="modalPersonForm" className="modal__btn modal__btn--primary">
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
              className="modal__btn modal__btn--danger"
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
          
          <button type="button" className="modal__btn modal__btn--secondary" onClick={onClose}>
            Annuler
          </button>
        </footer>
      </div>
    </div>
  );
}







function Parent({form,setForm,parents}){

  return <div className="parents-block">
    <div className="parent-card">
      <img src="/mom.webp" alt="Mère" className="parent-img" />
      <div className="parent-title">Mère</div>
      <label htmlFor="input-mere">Nom de la mère</label>
      <input id="input-mere" name="parents.mere" value={form?.parents?.mere || parents?.mere || ''} readOnly={setForm ? false : true} onChange={setForm ? e => setForm(f => ({ ...f, parents: { ...f.parents, mere: e.target.value } })) : null} placeholder="Nom de la mère" />
      <label htmlFor="input-phone">Téléphone parent</label>
      <input id="input-phone" name="parents.phone" value={form?.parents?.phone || parents?.phone || ''} readOnly={setForm ? false : true} onChange={setForm ? e => setForm(f => ({ ...f, parents: { ...f.parents, phone: e.target.value } })) : null} placeholder="Téléphone parent" />
    </div>
    <div className="parent-card">
      <img src="/pa.webp" alt="Père" className="parent-img" />
      <div className="parent-title">Père</div>
      <label htmlFor="input-pere">Nom du père</label>
      <input id="input-pere" name="parents.pere" value={form?.parents?.pere || parents?.pere || ''} readOnly={setForm ? false : true} onChange={setForm ? e => setForm(f => ({ ...f, parents: { ...f.parents, pere: e.target.value } })) : null} placeholder="Nom du père" />
    </div>
  </div>
}


// --- Bloc de gestion des commentaires professeur ---
function CommentairesBlock({ commentaires, setForm }) {
  const [newComment, setNewComment] = useState('');
  // Format attendu : [{timestamp: commentaire}, ...]
  // Tri du plus récent au plus ancien
  const items = Array.isArray(commentaires) ? commentaires : [];
  const sorted = items.slice().sort((a, b) => {
    const ka = Object.keys(a)[0];
    const kb = Object.keys(b)[0];
    return kb - ka;
  });

  // Fonction pour ajouter un commentaire
  const handleAdd = () => {
    if (!newComment.trim()) return;
    const timestamp = Date.now().toString();
    const newCommentObj = { [timestamp]: newComment.trim() };
    const updatedCommentaires = [...items, newCommentObj];
    setForm(f => ({ ...f, commentaires: updatedCommentaires }));
    setNewComment('');
  };

  // Fonction pour supprimer un commentaire
  const handleRemove = (index) => {
    const updatedCommentaires = items.filter((_, i) => i !== index);
    setForm(f => ({ ...f, commentaires: updatedCommentaires }));
  };

  // Si pas de setForm, read-only : juste affichage
  if (!setForm) {
    return (
      <div className="commentaires-block">
        <div className="commentaires-block__header">Commentaires du professeur</div>
        <div className="commentaires-block__list">
          {sorted.length === 0 && <span className="commentaires-block__empty">Aucun commentaire</span>}
          {sorted.map((obj, idx) => {
            const ts = Object.keys(obj)[0];
            const txt = obj[ts];
            return (
              <div key={ts} className="commentaires-block__item">
                <span className="commentaires-block__date">{new Date(Number(ts)).toLocaleDateString()}</span>
                <span className="commentaires-block__txt">{txt}</span>
              </div>
            );
          })}
        </div>
      </div>
    );
  }

  // Edition
  return (
    <div className="commentaires-block">
      <div className="commentaires-block__header">Commentaires du professeur</div>
      <div className="commentaires-block__list">
        {sorted.length === 0 && <span className="commentaires-block__empty">Aucun commentaire</span>}
        {sorted.map((obj, idx) => {
          const ts = Object.keys(obj)[0];
          const txt = obj[ts];
          return (
            <div className="commentaires-block__entry" key={ts}>
              <span className="commentaires-block__entry-date">{new Date(Number(ts)).toLocaleString('fr-FR')}</span>
              <span className="commentaires-block__entry-txt">{txt}</span>
              <button type="button" className="commentaires-block__remove-btn" title="Supprimer" onClick={() => handleRemove(idx)}>&times;</button>
            </div>
          );
        })}
      </div>
      <div className="commentaires-block__add-form">
        <input
          type="text"
          value={newComment}
          onChange={e => setNewComment(e.target.value)}
          placeholder="Ajouter un commentaire..."
        />
        <button type="button" onClick={handleAdd} disabled={!newComment.trim()}>Ajouter</button>
      </div>
    </div>
  );
}

// --- Bloc d'historique des écoles fréquentées ---
function SchoolHistoryBlock({ schoolHistory, onChange }) {
  // Récupérer l'année scolaire courante
  const now = new Date();
  const currentYearStart = (now.getMonth() + 1) < 7 ? now.getFullYear() - 1 : now.getFullYear();
  const currentYearStr = `${currentYearStart}-${currentYearStart + 1}`;
  // Générer les 10 années précédentes (hors année courante)
  const years = Array.from({ length: 10 }, (_, i) => {
    const start = currentYearStart - i - 1;
    return `${start}-${start + 1}`;
  });
  // Années déjà renseignées
  const usedYears = Object.keys(schoolHistory || {});
  // Années disponibles pour ajout
  const availableYears = years.filter(y => !usedYears.includes(y));
  // Formulaire d'ajout
  const [selectedYear, setSelectedYear] = useState(availableYears[0] || '');
  const [ecole, setEcole] = useState('');

  const handleAdd = () => {
    if (!selectedYear || !ecole.trim()) return;
    onChange({ ...schoolHistory, [selectedYear]: ecole.trim() });
    setEcole('');
    // Mettre à jour l'année sélectionnée après ajout
    const nextAvailable = availableYears.filter(y => y !== selectedYear)[0] || '';
    setSelectedYear(nextAvailable);
  };
  const handleRemove = (year) => {
    const newHist = { ...schoolHistory };
    delete newHist[year];
    onChange(newHist);
  };
  return (
    <div className="school-history-block">
      <div className="school-history-block__header">Historique des écoles fréquentées</div>
      <div className="school-history-block__list">
        {usedYears.length === 0 && <span className="school-history-block__empty">Aucune école enregistrée</span>}
        {usedYears.sort((a, b) => b.localeCompare(a)).map(y => (
          <div className="school-history-block__entry" key={y}>
            <span className="school-history-block__entry-year">{y}</span>
            <span className="school-history-block__entry-ecole">{schoolHistory[y]}</span>
            <button type="button" className="school-history-block__remove-btn" title="Supprimer" onClick={() => handleRemove(y)}>×</button>
          </div>
        ))}
      </div>
      {onChange && <><div className="school-history-block__add-form">
        <select value={selectedYear} onChange={e => setSelectedYear(e.target.value)}>
          {availableYears.map(y => (
            <option key={y} value={y}>{y}</option>
          ))}
        </select>
        <input
          type="text"
          value={ecole}
          onChange={e => setEcole(e.target.value)}
          placeholder="Nom de l'école"
        />
        <button type="button" onClick={handleAdd} disabled={!selectedYear || !ecole.trim()}>Ajouter</button>
      </div>
      <input type="hidden" name="school_history" value={(() => {
        const now = new Date();
        const currentYearStart = (now.getMonth() + 1) < 7 ? now.getFullYear() - 1 : now.getFullYear();
        const currentYearStr = `${currentYearStart}-${currentYearStart + 1}`;
        return JSON.stringify({
          [currentYearStr]: "Martin de Porrès de Bolobi",
          ...(schoolHistory || {})
        });
      })()} /></>}
    </div>
  );
}

// --- Bloc de gestion des frais de scolarité par année ---
function ScolarityFeesBlock({ fees, onChange, schoolYear }) {
  const [showForm, setShowForm] = useState(false);
  const [type, setType] = useState('argent');
  const [val, setVal] = useState('');
  const [date, setDate] = useState(() => {
    const now = new Date();
    return now.toISOString().slice(0, 10);
  });
  // Liste des dépôts : tableau [{timestamp, argent, riz}]
  const entries = Object.entries(fees || {}).map(([ts, v]) => ({ ts, ...v }));
  const totalArgent = entries.reduce((sum, e) => sum + (e.argent ? Number(e.argent) : 0), 0);
  const totalRiz = entries.reduce((sum, e) => sum + (e.riz ? Number(e.riz) : 0), 0);
  const complete = totalArgent >= 20000 && totalRiz >= 50;

  const handleAdd = () => {
    if (!val || isNaN(Number(val)) || Number(val) <= 0) return;
    // Utiliser la date choisie, à minuit locale
    const d = new Date(date);
    d.setHours(0, 0, 0, 0);
    const ts = d.getTime();
    const newEntry = type === 'argent'
      ? { argent: Number(val) }
      : { riz: Number(val) };
    onChange({ ...fees, [ts]: newEntry });
    setShowForm(false); setType('argent'); setVal(''); setDate(new Date().toISOString().slice(0, 10));
  };
  const handleRemove = (ts) => {
    const newFees = { ...fees };
    delete newFees[ts];
    onChange(newFees);
  };
  return (
    <div className={`scolarity-fees-block ${complete ? 'scolarity-fees-block--complete' : 'scolarity-fees-block--incomplete'}`}>
      <div className="scolarity-fees-block__header">
        Frais de scolarité – {schoolYear}
      </div>
      <div className="scolarity-fees-block__totals">
        <span>Argent : <b>{totalArgent} F</b> / 20000 F</span>
        <span>Riz : <b>{totalRiz} kg</b> / 50 kg</span>
      </div>
      <div className="scolarity-fees-block__list">
        {entries.length === 0 && <span className="scolarity-fees-block__empty">Aucun dépôt enregistré</span>}
        {entries.sort((a, b) => a.ts - b.ts).map(e => (
          <div className="scolarity-fees-block__entry" key={e.ts}>
            <span className="scolarity-fees-block__entry-date">{new Date(Number(e.ts)).toLocaleDateString()}</span>
            {e.argent && <span className="scolarity-fees-block__entry-argent">{e.argent} F</span>}
            {e.riz && <span className="scolarity-fees-block__entry-riz">{e.riz} kg</span>}
            <button type="button" className="scolarity-fees-block__remove-btn" title="Supprimer" onClick={() => handleRemove(e.ts)}>×</button>
          </div>
        ))}
      </div>
      {showForm ? (
        <div className="scolarity-fees-block__add-form">
          <select
            className="scolarity-fees-block__type-select"
            value={type}
            onChange={e => setType(e.target.value)}
          >
            <option value="argent">Argent (F)</option>
            <option value="riz">Riz (kg)</option>
          </select>
          <input
            type="number"
            min="1"
            value={val}
            onChange={e => setVal(e.target.value)}
            placeholder={type === 'argent' ? 'Montant en F' : 'Poids en kg'}
            autoFocus
          />
          <input
            type="date"
            value={date}
            onChange={e => setDate(e.target.value)}
            className="scolarity-fees-block__add-date"
          />
          <button type="button" onClick={handleAdd}>Valider</button>
          <button type="button" onClick={() => { setShowForm(false); setVal(''); setDate(new Date().toISOString().slice(0, 10)); }} className="scolarity-fees-block__add-cancel">Annuler</button>
        </div>
      ) : (
        onChange && <button type="button" className="scolarity-fees-block__add-btn" onClick={() => setShowForm(true)}>Ajouter un dépôt</button>
      )}
      <input type="hidden" name="scolarity_fees_$_checkbox" value={JSON.stringify(fees)} />
    </div>
  );
}

// --- Bloc de gestion des compositions par trimestre ---
function CompositionsBlock({ compositions, schoolYear, onChange, onChangeYear }) {
  // Format attendu : {"2025-2026": [[{"Mathématiques": 15}, {"Français": 12}], [{"Sciences": 14}], [{"Anglais": 18}]]}
  const [adding, setAdding] = useState(null); // trimestre en cours d'ajout
  const [newNote, setNewNote] = useState('');
  const [selectedMatiere, setSelectedMatiere] = useState('Mathématiques');
  const [selectedDenominateur, setSelectedDenominateur] = useState('20');
  const trimestres = ["1er trimestre", "2e trimestre", "3e trimestre"];
  // Génère la liste des années disponibles (de N-10 à N+10, + toutes années trouvées dans les données)
  const now = new Date();
  const currentYearStart = (now.getMonth() + 1) < 7 ? now.getFullYear() - 1 : now.getFullYear();
  const yearRange = Array.from({ length: 21 }, (_, i) => {
    const start = currentYearStart - 10 + i;
    return `${start}-${start + 1}`;
  });
  const yearsSet = new Set([...yearRange, ...Object.keys(compositions || {})]);
  const years = Array.from(yearsSet).sort((a, b) => b.localeCompare(a));
  // On récupère le tableau pour l'année courante
  const compoArr = compositions[schoolYear] || [[], [], []];

  // Fonction pour calculer la moyenne d'un trimestre
  const calculateTrimestreMoyenne = (trimestreNotes) => {
    if (!Array.isArray(trimestreNotes) || trimestreNotes.length === 0) return null;
    
    let totalPoints = 0;
    let totalDenominateur = 0;
    
    trimestreNotes.forEach(note => {
      let noteValue, denominateur;
      
      if (typeof note === 'number') {
        noteValue = note;
        denominateur = 20;
      } else if (typeof note === 'object' && note !== null) {
        const [, value] = Object.entries(note)[0] || [null, 0];
        if (typeof value === 'object' && value.note !== undefined) {
          noteValue = value.note;
          denominateur = value.sur || 20;
        } else {
          noteValue = value;
          denominateur = 20;
        }
      } else {
        return; // Skip invalid notes
      }
      
      // Convertir en note sur 20 pour uniformiser
      const noteSur20 = (noteValue / denominateur) * 20;
      totalPoints += noteSur20;
      totalDenominateur += 20;
    });
    
    return totalDenominateur > 0 ? (totalPoints / trimestreNotes.length) : null;
  };

  // Calculer les moyennes trimestrielles
  const moyennesTrimestrielles = compoArr.map(trimestreNotes => calculateTrimestreMoyenne(trimestreNotes));

  // Calculer la moyenne annuelle
  const calculateMoyenneAnnuelle = () => {
    const moyennesValides = moyennesTrimestrielles.filter(moyenne => moyenne !== null);
    if (moyennesValides.length === 0) return null;
    return moyennesValides.reduce((sum, moyenne) => sum + moyenne, 0) / moyennesValides.length;
  };

  const moyenneAnnuelle = calculateMoyenneAnnuelle();

  const handleAdd = idx => {
    if (!onChange || newNote === '' || isNaN(Number(newNote))) return;
    const noteNum = Number(newNote);
    const denominateur = Number(selectedDenominateur);
    const noteObj = { [selectedMatiere]: { note: noteNum, sur: denominateur } };
    const newArr = compoArr.map((arr, i) => i === idx ? [...arr, noteObj] : arr);
    onChange({ ...compositions, [schoolYear]: newArr });
    setAdding(null); setNewNote(''); setSelectedMatiere('Mathématiques'); setSelectedDenominateur('20');
  };
  const handleRemove = (idx, nidx) => {
    if (!onChange) return;
    const newArr = compoArr.map((arr, i) => i === idx ? arr.filter((_, j) => j !== nidx) : arr);
    onChange({ ...compositions, [schoolYear]: newArr });
  };

  return (
    <div className="compositions-block">
      <div className="compositions-block__header">Compositions</div>
      <select
        className="compositions-block__year-select"
        value={schoolYear}
        onChange={e => onChangeYear(e.target.value)}
      >
        {years.map(y => {
          const start = parseInt(y.split('-')[0], 10);
          let color = '';
          if (start === currentYearStart) color = 'green';
          else if (start < currentYearStart) color = 'red';
          else color = 'blue';
          return <option key={y} value={y} className={"option_" + color}>{y}</option>;
        })}
      </select>
      
      {/* Moyenne annuelle */}
      <div className="compositions-block__moyenne-annuelle">
        <strong>Moyenne annuelle : </strong>
        {moyenneAnnuelle !== null ? `${moyenneAnnuelle.toFixed(2)}/20` : 'Non calculée'}
      </div>

      {trimestres.map((tri, idx) => (
        <div key={tri} className="compositions-block__trimestre">
          <div className="compositions-block__trimestre-header">
            <span className="compositions-block__trimestre-title">{tri}</span>
            <span className="compositions-block__trimestre-score">
              Moyenne trimestrielle: {moyennesTrimestrielles[idx] !== null ? `${moyennesTrimestrielles[idx].toFixed(2)}/20` : 'Non calculée'}
            </span>
            {onChange && (
              <button
                type="button"
                className="compositions-block__add-btn"
                onClick={() => { setAdding(idx); setNewNote(''); }}
              >Ajouter</button>
            )}
          </div>
          <div className="compositions-block__notes">
            {Array.isArray(compoArr[idx]) && compoArr[idx].length > 0 ? (
              compoArr[idx].map((note, nidx) => {
                // Support ancien format (nombre), format intermédiaire (objet simple) et nouveau format (objet avec note/sur)
                let matiere, noteValue, denominateur;
                
                if (typeof note === 'number') {
                  // Ancien format : 15
                  matiere = "Autre matière";
                  noteValue = note;
                  denominateur = 20;
                } else if (typeof note === 'object' && note !== null) {
                  const [matiereKey, value] = Object.entries(note)[0] || ['Autre matière', 0];
                  matiere = matiereKey;
                  
                  if (typeof value === 'object' && value.note !== undefined) {
                    // Nouveau format : {"Mathématiques": {note: 15, sur: 20}}
                    noteValue = value.note;
                    denominateur = value.sur || 20;
                  } else {
                    // Format intermédiaire : {"Mathématiques": 15}
                    noteValue = value;
                    denominateur = 20;
                  }
                } else {
                  matiere = "Autre matière";
                  noteValue = 0;
                  denominateur = 20;
                }
                
                return (
                  <div key={nidx} className="compositions-block__note">
                    <span className="compositions-block__note-matiere">{matiere}:</span>
                    <span className="compositions-block__note-value">{noteValue}/{denominateur}</span>
                    {onChange && (
                      <button
                        type="button"
                        title="Supprimer"
                        onClick={() => handleRemove(idx, nidx)}
                      >×</button>
                    )}
                  </div>
                );
              })
            ) : (
              <span className="compositions-block__no-compo">Aucune composition</span>
            )}
            {adding === idx && (
              <span className="compositions-block__add-form">
                <select
                  className="compositions-block__matiere-select"
                  value={selectedMatiere}
                  onChange={e => setSelectedMatiere(e.target.value)}
                >
                  {MATIERES_SCOLAIRES.map(matiere => (
                    <option key={matiere} value={matiere}>{matiere}</option>
                  ))}
                </select>
                <input
                  type="number"
                  min="0"
                  max={selectedDenominateur}
                  value={newNote}
                  onChange={e => setNewNote(e.target.value)}
                  placeholder="Note"
                  autoFocus
                />
                <span className="compositions-block__separator">/</span>
                <select
                  className="compositions-block__denominateur-select"
                  value={selectedDenominateur}
                  onChange={e => setSelectedDenominateur(e.target.value)}
                >
                  <option value="10">10</option>
                  <option value="20">20</option>
                  <option value="30">30</option>
                  <option value="40">40</option>
                  <option value="50">50</option>
                  <option value="100">100</option>
                </select>
                <button
                  type="button"
                  className="compositions-block__add-btn"
                  onClick={() => handleAdd(idx)}
                >Valider</button>
                <button
                  type="button"
                  className="compositions-block__add-btn compositions-block__add-btn--cancel"
                  onClick={() => { setAdding(null); setNewNote(''); }}
                >Annuler</button>
              </span>
            )}
          </div>
        </div>
      ))}
      {/* Champ caché pour la soumission */}
      <input type="hidden" name="compositions" value={JSON.stringify({ [schoolYear]: compoArr })} />
    </div>
  );
}

// Bloc gestion des absences (édition ou read-only)
function AbsencesBlock({ absences, setForm }) {
  const [showAbsencePicker, setShowAbsencePicker] = useState(false);
  const [newAbsenceDate, setNewAbsenceDate] = useState('');
  const items = Array.isArray(absences) ? absences : [];
  const grouped = Object.entries(items.reduce((acc, ts) => {
    const d = new Date(Number(ts));
    const key = `${d.getFullYear()}-${(d.getMonth() + 1).toString().padStart(2, '0')}`;
    if (!acc[key]) acc[key] = [];
    acc[key].push(ts);
    return acc;
  }, {})).sort((a, b) => b[0].localeCompare(a[0]));

  // Read-only
  if (!setForm) {
    return (
      <div className="absences-block">
        <div className="absences-header">
          <span>Absences : <b>{items.length}</b></span>
        </div>
        {items.length > 0 && (
          <div className="absences-list">
            {grouped.map(([month, dates]) => (
              <div key={month} className="absence-month">
                <div className="month-title">{new Date(dates[0] * 1).toLocaleString('fr-FR', { month: 'long', year: 'numeric' })}</div>
                <div className="month-dates">
                  {dates.sort((a, b) => a - b).map(ts => (
                    <div className="absence-date" key={ts}>
                      <span>{new Date(Number(ts)).toLocaleDateString('fr-FR')}</span>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
        <input type="hidden" name="absences" value={items.join(',')} />
      </div>
    );
  }

  // Edition
  return (
    <div className="absences-block">
      <input type="hidden" name="absences" value={items.join(',')} />
      <div className="absences-header">
        <span>Absences : <b>{items.length}</b></span>
        <button type="button" className="add-absence-btn" onClick={() => setShowAbsencePicker(true)}>Ajouter</button>
      </div>
      {items.length > 0 && (
        <div className="absences-list">
          {grouped.map(([month, dates]) => (
            <div key={month} className="absence-month">
              <div className="month-title">{new Date(dates[0] * 1).toLocaleString('fr-FR', { month: 'long', year: 'numeric' })}</div>
              <div className="month-dates">
                {dates.sort((a, b) => a - b).map(ts => (
                  <div className="absence-date" key={ts} style={{ position: 'relative', display: 'inline-block', margin: '0 6px 6px 0' }}>
                    <span>{new Date(Number(ts)).toLocaleDateString('fr-FR')}</span>
                    <button type="button" className="remove-absence-btn" title="Supprimer" onClick={() => {
                      if (window.confirm('Supprimer cette absence ?')) setForm(f => ({ ...f, absences: f.absences.filter(x => x !== ts) }));
                    }} style={{ position: 'absolute', top: 0, right: 0, background: 'none', border: 'none', color: '#b00', fontWeight: 'bold', cursor: 'pointer', fontSize: '1.1em', lineHeight: '1em' }}>&times;</button>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
      {showAbsencePicker && (
        <div className="absence-picker-modal">
          <input type="date" onChange={e => setNewAbsenceDate(e.target.value)} />
          <button type="button" onClick={() => {
            if (newAbsenceDate) {
              const ts = new Date(newAbsenceDate).setHours(0, 0, 0, 0);
              const absencesArr = Array.isArray(items) ? items : [];
              if (!absencesArr.includes(ts)) setForm(f => ({ ...f, absences: [...absencesArr, ts] }));
              setShowAbsencePicker(false);
              setNewAbsenceDate('');
            }
          }}>Valider</button>
          <button type="button" onClick={() => setShowAbsencePicker(false)} style={{ marginLeft: 8 }}>Annuler</button>
        </div>
      )}
    </div>
  );
}

// Bloc gestion des bonus (édition ou read-only)
function BonusBlock({ bonus, setForm }) {
  const [showBonusForm, setShowBonusForm] = useState(false);
  const [bonusDate, setBonusDate] = useState('');
  const [bonusLabel, setBonusLabel] = useState('');
  const items = bonus && typeof bonus === 'object' ? Object.entries(bonus) : [];

  if (!setForm) {
    return (
      <div className="bonus-block">
        <div className="bonus-header">
          <span>Bonus : <b>{items.length}</b></span>
        </div>
        <div className="bonus-list">
          {items.map(([label, value]) => (
            <div key={label} className="bonus-item">
              <span>{label} : {value} F</span>
            </div>
          ))}
        </div>
        <input type="hidden" name="bonus" value={JSON.stringify(bonus||{})} />
      </div>
    );
  }

  return (
    <div className="bonus-block">
      <input type="hidden" name="bonus" value={JSON.stringify(bonus||{})} />
      <div className="bonus-header">
        <span>Bonus : <b>{items.length}</b></span>
        <button type="button" className="add-bonus-btn" onClick={() => setShowBonusForm(true)}>Ajouter</button>
      </div>
      {showBonusForm && (
        <div className="bonus-picker-modal">
          <input type="date" value={bonusDate} onChange={e => setBonusDate(e.target.value)} />
          <input type="text" placeholder="Raison du bonus" value={bonusLabel} onChange={e => setBonusLabel(e.target.value)} />
          <button type="button" onClick={() => {
            if (bonusDate && bonusLabel) {
              const ts = new Date(bonusDate).setHours(0,0,0,0);
              setForm(f => ({ ...f, bonus: { ...(f.bonus||{}), [ts]: bonusLabel } }));
              setShowBonusForm(false);
              setBonusDate('');
              setBonusLabel('');
            }
          }}>Valider</button>
          <button type="button" onClick={() => setShowBonusForm(false)} style={{marginLeft:8}}>Annuler</button>
        </div>
      )}
      <div className="bonus-list">
        {/* Groupement par mois comme avant */}
        {Object.entries(items.reduce((acc, [ts, txt]) => {
          const d = new Date(Number(ts));
          const key = `${d.getFullYear()}-${(d.getMonth() + 1).toString().padStart(2, '0')}`;
          if (!acc[key]) acc[key] = [];
          acc[key].push([ts, txt]);
          return acc;
        }, {})).sort((a, b) => b[0].localeCompare(a[0])).map(([month, entries]) => (
          <div key={month} className="bonus-month">
            <div className="month-title">{new Date(entries[0][0] * 1).toLocaleString('fr-FR', { month: 'long', year: 'numeric' })}</div>
            <div className="month-bonus">
              {entries.sort((a, b) => a[0] - b[0]).map(([ts, txt]) => (
                <div className="bonus-entry" key={ts} style={{ position: 'relative', display: 'inline-block', margin: '0 6px 6px 0' }}>
                  <span>{new Date(Number(ts)).toLocaleDateString('fr-FR')}</span>
                  <span className="bonus-txt">{txt}</span>
                  <button type="button" className="remove-bonus-btn" title="Supprimer" onClick={() => {
                    if (window.confirm('Supprimer ce bonus ?')) setForm(f => { const o = { ...f.bonus }; delete o[ts]; return { ...f, bonus: o }; });
                  }} style={{ position: 'absolute', top: 0, right: 0, background: 'none', border: 'none', color: '#b00', fontWeight: 'bold', cursor: 'pointer', fontSize: '1.1em', lineHeight: '1em' }}>&times;</button>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// Bloc gestion des manuscrits (édition ou read-only)
function ManusBlock({ manus, setForm }) {
  const [showManusForm, setShowManusForm] = useState(false);
  const [manusDate, setManusDate] = useState('');
  const [manusLabel, setManusLabel] = useState('');
  const items = manus && typeof manus === 'object' ? Object.entries(manus) : [];

  if (!setForm) {
    return (
      <div className="manus-block">
        <div className="manus-header">
          <span>Malus : <b>{items.length}</b></span>
        </div>
        <div className="manus-list">
          {items.map(([label, value]) => (
            <div key={label} className="manus-item">
              <span>{label} : {value}</span>
            </div>
          ))}
        </div>
        <input type="hidden" name="manus" value={JSON.stringify(manus||{})} />
      </div>
    );
  }

  return (
    <div className="manus-block">
      <input type="hidden" name="manus" value={JSON.stringify(manus||{})} />
      <div className="manus-header">
        <span>Malus : <b>{items.length}</b></span>
        <button type="button" className="add-manus-btn" onClick={() => setShowManusForm(true)}>Ajouter</button>
      </div>
      {showManusForm && (
        <div className="manus-picker-modal">
          <input type="date" value={manusDate} onChange={e => setManusDate(e.target.value)} />
          <input type="text" placeholder="Raison du malus" value={manusLabel} onChange={e => setManusLabel(e.target.value)} />
          <button type="button" onClick={() => {
            if (manusDate && manusLabel) {
              const ts = new Date(manusDate).setHours(0,0,0,0);
              setForm(f => ({ ...f, manus: { ...(f.manus||{}), [ts]: manusLabel } }));
              setShowManusForm(false);
              setManusDate('');
              setManusLabel('');
            }
          }}>Valider</button>
          <button type="button" onClick={() => setShowManusForm(false)} style={{marginLeft:8}}>Annuler</button>
        </div>
      )}
      <div className="manus-list">
        {/* Groupement par mois comme avant */}
        {Object.entries(items.reduce((acc, [ts, txt]) => {
          const d = new Date(Number(ts));
          const key = `${d.getFullYear()}-${(d.getMonth() + 1).toString().padStart(2, '0')}`;
          if (!acc[key]) acc[key] = [];
          acc[key].push([ts, txt]);
          return acc;
        }, {})).sort((a, b) => b[0].localeCompare(a[0])).map(([month, entries]) => (
          <div key={month} className="manus-month">
            <div className="month-title">{new Date(entries[0][0] * 1).toLocaleString('fr-FR', { month: 'long', year: 'numeric' })}</div>
            <div className="month-manus">
              {entries.sort((a, b) => a[0] - b[0]).map(([ts, txt]) => (
                <div className="manus-entry" key={ts} style={{ position: 'relative', display: 'inline-block', margin: '0 6px 6px 0' }}>
                  <span>{new Date(Number(ts)).toLocaleDateString('fr-FR')}</span>
                  <span className="manus-txt">{txt}</span>
                  <button type="button" className="remove-manus-btn" title="Supprimer" onClick={() => {
                    if (window.confirm('Supprimer ce malus ?')) setForm(f => { const o = { ...f.manus }; delete o[ts]; return { ...f, manus: o }; });
                  }} style={{ position: 'absolute', top: 0, right: 0, background: 'none', border: 'none', color: '#b00', fontWeight: 'bold', cursor: 'pointer', fontSize: '1.1em', lineHeight: '1em' }}>&times;</button>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
// --- Composant pour ajouter une note ---
function AddNoteForm({ notes = {}, onAdd, onRemove }) {
  const [showForm, setShowForm] = useState(false);
  const [date, setDate] = useState('');
  const [matiere, setMatiere] = useState('');
  const [note, setNote] = useState('');
  const [err, setErr] = useState('');

  const handleValidate = () => {
    if (!date || !matiere || !note) {
      setErr('Tous les champs sont requis');
      return;
    }
    const timestamp = new Date(date).getTime();
    if (!timestamp || isNaN(timestamp)) {
      setErr('Date invalide');
      return;
    }
    if (onAdd) onAdd({ [timestamp]: [matiere, note] });
    setDate(''); setMatiere(''); setNote(''); setErr('');
    setShowForm(false);
  };

  const handleCancel = () => {
    setDate(''); setMatiere(''); setNote(''); setErr('');
    setShowForm(false);
  };

  return (
    <div className="notes-container" style={{ border: '1px solid #ccc', borderRadius: 6, padding: 8, marginBottom: 16 }}>
      {/* Affichage des notes triées par date croissante */}
      {Object.entries(notes)
        .sort((a, b) => Number(a[0]) - Number(b[0]))
        .map(([timestamp, [matiere, note]], idx) => (
          <div key={timestamp} style={{ display: 'flex', alignItems: 'center', background: '#f9f9f9', borderRadius: 4, marginBottom: 4, padding: 4, position: 'relative' }}>
            <span style={{ minWidth: 100, fontWeight: 500 }}>{new Date(Number(timestamp)).toLocaleDateString()}</span>
            <span style={{ margin: '0 12px' }}>{matiere}</span>
            <span style={{ margin: '0 12px', fontWeight: 600 }}>{note}</span>
            {onRemove && (
              <button type="button" onClick={() => onRemove(timestamp)} style={{ position: 'absolute', right: 6, top: 4, border: 'none', background: 'transparent', color: '#d00', fontWeight: 'bold', fontSize: 18, cursor: 'pointer' }} title="Supprimer">×</button>
            )}
          </div>
        ))}
      {Object.keys(notes).length === 0 && (
        <div className="no-notes">Aucune note pour l'instant</div>
      )}
      {/* Formulaire d'ajout de note (si édition) */}
      {onAdd && (
        !showForm ? (
          <button type="button" className="add-note-btn" onClick={() => setShowForm(true)}>Ajouter une note</button>
        ) : (
          <div style={{marginTop:8}}>
            <input type="date" className="add-note-date" value={date} onChange={e => setDate(e.target.value)} />
            <select className="add-note-matiere" value={matiere} onChange={e => setMatiere(e.target.value)}>
              <option value="">Choisir une matière</option>
              <option value="Mathématiques">Mathématiques</option>
              <option value="Français">Français</option>
              <option value="Histoire-Géo">Histoire-Géo</option>
              <option value="Anglais">Anglais</option>
              <option value="SVT">SVT</option>
              <option value="Physique-Chimie">Physique-Chimie</option>
              <option value="EPS">EPS</option>
              <option value="Arts">Arts</option>
              <option value="Technologie">Technologie</option>
              <option value="Autre">Autre</option>
            </select>
            <input type="number" min="0" max="20" className="add-note-note" placeholder="Note" value={note} onChange={e => setNote(e.target.value)} />
            <button type="button" className="add-note-btn" onClick={handleValidate}>Valider</button>
            <button type="button" className="add-note-btn" style={{ background: '#ccc', color: '#222' }} onClick={handleCancel}>Annuler</button>
            {err && <span className="add-note-error">{err}</span>}
          </div>
        )
      )}
      {/* Champ caché pour la soumission si édition */}
      {onAdd && (
        <input type="hidden" name="notes" value={notes ? JSON.stringify(notes) : ''} />
      )}
    </div>
  );
}

function IsInterneBlock({ form, setForm }) {

  return (
    <div className="isinterne-card">
      <img src="/dortoir.png" alt="Dortoir" className="isinterne-img" />
      <label className="isinterne-label">
        <input type="checkbox" readOnly={!setForm ? true : false } name="isInterne" checked={!!form.isInterne} 
          onChange={setForm ? e => setForm(f => ({ ...f, isInterne: e.target.checked })) : undefined} 
        />
        <span>Interne</span>
      </label>
    </div>
  );
}

function DocumentsBlock({ form, setForm, selectedDocuments = [], setSelectedDocuments }) {
  // Edition : upload et renommage
  const isEdit = !!setForm;
  return (
    <div className="documents-block">
      <label>Documents</label>
      {isEdit && (
        <input
          type="file"
          accept=".pdf,image/jpeg,image/jpg,image/png,image/webp"
          multiple
          onChange={e => {
            const files = Array.from(e.target.files);
            if (!files.length) return;
            setSelectedDocuments(prev => ([
              ...prev,
              ...files.map(file => ({ file, customName: file.name }))
            ]));
            e.target.value = '';
          }}
        />
      )}
      {/* Affichage des documents déjà enregistrés (form.documents) */}
      {Array.isArray(form.documents) && form.documents.length > 0 && (
        <div className="documents-list">
          {form.documents.map((doc, i) => (<Fragment key={doc.name + '-' + i}>
            <div className="document-item"
              style={{ display: 'flex', alignItems: 'center', gap: 8 }}
              onClick={() => {
                const type = doc.type?.startsWith("image/") && doc.type !== "application/pdf" ? "img" : "pdf"
                const img = document.querySelector('.documents-list img.docs_preview_img');
                const frame = document.querySelector('.documents-list iframe.docs_preview_pdf');
                if(type=="img")img.src = doc;
                if(type=="pdf")frame.src = doc;
              }}>
                {doc.type}
              {doc.type === "application/pdf"
                ? <span className="doc-icon" title="PDF">📄</span>
                : <span className="doc-icon" title="Image">🖼️</span>}
              <span>{doc.name}</span>
            </div>
            <a href={doc} target="_blank">
              <span className="doc-icon" title="Télécharger"> Télécharger</span>
              <img className="docs_preview_img" src="" alt="" style={{maxWidth:'100%', maxHeight:'70vh', margin:'16px auto'}}/>
              <iframe className="docs_preview_pdf" src="" alt="" style={{maxWidth:'100%', maxHeight:'70vh', margin:'16px auto'}}/>
            </a>
          </Fragment>))}
        </div>
      )}
      {/* Affichage des documents sélectionnés pour upload (édition) */}
      {isEdit && Array.isArray(selectedDocuments) && selectedDocuments.length > 0 && (
        <div className="documents-list">
          {selectedDocuments.map((doc, i) => (
            <div className="document-item" key={doc.file.name + '-' + i}
              style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              {doc.file.type === "application/pdf"
                ? <span className="doc-icon" title="PDF">📄</span>
                : <span className="doc-icon" title="Image">🖼️</span>}
              <span>{doc.file.name}</span>
              <input
                type="text"
                value={doc.customName}
                onChange={e => {
                  const newDocs = [...selectedDocuments];
                  newDocs[i].customName = e.target.value;
                  setSelectedDocuments(newDocs);
                }}
                placeholder="Nom final du fichier"
                style={{ marginLeft: 8, flex: 1 }}
              />
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export {SchoolHistoryBlock, ScolarityFeesBlock, IsInterneBlock, AddNoteForm, CompositionsBlock, CommentairesBlock, Parent, AbsencesBlock, BonusBlock, ManusBlock, DocumentsBlock } 
