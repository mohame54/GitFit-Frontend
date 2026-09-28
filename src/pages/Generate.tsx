import { useState, type FormEvent } from 'react';
import { ChevronDown } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Badge } from '@/components/ui/Badge';
import { ErrorBox, Spinner } from '@/components/ui/Feedback';
import {
  MAX_RECIPES_PER_GENERATE,
  useGenerateRecipe,
  useGeneratedRecipes,
} from '@/hooks/useApi';
import { cn, formatIngredientQuantity } from '@/lib/utils';
import type { GeneratedRecipe } from '@/types/api';

function GeneratedCard({ recipe }: { recipe: GeneratedRecipe }) {
  const [showIngredients, setShowIngredients] = useState(false);
  const [showSteps, setShowSteps] = useState(false);
  const meta = [
    recipe.calories != null ? `${recipe.calories} kcal` : null,
    recipe.ready_in_minutes != null ? `${recipe.ready_in_minutes} min` : null,
    recipe.servings != null ? `${recipe.servings} servings` : null,
  ]
    .filter(Boolean)
    .join(' · ');

  return (
    <article className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
      {recipe.image_url ? (
        <div className="relative h-56 bg-slate-200">
          <img
            src={recipe.image_url}
            alt=""
            className="h-full w-full object-cover"
          />
          <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/75 via-black/40 to-transparent px-4 pb-4 pt-16">
            <h3 className="text-2xl font-bold leading-tight text-white">
              {recipe.title}
            </h3>
          </div>
        </div>
      ) : (
        <h3 className="px-4 pt-4 text-2xl font-bold leading-tight text-slate-900">
          {recipe.title}
        </h3>
      )}

      <div className="space-y-3 p-4">
        <div className="flex items-start justify-between gap-2 text-sm text-slate-500">
          <p>{meta}</p>
          <span className="shrink-0 text-xs">
            {new Date(recipe.created_at).toLocaleDateString()}
          </span>
        </div>
        {recipe.tags.length ? (
          <div className="flex flex-wrap gap-1">
            {recipe.tags.map((tag) => (
              <Badge key={`${tag.type}-${tag.value}`}>
                {tag.type}: {tag.value}
              </Badge>
            ))}
          </div>
        ) : null}

        <div className="flex gap-2">
          <Button
            type="button"
            size="sm"
            variant={showIngredients ? 'secondary' : 'outline'}
            aria-expanded={showIngredients}
            onClick={() => setShowIngredients((open) => !open)}
          >
            Ingredients
            <ChevronDown
              className={cn(
                'h-4 w-4 transition',
                showIngredients && 'rotate-180',
              )}
            />
          </Button>
          <Button
            type="button"
            size="sm"
            variant={showSteps ? 'secondary' : 'outline'}
            aria-expanded={showSteps}
            onClick={() => setShowSteps((open) => !open)}
          >
            Steps
            <ChevronDown
              className={cn('h-4 w-4 transition', showSteps && 'rotate-180')}
            />
          </Button>
        </div>

        {showIngredients ? (
          <ul className="list-disc space-y-0.5 pl-5 text-sm text-slate-700">
            {recipe.ingredients.map((ing, index) => {
              const quantity = formatIngredientQuantity(ing);
              return (
                <li key={`${ing.name}-${quantity}-${index}`}>
                  {ing.name}
                  {quantity ? ` — ${quantity}` : ''}
                </li>
              );
            })}
          </ul>
        ) : null}

        {showSteps ? (
          <ol className="list-decimal space-y-1 pl-5 text-sm text-slate-700">
            {recipe.steps.map((step, i) => (
              <li key={`${i}-${step.slice(0, 12)}`}>{step}</li>
            ))}
          </ol>
        ) : null}
      </div>
    </article>
  );
}

export function GeneratePage() {
  const [prompt, setPrompt] = useState('');
  const [latest, setLatest] = useState<GeneratedRecipe[]>([]);
  const [batchWarning, setBatchWarning] = useState<string | null>(null);
  const generate = useGenerateRecipe();
  const history = useGeneratedRecipes();
  const latestIds = new Set(latest.map((recipe) => recipe.id));

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setBatchWarning(null);
    try {
      const result = await generate.mutateAsync(prompt.trim() || undefined);
      setLatest(result.recipes);
      setBatchWarning(result.warning);
    } catch {
      // error surfaced via generate.error
    }
  }

  function reset() {
    setPrompt('');
    setLatest([]);
    setBatchWarning(null);
    generate.reset();
  }

  return (
    <div className="mx-auto max-w-lg space-y-6 px-4 pt-6">
      <header>
        <h1 className="text-2xl font-bold text-slate-900">AI Recipe Generator</h1>
        <p className="text-sm text-slate-600">
          Each generate returns up to {MAX_RECIPES_PER_GENERATE} recipes. This
          can take a while — hang tight after pressing Generate.
        </p>
      </header>

      <form
        onSubmit={onSubmit}
        className="space-y-3 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm"
      >
        <Input
          placeholder='Optional prompt, e.g. "quick high-protein lunch"'
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          disabled={generate.isPending}
        />
        <div className="flex gap-2">
          <Button type="submit" disabled={generate.isPending} className="flex-1">
            {generate.isPending ? 'Generating…' : 'Generate'}
          </Button>
          <Button type="button" variant="secondary" onClick={reset}>
            Generate another
          </Button>
        </div>
        {generate.isError ? (
          <ErrorBox
            message={
              generate.error instanceof Error
                ? generate.error.message
                : 'Generation failed'
            }
          />
        ) : null}
        {batchWarning ? <ErrorBox message={batchWarning} /> : null}
      </form>

      {generate.isPending ? <Spinner label="Cooking up recipes…" /> : null}
      {latest.length ? (
        <section className="space-y-3">
          <h2 className="text-lg font-semibold">
            Just generated ({latest.length})
          </h2>
          {latest.map((recipe) => (
            <GeneratedCard key={recipe.id} recipe={recipe} />
          ))}
        </section>
      ) : null}

      <section>
        <h2 className="mb-3 text-lg font-semibold">Past generations</h2>
        {history.isLoading ? <Spinner /> : null}
        {history.isError ? (
          <ErrorBox
            message={
              history.error instanceof Error
                ? history.error.message
                : 'Failed to load history'
            }
          />
        ) : null}
        <div className="space-y-3">
          {(history.data ?? [])
            .slice()
            .filter((recipe) => !latestIds.has(recipe.id))
            .sort(
              (a, b) =>
                new Date(b.created_at).getTime() -
                new Date(a.created_at).getTime(),
            )
            .map((recipe) => (
              <GeneratedCard key={recipe.id} recipe={recipe} />
            ))}
        </div>
      </section>
    </div>
  );
}
