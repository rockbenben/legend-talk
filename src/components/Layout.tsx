import { Outlet, useNavigate, useParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useState, useRef, useEffect } from 'react';
import { useSettingsStore } from '../stores/settings';
import { ensureLanguageLoaded } from '../i18n';
import { ThemeToggle } from './ThemeToggle';
import { LanguageToggle } from './LanguageToggle';

interface NavLink {
  label: string;
  url: string;
}

function getLangPath(lng: string): string {
  if (lng === 'zh') return '';
  if (lng === 'zh-Hant') return 'zh-Hant';
  return lng;
}

function getProjectLinks(lng: string): NavLink[] {
  const lp = getLangPath(lng);
  const lpLower = lp.toLowerCase();
  return [
    { label: 'AI Short', url: `https://www.aishort.top/${lp ? lp + '/' : ''}` },
    { label: 'ToolsByAI', url: `https://tools.newzone.top/${lpLower || 'zh'}` },
    { label: 'IMGPrompt', url: `https://prompt.newzone.top/app/${lpLower || 'zh'}` },
  ];
}

function getSupportLinks(lng: string): NavLink[] {
  const links: NavLink[] = [
    { label: 'Discord', url: 'https://discord.gg/PZTQfJ4GjX' },
    { label: 'Telegram', url: 'https://t.me/aishort_top' },
  ];
  if (lng === 'zh' || lng === 'zh-Hant') {
    links.push({ label: 'QQ', url: 'https://qm.qq.com/q/uWsUSnyivm' });
  }
  return links;
}

function Dropdown({ label, children }: { label: string; children: React.ReactNode }) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen(!open)}
        className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 text-sm"
      >
        {label}
      </button>
      {open && (
        <div className="absolute end-0 mt-1 w-48 py-1 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 shadow-lg z-50">
          {children}
        </div>
      )}
    </div>
  );
}

function NavLinks({ links }: { links: NavLink[] }) {
  return (
    <>
      {links.map((link) => (
        link.url ? (
          <a
            key={link.label}
            href={link.url}
            target="_blank"
            rel="noopener noreferrer"
            className="block px-3 py-1.5 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800"
          >
            {link.label}
          </a>
        ) : null
      ))}
    </>
  );
}

