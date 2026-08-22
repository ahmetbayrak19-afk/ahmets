import SozelTaklitAssessment, {
  type AssessmentCompletionDetails,
} from './SozelTaklitAssessment';

interface SozelTaklit5Props {
  masteredSentences?: string[];
  onClose: () => void;
  onComplete: (success: boolean, details?: AssessmentCompletionDetails) => void | Promise<void>;
}

export default function SozelTaklit5({
  masteredSentences = [],
  onClose,
  onComplete,
}: SozelTaklit5Props) {
  return (
    <SozelTaklitAssessment
      kind="sentence"
      title="ST 2.3 · Cümle Taklidi"
      masteredLabels={masteredSentences}
      completionTarget={20}
      onClose={onClose}
      onComplete={onComplete}
    />
  );
}
