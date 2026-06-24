"use client";

import React, { useState, useEffect } from 'react';
import { useUserRole } from '../../stores/useUserRole';

export default function MyAccountPage() {
  const { userData, clerkUser, loading: authLoading, syncUser } = useUserRole();
  const [schoolName, setSchoolName] = useState('');
  const [studentCount, setStudentCount] = useState('');
  const [address, setAddress] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [msg, setMsg] = useState({ type: '', text: '' });

  useEffect(() => {
    if (userData && userData.schoolKey && userData.schoolKey !== 'ecole_st_martin') {
      // Pré-remplir le nom s'il y a déjà des données
      setSchoolName(userData.schoolName || '');
    }
  }, [userData]);

  if (authLoading) {
    return <div className="account-page__loading">Chargement de votre compte...</div>;
  }

  if (!clerkUser) {
    return (
      <div className="account-page__unauth">
        <div className="account-page__card --error">
          <h2>🔐 Connexion Requise</h2>
          <p>Vous devez être connecté avec un compte d'utilisateur réel pour demander la création d'une école de production.</p>
        </div>
      </div>
    );
  }

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setMsg({ type: '', text: '' });

    try {
      const response = await fetch('/api/institutions/request', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          schoolName,
          studentCount: parseInt(studentCount, 10),
          address
        })
      });

      const result = await response.json();

      if (response.ok) {
        setMsg({ type: 'success', text: 'Votre demande d\'école réelle a été soumise avec succès au Super-Admin !' });
        // Synchroniser pour mettre à jour l'état local
        await syncUser();
      } else {
        setMsg({ type: 'error', text: result.error || 'Une erreur est survenue.' });
      }
    } catch (err) {
      setMsg({ type: 'error', text: 'Impossible de contacter le serveur.' });
    } finally {
      setSubmitting(false);
    }
  };

  const isSandbox = userData?.schoolKey && userData.schoolKey.startsWith('sandbox_');
  const isProd = userData?.schoolKey && userData.schoolKey.startsWith('school_');
  const status = userData?.realSchoolStatus || 'none';

  return (
    <div className="account-page">
      <style jsx>{`
        .account-page {
          max-width: 800px;
          margin: 40px auto;
          padding: 0 20px;
          font-family: 'Outfit', 'Inter', sans-serif;
        }

        .account-page__title {
          font-size: 2rem;
          font-weight: 800;
          color: #1e293b;
          margin-bottom: 24px;
        }

        .account-page__grid {
          display: flex;
          flex-direction: column;
          gap: 24px;
        }

        .account-page__card {
          background: #ffffff;
          border: 1px solid #e2e8f0;
          border-radius: 16px;
          padding: 24px;
          box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05);
        }

        .account-page__card.--premium {
          background: linear-gradient(135deg, #0f172a 0%, #1e293b 100%);
          border: 1px solid rgba(249, 115, 22, 0.2);
          color: #f8fafc;
          box-shadow: 0 10px 30px -10px rgba(249, 115, 22, 0.15);
        }

        .account-page__badge {
          display: inline-block;
          padding: 4px 12px;
          border-radius: 9999px;
          font-size: 0.75rem;
          font-weight: 700;
          text-transform: uppercase;
          margin-top: 8px;
        }

        .account-page__badge.--sandbox {
          background: rgba(249, 115, 22, 0.15);
          color: #f97316;
          border: 1px solid rgba(249, 115, 22, 0.3);
        }

        .account-page__badge.--prod {
          background: rgba(34, 197, 94, 0.15);
          color: #22c55e;
          border: 1px solid rgba(34, 197, 94, 0.3);
        }

        .account-page__badge.--pending {
          background: rgba(234, 179, 8, 0.15);
          color: #eab308;
          border: 1px solid rgba(234, 179, 8, 0.3);
        }

        .account-page__form-group {
          margin-bottom: 20px;
        }

        .account-page__label {
          display: block;
          font-size: 0.875rem;
          font-weight: 600;
          color: #475569;
          margin-bottom: 6px;
        }

        .account-page__input {
          width: 100%;
          padding: 10px 14px;
          border: 1px solid #cbd5e1;
          border-radius: 8px;
          font-size: 0.95rem;
          transition: border-color 0.2s;
        }

        .account-page__input:focus {
          outline: none;
          border-color: #f97316;
        }

        .account-page__btn {
          background: #f97316;
          color: #fff;
          border: none;
          padding: 12px 20px;
          border-radius: 8px;
          font-weight: 700;
          cursor: pointer;
          transition: all 0.2s;
          box-shadow: 0 4px 12px rgba(249, 115, 22, 0.2);
        }

        .account-page__btn:hover {
          background: #ea580c;
          transform: translateY(-1px);
        }

        .account-page__btn:disabled {
          background: #cbd5e1;
          cursor: not-allowed;
          box-shadow: none;
        }

        .account-page__status-box {
          display: flex;
          align-items: flex-start;
          gap: 16px;
          padding: 20px;
          border-radius: 12px;
          margin-top: 16px;
        }

        .account-page__status-box.--pending {
          background: rgba(234, 179, 8, 0.08);
          border: 1px solid rgba(234, 179, 8, 0.2);
          color: #854d0e;
        }

        .account-page__status-box.--approved {
          background: rgba(34, 197, 94, 0.08);
          border: 1px solid rgba(34, 197, 94, 0.2);
          color: #166534;
        }

        .account-page__message {
          padding: 12px;
          border-radius: 8px;
          font-size: 0.9rem;
          font-weight: 600;
          margin-bottom: 16px;
        }

        .account-page__message.--success {
          background: #dcfce7;
          color: #15803d;
          border: 1px solid #bbf7d0;
        }

        .account-page__message.--error {
          background: #fee2e2;
          color: #b91c1c;
          border: 1px solid #fecaca;
        }
      `}</style>

      <h1 className="account-page__title">Mon Compte & Établissement</h1>

      <div className="account-page__grid">
        {/* Carte info école active */}
        <div className="account-page__card --premium">
          <h3>🏫 Établissement Actif</h3>
          <p style={{ margin: '8px 0', fontSize: '1.1rem', fontWeight: 600 }}>
            {isSandbox ? "Mode Démo / Bac à Sable 🧪" : isProd ? "École de Production Active 🟢" : "École Saint-Martin (Historique)"}
          </p>
          <div style={{ fontFamily: 'monospace', color: '#94a3b8', fontSize: '0.9rem' }}>
            schoolKey : {userData?.schoolKey || 'ecole_st_martin'}
          </div>
          
          {isSandbox && (
            <span className="account-page__badge --sandbox">Bac à sable</span>
          )}
          {isProd && (
            <span className="account-page__badge --prod">Production</span>
          )}
        </div>

        {/* Section Demande / Statut */}
        <div className="account-page__card">
          {msg.text && (
            <div className={`account-page__message --${msg.type}`}>
              {msg.text}
            </div>
          )}

          {status === 'none' && (
            <>
              <h3>🚀 Ouvrir une École Réelle</h3>
              <p style={{ color: '#64748b', fontSize: '0.9rem', marginBottom: 20 }}>
                Vous utilisez actuellement un espace de démonstration. Prêt à passer en production ? Remplissez ce formulaire pour soumettre votre demande d'activation.
              </p>

              <form onSubmit={handleSubmit}>
                <div className="account-page__form-group">
                  <label className="account-page__label">Nom officiel de l'établissement</label>
                  <input 
                    type="text" 
                    className="account-page__input" 
                    placeholder="ex: Groupe Scolaire Saint-Exupéry"
                    value={schoolName}
                    onChange={(e) => setSchoolName(e.target.value)}
                    required
                  />
                </div>

                <div className="account-page__form-group">
                  <label className="account-page__label">Effectif estimé (nombre d'élèves)</label>
                  <input 
                    type="number" 
                    className="account-page__input" 
                    placeholder="ex: 150"
                    value={studentCount}
                    onChange={(e) => setStudentCount(e.target.value)}
                  />
                </div>

                <div className="account-page__form-group">
                  <label className="account-page__label">Adresse géographique</label>
                  <input 
                    type="text" 
                    className="account-page__input" 
                    placeholder="ex: Abidjan, Cocody Mermoz"
                    value={address}
                    onChange={(e) => setAddress(e.target.value)}
                  />
                </div>

                <button 
                  type="submit" 
                  className="account-page__btn"
                  disabled={submitting}
                >
                  {submitting ? 'Envoi en cours...' : "Soumettre ma demande d'activation"}
                </button>
              </form>
            </>
          )}

          {status === 'pending' && (
            <div className="account-page__status-box --pending">
              <span style={{ fontSize: '24px' }}>⏳</span>
              <div>
                <h4 style={{ margin: 0, fontWeight: 700 }}>Demande en cours d'examen</h4>
                <p style={{ margin: '4px 0 0 0', fontSize: '0.9rem', color: '#713f12' }}>
                  Votre demande pour l'établissement <strong>{schoolName}</strong> a bien été transmise. Le Super-Admin l'examine actuellement. Vous recevrez une notification d'approbation sous peu.
                </p>
              </div>
            </div>
          )}

          {status === 'approved' && (
            <div className="account-page__status-box --approved">
              <span style={{ fontSize: '24px' }}>✅</span>
              <div>
                <h4 style={{ margin: 0, fontWeight: 700 }}>Établissement Approuvé !</h4>
                <p style={{ margin: '4px 0 0 0', fontSize: '0.9rem', color: '#14532d' }}>
                  Félicitations ! Le Super-Admin a approuvé votre établissement. Votre espace officiel est maintenant entièrement opérationnel en base de données de production sous la clé <strong>{userData?.schoolKey}</strong>.
                </p>
                <div style={{ marginTop: '14px' }}>
                  <a href="/" className="account-page__btn" style={{ background: '#22c55e', textDecoration: 'none', display: 'inline-block' }}>
                    Commencer l'onboarding (Créer une classe)
                  </a>
                </div>
              </div>
            </div>
          )}

          {status === 'declined' && (
            <>
              <div className="account-page__status-box" style={{ background: 'rgba(239, 68, 68, 0.08)', border: '1px solid rgba(239, 68, 68, 0.2)', color: '#7f1d1d', marginBottom: 20 }}>
                <span style={{ fontSize: '24px' }}>❌</span>
                <div>
                  <h4 style={{ margin: 0, fontWeight: 700 }}>Demande Déclinée</h4>
                  <p style={{ margin: '4px 0 0 0', fontSize: '0.9rem', color: '#7f1d1d' }}>
                    Désolé, votre demande d'activation a été déclinée par l'administrateur. Vous pouvez corriger vos informations et soumettre une nouvelle demande ci-dessous.
                  </p>
                </div>
              </div>

              {/* Formulaire de re-soumission */}
              <form onSubmit={handleSubmit}>
                <div className="account-page__form-group">
                  <label className="account-page__label">Nom officiel de l'établissement</label>
                  <input 
                    type="text" 
                    className="account-page__input" 
                    placeholder="ex: Groupe Scolaire Saint-Exupéry"
                    value={schoolName}
                    onChange={(e) => setSchoolName(e.target.value)}
                    required
                  />
                </div>

                <div className="account-page__form-group">
                  <label className="account-page__label">Effectif estimé (nombre d'élèves)</label>
                  <input 
                    type="number" 
                    className="account-page__input" 
                    placeholder="ex: 150"
                    value={studentCount}
                    onChange={(e) => setStudentCount(e.target.value)}
                  />
                </div>

                <div className="account-page__form-group">
                  <label className="account-page__label">Adresse géographique</label>
                  <input 
                    type="text" 
                    className="account-page__input" 
                    placeholder="ex: Abidjan, Cocody Mermoz"
                    value={address}
                    onChange={(e) => setAddress(e.target.value)}
                  />
                </div>

                <button 
                  type="submit" 
                  className="account-page__btn"
                  disabled={submitting}
                >
                  {submitting ? 'Envoi en cours...' : "Soumettre une nouvelle demande"}
                </button>
              </form>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
