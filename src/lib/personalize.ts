import type { ChildProfile, Question } from './types';
export function renderTemplate(text: string, profile: Partial<ChildProfile> | null) {
  const values: Record<string, string> = {
    NamaAnak: profile?.name?.trim() || 'Dika',
    NamaOrtu: profile?.parentName?.trim() || 'Bunda',
    NamaTeman: profile?.friendName?.trim() || 'Lala',
    HewanPeliharaan: profile?.petName?.trim() || 'Milo'
  };
  return text.replace(
    /\[(NamaAnak|NamaOrtu|NamaTeman|HewanPeliharaan)\]/g,
    (_, key: string) => values[key]
  );
}
export function personalize(question: Question, profile: Partial<ChildProfile> | null): Question {
  const render = (text: string) => renderTemplate(text, profile);
  return {
    ...question,
    story: render(question.story),
    prompt: render(question.prompt),
    expectedAnswer: render(question.expectedAnswer),
    alternatives: question.alternatives.map(render),
    hint: {
      ...question.hint,
      title: render(question.hint.title),
      description: render(question.hint.description)
    }
  };
}
