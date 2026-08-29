'use client';
import { useState } from 'react';
import { updateStudentAccount } from './familyApi';

/**
 * Bloc « Accès & comptes » de la page d'un élève (staff uniquement).
 * Configure les e-mails de correspondance qui permettent à l'élève et/ou à ses
 * parents de créer leur compte : le rôle est attribué automatiquement à la
 * première connexion (webhook Clerk + determineUserRole). Aucune création de
 * compte ici — on pose seulement les clés de rattachement.
 */
export default function StudentAccountConfig({ studentId, initial = {} }) {
  const [studentEmail, setStudentEmail] = useState(initial.studentEmail || '');
  const [studentPhone, setStudentPhone] = useState(initial.studentPhone || '');
  const [parentEmail, setParentEmail] = useState(initial.parentEmail || '');
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState('');
  const [error, setError] = useState('');

  const save = async () => {
    setSaving(true);
    setError('');
    setMsg('');
    try {
      const data = await updateStudentAccount(studentId, { studentEmail, studentPhone, parentEmail });
      setStudentEmail(data.studentEmail);
      setStudentPhone(data.studentPhone);
      setParentEmail(data.parentEmail);
      setMsg('Accès enregistré. Les comptes seront reconnus automatiquement à la connexion.');
    } catch (e) {
      setError(e.message || 'Erreur');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="accountConfig">
      <p className="accountConfig__hint">
        Renseignez les adresses de correspondance. À sa première connexion avec l'une de ces
        adresses, la personne obtiendra automatiquement le bon rôle : <strong>élève</strong> (e-mail
        de l'élève) ou <strong>parent</strong> (e-mail des parents, qui rattache toute la fratrie).
      </p>

      <div className="accountConfig__grid">
        <label className="accountConfig__field">
          <span>📧 E-mail de l'élève (compte autonome)</span>
          <input
            type="email"
            value={studentEmail}
            onChange={(e) => setStudentEmail(e.target.value)}
            placeholder="eleve@exemple.com"
          />
        </label>
        <label className="accountConfig__field">
          <span>📱 Téléphone de l'élève</span>
          <input
            type="tel"
            value={studentPhone}
            onChange={(e) => setStudentPhone(e.target.value)}
            placeholder="Optionnel"
          />
        </label>
        <label className="accountConfig__field">
          <span>👪 E-mail des parents (compte famille)</span>
          <input
            type="email"
            value={parentEmail}
            onChange={(e) => setParentEmail(e.target.value)}
            placeholder="parent@exemple.com"
          />
        </label>
      </div>

      {error && <p className="accountConfig__error">{error}</p>}
      {msg && <p className="accountConfig__success">✅ {msg}</p>}

      <div className="accountConfig__actions">
        <button type="button" className="accountConfig__save" onClick={save} disabled={saving}>
          {saving ? 'Enregistrement…' : "Enregistrer l'accès"}
        </button>
      </div>
    </div>
  );
}
