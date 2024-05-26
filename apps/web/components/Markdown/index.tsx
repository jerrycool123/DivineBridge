import Link from 'next/link';
import ReactMarkdown from 'react-markdown';
import rehypeRaw from 'rehype-raw';

export default function Markdown({ content }: { content: string }) {
  return (
    <ReactMarkdown
      rehypePlugins={[rehypeRaw]}
      components={{
        h1: ({ node: _node, children, ...props }) => (
          <h1 {...props} className="mb-5">
            {children}
          </h1>
        ),
        a: ({ node: _node, ref: _ref, href, ...props }) => (
          <Link className="link" {...props} href={href ?? '/'} target="_blank">
            {props.children}
          </Link>
        ),
        code: ({ node: _node, children, ...props }) => (
          <code
            className="p-1 rounded"
            {...props}
            style={{ backgroundColor: '#2b2d31', color: 'white' }}
          >
            {children}
          </code>
        ),
        ul: ({ node: _node, children, ...props }) => (
          <ul {...props} style={{ paddingLeft: '1.5rem' }}>
            {children}
          </ul>
        ),
        ol: ({ node: _node, children, ...props }) => (
          <ol {...props} style={{ paddingLeft: '18px', paddingRight: 0 }}>
            {children}
          </ol>
        ),
      }}
    >
      {content}
    </ReactMarkdown>
  );
}
