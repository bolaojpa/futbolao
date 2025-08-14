# **App Name**: FutBolão Pro

## Core Features:

- User Authentication: Autenticação via email/senha e Google usando Firebase Authentication. No registro, armazenar: `nome`, `apelido`, `email`, `fotoPerfil`, `status` (pendente/ativo/bloqueado), `função` (usuário/admin), `dataCadastro`. Redirecionar usuários pendentes para `/pending-approval` e bloqueados para `/account-blocked`. Todas as mensagens de interface, notificações, placeholders, labels, mensagens de validação e erros devem estar integralmente em Português (PT-BR).
- Dashboard: Exibir resultados recentes de partidas finalizadas, com placar e pontos obtidos pelo usuário. Layout responsivo, totalmente em PT-BR.
- Leaderboard Ranking: Ranking com top 3 destacados (medalhas animadas via Lottie) e animação de confete ao carregar. Animação `leader-pulse` para o 1º colocado. Critério de desempate definido: mais acertos exatos > menor tempo médio de envio dos palpites > ordem de cadastro.
- Make Predictions Form: Formulário para envio de palpites em partidas futuras, bloqueando edições 2 horas antes do início. Exibição de mensagens de confirmação e erro em PT-BR. Registro de data/hora do envio para auditoria anti-trapaça.
- Prediction History: Histórico de palpites do usuário com pontos obtidos por partida. Accordion para comparar palpites com outros jogadores. Disponível também no modo offline via cache local (service worker).
- AI Advisor: Integração com Genkit para sugerir palpites com base nas tendências de outros usuários. Usar `gemini-2.5-flash` as a tool apenas quando houver no mínimo 5 palpites para a partida. Recomendações em PT-BR, exibindo apenas como sugestão (não como substituição automática).
- Real-Time Notifications: Integração com Firebase Cloud Messaging para enviar alertas no navegador: Aviso de jogo prestes a começar. Notificação de pontos conquistados. Mudança na posição do ranking.
- Admin Area: /admin/users: listar usuários, alterar status (ativo/pendente/bloqueado), filtrar por função/status. /admin/championships: criar e listar campeonatos (nome, data de início/fim, formato). /admin/add-match: criar partidas vinculadas a campeonatos com data/hora, times e status. /admin/matches: atualizar placares em tempo real e mudar status da partida ("Ao Vivo", "Finalizado", "Cancelado").
- Social Sharing: Botões para compartilhar ranking e desempenho diretamente para WhatsApp, Instagram ou Facebook.

## Style Guidelines:

- Tema claro: Azul claro `#E3F2FD`.
- Tema escuro: Cinza escuro `#0d1117`.
- Azul `#4285F4` para elementos esportivos e versáteis.
- Laranja `#FF5722` para botões de destaque e chamadas para ação.
- Vermelho `#dc2626` para ações destrutivas.
- `--sidebar-background: #0d1117`
- `--sidebar-foreground: #f0f6fc`
- Fonte `PT Sans` (sans-serif) para modernidade e legibilidade.
- Ícones `lucide-react` para consistência visual.