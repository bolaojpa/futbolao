

// Mock Data for FutBolão Pro

export const mockUser = {
  id: 'user_1',
  nome: 'Carlos Silva',
  apelido: 'Carlinhos',
  email: 'carlos@exemplo.com',
  fotoPerfil: 'https://placehold.co/100x100.png', // Simula foto do Google/Social
  urlImagemPersonalizada: '', // Campo para foto personalizada do usuário
  timeCoracao: 'Flamengo',
  ultimaAtividade: '2024-07-26T10:00:00Z',
  ultimoLogin: '2024-07-26T08:30:00Z',
  ultimoPalpite: {
      matchId: 'match_11',
      palpite: '1x0'
  },
  status: 'ativo', // pendente/ativo/bloqueado
  presenceStatus: 'Disponível' as const, // "Disponível", "Ausente", "Ocupado", "Não perturbe", "Offline"
  funcao: 'usuario',
  dataCadastro: '2023-01-15T09:30:00Z',
  titulos: 3,
  totalJogos: 92,
  championshipStats: [
    {
      championshipId: 'champ_1',
      pontos: 85,
      acertosExatos: 7,
      acertosSituacao: 12,
      maiorSequencia: 3,
    },
    {
      championshipId: 'champ_2',
      pontos: 40,
      acertosExatos: 3,
      acertosSituacao: 4,
      maiorSequencia: 2,
    }
  ]
};

export type UserType = Omit<typeof mockUser, 'email'> & { 
  pontos: number, 
  exatos: number, 
  situacoes: number, 
  tempoMedio: number, 
  posicaoVariacao: 'up' | 'down' | 'stable', 
  isNewLeader?: boolean 
};


