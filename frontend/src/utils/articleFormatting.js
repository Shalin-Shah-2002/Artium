const INLINE_PATTERN = /(\*\*[^*]+\*\*|__[^_]+__|\*[^*]+\*|_[^_]+_)/g;

const normalizeNewlines = (text = '') => text.replace(/\r\n|\r/g, '\n');

const escapeHtml = (value = '') =>
  value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');

const escapeForYaml = (value = '') => value.replace(/"/g, '\\"');

const parseInlineSegments = (text) => {
  if (!text) {
    return [];
  }

  const segments = [];
  let lastIndex = 0;
  let match;

  INLINE_PATTERN.lastIndex = 0;
  while ((match = INLINE_PATTERN.exec(text)) !== null) {
    if (match.index > lastIndex) {
      segments.push({ type: 'text', value: text.slice(lastIndex, match.index) });
    }

    const token = match[0];
    const isBold = token.startsWith('**') || token.startsWith('__');
    const content = token.slice(isBold ? 2 : 1, isBold ? -2 : -1);
    segments.push({ type: isBold ? 'strong' : 'em', value: content });
    lastIndex = match.index + token.length;
  }

  if (lastIndex < text.length) {
    segments.push({ type: 'text', value: text.slice(lastIndex) });
  }

  return segments;
};

export const parseContentBlocks = (content) => {
  const normalized = normalizeNewlines(content);
  const lines = normalized.split('\n');
  const blocks = [];
  let paragraphBuffer = [];
  let listBuffer = null; // { type: 'ul' | 'ol', items: [segments[]] }

  const flushParagraph = () => {
    if (paragraphBuffer.length === 0) {
      return;
    }
    const paragraphText = paragraphBuffer.join(' ');
    blocks.push({ type: 'paragraph', segments: parseInlineSegments(paragraphText) });
    paragraphBuffer = [];
  };

  const flushList = () => {
    if (!listBuffer) {
      return;
    }
    blocks.push(listBuffer);
    listBuffer = null;
  };

  lines.forEach((rawLine) => {
    const trimmed = rawLine.trim();

    if (!trimmed) {
      flushParagraph();
      flushList();
      return;
    }

    const bulletMatch = trimmed.match(/^[-*]\s+(.*)$/);
    const numberedMatch = trimmed.match(/^(\d+)[.)]\s+(.*)$/);

    if (bulletMatch || numberedMatch) {
      flushParagraph();
      const listType = numberedMatch ? 'ol' : 'ul';
      if (!listBuffer || listBuffer.type !== listType) {
        flushList();
        listBuffer = { type: listType, items: [] };
      }
      const itemText = bulletMatch ? bulletMatch[1] : numberedMatch[2];
      listBuffer.items.push(parseInlineSegments(itemText));
      return;
    }

    flushList();
    paragraphBuffer.push(trimmed);
  });

  flushParagraph();
  flushList();

  return blocks;
};

const inlineSegmentsToMarkdown = (segments) =>
  segments
    .map((segment) => {
      if (segment.type === 'strong') {
        return `**${segment.value}**`;
      }
      if (segment.type === 'em') {
        return `_${segment.value}_`;
      }
      return segment.value;
    })
    .join('');

const inlineSegmentsToHtml = (segments) =>
  segments
    .map((segment) => {
      if (segment.type === 'strong') {
        return `<strong>${escapeHtml(segment.value)}</strong>`;
      }
      if (segment.type === 'em') {
        return `<em>${escapeHtml(segment.value)}</em>`;
      }
      return escapeHtml(segment.value);
    })
    .join('');

export const buildMarkdownFromArticle = (article) => {
  if (!article) {
    return '';
  }

  const tags = Array.isArray(article.tags) ? article.tags : [];
  const safeTitle = article.title || 'Untitled';
  let markdown = '---\n';
  markdown += `title: "${escapeForYaml(safeTitle)}"\n`;
  markdown += `tags: [${tags.map((tag) => `"${escapeForYaml(tag)}"`).join(', ')}]\n`;
  markdown += '---\n\n';
  markdown += `# ${safeTitle}\n\n`;

  (article.sections || []).forEach((section) => {
    if (!section) {
      return;
    }

    const heading = section.heading || 'Section';
    markdown += `## ${heading}\n\n`;

    const blocks = parseContentBlocks(section.content || '');
    blocks.forEach((block) => {
      if (block.type === 'paragraph') {
        markdown += `${inlineSegmentsToMarkdown(block.segments)}\n\n`;
        return;
      }

      if (block.type === 'ul') {
        block.items.forEach((itemSegments) => {
          markdown += `- ${inlineSegmentsToMarkdown(itemSegments)}\n`;
        });
        markdown += '\n';
        return;
      }

      if (block.type === 'ol') {
        block.items.forEach((itemSegments, index) => {
          markdown += `${index + 1}. ${inlineSegmentsToMarkdown(itemSegments)}\n`;
        });
        markdown += '\n';
      }
    });
  });

  return markdown.trimEnd();
};

export const buildHtmlFromArticle = (article) => {
  if (!article) {
    return '';
  }

  const safeTitle = article.title || 'Untitled';
  const parts = ['<article class="medium-export">'];
  parts.push(`<h1>${escapeHtml(safeTitle)}</h1>`);

  (article.sections || []).forEach((section) => {
    if (!section) {
      return;
    }

    const heading = section.heading || 'Section';
    parts.push('<section>');
    parts.push(`<h2>${escapeHtml(heading)}</h2>`);

    const blocks = parseContentBlocks(section.content || '');
    blocks.forEach((block) => {
      if (block.type === 'paragraph') {
        parts.push(`<p>${inlineSegmentsToHtml(block.segments)}</p>`);
        return;
      }

      if (block.type === 'ul') {
        parts.push('<ul>');
        block.items.forEach((itemSegments) => {
          parts.push(`<li>${inlineSegmentsToHtml(itemSegments)}</li>`);
        });
        parts.push('</ul>');
        return;
      }

      if (block.type === 'ol') {
        parts.push('<ol>');
        block.items.forEach((itemSegments) => {
          parts.push(`<li>${inlineSegmentsToHtml(itemSegments)}</li>`);
        });
        parts.push('</ol>');
      }
    });

    parts.push('</section>');
  });

  parts.push('</article>');
  return parts.join('');
};

