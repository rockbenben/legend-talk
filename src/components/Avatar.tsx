interface AvatarProps {
  emoji: string;
  color: string;
  size?: 'sm' | 'md' | 'lg';
}

const sizes = { sm: 'w-8 h-8 text-sm', md: 'w-10 h-10 text-lg', lg: 'w-14 h-14 text-2xl' };

// Static map so Tailwind can detect all class names at build time.
// Dynamic `bg-${color}-100` won't be compiled by Tailwind's JIT.
const colorClasses: Record<string, string> = {
  blue: 'bg-blue-100 dark:bg-blue-900/30',
  red: 'bg-red-100 dark:bg-red-900/30',
  green: 'bg-green-100 dark:bg-green-900/30',
  emerald: 'bg-emerald-100 dark:bg-emerald-900/30',
  teal: 'bg-teal-100 dark:bg-teal-900/30',
  cyan: 'bg-cyan-100 dark:bg-cyan-900/30',
  indigo: 'bg-indigo-100 dark:bg-indigo-900/30',
  violet: 'bg-violet-100 dark:bg-violet-900/30',
  purple: 'bg-purple-100 dark:bg-purple-900/30',
  amber: 'bg-amber-100 dark:bg-amber-900/30',
  orange: 'bg-orange-100 dark:bg-orange-900/30',
  pink: 'bg-pink-100 dark:bg-pink-900/30',
  gray: 'bg-gray-100 dark:bg-gray-900/30',
  stone: 'bg-stone-100 dark:bg-stone-900/30',
  slate: 'bg-slate-100 dark:bg-slate-900/30',
  sky: 'bg-sky-100 dark:bg-sky-900/30',
  zinc: 'bg-zinc-100 dark:bg-zinc-900/30',
  rose: 'bg-rose-100 dark:bg-rose-900/30',
  yellow: 'bg-yellow-100 dark:bg-yellow-900/30',
};

export function Avatar({ emoji, color, size = 'md' }: AvatarProps) {
  return (
    <div
      className={`${sizes[size]} rounded-full flex items-center justify-center ${colorClasses[color] || colorClasses.gray}`}
    >
      {emoji}
    </div>
  );
}
