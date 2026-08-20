import SozelTaklitAssessment, { type AssessmentCompletionDetails } from './SozelTaklitAssessment';

interface SozelTaklit4Props {
  masteredSounds: string[];
  onClose: () => void;
  onComplete: (
    success: boolean,
    details?: AssessmentCompletionDetails,
  ) => void | Promise<void>;
}

export default function SozelTaklit4({
  masteredSounds,
  onClose,
  onComplete,
}: SozelTaklit4Props) {
  return (
    <SozelTaklitAssessment
      kind="environmental"
      title="ST 2.2 · Hayvan ve Diğer Seslerin Taklidi"
      masteredLabels={masteredSounds}
      completionTarget={10}
      onClose={onClose}
      onComplete={onComplete}
    />
  );
}
