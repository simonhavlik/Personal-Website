import { useEffect, useRef, useState } from 'react';
import { Document, Page, pdfjs } from 'react-pdf';

// the worker is served from public/ so it never depends on a CDN
pdfjs.GlobalWorkerOptions.workerSrc = '/pdfjs/pdf.worker.min.mjs';

interface PdfMobileViewerProps {
  src: string;
  title: string;
}

/**
 * iOS Safari will not render a PDF inside an <iframe> — the frame stays blank.
 * This renders the document to canvas instead, page by page, inside a
 * scrollable box whose height is set by the layout rather than the content.
 */
const PdfMobileViewer = ({ src, title }: PdfMobileViewerProps) => {
  const boxRef = useRef<HTMLDivElement>(null);
  const [width, setWidth] = useState(0);
  const [pages, setPages] = useState(0);
  const [shown, setShown] = useState(2);

  useEffect(() => {
    const el = boxRef.current;
    if (!el) return;
    const measure = () => setWidth(Math.max(240, el.clientWidth - 16));
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  const onScroll = () => {
    const el = boxRef.current;
    if (!el || shown >= pages) return;
    if (el.scrollTop + el.clientHeight > el.scrollHeight - 900) setShown((n) => Math.min(n + 4, pages));
  };

  return (
    <div
      ref={boxRef}
      onScroll={onScroll}
      className="absolute inset-0 overflow-y-auto overscroll-contain bg-gray-200"
      aria-label={title}
    >
      <Document
        file={src}
        onLoadSuccess={({ numPages }) => setPages(numPages)}
        loading={<p className="p-6 text-center text-xs text-gray-500">Loading document…</p>}
        error={<p className="p-6 text-center text-xs text-gray-500">This document could not be opened here.</p>}
      >
        {width > 0 &&
          Array.from({ length: Math.min(shown, pages) }, (_, i) => (
            <div key={i} className="mb-2 flex justify-center">
              <Page
                pageNumber={i + 1}
                width={width}
                renderTextLayer={false}
                renderAnnotationLayer={false}
                loading=""
              />
            </div>
          ))}
      </Document>
    </div>
  );
};

export default PdfMobileViewer;
