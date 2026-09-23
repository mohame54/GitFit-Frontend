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

export function useRecommendations(limit = 10) {
  const { profileId } = useAuth();
  return useQuery({
    queryKey: ['recommendations', profileId, limit],
    enabled: Boolean(profileId),
    queryFn: () =>
      api<Recommendation[]>(
        `/api/recommendations?limit=${limit}`,
        {},
        profileId,
      ),
  });
}

export function useRecipe(recipeId: string | undefined) {
  const { profileId } = useAuth();
  return useQuery({
    queryKey: ['recipe', recipeId],
    enabled: Boolean(recipeId),
    queryFn: () =>
      api<RecipeDetail>(`/api/recipes/${recipeId}`, {}, profileId),
  });
}

export function useProfile() {
  const { profileId } = useAuth();
  return useQuery({
    queryKey: ['profile', profileId],
    enabled: Boolean(profileId),
    queryFn: () => api<Profile>(`/api/profiles/${profileId}`, {}, profileId),
  });
}

export function useUpdateProfile() {
  const { profileId } = useAuth();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (displayName: string) =>
      api<Profile>(
        `/api/profiles/${profileId}`,
        {
          method: 'PATCH',
          body: JSON.stringify({ displayName }),
        },
        profileId,
      ),
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
    queryFn: () => api<Constraint[]>('/api/constraints', {}, profileId),
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
      api<Constraint>(
        '/api/constraints',
        { method: 'POST', body: JSON.stringify(payload) },
        profileId,
      ),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ['constraints', profileId] });
    },
  });
}

export function useDeleteConstraint() {
  const { profileId } = useAuth();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (constraintId: string) =>
      api<{ status: string }>(
        `/api/constraints/${constraintId}`,
        { method: 'DELETE' },
        profileId,
      ),
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
    queryFn: () => api<Preference[]>('/api/preferences', {}, profileId),
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
      api<Preference>(
        '/api/preferences',
        { method: 'POST', body: JSON.stringify(payload) },
        profileId,
      ),
    onSuccess: () => {
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
      return api<{ status: string }>(
        `/api/preferences?${qs.toString()}`,
        { method: 'DELETE' },
        profileId,
      );
    },
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ['preferences', profileId] });
    },
  });
}

export function useSubmitFeedback() {
  const { profileId } = useAuth();
  return useMutation({
    mutationFn: (payload: FeedbackPayload) =>
      api<{ status: string }>(
        '/api/feedback',
        { method: 'POST', body: JSON.stringify(payload) },
        profileId,
      ),
  });
}

export function useGenerateRecipe() {
  const { profileId } = useAuth();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (prompt?: string) =>
      api<GeneratedRecipe>(
        '/api/generate',
        {
          method: 'POST',
          body: JSON.stringify(prompt ? { prompt } : {}),
        },
        profileId,
      ),
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
      api<GeneratedRecipe[]>(
        `/api/generate?limit=${limit}`,
        {},
        profileId,
      ),
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
        {},
        profileId,
      ),
  });
}

export function useFeedbackHistory(limit = 20) {
  const { profileId } = useAuth();
  return useQuery({
    queryKey: ['history-feedback', profileId, limit],
    enabled: Boolean(profileId),
    queryFn: () =>
      api<FeedbackHistoryItem[]>(
        `/api/history/feedback?limit=${limit}`,
        {},
        profileId,
      ),
  });
}
