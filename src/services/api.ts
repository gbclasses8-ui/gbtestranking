import { TestItem, Section, Question } from '../types/index.ts';

export const GB_LOGO_URL = 'https://i.ibb.co/mVjJG7Zg/1791541921524.png';
export const GB_TELEGRAM_URL = 'https://t.me/GBFreestudy';
export const FOUNDER_NAME = 'SARVOTTAM';

export function categorizeTest(testName: string): string {
  const t = (testName || '').toLowerCase();
  if (t.includes('pyq') || t.includes('previous')) return 'PYQ Papers';
  if (t.includes('sectional') || t.includes('subject')) return 'Sectional';
  if (t.includes('full') || t.includes('mock')) return 'Full Mocks';
  return 'Practice Tests';
}

export async function fetchAllTests(): Promise<TestItem[]> {
  try {
    const res = await fetch('/api/getAllTests', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'LIST_VAULT' })
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data = await res.json();
    if (data.tests && Array.isArray(data.tests)) {
      return data.tests.map((item: any) => ({
        ...item,
        package_name: item.package_name || 'General Package',
        smart_category: categorizeTest(item.test_name || '')
      }));
    }
  } catch (err) {
    console.warn('API getAllTests failed, trying GET fallback', err);
    try {
      const fallback = await fetch('/api/getAllTests');
      const data = await fallback.json();
      if (data.tests && Array.isArray(data.tests)) {
        return data.tests.map((item: any) => ({
          ...item,
          package_name: item.package_name || 'General Package',
          smart_category: categorizeTest(item.test_name || '')
        }));
      }
    } catch (e) {
      console.error('All tests fetch failed:', e);
    }
  }
  return [];
}

export async function fetchTestById(id: string | number): Promise<{ sections: Section[]; durationMinutes: number }> {
  const res = await fetch(`/api/getTest?id=${id}`, {
    method: 'GET'
  });
  if (!res.ok) {
    throw new Error(`Failed to load test details (HTTP ${res.status})`);
  }

  const json = await res.json();
  const rawSections = json.data;
  if (!rawSections || !Array.isArray(rawSections) || rawSections.length === 0) {
    throw new Error('No question sections found for this mock test.');
  }

  const sections: Section[] = [];
  rawSections.forEach((sec: any) => {
    if (sec.all_questions) {
      const sectionName = sec.section_name || 'General Section';
      let qList: any[] = [];
      Object.values(sec.all_questions).forEach((subArr: any) => {
        if (Array.isArray(subArr)) {
          qList = [...qList, ...subArr];
        }
      });

      if (qList.length > 0) {
        const questions: Question[] = qList.map((q: any) => ({
          ...q,
          p_marks: parseFloat(q.marks || 1),
          n_marks: parseFloat(q.negative_marks || 0.25),
          parsed_answer: parseInt(q.answer || q.correct_option || q.answer_key || 1, 10)
        }));
        sections.push({ name: sectionName, questions });
      }
    }
  });

  if (sections.length === 0) {
    throw new Error('No valid questions parsed for this mock test.');
  }

  const durationMinutes = parseInt(rawSections[0]?.series_time || 60, 10) || 60;
  return { sections, durationMinutes };
}
