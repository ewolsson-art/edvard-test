// Enkel renderare för bloggartiklar — stödjer ##, ###, **, listor, blockquotes och länkar.
// Tillräckligt för våra artiklar utan att lägga till markdown-paket.

import { Link } from "react-router-dom";

interface BlogContentProps {
  content: string;
}

function renderInline(text: string, keyPrefix: string): React.ReactNode[] {
  // Hantera **bold** och [text](href)
  const parts: React.ReactNode[] = [];
  let remaining = text;
  let idx = 0;

  while (remaining.length > 0) {
    // Länkar [text](href)
    const linkMatch = remaining.match(/\[([^\]]+)\]\(([^)]+)\)/);
    // Bold **text**
    const boldMatch = remaining.match(/\*\*([^*]+)\*\*/);

    const linkPos = linkMatch ? remaining.indexOf(linkMatch[0]) : -1;
    const boldPos = boldMatch ? remaining.indexOf(boldMatch[0]) : -1;

    if (linkPos === -1 && boldPos === -1) {
      parts.push(<span key={`${keyPrefix}-${idx++}`}>{remaining}</span>);
      break;
    }

    if (linkPos !== -1 && (boldPos === -1 || linkPos < boldPos)) {
      if (linkPos > 0) {
        parts.push(<span key={`${keyPrefix}-${idx++}`}>{remaining.slice(0, linkPos)}</span>);
      }
      const [, linkText, href] = linkMatch!;
      const isInternal = href.startsWith("/");
      parts.push(
        isInternal ? (
          <Link
            key={`${keyPrefix}-${idx++}`}
            to={href}
            className="text-primary underline-offset-4 hover:underline"
          >
            {linkText}
          </Link>
        ) : (
          <a
            key={`${keyPrefix}-${idx++}`}
            href={href}
            target="_blank"
            rel="noopener noreferrer"
            className="text-primary underline-offset-4 hover:underline"
          >
            {linkText}
          </a>
        )
      );
      remaining = remaining.slice(linkPos + linkMatch![0].length);
    } else if (boldPos !== -1) {
      if (boldPos > 0) {
        parts.push(<span key={`${keyPrefix}-${idx++}`}>{remaining.slice(0, boldPos)}</span>);
      }
      parts.push(
        <strong key={`${keyPrefix}-${idx++}`} className="font-semibold text-foreground">
          {boldMatch![1]}
        </strong>
      );
      remaining = remaining.slice(boldPos + boldMatch![0].length);
    }
  }

  return parts;
}

export function BlogContent({ content }: BlogContentProps) {
  const lines = content.trim().split("\n");
  const blocks: React.ReactNode[] = [];
  let i = 0;
  let key = 0;

  while (i < lines.length) {
    const line = lines[i];

    // Tom rad
    if (!line.trim()) {
      i++;
      continue;
    }

    // Horisontell linje
    if (line.trim() === "---") {
      blocks.push(<hr key={key++} className="my-12 border-white/10" />);
      i++;
      continue;
    }

    // H2
    if (line.startsWith("## ")) {
      blocks.push(
        <h2 key={key++} className="text-3xl md:text-4xl font-display font-semibold mt-16 mb-6 text-foreground">
          {line.slice(3)}
        </h2>
      );
      i++;
      continue;
    }

    // H3
    if (line.startsWith("### ")) {
      blocks.push(
        <h3 key={key++} className="text-xl md:text-2xl font-display font-semibold mt-10 mb-4 text-foreground">
          {line.slice(4)}
        </h3>
      );
      i++;
      continue;
    }

    // Blockquote
    if (line.startsWith("> ")) {
      const quoteLines = [];
      while (i < lines.length && (lines[i].startsWith("> ") || lines[i].trim() === "")) {
        if (lines[i].startsWith("> ")) quoteLines.push(lines[i].slice(2));
        else if (quoteLines.length > 0) break;
        i++;
      }
      blocks.push(
        <blockquote
          key={key++}
          className="my-8 border-l-2 border-primary/60 pl-6 py-2 text-lg text-foreground/85 italic"
        >
          {quoteLines.map((q, idx) => (
            <p key={idx} className="mb-2 last:mb-0">
              {renderInline(q, `q-${key}-${idx}`)}
            </p>
          ))}
        </blockquote>
      );
      continue;
    }

    // Numrerad lista
    if (/^\d+\.\s/.test(line)) {
      const items: string[] = [];
      while (i < lines.length && /^\d+\.\s/.test(lines[i])) {
        items.push(lines[i].replace(/^\d+\.\s/, ""));
        i++;
      }
      blocks.push(
        <ol key={key++} className="my-6 space-y-2 list-decimal pl-6 text-foreground/80">
          {items.map((item, idx) => (
            <li key={idx} className="leading-relaxed">
              {renderInline(item, `ol-${key}-${idx}`)}
            </li>
          ))}
        </ol>
      );
      continue;
    }

    // Punktlista
    if (line.startsWith("- ") || line.startsWith("⚠️ ") || line.startsWith("❌ ")) {
      const items: string[] = [];
      while (
        i < lines.length &&
        (lines[i].startsWith("- ") || lines[i].startsWith("❌ "))
      ) {
        items.push(lines[i].replace(/^- /, "").replace(/^❌ /, "❌ "));
        i++;
      }
      if (items.length > 0) {
        blocks.push(
          <ul key={key++} className="my-6 space-y-2 list-disc pl-6 text-foreground/80 marker:text-primary/60">
            {items.map((item, idx) => (
              <li key={idx} className="leading-relaxed">
                {renderInline(item, `ul-${key}-${idx}`)}
              </li>
            ))}
          </ul>
        );
        continue;
      }
    }

    // Stycke
    blocks.push(
      <p key={key++} className="my-5 text-foreground/80 leading-relaxed text-base md:text-lg">
        {renderInline(line, `p-${key}`)}
      </p>
    );
    i++;
  }

  return <div className="blog-content">{blocks}</div>;
}
