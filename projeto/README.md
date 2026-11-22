# Projeto do canal: como produzir um short rápido (e gastar pouco)

Tudo aqui é grátis: Remotion (vídeo 3D em código), voz Faber (Piper), Metricool (postagem).
Quem usa isto: o Claude, em uma conversa nova por vídeo (conversa curta = menos crédito).

## Começar (conversa nova)
1. O usuário manda o token do GitHub (fine-grained, só este repositório, Contents: leitura e escrita).
2. `git clone https://x-access-token:TOKEN@github.com/lmaggish-max/videos-canal.git && bash videos-canal/projeto/scripts/setup.sh`
3. Roteiros: documento "Roteiros do mês: 15 vídeos do canal" (o usuário diz o número).

## Receita de um vídeo (ordem)
1. Frases do roteiro em `frases.txt` (uma por linha, números por extenso para a voz) e `python3 narrate.py frases.txt`.
2. Copiar `ptime.json` e `pwords.json` para `/tmp/remo/src/` (nomes que a cena importa, ex.: stime.json / swords.json).
3. Escrever a cena `src/NomeDaCena.tsx` copiando a mais parecida: Supermercado (zumbis e herói andando), Tunel (corte lateral), Ponte e Barragem (rio, guindaste), Torre (prédio em corte). Registrar em `src/Root.tsx`.
4. Conferir só 5 quadros (`remotion still --scale=0.3`) e juntar numa imagem; corrigir uma vez.
5. Renderizar em trechos (`render_chunk.sh`), juntar com ffmpeg concat, misturar o áudio (narr.wav + clima + efeitos nos tempos das frases) e exportar mp4.
6. Postar (ver `scripts/postar.md`).

## Lições que evitam retrabalho
- Limite de 300 s por comando: trechos de ~170 frames. Nunca rodar render em segundo plano (morre).
- O herói (`src/Hero.tsx`, LOOKS e poses idle/walk/run/wave/scared/point/zombie) é o personagem fixo do canal. Não mudar o visual.
- Câmera alta (~45°) em cenas de planta; legendas palavra por palavra; erro nunca anunciado antes da consequência.
- Reduzir custo: conferir poucos quadros, não ficar re-renderizando, falar curto com o usuário.
- Se faltar tempo, renderizar em 720p (`--scale=0.667`) fica 2x mais rápido.
