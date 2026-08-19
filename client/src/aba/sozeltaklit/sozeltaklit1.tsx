import SozelTaklitAssessment from './SozelTaklitAssessment';

interface SozelTaklit1Props {
  onClose: () => void;
  onComplete: (success: boolean) => void | Promise<void>;
}

export default function SozelTaklit1({ onClose, onComplete }: SozelTaklit1Props) {
  return (
    <SozelTaklitAssessment
      kind="sound"
      title="ST 1.1 · Ses Taklidi"
      onClose={onClose}
      onComplete={onComplete}
    />
  );
}
