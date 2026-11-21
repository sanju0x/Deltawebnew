/** Render a short original synth loop for the radio sleeve. */
export function renderRadioPreview() {
  const rate = 22050;
  const duration = 24;
  const samples = rate * duration;
  const bytes = new ArrayBuffer(44 + samples * 2);
  const header = new DataView(bytes);
  const write = (offset: number, text: string) => new Uint8Array(bytes).set(new TextEncoder().encode(text), offset);
  write(0, "RIFF");
  header.setUint32(4, bytes.byteLength - 8, true);
  write(8, "WAVEfmt ");
  header.setUint32(16, 16, true);
  header.setUint16(20, 1, true);
  header.setUint16(22, 1, true);
  header.setUint32(24, rate, true);
  header.setUint32(28, rate * 2, true);
  header.setUint16(32, 2, true);
  header.setUint16(34, 16, true);
  write(36, "data");
  header.setUint32(40, samples * 2, true);

  const hz = (note: number) => 440 * 2 ** ((note - 69) / 12);
  const wave = (frequency: number, time: number) => Math.sin(2 * Math.PI * frequency * time);
  const roots = [45, 41, 48, 43];
  let seed = 42;
  for (let i = 0; i < samples; i++) {
    const time = i / rate;
    const beat = time % .5;
    const step = time % .25;
    const bar = Math.floor(time / 2) % 4;
    const root = roots[bar];
    const third = bar === 0 ? 3 : 4;
    const note = [0, third, 7, 12][Math.floor(time * 4) % 4];
    const lead = wave(hz(root + 12 + note), time) * .18 * Math.exp(-step * 12);
    const pad = .052 * (wave(hz(root), time) + wave(hz(root + third), time) + wave(hz(root + 7), time));
    const bass = .22 * wave(hz(root - 12), time) * Math.exp(-beat * 2);
    const kick = .22 * Math.sin(2 * Math.PI * 52 * beat + 7 * (1 - Math.exp(-44 * beat))) * Math.exp(-beat * 13);
    seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0;
    const hat = (seed / 2147483648 - 1) * .065 * Math.exp(-step * 64);
    const fade = Math.min(1, time * 3, (duration - time) * 1.3);
    header.setInt16(44 + i * 2, (lead + pad + bass + kick + hat) * fade * 32767, true);
  }
  return URL.createObjectURL(new Blob([bytes], { type: "audio/wav" }));
}
