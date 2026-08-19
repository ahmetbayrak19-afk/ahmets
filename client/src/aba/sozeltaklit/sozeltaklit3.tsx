import SozelTaklitAssessment, { type AssessmentCompletionDetails } from './SozelTaklitAssessment';

interface SozelTaklit3Props {
  masteredWords: string[];
  onClose: () => void;
  onComplete: (
    success: boolean,
    details?: AssessmentCompletionDetails,
  ) => void | Promise<void>;
}

export default function SozelTaklit3({
  masteredWords,
  onClose,
  onComplete,
}: SozelTaklit3Props) {
  return (
    <SozelTaklitAssessment
      kind="word"
      title="ST 2.1 · Sözcük Taklidi"
      masteredLabels={masteredWords}
      completionTarget={30}
      onClose={onClose}
      onComplete={onComplete}
    />
  );
}
