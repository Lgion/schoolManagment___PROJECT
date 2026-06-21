import jsPDF from 'jspdf'

// Convertit une URL d'image en base64 pour jsPDF sans blocage CORS
const toBase64 = async (url) => {
  if (!url) return ''
  try {
    // Si c'est déjà du base64 ou une image locale sans protocole complet, l'utiliser directement
    if (url.startsWith('data:')) return url

    const res = await fetch(url)
    const blob = await res.blob()
    return new Promise((resolve) => {
      const reader = new FileReader()
      reader.onloadend = () => resolve(reader.result)
      reader.onerror = () => resolve('')
      reader.readAsDataURL(blob)
    })
  } catch (err) {
    console.error('⚠️ Impossible de charger la photo pour le PDF:', url, err)
    return ''
  }
}

/**
 * Génère le fichier PDF du Livre de classe.
 * @param {Object} classBook - Document ClassBook (titre, année, couverture)
 * @param {Object} classe - Classe concernée (niveau, alias)
 * @param {Array} students - Liste des élèves de la classe
 * @param {Array} photos - Tableau d'objets ClassMedia (url, tags, caption, inClassBook)
 * @param {String} targetStudentId - Optionnel. Si défini, génère la version personnalisée pour cet élève.
 * @returns {jsPDF} instance jsPDF prête à être sauvegardée ou téléversée
 */
