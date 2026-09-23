import { forwardRef } from 'react';
import TinderCard from 'react-tinder-card';
import type { Direction, API } from 'react-tinder-card';
import { RecipeCard } from '@/components/RecipeCard';
import type { Recommendation } from '@/types/api';

interface SwipeCardProps {
  item: Recommendation;
  onSwipe: (dir: Direction, recipeId: string) => void;
  onCardLeftScreen: (recipeId: string) => void;
  zIndex: number;
  scale: number;
}

export const SwipeCard = forwardRef<API, SwipeCardProps>(function SwipeCard(
  { item, onSwipe, onCardLeftScreen, zIndex, scale },
  ref,
) {
  return (
    <TinderCard
      ref={ref}
      className="absolute inset-0"
      preventSwipe={['down']}
      onSwipe={(dir) => onSwipe(dir, item.recipe.id)}
      onCardLeftScreen={() => onCardLeftScreen(item.recipe.id)}
    >
      <div
        className="h-full w-full origin-bottom transition-transform"
        style={{ zIndex, transform: `scale(${scale})` }}
      >
        <RecipeCard recipe={item.recipe} score={item.score} />
      </div>
    </TinderCard>
  );
});