export const mockUsers: Array<UserType> = [
  { id: 'user_1', nome: 'Carlos Silva', apelido: 'Carlinhos', fotoPerfil: 'https://placehold.co/100x100.png', urlImagemPersonalizada: '', timeCoracao: 'Flamengo', ultimaAtividade: '2024-07-26T10:00:00Z', ultimoLogin: '2024-07-26T08:30:00Z', ultimoPalpite: { matchId: 'match_5', palpite: '1x1' }, championshipStats: [{ championshipId: 'champ_1', pontos: 85, acertosExatos: 7, acertosSituacao: 12, maiorSequencia: 3 }, { championshipId: 'champ_2', pontos: 40, acertosExatos: 3, acertosSituacao: 4, maiorSequencia: 2 }], totalJogos: 88, titulos: 3, dataCadastro: '2023-01-15', pontos: 125, exatos: 10, situacoes: 5, tempoMedio: 1800, isNewLeader: false, posicaoVariacao: 'stable' as const, status: 'ativo', presenceStatus: 'Disponível', funcao: 'usuario' },
  { id: 'user_2', nome: 'Fernanda Souza', apelido: 'Fernanda', fotoPerfil: 'https://placehold.co/100x100.png', urlImagemPersonalizada: '', timeCoracao: 'Palmeiras', ultimaAtividade: '2024-07-26T11:00:00Z', ultimoLogin: '2024-07-26T09:00:00Z', ultimoPalpite: { matchId: 'match_5', palpite: '2x1' }, championshipStats: [{ championshipId: 'champ_1', pontos: 82, acertosExatos: 6, acertosSituacao: 14, maiorSequencia: 2 }, { championshipId: 'champ_2', pontos: 36, acertosExatos: 2, acertosSituacao: 5, maiorSequencia: 1 }], totalJogos: 95, titulos: 11, dataCadastro: '2023-02-20', pontos: 118, exatos: 8, situacoes: 8, tempoMedio: 2200, posicaoVariacao: 'up' as const, status: 'ativo', presenceStatus: 'Ausente', funcao: 'usuario' },
  { id: 'user_3', nome: 'Lucas Martins', apelido: 'Lucas', fotoPerfil: 'https://placehold.co/100x100.png', urlImagemPersonalizada: '', timeCoracao: 'Corinthians', ultimaAtividade: '2024-07-25T18:00:00Z', ultimoLogin: '2024-07-25T17:00:00Z', ultimoPalpite: { matchId: 'match_5', palpite: '0x0' }, championshipStats: [{ championshipId: 'champ_1', pontos: 85, acertosExatos: 5, acertosSituacao: 10, maiorSequencia: 3 }], totalJogos: 102, titulos: 8, dataCadastro: '2023-01-10', pontos: 115, exatos: 9, situacoes: 4, tempoMedio: 1500, posicaoVariacao: 'down' as const, status: 'ativo', presenceStatus: 'Ocupado', funcao: 'usuario' },
  { id: 'user_4', nome: 'Juliana Lima', apelido: 'Juliana', fotoPerfil: 'https://placehold.co/100x100.png', urlImagemPersonalizada: '', timeCoracao: 'São Paulo', ultimaAtividade: '2024-07-26T09:00:00Z', ultimoLogin: '2024-07-26T08:00:00Z', ultimoPalpite: { matchId: 'match_5', palpite: '1x2' }, championshipStats: [{ championshipId: 'champ_1', pontos: 70, acertosExatos: 7, acertosSituacao: 7, maiorSequencia: 2 }], totalJogos: 70, titulos: 5, dataCadastro: '2023-03-01', pontos: 102, exatos: 7, situacoes: 7, tempoMedio: 3600, posicaoVariacao: 'up' as const, status: 'ativo', presenceStatus: 'Disponível', funcao: 'usuario' },
  { id: 'user_5', nome: 'Rafael Costa', apelido: 'Rafa', fotoPerfil: 'https://placehold.co/100x100.png', urlImagemPersonalizada: '', timeCoracao: 'Santos', ultimaAtividade: '2024-07-24T22:00:00Z', ultimoLogin: '2024-07-24T21:00:00Z', ultimoPalpite: { matchId: 'match_5', palpite: '3x1' }, championshipStats: [{ championshipId: 'champ_1', pontos: 65, acertosExatos: 6, acertosSituacao: 9, maiorSequencia: 1 }], totalJogos: 80, titulos: 1, dataCadastro: '2023-04-05', pontos: 99, exatos: 6, situacoes: 9, tempoMedio: 1200, posicaoVariacao: 'stable' as const, status: 'ativo', presenceStatus: 'Não perturbe', funcao: 'usuario' },
  { id: 'user_6', nome: 'Roberto Alves', apelido: 'Beto', fotoPerfil: 'https://placehold.co/100x100.png', urlImagemPersonalizada: '', timeCoracao: 'Cruzeiro', ultimaAtividade: '2024-07-25T14:00:00Z', ultimoLogin: '2024-07-25T13:00:00Z', ultimoPalpite: { matchId: 'match_5', palpite: '2x2' }, championshipStats: [{ championshipId: 'champ_1', pontos: 60, acertosExatos: 5, acertosSituacao: 10, maiorSequencia: 2 }], totalJogos: 65, titulos: 0, dataCadastro: '2023-02-11', pontos: 95, exatos: 5, situacoes: 10, tempoMedio: 4800, posicaoVariacao: 'down' as const, status: 'ativo', presenceStatus: 'Offline', funcao: 'usuario' },
  { id: 'user_7', nome: 'Gabriela Pereira', apelido: 'Gabi', fotoPerfil: 'https://placehold.co/100x100.png', urlImagemPersonalizada: '', timeCoracao: 'Grêmio', ultimaAtividade: '2024-07-26T12:00:00Z', ultimoLogin: '2024-07-26T11:30:00Z', ultimoPalpite: { matchId: 'match_5', palpite: '1x0' }, championshipStats: [{ championshipId: 'champ_1', pontos: 82, acertosExatos: 8, acertosSituacao: 6, maiorSequencia: 4 }], totalJogos: 78, titulos: 2, dataCadastro: '2023-5-10', pontos: 118, exatos: 8, situacoes: 6, tempoMedio: 2100, posicaoVariacao: 'up' as const, status: 'ativo', presenceStatus: 'Disponível', funcao: 'usuario' },
  { id: 'user_8', nome: 'Thiago Oliveira', apelido: 'Lanterna', fotoPerfil: 'https://placehold.co/100x100.png', urlImagemPersonalizada: '', timeCoracao: 'Botafogo', ultimaAtividade: '2024-07-26T08:00:00Z', ultimoLogin: '2024-07-26T07:00:00Z', ultimoPalpite: { matchId: 'match_5', palpite: '0x1' }, championshipStats: [{ championshipId: 'champ_1', pontos: 20, acertosExatos: 1, acertosSituacao: 4, maiorSequencia: 1 }], totalJogos: 50, titulos: 0, dataCadastro: '2023-06-01', pontos: 23, exatos: 1, situacoes: 4, tempoMedio: 9999, posicaoVariacao: 'stable' as const, status: 'ativo', presenceStatus: 'Offline', funcao: 'usuario' },
];

export const mockChampionships = [
  { id: 'champ_1', nome: 'Brasileirão Série A 2024', dataInicio: '2024-04-13', dataFim: '2024-12-08', pontuacao: { exato: 10, situacao: 5 } },
  { id: 'champ_2', nome: 'Copa Libertadores 2024', dataInicio: '2024-02-06', dataFim: '2024-11-30', pontuacao: { exato: 15, situacao: 7 } },
];

