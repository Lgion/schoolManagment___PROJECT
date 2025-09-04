# Système de Loading Global

## Vue d'ensemble

Le système de loading global intercepte automatiquement les clics sur les éléments de navigation spécifiés et affiche un spin loader pendant le chargement des pages. Il désactive également toutes les interactions utilisateur (clic, scroll, sélection) pendant le chargement.

## Éléments interceptés automatiquement

Le système surveille les sélecteurs CSS suivants :

- `.ecole-admin__nav > a` - Liens de navigation principale
- `.ecole-admin__content h1 > .ecole-admin__nav-btn` - Boutons de navigation dans les titres
- `.classe-card` - Cartes de classe (navigation vers détail classe)
- `.eleve-card` - Cartes d'élève (navigation vers détail élève)
- `.person-card` - Cartes de personne
- `.classe-card__editbtn` - Boutons d'édition des classes
- `.eleve-card__editbtn` - Boutons d'édition des élèves
- `.person-card__editbtn` - Boutons d'édition des personnes
- `.person-detail__editbtn` - Boutons d'édition dans les détails

## Architecture

### Composants principaux

1. **LoadingProvider** (`/stores/useLoading.js`)
   - Contexte React global pour l'état de loading
   - Hook `useLoading()` pour accéder à l'état

2. **SpinLoader** (`/app/components/SpinLoader.jsx`)
   - Composant BEM overlay fullscreen
   - Paramétrable (variant, taille, texte)
   - Désactive automatiquement les interactions

3. **NavigationInterceptor** (`/app/components/NavigationInterceptor.jsx`)
   - Intercepte les clics sur les éléments ciblés
   - Gère la navigation avec ViewTransitions

4. **useNavigationWithLoading** (`/stores/useNavigationWithLoading.js`)
   - Hook pour navigation avec loading et ViewTransitions
   - Compatible avec Next.js App Router

5. **useNavigationLoader** (`/stores/useNavigationLoader.js`)
   - Hook simplifié pour les développeurs
   - Combine toutes les fonctionnalités

### Styles SCSS

- **Variables de thème** : Utilise les variables définies dans `/assets/scss/_variables.scss`
- **Composant BEM** : `/assets/scss/components/LOADERS/spinLoader.scss`
- **Nomenclature** : Respecte les règles BEM du projet

## Utilisation pour les développeurs

### Utilisation automatique

Le système fonctionne automatiquement pour tous les éléments listés ci-dessus. Aucune configuration supplémentaire n'est nécessaire.

### Utilisation manuelle

```javascript
import { useNavigationLoader } from '../stores/useNavigationLoader';

function MonComposant() {
  const { navigate, isLoading, withLoader } = useNavigationLoader();

  const handleClick = async () => {
    // Navigation avec loader automatique
    await navigate('/ma-page');
  };

  const handleLongAction = async () => {
    // Action longue avec loader
    await withLoader(async () => {
      // Votre action asynchrone
      await fetch('/api/data');
    }, 'Chargement des données...');
  };

  return (
    <div>
      <button onClick={handleClick}>
        Naviguer avec loader
      </button>
      
      <button onClick={handleLongAction} disabled={isLoading}>
        Action longue
      </button>
    </div>
  );
}
```

### Hooks disponibles

#### `useLoading()`
```javascript
const { isLoading, startLoading, stopLoading } = useLoading();
```

#### `useNavigationWithLoading()`
```javascript
const { navigateWithLoading, replaceWithLoading, backWithLoading } = useNavigationWithLoading();
```

#### `useNavigationLoader()` (recommandé)
```javascript
const { 
  navigate, 
  replace, 
  back, 
  isLoading, 
  withLoader 
} = useNavigationLoader();
```

## Fonctionnalités

### ViewTransitions
- Utilise l'API ViewTransition quand disponible
- Fallback gracieux pour les navigateurs non compatibles
- Navigation fluide selon les règles utilisateur

### Désactivation des interactions
- **Scroll** : Désactivé via event listeners
- **Clics** : Bloqués par overlay
- **Sélection** : `user-select: none`
- **Navigation clavier** : Touches de navigation désactivées

### Gestion d'erreurs
- Timeout de sécurité (3 secondes par défaut)
- Désactivation automatique du loader en cas d'erreur
- Logs détaillés pour le debugging

### Accessibilité
- Attributs ARIA appropriés
- Support screen readers
- États de loading visibles

## Personnalisation

### Variantes du SpinLoader

```javascript
<SpinLoader 
  variant="primary"    // primary, success, warning, danger
  size="normal"        // normal, compact
  text="Chargement..." // Texte personnalisé
  showText={true}      // Afficher/masquer le texte
/>
```

### Styles CSS personnalisés

Le composant utilise les variables de thème définies dans `_variables.scss`. Vous pouvez personnaliser :

- Couleurs via les variables CSS
- Animations via les keyframes
- Tailles via les variables d'espacement

## Intégration

Le système est automatiquement intégré dans le layout principal (`/app/layout.jsx`) :

```javascript
<LoadingProvider>
  <Home>
    {children}
  </Home>
  <SpinLoader />
  <NavigationInterceptor />
</LoadingProvider>
```

## Debugging

Activez les logs de console pour voir le fonctionnement :

- `🔄 Navigation démarrée` - Début de navigation
- `✅ Navigation terminée` - Fin de navigation
- `❌ Erreur de navigation` - Erreur rencontrée

## Compatibilité

- **Next.js** : App Router (13+)
- **React** : 18+
- **Navigateurs** : Modernes avec fallback gracieux
- **ViewTransitions** : Chrome 111+, Safari 18+ (avec fallback)
