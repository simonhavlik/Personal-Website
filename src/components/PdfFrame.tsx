import { Suspense, lazy, useEffect, useState } from 'react';

const PdfMobileViewer = lazy(() => import('./PdfMobileViewer'));

/**
 * iOS Safari and mobile Chrome do not render PDFs inside an <iframe> — the
 * frame stays blank. On those devices the document is drawn to canvas by
 * pdf.js instead, inside a box whose height comes from the layout.
 */
const detectEmbeddable = (): boolean => {
  if (typeof window === 'undefined') return true;
  const ua = navigator.userAgent;
  const isIOS =
    /iPad|iPhone|iPod/.test(ua) ||
    (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
  const coarse = window.matchMedia('(pointer: coarse)').matches;
  return !isIOS && !coarse;
};

interface PdfFrameProps {
  src: string;
  title: string;
  subtitle?: string;
  pages?: number;
  className?: string;
}

export const PdfFrame = ({ src, title, className }: PdfFrameProps) => {
  const [canEmbed, setCanEmbed] = useState<boolean | null>(null);

  useEffect(() => {
    setCanEmbed(detectEmbeddable());
  }, []);

  // the iframe is positioned, not sized by its parent: a percentage height
  // against an auto-height box collapses to the 150px default, which is what
  // left two thirds of the viewer blank on a phone
  if (canEmbed) {
    return (
      <iframe
        src={src}
        title={title}
        allow="fullscreen"
        className={`absolute inset-0 h-full w-full border-0 bg-white ${className ?? ''}`}
      />
    );
  }

  if (canEmbed === false) {
    return (
      <Suspense
        fallback={
          <div className="absolute inset-0 flex items-center justify-center bg-gray-200">
            <p className="text-xs text-gray-500">Loading document…</p>
          </div>
        }
      >
        <PdfMobileViewer src={src} title={title} />
      </Suspense>
    );
  }

  return null;
};

export default PdfFrame;