const MOCK_MATCH_RECENT_1 = { id: 'match_1', campeonato: 'Brasileirão Série A 2024', timeA: 'Flamengo', timeB: 'Palmeiras', placarA: 2, placarB: 2, data: '2024-07-20T20:00:00Z', status: 'Finalizado', pontosObtidos: 5, maxPontos: 10 };
const MOCK_MATCH_RECENT_2 = { id: 'match_2', campeonato: 'Brasileirão Série A 2024', timeA: 'Corinthians', timeB: 'São Paulo', placarA: 1, placarB: 1, data: '2024-07-21T16:00:00Z', status: 'Finalizado', pontosObtidos: 0, maxPontos: 10 };
const MOCK_MATCH_RECENT_3 = { id: 'match_3', campeonato: 'Copa Libertadores 2024', timeA: 'Grêmio', timeB: 'Internacional', placarA: 0, placarB: 1, data: '2024-07-21T18:30:00Z', status: 'Finalizado', pontosObtidos: 15, maxPontos: 15 };
const MOCK_MATCH_RECENT_8 = { id: 'match_8', campeonato: 'Brasileirão Série A 2024', timeA: 'Internacional', timeB: 'Juventude', placarA: 1, placarB: 0, data: '2024-07-19T20:00:00Z', status: 'Finalizado', pontosObtidos: 5, maxPontos: 10 };
const MOCK_MATCH_RECENT_9 = { id: 'match_9', campeonato: 'Brasileirão Série A 2024', timeA: 'Fortaleza', timeB: 'Criciúma', placarA: 1, placarB: 1, data: '2024-07-18T16:00:00Z', status: 'Finalizado', pontosObtidos: 10, maxPontos: 10 };
const MOCK_MATCH_RECENT_10 = { id: 'match_10', campeonato: 'Brasileirão Série A 2024', timeA: 'Bragantino', timeB: 'Atlético-GO', placarA: 0, placarB: 2, data: '2024-07-17T18:30:00Z', status: 'Finalizado', pontosObtidos: 0, maxPontos: 10 };
const MOCK_MATCH_RECENT_11 = { id: 'match_11', campeonato: 'Brasileirão Série A 2024', timeA: 'Cuiabá', timeB: 'Goiás', placarA: 2, placarB: 1, data: '2024-07-16T18:30:00Z', status: 'Finalizado', pontosObtidos: 5, maxPontos: 10 };


// Helper para criar uma data futura para os mocks
const futureDate = (hours: number) => {
    const date = new Date();
    date.setHours(date.getHours() + hours);
    return date.toISOString();
}

export const mockMatches = {
  recent: [
    MOCK_MATCH_RECENT_1,
    MOCK_MATCH_RECENT_2,
    MOCK_MATCH_RECENT_3,
    MOCK_MATCH_RECENT_8,
    MOCK_MATCH_RECENT_9,
    MOCK_MATCH_RECENT_10,
    MOCK_MATCH_RECENT_11,
  ],
  upcoming: [
    { id: 'match_6', campeonato: 'Copa Libertadores 2024', timeA: 'Santos', timeB: 'Fluminense', placarA: 1, placarB: 0, data: futureDate(0.5), status: 'Ao Vivo', maxPontos: 15 },
    { id: 'match_4', campeonato: 'Brasileirão Série A 2024', timeA: 'Atlético-MG', timeB: 'Cruzeiro', data: futureDate(1.5), status: 'Agendado', maxPontos: 10 }, // Partida para contagem regressiva
    { id: 'match_5', campeonato: 'Brasileirão Série A 2024', timeA: 'Vasco da Gama', timeB: 'Botafogo', data: futureDate(3), status: 'Agendado', maxPontos: 10 },
    { id: 'match_7', campeonato: 'Brasileirão Série A 2024', timeA: 'Bahia', timeB: 'Vitória', data: futureDate(24), status: 'Agendado', maxPontos: 10 },
  ],
};

