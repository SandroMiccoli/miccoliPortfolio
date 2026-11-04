# Pipeline de imagens

Gera os derivados otimizados (WebP + JPG de fallback) usados pelo include `_includes/img.html`.
Os originais em `images/` não são alterados nem apagados.

## Requisitos

- Node 18.17+ (testado com 22) e `npm install` dentro desta pasta (instala o `sharp`).
- `ffmpeg` no PATH, só para o script de vídeo.

## Adicionando um projeto novo

1. Coloque as fotos originais em `images/<projeto>/` e referencie-as no `.md` do projeto.
   Use o include em vez de `<img>` (veja o exemplo abaixo).
2. Gere os derivados e atualize o manifesto:

   ```bash
   cd _scripts/images
   npm install                      # só na primeira vez
   npm run images                   # processa tudo que o site referencia (só o que mudou)
   npm run images -- ../../images/novo-projeto   # ou só uma pasta / arquivos
   ```

3. Faça commit de `images/optimized/` e de `_data/images.json` junto com o projeto.

Opções: `--force` (reprocessa tudo), `--avif` (gera AVIF além de WebP), `--dry-run` (só lista).

## O que é gerado

Para cada original `images/<pasta>/<nome>.(jpg|png)`:

- `images/optimized/<pasta>/<nome-slug>-{400,800,1600}.webp` (larguras maiores que o original são omitidas;
  o maior tamanho nunca ultrapassa a largura do original).
- `images/optimized/<pasta>/<nome-slug>-800.jpg`: fallback para navegadores sem WebP.
- `_data/images.json`: manifesto original → largura/altura, base do nome e larguras geradas.
  É ele que permite o include emitir `width`/`height` e `srcset`.

O fundo do site é preto, então transparência é achatada sobre preto.

## Usando no conteúdo

```liquid
{% include img.html src="/images/maos/Mao001.png" alt="Descrição" %}                      {# imagem solta #}
{% include img.html src=page.featured_image alt=page.title priority=true %}               {# hero / 1ª imagem visível #}
<div class="gallery" data-columns="2">
  {% include img.html src="/images/x/a.jpg" title="Legenda do zoom" cols=2 %}             {# galeria: cols = data-columns #}
  {% include img.html src="/images/x/b.jpg" title="Legenda do zoom" cols=2 %}
</div>
```

Se a imagem ainda não estiver no manifesto, o include cai para um `<img loading="lazy">` simples com o original
(funciona, mas pesado): rode `npm run images`.

## Vídeo

```bash
node video.mjs ../../images/contained/contained-pre-release.mp4
```

Gera `<nome>-web.mp4` (H.264, sem áudio, `faststart`, CRF 32) e `<nome>-poster.jpg` ao lado do original.
