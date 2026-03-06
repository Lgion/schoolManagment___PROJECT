/**
 * util/localStorageManager.js
 * Wrapper centralisé pour gérer le localStorage global `schoolManagment`.
 * Permet l'expiration automatique d'une session de cache et offre une interface simple.
 */

const STORAGE_KEY = 'schoolManagment';

// Durée d'expiration par défaut (en heures) si NEXT_LS_EXPIRE_DURATION n'est pas définie
const DEFAULT_EXPIRE_HOURS = 24;

/**
 * Lit l'objet complet du Storage sécurisé
 */
const getStorageObj = () => {
    if (typeof window === 'undefined') return { data: {} };
    try {
        const stored = localStorage.getItem(STORAGE_KEY);
        return stored ? JSON.parse(stored) : { data: {} };
    } catch (e) {
        console.warn(`[LocalStorageManager] Structure locale corrompue, réinitialisation.`);
        return { data: {} };
    }
};

/**
 * Enregistre l'objet complet dans le Storage
 */
const saveStorageObj = (obj) => {
    if (typeof window === 'undefined') return;
    try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(obj));
    } catch (e) {
        console.error(`[LocalStorageManager] Erreur sauvegarde:`, e);
    }
};

/**
 * Calcule le nouveau timestamp d'expiration selon la durée d'heure configurée
 */
const computeNewExpireAt = () => {
    const hours = parseInt(process.env.NEXT_PUBLIC_LS_EXPIRE_DURATION || process.env.NEXT_LS_EXPIRE_DURATION || DEFAULT_EXPIRE_HOURS, 10);
    return Date.now() + (hours * 60 * 60 * 1000); // actuel + n heures en millisecondes
}

/**
 * Vide le localStorage de l'application.
 */
export const clearLS = () => {
    if (typeof window === 'undefined') return;

    // On conserve un objet propre avec un nouveau expireAt
    saveStorageObj({
        expireAt: computeNewExpireAt(),
        data: {}
    });
    console.log(`🗑️ [LocalStorageManager] Cache de l'application vidé.`);
};

/**
 * Initialise le LocalStorage :
 * - Si `?data=reset` est dans l'URL, vide le cache.
 * - Si l'heure actuelle dépasse `expireAt`, vide le cache.
 * - Sinon, prolonge ou initialise le `expireAt`.
 */
export const initStorage = () => {
    if (typeof window === 'undefined') return;

    const urlParams = new URLSearchParams(window.location.search);
    const shouldForceReset = urlParams.get('data') === 'reset';

    let storageObj = getStorageObj();
    const now = Date.now();

    if (shouldForceReset) {
        console.log(`🔄 [LocalStorageManager] Paramètre data=reset détecté : effacement forcé.`);
        clearLS();

        // Nettoyer l'URL si possible sans rafraichissement pour éviter les boucles (optionnel)
        if (window.history.replaceState) {
            const newUrl = window.location.protocol + "//" + window.location.host + window.location.pathname;
            window.history.replaceState({ path: newUrl }, '', newUrl);
        }
    } else if (storageObj.expireAt && now > storageObj.expireAt) {
        console.log(`⏰ [LocalStorageManager] Expiration du cache atteinte.`);
        clearLS();
    } else if (!storageObj.expireAt) {
        // Init la session expiration si elle était manquante
        storageObj.expireAt = computeNewExpireAt();
        saveStorageObj(storageObj);
    }
};

/**
 * Récupère une valeur spécifique par sa clé en assurant que le cache est valide.
 * Renvoie null si inexistante.
 */
export const getLSItem = (key) => {
    if (typeof window === 'undefined') return null;
    initStorage(); // Vérifie silencieusement l'expiration avant la lecture
    const storageObj = getStorageObj();
    return storageObj.data[key] !== undefined ? storageObj.data[key] : null;
};

/**
 * Définit ou met à jour une clé spécifique.
 */
export const setLSItem = (key, value) => {
    if (typeof window === 'undefined') return;
    initStorage(); // Vérifie silencieusement l'expiration avant l'écriture
    const storageObj = getStorageObj();
    storageObj.data[key] = value;
    saveStorageObj(storageObj);
};

/**
 * Supprime une clé spécifique.
 */
export const removeLSItem = (key) => {
    if (typeof window === 'undefined') return;
    const storageObj = getStorageObj();
    if (storageObj.data[key] !== undefined) {
        delete storageObj.data[key];
        saveStorageObj(storageObj);
    }
};
