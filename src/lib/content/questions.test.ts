import { describe, expect, it } from 'vitest';
import type { Question } from '../types';
import { questions } from './questions';

const categories = ['mendengar', 'logika'] as const;
const levels = [1, 2, 3, 4, 5];
const placeholders = ['[NamaAnak]', '[NamaOrtu]', '[NamaTeman]', '[HewanPeliharaan]'];

function textFields(question: Question): string[] {
  return [
    question.story,
    question.prompt,
    question.expectedAnswer,
    ...question.alternatives,
    question.hint.emoji,
    question.hint.title,
    question.hint.description
  ];
}

describe('authored Indonesian question bank', () => {
  it('contains exactly 200 questions', () => {
    expect(questions).toHaveLength(200);
  });

  it.each(categories)('contains exactly 100 %s questions', (category) => {
    expect(questions.filter((question) => question.category === category)).toHaveLength(100);
  });

  it.each(categories.flatMap((category) => levels.map((level) => ({ category, level }))))(
    'contains 20 stable IDs for $category level $level',
    ({ category, level }) => {
      const group = questions.filter(
        (question) => question.category === category && question.level === level
      );
      expect(group).toHaveLength(20);
      expect(group.map((question) => question.id).sort()).toEqual(
        Array.from(
          { length: 20 },
          (_, index) => `${category}-${level}-${String(index + 1).padStart(2, '0')}`
        )
      );
    }
  );

  it('has globally unique IDs and no unsupported category or level', () => {
    expect(new Set(questions.map((question) => question.id)).size).toBe(200);
    for (const question of questions) {
      expect(categories, question.id).toContain(question.category);
      expect(levels, question.id).toContain(question.level);
    }
  });

  it('does not repeat a story after personalization tokens are normalized', () => {
    const stories = questions.map((question) =>
      question.story
        .replace(/\[[^\]]+\]/g, '[nama]')
        .toLocaleLowerCase('id-ID')
        .replace(/\s+/g, ' ')
        .trim()
    );
    expect(new Set(stories).size).toBe(200);
  });

  it.each(questions)(
    '$id has complete text, accepted answer variants, and a usable hint',
    (question) => {
      expect(question.alternatives.length).toBeGreaterThan(0);
      expect(question.prompt).toMatch(/\?$/);
      expect(question.hint.emoji).toMatch(/\p{Extended_Pictographic}/u);

      for (const field of textFields(question)) {
        expect(typeof field).toBe('string');
        expect(field.trim().length).toBeGreaterThan(0);
        expect(field).toBe(field.trim());
        expect(field).not.toMatch(/\b(?:TODO|TBD|FIXME|lorem|ipsum|placeholder)\b|\.{3}|…/iu);

        for (const token of field.match(/\[[^\]]*\]/g) ?? []) {
          expect(placeholders, `${question.id}: ${token}`).toContain(token);
          expect(question.story, `${question.id}: token must be introduced in the story`).toContain(
            token
          );
        }
        expect(
          field.replace(/\[(?:NamaAnak|NamaOrtu|NamaTeman|HewanPeliharaan)\]/g, '')
        ).not.toMatch(/[[\]{}<>]/u);
      }

      const answers = [question.expectedAnswer, ...question.alternatives].map((answer) =>
        answer.toLocaleLowerCase('id-ID').replace(/\s+/g, ' ').trim()
      );
      expect(new Set(answers).size).toBe(answers.length);
    }
  );

  it('uses all four supported personalizations in stories', () => {
    for (const placeholder of placeholders) {
      expect(
        questions.some((question) => question.story.includes(placeholder)),
        placeholder
      ).toBe(true);
    }
  });

  it('keeps every personalized name answer consistent in its accepted alternatives', () => {
    const nameAnswers = questions.filter((question) =>
      /\[Nama(?:Anak|Ortu|Teman)\]/.test(question.expectedAnswer)
    );
    expect(nameAnswers.length).toBeGreaterThan(0);

    for (const question of nameAnswers) {
      const answerTokens = question.expectedAnswer.match(/\[[^\]]+\]/g) ?? [];
      for (const alternative of question.alternatives) {
        expect(alternative.match(/\[[^\]]+\]/g), question.id).toEqual(answerTokens);
      }
    }
  });

  it('keeps hint descriptions as clues rather than answer labels', () => {
    for (const question of questions) {
      expect(question.hint.description.toLocaleLowerCase('id-ID'), question.id).not.toBe(
        question.expectedAnswer.toLocaleLowerCase('id-ID')
      );
      expect(question.hint.description, question.id).not.toMatch(
        /jawaban(?:nya)?\s*(?:adalah|:)/iu
      );
    }
  });
});
