# Ascensão — Estudo Visual 02 (16/10/2026)

## Status: protótipo exploratório, **não aprovado como qualidade final**

Este estudo foi executado localmente em um documento HTML autossuficiente (Canvas 2D) para validar o novo atlas **antes** de integrá-lo à prova de conceito Phaser e ao jogo principal. O protótipo gera 34 quadros brutos extraídos da prancha de referência produzida especificamente para Ascensão (repouso 9, corrida 8, ataque leve 8, ataque forte 9), compõe um atlas para playback e implementa uma máquina de estados básica.

### Executado / verificado
- Separação e alinhamento dos quadros em áreas transparentes; imagens de fundo eliminadas.
- Atlas de 34 células, com substituição temporária dos quadros contaminados por retângulos de VFX e arco renderizado em tempo real.
- Idle, corrida, ataque leve e ataque forte; timing de contato; alvos de treinamento com HP, flashes e efeitos de impacto; câmera com follow; controles de teclado, toque e câmera lenta; modo automático de demonstração.
- Testado com Chromium/Playwright: atlas e cenário carregaram, sem erros JS; simulação registrou 3 acertos.
- Foi registrado vídeo da **execução do protótipo no navegador**, não de frames montados isoladamente.

### Problemas bloqueantes de qualidade visual
1. Identidade visual e anatomia do herói variam entre alguns quadros gerados; deslocamento aparente dos membros e da espada.
2. Nem todas as direções têm sequências autênticas: o teste cobre lateral e espelhamento horizontal, sem animações N/S/diagonais próprias.
3. Cenário de apresentação é temporário e construído com partes repetidas do mockup; ainda não atende o padrão de direção de arte para jogo final.
4. Inimigos são alvos estáticos de treino, não há animação de inimigos.
5. Existem transições que precisam de revisão quadro a quadro; a qualidade da animação final ainda não está aprovada.
6. O estudo usa Canvas 2D autônomo para avaliação local; **não é a integração final no Phaser**.

### Próxima iteração
- Criar e/ou redesenhar um sprite rig/atlas autoral consistente em relação a proporção, cor, rosto e pivô corporal.
- Construir sequências de corrida e golpe realmente contínuas, sem reuso óbvio dos quadros contaminados.
- Validar captura de vídeo real em velocidade normal e câmera lenta.
- Depois de aprovação visual pelo usuário, portar atlas e controlador para Phaser, sem comprometer a Alpha existente.

Regra vigente do projeto: não seguir a novas mecânicas, poderes ou inimigos até a animação e visual atingirem nível satisfatório.