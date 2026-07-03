// Minimal, dependency-free Markdown → HTML converter for email bodies.
//
// Supports the subset newsletters actually need: headings, bold, italic,
// inline code, links, unordered/ordered lists, blockquotes, horizontal rules,
// and paragraphs. Raw HTML in the source is escaped first to prevent injection,
// then our own safe markup is layered on top.
//
// The output elements (h2, p, ul/ol, li, strong, a, hr.rule) map directly onto
// the styles defined in baseTemplate()'s `.body` block, so rendered campaigns
// pick up the club letterhead automatically.
//
// {{placeholder}} tags pass through untouched so per-recipient interpolation can
// run on the rendered HTML at send time.

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
}

// Apply inline markdown to an already-HTML-escaped string.
function inline(s: string): string {
  let out = s
  // links: [text](url) — allow http(s), mailto, root-relative, or a {{var}} url
  out = out.replace(/\[([^\]]+)\]\(([^)\s]+)\)/g, (_m, text: string, url: string) => {
    const safe = /^(https?:\/\/|mailto:|\/|\{\{)/.test(url) ? url : '#'
    return `<a href="${safe}">${text}</a>`
  })
  // bold before italic so ** / __ win over single markers
  out = out.replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>')
  out = out.replace(/__([^_]+)__/g, '<strong>$1</strong>')
  // italic
  out = out.replace(/(^|[^*])\*([^*\s][^*]*?)\*/g, '$1<em>$2</em>')
  out = out.replace(/(^|[^_])_([^_\s][^_]*?)_/g, '$1<em>$2</em>')
  // inline code
  out = out.replace(/`([^`]+)`/g, '<code>$1</code>')
  return out
}

export function markdownToHtml(md: string): string {
  const lines = (md ?? '').replace(/\r\n/g, '\n').split('\n')
  const blocks: string[] = []

  let para: string[] = []
  let listType: 'ul' | 'ol' | null = null
  let listItems: string[] = []
  let quote: string[] = []

  const flushPara = () => {
    if (para.length) {
      blocks.push(`<p>${inline(escapeHtml(para.join(' ')))}</p>`)
      para = []
    }
  }
  const flushList = () => {
    if (listType) {
      const items = listItems.map((li) => `<li>${inline(escapeHtml(li))}</li>`).join('')
      blocks.push(`<${listType}>${items}</${listType}>`)
      listType = null
      listItems = []
    }
  }
  const flushQuote = () => {
    if (quote.length) {
      blocks.push(`<blockquote>${inline(escapeHtml(quote.join(' ')))}</blockquote>`)
      quote = []
    }
  }
  const flushAll = () => {
    flushPara()
    flushList()
    flushQuote()
  }

  for (const raw of lines) {
    const line = raw.trimEnd()

    // blank line ends any open block
    if (!line.trim()) {
      flushAll()
      continue
    }

    // heading (# … ######)
    const heading = /^(#{1,6})\s+(.*)$/.exec(line)
    if (heading) {
      flushAll()
      const tag = heading[1].length <= 2 ? 'h2' : 'h3'
      blocks.push(`<${tag}>${inline(escapeHtml(heading[2]))}</${tag}>`)
      continue
    }

    // horizontal rule
    if (/^(-{3,}|\*{3,}|_{3,})$/.test(line.trim())) {
      flushAll()
      blocks.push('<hr class="rule" />')
      continue
    }

    // blockquote
    const bq = /^>\s?(.*)$/.exec(line)
    if (bq) {
      flushPara()
      flushList()
      quote.push(bq[1])
      continue
    }

    // unordered list item
    const ul = /^[-*+]\s+(.*)$/.exec(line)
    if (ul) {
      flushPara()
      flushQuote()
      if (listType !== 'ul') {
        flushList()
        listType = 'ul'
      }
      listItems.push(ul[1])
      continue
    }

    // ordered list item
    const ol = /^\d+\.\s+(.*)$/.exec(line)
    if (ol) {
      flushPara()
      flushQuote()
      if (listType !== 'ol') {
        flushList()
        listType = 'ol'
      }
      listItems.push(ol[1])
      continue
    }

    // otherwise, part of a paragraph
    flushList()
    flushQuote()
    para.push(line.trim())
  }

  flushAll()
  return blocks.join('\n')
}
