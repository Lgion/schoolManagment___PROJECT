
export default async function Page({children}) {
    return <>
    <h2>
        École Martin de Porres : Amour, Partage, Confiance.
    </h2>
    <p>
      Nichée au cœur du paisible domaine de Bolobi, l'École Martin de Porres est une œuvre caritative lumineuse qui allie foi et éducation. Situé sur un vaste terrain de 18 hectares, ce lieu unique abrite à la fois un sanctuaire marial chrétien et une petite exploitation agropastorale. C'est dans cet environnement que l'école, lancée en 2021, s'efforce de donner un avenir aux enfants des campements isolés.
    </p>
    <p>
      Avant l'ouverture de l'école, ces enfants étaient confrontés à l'exclusion géographique, les privant de toute chance de scolarisation. Aujourd'hui, l'École Martin de Porres leur offre un enseignement primaire de qualité et gère également un internat pour ceux qui vivent le plus loin.
    </p>
    <p>
      Inspirée par l'esprit de charité de son saint patron, Saint Martin de Porres, l'école est au centre d'un projet ambitieux. Les frais de fonctionnement sont élevés, et Bolobi cherche à rendre l'ensemble du projet autosuffisant. L'objectif est de perpétuer cette mission de solidarité, en veillant à ce que la générosité et l'éducation restent au cœur de ce lieu d'espoir.
    </p>
    <picture>
        {/* <source type="image/webp" srcSet="/ecole_testes/photo.webp" /> */}
        <source type="image/jpeg" srcSet="/ecole_testes/photo.jpg" />
        <img style={{"width":"100%"}} src="/ecole_testes/photo.jpg" alt="Photo de l'École Martin de Porres" loading="lazy" />
    </picture>
    

    {children}
    </>;
}