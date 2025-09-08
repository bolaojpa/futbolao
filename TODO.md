# FutBolão Pro - Próximos Passos

Este arquivo documenta o planejamento para as próximas etapas de desenvolvimento do projeto.

## 1. Ativar as Configurações do Administrador

A página `/admin/settings` precisa ter suas funcionalidades ativadas para controlar o comportamento do aplicativo.

-   **[ ] Bloqueio de Cadastro:** Fazer com que a opção "Permitir Novos Cadastros" realmente habilite ou desabilite a página de criação de conta para novos usuários.
-   **[ ] Controle Central da IA:** Usar as opções "Notificações de Desempenho" e "Consulta de IA" como a fonte única de verdade para esses recursos em todo o app, complementando o controle por campeonato.

## 2. Implementar as Mensagens do Administrador

Conectar a tela de `/admin/messaging` para que as mensagens criadas pelo administrador sejam de fato exibidas para os usuários.

-   **[ ] Mensagens Urgentes (Pop-up):** Implementar a lógica para que uma mensagem "Urgente" ativa apareça como um modal (pop-up) para os usuários-alvo quando eles acessarem o dashboard.
-   **[ ] Avisos (Notificação):** Fazer com que as mensagens do tipo "Normal" sejam enviadas como uma notificação padrão para o "sininho" dos usuários-alvo.

## 3. Tornar o Perfil do Usuário Editável

Conectar o formulário em `/dashboard/profile/edit` ao Firestore.

-   **[ ] Salvar Dados:** Implementar a função que atualiza os dados do usuário (nome, apelido, time do coração, URL da imagem) no documento correspondente do Firestore.

## 4. Revisitar e Corrigir Notificações de IA

Com o restante do aplicativo mais estável, revisitar a funcionalidade de notificações de desempenho por IA.

-   **[ ] Corrigir Índice do Firestore:** Investigar e aplicar a correção definitiva para o índice composto do Firestore necessário para a consulta de notificações, garantindo que o recurso funcione de forma confiável.
