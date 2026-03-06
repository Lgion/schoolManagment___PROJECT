"use client"

import { useContext, useEffect, useState, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from 'next/link';
import { AiAdminContext } from '../../../stores/ai_adminContext';
import { useUserRole } from '../../../stores/useUserRole';
import { getClasseImagePath, getEleveImagePath, getEnseignantImagePath } from '../../../utils/imageUtils';
import ScheduleViewer from '../../components/ScheduleViewer';
import EntityModal from '../../components/EntityModal';
import DetailPortal from "../../components/DetailPortal";
import PermissionGate from "../../components/PermissionGate";
import NotesBlock from '../../components/NotesBlock';
import NotesEntryBlock from '../../components/NotesEntryBlock';
import AddStudentsModal from '../../components/AddStudentsModal';
import TeacherReportModule from '../../components/TeacherReportModule';
import ImageScanner from '../../components/ui/ImageScanner';
import ReviewModal from '../../components/ui/ReviewModal';

export default function ClasseDetailPage() {
  const { id } = useParams();
  const router = useRouter();
  const ctx = useContext(AiAdminContext);
  const { userRole, userData, isProf } = useUserRole();
  const [isReduced, setIsReduced] = useState(false);
  const [showAddStudentsModal, setShowAddStudentsModal] = useState(false);
  const [scanResult, setScanResult] = useState(null);
  const reviewRef = useRef(null);
  const editBtnRef = useRef(null);
  const [dynamicSubjects, setDynamicSubjects] = useState([]);
  const [highlightEdit, setHighlightEdit] = useState(false);

  useEffect(() => {
    ctx.fetchClasses && ctx.fetchClasses();
    ctx.fetchEleves && ctx.fetchEleves();
    ctx.fetchEnseignants && ctx.fetchEnseignants();

    // Charger les matières pour l'affichage des noms dans les coefficients
    const loadSubjects = async () => {
      const { getLSItem, setLSItem } = await import('../../../utils/localStorageManager');
      const parsed = getLSItem('app_subjects');
      if (parsed) {
        setDynamicSubjects(parsed.map(s => typeof s === 'string' ? { id: s, nom: s } : s));
      } else {
        const res = await fetch('/api/subjects');
        const data = await res.json();
        if (data.success) {
          const subjects = data.data.map(s => ({ id: s._id, nom: s.nom }));
          setDynamicSubjects(subjects);
          setLSItem('app_subjects', subjects);
        }
      }
    };
    loadSubjects();
  }, [ctx.fetchClasses, ctx.fetchEleves, ctx.fetchEnseignants]);

  if (!ctx) return <div style={{ color: 'red' }}>Erreur : contexte non trouvé</div>;
  const { setSelected, showModal, setShowModal, setEditType } = ctx;
  const classe = (ctx.classes || []).find(c => String(c._id) === String(id));
  if (!classe) return <div style={{ color: 'red' }}>Classe introuvable</div>;

  // Déterminer s'il y a des coefficients définis
  const hasCoefficients = classe.coefficients && Object.keys(classe.coefficients).length > 0;

  const scrollToEdit = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setHighlightEdit(true);
    editBtnRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
    setTimeout(() => setHighlightEdit(false), 3000);
  };

  // Déterminer si c'est une classe de l'année actuelle ou historique
  const currentYear = new Date().getFullYear();
  const currentSchoolYear = (new Date().getMonth() + 1) < 7
    ? `${currentYear - 1}-${currentYear}`
    : `${currentYear}-${currentYear + 1}`;

  const isCurrentYear = classe.annee === currentSchoolYear;

  const eleves = isCurrentYear
    ? (ctx.eleves || []).filter(e => e.current_classe === classe._id)
    : classe.eleves || [];

  const enseignants = isCurrentYear
    ? (ctx.enseignants || []).filter(e =>
      Array.isArray(e.current_classes) && e.current_classes.includes(classe._id)
    )
    : classe.professeur || [];

  const onEdit = e => { setSelected(e); setEditType("classe"); setShowModal(true); }

  return !classe ? <div>....loading.....</div>
    :
    <DetailPortal
      isOpen={true}
      onClose={() => router.back()}
      title={`Classe ${classe.niveau} ${classe.alias} (${classe.annee})`}
      icon={"🏦"}
      reduced={[isReduced, setIsReduced]}
    ><main className={`person-detail ${isReduced ? '--reduce' : ''}`}>
        <PermissionGate roles={['admin', 'prof']}>
          {onEdit && !showModal && (
            <button
              ref={editBtnRef}
              type="button"
              className={`person-detail__editbtn ${highlightEdit ? '--highlight' : ''}`}
              onClick={e => {
                e.stopPropagation();
                e.preventDefault();
                onEdit(classe);
              }}
              tabIndex={0}
            >Éditer</button>
          )}
          {showModal && <button
            className="person-detail__editbtn"
            onClick={e => { e.stopPropagation(); e.preventDefault(); setShowModal(false); }}
          >Fermer Édition</button>}
        </PermissionGate>
        {/* En-tête de la classe */}
        <div className="person-detail__header">
          <div className="person-detail__header-content">
            <div className="person-detail__header-info">
              <h1 className="person-detail__title">
                {classe.niveau} {classe.alias}
              </h1>
              <p className="person-detail__subtitle-text">
                Année scolaire {classe.annee}
              </p>
            </div>
            <div className="person-detail__header-image">
              <img
                className="person-detail__photo"
                src={getClasseImagePath(classe)}
                alt={`${classe.niveau} ${classe.alias} - ${classe.annee}`}
                onError={(e) => {
                  e.target.src = '/school/classe.webp';
                }}
                onClick={e => {
                  e.preventDefault();
                  setIsReduced(!isReduced);
                }}
              />
            </div>
          </div>
        </div>

        {/* Statistiques rapides */}
        <div className="person-detail__stats">
          <div className="person-detail__stat-card">
            <div className="person-detail__stat-icon">👨‍🎓</div>
            <div className="person-detail__stat-content">
              <span className="person-detail__stat-number">{eleves.length}</span>
              <span className="person-detail__stat-label">Élèves</span>
            </div>
          </div>
          <div className="person-detail__stat-card">
            <div className="person-detail__stat-icon">👨‍🏫</div>
            <div className="person-detail__stat-content">
              <span className="person-detail__stat-number">{enseignants.length}</span>
              <span className="person-detail__stat-label">Enseignants</span>
            </div>
          </div>
          <div className="person-detail__stat-card">
            <div className="person-detail__stat-icon">📚</div>
            <div className="person-detail__stat-content">
              <span className="person-detail__stat-number">{classe.niveau}</span>
              <span className="person-detail__stat-label">Niveau</span>
            </div>
          </div>
        </div>

        {/* Liste des élèves */}
        <div className="person-detail__block person-detail__block--students">
          <h2 className="person-detail__subtitle">
            <span className="person-detail__subtitle-icon">👨‍🎓</span>
            Liste des élèves
            <PermissionGate roles={['admin', 'prof']}>
              <button
                className="person-detail__addBtn"
                onClick={() => setShowAddStudentsModal(true)}
                title="Ajouter des élèves à cette classe"
              >
                + Ajouter
              </button>
            </PermissionGate>
          </h2>
          {eleves.length === 0 ? (
            <div className="person-detail__empty">
              <div className="person-detail__empty-icon">📚</div>
              <p className="person-detail__empty-text">Aucun élève dans cette classe</p>
            </div>
          ) : (
            <div className="person-detail__grid">
              {eleves.map(eleve => {
                const student = ctx.eleves.find(el => el._id === (eleve._id || eleve));

                // Si l'élève n'est pas trouvé dans le contexte, on ne l'affiche pas pour éviter le crash
                if (!student) return null;

                const imagePath = getEleveImagePath(student);

                return (
                  <Link key={"eleves_" + student._id} href={`/eleves/${student._id}`} className="person-detail__card">
                    <div className="person-detail__card-avatar">
                      <img
                        src={imagePath}
                        alt={`${student.nom} ${student.prenoms}`}
                        data-ok={imagePath}
                        onError={(e) => {
                          e.target.src = '/school/student.webp';
                        }}
                      />
                    </div>
                    <div className="person-detail__card-content">
                      <h3 className="person-detail__card-name">{student.nom} {student.prenoms}</h3>
                      <p className="person-detail__card-role">Élève</p>
                    </div>
                  </Link>
                )
              }).filter(Boolean)}
            </div>
          )}

        </div>
        {/* Liste des enseignants */}
        <div className="person-detail__block person-detail__block--teachers">
          <h2 className="person-detail__subtitle">
            <span className="person-detail__subtitle-icon">👨‍🏫</span>
            Enseignants attitrés
          </h2>
          {enseignants.length === 0 ? (
            <div className="person-detail__empty">
              <div className="person-detail__empty-icon">👨‍🏫</div>
              <p className="person-detail__empty-text">Aucun enseignant attitré</p>
            </div>
          ) : (
            <div className="person-detail__grid">
              {enseignants.map(enseignant => {
                const teacher = ctx.enseignants.find(el => el._id === (enseignant._id || enseignant));

                if (!teacher) return null;

                return (
                  <Link key={teacher._id} href={`/enseignants/${teacher._id}`} className="person-detail__card">
                    <div className="person-detail__card-avatar">
                      <img
                        src={getEnseignantImagePath(teacher)}
                        alt={`${teacher.nom} ${teacher.prenoms}`}
                        onError={(e) => {
                          e.target.src = '/school/prof.webp';
                        }}
                      />
                    </div>
                    <div className="person-detail__card-content">
                      <h3 className="person-detail__card-name">{teacher.nom} {teacher.prenoms}</h3>
                      <p className="person-detail__card-role">Enseignant</p>
                    </div>
                  </Link>
                )
              }).filter(Boolean)}
            </div>
          )}

          {/* Module de rapport si l'utilisateur est un enseignant de cette classe */}
          <TeacherReportModule initialClasseId={classe._id} />
        </div>

        {/* Section Notes et Compositions */}
        <div className="person-detail__block person-detail__block--notes">
          <h2 className="person-detail__subtitle">
            <span className="person-detail__subtitle-icon">📊</span>
            Notes et Compositions
          </h2>
          {/* Affichage en lecture seule des notes existantes */}
          <NotesBlock
            eleves={eleves}
            classeId={classe._id}
            isCurrentYear={isCurrentYear}
          />
          {/* Saisie manuelle des notes — Story 1.4 */}
          <PermissionGate roles={['admin', 'prof']} fallback={<div className="image-scanner__loader-mini"><span className="spinner"></span></div>}>
            <div className="person-detail__block person-detail__block--entry">
              <h3 className="person-detail__subtitle person-detail__subtitle--sm" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <span className="person-detail__subtitle-icon">✏️</span>
                  {hasCoefficients ? (
                    <div className="person-detail__coefficients-list" title="Coefficients configurés pour cette classe">
                      {Object.entries(classe.coefficients).map(([subId, coeff]) => {
                        const sub = dynamicSubjects.find(s => s.id === subId);
                        return (
                          <span key={subId} className="person-detail__coeff-tag">
                            {sub ? sub.nom : `Mat. ${subId.slice(-4)}`}: <b>{coeff}</b>
                          </span>
                        );
                      })}
                    </div>
                  ) : (
                    <div className="person-detail__no-coefficients">
                      ⚠️ Pas de coefficients définis.
                      <button onClick={scrollToEdit} className="person-detail__scroll-btn" title="Aller à l'édition de la classe">Définir maintenant</button>
                    </div>
                  )}
                </div>
                <ImageScanner
                  classeId={classe._id}
                  label="Scanner notes"
                  className="--compact"
                  disabled={!hasCoefficients}
                  title={!hasCoefficients ? "Veuillez définir les coefficients de la classe avant de scanner des notes (cliquez sur 'Définir maintenant')" : "Scanner une liste de notes avec l'IA"}
                  onScanComplete={(result) => {
                    console.log('Scan completed', result);
                    if (result.success) {
                      setScanResult(result);
                      // Petit délai pour laisser le temps au DOM de s'updater
                      setTimeout(() => {
                        reviewRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
                      }, 100);
                    } else {
                      alert(result.error || "Erreur lors du scan"); // Basic error handling
                    }
                  }}
                />
              </h3>

              {/* Résultats du scan - Story 2.3 (Inline) */}
              <div ref={reviewRef}>
                {scanResult && scanResult.success && scanResult.file && (
                  <ReviewModal
                    file={scanResult.file}
                    extractedData={scanResult.data}
                    onClose={() => setScanResult(null)}
                    onValidate={(data) => {
                      console.log("Validation en cours avec les données:", data);
                      setScanResult(null);
                    }}
                  />
                )}
              </div>

              <NotesEntryBlock
                eleves={eleves}
                classeId={classe._id}
                isCurrentYear={isCurrentYear}
              />
            </div>
          </PermissionGate>
        </div>

        {/* Section Emploi du temps */}
        <div className="person-detail__block person-detail__block--schedule">
          {/* <h2 className="person-detail__subtitle">Emploi du temps</h2> */}
          <ScheduleViewer
            classeId={classe._id}
            isEditable={userRole === 'admin'}
            onEditSchedule={(data) => {
              if (data.action === 'create' || data.action === 'edit') {
                router.push(`/scheduling?classeId=${classe._id}`);
              } else if (data.action === 'history') {
                router.push(`/scheduling?classeId=${classe._id}&view=history`);
              }
            }}
          />
        </div>

        {/* Modal d'ajout d'élèves */}
        <AddStudentsModal
          isOpen={showAddStudentsModal}
          onClose={() => setShowAddStudentsModal(false)}
          classeId={classe._id}
          classeName={`${classe.niveau} ${classe.alias}`}
          classeAnnee={classe.annee}
          currentStudents={eleves.map(e => e._id || e)}
          onSuccess={() => {
            // Rafraîchir les données
            ctx.fetchEleves && ctx.fetchEleves();
            ctx.fetchClasses && ctx.fetchClasses();
          }}
        />

      </main>
    </DetailPortal>
}
