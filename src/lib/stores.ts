import { writable, derived } from 'svelte/store';
import type { ChildProfile, Question } from './types';
import { personalize } from './personalize';
import type { Language } from './pilot/types';
// Create per layout, not as a server-side singleton.
export function createLearningStores() {
  const profile = writable<ChildProfile | null>(null);
  const question = writable<Question | null>(null);
  const sensoryMode = writable(false);
  const uiLanguage = writable<Language>('id');
  const personalizedQuestion = derived([profile, question], ([$profile, $question]) =>
    $question ? personalize($question, $profile) : null
  );
  return { profile, question, sensoryMode, personalizedQuestion, uiLanguage };
}
export type LearningStores = ReturnType<typeof createLearningStores>;
