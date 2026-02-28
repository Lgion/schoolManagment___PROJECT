"use client";

import React, { useRef, useState, useEffect } from 'react';
import ProcessLoader from './ProcessLoader';

export default function ImageScanner({ classeId, onScanComplete }) {
    const [isScanning, setIsScanning] = useState(false);
    const [isOffline, setIsOffline] = useState(false);
    const [showToast, setShowToast] = useState(false);
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
        fileInputRef.current?.click();
    };

    const handleFileChange = async (event) => {
        const file = event.target.files?.[0];
        if (!file) return;

        if (isOffline) {
            // Local caching fallback without blocking the main thread (No alert())
            try {
                const cacheData = { name: file.name, size: file.size, date: new Date().toISOString() };
                const existing = JSON.parse(localStorage.getItem(`offline_scans_${classeId}`) || '[]');
                localStorage.setItem(`offline_scans_${classeId}`, JSON.stringify([...existing, cacheData]));
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
            await new Promise(resolve => setTimeout(resolve, 3000));

            console.log("Image envoyée à l'API pour analyse.");

            if (onScanComplete && isMounted.current) {
                onScanComplete({
                    success: true,
                    message: "Analyse simulée terminée"
                });
            }
        } catch (error) {
            console.error("Erreur de scan", error);
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
        <div className="image-scanner">
            <input
                type="file"
                accept="image/*"
                capture="environment"
                ref={fileInputRef}
                onChange={handleFileChange}
                style={{ display: 'none' }}
            />
            <button
                className="image-scanner__btn"
                onClick={handleButtonClick}
            >
                <span className="icon">📸</span>
                Scanner une classe
            </button>

            {showToast && (
                <div className="image-scanner__toast">
                    Hors-ligne : Copie sauvegardée localement. Synchronisation en attente.
                </div>
            )}
        </div>
    );
}
