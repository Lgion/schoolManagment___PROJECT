'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

export default function ReloadLSPage() {
  const router = useRouter();
  const [etat, setEtat] = useState("🗑️ Nettoyage du localStorage...")

  useEffect(() => {
    // Vider complètement le localStorage
    localStorage.clear();
    
    console.log('🗑️ localStorage vidé complètement');
    setEtat('🗑️ localStorage vidé complètement')
    // Rediriger vers la page d'accueil
    router.push('/');
  });

  return (
    <div style={{
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      height: '100vh',
      flexDirection: 'column',
      fontFamily: 'Arial, sans-serif'
    }}>
      <div style={{
        fontSize: '24px',
        marginBottom: '20px'
      }}>
        {etat}
      </div>
      <div style={{
        fontSize: '16px',
        color: '#666'
      }}>
        Redirection en cours...
      </div>
    </div>
  );
}
