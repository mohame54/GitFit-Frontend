import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';
import type { RecipeIngredient } from '@/types/api';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/** Quantity only, such as `500 g` or `2 clove`. Amount and unit are separate fields. */
export function formatIngredientQuantity(
  ingredient: Pick<RecipeIngredient, 'amount' | 'unit'>,
): string {
  const amount =
    ingredient.amount == null || ingredient.amount === ''
      ? ''
      : String(ingredient.amount);
  const unit = ingredient.unit?.trim() ?? '';
  return [amount, unit].filter(Boolean).join(' ');
}
