import { useEffect } from 'react';

interface PageMetaProps {
  title: string;
  description?: string;
}

export function PageMeta({ title, description }: PageMetaProps) {
  useEffect(() => {
    const prevTitle = document.title;
    document.title = title.includes('NobleNet') ? title : `${title} | NobleNet`;

    let metaDesc = document.querySelector('meta[name="description"]');
    const prevDesc = metaDesc ? metaDesc.getAttribute('content') : null;

    if (description) {
      if (!metaDesc) {
        metaDesc = document.createElement('meta');
        metaDesc.setAttribute('name', 'description');
        document.head.appendChild(metaDesc);
      }
      metaDesc.setAttribute('content', description);
    }

    return () => {
      document.title = prevTitle;
      if (metaDesc && prevDesc) {
        metaDesc.setAttribute('content', prevDesc);
      }
    };
  }, [title, description]);

  return null;
}
