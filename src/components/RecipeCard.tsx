import { Clock, Flame } from 'lucide-react';
import { Badge } from '@/components/ui/Badge';
import type { Recipe } from '@/types/api';

export function DietBadges({ recipe }: { recipe: Recipe }) {
  return (
    <div className="flex flex-wrap gap-1.5">
      {recipe.vegan ? <Badge>Vegan</Badge> : null}
      {recipe.vegetarian ? <Badge>Vegetarian</Badge> : null}
      {recipe.gluten_free ? <Badge>Gluten-free</Badge> : null}
      {recipe.dairy_free ? <Badge>Dairy-free</Badge> : null}
    </div>
  );
}

export function RecipeCard({
  recipe,
  score,
  compact = false,
}: {
  recipe: Recipe;
  score?: number;
  compact?: boolean;
}) {
  return (
    <div
      className={
        compact
          ? 'overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm'
          : 'flex h-full flex-col overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-xl'
      }
    >
      <div className={compact ? 'h-36 bg-slate-100' : 'h-64 bg-slate-100'}>
        {recipe.image_url ? (
          <img
            src={recipe.image_url}
            alt={recipe.title}
            className="h-full w-full object-cover"
          />
        ) : (
          <div className="flex h-full items-center justify-center text-slate-400">
            No image
          </div>
        )}
      </div>
      <div className="flex flex-1 flex-col gap-2 p-4">
        <div className="flex items-start justify-between gap-2">
          <h3 className="text-lg font-semibold leading-snug text-slate-900">
            {recipe.title}
          </h3>
          {typeof score === 'number' ? (
            <span className="shrink-0 rounded-full bg-slate-100 px-2 py-0.5 text-xs text-slate-600">
              {score.toFixed(1)}
            </span>
          ) : null}
        </div>
        <div className="flex items-center gap-3 text-sm text-slate-600">
          <span className="inline-flex items-center gap-1">
            <Clock className="h-4 w-4" />
            {recipe.ready_in_minutes} min
          </span>
          <span className="inline-flex items-center gap-1">
            <Flame className="h-4 w-4" />
            {recipe.calories} kcal
          </span>
        </div>
        <DietBadges recipe={recipe} />
      </div>
    </div>
  );
}
