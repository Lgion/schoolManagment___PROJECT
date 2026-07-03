"use client"

import Link from 'next/link';

export default function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="ecole-footer">
      <div className="ecole-footer__container">
        {/* Colonne 1 : Branding */}
        <div className="ecole-footer__column ecole-footer__column--brand">
          <div className="ecole-footer__branding">
            <img src="/logo.png" alt="Logo École" className="ecole-footer__logo" />
            <div>
              <h3 className="ecole-footer__title">École Martin de Porres</h3>
              <p className="ecole-footer__slogan">Savoir, Vertu, Excellence</p>
            </div>
          </div>
          <p className="ecole-footer__description">
            Un espace éducatif moderne dédié au développement intellectuel et moral de chaque élève, alliant tradition et innovation pédagogique.
          </p>
        </div>

        {/* Colonne 2 : Liens Rapides */}
        <div className="ecole-footer__column ecole-footer__column--links">
          <h4 className="ecole-footer__heading">Navigation</h4>
          <ul className="ecole-footer__links-list">
            <li>
              <Link href="/">
                <i className="fas fa-chevron-right ecole-footer__link-icon"></i> Accueil
              </Link>
            </li>
            <li>
              <Link href="/blog">
                <i className="fas fa-chevron-right ecole-footer__link-icon"></i> Actualités & Blog
              </Link>
            </li>
            <li>
              <Link href="/groups">
                <i className="fas fa-chevron-right ecole-footer__link-icon"></i> Messagerie & Groupes
              </Link>
            </li>
            <li>
              <Link href="/games">
                <i className="fas fa-chevron-right ecole-footer__link-icon"></i> Jeux Pédagogiques
              </Link>
            </li>
            <li>
              <Link href="/gallery">
                <i className="fas fa-chevron-right ecole-footer__link-icon"></i> Galerie
              </Link>
            </li>
          </ul>
        </div>

        {/* Colonne 3 : Contacts */}
        <div className="ecole-footer__column ecole-footer__column--contact">
          <h4 className="ecole-footer__heading">Nous Contacter</h4>
          <ul className="ecole-footer__contact-list">
            <li>
              <i className="fas fa-map-marker-alt ecole-footer__contact-icon"></i>
              <span>Abidjan, Côte d'Ivoire</span>
            </li>
            <li>
              <i className="fas fa-phone ecole-footer__contact-icon"></i>
              <a href="tel:+2250704763132">+225 07 04 76 31 32</a>
            </li>
            <li>
              <i className="fas fa-envelope ecole-footer__contact-icon"></i>
              <a href="mailto:sanctuaire.rosaire.bolobi@gmail.com">sanctuaire.rosaire.bolobi@gmail.com</a>
            </li>
          </ul>
          <div className="ecole-footer__socials">
            <a href="#" className="ecole-footer__social-btn" aria-label="Facebook">
              <i className="fab fa-facebook-f"></i>
            </a>
            <a href="#" className="ecole-footer__social-btn" aria-label="Twitter">
              <i className="fab fa-twitter"></i>
            </a>
            <a href="#" className="ecole-footer__social-btn" aria-label="YouTube">
              <i className="fab fa-youtube"></i>
            </a>
          </div>
        </div>
      </div>

      <div className="ecole-footer__bottom">
        <div className="ecole-footer__bottom-container">
          <p className="ecole-footer__copy">
            &copy; {currentYear} École Saint Martin de Porres. Tous droits réservés.
          </p>
          <div className="ecole-footer__bottom-links">
            <a href="#">Mentions Légales</a>
            <span className="ecole-footer__separator">|</span>
            <a href="#">Confidentialité</a>
          </div>
        </div>
      </div>
    </footer>
  );
}
