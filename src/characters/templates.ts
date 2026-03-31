export interface RoundtableTemplate {
  id: string;
  name: Record<string, string>;
  description: Record<string, string>;
  characters: string[];
}

export const roundtableTemplates: RoundtableTemplate[] = [
  {
    id: 'philosophy-debate',
    name: { zh: '哲学辩论', en: 'Philosophy Debate' },
    description: { zh: '追问、和谐、权力、放下、克己', en: 'Inquiry, harmony, power, detachment, duty' },
    characters: ['socrates', 'confucius', 'nietzsche', 'buddha', 'marcus-aurelius'],
  },
  {
    id: 'business-strategy',
    name: { zh: '商业战略', en: 'Business Strategy' },
    description: { zh: '思维模型 vs 第一性原理 vs 逆向思维', en: 'Mental models vs first principles vs contrarian' },
    characters: ['munger', 'musk', 'peter-thiel', 'drucker', 'matsushita'],
  },
  {
    id: 'science-panel',
    name: { zh: '科学探索', en: 'Science Panel' },
    description: { zh: '确定 vs 概率，理论 vs 实验', en: 'Certainty vs probability, theory vs experiment' },
    characters: ['einstein', 'feynman', 'darwin', 'curie', 'hawking'],
  },
  {
    id: 'strategic-minds',
    name: { zh: '战略博弈', en: 'Strategic Minds' },
    description: { zh: '不战而胜 vs 以力破之 vs 永不投降', en: 'Outsmart vs overpower vs outlast' },
    characters: ['sun-tzu', 'napoleon', 'machiavelli', 'churchill', 'genghis-khan'],
  },
  {
    id: 'psychology-insights',
    name: { zh: '心理洞察', en: 'Psychology Insights' },
    description: { zh: '本能 vs 行为 vs 偏差 vs 意义', en: 'Drives vs behavior vs bias vs meaning' },
    characters: ['freud', 'jung', 'kahneman', 'skinner', 'frankl'],
  },
  {
    id: 'literary-salon',
    name: { zh: '文学沙龙', en: 'Literary Salon' },
    description: { zh: '悲喜、道德、荒诞、批判、硬汉', en: 'Tragedy, morality, absurd, revolt, grit' },
    characters: ['shakespeare', 'tolstoy', 'kafka', 'lu-xun', 'hemingway'],
  },
];
