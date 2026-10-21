
import React from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

interface FormattedReportProps {
  content?: string | null;
  className?: string;
  fallbackText?: string;
}

function cleanReportContent(raw: string): string {
  if (!raw) return '';

  let cleaned = raw;

  // Remove complete thinking blocks if they appear in the response.
  cleaned = cleaned.replace(
    /<think\b[^>]*>[\s\S]*?<\/think\s*>/gi,
    ''
  );

  // Normalize line endings and excessive blank lines.
  cleaned = cleaned
    .replace(/\r\n?/g, '\n')
    .replace(/\n{3,}/g, '\n\n')
    .trim();

  return cleaned;
}

export const FormattedReport: React.FC<FormattedReportProps> = ({
  content,
  className = '',
  fallbackText = 'No data available.',
}) => {
  const processedContent = cleanReportContent(content ?? '');

  if (!processedContent) {
    return (
      <p className="text-sm italic text-neutral-500">
        {fallbackText}
      </p>
    );
  }

  return (
    <article
      className={`prose prose-neutral max-w-none text-neutral-800
        [&>*:first-child]:mt-0
        [&_h1]:mb-4 [&_h1]:mt-6 [&_h1]:text-xl
        [&_h1]:font-semibold [&_h1]:tracking-tight
        [&_h1]:text-neutral-950
        [&_h2]:mb-3 [&_h2]:mt-7 [&_h2]:border-b
        [&_h2]:border-neutral-200 [&_h2]:pb-2
        [&_h2]:text-base [&_h2]:font-semibold
        [&_h2]:text-neutral-900
        [&_h3]:mb-2 [&_h3]:mt-5 [&_h3]:text-sm
        [&_h3]:font-semibold [&_h3]:text-neutral-900
        [&_p]:mb-4 [&_p]:text-sm [&_p]:leading-7
        [&_ul]:mb-4 [&_ul]:list-disc [&_ul]:space-y-2
        [&_ul]:pl-6 [&_ol]:mb-4 [&_ol]:list-decimal
        [&_ol]:space-y-2 [&_ol]:pl-6
        [&_li]:pl-1 [&_li]:text-sm [&_li]:leading-7
        [&_strong]:font-semibold [&_strong]:text-neutral-950
        [&_blockquote]:my-4 [&_blockquote]:border-l-2
        [&_blockquote]:border-neutral-300 [&_blockquote]:pl-4
        [&_blockquote]:text-neutral-600
        [&_hr]:my-6 [&_hr]:border-neutral-200
        [&_table]:w-full [&_table]:text-sm
        [&_th]:border [&_th]:border-neutral-200
        [&_th]:bg-neutral-50 [&_th]:p-2
        [&_td]:border [&_td]:border-neutral-200
        [&_td]:p-2
        ${className}`}
    >
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        skipHtml
        components={{
          a: ({ href, children }) => {
            const safeHref =
              href && /^(https?:|mailto:)/i.test(href)
                ? href
                : undefined;

            return (
              <a
                href={safeHref}
                target="_blank"
                rel="noopener noreferrer"
              >
                {children}
              </a>
            );
          },
          code: ({ children, className: codeClassName }) => {
            const isBlock = Boolean(codeClassName);

            return isBlock ? (
              <code className="font-mono text-sm">
                {children}
              </code>
            ) : (
              <code className="rounded bg-neutral-100 px-1.5 py-0.5
                font-mono text-xs text-neutral-800">
                {children}
              </code>
            );
          },
          pre: ({ children }) => (
            <pre className="my-4 overflow-x-auto rounded-lg
              bg-neutral-950 p-4 text-neutral-100">
              {children}
            </pre>
          ),
        }}
      >
        {processedContent}
      </ReactMarkdown>
    </article>
  );
};

export default FormattedReport;
