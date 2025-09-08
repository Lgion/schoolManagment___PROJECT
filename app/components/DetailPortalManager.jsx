"use client"

import { useDetailPortal } from '../../stores/useDetailPortal';
import DetailPortal from './DetailPortal';
import EnseignantDetailContent from './EnseignantDetailContent';
import EleveDetailContent from './EleveDetailContent';
import ClasseDetailContent from './ClasseDetailContent';

/**
 * Gestionnaire central des portails de détail
 * Affiche le contenu approprié selon le type d'entité
 */
export default function DetailPortalManager() {
  const { portalState, closePortal } = useDetailPortal();

  const renderContent = () => {
    if (!portalState.isOpen || !portalState.entityId) return null;
    
    switch (portalState.type) {
      case 'enseignant':
        return <EnseignantDetailContent entityId={portalState.entityId} />;
      case 'eleve':
        return <EleveDetailContent entityId={portalState.entityId} />;
      case 'classe':
        return <ClasseDetailContent entityId={portalState.entityId} />;
      default:
        return <div>Type non supporté: {portalState.type}</div>;
    }
  };

  return (
    <DetailPortal
      isOpen={portalState.isOpen}
      onClose={closePortal}
      title={portalState.title}
      icon={portalState.icon}
    >
      {renderContent()}
    </DetailPortal>
  );
}
