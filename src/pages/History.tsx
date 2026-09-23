import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Clock, Flame, Star } from 'lucide-react';
import { EmptyState, ErrorBox, Spinner } from '@/components/ui/Feedback';
import {
  useFeedbackHistory,
  useRecommendationHistory,
} from '@/hooks/useApi';
import { cn } from '@/lib/utils';

export function HistoryPage() {
  const [tab, setTab] = useState<'shown' | 'feedback'>('shown');
  const shown = useRecommendationHistory(20);
  const feedback = useFeedbackHistory(20);

  return (
    <div className="mx-auto max-w-lg space-y-4 px-4 pt-6">
      <h1 className="text-2xl font-bold text-slate-900">History</h1>

      <div className="flex rounded-xl bg-slate-100 p-1">
        {(
          [
            ['shown', 'Shown to me'],
            ['feedback', 'My feedback'],
          ] as const
        ).map(([key, label]) => (
          <button
            key={key}
            type="button"
            onClick={() => setTab(key)}
            className={cn(
              'flex-1 rounded-lg px-3 py-2 text-sm font-medium',
              tab === key ? 'bg-white shadow text-slate-900' : 'text-slate-600',
            )}
          >
            {label}
          </button>
        ))}
      </div>

      {tab === 'shown' ? (
        <div className="space-y-3">
          {shown.isLoading ? <Spinner /> : null}
          {shown.isError ? (
            <ErrorBox
              message={
                shown.error instanceof Error
                  ? shown.error.message
                  : 'Failed to load'
              }
            />
          ) : null}
          {!shown.isLoading && (shown.data?.length ?? 0) === 0 ? (
            <EmptyState title="No recommendations yet" />
          ) : null}
          {shown.data?.map((item) => {
            if (!item.recipe) {
              return (
                <article
                  key={item.id}
                  className="rounded-2xl border border-dashed border-slate-300 bg-white p-4 text-sm text-slate-500"
                >
                  Recipe unavailable
                  <p className="mt-1 text-xs">
                    Shown {new Date(item.shown_at).toLocaleString()}
                  </p>
                </article>
              );
            }

            const recipe = item.recipe;
            return (
              <Link key={item.id} to={`/recipe/${recipe.id}`}>
                <article className="mb-3 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
                  {recipe.image_url ? (
                    <img
                      src={recipe.image_url}
                      alt={recipe.title}
                      className="h-36 w-full object-cover"
                    />
                  ) : (
                    <div className="flex h-24 items-center justify-center bg-slate-100 text-slate-400">
                      No image
                    </div>
                  )}
                  <div className="space-y-1 p-4">
                    <div className="flex items-start justify-between gap-2">
                      <h3 className="font-semibold text-slate-900">
                        {recipe.title}
                      </h3>
                      {item.score != null ? (
                        <span className="shrink-0 rounded-full bg-slate-100 px-2 py-0.5 text-xs text-slate-600">
                          {item.score.toFixed(1)}
                        </span>
                      ) : null}
                    </div>
                    <div className="flex items-center gap-3 text-sm text-slate-600">
                      {recipe.ready_in_minutes != null ? (
                        <span className="inline-flex items-center gap-1">
                          <Clock className="h-4 w-4" />
                          {recipe.ready_in_minutes} min
                        </span>
                      ) : null}
                      {recipe.calories != null ? (
                        <span className="inline-flex items-center gap-1">
                          <Flame className="h-4 w-4" />
                          {recipe.calories} kcal
                        </span>
                      ) : null}
                    </div>
                    <p className="text-xs text-slate-500">
                      Shown {new Date(item.shown_at).toLocaleString()}
                    </p>
                  </div>
                </article>
              </Link>
            );
          })}
        </div>
      ) : (
        <div className="space-y-3">
          {feedback.isLoading ? <Spinner /> : null}
          {feedback.isError ? (
            <ErrorBox
              message={
                feedback.error instanceof Error
                  ? feedback.error.message
                  : 'Failed to load'
              }
            />
          ) : null}
          {!feedback.isLoading && (feedback.data?.length ?? 0) === 0 ? (
            <EmptyState title="No feedback yet" />
          ) : null}
          {feedback.data?.map((item) => (
            <article
              key={item.id}
              className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm"
            >
              <div className="flex items-start justify-between gap-2">
                <h3 className="font-semibold text-slate-900">
                  Recipe {item.recipe_id.slice(0, 8)}…
                </h3>
                <span className="text-xs text-slate-500">
                  {new Date(item.created_at).toLocaleDateString()}
                </span>
              </div>
              <div className="mt-2 flex items-center gap-2 text-sm">
                {item.rating != null ? (
                  <span className="inline-flex items-center gap-0.5 text-amber-500">
                    <Star className="h-4 w-4 fill-current" />
                    {item.rating}
                  </span>
                ) : null}
                {item.liked === true ? (
                  <span className="text-brand-700">Liked</span>
                ) : null}
                {item.liked === false ? (
                  <span className="text-red-600">Disliked</span>
                ) : null}
              </div>
              {item.comment ? (
                <p className="mt-2 line-clamp-2 text-sm text-slate-600">
                  {item.comment}
                </p>
              ) : null}
              <Link
                className="mt-2 inline-block text-sm font-medium text-brand-700"
                to={`/recipe/${item.recipe_id}`}
              >
                View recipe
              </Link>
            </article>
          ))}
        </div>
      )}
    </div>
  );
}
