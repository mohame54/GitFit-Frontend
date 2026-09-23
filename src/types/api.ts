export interface Profile {
  id: string;
  display_name: string;
  email: string | null;
  created_at: string;
  updated_at: string;
}

export interface Recipe {
  id: string;
  title: string;
  image_url: string | null;
  ready_in_minutes: number;
  servings: number;
  calories: number;
  protein_g: number;
  carbs_g: number;
  fat_g: number;
  vegan: boolean;
  vegetarian: boolean;
  gluten_free: boolean;
  dairy_free: boolean;
  external_id?: string | null;
  source_api?: string | null;
  created_at?: string;
}

/** Partial recipe row used in history endpoints. */
export interface HistoryRecipe {
  id: string;
  title: string;
  image_url?: string | null;
  calories?: number | null;
  ready_in_minutes?: number | null;
}

export interface RecipeAttribute {
  attribute_type: string;
  attribute_value: string;
}

export interface RecipeIngredient {
  name: string;
  amount: string | null;
}

export interface RecipeDetail {
  recipe: Recipe;
  attributes: RecipeAttribute[];
  ingredients: RecipeIngredient[];
}

export interface Recommendation {
  recipe: Recipe;
  score: number;
}

export interface Constraint {
  id: string;
  constraint_type: 'allergy' | 'excluded_ingredient' | 'diet';
  value: string;
}

export interface Preference {
  preference_type:
    | 'cuisine'
    | 'ingredient'
    | 'spice_level'
    | 'meal_type'
    | 'prep_time'
    | 'texture';
  value: string;
  weight: number;
}

export interface FeedbackPayload {
  recipeId: string;
  liked?: boolean;
  rating?: number;
  comment?: string;
}

export interface FeedbackHistoryItem {
  id: string;
  recipe_id: string;
  liked: boolean | null;
  rating: number | null;
  comment: string | null;
  created_at: string;
}

export interface RecommendationHistoryItem {
  id: string;
  recipe_id: string;
  context?: string;
  recipe?: HistoryRecipe | null;
  score: number | null;
  shown_at: string;
}

export interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
}

export interface ChatRequest {
  message: string;
  sessionId?: string;
}

export interface ChatResponse {
  text: string;
  sessionId: string;
  lastAnswer?: string;
  activeAgentId?: string;
  lastAnswerAgentId?: string;
  toolCalls?: unknown[];
  messages?: ChatMessage[];
}

export interface GeneratedRecipe {
  id: string;
  user_id?: string;
  title: string;
  ingredients: { name: string; amount: string | null }[];
  steps: string[];
  tags: { type: string; value: string }[];
  calories: number | null;
  ready_in_minutes: number | null;
  servings: number | null;
  is_valid?: boolean;
  created_at: string;
}

export interface AuthResponse {
  user: {
    id: string;
    email?: string;
    user_metadata?: Record<string, unknown>;
  };
  session: {
    access_token: string;
    refresh_token: string;
    expires_in?: number;
    token_type?: string;
  };
  profileId: string | null;
  onboardingComplete: boolean;
}

export interface ChatPersistedState {
  sessionId: string | null;
  messages: ChatMessage[];
}
