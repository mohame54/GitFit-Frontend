import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from '@/api/client';
import { useAuth } from '@/auth/AuthProvider';
import type {
  Constraint,
  FeedbackHistoryItem,
  FeedbackPayload,
  GeneratedRecipe,
  Preference,
  Profile,
  RecipeDetail,
  Recommendation,
  RecommendationHistoryItem,
} from '@/types/api';

function isConstraint(value: unknown): value is Constraint {
  if (!value || typeof value !== 'object') return false;
  const row = value as Constraint;
  return (
    typeof row.id === 'string' &&
    typeof row.constraint_type === 'string' &&
    typeof row.value === 'string'
  );
}

function isPreference(value: unknown): value is Preference {
  if (!value || typeof value !== 'object') return false;
  const row = value as Preference;
  return (
    typeof row.preference_type === 'string' &&
    typeof row.value === 'string' &&
    typeof row.weight === 'number'
  );
}

export function refreshProfileQueries(
  qc: ReturnType<typeof useQueryClient>,
  profileId: string | null,
) {
  void qc.invalidateQueries({ queryKey: ['constraints', profileId] });
  void qc.invalidateQueries({ queryKey: ['preferences', profileId] });
  void qc.invalidateQueries({ queryKey: ['recommendations', profileId] });
}

export function useRecommendations(limit = 10) {
  const { profileId } = useAuth();
  return useQuery({
    queryKey: ['recommendations', profileId, limit],
    enabled: Boolean(profileId),
    queryFn: () => api<Recommendation[]>(`/api/recommendations?limit=${limit}`),
  });
}

export function useRecipe(recipeId: string | undefined) {
  return useQuery({
    queryKey: ['recipe', recipeId],
    enabled: Boolean(recipeId),
    queryFn: () => api<RecipeDetail>(`/api/recipes/${recipeId}`),
  });
}

export function useProfile() {
  const { profileId } = useAuth();
  return useQuery({
    queryKey: ['profile', profileId],
    enabled: Boolean(profileId),
    queryFn: () => api<Profile>(`/api/profiles/${profileId}`),
  });
}

export function useUpdateProfile() {
  const { profileId } = useAuth();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (displayName: string) =>
      api<Profile>(`/api/profiles/${profileId}`, {
        method: 'PATCH',
        body: JSON.stringify({ displayName }),
      }),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ['profile', profileId] });
    },
  });
}

export function useConstraints() {
  const { profileId } = useAuth();
  return useQuery({
    queryKey: ['constraints', profileId],
    enabled: Boolean(profileId),
    refetchOnMount: 'always',
    queryFn: async () => {
      const body = await api<unknown>('/api/constraints');
      if (!Array.isArray(body)) {
        throw new Error('Constraints response was not a list');
      }
      return body as Constraint[];
    },
  });
}

export function useAddConstraint() {
  const { profileId } = useAuth();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload: {
      constraint_type: Constraint['constraint_type'];
      value: string;
    }) =>
      api<Constraint>('/api/constraints', {
        method: 'POST',
        body: JSON.stringify(payload),
      }),
    onSuccess: (created) => {
      if (isConstraint(created)) {
        qc.setQueryData<Constraint[]>(['constraints', profileId], (current) => {
          const rows = Array.isArray(current) ? current : [];
          return [
            ...rows.filter(
              (row) =>
                row.constraint_type !== created.constraint_type ||
                row.value !== created.value,
            ),
            created,
          ];
        });
      }
      void qc.invalidateQueries({ queryKey: ['constraints', profileId] });
    },
  });
}

export function useDeleteConstraint() {
  const { profileId } = useAuth();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (constraintId: string) =>
      api<{ status: string }>(`/api/constraints/${constraintId}`, {
        method: 'DELETE',
      }),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ['constraints', profileId] });
    },
  });
}

export function usePreferences() {
  const { profileId } = useAuth();
  return useQuery({
    queryKey: ['preferences', profileId],
    enabled: Boolean(profileId),
    refetchOnMount: 'always',
    queryFn: async () => {
      const body = await api<unknown>('/api/preferences');
      if (!Array.isArray(body)) {
        throw new Error('Preferences response was not a list');
      }
      return body as Preference[];
    },
  });
}

