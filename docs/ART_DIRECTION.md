# Projeto Ascensão — Direção de arte v1.0

**Foco atual:** qualidade visual de produto, antes de expansão de mecânicas.  
**Fase-alvo:** Floresta da Aurora.  
**Linguagem:** fantasy cartoon premium, ilustração 2.5D, acabamento pictórico, silhuetas memoráveis, iluminação quente e cores elegantes.

## Princípios inegociáveis
- Os personagens, inimigos e elementos do ambiente devem ser **imagens ilustradas**, não figuras simples renderizadas por primitivas Canvas.
- Nenhuma tela que pareça protótipo ou contenha arte provisória será usada como screenshot da App Store.
- Identidade visual forte e leitura imediata em celular. Não copiar personagens, cenários nem interface de jogos existentes.
- A animação precisa vir de sprites/rigging coerentes, não de imagens rígidas que apenas deslizam no mapa.
- Priorizar a qualidade de um herói, dois inimigos e uma fase antes de criar dezenas de elementos.
- Implementação com imagens em PNG/WebP/atlas, alpha transparente, âncoras consistentes e pré-carregamento com fallback.
- Proteger FPS no iPhone com atlases, batching/culling e efeitos em camadas; nunca comprometer controles para renderizar efeitos.

## Personagens

### Guerreiro da Ascensão
Armadura de prata-azulada com detalhes dourados, rosto parcialmente coberto, olhos ciano e capa azul. Jovem, heroico, carismático; proporções estilizadas mas não excessivamente infantis.  
Ciclo mínimo para aprovação: idle com respiração; corrida em 6–8 quadros realmente distintos; ataque com antecipação/impacto/recuperação; dano, morte e retorno à pose neutra.

### Espectro da floresta
Capuz rasgado e tecido esvoaçante, núcleo de luz turquesa, contorno reconhecível em escala pequena. Flutua com ondulação de tecido, brilho respirante e gesto de ataque energético.

### Fera da Mata
Fera quadrúpede com pelagem escura, crina irregular e olhos âmbar/vermelhos. Ciclo de corrida legível com 4 patas, preparação de salto, ataque, dano e derrota.

## Floresta da Aurora
Chão com gramas variadas, caminhos, arbustos volumosos, árvores de copas densas, flores, pedras, troncos, cogumelos e cristais. Sol filtrado pelas copas, áreas claras de combate, separação entre fundo, obstáculos e primeiro plano.

### Vida ambiental — regra para cada mapa
- **Floresta:** grama em ondas suaves, copas com balanço, folhas ao vento, pólen e raios de sol.
- Ruínas: poeira, neblina e brasas mágicas.
- Gelo: neve fina, vento e névoa.
- Deserto: areia, poeira e distorção sutil de calor.
- O vento pode ter direção/intensidade variáveis; partículas devem reagir ao vento, não se moverem aleatoriamente.

## Fluxo de produção
1. Prancha conceitual consistente e referências de proporção, direção de câmera e iluminação.
2. Assets isolados com transparência, estados de animação, âncora e resolução adequadas. **Pranchas com rótulos não são sprites finais.**
3. Exportação em atlas para herói, espectro, fera e cenário.
4. Integração em branch/preview; substituir primitives Canvas por sprite renderer progressivamente.
5. Teste automatizado real em WebKit (Safari) e Chromium; verificar iniciar/joystick/combat/render, erros e FPS.
6. Capturas reais + avaliação crítica visual; só publicar quando convincente e jogável.

## Checklist de aprovação
- Herói bonito e legível com a tela reduzida.
- Caminhada com movimento perceptível de pernas, corpo, arma e capa.
- Ataque com antecipação, trajetória e impacto; força do tremor proporcional ao dano.
- Inimigos parecem criaturas vivas, com animações específicas.
- A floresta tem profundidade e folhagens animadas, sem quadrículas ou repetição óbvia.
- Partida jogável no Safari do iPhone, sem erro ou travamento.
- Screenshot da partida real desperta vontade de instalar; não usar mockups como evidência de implementação.

## Primeiro pacote (prévia, não final)
Foi criado um pacote externo de trabalho com recortes ilustrados de 5 poses do guerreiro e 4 poses de cada inimigo. Os sprites foram extraídos de uma prancha conceitual e precisam de limpeza, consistência e mais quadros de animação antes de integração de produção.
