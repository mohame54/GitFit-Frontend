export type Inline =
  | { type: 'text'; text: string }
  | { type: 'break' }
  | { type: 'bold'; children: Inline[] }
  | { type: 'italic'; children: Inline[] }
  | { type: 'code'; text: string }
  | { type: 'link'; href: string; children: Inline[] };

export type Block =
  | { type: 'paragraph'; children: Inline[] }
  | { type: 'heading'; children: Inline[] }
  | { type: 'list'; ordered: boolean; items: Inline[][] }
  | { type: 'code'; text: string };

function parseInlines(input: string): Inline[] {
  const nodes: Inline[] = [];
  let buffer = '';
  let i = 0;

  const flush = () => {
    if (!buffer) return;
    nodes.push({ type: 'text', text: buffer });
    buffer = '';
  };

  while (i < input.length) {
    if (input[i] === '`') {
      const end = input.indexOf('`', i + 1);
      if (end > i + 1 && !input.slice(i + 1, end).includes('\n')) {
        flush();
        nodes.push({ type: 'code', text: input.slice(i + 1, end) });
        i = end + 1;
        continue;
      }
    }

    if (input.startsWith('**', i) || input.startsWith('__', i)) {
      const marker = input.slice(i, i + 2);
      const end = input.indexOf(marker, i + 2);
      if (end !== -1 && !input.slice(i + 2, end).includes('\n')) {
        flush();
        nodes.push({
          type: 'bold',
          children: parseInlines(input.slice(i + 2, end)),
        });
        i = end + 2;
        continue;
      }
    }

    if (input[i] === '[') {
      const labelEnd = input.indexOf(']', i + 1);
      if (
        labelEnd !== -1 &&
        input[labelEnd + 1] === '(' &&
        !input.slice(i + 1, labelEnd).includes('\n')
      ) {
        const hrefEnd = input.indexOf(')', labelEnd + 2);
        const href = hrefEnd === -1 ? '' : input.slice(labelEnd + 2, hrefEnd);
        if (hrefEnd !== -1 && /^https?:\/\//i.test(href)) {
          flush();
          nodes.push({
            type: 'link',
            href,
            children: parseInlines(input.slice(i + 1, labelEnd)),
          });
          i = hrefEnd + 1;
          continue;
        }
      }
    }

    if (
      (input[i] === '*' || input[i] === '_') &&
      input[i + 1] !== input[i] &&
      input[i + 1] !== ' ' &&
      input[i + 1] !== undefined
    ) {
      const marker = input[i];
      const closing = findClosingMarker(input, i + 1, marker);
      const before = i === 0 ? '' : input[i - 1];
      const after = closing === -1 ? '' : input[closing + 1] ?? '';
      const boundaryOk =
        marker === '*' ||
        ((before === '' || /\W/.test(before)) &&
          (after === '' || /\W/.test(after)));
      if (closing !== -1 && boundaryOk) {
        flush();
        nodes.push({
          type: 'italic',
          children: parseInlines(input.slice(i + 1, closing)),
        });
        i = closing + 1;
        continue;
      }
    }

    buffer += input[i];
    i += 1;
  }

  flush();
  return nodes;
}

function findClosingMarker(
  input: string,
  from: number,
  marker: string,
): number {
  for (let j = from; j < input.length; j += 1) {
    if (input[j] === '\n') return -1;
    if (
      input[j] === marker &&
      input[j + 1] !== marker &&
      input[j - 1] !== ' '
    ) {
      return j;
    }
  }
  return -1;
}

function paragraph(lines: string[]): Block {
  const children: Inline[] = [];
  lines.forEach((line, index) => {
    if (index > 0) children.push({ type: 'break' });
    children.push(...parseInlines(line));
  });
  return { type: 'paragraph', children };
}

/** Chat-safe markdown: bold, italic, code, links, lists, and headings. */
export function parseMarkdown(source: string): Block[] {
  const lines = source.replace(/\r\n/g, '\n').split('\n');
  const blocks: Block[] = [];
  let paragraphLines: string[] = [];

  const flushParagraph = () => {
    if (paragraphLines.length === 0) return;
    blocks.push(paragraph(paragraphLines));
    paragraphLines = [];
  };

  let i = 0;
  while (i < lines.length) {
    const line = lines[i];

    if (line.trim() === '') {
      flushParagraph();
      i += 1;
      continue;
    }

    if (line.trim().startsWith('```') && paragraphLines.length === 0) {
      const codeLines: string[] = [];
      i += 1;
      while (i < lines.length && !lines[i].trim().startsWith('```')) {
        codeLines.push(lines[i]);
        i += 1;
      }
      if (i < lines.length) i += 1;
      blocks.push({ type: 'code', text: codeLines.join('\n') });
      continue;
    }

    const heading = /^(#{1,3})\s+(\S.*)$/.exec(line);
    if (heading && paragraphLines.length === 0) {
      blocks.push({
        type: 'heading',
        children: parseInlines(heading[2]),
      });
      i += 1;
      continue;
    }

    if (/^\s*[-*]\s+\S/.test(line) && paragraphLines.length === 0) {
      const items: Inline[][] = [];
      while (i < lines.length && /^\s*[-*]\s+\S/.test(lines[i])) {
        items.push(parseInlines(lines[i].replace(/^\s*[-*]\s+/, '')));
        i += 1;
      }
      blocks.push({ type: 'list', ordered: false, items });
      continue;
    }

    if (/^\s*\d+[.)]\s+\S/.test(line) && paragraphLines.length === 0) {
      const items: Inline[][] = [];
      while (i < lines.length && /^\s*\d+[.)]\s+\S/.test(lines[i])) {
        items.push(parseInlines(lines[i].replace(/^\s*\d+[.)]\s+/, '')));
        i += 1;
      }
      blocks.push({ type: 'list', ordered: true, items });
      continue;
    }

    paragraphLines.push(line);
    i += 1;
  }

  flushParagraph();
  return blocks;
}
