import React from 'react';

interface DifficultyStarsProps {
  difficulty: number; // 1-3
}

export const DifficultyStars: React.FC<DifficultyStarsProps> = ({ difficulty }) => {
  const labels = ['', 'Beginner', 'Intermediate', 'Advanced'];
  return (
    <span className="flex items-center gap-1 text-sm">
      {[1, 2, 3].map((i) => (
        <span key={i} className={i <= difficulty ? 'text-amber-400' : 'text-gray-600'}>⭐</span>
      ))}
      <span className="text-gray-400 text-xs ml-1">{labels[difficulty]}</span>
    </span>
  );
};
