export interface TestItem {
  id: string | number;
  test_name: string;
  package_id?: number | string;
  package_name: string;
  category_type?: string;
  smart_category?: string;
}

export interface QuestionOption {
  id: number;
  text: string;
  img?: string;
}

export interface Question {
  [key: string]: any;
  qid?: string | number;
  id?: string | number;
  question_en?: string;
  question_hi?: string;
  question_en_image?: string;
  question_hi_image?: string;
  comprehensive_en?: string;
  comprehensive_hi?: string;
  solution_text?: string;
  solution?: string;
  solution_en?: string;
  solution_hi?: string;
  answer?: string | number;
  correct_option?: string | number;
  answer_key?: string | number;
  marks?: string | number;
  negative_marks?: string | number;
  p_marks: number;
  n_marks: number;
  parsed_answer: number;
}

export interface Section {
  name: string;
  questions: Question[];
}

export type QuestionStatus = 'not-visited' | 'not-answered' | 'answered' | 'review' | 'ans-review';

export interface UserQuestionState {
  status: QuestionStatus;
  selectedOption: number | null;
  qTime: number;
}

export interface SectionStats {
  name: string;
  total: number;
  ans: number;
  notAns: number;
  notVis: number;
  rev: number;
  ansRev: number;
  correct: number;
  score: number;
}

export interface ExamReport {
  secStats: SectionStats[];
  tScore: number;
  tAttempt: number;
  tCorrect: number;
  tTotal: number;
  accuracy: string;
  timeSpent: number;
}
