import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Heart, Search, X } from 'lucide-react';
import type { API, Direction } from 'react-tinder-card';
import { SwipeCard } from '@/components/SwipeCard';
import { Button } from '@/components/ui/Button';
import { EmptyState, ErrorBox, Spinner } from '@/components/ui/Feedback';
import { useRecommendations, useSubmitFeedback } from '@/hooks/useApi';
import type { Recommendation } from '@/types/api';

export function HomePage() {
  const navigate = useNavigate();
  const { data, isLoading, isError, error, refetch, isFetching } =
    useRecommendations(10);
  const feedback = useSubmitFeedback();

  const [stack, setStack] = useState<Recommendation[] | null>(null);
  const [exhausted, setExhausted] = useState(false);
  const childRefs = useRef<Map<string, API | null>>(new Map());
  const fetchingMore = useRef(false);

  const activeStack = stack ?? data ?? [];

  useEffect(() => {
    if (stack === null && data) {
      setStack(data);
      if (data.length === 0) setExhausted(true);
    }
  }, [data, stack]);

  useEffect(() => {
    if (
      stack === null ||
      stack.length >= 2 ||
      exhausted ||
      isFetching ||
      fetchingMore.current
    ) {
      return;
    }

    fetchingMore.current = true;
    void refetch()
      .then((result) => {
        const next = result.data ?? [];
        setStack((prev) => {
          const current = prev ?? [];
          const ids = new Set(current.map((p) => p.recipe.id));
          const appended = next.filter((n) => !ids.has(n.recipe.id));
          if (appended.length === 0) setExhausted(true);
          return [...current, ...appended];
        });
      })
      .finally(() => {
        fetchingMore.current = false;
      });
  }, [stack, exhausted, isFetching, refetch]);

  const visible = useMemo(
    () => activeStack.slice(0, 3).reverse(),
    [activeStack],
  );

  const onSwipe = useCallback(
    (dir: Direction, recipeId: string) => {
      if (dir === 'right') {
        feedback.mutate({ recipeId, liked: true });
      } else if (dir === 'left') {
        feedback.mutate({ recipeId, liked: false });
      } else if (dir === 'up') {
        navigate(`/recipe/${recipeId}`);
      }
    },
    [feedback, navigate],
  );

  const onCardLeftScreen = useCallback((recipeId: string) => {
    setStack((prev) =>
      (prev ?? []).filter((item) => item.recipe.id !== recipeId),
    );
    childRefs.current.delete(recipeId);
  }, []);

  const swipe = async (dir: Direction) => {
    const top = activeStack[0];
    if (!top) return;
    const api = childRefs.current.get(top.recipe.id);
    if (api) await api.swipe(dir);
  };

  if (isLoading && activeStack.length === 0) {
    return <Spinner label="Loading recommendations…" />;
  }

  return (
    <div className="mx-auto max-w-md px-4 pt-6">
      <header className="mb-4">
        <h1 className="text-2xl font-bold text-slate-900">For you</h1>
        <p className="text-sm text-slate-600">
          Swipe right to like, left to pass, up for details
        </p>
      </header>

      {isError ? (
        <ErrorBox
          message={
            error instanceof Error
              ? error.message
              : 'Failed to load recommendations'
          }
        />
      ) : null}

      {activeStack.length === 0 && !isFetching ? (
        <EmptyState
          title="No more recipes match your preferences"
          description="Try adjusting your constraints in Profile."
          action={
            <Button onClick={() => navigate('/profile')}>Open Profile</Button>
          }
        />
      ) : (
        <>
          <div className="relative mx-auto h-[28rem] w-full">
            {visible.map((item, index) => {
              const depth = visible.length - 1 - index;
              return (
                <SwipeCard
                  key={item.recipe.id}
                  ref={(api) => {
                    childRefs.current.set(item.recipe.id, api);
                  }}
                  item={item}
                  onSwipe={onSwipe}
                  onCardLeftScreen={onCardLeftScreen}
                  zIndex={10 + depth}
                  scale={1 - depth * 0.04}
                />
              );
            })}
          </div>

          <div className="mt-6 flex items-center justify-center gap-4">
            <Button
              size="icon"
              variant="outline"
              aria-label="Pass"
              onClick={() => void swipe('left')}
            >
              <X className="h-5 w-5 text-red-500" />
            </Button>
            <Button
              size="icon"
              variant="outline"
              aria-label="View details"
              onClick={() => {
                const top = activeStack[0];
                if (top) navigate(`/recipe/${top.recipe.id}`);
              }}
            >
              <Search className="h-5 w-5 text-sky-600" />
            </Button>
            <Button
              size="icon"
              variant="outline"
              aria-label="Like"
              onClick={() => void swipe('right')}
            >
              <Heart className="h-5 w-5 text-brand-600" />
            </Button>
          </div>
          <p className="mt-3 text-center text-xs text-slate-500">
            Or{' '}
            <Link className="text-brand-700" to="/chat">
              ask the recommendation chat
            </Link>
          </p>
        </>
      )}
    </div>
  );
}
