// Rendeur Markdown minimal et SÛR (sans dépendance).
// On échappe d'abord tout le HTML, puis on réintroduit nos propres balises
// pour un sous-ensemble Markdown → aucune injection HTML/JS possible.

function escapeHtml(s) {
  return String(s)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
}

function inline(s) {
  let out = s
  out = out.replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>')
  out = out.replace(/(^|[^*])\*([^*\n]+)\*/g, '$1<em>$2</em>')
  out = out.replace(/`([^`]+)`/g, '<code>$1</code>')
  // Liens [texte](url) — uniquement http(s), mailto ou chemin interne.
  out = out.replace(/\[([^\]]+)\]\(([^)\s]+)\)/g, (m, text, url) =>
    /^(https?:|mailto:|\/)/i.test(url)
      ? `<a href="${url}" target="_blank" rel="noopener noreferrer">${text}</a>`
      : text
  )
  return out
}

export function renderMarkdownToHtml(md) {
  if (!md) return ''
  const lines = escapeHtml(md).split(/\r?\n/)
  const out = []
  let listType = null
  let paraBuf = []

  const flushPara = () => {
    if (paraBuf.length) {
      out.push('<p>' + inline(paraBuf.join(' ')) + '</p>')
      paraBuf = []
    }
  }
  const closeList = () => {
    if (listType) {
      out.push(`</${listType}>`)
      listType = null
    }
  }

  for (const raw of lines) {
    const line = raw.trim()
    if (!line) { flushPara(); closeList(); continue }
    let m
    if ((m = line.match(/^(#{1,3})\s+(.*)$/))) {
      flushPara(); closeList()
      const lvl = m[1].length
      out.push(`<h${lvl}>${inline(m[2])}</h${lvl}>`)
    } else if ((m = line.match(/^&gt;\s?(.*)$/))) {
      // '>' a été échappé en '&gt;'
      flushPara(); closeList()
      out.push(`<blockquote>${inline(m[1])}</blockquote>`)
    } else if ((m = line.match(/^[-*]\s+(.*)$/))) {
      flushPara()
      if (listType !== 'ul') { closeList(); out.push('<ul>'); listType = 'ul' }
      out.push(`<li>${inline(m[1])}</li>`)
    } else if ((m = line.match(/^\d+\.\s+(.*)$/))) {
      flushPara()
      if (listType !== 'ol') { closeList(); out.push('<ol>'); listType = 'ol' }
      out.push(`<li>${inline(m[1])}</li>`)
    } else {
      paraBuf.push(line)
    }
  }
  flushPara(); closeList()
  return out.join('\n')
}

// Résumé en texte brut (cartes) : retire les marqueurs Markdown puis tronque.
export function excerpt(md, max = 160) {
  if (!md) return ''
  const plain = String(md)
    .replace(/[#>*`_]/g, '')
    .replace(/\[([^\]]+)\]\([^)]*\)/g, '$1')
    .replace(/\s+/g, ' ')
    .trim()
  return plain.length > max ? plain.slice(0, max - 1) + '…' : plain
}
