import type { ReactNode } from 'react';
import { parseMarkdown, type Inline } from '@/lib/markdown';

function renderInlines(nodes: Inline[], keyPrefix: string): ReactNode[] {
  return nodes.map((node, index) => {
    const key = `${keyPrefix}-${index}`;
    switch (node.type) {
      case 'text':
        return <span key={key}>{node.text}</span>;
      case 'break':
        return <br key={key} />;
      case 'bold':
        return (
          <strong key={key} className="font-semibold">
            {renderInlines(node.children, key)}
          </strong>
        );
      case 'italic':
        return <em key={key}>{renderInlines(node.children, key)}</em>;
      case 'code':
        return (
          <code
            key={key}
            className="rounded bg-black/10 px-1 py-0.5 font-mono text-[0.85em]"
          >
            {node.text}
          </code>
        );
      case 'link':
        return (
          <a
            key={key}
            href={node.href}
            target="_blank"
            rel="noopener noreferrer"
            className="break-all underline"
          >
            {renderInlines(node.children, key)}
          </a>
        );
      default:
        return null;
    }
  });
}

export function MarkdownText({ content }: { content: string }) {
  const blocks = parseMarkdown(content);
  if (blocks.length === 0) return null;

  return (
    <div className="space-y-2 leading-relaxed">
      {blocks.map((block, index) => {
        const key = `block-${index}`;
        switch (block.type) {
          case 'heading':
            return (
              <p key={key} className="font-semibold">
                {renderInlines(block.children, key)}
              </p>
            );
          case 'list': {
            const Tag = block.ordered ? 'ol' : 'ul';
            return (
              <Tag
                key={key}
                className={
                  block.ordered
                    ? 'list-decimal space-y-1 pl-5'
                    : 'list-disc space-y-1 pl-5'
                }
              >
                {block.items.map((item, itemIndex) => (
                  <li key={`${key}-${itemIndex}`}>
                    {renderInlines(item, `${key}-${itemIndex}`)}
                  </li>
                ))}
              </Tag>
            );
          }
          case 'code':
            return (
              <pre
                key={key}
                className="overflow-x-auto rounded-lg bg-black/10 p-2 font-mono text-xs"
              >
                <code>{block.text}</code>
              </pre>
            );
          case 'paragraph':
            return <p key={key}>{renderInlines(block.children, key)}</p>;
          default:
            return null;
        }
      })}
    </div>
  );
}
