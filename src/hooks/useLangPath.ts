import { useParams } from 'react-router-dom';

/** Returns a function that prefixes paths with the current language code from URL */
export function useLangPath() {
  const { lang } = useParams<{ lang?: string }>();
  return (path: string) => lang ? `/${lang}${path}` : path;
}