export async function generateClassBookPdf({ classBook, classe, students, photos, targetStudentId = '' }) {
  // A4 Paysage: 297mm x 210mm
  const doc = new jsPDF({
    orientation: 'landscape',
    unit: 'mm',
    format: 'a4'
  })

  const width = doc.internal.pageSize.getWidth() // 297
  const height = doc.internal.pageSize.getHeight() // 210
  const margin = 15

  // 1. PAGE DE GARDE (Couverture)
  // Fond bicolore ou dégradé
  doc.setFillColor(248, 250, 252) // Slate 50
  doc.rect(0, 0, width, height, 'F')
  
  // Bandeau supérieur de couleur
  doc.setFillColor(30, 58, 138) // Deep Blue (Primary)
  doc.rect(0, 0, width, 45, 'F')

  // Titre principal
  doc.setTextColor(255, 255, 255)
  doc.setFontSize(26)
  doc.setFont('helvetica', 'bold')
  doc.text(classBook.title || 'LIVRE DE CLASSE', width / 2, 22, { align: 'center' })

  // Sous-titre
  doc.setFontSize(14)
  doc.setFont('helvetica', 'normal')
  doc.text(`Année scolaire ${classBook.schoolYear} · École St Martin`, width / 2, 34, { align: 'center' })

  // Image de couverture
  const coverUrl = classBook.coverImage || classe.photo || '/school/classe.webp'
  const coverBase64 = await toBase64(coverUrl)
  if (coverBase64) {
    const imgWidth = 140
    const imgHeight = 90
    const x = (width - imgWidth) / 2
    const y = 60
    
    // Bordure premium pour la photo de couverture
    doc.setDrawColor(234, 179, 8) // Gold
    doc.setLineWidth(1.5)
    doc.rect(x - 2, y - 2, imgWidth + 4, imgHeight + 4, 'D')
    
    doc.addImage(coverBase64, 'JPEG', x, y, imgWidth, imgHeight)
  }

  // Petit message personnalisé sur la couverture si c'est la version élève
  if (targetStudentId) {
    const targetStudent = students.find(s => String(s._id) === String(targetStudentId))
    if (targetStudent) {
      const studentName = `${targetStudent.nom} ${Array.isArray(targetStudent.prenoms) ? targetStudent.prenoms.join(' ') : targetStudent.prenoms}`
      doc.setFillColor(234, 179, 8) // Gold
      doc.rect(width / 2 - 60, height - 42, 120, 10, 'F')
      doc.setTextColor(30, 58, 138)
      doc.setFontSize(11)
      doc.setFont('helvetica', 'bold')
      doc.text(`Album souvenir de : ${studentName}`, width / 2, height - 35, { align: 'center' })
    }
  }

  // Signature
  doc.setTextColor(100, 116, 139)
  doc.setFontSize(9)
  doc.setFont('helvetica', 'italic')
  doc.text('Imprimé avec amour par l\'application School Management', width / 2, height - 12, { align: 'center' })

  // 2. PAGE 2 : TROMBINOSCOPE ("Nos copains de classe")
  doc.addPage()
  doc.setFillColor(248, 250, 252)
  doc.rect(0, 0, width, height, 'F')

  // Titre de la page
  doc.setFillColor(30, 58, 138)
  doc.rect(0, 0, width, 18, 'F')
  doc.setTextColor(255, 255, 255)
  doc.setFontSize(14)
  doc.setFont('helvetica', 'bold')
  doc.text('Nos Camarades de Classe', width / 2, 12, { align: 'center' })

  // Grid des élèves : 6 colonnes, max 5 lignes
  const cols = 6
  const itemW = 38
  const itemH = 32
  const startX = (width - (cols * itemW)) / 2
  const startY = 30
  const gapX = 4
  const gapY = 4

  for (let i = 0; i < students.length; i++) {
    const student = students[i]
    const row = Math.floor(i / cols)
    const col = i % cols
    const x = startX + col * (itemW + gapX)
    const y = startY + row * (itemH + gapY)

    // Si on dépasse la hauteur de page possible, on pourrait ajouter une autre page,
    // mais dans les classes de primaire, on a rarement plus de 30 élèves (6x5).
    if (y + itemH > height - 10) break

    // Photo de profil
    const avatarUrl = student.photo_$_file || '/school/student.webp'
    const avatarBase64 = await toBase64(avatarUrl)
    
    // Cadre élève
    doc.setFillColor(255, 255, 255)
    doc.setDrawColor(226, 232, 240)
    doc.setLineWidth(0.5)
    doc.rect(x, y, itemW, itemH, 'FD')

    if (avatarBase64) {
      doc.addImage(avatarBase64, 'JPEG', x + 9, y + 2, 20, 20)
    }

    // Nom de l'élève
    doc.setTextColor(51, 65, 85)
    doc.setFontSize(8)
    doc.setFont('helvetica', 'bold')
    const firstName = Array.isArray(student.prenoms) ? student.prenoms[0] : student.prenoms
    const displayName = `${student.nom} ${firstName}`
    const truncatedName = displayName.length > 20 ? displayName.substring(0, 18) + '...' : displayName
    doc.text(truncatedName, x + itemW / 2, y + 28, { align: 'center' })
  }

  // 3. SECTION PERSONNALISÉE : "Mes moments forts !" (Seulement pour la version élève)
  let studentPhotos = []
  if (targetStudentId) {
    // Filtrer les photos où l'élève est tagué
    studentPhotos = photos.filter(p => p.tags.some(t => String(t._id || t) === String(targetStudentId)))
    
    if (studentPhotos.length > 0) {
      doc.addPage()
      doc.setFillColor(248, 250, 252)
      doc.rect(0, 0, width, height, 'F')

      // Titre moments forts
      doc.setFillColor(234, 179, 8) // Accent Gold
      doc.rect(0, 0, width, 18, 'F')
      doc.setTextColor(30, 58, 138)
      doc.setFontSize(14)
      doc.setFont('helvetica', 'bold')
      doc.text('Mes moments forts de l\'année ! 🌟', width / 2, 12, { align: 'center' })

      // Afficher les photos de l'élève
      // On affiche 2 photos par page
      let idx = 0
      for (const photo of studentPhotos) {
        if (idx > 0 && idx % 2 === 0) {
          doc.addPage()
          doc.setFillColor(248, 250, 252)
          doc.rect(0, 0, width, height, 'F')
          
          doc.setFillColor(234, 179, 8)
          doc.rect(0, 0, width, 18, 'F')
          doc.setTextColor(30, 58, 138)
          doc.setFontSize(14)
          doc.setFont('helvetica', 'bold')
          doc.text('Mes moments forts de l\'année ! 🌟 (Suite)', width / 2, 12, { align: 'center' })
        }

        const isLeft = idx % 2 === 0
        const px = isLeft ? margin : width / 2 + gapX
        const py = 30
        const pW = 125
        const pH = 90

        const imgBase = await toBase64(photo.url)
        if (imgBase) {
          // Cadre photo
          doc.setDrawColor(203, 213, 225)
          doc.setLineWidth(1)
          doc.rect(px - 1, py - 1, pW + 2, pH + 2, 'D')
          doc.addImage(imgBase, 'JPEG', px, py, pW, pH)
          
          // Légende
          doc.setFontSize(9)
          doc.setTextColor(51, 65, 85)
          doc.setFont('helvetica', 'bold')
          const captionText = photo.caption || 'Instantané de classe'
          doc.text(captionText, px, py + pH + 6)

          // Tags
          doc.setFontSize(8)
          doc.setTextColor(100, 116, 139)
          doc.setFont('helvetica', 'normal')
          const tagNames = photo.tags.map(t => `${t.prenoms ? (Array.isArray(t.prenoms) ? t.prenoms[0] : t.prenoms) : ''}`).filter(n => n !== '').join(', ')
          if (tagNames) {
            doc.text(`Présents : ${tagNames}`, px, py + pH + 12)
          }
        }
        idx++
      }
    }
  }

  // 4. GALERIE PHOTO GLOBALE DE LA CLASSE (Photos où inClassBook === true)
  const globalPhotos = photos.filter(p => p.inClassBook === true)
  
  if (globalPhotos.length > 0) {
    let idx = 0
    for (const photo of globalPhotos) {
      if (idx % 2 === 0) {
        doc.addPage()
        doc.setFillColor(248, 250, 252)
        doc.rect(0, 0, width, height, 'F')
        
        doc.setFillColor(30, 58, 138)
        doc.rect(0, 0, width, 18, 'F')
        doc.setTextColor(255, 255, 255)
        doc.setFontSize(14)
        doc.setFont('helvetica', 'bold')
        doc.text('Notre Vie de Classe', width / 2, 12, { align: 'center' })
      }

      const isLeft = idx % 2 === 0
      const px = isLeft ? margin : width / 2 + gapX
      const py = 30
      const pW = 125
      const pH = 90

      const imgBase = await toBase64(photo.url)
      if (imgBase) {
        doc.setDrawColor(203, 213, 225)
        doc.setLineWidth(1)
        doc.rect(px - 1, py - 1, pW + 2, pH + 2, 'D')
        doc.addImage(imgBase, 'JPEG', px, py, pW, pH)
        
        // Légende
        doc.setFontSize(9)
        doc.setTextColor(51, 65, 85)
        doc.setFont('helvetica', 'bold')
        const captionText = photo.caption || 'Instantané de classe'
        doc.text(captionText, px, py + pH + 6)

        // Tags
        doc.setFontSize(8)
        doc.setTextColor(100, 116, 139)
        doc.setFont('helvetica', 'normal')
        const tagNames = photo.tags.map(t => `${t.prenoms ? (Array.isArray(t.prenoms) ? t.prenoms[0] : t.prenoms) : ''}`).filter(n => n !== '').join(', ')
        if (tagNames) {
          doc.text(`Présents : ${tagNames}`, px, py + pH + 12)
        }
      }
      idx++
    }
  }

  // Numérotation des pages (sauf page de couverture)
  const pageCount = doc.internal.getNumberOfPages()
  for (let i = 2; i <= pageCount; i++) {
    doc.setPage(i)
    doc.setTextColor(148, 163, 184)
    doc.setFontSize(8)
    doc.setFont('helvetica', 'normal')
    doc.text(`Page ${i} / ${pageCount}`, width - margin, height - 8, { align: 'right' })
  }

  return doc
}
