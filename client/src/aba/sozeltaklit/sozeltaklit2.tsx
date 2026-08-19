import SozelTaklitAssessment from './SozelTaklitAssessment';

interface SozelTaklit2Props {
  onClose: () => void;
  onComplete: (success: boolean) => void | Promise<void>;
}

export default function SozelTaklit2({ onClose, onComplete }: SozelTaklit2Props) {
  return (
    <SozelTaklitAssessment
      kind="syllable"
      title="ST 1.2 · Hece Taklidi"
      onClose={onClose}
      onComplete={onComplete}
    />
  );
}
