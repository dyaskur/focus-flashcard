import { describe, expect, it } from 'vitest';
import { renderTemplate } from '../personalize';
import { pilotCards } from './cards';
import type { CardVersion, Language } from './types';

const languages = ['id', 'en'] as const;
const tokens = ['[NamaAnak]', '[NamaOrtu]', '[NamaTeman]', '[HewanPeliharaan]'];

function fields(version: CardVersion): string[] {
  return [
    version.title,
    version.story,
    ...version.questions.flatMap((question) => [
      question.prompt,
      question.expectedAnswer,
      ...question.alternatives,
      question.hint.emoji,
      question.hint.title,
      question.hint.description,
      question.secondHint,
      question.explanation
    ])
  ];
}

function version(id: string, language: Language) {
  const found = pilotCards.find((card) => card.id === id);
  expect(found, id).toBeDefined();
  return found!.versions[language];
}

function answer(id: string, questionId: string, language: Language) {
  const question = version(id, language).questions.find((question) => question.id === questionId);
  expect(question, `${id}/${questionId}`).toBeDefined();
  return question!.expectedAnswer;
}

describe('bilingual caregiver pilot cards', () => {
  it('has exactly 20 distinct cards, five for each category/level pair', () => {
    expect(pilotCards).toHaveLength(20);
    expect(new Set(pilotCards.map((card) => card.id)).size).toBe(20);
    for (const category of ['mendengar', 'logika']) {
      for (const level of [1, 2]) {
        expect(
          pilotCards.filter((card) => card.category === category && card.level === level)
        ).toHaveLength(5);
      }
    }
    for (const language of languages) {
      const stories = pilotCards.map((card) =>
        card.versions[language].story
          .replace(/\[[^\]]+\]/g, '[person]')
          .toLowerCase()
          .replace(/\s+/g, ' ')
          .trim()
      );
      expect(new Set(stories).size).toBe(20);
    }
  });

  it.each(pilotCards)(
    '$id aligns stable question IDs, skills, tokens and accepted meanings',
    (card) => {
      expect(Object.keys(card.versions).sort()).toEqual(['en', 'id']);
      const left = card.versions.id;
      const right = card.versions.en;
      expect(left.questions.map((q) => q.id)).toEqual(right.questions.map((q) => q.id));
      expect(new Set(left.questions.map((q) => q.id)).size).toBe(left.questions.length);
      expect(left.story.match(/\[[^\]]+\]/g) ?? []).toEqual(right.story.match(/\[[^\]]+\]/g) ?? []);
      left.questions.forEach((question, index) => {
        const translated = right.questions[index];
        expect(translated.skill).toBe(question.skill);
        expect(question.alternatives).toContain(translated.expectedAnswer);
        expect(translated.alternatives).toContain(question.expectedAnswer);
        expect(question.expectedAnswer.match(/\[[^\]]+\]/g) ?? []).toEqual(
          translated.expectedAnswer.match(/\[[^\]]+\]/g) ?? []
        );
      });
    }
  );

  it.each(pilotCards)('$id has complete, usable question content in both languages', (card) => {
    for (const language of languages) {
      const content = card.versions[language];
      expect(content.questions.length).toBeGreaterThanOrEqual(2);
      expect(content.questions.length).toBeLessThanOrEqual(4);
      for (const text of fields(content)) {
        expect(text.trim()).toBe(text);
        expect(text.length).toBeGreaterThan(0);
        expect(text).not.toMatch(/\b(?:TODO|TBD|FIXME|lorem|ipsum)\b|\.{3}|…/iu);
      }
      for (const question of content.questions) {
        expect(question.id).toMatch(/^[a-z]+(?:-[a-z]+)*$/);
        expect(['who', 'what', 'where', 'when', 'sequence', 'cause']).toContain(question.skill);
        expect(question.prompt).toMatch(/\?$/);
        expect(question.alternatives.length).toBeGreaterThan(0);
        expect(new Set(question.alternatives).size).toBe(question.alternatives.length);
        expect(question.hint.emoji).toMatch(/\p{Extended_Pictographic}/u);
        expect(question.explanation.length).toBeLessThanOrEqual(150);
        expect(question.hint.description.toLowerCase()).not.toBe(
          question.expectedAnswer.toLowerCase()
        );
        // A literal-answer leak guard, not a substitute for semantic editorial review.
        for (const other of content.questions.filter((other) => other.id !== question.id)) {
          for (const hint of [
            question.hint.title,
            question.hint.description,
            question.secondHint
          ]) {
            expect(hint.toLowerCase(), `${card.id}/${question.id} leaks ${other.id}`).not.toContain(
              other.expectedAnswer.toLowerCase()
            );
          }
        }
      }
    }
  });

  it('uses only the four supported tokens and renders every text field with real and default profiles', () => {
    const used = new Set<string>();
    const profile = { name: 'Ayu', parentName: 'Pak Rio', friendName: 'Sinta', petName: 'Kiko' };
    for (const card of pilotCards) {
      for (const language of languages) {
        const content = card.versions[language];
        for (const field of fields(content)) {
          for (const token of field.match(/\[[^\]]*\]/g) ?? []) {
            used.add(token);
            expect(tokens).toContain(token);
            expect(content.story).toContain(token);
          }
          for (const candidate of [profile, null, {}]) {
            expect(renderTemplate(field, candidate)).not.toMatch(/[[\]{}]/u);
          }
        }
        for (const question of content.questions) {
          for (const token of question.expectedAnswer.match(/\[[^\]]+\]/g) ?? []) {
            expect(renderTemplate(content.story, profile)).toContain(
              renderTemplate(token, profile)
            );
            for (const alternative of question.alternatives) {
              expect(alternative).toContain(token);
              expect(renderTemplate(alternative, profile)).toBe(
                renderTemplate(question.expectedAnswer, profile)
              );
            }
          }
        }
      }
    }
    expect([...used].sort()).toEqual([...tokens].sort());
    expect(renderTemplate(answer('listen-1-bag', 'hat-carrier', 'en'), profile)).toBe('Pak Rio');
    expect(renderTemplate(answer('listen-2-delivery', 'umbrella-carrier', 'id'), profile)).toBe(
      'Sinta'
    );
    expect(renderTemplate(version('listen-1-pet', 'en').story, profile)).toContain('Kiko');
    expect(renderTemplate(version('listen-1-bag', 'id').story, profile)).toContain('Ayu');
  });

  it('adds memory load at level 2 and keeps logical questions about cause or sequence', () => {
    for (const card of pilotCards) {
      for (const language of languages) {
        if (card.level === 2)
          expect(card.versions[language].questions.length).toBeGreaterThanOrEqual(3);
        if (card.category === 'logika') {
          for (const question of card.versions[language].questions) {
            expect(['cause', 'sequence']).toContain(question.skill);
          }
        }
      }
    }
    for (const language of languages) {
      const averageWords = (level: number) => {
        const cards = pilotCards.filter((card) => card.level === level);
        return (
          cards.reduce(
            (total, card) => total + card.versions[language].story.split(/\s+/).length,
            0
          ) / cards.length
        );
      };
      expect(averageWords(2)).toBeGreaterThan(averageWords(1));
    }
  });

  it('independently checks delivery recipients and order, not mention order', () => {
    expect(version('listen-2-delivery', 'id').story).toContain(
      'roti untuk Nenek dan surat untuk Paman'
    );
    expect(version('listen-2-delivery', 'en').story).toContain(
      'delivers the letter first, then the bread'
    );
    expect(answer('listen-2-delivery', 'bread-recipient', 'id')).toBe('Nenek');
    expect(answer('listen-2-delivery', 'bread-recipient', 'en')).toBe('Grandma');
    expect(answer('listen-2-delivery', 'delivery-order', 'id')).toBe('roti');
    expect(answer('listen-2-delivery', 'delivery-order', 'en')).toBe('bread');
  });

  it('independently checks train boarding, departure, and who remains', () => {
    expect(version('listen-2-train', 'id').story).toContain('Di stasiun kedua, penjual turun');
    expect(version('listen-2-train', 'en').story).toContain('They get off at the third station');
    expect(answer('listen-2-train', 'seller-stop', 'id')).toBe('stasiun kedua');
    expect(answer('listen-2-train', 'seller-stop', 'en')).toBe('the second station');
    expect(answer('listen-2-train', 'stayed-seated', 'id')).toBe('Beni dan bibinya');
    expect(answer('listen-2-train', 'stayed-seated', 'en')).toBe('Beni and his aunt');
  });

  it('independently checks a missing recipe step and its causal consequence', () => {
    expect(version('logic-2-baking', 'id').story).toContain('Adonan masih di mangkuk');
    expect(version('logic-2-baking', 'en').story).toContain('the molds are still empty');
    expect(answer('logic-2-baking', 'missing-step', 'id')).toBe('menuang adonan ke cetakan');
    expect(answer('logic-2-baking', 'missing-step', 'en')).toBe(
      'pouring the mixture into the molds'
    );
    expect(answer('logic-2-baking', 'empty-mold-result', 'id')).toBe(
      'tidak, adonan masih di luar kulkas'
    );
    expect(answer('logic-2-baking', 'empty-mold-result', 'en')).toBe(
      'no, the mixture is still outside the fridge'
    );
    expect(answer('logic-2-baking', 'after-filling', 'en')).toBe('chilling in the fridge');
  });

  it('does not turn a seed experiment into a guaranteed result', () => {
    expect(version('logic-2-seeds', 'id').story).toContain(
      'jenis benih yang sama dan mendapat cahaya yang sama'
    );
    expect(version('logic-2-seeds', 'en').story).toContain('Pot B is not watered');
    expect(answer('logic-2-seeds', 'next-test', 'id')).toBe('menyiram pot B');
    expect(answer('logic-2-seeds', 'next-test', 'en')).toBe('water pot B');
    expect(answer('logic-2-seeds', 'not-yet-known', 'id')).toBe(
      'belum, perlu menunggu dan mengamati'
    );
    expect(answer('logic-2-seeds', 'not-yet-known', 'en')).toBe(
      'not yet, we need to wait and observe'
    );
  });
});
