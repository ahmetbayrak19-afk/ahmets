import { Gamepad2, User } from 'lucide-react';
import { twMerge } from 'tailwind-merge';

type ModeTone = 'blue' | 'orange' | 'indigo' | 'purple' | 'teal' | 'amber' | 'cyan';

interface AssessmentModeBadgesProps {
  interactive?: boolean;
  manual?: boolean;
  tone?: ModeTone;
  className?: string;
}

const INTERACTIVE_TONES: Record<ModeTone, string> = {
  blue: 'border-blue-500/25 bg-blue-500/10 text-blue-300',
  orange: 'border-orange-500/25 bg-orange-500/10 text-orange-300',
  indigo: 'border-indigo-500/25 bg-indigo-500/10 text-indigo-300',
  purple: 'border-purple-500/25 bg-purple-500/10 text-purple-300',
  teal: 'border-teal-500/25 bg-teal-500/10 text-teal-300',
  amber: 'border-amber-500/25 bg-amber-500/10 text-amber-300',
  cyan: 'border-cyan-500/25 bg-cyan-500/10 text-cyan-300',
};

const BADGE_CLASS = 'inline-flex items-center gap-1 rounded-md border px-2 py-0.5 text-[10px] font-bold';

export default function AssessmentModeBadges({
  interactive = false,
  manual = false,
  tone = 'blue',
  className,
}: AssessmentModeBadgesProps) {
  if (!interactive && !manual) return null;

  return (
    <div className={twMerge('mt-2 flex flex-wrap items-center gap-1.5', className)}>
      {interactive && (
        <span className={twMerge(BADGE_CLASS, INTERACTIVE_TONES[tone])}>
          <Gamepad2 size={12} /> İnteraktif
        </span>
      )}
      {manual && (
        <span className={twMerge(BADGE_CLASS, 'border-slate-600 bg-slate-800/80 text-slate-300')}>
          <User size={12} /> Manuel
        </span>
      )}
    </div>
  );
}
