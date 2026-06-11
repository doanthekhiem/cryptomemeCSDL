import { useState } from 'react';
import { useGalleryStore } from '../../stores/galleryStore';
import { isTouchDevice } from '../../utils/inputState';

interface Step {
  title: string;
  body: string;
}

const getSteps = (touch: boolean): Step[] => [
  {
    title: 'Anon, welcome to the spiral 🌀',
    body: touch
      ? 'The top 100 meme coins climb this spiral all the way to the Moon. Drag the joystick (bottom-left) to start the ascent. WAGMI.'
      : 'The top 100 meme coins climb this spiral all the way to the Moon. Use W A S D or the arrow keys to start the ascent. WAGMI.',
  },
  {
    title: 'Inspect the artifacts 💎',
    body: 'Walk up to any token frame — a live price card appears at the bottom. Green frame = pumping, red frame = rekt.',
  },
  {
    title: 'Degen toolkit 🚀',
    body: touch
      ? 'Tap a token (or its preview card) for full details. Open the MENU for search, the token list and the minimap. wen lambo? soon.'
      : 'Enter for full details · "/" to search & teleport · M for the minimap · ESC for the menu. wen lambo? soon.',
  },
];

// First-visit 3-step tour. hasSeenTour is persisted, so it only shows once.
export const Onboarding = () => {
  const hasSeenTour = useGalleryStore((s) => s.hasSeenTour);
  const setHasSeenTour = useGalleryStore((s) => s.setHasSeenTour);
  const isLoading = useGalleryStore((s) => s.isLoading);
  const error = useGalleryStore((s) => s.error);
  const tokensCount = useGalleryStore((s) => s.tokens.length);

  const [step, setStep] = useState(0);
  const [touch] = useState(isTouchDevice);

  if (hasSeenTour || isLoading || error || tokensCount === 0) return null;

  const steps = getSteps(touch);
  const isLast = step === steps.length - 1;
  const finish = () => setHasSeenTour(true);

  return (
    <div
      className="fixed left-1/2 -translate-x-1/2 bottom-24 sm:bottom-32 z-40 w-[calc(100%-2rem)] max-w-sm
        bg-cyber-primary/95 backdrop-blur-sm border border-neon-cyan/50 rounded-xl p-4 shadow-2xl animate-slide-up"
      role="dialog"
      aria-label="Quick tour"
    >
      <h3 className="text-white font-bold mb-1">{steps[step].title}</h3>
      <p className="text-gray-300 text-sm leading-relaxed mb-4">{steps[step].body}</p>

      <div className="flex items-center gap-2">
        {/* Step dots */}
        <div className="flex gap-1.5 mr-auto" aria-label={`Step ${step + 1} of ${steps.length}`}>
          {steps.map((_, i) => (
            <span
              key={i}
              className={`w-2 h-2 rounded-full transition-colors ${
                i === step ? 'bg-neon-cyan' : 'bg-gray-600'
              }`}
            />
          ))}
        </div>

        {!isLast && (
          <button
            onClick={finish}
            className="px-3 py-1.5 text-sm text-gray-400 hover:text-white transition-colors"
          >
            Skip
          </button>
        )}
        <button
          onClick={() => (isLast ? finish() : setStep((s) => s + 1))}
          className="px-4 py-1.5 bg-neon-cyan/20 border border-neon-cyan/60 rounded-lg text-neon-cyan text-sm hover:bg-neon-cyan/30 transition-colors"
        >
          {isLast ? "Let's go!" : 'Next'}
        </button>
      </div>
    </div>
  );
};
