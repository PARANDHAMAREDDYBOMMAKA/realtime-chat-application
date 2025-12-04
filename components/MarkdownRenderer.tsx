"use client";

import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import rehypeHighlight from "rehype-highlight";
import rehypeRaw from "rehype-raw";
import { cn } from "@/lib/utils";

interface MarkdownRendererProps {
  content: string;
  className?: string;
}

export default function MarkdownRenderer({
  content,
  className,
}: MarkdownRendererProps) {
  // Pre-process content to handle mentions
  const processedContent = content.replace(
    /@(\w+)/g,
    '<span class="inline-flex items-center font-bold px-2 py-0.5 rounded-md transition-all cursor-pointer shadow-sm bg-blue-500/20 text-blue-600 dark:text-blue-400 dark:bg-blue-400/20 border border-blue-500/40 dark:border-blue-400/40 hover:bg-blue-500/30 dark:hover:bg-blue-400/30">@$1</span>'
  );

  return (
    <div
      className={cn(
        "prose prose-sm dark:prose-invert max-w-none",
        "prose-p:my-1 prose-p:leading-relaxed",
        "prose-headings:mt-3 prose-headings:mb-2",
        "prose-ul:my-2 prose-ol:my-2",
        "prose-li:my-0.5",
        "prose-code:px-1.5 prose-code:py-0.5 prose-code:rounded prose-code:bg-muted",
        "prose-code:before:content-[''] prose-code:after:content-['']",
        "prose-pre:my-2 prose-pre:p-3 prose-pre:bg-muted prose-pre:rounded-lg",
        "prose-pre:overflow-x-auto prose-pre:scrollbar-thin",
        "prose-blockquote:border-l-primary prose-blockquote:my-2",
        "prose-a:text-primary prose-a:no-underline hover:prose-a:underline",
        "prose-strong:font-semibold prose-strong:text-foreground",
        "prose-em:italic prose-em:text-foreground",
        "prose-img:rounded-lg prose-img:my-2",
        "prose-table:my-2",
        "prose-hr:my-3 prose-hr:border-border",
        "break-words",
        className
      )}
    >
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        rehypePlugins={[rehypeHighlight, rehypeRaw]}
        components={{
          // Custom link component - open external links in new tab
          a: ({ node, ...props }) => (
            <a
              {...props}
              target={props.href?.startsWith("http") ? "_blank" : undefined}
              rel={
                props.href?.startsWith("http")
                  ? "noopener noreferrer"
                  : undefined
              }
            />
          ),
          // Custom code component for inline code
          code: ({ node, inline, className, children, ...props }: any) => {
            if (inline) {
              return (
                <code className={className} {...props}>
                  {children}
                </code>
              );
            }
            return (
              <code className={className} {...props}>
                {children}
              </code>
            );
          },
          // Custom pre component for code blocks
          pre: ({ node, children, ...props }) => (
            <pre {...props} className="relative group">
              {children}
            </pre>
          ),
        }}
      >
        {processedContent}
      </ReactMarkdown>
    </div>
  );
}
