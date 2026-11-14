export type Category = 'mendengar' | 'logika';
export type Verdict = 'correct' | 'incorrect' | 'unclear' | 'skipped';
export interface Question {
  id: string;
  category: Category;
  level: number;
  story: string;
  prompt: string;
  expectedAnswer: string;
  alternatives: string[];
  hint: { emoji: string; title: string; description: string };
}
export interface ChildProfile {
  id: string;
  name: string;
  parentName: string;
  friendName: string;
  petName: string;
  age: number | null;
  lastLevel: number;
  sensoryMode: boolean;
}
export interface AnswerEvent {
  questionId: string;
  answerText: string;
  verdict: 'correct' | 'incorrect' | 'unclear';
  confidence: number;
  feedbackReason: string;
}
