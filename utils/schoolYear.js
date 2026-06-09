// Helpers « année scolaire ».
//
// ⚠️ Bascule de juillet uniquement (mois < 7 ⇒ année N-1/N). Les copies à
// bascule août/septembre (ex. ScheduleManager.getCurrentSchoolYears) sont
// DÉLIBÉRÉMENT distinctes : leur divergence est un bug latent connu, ne pas les
// replier ici sans décision explicite.

/**
 * Année scolaire par défaut pour les compositions d'une entité :
 * la première clé de `compositions` si elle existe, sinon l'année scolaire
 * courante calculée à la bascule de juillet, au format "YYYY-YYYY".
 */
export function getDefaultSchoolYear(compositions) {
  const keys = Object.keys(compositions || {});
  if (keys.length > 0) return keys[0];
  const now = new Date();
  return (now.getMonth() + 1) < 7
    ? (now.getFullYear() - 1) + "-" + now.getFullYear()
    : now.getFullYear() + "-" + (now.getFullYear() + 1);
}
