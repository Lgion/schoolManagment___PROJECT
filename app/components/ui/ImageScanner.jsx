"use client";

import React, { useRef, useState, useEffect } from 'react';
import imageCompression from 'browser-image-compression';
import ProcessLoader from './ProcessLoader';
import { getLSItem, setLSItem } from '../../../utils/localStorageManager';
import { useUserRole } from '../../../stores/useUserRole';
import Link from 'next/link';

export default function ImageScanner({ classeId, subjects = [], onScanComplete, label = "Scanner une classe", className = "", disabled = false, title = "", apiEndpoint = '/api/school_ai/extract-notes', onCapture = null, acceptTypes = "image/*" }) {
    const { userData } = useUserRole();
    const [isScanning, setIsScanning] = useState(false);
    const [isOffline, setIsOffline] = useState(false);
    const [showToast, setShowToast] = useState(false);
    const [showUpsell, setShowUpsell] = useState(false);
    const fileInputRef = useRef(null);
    const isMounted = useRef(true);

    useEffect(() => {
        isMounted.current = true;

        const handleOnline = () => {
            if (isMounted.current) setIsOffline(false);
        };
        const handleOffline = () => {
            if (isMounted.current) setIsOffline(true);
        };

        if (isMounted.current) setIsOffline(!navigator.onLine);

        window.addEventListener('online', handleOnline);
        window.addEventListener('offline', handleOffline);

        return () => {
            isMounted.current = false;
            window.removeEventListener('online', handleOnline);
            window.removeEventListener('offline', handleOffline);
        };
    }, []);

    const handleButtonClick = () => {
        if (disabled) return;
        
        // Intercepter l'action en mode Sandbox pour afficher l'upsell
        const isSandbox = userData?.schoolKey && userData.schoolKey.startsWith('sandbox_');
        const isFalsy = typeof document !== 'undefined' && document.cookie.includes('force_falsy=true');
        
        if (isSandbox || isFalsy) {
            setShowUpsell(true);
            return;
        }

        fileInputRef.current?.click();
    };

    const handleFileChange = async (event) => {
        const file = event.target.files?.[0];
        if (!file) return;

        if (onCapture) {
            // Mode "Capture uniquement" (pas d'appel API automatique)
            setIsScanning(true);
            try {
                let finalFile = file;
                // Compression uniquement pour les images, ignorer pour les PDF
                if (file.type.startsWith('image/') && file.size > 1024 * 1024) {
                    const options = { maxSizeMB: 1, maxWidthOrHeight: 1920, useWebWorker: true };
                    finalFile = await imageCompression(file, options);
                }
                await onCapture(finalFile);
            } finally {
                if (isMounted.current) {
                    setIsScanning(false);
                    if (fileInputRef.current) fileInputRef.current.value = '';
                }
            }
            return;
        }

        if (isOffline) {
            // Local caching fallback without blocking the main thread (No alert())
            try {
                const cacheData = { name: file.name, size: file.size, date: new Date().toISOString() };
                const existing = getLSItem(`offline_scans_${classeId}`) || [];
                setLSItem(`offline_scans_${classeId}`, [...existing, cacheData]);
            } catch (e) {
                console.error("Local storage error:", e);
            }

            console.log(`[Offline Mode] Image mise en cache localement (localStorage) pour la classe ${classeId}.`);
            setShowToast(true);
            setTimeout(() => {
                if (isMounted.current) setShowToast(false);
            }, 4000);

            if (fileInputRef.current) fileInputRef.current.value = '';
            return;
        }

        setIsScanning(true);

        try {
            // 1. Client-side Image Compression (OOM Security fix)
            const options = {
                maxSizeMB: 1, // Target size is 1MB to avoid NextJS payload limits and backend RAM OOM
                maxWidthOrHeight: 1920, // Standard 1080p resolution is plenty for Gemini Vision
                useWebWorker: true
            };

            let uploadFile = file;
            if (file.size > 1024 * 1024) { // Only compress if over 1MB
                uploadFile = await imageCompression(file, options);
                console.log(`Image compressée de ${(file.size / 1024 / 1024).toFixed(2)} MB à ${(uploadFile.size / 1024 / 1024).toFixed(2)} MB`);
            }
            const formData = new FormData();
            formData.append('image', uploadFile);
            formData.append('subjects', JSON.stringify(subjects));

            const response = await fetch(apiEndpoint, {
                method: 'POST',
                body: formData,
            });

            if (!response.ok) {
                const errorData = await response.json().catch(() => ({}));
                throw new Error(errorData.error || 'Erreur lors de l\'analyse de l\'image par l\'IA');
            }

            const result = await response.json();

            if (onScanComplete && isMounted.current) {
                onScanComplete({
                    success: true,
                    data: result.data,
                    file: file,
                    message: "Analyse IA terminée avec succès"
                });
            }
        } catch (error) {
            console.error("Erreur de scan", error);
            if (onScanComplete && isMounted.current) {
                onScanComplete({
                    success: false,
                    error: error.message || "Impossible de contacter l'IA"
                });
            }
        } finally {
            if (isMounted.current) {
                setIsScanning(false);
                if (fileInputRef.current) fileInputRef.current.value = '';
            }
        }
    };

    if (isScanning) {
        return (
            <div className="image-scanner__loader-overlay">
                <ProcessLoader message="Analyse de l'image par l'IA..." />
            </div>
        );
    }

    return (
        <div className={`image-scanner ${className}`}>
            <input
                type="file"
                accept={acceptTypes}
                capture="environment"
                ref={fileInputRef}
                onChange={handleFileChange}
                style={{ display: 'none' }}
            />
            <button
                type="button"
                className={`image-scanner__btn ${disabled ? '--disabled' : ''}`}
                onClick={handleButtonClick}
                disabled={disabled}
                title={title}
            >
                <span className="icon">📸</span>
                {label}
            </button>

            {showToast && (
                <div className="image-scanner__toast">
                    Hors-ligne : Copie sauvegardée localement. Synchronisation en attente.
                </div>
            )}

            {showUpsell && (
                <div className="upsell-modal-overlay" onClick={() => setShowUpsell(false)}>
                    <div className="upsell-modal" onClick={(e) => e.stopPropagation()}>
                        <div className="upsell-modal__header">
                            <span className="upsell-modal__icon">⭐</span>
                            <h3 className="upsell-modal__title">Fonctionnalité Premium</h3>
                        </div>
                        <div className="upsell-modal__body">
                            <p>L'analyse et la numérisation intelligente de documents par l'IA (Cahier de texte, Bulletins de notes, Absences & Scolarité) sont des fonctionnalités exclusives de la version de production.</p>
                            <p className="upsell-modal__highlight">Passez en production pour débloquer la puissance totale de l'IA pour votre établissement !</p>
                        </div>
                        <div className="upsell-modal__footer">
                            <Link href="/myaccount" className="upsell-modal__btn --primary" onClick={() => setShowUpsell(false)}>
                                🚀 Activer mon école réelle
                            </Link>
                            <button className="upsell-modal__btn --secondary" onClick={() => setShowUpsell(false)}>
                                Plus tard
                            </button>
                        </div>
                    </div>
                    <style jsx>{`
                        .upsell-modal-overlay {
                            position: fixed;
                            top: 0;
                            left: 0;
                            width: 100vw;
                            height: 100vh;
                            background: rgba(15, 23, 42, 0.75);
                            backdrop-filter: blur(8px);
                            display: flex;
                            justify-content: center;
                            align-items: center;
                            z-index: 100000;
                            animation: fadeIn 0.3s ease;
                        }
                        .upsell-modal {
                            background: linear-gradient(135deg, #1e293b 0%, #0f172a 100%);
                            border: 1px solid rgba(249, 115, 22, 0.3);
                            border-radius: 24px;
                            padding: 32px;
                            width: 90%;
                            max-width: 480px;
                            box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.5),
                                        0 0 40px rgba(249, 115, 22, 0.15);
                            text-align: center;
                            animation: slideUp 0.4s cubic-bezier(0.34, 1.56, 0.64, 1);
                        }
                        .upsell-modal__header {
                            display: flex;
                            flex-direction: column;
                            align-items: center;
                            gap: 12px;
                            margin-bottom: 20px;
                        }
                        .upsell-modal__icon {
                            font-size: 3rem;
                            animation: float 3s ease-in-out infinite;
                            display: inline-block;
                        }
                        .upsell-modal__title {
                            font-size: 1.5rem;
                            font-weight: 800;
                            color: #f8fafc;
                            margin: 0;
                        }
                        .upsell-modal__body {
                            color: #94a3b8;
                            font-size: 0.95rem;
                            line-height: 1.6;
                            margin-bottom: 28px;
                        }
                        .upsell-modal__highlight {
                            color: #f97316;
                            font-weight: 600;
                            margin-top: 12px;
                        }
                        .upsell-modal__footer {
                            display: flex;
                            flex-direction: column;
                            gap: 12px;
                        }
                        .upsell-modal__btn {
                            width: 100%;
                            padding: 14px;
                            border-radius: 12px;
                            font-weight: 700;
                            font-size: 0.95rem;
                            cursor: pointer;
                            transition: all 0.2s;
                            text-decoration: none;
                            display: block;
                            box-sizing: border-box;
                        }
                        .upsell-modal__btn.--primary {
                            background: #f97316;
                            color: #fff;
                            border: none;
                            box-shadow: 0 4px 14px rgba(249, 115, 22, 0.3);
                        }
                        .upsell-modal__btn.--primary:hover {
                            background: #ea580c;
                            transform: translateY(-2px);
                            box-shadow: 0 6px 20px rgba(249, 115, 22, 0.4);
                        }
                        .upsell-modal__btn.--secondary {
                            background: transparent;
                            color: #94a3b8;
                            border: 1px solid rgba(255, 255, 255, 0.1);
                        }
                        .upsell-modal__btn.--secondary:hover {
                            background: rgba(255, 255, 255, 0.05);
                            color: #fff;
                        }
                        @keyframes fadeIn {
                            from { opacity: 0; }
                            to { opacity: 1; }
                        }
                        @keyframes slideUp {
                            from { transform: translateY(40px) scale(0.95); opacity: 0; }
                            to { transform: translateY(0) scale(1); opacity: 1; }
                        }
                        @keyframes float {
                            0%, 100% { transform: translateY(0); }
                            50% { transform: translateY(-10px); }
                        }
                    `}</style>
                </div>
            )}
        </div>
    );
}
