import { Question, QuestionOption } from '../types/index.ts';

export interface ExtractedQuestion {
  questionText: string;
  questionImg: string;
  comprehensive: string;
  options: QuestionOption[];
  solutionText: string;
  solutionImg: string;
}

export function extractQuestionData(q: Question | undefined | null, lang: 'en' | 'hi'): ExtractedQuestion {
  if (!q) {
    return {
      questionText: '',
      questionImg: '',
      comprehensive: '',
      options: [],
      solutionText: '',
      solutionImg: ''
    };
  }

  // Question Text
  const questionText = lang === 'en'
    ? (q.question_en || q.question_hi || q.question || '')
    : (q.question_hi || q.question_en || q.question || '');

  // Question Image
  const questionImg = lang === 'en'
    ? (q.question_en_image || q.question_hi_image || q.question_image || '')
    : (q.question_hi_image || q.question_en_image || q.question_image || '');

  // Reading Comprehension / Passage
  const comprehensive = lang === 'en'
    ? (q.comprehensive_en || q.comprehensive_hi || '')
    : (q.comprehensive_hi || q.comprehensive_en || '');

  // Extract Options (1 to 5)
  const options: QuestionOption[] = [];
  for (let e = 1; e <= 5; e++) {
    const text = lang === 'en'
      ? (q[`option_en_${e}`] || q[`option_hi_${e}`] || q[`option_${e}`] || '')
      : (q[`option_hi_${e}`] || q[`option_en_${e}`] || q[`option_${e}_hi`] || q[`option_${e}`] || '');

    const img = lang === 'en'
      ? (q[`option_en_image${e}`] || q[`option_hi_image${e}`] || '')
      : (q[`option_hi_image${e}`] || q[`option_en_image${e}`] || '');

    // Trim text and check if text or img is present
    const hasText = typeof text === 'string' && text.trim().length > 0;
    const hasImg = typeof img === 'string' && img.trim().length > 0;

    if (hasText || hasImg) {
      options.push({
        id: e,
        text: text ? String(text).trim() : '',
        img: img ? String(img).trim() : ''
      });
    }
  }

  // Solution
  const solutionText = q.solution_text || (
    lang === 'hi'
      ? (q.solution_hi || q.solution_en || q.solution || '')
      : (q.solution_en || q.solution_hi || q.solution || '')
  ) || '';

  const solutionImg = lang === 'en'
    ? (q.solution_en_image || q.solution_hi_image || '')
    : (q.solution_hi_image || q.solution_en_image || '');

  return {
    questionText,
    questionImg,
    comprehensive,
    options,
    solutionText,
    solutionImg
  };
}
