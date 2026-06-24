"use client";

import React, { useState, useEffect } from 'react';
import { useUserRole } from '../../stores/useUserRole';

export default function SandboxRoleSelector() {
  const { userRole } = useUserRole();
  const [isOpen, setIsOpen] = useState(false);
  const [activeRole, setActiveRole] = useState(userRole || 'admin');

  useEffect(() => {
    if (userRole) {
      setActiveRole(userRole);
    }
  }, [userRole]);

  const roles = [
    { id: 'admin', label: '👑 Administrateur', desc: 'Gérer l\'école, le personnel & finances' },
    { id: 'prof', label: '👨‍🏫 Enseignant', desc: 'Faire l\'appel, cahier de texte & notes' },
    { id: 'eleve', label: '👨‍🎓 Élève', desc: 'Voir ses devoirs, notes & bons points' },
    { id: 'parent', label: '👥 Parent', desc: 'Suivre la scolarité de ses enfants' }
  ];

  const handleRoleChange = (roleId) => {
    // 1. Définir le cookie mock_role pour le middleware et useUserRole
    document.cookie = `mock_role=${roleId}; path=/; max-age=86400`;
    
    // 2. Nettoyer le localStorage pour forcer la mise à jour des contextes
    if (typeof window !== 'undefined') {
      localStorage.setItem('mock_role', roleId);
      // Supprimer le cache de l'utilisateur pour éviter les données périmées
      Object.keys(localStorage).forEach(key => {
        if (key.startsWith('user_')) {
          localStorage.removeItem(key);
        }
      });
    }

    setActiveRole(roleId);
    setIsOpen(false);
    
    // 3. Recharger la page pour appliquer instantanément les nouveaux droits
    window.location.reload();
  };

  const quitSandbox = () => {
    // Supprimer les cookies et réinitialiser
    document.cookie = "force_falsy=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT";
    document.cookie = "is_landing_demo=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT";
    document.cookie = "mock_role=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT";
    document.cookie = "x-school-key=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT";
    
    if (typeof window !== 'undefined') {
      localStorage.removeItem('mock_role');
      localStorage.removeItem('x-school-key');
    }
    
    window.location.href = '/';
  };

  return (
    <div className={`sandbox-selector ${isOpen ? '--is-open' : ''}`}>
      <style jsx global>{`
        .sandbox-selector {
          position: fixed;
          bottom: 24px;
          right: 24px;
          z-index: 9999;
          font-family: 'Outfit', 'Inter', sans-serif;
        }

        .sandbox-selector__trigger {
          display: flex;
          align-items: center;
          gap: 10px;
          background: rgba(15, 23, 42, 0.85);
          backdrop-filter: blur(12px);
          -webkit-backdrop-filter: blur(12px);
          border: 1px solid rgba(249, 115, 22, 0.3);
          color: #fff;
          padding: 12px 18px;
          border-radius: 50px;
          cursor: pointer;
          font-weight: 600;
          box-shadow: 0 10px 25px -5px rgba(249, 115, 22, 0.2),
                      inset 0 1px 0 rgba(255, 255, 255, 0.1);
          transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
        }

        .sandbox-selector__trigger:hover {
          transform: translateY(-2px);
          border-color: rgba(249, 115, 22, 0.6);
          box-shadow: 0 15px 30px -5px rgba(249, 115, 22, 0.3),
                      inset 0 1px 0 rgba(255, 255, 255, 0.2);
        }

        .sandbox-selector__trigger-pulse {
          width: 8px;
          height: 8px;
          background: #f97316;
          border-radius: 50%;
          box-shadow: 0 0 0 0 rgba(249, 115, 22, 0.7);
          animation: pulse 2s infinite;
        }

        @keyframes pulse {
          0% {
            transform: scale(0.95);
            box-shadow: 0 0 0 0 rgba(249, 115, 22, 0.7);
          }
          70% {
            transform: scale(1);
            box-shadow: 0 0 0 8px rgba(249, 115, 22, 0);
          }
          100% {
            transform: scale(0.95);
            box-shadow: 0 0 0 0 rgba(249, 115, 22, 0);
          }
        }

        .sandbox-selector__panel {
          position: absolute;
          bottom: 70px;
          right: 0;
          width: 320px;
          background: rgba(15, 23, 42, 0.95);
          backdrop-filter: blur(16px);
          border: 1px solid rgba(255, 255, 255, 0.08);
          border-radius: 20px;
          padding: 20px;
          box-shadow: 0 20px 50px -12px rgba(0, 0, 0, 0.5);
          opacity: 0;
          transform: translateY(20px) scale(0.95);
          pointer-events: none;
          transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
        }

        .sandbox-selector.--is-open .sandbox-selector__panel {
          opacity: 1;
          transform: translateY(0) scale(1);
          pointer-events: auto;
        }

        .sandbox-selector__header {
          display: flex;
          align-content: center;
          justify-content: space-between;
          border-bottom: 1px solid rgba(255, 255, 255, 0.08);
          padding-bottom: 12px;
          margin-bottom: 16px;
        }

        .sandbox-selector__title {
          font-size: 1rem;
          font-weight: 700;
          color: #f8fafc;
          margin: 0;
          display: flex;
          align-items: center;
          gap: 6px;
        }

        .sandbox-selector__subtitle {
          font-size: 0.75rem;
          color: #94a3b8;
          margin: 4px 0 0 0;
        }

        .sandbox-selector__list {
          display: flex;
          flex-direction: column;
          gap: 8px;
          margin-bottom: 16px;
        }

        .sandbox-selector__item {
          width: 100%;
          text-align: left;
          background: rgba(255, 255, 255, 0.03);
          border: 1px solid rgba(255, 255, 255, 0.05);
          padding: 10px 14px;
          border-radius: 12px;
          cursor: pointer;
          transition: all 0.2s ease;
        }

        .sandbox-selector__item:hover {
          background: rgba(249, 115, 22, 0.08);
          border-color: rgba(249, 115, 22, 0.3);
        }

        .sandbox-selector__item.--is-active {
          background: rgba(249, 115, 22, 0.15);
          border-color: rgba(249, 115, 22, 0.5);
          box-shadow: 0 0 12px rgba(249, 115, 22, 0.1);
        }

        .sandbox-selector__item-label {
          font-size: 0.875rem;
          font-weight: 600;
          color: #f1f5f9;
        }

        .sandbox-selector__item-desc {
          font-size: 0.7rem;
          color: #64748b;
          margin-top: 2px;
        }

        .sandbox-selector__footer {
          display: flex;
          justify-content: center;
          border-top: 1px solid rgba(255, 255, 255, 0.08);
          padding-top: 12px;
        }

        .sandbox-selector__quit-btn {
          background: transparent;
          border: none;
          color: #ef4444;
          font-size: 0.8rem;
          font-weight: 600;
          cursor: pointer;
          display: flex;
          align-items: center;
          gap: 6px;
          padding: 6px 12px;
          border-radius: 6px;
          transition: background 0.2s ease;
        }

        .sandbox-selector__quit-btn:hover {
          background: rgba(239, 68, 68, 0.1);
        }
      `}</style>

      <button 
        className="sandbox-selector__trigger" 
        onClick={() => setIsOpen(!isOpen)}
        aria-label="Sélecteur de rôles de simulation"
      >
        <span className="sandbox-selector__trigger-pulse"></span>
        <span>Simuler un Rôle</span>
      </button>

      <div className="sandbox-selector__panel">
        <div className="sandbox-selector__header">
          <div>
            <h3 className="sandbox-selector__title">🧪 Mode Bac à Sable</h3>
            <p className="sandbox-selector__subtitle">Basculez d'identité instantanément</p>
          </div>
        </div>

        <div className="sandbox-selector__list">
          {roles.map((role) => (
            <button
              key={role.id}
              className={`sandbox-selector__item ${activeRole === role.id ? '--is-active' : ''}`}
              onClick={() => handleRoleChange(role.id)}
            >
              <div className="sandbox-selector__item-label">{role.label}</div>
              <div className="sandbox-selector__item-desc">{role.desc}</div>
            </button>
          ))}
        </div>

        <div className="sandbox-selector__footer">
          <button className="sandbox-selector__quit-btn" onClick={quitSandbox}>
            🚪 Quitter la démo
          </button>
        </div>
      </div>
    </div>
  );
}
