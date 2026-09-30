let ac: AudioContext | null = null;

function tom(freq: number, dur: number, tipo: OscillatorType = "sine", vol = 0.08) {
  try {
    ac ??= new AudioContext();
    const o = ac.createOscillator(), g = ac.createGain();
    o.type = tipo;
    o.frequency.value = freq;
    g.gain.setValueAtTime(vol, ac.currentTime);
    g.gain.exponentialRampToValueAtTime(0.001, ac.currentTime + dur);
    o.connect(g);
    g.connect(ac.destination);
    o.start();
    o.stop(ac.currentTime + dur);
  } catch {
    /* sem áudio: segue em silêncio */
  }
}

export const som = {
  acerto: () => tom(660, 0.12, "triangle"),
  rapido: () => { tom(660, 0.09, "triangle"); setTimeout(() => tom(990, 0.12, "triangle"), 80); },
  erro: () => tom(260, 0.18, "triangle"),
  nivel: () => [523, 659, 784, 1046].forEach((f, i) => setTimeout(() => tom(f, 0.16, "triangle"), i * 110)),
};
