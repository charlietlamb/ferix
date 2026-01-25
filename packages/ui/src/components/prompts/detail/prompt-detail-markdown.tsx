"use client";

import { stripFrontmatter } from "@ferix/ui/lib/markdown";
import { cn } from "@ferix/ui/lib/utils";
import { useEffect, useState } from "react";
import Markdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { codeToHtml } from "shiki";

interface PromptDetailMarkdownProps {
  content: string;
  className?: string;
}

interface CodeBlockProps {
  className?: string;
  children?: React.ReactNode;
}

const TRAILING_NEWLINE_REGEX = /\n$/;
const LANGUAGE_REGEX = /language-(\w+)/;

function CodeBlock({ className, children }: CodeBlockProps) {
  const [html, setHtml] = useState<string | null>(null);
  const code = String(children).replace(TRAILING_NEWLINE_REGEX, "");
  const match = LANGUAGE_REGEX.exec(className || "");
  const language = match?.[1] ?? "text";

  useEffect(() => {
    if (!match) {
      setHtml(null);
      return;
    }

    codeToHtml(code, {
      lang: language,
      themes: {
        light: "github-light",
        dark: "github-dark",
      },
      defaultColor: false,
    }).then(setHtml);
  }, [code, language, match]);

  if (!match) {
    return (
      <code className="rounded bg-muted px-1.5 py-0.5 font-mono text-sm">
        {children}
      </code>
    );
  }

  if (!html) {
    return (
      <pre className="overflow-x-auto rounded-lg bg-muted p-4">
        <code className="font-mono text-sm">{children}</code>
      </pre>
    );
  }

  return (
    <div
      className={cn(
        "[&_pre]:overflow-x-auto [&_pre]:rounded-lg [&_pre]:p-4 [&_pre]:text-sm",
        "[&_.shiki]:bg-muted",
        "[&_.shiki_span]:text-(--shiki-light)",
        "dark:[&_.shiki_span]:text-(--shiki-dark)"
      )}
      // biome-ignore lint/security/noDangerouslySetInnerHtml: shiki output is safe
      dangerouslySetInnerHTML={{ __html: html }}
    />
  );
}

export function PromptDetailMarkdown({
  content,
  className,
}: PromptDetailMarkdownProps) {
  return (
    <div
      className={cn(
        "prose prose-sm dark:prose-invert max-w-none p-4",
        "prose-headings:font-semibold prose-headings:tracking-tight",
        "prose-h1:text-2xl prose-h2:text-xl prose-h3:text-lg",
        "prose-p:text-foreground prose-p:leading-relaxed",
        "prose-a:text-primary prose-a:no-underline hover:prose-a:underline",
        "prose-strong:font-semibold prose-strong:text-foreground",
        "prose-code:text-foreground prose-code:before:content-none prose-code:after:content-none",
        "prose-pre:bg-transparent prose-pre:p-0",
        "prose-li:my-0 prose-ol:my-2 prose-ul:my-2",
        "prose-blockquote:border-l-primary prose-blockquote:text-muted-foreground",
        className
      )}
    >
      <Markdown
        components={{
          code: ({ className, children, ...props }) => {
            const isInline = !className;
            if (isInline) {
              return (
                <code
                  className="rounded bg-muted px-1.5 py-0.5 font-mono text-sm"
                  {...props}
                >
                  {children}
                </code>
              );
            }
            return <CodeBlock className={className}>{children}</CodeBlock>;
          },
          pre: ({ children }) => <>{children}</>,
          table: ({ children }) => (
            <div className="my-4 overflow-x-auto">
              <table className="w-full border-collapse text-sm">
                {children}
              </table>
            </div>
          ),
          thead: ({ children }) => (
            <thead className="border-border border-b bg-muted/50">
              {children}
            </thead>
          ),
          tbody: ({ children }) => <tbody>{children}</tbody>,
          tr: ({ children }) => (
            <tr className="border-border border-b">{children}</tr>
          ),
          th: ({ children }) => (
            <th className="px-4 py-2 text-left font-semibold text-foreground">
              {children}
            </th>
          ),
          td: ({ children }) => (
            <td className="px-4 py-2 text-muted-foreground">{children}</td>
          ),
        }}
        remarkPlugins={[remarkGfm]}
      >
        {stripFrontmatter(content)}
      </Markdown>
    </div>
  );
}
