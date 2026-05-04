/**
 * Synthé type balafon / xylo : PolySynth léger + voix « disparition » séparée.
 */
import * as Tone from 'tone';
import { unlockAudio } from './audio-context';

let poly: Tone.PolySynth | null = null;
let vanishSynth: Tone.Synth | null = null;

function getPoly(): Tone.PolySynth {
    if (!poly) {
        poly = new Tone.PolySynth(Tone.Synth, {
            oscillator: { type: 'triangle' },
            envelope: {
                attack: 0.003,
                decay: 0.14,
                sustain: 0.18,
                release: 0.42,
            },
        }).toDestination();
        poly.volume.value = -13;
    }
    return poly;
}

function getVanishSynth(): Tone.Synth {
    if (!vanishSynth) {
        vanishSynth = new Tone.Synth({
            oscillator: { type: 'triangle' },
            envelope: {
                attack: 0.02,
                decay: 0.35,
                sustain: 0,
                release: 0.28,
            },
        }).toDestination();
        vanishSynth.volume.value = -11;
    }
    return vanishSynth;
}

/** Gamme pentatonique (agréable, peu connoté « piano »). */
const SCALE = ['C5', 'D5', 'E5', 'G5', 'A5', 'C6', 'D6', 'E6', 'G6', 'A6'];

export function getNoteForIndex(i: number): string {
    return SCALE[((i % SCALE.length) + SCALE.length) % SCALE.length];
}

export async function playLand(index: number): Promise<void> {
    await unlockAudio();
    const note = getNoteForIndex(index);
    getPoly().triggerAttackRelease(note, '16n', Tone.now(), 0.48);
}

export async function playFocus(index: number): Promise<void> {
    await unlockAudio();
    const base = getNoteForIndex(index);
    const hi = Tone.Frequency(base).transpose(12).toNote();
    getPoly().triggerAttackRelease(hi, '32n', Tone.now(), 0.42);
}

export async function playVanish(index: number): Promise<void> {
    await unlockAudio();
    const low = Tone.Frequency(getNoteForIndex(index)).transpose(-12).toNote();
    getVanishSynth().triggerAttackRelease(low, '8n', Tone.now(), 0.32);
}
