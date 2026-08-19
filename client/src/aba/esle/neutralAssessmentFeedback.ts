import devamEt from './ses/devametnotr.mp3';
import devamEt2 from './ses/devamet2notr.mp3';
import simdiSiradaki from './ses/simdisiradakinotr.mp3';

const NEUTRAL_ASSESSMENT_SOUNDS = [devamEt, devamEt2, simdiSiradaki];

export const playNeutralAssessmentFeedback = () => {
  const source = NEUTRAL_ASSESSMENT_SOUNDS[
    Math.floor(Math.random() * NEUTRAL_ASSESSMENT_SOUNDS.length)
  ];
  const audio = new Audio(source);
  audio.volume = 1;
  audio.play().catch(() => {});
};
