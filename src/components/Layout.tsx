import { Outlet, useNavigate, useParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useEffect } from 'react';
import { Layout as AntLayout, Dropdown, Button, theme as antTheme } from 'antd';
import { GithubOutlined } from '@ant-design/icons';
import { useSettingsStore } from '../stores/settings';
import { ensureLanguageLoaded } from '../i18n';
import { ThemeToggle } from './ThemeToggle';
import { LanguageToggle } from './LanguageToggle';

const { Header, Content } = AntLayout;
const { useToken } = antTheme;

interface NavLink { label: string; url: string }

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

function linksToItems(links: NavLink[]) {
  return links.map((l, i) => ({
    key: `${l.label}-${i}`,
    label: <a href={l.url} target="_blank" rel="noopener noreferrer">{l.label}</a>,
  }));
}

export function Layout() {
  const navigate = useNavigate();
  const { t, i18n } = useTranslation();
  const { lang } = useParams<{ lang?: string }>();
  const setLanguage = useSettingsStore((s) => s.setLanguage);
  const { token } = useToken();

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
      navigate('/chat', { replace: true });
    }
  }, [lang]); // eslint-disable-line react-hooks/exhaustive-deps

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
    <AntLayout
      style={{
        height: '100dvh',
        paddingTop: 'env(safe-area-inset-top)',
        paddingBottom: 'env(safe-area-inset-bottom)',
      }}
    >
      <Header
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '0 16px',
          borderBottom: `1px solid ${token.colorBorderSecondary}`,
        }}
      >
        <h1
          className="display-serif"
          onClick={() => navigate(lang ? `/${lang}/chat` : '/chat')}
          style={{
            margin: 0,
            fontSize: 22,
            fontWeight: 500,
            lineHeight: 1,
            cursor: 'pointer',
            userSelect: 'none',
            color: token.colorText,
          }}
        >
          Legend <span className="display-serif-italic" style={{ fontWeight: 400 }}>Talk</span>
        </h1>
        <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
          <LanguageToggle />
          <ThemeToggle />
          <Dropdown menu={{ items: linksToItems(getProjectLinks(i18n.language)) }} placement="bottomRight" trigger={['click']}>
            <Button type="text" className="hidden sm:inline-flex">{t('nav.more')}</Button>
          </Dropdown>
          <Dropdown menu={{ items: linksToItems(getSupportLinks(i18n.language)) }} placement="bottomRight" trigger={['click']}>
            <Button type="text" className="hidden sm:inline-flex">{t('nav.support')}</Button>
          </Dropdown>
          <Button
            type="text"
            href="https://github.com/rockbenben/legend-talk"
            target="_blank"
            rel="noopener noreferrer"
            icon={<GithubOutlined />}
            aria-label="GitHub"
          />
        </div>
      </Header>
      <Content style={{ flex: 1, minWidth: 0, overflow: 'hidden' }}>
        <Outlet />
      </Content>
    </AntLayout>
  );
}
