import { useState, type FormEvent } from 'react';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Badge } from '@/components/ui/Badge';
import { ErrorBox, Spinner } from '@/components/ui/Feedback';
import { useGenerateRecipe, useGeneratedRecipes } from '@/hooks/useApi';
import type { GeneratedRecipe } from '@/types/api';

function GeneratedCard({ recipe }: { recipe: GeneratedRecipe }) {
  return (
    <article className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
      <div className="flex items-start justify-between gap-2">
        <h3 className="font-semibold text-slate-900">{recipe.title}</h3>
        <span className="text-xs text-slate-500">
          {new Date(recipe.created_at).toLocaleDateString()}
        </span>
      </div>
      <p className="mt-1 text-sm text-slate-600">
        {[
          recipe.calories != null ? `${recipe.calories} kcal` : null,
          recipe.ready_in_minutes != null
            ? `${recipe.ready_in_minutes} min`
            : null,
          recipe.servings != null ? `${recipe.servings} servings` : null,
        ]
          .filter(Boolean)
          .join(' · ')}
      </p>
      <div className="mt-2 flex flex-wrap gap-1">
        {recipe.tags.map((t) => (
          <Badge key={`${t.type}-${t.value}`}>
            {t.type}: {t.value}
          </Badge>
        ))}
      </div>
      <div className="mt-3">
        <h4 className="text-sm font-medium">Ingredients</h4>
        <ul className="mt-1 list-disc space-y-0.5 pl-5 text-sm text-slate-700">
          {recipe.ingredients.map((ing) => (
            <li key={`${ing.name}-${ing.amount}`}>
              {ing.name}
              {ing.amount ? ` — ${ing.amount}` : ''}
            </li>
          ))}
        </ul>
      </div>
      <div className="mt-3">
        <h4 className="text-sm font-medium">Steps</h4>
        <ol className="mt-1 list-decimal space-y-1 pl-5 text-sm text-slate-700">
          {recipe.steps.map((step, i) => (
            <li key={`${i}-${step.slice(0, 12)}`}>{step}</li>
          ))}
        </ol>
      </div>
    </article>
  );
}

export function GeneratePage() {
  const [prompt, setPrompt] = useState('');
  const [latest, setLatest] = useState<GeneratedRecipe | null>(null);
  const generate = useGenerateRecipe();
  const history = useGeneratedRecipes();

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    try {
      const recipe = await generate.mutateAsync(prompt.trim() || undefined);
      setLatest(recipe);
    } catch {
      // error surfaced via generate.error
    }
  }

  function reset() {
    setPrompt('');
    setLatest(null);
    generate.reset();
  }

  return (
    <div className="mx-auto max-w-lg space-y-6 px-4 pt-6">
      <header>
        <h1 className="text-2xl font-bold text-slate-900">AI Recipe Generator</h1>
        <p className="text-sm text-slate-600">
          This call can take a while — hang tight after pressing Generate.
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
      </form>

      {generate.isPending ? <Spinner label="Cooking up a recipe…" /> : null}
      {latest ? <GeneratedCard recipe={latest} /> : null}

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
