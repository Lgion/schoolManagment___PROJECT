// Jeux pédagogiques STATIQUES (CP1 → CE2), intégrés au code source comme prévu
// par la spec. Schéma de contenu unifié avec les jeux générés par IA :
//   { questions: [{ question, options:[String], answerIndex:Number }] }
// joués par le même composant QuizPlayer.

export const STATIC_GAMES = [
  // ---------- CP1 ----------
  {
    id: 'static-cp1-calcul',
    title: 'Additions jusqu’à 10',
    level: 'CP1',
    icon: '➕',
    type: 'STATIC',
    content: {
      questions: [
        { question: '2 + 3 = ?', options: ['4', '5', '6'], answerIndex: 1 },
        { question: '1 + 1 = ?', options: ['2', '3', '1'], answerIndex: 0 },
        { question: '4 + 5 = ?', options: ['8', '9', '10'], answerIndex: 1 },
        { question: '6 + 2 = ?', options: ['7', '8', '9'], answerIndex: 1 },
      ],
    },
  },
  {
    id: 'static-cp1-lettres',
    title: 'Quelle lettre manque ?',
    level: 'CP1',
    icon: '🔤',
    type: 'STATIC',
    content: {
      questions: [
        { question: 'A, B, _, D — quelle lettre ?', options: ['C', 'E', 'F'], answerIndex: 0 },
        { question: 'Le mot « ch_t » (animal) ?', options: ['a', 'o', 'i'], answerIndex: 0 },
        { question: 'Première lettre de « maison » ?', options: ['n', 'm', 'a'], answerIndex: 1 },
      ],
    },
  },

  // ---------- CP2 ----------
  {
    id: 'static-cp2-calcul',
    title: 'Additions jusqu’à 20',
    level: 'CP2',
    icon: '➕',
    type: 'STATIC',
    content: {
      questions: [
        { question: '12 + 5 = ?', options: ['16', '17', '18'], answerIndex: 1 },
        { question: '9 + 8 = ?', options: ['16', '17', '18'], answerIndex: 1 },
        { question: '14 + 6 = ?', options: ['19', '20', '21'], answerIndex: 1 },
        { question: '7 + 7 = ?', options: ['13', '14', '15'], answerIndex: 1 },
      ],
    },
  },
  {
    id: 'static-cp2-logique',
    title: 'Suites logiques',
    level: 'CP2',
    icon: '🧩',
    type: 'STATIC',
    content: {
      questions: [
        { question: '2, 4, 6, _ ?', options: ['7', '8', '9'], answerIndex: 1 },
        { question: '🔴🔵🔴🔵🔴 _ ?', options: ['🔴', '🔵', '🟢'], answerIndex: 1 },
        { question: '1, 3, 5, _ ?', options: ['6', '7', '8'], answerIndex: 1 },
      ],
    },
  },

  // ---------- CE1 ----------
  {
    id: 'static-ce1-calcul',
    title: 'Tables de multiplication (×2, ×3)',
    level: 'CE1',
    icon: '✖️',
    type: 'STATIC',
    content: {
      questions: [
        { question: '3 × 4 = ?', options: ['10', '12', '14'], answerIndex: 1 },
        { question: '2 × 7 = ?', options: ['12', '14', '16'], answerIndex: 1 },
        { question: '3 × 6 = ?', options: ['16', '18', '20'], answerIndex: 1 },
        { question: '2 × 9 = ?', options: ['16', '18', '20'], answerIndex: 1 },
      ],
    },
  },
  {
    id: 'static-ce1-francais',
    title: 'Le bon article (le / la)',
    level: 'CE1',
    icon: '📚',
    type: 'STATIC',
    content: {
      questions: [
        { question: '___ soleil', options: ['le', 'la'], answerIndex: 0 },
        { question: '___ lune', options: ['le', 'la'], answerIndex: 1 },
        { question: '___ maison', options: ['le', 'la'], answerIndex: 1 },
        { question: '___ chat', options: ['le', 'la'], answerIndex: 0 },
      ],
    },
  },

  // ---------- CE2 ----------
  {
    id: 'static-ce2-calcul',
    title: 'Soustractions et multiplications',
    level: 'CE2',
    icon: '🔢',
    type: 'STATIC',
    content: {
      questions: [
        { question: '45 − 18 = ?', options: ['27', '28', '37'], answerIndex: 0 },
        { question: '7 × 8 = ?', options: ['54', '56', '64'], answerIndex: 1 },
        { question: '100 − 36 = ?', options: ['64', '74', '66'], answerIndex: 0 },
        { question: '9 × 6 = ?', options: ['54', '56', '58'], answerIndex: 0 },
      ],
    },
  },
  {
    id: 'static-ce2-sciences',
    title: 'Découverte du monde',
    level: 'CE2',
    icon: '🌍',
    type: 'STATIC',
    content: {
      questions: [
        { question: 'Combien de pattes a une araignée ?', options: ['6', '8', '10'], answerIndex: 1 },
        { question: 'Quel astre éclaire la nuit ?', options: ['le soleil', 'la lune', 'la pluie'], answerIndex: 1 },
        { question: 'L’eau qui gèle devient…', options: ['de la vapeur', 'de la glace', 'du sable'], answerIndex: 1 },
      ],
    },
  },
]

// Niveaux servis par des jeux statiques (cycle des apprentissages fondamentaux).
export const STATIC_LEVELS = ['CP1', 'CP2', 'CE1', 'CE2']

// Niveaux dont le contenu est généré par IA (cycle de consolidation).
export const AI_LEVELS = ['CM1', 'CM2']

export function staticGamesForLevel(level) {
  if (!level) return STATIC_GAMES
  return STATIC_GAMES.filter((g) => g.level === level)
}

export function isAiLevel(level) {
  return AI_LEVELS.includes(level)
}