export function Layout() {
  const navigate = useNavigate();
  const { t, i18n } = useTranslation();
  const { lang } = useParams<{ lang?: string }>();
  const setLanguage = useSettingsStore((s) => s.setLanguage);

  // Sync language from URL path prefix (e.g., /#/ja/chat)
  useEffect(() => {
    if (!lang) return;
    const supported = i18n.options.supportedLngs;
    if (supported && supported.includes(lang)) {
      if (i18n.language !== lang) {
        ensureLanguageLoaded(lang).then(() => {
          i18n.changeLanguage(lang);
          setLanguage(lang);
        });
      }
    } else {
      // Invalid lang code — redirect without prefix
      navigate('/chat', { replace: true });
    }
  }, [lang]); // eslint-disable-line react-hooks/exhaustive-deps

  // Sync document attributes with current language
  useEffect(() => {
    const lng = i18n.language;
    document.documentElement.lang = lng;
    document.documentElement.dir = lng === 'ar' ? 'rtl' : 'ltr';
    const meta: Record<string, { title: string; desc: string }> = {
      en: { title: "Legend Talk — AI Roundtable with History's Greatest Thinkers", desc: 'AI roundtable with 140+ historical and contemporary thinkers. Pick 2-10 figures, ask a question, watch them debate. 18 languages supported.' },
      zh: { title: 'Legend Talk — 与最伟大的思想家 AI 圆桌讨论', desc: '140+ 位历史和当代思想家围绕你的问题展开多轮辩论。支持 18 种语言。' },
      'zh-Hant': { title: 'Legend Talk — 與最偉大的思想家 AI 圓桌討論', desc: '140+ 位歷史和當代思想家圍繞你的問題展開多輪辯論。支持 18 種語言。' },
      ja: { title: 'Legend Talk — 歴史上の偉大な思想家とAI円卓討論', desc: '140人以上の歴史的・現代の思想家があなたの問題を多角的に議論。18言語対応。' },
      ko: { title: 'Legend Talk — 위대한 사상가들과 AI 원탁 토론', desc: '140명 이상의 역사적·현대 사상가가 당신의 질문을 놓고 다각도로 토론합니다. 18개 언어 지원.' },
      es: { title: 'Legend Talk — Mesa redonda de IA con los grandes pensadores', desc: 'Más de 140 pensadores históricos y contemporáneos debaten tus preguntas en múltiples rondas. 18 idiomas.' },
      pt: { title: 'Legend Talk — Mesa redonda de IA com os grandes pensadores', desc: 'Mais de 140 pensadores históricos e contemporâneos debatem suas questões em várias rodadas. 18 idiomas.' },
      fr: { title: 'Legend Talk — Table ronde IA avec les plus grands penseurs', desc: "Plus de 140 penseurs historiques et contemporains débattent de vos questions en plusieurs tours. 18 langues." },
      de: { title: 'Legend Talk — KI-Rundtisch mit den größten Denkern der Geschichte', desc: 'Über 140 historische und zeitgenössische Denker diskutieren Ihre Fragen in mehreren Runden. 18 Sprachen.' },
      it: { title: 'Legend Talk — Tavola rotonda IA con i più grandi pensatori', desc: 'Oltre 140 pensatori storici e contemporanei discutono le tue domande in più turni. 18 lingue.' },
      ru: { title: 'Legend Talk — ИИ-дискуссия с величайшими мыслителями истории', desc: 'Более 140 исторических и современных мыслителей обсуждают ваши вопросы в нескольких раундах. 18 языков.' },
      ar: { title: 'Legend Talk — طاولة مستديرة بالذكاء الاصطناعي مع أعظم المفكرين', desc: 'أكثر من 140 مفكراً تاريخياً ومعاصراً يناقشون أسئلتك في جولات متعددة. 18 لغة.' },
      tr: { title: 'Legend Talk — Tarihin en büyük düşünürleriyle yapay zeka yuvarlak masası', desc: "140'tan fazla tarihi ve çağdaş düşünür sorularınızı birçok turda tartışır. 18 dil." },
      hi: { title: 'Legend Talk — इतिहास के महानतम विचारकों के साथ AI गोलमेज', desc: '140+ ऐतिहासिक और समकालीन विचारक आपके सवालों पर कई दौर में बहस करते हैं। 18 भाषाएँ।' },
      id: { title: 'Legend Talk — Meja bundar AI dengan pemikir terbesar dalam sejarah', desc: 'Lebih dari 140 pemikir historis dan kontemporer mendebatkan pertanyaan Anda dalam beberapa ronde. 18 bahasa.' },
      vi: { title: 'Legend Talk — Bàn tròn AI với những nhà tư tưởng vĩ đại nhất', desc: 'Hơn 140 nhà tư tưởng lịch sử và đương đại tranh luận câu hỏi của bạn qua nhiều vòng. 18 ngôn ngữ.' },
      th: { title: 'Legend Talk — โต๊ะกลม AI กับนักคิดที่ยิ่งใหญ่ที่สุดในประวัติศาสตร์', desc: 'นักคิดกว่า 140 คนจากอดีตและปัจจุบันถกเถียงคำถามของคุณหลายรอบ รองรับ 18 ภาษา' },
      bn: { title: 'Legend Talk — ইতিহাসের সেরা চিন্তাবিদদের সাথে AI গোলটেবিল', desc: '140+ ঐতিহাসিক ও সমসাময়িক চিন্তাবিদ আপনার প্রশ্ন নিয়ে বহু রাউন্ডে বিতর্ক করেন। 18টি ভাষা।' },
    };
    const m = meta[lng];
    document.title = m?.title || 'Legend Talk — AI Roundtable with History\'s Greatest Thinkers';
    const descEl = document.querySelector('meta[name="description"]');
    if (descEl) descEl.setAttribute('content', m?.desc || 'AI roundtable with 140+ historical and contemporary thinkers. Pick 2-10 figures, ask a question, watch them debate. 18 languages supported.');
  }, [i18n.language]);

  return (
    <div className="flex flex-col h-screen bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100" style={{ paddingTop: 'env(safe-area-inset-top)', paddingBottom: 'env(safe-area-inset-bottom)' }}>
      <header className="flex items-center justify-between px-4 py-2 border-b border-gray-200 dark:border-gray-700 shrink-0">
        <h1
          className="text-lg font-bold cursor-pointer hover:opacity-80"
          onClick={() => navigate(lang ? `/${lang}/chat` : '/chat')}
        >
          Legend Talk
        </h1>
        <div className="flex items-center gap-1">
          <LanguageToggle />
          <ThemeToggle />
          <div className="hidden sm:block">
            <Dropdown label={t('nav.more')}>
              <NavLinks links={getProjectLinks(i18n.language)} />
            </Dropdown>
          </div>
          <div className="hidden sm:block">
            <Dropdown label={t('nav.support')}>
              <NavLinks links={getSupportLinks(i18n.language)} />
            </Dropdown>
          </div>
          <a
            href="https://github.com/rockbenben/legend-talk"
            target="_blank"
            rel="noopener noreferrer"
            className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800"
          >
            <svg viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5">
              <path d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z" />
            </svg>
          </a>
        </div>
      </header>
      <main className="flex-1 overflow-hidden">
        <Outlet />
      </main>
    </div>
  );
}
