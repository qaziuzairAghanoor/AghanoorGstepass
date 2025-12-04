import { GatePassData } from '../types';

const PASSES_KEY = 'gate_passes_data';
const COUNTER_KEY = 'gate_pass_counter';
const INITIAL_COUNTER = 1001;

export const getPasses = (): GatePassData[] => {
  try {
    const data = localStorage.getItem(PASSES_KEY);
    return data ? JSON.parse(data) : [];
  } catch (e) {
    console.error('Failed to load passes', e);
    return [];
  }
};

export const savePasses = (passes: GatePassData[]) => {
  try {
    localStorage.setItem(PASSES_KEY, JSON.stringify(passes));
  } catch (e) {
    console.error('Failed to save passes', e);
  }
};

export const getNextPassNumber = (): number => {
  try {
    const count = localStorage.getItem(COUNTER_KEY);
    return count ? parseInt(count, 10) : INITIAL_COUNTER;
  } catch (e) {
    return INITIAL_COUNTER;
  }
};

export const incrementPassNumber = (current: number) => {
  try {
    localStorage.setItem(COUNTER_KEY, (current + 1).toString());
  } catch (e) {
    console.error('Failed to update counter', e);
  }
};
