// Génération du PDF d'un bulletin (côté client, jsPDF + autotable).
// Le PDF est reproduit à la demande à partir d'un ReportCard figé : pas de stockage.
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { PERIOD_LABELS } from '../../../utils/bulletins';

const fmt = (n) => (n == null ? '—' : Number(n).toFixed(2));

/**
 * Construit et télécharge le bulletin PDF d'un élève.
 * @param card  document ReportCard figé
 * @param meta  { studentName, className }
 */
export function downloadBulletinPdf(card, meta = {}) {
  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.getWidth();

  // En-tête
  doc.setFontSize(16);
  doc.text('Bulletin scolaire', pageWidth / 2, 18, { align: 'center' });
  doc.setFontSize(11);
  doc.text(PERIOD_LABELS[card.period] || card.period, pageWidth / 2, 25, { align: 'center' });

  doc.setFontSize(10);
  const left = 14;
  let y = 36;
  doc.text(`Élève : ${meta.studentName || ''}`, left, y);
  doc.text(`Année : ${card.schoolYear || ''}`, pageWidth - left, y, { align: 'right' });
  y += 6;
  if (meta.className) doc.text(`Classe : ${meta.className}`, left, y);
  if (card.rank && card.classSize) {
    doc.text(`Rang : ${card.rank} / ${card.classSize}`, pageWidth - left, y, { align: 'right' });
  }

  // Tableau des matières
  autoTable(doc, {
    startY: y + 6,
    head: [['Matière', 'Moyenne /20', 'Moy. classe', 'Appréciation']],
    body: (card.subjects || []).map((s) => [
      s.name || s.key,
      fmt(s.average),
      fmt(s.classAverage),
      s.appreciation || '',
    ]),
    styles: { fontSize: 9, cellPadding: 2 },
    headStyles: { fillColor: [30, 58, 138] },
    columnStyles: { 1: { halign: 'center' }, 2: { halign: 'center' } },
  });

  let afterY = (doc.lastAutoTable?.finalY || y + 20) + 10;

  // Synthèse
  doc.setFontSize(11);
  doc.text(`Moyenne générale : ${fmt(card.globalAverage)} / 20`, left, afterY);
  if (card.classGeneralAverage != null) {
    doc.setFontSize(9);
    doc.text(`(moyenne de la classe : ${fmt(card.classGeneralAverage)})`, left, afterY + 5);
  }
  if (card.mention) {
    doc.setFontSize(10);
    doc.text(`Mention : ${card.mention}`, pageWidth - left, afterY, { align: 'right' });
  }

  // Appréciation générale
  if (card.generalAppreciation) {
    afterY += 14;
    doc.setFontSize(10);
    doc.text('Appréciation générale :', left, afterY);
    afterY += 5;
    doc.setFontSize(9);
    const wrapped = doc.splitTextToSize(card.generalAppreciation, pageWidth - left * 2);
    doc.text(wrapped, left, afterY);
  }

  const safeName = (meta.studentName || 'eleve').replace(/[^a-zA-Z0-9_-]+/g, '_');
  doc.save(`Bulletin_${safeName}_${card.period}_${card.schoolYear}.pdf`);
}
