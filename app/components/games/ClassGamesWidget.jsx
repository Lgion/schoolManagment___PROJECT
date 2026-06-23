"use client";

import GamesCatalog from './GamesCatalog';

/**
 * Bloc « Jeux pédagogiques » d'une classe : catalogue filtré sur le niveau de la
 * classe. Pour CM1/CM2, le bouton de génération IA n'apparaît que si canManage.
 * Props : { classe, canManage }
 */
export default function ClassGamesWidget({ classe, canManage = false }) {
  if (!classe?.niveau) return <p className="games__hint">Niveau de classe inconnu.</p>;
  return (
    <GamesCatalog level={classe.niveau} classId={classe._id} canGenerate={canManage} />
  );
}
