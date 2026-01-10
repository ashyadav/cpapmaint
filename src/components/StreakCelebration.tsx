import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

interface StreakCelebrationProps {
  streak: number;
  onDismiss: () => void;
}

export function StreakCelebration({ streak, onDismiss }: StreakCelebrationProps) {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    // Animate in
    setTimeout(() => setIsVisible(true), 100);
  }, []);

  const handleDismiss = () => {
    setIsVisible(false);
    setTimeout(onDismiss, 300);
  };

  const getMilestoneMessage = (streak: number): string => {
    if (streak >= 90) return "Amazing! You've maintained a 90-day streak!";
    if (streak >= 30) return "Fantastic! 30 days of consistent maintenance!";
    if (streak >= 7) return "Great work! You're on a 7-day streak!";
    return `${streak} days of consistency!`;
  };

  const getMilestoneEmoji = (streak: number): string => {
    if (streak >= 90) return '🎉';
    if (streak >= 30) return '🌟';
    if (streak >= 7) return '⭐';
    return '✨';
  };

  return (
    <div
      className={`fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 transition-opacity duration-300 ${
        isVisible ? 'opacity-100' : 'opacity-0'
      }`}
      onClick={handleDismiss}
    >
      <Card
        className={`max-w-md w-full transform transition-all duration-300 ${
          isVisible ? 'scale-100 opacity-100' : 'scale-95 opacity-0'
        }`}
        onClick={(e) => e.stopPropagation()}
      >
        <CardHeader className="text-center pb-4">
          <div className="text-6xl mb-4 animate-bounce">
            {getMilestoneEmoji(streak)}
          </div>
          <CardTitle className="text-2xl">
            {getMilestoneMessage(streak)}
          </CardTitle>
        </CardHeader>
        <CardContent className="text-center space-y-4">
          <div className="text-4xl font-bold text-primary">
            {streak} Day Streak
          </div>
          <p className="text-muted-foreground">
            You're building excellent CPAP maintenance habits. Keep up the great work!
          </p>
          <Button onClick={handleDismiss} className="w-full" size="lg">
            Continue
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
