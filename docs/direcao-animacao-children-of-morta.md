# Projeto Ascensão — Direção de animação e combate
## Referência: Children of Morta (vídeo enviado em 16/10/2026)

> Objetivo: qualidade de movimento e legibilidade de combate comparáveis à referência, **sem copiar arte, personagens, golpes específicos ou efeitos proprietários**. Aplicar os princípios ao visual original do Projeto Ascensão.

### Leitura de movimentos do vídeo
- **~01,0–02,2 s:** espadadas com arcos grandes e claros; silhueta do guerreiro muda antes e depois do golpe; a trilha da espada surge durante o contato e se dissipa rapidamente.
- **~03,0–10,5 s:** combate com repetição de golpes, impactos localizados, inimigos reagindo e partículas breves; o personagem não deve tremer ou chacoalhar para simular energia.
- **~12,7–14,5 s:** o herói permanece em postura de guarda entre ações. Os pés ficam plantados e apenas a postura/roupa/arma apresentam pequenos movimentos naturais.
- **~15,5–16,5 s:** efeitos mágicos fortes são usados como acento; não devem encobrir continuamente o herói ou inimigos.

### O que aprendemos com o jogo atual
- `phaser-lab.js` instancia o sprite do herói no quadro **0** e não executa animações de repouso, corrida, antecipação e recuperação.
- O atlas em `assets-data-v07.js` tem **5 poses** do herói (idle, passo, preparação, ataque, ferimento segundo `illustrated-v10.js`), insuficientes para alcançar a fluidez pretendida.
- `phaser-lab.js` dispara dano e desenha o arco ao mesmo tempo, sem sincronizá-los a um quadro efetivo do golpe.
- Não resolver por bob vertical do sprite inteiro, escala pulsante ou jitter aleatório: produz sensação de deslize/tremedeira rejeitada na avaliação anterior.
- Phaser 3 pode oferecer timeline, camera e partículas, mas **não substitui a criação da arte quadro a quadro**.

### Definição do conjunto inicial de animações (herói de espada)
Produzir sprites autorais consistentes, com mesma iluminação, rosto, proporções, indumentária e arma:
1. **Idle/guarda**: loop de pelo menos 6–8 quadros, com respiração/ombros/tecido/arma sutis e pés completamente fixos.
2. **Caminhada/corrida**: 8–12 quadros por ciclo; alternância visível dos apoios e pivô dos pés; velocidade sincronizada ao deslocamento no mundo, sem foot sliding.
3. **Viradas**: transição curta quando muda de direção. Separar orientação corporal de direção de avanço.
4. **Ataque com espada A**: 8–12 quadros com antecipação, aceleração, contato e recuperação. A arma acompanha as mãos e o corpo.
5. **Ataque B**: variação de trajetória para alternância de golpes, não um clone espelhado do ataque A.
6. **Dano e morte**: hit react breve, reação/queda autoral, sem física exagerada ou sacudidas.

### Direções
- Objetivo final: 8 direções coerentes (N, NE, E, SE, S, SO, O, NO), ou 4+diagonais produzidas intencionalmente.
- Não utilizar apenas espelhamento horizontal para representar golpes para cima/baixo.
- Manter o ponto de apoio (pé no solo) e as mãos do herói coerentes entre quadros; lâmina deve mudar de profundidade ao passar à frente/atrás do corpo.

### Direção do golpe e do VFX
- Timeline do ataque: **preparação ~20–25%**, **aceleração/contato ~35–45%**, **recuperação ~30–40%** (tuning visual, não imposição de duração rígida).
- Registrar `hitFrame` na animação; aplicar dano/knockback/partículas apenas no contato, e não no começo do ataque.
- Trilha da espada ligada à ponta da lâmina e direção do movimento; nasce durante o swing, abre em cauda, perde opacidade e desaparece.
- Impacto nos inimigos: flash de contato muito breve, deslocamento pequeno na direção correta, 3–8 partículas selecionadas por material, seguida de recuperação; animação do inimigo **não deve escorregar em idle**.
- Hit-stop discreto (poucos milissegundos), aplicável apenas ao golpe que realmente acerta, com ajuste de câmera raro e muito contido.
- VFX subordinado à leitura do movimento e silhueta: nem explosões sem origem, nem camadas que ocultem o herói.

### Inimigos
- Estados mínimos: `idle`, `move`, `attack-windup`, `attack-contact`, `hit`, `death`.
- Aproximação com passos/ciclo coerente com a velocidade; travar distância ao atacar, sem atravessar o herói.
- Personalidade de animação por arquétipo: criatura pesada não tem mesmo tempo de aceleração que criatura espectral.
- Reação a golpes sem teleporte, jitter ou vibração da posição do sprite.

### Responsabilidades técnicas
- `hero-animation`: máquina de estados separada da lógica de movimento, transições com prioridade `death > hit > attack > move > idle`.
- `combat-events`: eventos `windup`, `hitFrame`, `recover`, `end`; hitbox acompanha arco/contato visual real.
- `vfx`: sword trail e hit burst independentes do sprite, com pooling e descarte controlados.
- `foe-animation`: estados e eventos de ataque/reação dos inimigos.
- Câmera e movimentação permanecem contínuas; jitter de câmera NÃO é animação de personagem.

### Sequência de produção, sem comprometer a Alpha 0.11
1. **Primeiro construir o herói, isolado, em uma sala de testes Phaser**: idle + movimentação + ataque em duas direções, ainda sem hordas.
2. Aprovar aparência em vídeo e no celular: herói parado 10s; correr 8 direções; atacar parado; atacar em movimento.
3. Expandir a arte autoral para todas as direções e sincronizar hitboxes.
4. Criar animação de um inimigo representativo (aproxima, ataca, reage, morre).
5. Inserir VFX e áudio em camadas depois de o movimento base já estar bonito.
6. Somente então integrar ao laboratório jogável e, após aprovação visual, considerar migração ao jogo principal.

### Critérios de aceite visual — **bloqueantes**
- [ ] 10 segundos parado: **pés plantados, respiração/postura viva, sem vibração**.
- [ ] Corrida em diagonal: passos reais sem patinar nem saltitar verticalmente.
- [ ] Ataque para cima/baixo/lados: corpo, braços e lâmina coerentes em todas as direções.
- [ ] HitFrame visual coincide com contato/dano/partículas (verificar em câmera lenta).
- [ ] Inimigos se movem usando ciclo próprio, sem deslizar, colidir de forma inconsistente ou sacudir.
- [ ] 60 FPS como meta nos aparelhos-alvo, com validação visual real em iPhone e desktop.
- [ ] Prévia apresentada com imagens/vídeos de teste, comparada com o vídeo de referência; **não anunciar qualidade final sem testes reais**.

### Regra de projeto
A estética é condição para prosseguir. Não trocar qualidade de animação por inclusão acelerada de mecânicas. Não fazer "correções" artificiais em sprites isolados para simular movimento completo.
