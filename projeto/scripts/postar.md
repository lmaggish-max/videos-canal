# Como postar (Metricool)
1. Subir o mp4 neste repositório (git push com o token do usuário) e usar o link
   https://raw.githubusercontent.com/lmaggish-max/videos-canal/main/NOME.mp4
2. Metricool, ferramenta createScheduledPost: blogId 8095375, date no formato 2026-11-22T18:00:00-03:00.
   info (JSON): autoPublish true, media [link], providers [{"network":"youtube"}], publicationDate {dateTime, timezone "America/Sao_Paulo"},
   text (hashtags na 1ª linha + descrição), youtubeData {title, type "short", privacy "public", tags [...], category "EDUCATION", madeForKids false, isAiGeneratedContent false}.
3. Conferir depois com getScheduledPosts (status PUBLISHED).
