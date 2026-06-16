// Paliers / récompenses du système de bons points.
// Des seuils débloquent des badges visuels pour l'élève (gamification — spec §4).

export const PALIERS = [
  { threshold: 10, name: 'Bronze', icon: '🥉' },
  { threshold: 20, name: 'Argent', icon: '🥈' },
  { threshold: 40, name: 'Or', icon: '🥇' },
  { threshold: 75, name: 'Champion', icon: '🏆' },
  { threshold: 100, name: 'Légende', icon: '🌟' },
];

/**
 * État des paliers pour un solde donné.
 * @returns { unlocked, current, next, progress (0..1 vers le prochain palier) }
 */
export function getPalierState(balance) {
  const b = Math.max(0, balance || 0);
  const unlocked = PALIERS.filter(p => b >= p.threshold);
  const current = unlocked.length ? unlocked[unlocked.length - 1] : null;
  const next = PALIERS.find(p => b < p.threshold) || null;
  const floor = current ? current.threshold : 0;
  const ceil = next ? next.threshold : floor;
  const progress = next ? Math.max(0, Math.min(1, (b - floor) / (ceil - floor))) : 1;
  return { unlocked, current, next, progress };
}
