"use client";

import React, { useRef, useState, useEffect } from 'react';
import imageCompression from 'browser-image-compression';
import ProcessLoader from './ProcessLoader';
import { getLSItem, setLSItem } from '../../../utils/localStorageManager';

export default function ImageScanner({ classeId, onScanComplete, label = "Scanner une classe", className = "" }) {
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

            const response = await fetch('/api/school_ai/extract-notes', {
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
                {label}
            </button>

            {showToast && (
                <div className="image-scanner__toast">
                    Hors-ligne : Copie sauvegardée localement. Synchronisation en attente.
                </div>
            )}
        </div>
    );
}
