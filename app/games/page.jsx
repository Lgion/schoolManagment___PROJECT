"use client"

import GamesCatalog from '../components/games/GamesCatalog'
import { useUserRole } from '../../stores/useUserRole'

export default function GamesPage() {
  const { userRole } = useUserRole()
  const canGenerate = ['admin', 'prof'].includes(userRole)

  return (
    <div className="games-page" style={{ maxWidth: '1000px', margin: '0 auto', padding: '1rem' }}>
      <div style={{ marginBottom: '1.5rem' }}>
        <h1 style={{ fontSize: '2rem', color: '#2c3e50', marginBottom: '0.5rem' }}>🎮 Jeux pédagogiques</h1>
        <p style={{ color: '#7f8c8d', fontSize: '1.05rem' }}>
          Des jeux et quiz adaptés à chaque niveau. Accès libre à tous. Pour les CM1/CM2,
          les enseignants peuvent générer des jeux à partir d'un PDF de cours.
        </p>
      </div>

      <GamesCatalog canGenerate={canGenerate} />
    </div>
  )
}
