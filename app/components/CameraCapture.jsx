"use client"

import { useState, useRef, useEffect } from 'react';

/**
 * Composant de capture photo via caméra
 * Utilise l'API getUserMedia() pour accéder à la caméra du périphérique
 * 
 * Props:
 * - onCapture: (file) => void - Callback appelé avec le fichier photo capturé
 * - onClose: () => void - Callback pour fermer le composant
 * - facingMode: 'user' | 'environment' - Caméra frontale ou arrière (défaut: 'user')
 */
export default function CameraCapture({ onCapture, onClose, facingMode = 'user' }) {
  // États du composant
  const [stream, setStream] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [hasPermission, setHasPermission] = useState(null);
  const [capturedImage, setCapturedImage] = useState(null);
  const [currentFacingMode, setCurrentFacingMode] = useState(facingMode);
  const [isVideoReady, setIsVideoReady] = useState(false);

  // Références DOM
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const streamRef = useRef(null);

  /**
   * Démarre la caméra avec getUserMedia
   */
  const startCamera = async () => {
    console.log('🎥 [CameraCapture] Démarrage de la caméra...');
    setIsLoading(true);
    setError('');
    
    try {
      // Vérifier la compatibilité du navigateur
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        throw new Error('Votre navigateur ne supporte pas l\'accès à la caméra');
      }

      console.log('🎥 [CameraCapture] Navigator.mediaDevices disponible');
      console.log('🎥 [CameraCapture] Contexte sécurisé:', window.isSecureContext);
      console.log('🎥 [CameraCapture] Protocol:', window.location.protocol);

      let mediaStream;
      
      try {
        // Tentative avec contraintes avancées
        const constraints = {
          video: {
            facingMode: currentFacingMode,
            width: { ideal: 1280 },
            height: { ideal: 720 }
          },
          audio: false
        };

        console.log('🎥 [CameraCapture] Contraintes avancées:', constraints);
        mediaStream = await navigator.mediaDevices.getUserMedia(constraints);
        console.log('🎥 [CameraCapture] Stream avancé obtenu');
        
      } catch (constraintError) {
        console.warn('🎥 [CameraCapture] Contraintes avancées échouées, fallback...');
        
        // Fallback avec contraintes simples
        const simpleConstraints = { video: true, audio: false };
        console.log('🎥 [CameraCapture] Contraintes fallback:', simpleConstraints);
        mediaStream = await navigator.mediaDevices.getUserMedia(simpleConstraints);
        console.log('🎥 [CameraCapture] Stream fallback obtenu');
      }
      
      console.log('🎥 [CameraCapture] Stream final:', mediaStream);
      console.log('🎥 [CameraCapture] Tracks vidéo:', mediaStream.getVideoTracks());
      
      setStream(mediaStream);
      streamRef.current = mediaStream; // Stocker dans ref pour accès immédiat
      setHasPermission(true);
      setIsVideoReady(false); // Reset l'état vidéo
      
      // IMPORTANT: On définit isLoading à false AVANT d'attacher le stream
      // pour que le composant vidéo soit rendu
      setIsLoading(false);
      
      // Attendre un peu que le DOM se mette à jour
      await new Promise(resolve => setTimeout(resolve, 100));
      
      // Maintenant attacher le flux à l'élément vidéo
      await attachStreamToVideo(mediaStream);
      
    } catch (err) {
      console.error('🎥 [CameraCapture] Erreur accès caméra:', err);
      console.error('🎥 [CameraCapture] Nom erreur:', err.name);
      console.error('🎥 [CameraCapture] Message erreur:', err.message);
      
      setHasPermission(false);
      
      // Messages d'erreur spécifiques
      if (err.name === 'NotAllowedError') {
        setError('Accès à la caméra refusé. Veuillez autoriser l\'accès dans les paramètres de votre navigateur.');
      } else if (err.name === 'NotFoundError') {
        setError('Aucune caméra trouvée sur cet appareil.');
      } else if (err.name === 'NotReadableError') {
        setError('La caméra est déjà utilisée par une autre application.');
      } else if (err.name === 'OverconstrainedError') {
        setError('Les paramètres de caméra demandés ne sont pas supportés.');
      } else if (err.name === 'SecurityError') {
        setError('Erreur de sécurité. Vérifiez que vous utilisez HTTPS.');
      } else {
        setError(err.message || 'Erreur inconnue lors de l\'accès à la caméra');
      }
      setIsLoading(false);
    }
  };

  /**
   * Attache le stream à l'élément vidéo avec retry
   */
  const attachStreamToVideo = async (mediaStream, retryCount = 0) => {
    const maxRetries = 10; // Augmenté pour production
    const retryDelay = 200; // Délai augmenté pour production
    
    if (!videoRef.current) {
      if (retryCount < maxRetries) {
        console.log(`🎥 [CameraCapture] videoRef null, retry ${retryCount + 1}/${maxRetries}...`);
        await new Promise(resolve => setTimeout(resolve, retryDelay));
        return attachStreamToVideo(mediaStream, retryCount + 1);
      } else {
        console.error('🎥 [CameraCapture] videoRef.current toujours null après tous les retries !');
        setError('Impossible d\'initialiser la vidéo. Veuillez rafraîchir la page.');
        return;
      }
    }

    console.log('🎥 [CameraCapture] Attachement du stream à la vidéo...');
    
    try {
      // S'assurer que l'élément vidéo est prêt
      if (videoRef.current.readyState < 2) {
        await new Promise((resolve) => {
          videoRef.current.oncanplay = resolve;
          // Timeout de sécurité
          setTimeout(resolve, 2000);
        });
      }
      
      videoRef.current.srcObject = mediaStream;
      
      // Attendre que la vidéo soit prête avec promesse
      await new Promise((resolve, reject) => {
        const timeoutId = setTimeout(() => {
          console.warn('⚠️ [CameraCapture] Timeout métadonnées - continuons quand même');
          resolve(); // Résoudre au lieu de rejeter
        }, 3000); // Réduire le timeout à 3s
        
        if (videoRef.current) {
          videoRef.current.onloadedmetadata = () => {
            clearTimeout(timeoutId);
            console.log('🎥 [CameraCapture] Métadonnées vidéo chargées');
            console.log('🎥 [CameraCapture] Dimensions vidéo:', {
              width: videoRef.current?.videoWidth || 0,
              height: videoRef.current?.videoHeight || 0
            });
            resolve();
          };
          
          // Fallback : si la vidéo est déjà prête
          if (videoRef.current.readyState >= 1) {
            clearTimeout(timeoutId);
            console.log('🎥 [CameraCapture] Vidéo déjà prête');
            resolve();
          }
        } else {
          clearTimeout(timeoutId);
          reject(new Error('Référence vidéo non disponible'));
        }
        
        // Si les métadonnées sont déjà chargées
        if (videoRef.current.readyState >= 1) {
          clearTimeout(timeoutId);
          console.log('🎥 [CameraCapture] Métadonnées déjà disponibles');
          resolve();
        }
      });
      
      // Jouer la vidéo avec vérification et retry
      let playAttempts = 0;
      const maxAttempts = 3;
      
      while (playAttempts < maxAttempts) {
        if (videoRef.current) {
          try {
            await videoRef.current.play();
            console.log('🎥 [CameraCapture] Lecture vidéo démarrée avec succès');
            setIsVideoReady(true); // Marquer la vidéo comme prête
            break; // Sortir de la boucle si succès
          } catch (playErr) {
            console.warn(`⚠️ [CameraCapture] Tentative ${playAttempts + 1} échouée:`, playErr);
            playAttempts++;
            if (playAttempts < maxAttempts) {
              await new Promise(resolve => setTimeout(resolve, 500)); // Attendre 500ms
            }
          }
        } else {
          console.warn(`⚠️ [CameraCapture] Référence vidéo null - tentative ${playAttempts + 1}`);
          playAttempts++;
          if (playAttempts < maxAttempts) {
            await new Promise(resolve => setTimeout(resolve, 200)); // Attendre 200ms
          }
        }
      }
      
      // Si toutes les tentatives ont échoué
      if (playAttempts >= maxAttempts) {
        console.warn('⚠️ [CameraCapture] Impossible de démarrer la vidéo après plusieurs tentatives');
        setError('Impossible de démarrer la caméra. Veuillez réessayer.');
        setIsVideoReady(false);
        return; // Ne pas throw, juste retourner
      }
      
    } catch (playError) {
      console.error('🎥 [CameraCapture] Erreur lecture vidéo:', playError);
      // Ne pas propager l'erreur pour permettre à l'utilisateur de réessayer
      setError('Erreur lors du démarrage de la vidéo. Cliquez sur "Réessayer".');
      setIsVideoReady(false);
    }
  };

  /**
   * Arrête la caméra et libère les ressources
   */
  const stopCamera = () => {
    if (stream) {
      stream.getTracks().forEach(track => track.stop());
      setStream(null);
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
    setIsVideoReady(false);
  };

  /**
   * Capture une photo depuis le flux vidéo
   */
  const capturePhoto = () => {
    if (!videoRef.current || !canvasRef.current) return;

    const video = videoRef.current;
    const canvas = canvasRef.current;
    const context = canvas.getContext('2d');

    // Définir les dimensions du canvas selon la vidéo
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;

    // Dessiner l'image vidéo sur le canvas
    context.drawImage(video, 0, 0, canvas.width, canvas.height);

    // Convertir en blob puis en File
    canvas.toBlob(blob => {
      if (blob) {
        const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
        const file = new File([blob], `photo-${timestamp}.jpg`, { 
          type: 'image/jpeg',
          lastModified: Date.now()
        });
        
        // Créer une URL pour la prévisualisation
        const imageUrl = URL.createObjectURL(blob);
        setCapturedImage(imageUrl);
        
        // Appeler le callback avec le fichier
        onCapture(file);
      }
    }, 'image/jpeg', 0.8); // Qualité JPEG à 80%
  };

  /**
   * Basculer entre caméra frontale et arrière
   */
  const switchCamera = () => {
    const newFacingMode = currentFacingMode === 'user' ? 'environment' : 'user';
    setCurrentFacingMode(newFacingMode);
    stopCamera();
  };

  /**
   * Reprendre une nouvelle photo
   */
  const retakePhoto = () => {
    setCapturedImage(null);
    startCamera();
  };

  /**
   * Confirmer et fermer
   */
  const confirmPhoto = () => {
    stopCamera();
    onClose();
  };

  // Démarrage automatique de la caméra au montage
  useEffect(() => {
    startCamera();
    
    // Nettoyage au démontage
    return () => {
      stopCamera();
    };
  }, [currentFacingMode]);

  // Effet pour gérer l'attachement du stream quand la vidéo et le stream sont prêts
  useEffect(() => {
    // N'essayer que si on a un stream mais pas encore de vidéo prête
    if (streamRef.current && videoRef.current && !isVideoReady && !isLoading) {
      console.log('🎥 [CameraCapture] Tentative d\'attachement via useEffect');
      // Petit délai pour s'assurer que le DOM est à jour
      setTimeout(() => {
        if (streamRef.current && !isVideoReady) {
          attachStreamToVideo(streamRef.current);
        }
      }, 100);
    }
  }, [stream, isVideoReady, isLoading]);

  return (
    <div className="camera-capture">
      <div className="camera-capture__overlay" onClick={onClose}></div>
      
      <div className="camera-capture__modal">
        {/* Header */}
        <div className="camera-capture__header">
          <h3 className="camera-capture__title"> Prendre une photo</h3>
          <button 
            className="camera-capture__close-btn"
            onClick={onClose}
            type="button"
          >
            
          </button>
        </div>

        {/* Contenu principal */}
        <div className="camera-capture__content">
          {/* Zone de chargement */}
          {isLoading && (
            <div className="camera-capture__loading">
              <div className="camera-capture__spinner"></div>
              <p>Démarrage de la caméra...</p>
            </div>
          )}

          {/* Zone d'erreur */}
          {error && (
            <div className="camera-capture__error">
              <div className="camera-capture__error-icon"></div>
              <div className="camera-capture__error-content">
                <h4>Erreur d'accès à la caméra</h4>
                <p>{error}</p>
                <button 
                  className="camera-capture__retry-btn"
                  onClick={startCamera}
                  type="button"
                >
                  
                </button>
              </div>
            </div>
          )}

          {/* Zone de prévisualisation vidéo - toujours présent dans le DOM */}
          <div className="camera-capture__preview" style={{ 
            display: (!error && !capturedImage) ? 'block' : 'none' 
          }}>
            <video
              ref={videoRef}
              className="camera-capture__video"
              autoPlay
              muted
              playsInline
              style={{
                opacity: isLoading ? 0 : 1,
                transition: 'opacity 0.3s ease'
              }}
            />
            
            {/* Overlay de visée */}
            <div className="camera-capture__viewfinder">
              <div className="camera-capture__viewfinder-frame"></div>
            </div>
          </div>

          {/* Zone de photo capturée */}
          {capturedImage && (
            <div className="camera-capture__captured">
              <img 
                src={capturedImage} 
                alt="Photo capturée" 
                className="camera-capture__captured-image"
              />
            </div>
          )}

          {/* Canvas caché pour la capture */}
          <canvas
            ref={canvasRef}
            className="camera-capture__canvas"
            style={{ display: 'none' }}
          />
        </div>

        {/* Controls */}
        <div className="camera-capture__controls">
          {!capturedImage ? (
            // Contrôles de capture
            <>
              {hasPermission && !error && !isLoading && (
                <>
                  <button
                    className="camera-capture__switch-btn"
                    onClick={switchCamera}
                    type="button"
                    title="Changer de caméra"
                  >
                    
                  </button>
                  
                  <button
                    className="camera-capture__capture-btn"
                    onClick={capturePhoto}
                    type="button"
                  >
                    <div className="camera-capture__capture-btn-inner"></div>
                  </button>
                  
                  <button
                    className="camera-capture__cancel-btn"
                    onClick={onClose}
                    type="button"
                  >
                    Annuler
                  </button>
                </>
              )}
            </>
          ) : (
            // Contrôles de confirmation
            <>
              <button
                className="camera-capture__retake-btn"
                onClick={retakePhoto}
                type="button"
              >
                
              </button>
              
              <button
                className="camera-capture__confirm-btn"
                onClick={confirmPhoto}
                type="button"
              >
                
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
