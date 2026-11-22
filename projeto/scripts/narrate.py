#!/usr/bin/env python3
"""Gera a narração (voz Faber) e os tempos de cada frase e palavra.
Uso: python3 narrate.py frases.txt   (uma frase por linha; linha "||0.5" opcional não é necessária)
Saída na pasta atual: narr.wav, ptime.json (frases/tempos), pwords.json (palavras com frame inicial e final).
Depois: copiar ptime.json e pwords.json para /tmp/remo/src/ com os nomes que a cena importa."""
import json, re, glob, sys, wave, numpy as np, soundfile as sf
from piper import PiperVoice
SENT = [l.strip() for l in open(sys.argv[1], encoding="utf-8") if l.strip()]
GAP = 0.3
onnx = glob.glob("/tmp/sh/vits-piper-pt_BR-faber-medium/*.onnx")[0]
v = PiperVoice.load(onnx, config_path=onnx + ".json")
chunks, t, sents = [], 0.0, []
for i, s in enumerate(SENT):
    with wave.open("tmp.wav", "wb") as w: v.synthesize_wav(s, w)
    a, sr = sf.read("tmp.wav", dtype="float32")
    idx = np.where(np.abs(a) > 0.01)[0]
    a = a[max(0, idx[0] - int(0.03 * sr)): idx[-1] + int(0.06 * sr)]
    d = len(a) / sr
    sents.append({"i": i, "text": s, "start": round(t, 3), "end": round(t + d, 3)})
    g = GAP if i < len(SENT) - 1 else 1.2
    chunks += [a, np.zeros(int(g * sr), dtype=np.float32)]; t += d + g
audio = np.concatenate(chunks); audio = audio / np.abs(audio).max() * 0.9
sf.write("narr.wav", audio, sr)
words = []
for s in sents:
    toks = s["text"].split(); wts = []
    for w in toks:
        wt = len(re.sub(r"[^\wÀ-ÿ]", "", w)) + 2
        if w.endswith("..."): wt += 6
        elif w[-1] in ",:": wt += 3
        wts.append(wt)
    tot = sum(wts); cur = s["start"]; dur = s["end"] - s["start"]
    for w, wt in zip(toks, wts):
        d = dur * wt / tot; words.append([w, round(cur * 30), round((cur + d) * 30)]); cur += d
json.dump({"sents": sents, "total": round(t, 3), "frames": int(t * 30) + 1}, open("ptime.json", "w"), ensure_ascii=False)
json.dump(words, open("pwords.json", "w"), ensure_ascii=False)
print("total", round(t, 2), "s", int(t * 30) + 1, "frames")
for s in sents: print(s["i"], s["start"], s["end"])
