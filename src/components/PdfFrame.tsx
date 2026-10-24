import { useEffect, useState } from 'react';

/**
 * The native viewer is the right answer on every platform — including iOS,
 * where Safari renders PDFs through QuickLook. What broke it before was the
 * box: a percentage height against an auto-height parent collapses to the
 * 150px default, so the page looked empty and locked at a third of its size.
 * The frame is anchored to a parent with a real height now.
 */
interface PdfFrameProps {
  src: string;
  title: string;
  subtitle?: string;
  pages?: number;
  className?: string;
}

const PdfFrame = ({ src, title, className }: PdfFrameProps) => {
  const [ready, setReady] = useState(false);

  useEffect(() => setReady(true), []);

  if (!ready) {
    return (
      <div className="absolute inset-0 bg-gray-200" aria-hidden="true" />
    );
  }

  return (
    <iframe
      src={`${src}#view=FitH`}
      title={title}
      allow="fullscreen"
      className={`absolute inset-0 h-full w-full border-0 bg-white ${className ?? ''}`}
    />
  );
};

export default PdfFrame;
