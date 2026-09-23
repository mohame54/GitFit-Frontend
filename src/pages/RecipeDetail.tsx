import { useState, type FormEvent } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, Star } from 'lucide-react';
import { DietBadges } from '@/components/RecipeCard';
import { Button } from '@/components/ui/Button';
import { Textarea } from '@/components/ui/Textarea';
import { ErrorBox, Spinner } from '@/components/ui/Feedback';
import { useRecipe, useSubmitFeedback } from '@/hooks/useApi';
import { cn } from '@/lib/utils';

export function RecipeDetailPage() {
  const { recipeId } = useParams();
  const navigate = useNavigate();
  const { data: detail, isLoading, isError, error } = useRecipe(recipeId);
  const submit = useSubmitFeedback();

  const [rating, setRating] = useState(0);
  const [liked, setLiked] = useState<boolean | null>(null);
  const [comment, setComment] = useState('');
  const [message, setMessage] = useState<string | null>(null);
  const [formError, setFormError] = useState<string | null>(null);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    if (!recipeId) return;
    setFormError(null);
    setMessage(null);
    try {
      await submit.mutateAsync({
        recipeId,
        ...(rating ? { rating } : {}),
        ...(liked !== null ? { liked } : {}),
        ...(comment.trim() ? { comment: comment.trim() } : {}),
      });
      setMessage('Feedback saved');
    } catch (err) {
      setFormError(err instanceof Error ? err.message : 'Failed to save');
    }
  }

  if (isLoading) return <Spinner />;
  if (isError || !detail?.recipe) {
    return (
      <div className="p-4">
        <ErrorBox
          message={
            error instanceof Error ? error.message : 'Recipe not found'
          }
        />
      </div>
    );
  }

  const { recipe, ingredients, attributes } = detail;

  return (
    <div className="mx-auto max-w-lg pb-8">
      <div className="relative h-56 bg-slate-200">
        {recipe.image_url ? (
          <img
            src={recipe.image_url}
            alt={recipe.title}
            className="h-full w-full object-cover"
          />
        ) : null}
        <button
          type="button"
          onClick={() => navigate(-1)}
          className="absolute left-3 top-3 rounded-full bg-white/90 p-2 shadow"
        >
          <ArrowLeft className="h-5 w-5" />
        </button>
      </div>

      <div className="space-y-4 px-4 pt-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">{recipe.title}</h1>
          <p className="mt-1 text-sm text-slate-600">
            {recipe.ready_in_minutes} min · {recipe.servings} servings
          </p>
          <div className="mt-2">
            <DietBadges recipe={recipe} />
          </div>
        </div>

        <div className="grid grid-cols-4 gap-2 rounded-2xl bg-white p-3 text-center shadow-sm">
          {[
            ['Cal', recipe.calories],
            ['P', `${recipe.protein_g}g`],
            ['C', `${recipe.carbs_g}g`],
            ['F', `${recipe.fat_g}g`],
          ].map(([label, value]) => (
            <div key={String(label)}>
              <div className="text-xs text-slate-500">{label}</div>
              <div className="font-semibold text-slate-900">{value}</div>
            </div>
          ))}
        </div>

        {ingredients?.length ? (
          <section className="rounded-2xl bg-white p-4 shadow-sm">
            <h2 className="font-semibold">Ingredients</h2>
            <ul className="mt-2 space-y-1 text-sm text-slate-700">
              {ingredients.map((ing) => (
                <li key={`${ing.name}-${ing.amount}`}>
                  {ing.name}
                  {ing.amount ? ` — ${ing.amount}` : ''}
                </li>
              ))}
            </ul>
          </section>
        ) : null}

        {attributes?.length ? (
          <section className="rounded-2xl bg-white p-4 shadow-sm">
            <h2 className="font-semibold">Attributes</h2>
            <ul className="mt-2 flex flex-wrap gap-2">
              {attributes.map((attr) => (
                <li
                  key={`${attr.attribute_type}-${attr.attribute_value}`}
                  className="rounded-full bg-slate-100 px-2.5 py-1 text-xs"
                >
                  {attr.attribute_type}: {attr.attribute_value}
                </li>
              ))}
            </ul>
          </section>
        ) : null}

        <form
          onSubmit={onSubmit}
          className="space-y-3 rounded-2xl bg-white p-4 shadow-sm"
        >
          <h2 className="font-semibold">Your feedback</h2>
          <div className="flex gap-1">
            {[1, 2, 3, 4, 5].map((n) => (
              <button
                key={n}
                type="button"
                onClick={() => setRating(n)}
                aria-label={`${n} stars`}
              >
                <Star
                  className={cn(
                    'h-6 w-6',
                    n <= rating
                      ? 'fill-amber-400 text-amber-400'
                      : 'text-slate-300',
                  )}
                />
              </button>
            ))}
          </div>
          <div className="flex gap-2">
            <Button
              type="button"
              variant={liked === true ? 'primary' : 'outline'}
              onClick={() => setLiked(true)}
            >
              Like
            </Button>
            <Button
              type="button"
              variant={liked === false ? 'danger' : 'outline'}
              onClick={() => setLiked(false)}
            >
              Dislike
            </Button>
          </div>
          <Textarea
            placeholder="Optional comment"
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            rows={3}
          />
          {formError ? <ErrorBox message={formError} /> : null}
          {message ? <p className="text-sm text-brand-700">{message}</p> : null}
          <Button type="submit" disabled={submit.isPending} className="w-full">
            {submit.isPending ? 'Saving…' : 'Submit feedback'}
          </Button>
        </form>
      </div>
    </div>
  );
}
