# FutBolão Pro - Próximos Passos

Este arquivo documenta o planejamento para as próximas etapas de desenvolvimento do projeto.

## 1. Implementar Múltiplos Níveis de Moderação (Pendente)

Evoluir o sistema de permissões para suportar diferentes níveis de moderadores, conforme sugerido.

-   **[ ] Nível 1 (Moderador Atual):** Mantém as permissões de gerenciar usuários, partidas (com placares) e suporte.
-   **[ ] Nível 2 (Moderador de Jogo):** Teria acesso ao painel de administração, poderia criar/editar partidas, mas **não** conseguiria visualizar os placares de jogos futuros, permitindo que participe dos bolões de forma justa.

## 2. Corrigir Comportamento de Notificações no Histórico (Pendente)

A página `/dashboard/notifications` precisa de um ajuste final no comportamento dos cards de notificação.

-   **[ ] Implementar "Ver Mais" para Avisos Longos:** As notificações do tipo "Normal" (Aviso) que tiverem um texto muito longo não estão expandindo para mostrar o conteúdo completo. É preciso implementar um botão "Ver mais" que expanda o card para revelar todo o texto, em vez de tentar abrir um modal ou navegar para um link inexistente.

## 3. Ativar as Configurações do Administrador

A página `/admin/settings` precisa ter suas funcionalidades ativadas para controlar o comportamento do aplicativo.

-   **[ ] Bloqueio de Cadastro:** Fazer com que a opção "Permitir Novos Cadastros" realmente habilite ou desabilite a página de criação de conta para novos usuários.
-   **[ ] Controle Central da IA:** Usar as opções "Notificações de Desempenho" e "Consulta de IA" como a fonte única de verdade para esses recursos em todo o app, complementando o controle por campeonato.

## 4. Tornar o Perfil do Usuário Editável

Conectar o formulário em `/dashboard/profile/edit` ao Firestore.

-   **[ ] Salvar Dados:** Implementar a função que atualiza os dados do usuário (nome, apelido, time do coração, URL da imagem) no documento correspondente do Firestore.

## 5. Revisitar e Corrigir Notificações de IA

Com o restante do aplicativo mais estável, revisitar a funcionalidade de notificações de desempenho por IA.

-   **[ ] Corrigir Índice do Firestore:** Investigar e aplicar a correção definitiva para o índice composto do Firestore necessário para a consulta de notificações, garantindo que o recurso funcione de forma confiável.