export function useAddPreference() {
  const { profileId } = useAuth();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload: {
      preference_type: Preference['preference_type'];
      value: string;
      weight: number;
    }) =>
      api<Preference>('/api/preferences', {
        method: 'POST',
        body: JSON.stringify(payload),
      }),
    onSuccess: (created) => {
      if (isPreference(created)) {
        qc.setQueryData<Preference[]>(['preferences', profileId], (current) => {
          const rows = Array.isArray(current) ? current : [];
          return [
            ...rows.filter(
              (row) =>
                row.preference_type !== created.preference_type ||
                row.value !== created.value,
            ),
            created,
          ];
        });
      }
      void qc.invalidateQueries({ queryKey: ['preferences', profileId] });
    },
  });
}

export function useDeletePreference() {
  const { profileId } = useAuth();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload: {
      preference_type: Preference['preference_type'];
      value: string;
    }) => {
      const qs = new URLSearchParams({
        preference_type: payload.preference_type,
        value: payload.value,
      });
      return api<{ status: string }>(`/api/preferences?${qs.toString()}`, {
        method: 'DELETE',
      });
    },
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ['preferences', profileId] });
    },
  });
}

export function useSubmitFeedback() {
  return useMutation({
    mutationFn: (payload: FeedbackPayload) =>
      api<{ status: string }>('/api/feedback', {
        method: 'POST',
        body: JSON.stringify(payload),
      }),
  });
}

export const MAX_RECIPES_PER_GENERATE = 5;

function isGeneratedRecipe(value: unknown): value is GeneratedRecipe {
  if (!value || typeof value !== 'object') return false;
  const row = value as GeneratedRecipe;
  return (
    typeof row.id === 'string' &&
    typeof row.title === 'string' &&
    Array.isArray(row.ingredients) &&
    Array.isArray(row.steps)
  );
}

function unwrapGeneratedRecipes(body: unknown): GeneratedRecipe[] {
  const list = Array.isArray(body)
    ? body
    : body &&
        typeof body === 'object' &&
        'recipes' in body &&
        Array.isArray((body as { recipes: unknown }).recipes)
      ? (body as { recipes: unknown[] }).recipes
      : [body];
  return list.filter(isGeneratedRecipe);
}

function uniqueRecipes(recipes: GeneratedRecipe[]): GeneratedRecipe[] {
  const seen = new Set<string>();
  const unique: GeneratedRecipe[] = [];
  for (const recipe of recipes) {
    if (seen.has(recipe.id)) continue;
    seen.add(recipe.id);
    unique.push(recipe);
    if (unique.length >= MAX_RECIPES_PER_GENERATE) break;
  }
  return unique;
}

export function useGenerateRecipe() {
  const { profileId } = useAuth();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (prompt?: string) => {
      const payload = JSON.stringify(prompt ? { prompt } : {});
      const results = await Promise.allSettled(
        Array.from({ length: MAX_RECIPES_PER_GENERATE }, () =>
          api<unknown>('/api/generate', { method: 'POST', body: payload }),
        ),
      );

      const recipes: GeneratedRecipe[] = [];
      const failures: string[] = [];
      for (const result of results) {
        if (result.status === 'fulfilled') {
          recipes.push(...unwrapGeneratedRecipes(result.value));
          continue;
        }
        failures.push(
          result.reason instanceof Error
            ? result.reason.message
            : 'Recipe generation failed',
        );
      }

      const unique = uniqueRecipes(recipes);
      if (!unique.length) {
        throw new Error(failures[0] ?? 'Generation returned no recipes');
      }

      const warning =
        failures.length > 0
          ? `Generated ${unique.length} of ${MAX_RECIPES_PER_GENERATE}. ${failures[0]}`
          : null;
      return { recipes: unique, warning };
    },
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ['generated', profileId] });
    },
  });
}

export function useGeneratedRecipes(limit = 20) {
  const { profileId } = useAuth();
  return useQuery({
    queryKey: ['generated', profileId, limit],
    enabled: Boolean(profileId),
    queryFn: () =>
      api<GeneratedRecipe[]>(`/api/generate?limit=${limit}`),
  });
}

export function useRecommendationHistory(limit = 20) {
  const { profileId } = useAuth();
  return useQuery({
    queryKey: ['history-recommendations', profileId, limit],
    enabled: Boolean(profileId),
    queryFn: () =>
      api<RecommendationHistoryItem[]>(
        `/api/history/recommendations?limit=${limit}`,
      ),
  });
}

export function useFeedbackHistory(limit = 20) {
  const { profileId } = useAuth();
  return useQuery({
    queryKey: ['history-feedback', profileId, limit],
    enabled: Boolean(profileId),
    queryFn: () =>
      api<FeedbackHistoryItem[]>(`/api/history/feedback?limit=${limit}`),
  });
}
