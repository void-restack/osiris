import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import rehypeHighlight from 'rehype-highlight';
import rehypeRaw from 'rehype-raw';
import { cn } from '@/lib/utils';
import 'highlight.js/styles/github.css';

interface MarkdownRendererProps {
    content: string;
    className?: string;
}

export function MarkdownRenderer({
    content,
    className
}: MarkdownRendererProps) {

    if (!content || content.trim() === '') {
        return (
            <div className={cn("py-8 text-center", className)}>
                <p className="text-gray-500">No content available.</p>
            </div>
        );
    }

    return (
        <div className={cn(
            "markdown-body",
            "prose prose-base max-w-none",
            // NPM-style Typography
            "text-gray-900",
            "prose-headings:font-semibold prose-headings:text-gray-900 prose-headings:leading-tight",
            "prose-h1:text-3xl prose-h1:font-bold prose-h1:mt-6 prose-h1:mb-4 prose-h1:pb-2 prose-h1:border-b prose-h1:border-gray-200",
            "prose-h2:text-2xl prose-h2:font-semibold prose-h2:mt-8 prose-h2:mb-4 prose-h2:pb-2 prose-h2:border-b prose-h2:border-gray-200",
            "prose-h3:text-xl prose-h3:font-semibold prose-h3:mt-6 prose-h3:mb-3",
            "prose-h4:text-lg prose-h4:font-semibold prose-h4:mt-4 prose-h4:mb-2",
            "prose-h5:text-base prose-h5:font-semibold prose-h5:mt-4 prose-h5:mb-2",
            "prose-h6:text-sm prose-h6:font-semibold prose-h6:mt-4 prose-h6:mb-2 prose-h6:uppercase prose-h6:text-gray-600",

            // Paragraphs
            "prose-p:text-gray-700 prose-p:leading-relaxed prose-p:mb-4 prose-p:mt-0",

            // Links - npm style (blue with underline)
            "prose-a:text-[#0969da] prose-a:underline prose-a:font-normal hover:prose-a:text-[#0860ca]",

            // Text formatting
            "prose-strong:text-gray-900 prose-strong:font-semibold",
            "prose-em:italic",

            // Code - GitHub/npm style
            "prose-code:text-[#d73a49] prose-code:bg-[#f6f8fa] prose-code:px-1.5 prose-code:py-0.5 prose-code:rounded prose-code:text-[85%] prose-code:font-mono",

            // Code blocks - Clean GitHub style
            "prose-pre:bg-[#f6f8fa] prose-pre:text-gray-800 prose-pre:p-4 prose-pre:rounded-md prose-pre:overflow-x-auto prose-pre:text-sm prose-pre:leading-normal",
            "prose-pre:border prose-pre:border-gray-200",

            // Blockquotes - Simple and clean
            "prose-blockquote:text-gray-600 prose-blockquote:border-l-4 prose-blockquote:border-gray-300 prose-blockquote:pl-4 prose-blockquote:my-4",
            "prose-blockquote:prose-p:first:mt-0 prose-blockquote:prose-p:last:mb-0",

            // Lists - Clean spacing
            "prose-ul:list-disc prose-ul:pl-8 prose-ul:my-4",
            "prose-ol:list-decimal prose-ol:pl-8 prose-ol:my-4",
            "prose-li:text-gray-700 prose-li:mb-1",
            "prose-li:marker:text-gray-400",

            // Tables - npm documentation style
            "prose-table:w-full prose-table:text-sm prose-table:border-collapse prose-table:my-6",
            "prose-thead:border-b-2 prose-thead:border-gray-300",
            "prose-th:text-left prose-th:font-semibold prose-th:p-2 prose-th:text-gray-900",
            "prose-tbody:prose-tr:border-b prose-tbody:prose-tr:border-gray-200",
            "prose-td:p-2 prose-td:text-gray-700",
            "prose-tbody:prose-tr:last:border-0",

            // Horizontal rules
            "prose-hr:border-gray-200 prose-hr:my-8",

            // Images
            "prose-img:rounded prose-img:my-6",

            // Nested lists
            "prose-ul:prose-ul:list-[circle] prose-ul:prose-ul:mt-2 prose-ul:prose-ul:mb-2",
            "prose-ol:prose-ol:list-[lower-alpha] prose-ol:prose-ol:mt-2 prose-ol:prose-ol:mb-2",

            className
        )}>
            <ReactMarkdown
                remarkPlugins={[remarkGfm]}
                rehypePlugins={[rehypeRaw, rehypeHighlight]}
                components={{
                    // Simple code rendering
                    code({ node, inline, className, children, ...props }: any) {
                        const match = /language-(\w+)/.exec(className || '');
                        return !inline && match ? (
                            <pre className="bg-[#f6f8fa] text-gray-800 p-4 rounded-md overflow-x-auto text-sm leading-normal border border-gray-200">
                                <code className={className} {...props}>
                                    {children}
                                </code>
                            </pre>
                        ) : (
                            <code className="text-[#d73a49] bg-[#f6f8fa] px-1.5 py-0.5 rounded text-[85%] font-mono" {...props}>
                                {children}
                            </code>
                        );
                    },
                    // NPM-style links
                    a({ href, children }) {
                        return (
                            <a
                                href={href}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-[#0969da] underline hover:text-[#0860ca]"
                            >
                                {children}
                            </a>
                        );
                    },
                    // Clean table styling
                    table({ children }) {
                        return (
                            <div className="overflow-x-auto my-6">
                                <table className="w-full text-sm border-collapse">
                                    {children}
                                </table>
                            </div>
                        );
                    },
                    thead({ children }) {
                        return (
                            <thead className="border-b-2 border-gray-300">
                                {children}
                            </thead>
                        );
                    },
                    th({ children }) {
                        return (
                            <th className="text-left font-semibold p-2 text-gray-900">
                                {children}
                            </th>
                        );
                    },
                    tbody({ children }) {
                        return (
                            <tbody>
                                {children}
                            </tbody>
                        );
                    },
                    tr({ children }) {
                        return (
                            <tr className="border-b border-gray-200 last:border-0">
                                {children}
                            </tr>
                        );
                    },
                    td({ children }) {
                        return (
                            <td className="p-2 text-gray-700">
                                {children}
                            </td>
                        );
                    },
                    // Simple blockquote
                    blockquote({ children }) {
                        return (
                            <blockquote className="text-gray-600 border-l-4 border-gray-300 pl-4 my-4 [&>p:first-child]:mt-0 [&>p:last-child]:mb-0">
                                {children}
                            </blockquote>
                        );
                    },
                    // Add simple IDs to headings (no fancy hover effects)
                    h1: ({ children }) => {
                        const id = children?.toString().toLowerCase().replace(/[^a-z0-9]+/g, '-');
                        return <h1 id={id} className="text-3xl font-bold mt-6 mb-4 pb-2 border-b border-gray-200">{children}</h1>;
                    },
                    h2: ({ children }) => {
                        const id = children?.toString().toLowerCase().replace(/[^a-z0-9]+/g, '-');
                        return <h2 id={id} className="text-2xl font-semibold mt-8 mb-4 pb-2 border-b border-gray-200">{children}</h2>;
                    },
                    h3: ({ children }) => {
                        const id = children?.toString().toLowerCase().replace(/[^a-z0-9]+/g, '-');
                        return <h3 id={id} className="text-xl font-semibold mt-6 mb-3">{children}</h3>;
                    },
                    h4: ({ children }) => {
                        const id = children?.toString().toLowerCase().replace(/[^a-z0-9]+/g, '-');
                        return <h4 id={id} className="text-lg font-semibold mt-4 mb-2">{children}</h4>;
                    },
                    h5: ({ children }) => {
                        const id = children?.toString().toLowerCase().replace(/[^a-z0-9]+/g, '-');
                        return <h5 id={id} className="text-base font-semibold mt-4 mb-2">{children}</h5>;
                    },
                    h6: ({ children }) => {
                        const id = children?.toString().toLowerCase().replace(/[^a-z0-9]+/g, '-');
                        return <h6 id={id} className="text-sm font-semibold mt-4 mb-2 uppercase text-gray-600">{children}</h6>;
                    },
                }}
            >
                {content}
            </ReactMarkdown>
        </div>
    );
}