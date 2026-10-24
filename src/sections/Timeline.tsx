import { Suspense, lazy, useEffect, useRef, useState } from 'react';
import JourneyTimeline2D from '../components/journey/JourneyTimeline2D';
import { useJourneyPrefs } from '../hooks/useJourneyPrefs';

// the desktop is a window server, three apps and a terminal — a phone should
// not parse it before the reader has scrolled this far
const JourneyDesktop = lazy(() => import('../components/journey/JourneyDesktop'));

const Timeline = () => {
  const allowRich = useJourneyPrefs();
  const holderRef = useRef<HTMLDivElement>(null);
  const [near, setNear] = useState(false);

  useEffect(() => {
    if (!allowRich) return;
    const el = holderRef.current;
    if (!el || typeof IntersectionObserver === 'undefined') {
      setNear(true);
      return;
    }
    const io = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setNear(true);
          io.disconnect();
        }
      },
      { rootMargin: '900px' },
    );
    io.observe(el);
    return () => io.disconnect();
  }, [allowRich]);

  if (!allowRich) return <JourneyTimeline2D />;

  return (
    <div ref={holderRef} className="h-[100svh] min-h-[520px]">
      {near ? (
        <Suspense fallback={<div className="h-full w-full bg-gray-50" />}>
          <JourneyDesktop />
        </Suspense>
      ) : (
        <div className="h-full w-full bg-gray-50" aria-hidden="true" />
      )}
    </div>
  );
};

export default Timeline;
