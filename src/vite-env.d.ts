/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_SUPABASE_URL: string;
  readonly VITE_SUPABASE_ANON_KEY: string;
  readonly VITE_AUTH_FUNCTION_URL: string;
  readonly VITE_API_BASE_URL: string;
  readonly VITE_API_KEY?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}

declare module 'react-tinder-card' {
  import type { ReactNode, Ref } from 'react';

  export type Direction = 'left' | 'right' | 'up' | 'down';

  export interface API {
    swipe: (dir?: Direction) => Promise<void>;
    restoreCard: () => Promise<void>;
  }

  export interface Props {
    ref?: Ref<API>;
    children?: ReactNode;
    className?: string;
    preventSwipe?: Direction[];
    flickOnMouseLeave?: boolean;
    onSwipe?: (dir: Direction) => void;
    onCardLeftScreen?: (dir: Direction) => void;
    onSwipeRequirementFulfilled?: (dir: Direction) => void;
    onSwipeRequirementUnfulfilled?: () => void;
  }

  const TinderCard: (props: Props) => JSX.Element;
  export default TinderCard;
}
