import { onUnmounted, ref } from 'vue';
import { useSimulationStore } from '~/composables/useSimulationStore';
import { generateRandomMove } from '~/utils/moves';
import { calculateEnergy, calculateDeltaE, shouldAcceptMove, calculateHydrophobicContacts } from '~/utils/energy';
import { clonePositions } from '~/utils/geometry';

export const useSimulation = () => {
  const store = useSimulationStore();
  const animationFrameId = ref<number | null>(null);
  const lastUpdateTime = ref<number>(0);

  const step = () => {
    const { positions, sequence, params, temperature } = store.state;
    const newPositions = generateRandomMove(positions);

    if (!newPositions) {
      store.recordRejected();
      return;
    }

    const deltaE = calculateDeltaE(positions, newPositions, sequence, params.hydrophobicStrength);

    if (shouldAcceptMove(deltaE, temperature)) {
      const contacts = calculateHydrophobicContacts(newPositions, sequence);
      const newEnergy = calculateEnergy(newPositions, sequence, params.hydrophobicStrength);

      store.updatePositions(clonePositions(newPositions));
      store.updateEnergy(newEnergy, contacts.length, contacts);
      store.recordAccepted();
    } else {
      store.recordRejected();
    }

    store.incrementStep();

    const newTemp = Math.max(0.1, temperature * params.coolingRate);
    store.updateTemperature(newTemp);
  };

  const run = () => {
    const currentTime = Date.now();
    const interval = 16;

    if (currentTime - lastUpdateTime.value >= interval) {
      const stepsPerFrame = Math.max(1, Math.floor(store.state.temperature * 2));
      for (let i = 0; i < stepsPerFrame; i++) {
        step();
      }
      lastUpdateTime.value = currentTime;
    }

    if (store.state.isRunning && !store.state.isPaused) {
      animationFrameId.value = requestAnimationFrame(run);
    }
  };

  const start = () => {
    store.setRunning(true);
    store.setPaused(false);
    lastUpdateTime.value = Date.now();
    run();
  };

  const pause = () => {
    store.setPaused(true);
    if (animationFrameId.value) {
      cancelAnimationFrame(animationFrameId.value);
      animationFrameId.value = null;
    }
  };

  const resume = () => {
    store.setPaused(false);
    lastUpdateTime.value = Date.now();
    run();
  };

  const stop = () => {
    store.setRunning(false);
    store.setPaused(false);
    if (animationFrameId.value) {
      cancelAnimationFrame(animationFrameId.value);
      animationFrameId.value = null;
    }
  };

  const doReset = () => {
    stop();
    store.reset();
  };

  const singleStep = () => {
    step();
  };

  onUnmounted(() => {
    if (animationFrameId.value) {
      cancelAnimationFrame(animationFrameId.value);
    }
  });

  return {
    start,
    pause,
    resume,
    stop,
    reset: doReset,
    singleStep,
    step
  };
};
