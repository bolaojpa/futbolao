// Mock Data for FutBolão Pro

export const mockUser = {
  id: 'user_1',
  nome: 'Carlos Silva',
  apelido: 'Carlinhos',
  email: 'carlos@exemplo.com',
  fotoPerfil: 'https://placehold.co/100x100.png',
  status: 'ativo',
  funcao: 'usuario',
  dataCadastro: '2023-01-15T09:30:00Z',
};

export const mockUsers = [
  { id: 'user_1', apelido: 'Carlinhos', pontos: 125, exatos: 10, tempoMedio: 1800, dataCadastro: '2023-01-15' },
  { id: 'user_2', apelido: 'Fernanda', pontos: 118, exatos: 8, tempoMedio: 2200, dataCadastro: '2023-02-20' },
  { id: 'user_3', apelido: 'Lucas', pontos: 115, exatos: 9, tempoMedio: 1500, dataCadastro: '2023-01-10' },
  { id: 'user_4', apelido: 'Juliana', pontos: 102, exatos: 7, tempoMedio: 3600, dataCadastro: '2023-03-01' },
  { id: 'user_5', apelido: 'Rafa', pontos: 99, exatos: 6, tempoMedio: 1200, dataCadastro: '2023-04-05' },
  { id: 'user_6', apelido: 'Beto', pontos: 95, exatos: 5, tempoMedio: 4800, dataCadastro: '2023-02-11' },
  { id: 'user_7', apelido: 'Gabi', pontos: 118, exatos: 8, tempoMedio: 2100, dataCadastro: '2023-5-10' },
  { id: 'user_8', apelido: 'Lanterna', pontos: 23, exatos: 1, tempoMedio: 9999, dataCadastro: '2023-06-01' },
];

export const mockChampionships = [
  { id: 'champ_1', nome: 'Brasileirão Série A 2024', dataInicio: '2024-04-13', dataFim: '2024-12-08' },
  { id: 'champ_2', nome: 'Copa Libertadores 2024', dataInicio: '2024-02-06', dataFim: '2024-11-30' },
];

const MOCK_MATCH_RECENT_1 = { id: 'match_1', campeonato: 'Brasileirão Série A 2024', timeA: 'Flamengo', timeB: 'Palmeiras', placarA: 2, placarB: 2, data: '2024-07-20T20:00:00Z', status: 'Finalizado', pontosObtidos: 5 };
const MOCK_MATCH_RECENT_2 = { id: 'match_2', campeonato: 'Brasileirão Série A 2024', timeA: 'Corinthians', timeB: 'São Paulo', placarA: 1, placarB: 1, data: '2024-07-21T16:00:00Z', status: 'Finalizado', pontosObtidos: 0 };
const MOCK_MATCH_RECENT_3 = { id: 'match_3', campeonato: 'Copa Libertadores 2024', timeA: 'Grêmio', timeB: 'Internacional', placarA: 0, placarB: 1, data: '2024-07-21T18:30:00Z', status: 'Finalizado', pontosObtidos: 10 };

export const mockMatches = {
  recent: [
    MOCK_MATCH_RECENT_1,
    MOCK_MATCH_RECENT_2,
    MOCK_MATCH_RECENT_3,
  ],
  upcoming: [
    { id: 'match_6', campeonato: 'Copa Libertadores 2024', timeA: 'Santos', timeB: 'Fluminense', placarA: 1, placarB: 0, data: '2024-08-09T21:00:00Z', status: 'Ao Vivo' },
    { id: 'match_4', campeonato: 'Brasileirão Série A 2024', timeA: 'Atlético-MG', timeB: 'Cruzeiro', data: '2024-08-10T19:00:00Z', status: 'Agendado' },
    { id: 'match_5', campeonato: 'Brasileirão Série A 2024', timeA: 'Vasco da Gama', timeB: 'Botafogo', data: '2024-08-11T20:00:00Z', status: 'Agendado' },
    { id: 'match_7', campeonato: 'Brasileirão Série A 2024', timeA: 'Bahia', timeB: 'Vitória', data: '2024-08-12T23:00:00Z', status: 'Agendado' },
  ],
};

export const mockPredictions = [
  {
    userId: 'user_1',
    matchId: 'match_1',
    palpiteUsuario: { placarA: 2, placarB: 1 },
    pontos: 5,
    outrosPalpites: [
      { apelido: 'Fernanda', palpite: '1-1', pontos: 0 },
      { apelido: 'Lucas', palpite: '2-2', pontos: 10 },
    ],
  },
  {
    userId: 'user_1',
    matchId: 'match_2',
    palpiteUsuario: { placarA: 2, placarB: 0 },
    pontos: 0,
    outrosPalpites: [
      { apelido: 'Fernanda', palpite: '1-1', pontos: 10 },
      { apelido: 'Lucas', palpite: '0-0', pontos: 5 },
    ],
  },
  {
    userId: 'user_1',
    matchId: 'match_3',
    palpiteUsuario: { placarA: 0, placarB: 1 },
    pontos: 10,
    outrosPalpites: [
      { apelido: 'Fernanda', palpite: '1-2', pontos: 5 },
      { apelido: 'Lucas', palpite: '1-0', pontos: 0 },
    ],
  },
];

export const mockNotifications = [
    { id: 'notif_1', title: 'Partida prestes a começar!', message: 'Atlético-MG x Cruzeiro começa em 2 horas. Dê seu palpite!', read: false },
    { id: 'notif_2', title: 'Você subiu no ranking!', message: 'Parabéns! Você agora está na 3ª posição.', read: false },
    { id: 'notif_3', title: 'Pontos atualizados', message: 'Você ganhou 10 pontos no jogo Grêmio x Internacional.', read: true },
]
