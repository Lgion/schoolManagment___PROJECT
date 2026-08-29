import Link from 'next/link';

// Carte « personne » cliquable des pages détail (avatar image + nom + rôle).
// Utilisée pour les élèves et enseignants d'une classe.
export function PersonDetailCard({ href, imgSrc, fallbackSrc, alt, name, role }) {
  return (
    <Link href={href} className="person-detail__card">
      <div className="person-detail__card-avatar">
        <img src={imgSrc} alt={alt} onError={(e) => { e.target.src = fallbackSrc; }} />
      </div>
      <div className="person-detail__card-content">
        <h3 className="person-detail__card-name">{name}</h3>
        <p className="person-detail__card-role">{role}</p>
      </div>
    </Link>
  );
}

// État vide d'un bloc de page détail (icône + message).
export function DetailEmpty({ icon, text }) {
  return (
    <div className="person-detail__empty">
      <div className="person-detail__empty-icon">{icon}</div>
      <p className="person-detail__empty-text">{text}</p>
    </div>
  );
}
