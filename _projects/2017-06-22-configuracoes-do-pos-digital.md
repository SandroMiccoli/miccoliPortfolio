---
title: 'Configurações do pós-digital'
subtitle: 'Projeto gráfico do livro "Configurações do pós-digital - Arte e cultura tecnológicas"'
date: 2017-06-22 15:18:00
description: Interactive NFTs created in 2021 in the final months of Hic et Nunc. 
featured_image: "/images/configuracoes-do-pos-digital/Livro0.png"
thumb_image: "/images/home/configuracoes-do-pos-digital-thumb.jpg"
show_on_home: true

tags:
  - Generative
  - Lab|Front
  - Projeto gráfico
  - Identidade Gráfica
  - Processing.org


ficha-tecnica:
  - titulo: Agradecimentos
    subitens:
      - Pablo Gobira
      - Froiid
      - Ítalo Travenzoli
  - titulo: Realização
    subitens:
      - LabFront (Guignard - UEMG)

external: Lab|Front
external_link: https://labfront.weebly.com/configuraccedilotildees-do-poacutes-digital.html

---


O projeto gráfico do livro Configurações do pós-digital - Arte e cultura tecnológicas foi realizado a convite do LabFront, grupo de pesquisa de arte e tecnologia da Guignard, escola de artes visuais da Universidade Estadual de Minas Gerais (UEMG).

As imagens geradas para este livro foram inspiradas no conceito de grafos, que são estruturas matemáticas utilizadas para representar conexões entre diferentes objetos. Tomando como partida a relação entre diversos conceitos abstratos abordados no livro, foi criado um sistema generativo que usa como semente os caracteres do título de cada capítulo. Assim, cada capítulo possui um grafismo único, baseado na quantidade de palavras e no tamanho de cada palavra.

A lógica de geração de cada imagem funciona da seguinte maneira: para cada palavra do título, é gerado um polígono de n vértices, n sendo o número de letras daquela palavra. Ou seja, um título como “Arte digital” irá gerar dois polígonos, um de 4 vértices (arte) e outro de 7 vértices (digital). Esses polígonos começam com um raio pequeno e vãoaumentando gradativamente. No exemplo anterior, o polígono para “arte” seria menor e mais próximo do centro do que o polígono para “digital”. Consequentemente, títulos pequenos gerarão imagens pequenas e títulos extensos gerarão imagens maio-res e mais complexas. 

Uma regra de proximidade conecta estes vértices: cada um se conecta ao outro que esteja a uma distância x, definida arbitrariamente no código. Isso faz com que diversas conexões sejam criadas entre diferentes vértices. Dependendo do título do capítulo todos os vértices podem estar conectados de alguma maneira, o que nos remete à ideia de grafos conectados.

Assim, cada capítulo gera um grafismo diferente do outro, com formas emergentes a partir das conexões entre as palavras dos títulos. Esse sistema generativo foi construído para ilustrar como os diversos conceitos e ideias espalhados pelo livro estão conectados, às vezes com resultados mais simples e outras com resultados mais complexos.

A capa é gerada a partir da sobreposição de todos os capítulos do livro, gerando um emaranhado de linhas e formas. Construindo, assim, uma complexa sinopse visual do conteúdo a ser encontrado no miolo do livro.

  <img src="/images/configuracoes-do-pos-digital/mockup.jpg" title="Configurações do pós-digital - Arte e cultura tecnológicas">

<div class="gallery" data-columns="2">
  <img src="/images/configuracoes-do-pos-digital/Livro0.png" title="Configurações do pós-digital - Arte e cultura tecnológicas">
  <img src="/images/configuracoes-do-pos-digital/Livro2.png" title="Sobre a arte generativa do livro">
</div>

<div class="gallery" data-columns="2">
  <img src="/images/configuracoes-do-pos-digital/Livro3.png" title="Um panorama caleidoscópico da arte em suas feições digitais - Lucia Santaella">
  <img src="/images/configuracoes-do-pos-digital/Livro4.png" title="Ideia, plataforma, processo, domínioo - Casey Reas">
  <img src="/images/configuracoes-do-pos-digital/Livro5.png" title="Para um conceito de crítica de arte híbrida - Miriam Rasch">
  <img src="/images/configuracoes-do-pos-digital/Livro6.png" title="Ostensividade das interfaces computacionais - Ítalo Travenzoli">
</div>

<div class="gallery" data-columns="3">
  <img src="/images/configuracoes-do-pos-digital/Livro7.png" title="MindFluctuations: cenários interativos em BCI (brain computer interface) - Tania Fraga">
  <img src="/images/configuracoes-do-pos-digital/Livro8.png" title="Festival de Arte Digital: um acervo artístico intermitente - Pablo Gobira, Tadeus Mucelli">
  <img src="/images/configuracoes-do-pos-digital/Livro9.png" title="Tecnologias móveis e autoria: A produção de um documentário no bairro do Abaeté por alunos de uma escola municipal de Salvador - Tatiana Paz, Lynn Alves">
</div>