export const mockPredictions = [
  {
    userId: 'user_1',
    matchId: 'match_1',
    palpiteUsuario: { placarA: 2, placarB: 1 },
    pontos: 5,
    outrosPalpites: [
      { userId: 'user_2', apelido: 'Fernanda', palpite: '1-1', pontos: 0 },
      { userId: 'user_3', apelido: 'Lucas', palpite: '2-2', pontos: 10 },
    ],
  },
  {
    userId: 'user_1',
    matchId: 'match_2',
    palpiteUsuario: { placarA: 2, placarB: 0 },
    pontos: 0,
    outrosPalpites: [
      { userId: 'user_2', apelido: 'Fernanda', palpite: '1-1', pontos: 10 },
      { userId: 'user_3', apelido: 'Lucas', palpite: '0-0', pontos: 5 },
    ],
  },
  {
    userId: 'user_1',
    matchId: 'match_3',
    palpiteUsuario: { placarA: 0, placarB: 1 },
    pontos: 15,
    outrosPalpites: [
      { userId: 'user_2', apelido: 'Fernanda', palpite: '1-2', pontos: 7 },
      { userId: 'user_3', apelido: 'Lucas', palpite: '1-0', pontos: 0 },
    ],
  },
  // Prediction for live match with simulated points
  {
    userId: 'user_1',
    matchId: 'match_6',
    palpiteUsuario: { placarA: 2, placarB: 1 },
    pontos: 7, // Pontos simulados para o usuário principal (acertou o vencedor)
    outrosPalpites: [
      { userId: 'user_2', apelido: 'Fernanda', palpite: '1-0', pontos: 15 }, // Acertou o placar exato
      { userId: 'user_3', apelido: 'Lucas', palpite: '3-0', pontos: 7 },  // Acertou o vencedor
      { userId: 'user_4', apelido: 'Juliana', palpite: '1-1', pontos: 0 }, // Errou
    ],
  },
  // Prediction for an upcoming match (Vasco vs Botafogo)
  {
    userId: 'user_1',
    matchId: 'match_5',
    palpiteUsuario: { placarA: 1, placarB: 1 },
    pontos: 0,
    outrosPalpites: [],
  },
  // Predictions for new recent matches
  {
    userId: 'user_1',
    matchId: 'match_8',
    palpiteUsuario: { placarA: 2, placarB: 0 },
    pontos: 5,
    outrosPalpites: [
      { userId: 'user_2', apelido: 'Fernanda', palpite: '1-0', pontos: 10 },
    ],
  },
  {
    userId: 'user_1',
    matchId: 'match_9',
    palpiteUsuario: { placarA: 1, placarB: 1 },
    pontos: 10,
    outrosPalpites: [
       { userId: 'user_3', apelido: 'Lucas', palpite: '0-0', pontos: 5 },
    ],
  },
  {
    userId: 'user_1',
    matchId: 'match_10',
    palpiteUsuario: { placarA: 3, placarB: 1 },
    pontos: 0,
    outrosPalpites: [
       { userId: 'user_4', apelido: 'Juliana', palpite: '0-2', pontos: 10 },
    ],
  },
   {
    userId: 'user_1',
    matchId: 'match_11',
    palpiteUsuario: { placarA: 1, placarB: 0 },
    pontos: 5,
    outrosPalpites: [
       { userId: 'user_5', apelido: 'Rafa', palpite: '2-1', pontos: 10 },
    ],
  },
];

export const mockNotifications = [
    { id: 'notif_1', title: 'Partida prestes a começar!', message: 'Atlético-MG x Cruzeiro começa em 2 horas. Dê seu palpite!', read: false, createdAt: new Date(new Date().getTime() - (1000 * 60 * 5)), href: '/dashboard/predictions#match_4' },
    { id: 'notif_2', title: 'Você subiu no ranking!', message: 'Parabéns! Você agora está na 3ª posição.', read: false, createdAt: new Date(new Date().getTime() - (1000 * 60 * 60 * 2)), href: '/dashboard/leaderboard' },
    { id: 'notif_3', title: 'Pontos atualizados', message: 'Você ganhou 10 pontos no jogo Grêmio x Internacional.', read: true, createdAt: new Date(new Date().getTime() - (1000 * 60 * 60 * 24)), href: '/dashboard/history#match_3' },
];


export const mockEmergencyMessage = {
    id: 'msg_001',
    title: 'Aviso Urgente do Administrador',
    message: 'Estamos passando por uma instabilidade temporária no sistema de pontuação. Os pontos da última rodada serão recalculados em breve. Agradecemos a compreensão.',
    active: true, // Mude para 'false' para desativar o modal
    targetUserIds: ['all'], // 'all' para todos, ou um array de user_ids ['user_1', 'user_3']
};

export const mockHallOfFame = [
    {
        id: 'hof_1',
        campeonatoLogoUrl: 'https://placehold.co/128x128.png',
        campeonatoNome: 'Brasileirão Série A 2023',
        campeaoGeralNome: 'Fernanda',
        campeaoGeralAvatarUrl: 'https://placehold.co/128x128.png',
        tipoPalpite: 'equipe' as const,
        palpiteiroNome: 'Juliana',
        palpiteiroAvatarUrl: 'https://placehold.co/128x128.png',
    },
    {
        id: 'hof_2',
        campeonatoLogoUrl: 'https://placehold.co/128x128.png',
        campeonatoNome: 'Copa do Mundo 2022',
        campeaoGeralNome: 'Carlinhos',
        campeaoGeralAvatarUrl: 'https://placehold.co/128x128.png',
        tipoPalpite: 'selecao' as const,
        palpiteiroNome: 'Lucas',
        palpiteiroAvatarUrl: 'https://placehold.co/128x128.png',
    }
]
