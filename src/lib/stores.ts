import { writable, derived } from 'svelte/store';
import type { ChildProfile, Question } from './types';
import { personalize } from './personalize';
// Create per layout, not as a server-side singleton.
export function createLearningStores() {
  const profile = writable<ChildProfile | null>(null);
  const question = writable<Question | null>(null);
  const sensoryMode = writable(false);
  const personalizedQuestion = derived([profile, question], ([$profile, $question]) =>
    $question ? personalize($question, $profile) : null
  );
  return { profile, question, sensoryMode, personalizedQuestion };
}
export type LearningStores = ReturnType<typeof createLearningStores>;
