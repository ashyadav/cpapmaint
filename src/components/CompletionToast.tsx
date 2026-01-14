import { useEffect, useState } from 'react';

interface CompletionToastProps {
  message: string;
  onDismiss: () => void;
  duration?: number;
}

function CheckIcon({ className }: { className?: string }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="3"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
    >
      <polyline points="20 6 9 17 4 12" />
    </svg>
  );
}

export function CompletionToast({
  message,
  onDismiss,
  duration = 3000,
}: CompletionToastProps) {
  const [isVisible, setIsVisible] = useState(false);
  const [showCheck, setShowCheck] = useState(false);

  useEffect(() => {
    // Animate in
    const showTimer = setTimeout(() => {
      setIsVisible(true);
      setTimeout(() => setShowCheck(true), 100);
    }, 50);

    // Auto-dismiss after duration
    const dismissTimer = setTimeout(() => {
      setIsVisible(false);
      setTimeout(onDismiss, 300);
    }, duration);

    return () => {
      clearTimeout(showTimer);
      clearTimeout(dismissTimer);
    };
  }, [duration, onDismiss]);

  return (
    <div
      className={`fixed bottom-4 right-4 z-50 max-w-sm transform transition-all duration-300 ${
        isVisible ? 'translate-y-0 opacity-100' : 'translate-y-4 opacity-0'
      }`}
    >
      <div className="bg-green-600 text-white px-5 py-4 rounded-lg shadow-lg flex items-center gap-3">
        <div
          className={`flex-shrink-0 w-8 h-8 bg-white/20 rounded-full flex items-center justify-center transform transition-transform ${
            showCheck ? 'animate-check-bounce' : 'scale-0'
          }`}
        >
          <CheckIcon className="w-5 h-5" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="font-medium text-sm">{message}</p>
        </div>
      </div>
    </div>
  );
}
