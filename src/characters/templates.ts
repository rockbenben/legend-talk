export interface RoundtableTemplate {
  id: string;
  characters: string[];
}

export const roundtableTemplates: RoundtableTemplate[] = [
  { id: 'philosophy-debate', characters: ['socrates', 'confucius', 'nietzsche', 'buddha', 'marcus-aurelius'] },
  { id: 'business-strategy', characters: ['munger', 'musk', 'peter-thiel', 'drucker', 'matsushita'] },
  { id: 'science-panel', characters: ['einstein', 'feynman', 'darwin', 'curie', 'hawking'] },
  { id: 'strategic-minds', characters: ['sun-tzu', 'napoleon', 'machiavelli', 'churchill', 'genghis-khan'] },
  { id: 'psychology-insights', characters: ['freud', 'jung', 'kahneman', 'skinner', 'frankl'] },
  { id: 'literary-salon', characters: ['shakespeare', 'tolstoy', 'kafka', 'lu-xun', 'hemingway'] },
];
