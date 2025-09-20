import { Streamdown } from 'streamdown';
import { cn } from '@/lib/utils';

interface StreamdownMarkdownProps {
    content: string;
    className?: string;
}

export function StreamdownMarkdown({
    content,
    className
}: StreamdownMarkdownProps) {

    if (!content || content.trim() === '') {
        return (
            <div className={cn("py-8 text-center", className)}>
                <p className="text-gray-500">No content available.</p>
            </div>
        );
    }

    return (
        <Streamdown
            className={cn(
                "size-full [&>*:first-child]:mt-0 [&>*:last-child]:mb-0",
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
            )}
        >
            {content}
        </Streamdown>
    );
}