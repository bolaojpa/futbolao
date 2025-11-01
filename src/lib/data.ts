
import { addDays, subDays } from 'date-fns';

export interface UserType {
    id: string;
    nome: string;
    apelido: string;
    email: string;
    fotoPerfil: string;
    urlImagemPersonalizada?: string;
    status: 'ativo' | 'pendente' | 'bloqueado';
    funcao: 'usuario' | 'moderador' | 'admin';
    pontos: number;
    exatos: number;
    situacoes: number;
    tempoMedio: number;
    posicaoVariacao?: 'up' | 'down' | 'stable';
    dataCadastro: string;
    ultimaAtividade: string;
    ultimoLogin: string;
    presenceStatus: 'Disponível' | 'Ausente' | 'Ocupado' | 'Não perturbe' | 'Offline';
    ultimoPalpite: { matchId: string; palpite: string };
    titulos: number;
    totalJogos: number;
    timeCoracao?: string;
    championPicks?: { championshipId: string, teams: string[] }[];
    championshipStats: {
        championshipId: string;
        pontos: number;
        acertosExatos: number;
        acertosSituacao: number;
        maiorSequencia: number;
    }[];
}

export interface Match {
    id: string;
    campeonato: string;
    campeonatoId: string;
    timeA: string;
    timeB: string;
    placarA?: number | null;
    placarB?: number | null;
    data: string;
    status: 'Agendado' | 'Ao Vivo' | 'Finalizado' | 'Cancelado' | 'Hoje';
    fase: string;
    maxPontos?: number;
    iconUrl?: string;
}

export interface Prediction {
    matchId: string;
    userId: string;
    palpiteUsuario: {
      placarA: number;
      placarB: number;
    };
    pontos: number;
    outrosPalpites: { userId: string; apelido: string; palpite: string; pontos: number }[];
}

export interface Championship {
    id: string;
    nome: string;
    iconUrl?: string;
    dataInicio: string | Date;
    dataFim: string | Date;
    tipoCampeonato: 'liga' | 'copa' | 'avulso';
    modoEquipes: 'times' | 'selecao' | 'mista';
    teamIds: string[];
    participantes: string[];
    status: 'ativo' | 'arquivado';
    formatoFases?: 'fases' | 'rodadas';
    fases?: { nome: string; idaEVolta: boolean; rodadas?: number }[];
    rodadas?: number;
    pontuacao: {
        tradicional: { ativo: boolean; exato: number; situacao: number; };
        combo?: { ativo: boolean; gols: number; placar: number; };
    };
    banner: {
        ativo: boolean;
        campeonatoLogoUrl?: string;
        backgroundUrl?: string;
        displayMode?: 'photo_and_names' | 'names_only';
    };
    championPredictionSettings?: {
        active: boolean;
        numberOfPicks: number;
    };
    finalRanking?: {
        pos1?: string;
        pos2?: string;
        pos3?: string;
        pos4?: string;
        pos5?: string;
    };
}

export interface Team {
    id: string;
    name: string;
    crestUrl: string;
    type: 'club' | 'national';
}

export interface Log {
    id: string;
    timestamp: string;
    actor: {
        id: string;
        apelido: string;
        type: 'admin' | 'moderator' | 'user';
    };
    action: 'login' | 'login_fail' | 'prediction_update' | 'profile_update' | 'user_management' | 'championship_create' | 'emergency_message' | 'ai_notification';
    details: string | object;
}

export interface Notification {
    id: string;
    title: string;
    message: string;
    read: boolean;
    createdAt: Date;
    href: string;
}

export interface HallOfFameBanner {
    id: string;
    campeonatoLogoUrl: string;
    campeonatoNome: string;
    campeaoGeralNome: string;
    campeaoGeralAvatarUrl: string;
    modoEquipes: "selecao" | "times" | "mista";
    palpiteiroNome: string;
    palpiteiroAvatarUrl: string;
    displayMode?: 'photo_and_names' | 'names_only';
}

const now = new Date();

export const mockUsers: UserType[] = [
    {
        id: 'user_1',
        nome: 'Carlos "O Profeta" Silva',
        apelido: 'O Profeta',
        email: 'carlos.silva@example.com',
        fotoPerfil: 'https://picsum.photos/id/1005/100/100',
        urlImagemPersonalizada: '',
        status: 'ativo',
        funcao: 'usuario',
        pontos: 150,
        exatos: 10,
        situacoes: 10,
        tempoMedio: 120,
        posicaoVariacao: 'up',
        dataCadastro: subDays(now, 150).toISOString(),
        ultimaAtividade: subDays(now, 1).toISOString(),
        ultimoLogin: subDays(now, 1).toISOString(),
        ultimoPalpite: { matchId: 'match_1', palpite: '2-1' },
        presenceStatus: 'Disponível',
        titulos: 11,
        totalJogos: 123,
        timeCoracao: 'Flamengo',
        championPicks: [
            { championshipId: 'champ_1', teams: ['Flamengo', 'Palmeiras', 'Fluminense'] },
        ],
        championshipStats: [
            { championshipId: 'champ_1', pontos: 150, acertosExatos: 10, acertosSituacao: 10, maiorSequencia: 3 },
            { championshipId: 'champ_2', pontos: 120, acertosExatos: 8, acertosSituacao: 12, maiorSequencia: 2 },
        ]
    },
    {
        id: 'user_2',
        nome: 'Ana "A Estrategista" Souza',
        apelido: 'A Estrategista',
        email: 'ana.souza@example.com',
        fotoPerfil: 'https://picsum.photos/id/1011/100/100',
        status: 'ativo',
        funcao: 'usuario',
        pontos: 145,
        exatos: 8,
        situacoes: 15,
        tempoMedio: 110,
        posicaoVariacao: 'stable',
        dataCadastro: subDays(now, 200).toISOString(),
        ultimaAtividade: subDays(now, 2).toISOString(),
        ultimoLogin: subDays(now, 2).toISOString(),
        ultimoPalpite: { matchId: 'match_2', palpite: '1-1' },
        presenceStatus: 'Disponível',
        titulos: 8,
        totalJogos: 110,
        timeCoracao: 'Corinthians',
        championPicks: [
            { championshipId: 'champ_1', teams: ['Corinthians', 'São Paulo', 'Santos'] },
        ],
        championshipStats: [
            { championshipId: 'champ_1', pontos: 145, acertosExatos: 8, acertosSituacao: 15, maiorSequencia: 4 },
            { championshipId: 'champ_2', pontos: 90, acertosExatos: 5, acertosSituacao: 10, maiorSequencia: 2 },
        ]
    },
    {
        id: 'user_3',
        nome: 'Bruno "Pé Quente" Costa',
        apelido: 'Pé Quente',
        email: 'bruno.costa@example.com',
        fotoPerfil: 'https://picsum.photos/id/1025/100/100',
        status: 'ativo',
        funcao: 'usuario',
        pontos: 142,
        exatos: 12,
        situacoes: 5,
        tempoMedio: 150,
        posicaoVariacao: 'down',
        dataCadastro: subDays(now, 100).toISOString(),
        ultimaAtividade: new Date().toISOString(),
        ultimoLogin: new Date().toISOString(),
        ultimoPalpite: { matchId: 'match_3', palpite: '3-0' },
        presenceStatus: 'Ausente',
        titulos: 5,
        totalJogos: 98,
        timeCoracao: 'Palmeiras',
        championPicks: [
            { championshipId: 'champ_1', teams: ['Palmeiras', 'Atlético-MG', 'Internacional'] },
        ],
        championshipStats: [
            { championshipId: 'champ_1', pontos: 142, acertosExatos: 12, acertosSituacao: 5, maiorSequencia: 2 },
        ]
    },
    {
        id: 'user_4',
        nome: 'Mariana "A Vidente" Lima',
        apelido: 'A Vidente',
        email: 'mariana.lima@example.com',
        fotoPerfil: 'https://picsum.photos/id/1027/100/100',
        status: 'pendente',
        funcao: 'usuario',
        pontos: 130,
        exatos: 7,
        situacoes: 13,
        tempoMedio: 90,
        posicaoVariacao: 'up',
        dataCadastro: subDays(now, 50).toISOString(),
        ultimaAtividade: subDays(now, 5).toISOString(),
        ultimoLogin: subDays(now, 5).toISOString(),
        ultimoPalpite: { matchId: 'match_4', palpite: '0-0' },
        presenceStatus: 'Offline',
        titulos: 3,
        totalJogos: 80,
        timeCoracao: 'Vasco da Gama',
        championPicks: [
            { championshipId: 'champ_1', teams: ['Vasco da Gama', 'Botafogo', 'Grêmio'] },
        ],
        championshipStats: [
            { championshipId: 'champ_1', pontos: 130, acertosExatos: 7, acertosSituacao: 13, maiorSequencia: 3 },
        ]
    },
    {
        id: 'user_5',
        nome: 'Jorge "O Corneta" Dias',
        apelido: 'O Corneta',
        email: 'jorge.dias@example.com',
        fotoPerfil: 'https://picsum.photos/id/1040/100/100',
        status: 'bloqueado',
        funcao: 'usuario',
        pontos: 120,
        exatos: 5,
        situacoes: 10,
        tempoMedio: 180,
        dataCadastro: subDays(now, 300).toISOString(),
        ultimaAtividade: subDays(now, 10).toISOString(),
        ultimoLogin: subDays(now, 10).toISOString(),
        ultimoPalpite: { matchId: 'match_5', palpite: '1-2' },
        presenceStatus: 'Ocupado',
        titulos: 1,
        totalJogos: 150,
        timeCoracao: 'Santos',
        championPicks: [
            { championshipId: 'champ_1', teams: ['Santos', 'Cruzeiro', 'Bahia'] },
        ],
        championshipStats: [
            { championshipId: 'champ_1', pontos: 120, acertosExatos: 5, acertosSituacao: 10, maiorSequencia: 1 },
        ]
    },
    {
        id: 'user_6',
        nome: 'Patrícia "A Analista" Martins',
        apelido: 'A Analista',
        email: 'patricia.martins@example.com',
        fotoPerfil: 'https://picsum.photos/id/1062/100/100',
        status: 'ativo',
        funcao: 'moderador',
        pontos: 160,
        exatos: 15,
        situacoes: 5,
        tempoMedio: 80,
        posicaoVariacao: 'up',
        dataCadastro: subDays(now, 400).toISOString(),
        ultimaAtividade: new Date().toISOString(),
        ultimoLogin: new Date().toISOString(),
        ultimoPalpite: { matchId: 'match_1', palpite: '2-0' },
        presenceStatus: 'Disponível',
        titulos: 15,
        totalJogos: 200,
        timeCoracao: 'Grêmio',
        championPicks: [
            { championshipId: 'champ_1', teams: ['Grêmio', 'Internacional', 'Athletico-PR'] },
        ],
        championshipStats: [
            { championshipId: 'champ_1', pontos: 160, acertosExatos: 15, acertosSituacao: 5, maiorSequencia: 5 },
        ]
    },
    {
        id: 'user_7',
        nome: 'Roberto "O Moderador" Almeida',
        apelido: 'Beto Mod',
        email: 'roberto.almeida@example.com',
        fotoPerfil: 'https://picsum.photos/id/1074/100/100',
        status: 'ativo',
        funcao: 'moderador',
        pontos: 135,
        exatos: 9,
        situacoes: 9,
        tempoMedio: 100,
        posicaoVariacao: 'stable',
        dataCadastro: subDays(now, 500).toISOString(),
        ultimaAtividade: subDays(now, 1).toISOString(),
        ultimoLogin: subDays(now, 1).toISOString(),
        ultimoPalpite: { matchId: 'match_2', palpite: '1-0' },
        presenceStatus: 'Não perturbe',
        titulos: 7,
        totalJogos: 180,
        timeCoracao: 'Fluminense',
        championPicks: [
            { championshipId: 'champ_1', teams: ['Fluminense', 'Vasco da Gama', 'Botafogo'] },
        ],
        championshipStats: [
            { championshipId: 'champ_1', pontos: 135, acertosExatos: 9, acertosSituacao: 9, maiorSequencia: 3 },
        ]
    },
    {
        id: 'user_8',
        nome: 'Zeca "O Lanterna" Pereira',
        apelido: 'Zeca Lanterna',
        email: 'zeca.pereira@example.com',
        fotoPerfil: 'https://picsum.photos/id/200/100/100',
        status: 'ativo',
        funcao: 'usuario',
        pontos: 50,
        exatos: 1,
        situacoes: 8,
        tempoMedio: 250,
        posicaoVariacao: 'down',
        dataCadastro: subDays(now, 80).toISOString(),
        ultimaAtividade: subDays(now, 3).toISOString(),
        ultimoLogin: subDays(now, 3).toISOString(),
        ultimoPalpite: { matchId: 'match_5', palpite: '0-3' },
        presenceStatus: 'Offline',
        titulos: 0,
        totalJogos: 50,
        timeCoracao: 'Botafogo',
        championPicks: [
            { championshipId: 'champ_1', teams: ['Botafogo', 'Flamengo', 'Palmeiras'] },
        ],
        championshipStats: [
            { championshipId: 'champ_1', pontos: 50, acertosExatos: 1, acertosSituacao: 8, maiorSequencia: 1 },
        ]
    },
     {
        id: 'user_9',
        nome: 'Leo "O Sumido" Santos',
        apelido: 'Leo Sumido',
        email: 'leo.santos@example.com',
        fotoPerfil: 'https://picsum.photos/id/300/100/100',
        status: 'ativo',
        funcao: 'usuario',
        pontos: 110,
        exatos: 6,
        situacoes: 8,
        tempoMedio: 190,
        posicaoVariacao: 'down',
        dataCadastro: subDays(now, 180).toISOString(),
        ultimaAtividade: subDays(now, 30).toISOString(),
        ultimoLogin: subDays(now, 30).toISOString(),
        ultimoPalpite: { matchId: 'match_5', palpite: '1-1' },
        presenceStatus: 'Offline',
        titulos: 0,
        totalJogos: 60,
        timeCoracao: 'São Paulo',
        championPicks: [
            { championshipId: 'champ_1', teams: ['São Paulo', 'Corinthians', 'Santos'] },
        ],
        championshipStats: [
            { championshipId: 'champ_1', pontos: 110, acertosExatos: 6, acertosSituacao: 8, maiorSequencia: 2 },
        ]
    },
    {
        id: 'user_10',
        nome: 'Fernanda "Fê" Rocha',
        apelido: 'Fê Rocha',
        email: 'fernanda.rocha@example.com',
        fotoPerfil: 'https://picsum.photos/id/400/100/100',
        status: 'ativo',
        funcao: 'usuario',
        pontos: 138,
        exatos: 9,
        situacoes: 10,
        tempoMedio: 115,
        posicaoVariacao: 'up',
        dataCadastro: subDays(now, 120).toISOString(),
        ultimaAtividade: subDays(now, 1).toISOString(),
        ultimoLogin: subDays(now, 1).toISOString(),
        ultimoPalpite: { matchId: 'match_1', palpite: '2-1' },
        presenceStatus: 'Disponível',
        titulos: 2,
        totalJogos: 95,
        timeCoracao: 'Atlético-MG',
        championPicks: [
            { championshipId: 'champ_1', teams: ['Atlético-MG', 'Cruzeiro', 'Flamengo'] },
        ],
        championshipStats: [
            { championshipId: 'champ_1', pontos: 138, acertosExatos: 9, acertosSituacao: 10, maiorSequencia: 3 },
        ]
    },
    {
        id: 'user_11',
        nome: 'Admin Geral',
        apelido: 'Admin',
        email: 'admin@futbolao.pro',
        fotoPerfil: 'https://picsum.photos/id/500/100/100',
        status: 'ativo',
        funcao: 'admin',
        pontos: 0,
        exatos: 0,
        situacoes: 0,
        tempoMedio: 0,
        dataCadastro: subDays(now, 1000).toISOString(),
        ultimaAtividade: new Date().toISOString(),
        ultimoLogin: new Date().toISOString(),
        ultimoPalpite: { matchId: '', palpite: '' },
        presenceStatus: 'Ocupado',
        titulos: 0,
        totalJogos: 0,
        championshipStats: [],
    },
];

export const mockUser = mockUsers[0];

export const mockMatches: { upcoming: Match[], recent: Match[] } = {
    upcoming: [
        { id: 'match_1', campeonato: 'Brasileirão 2024', campeonatoId: 'champ_1', timeA: 'Flamengo', timeB: 'Palmeiras', data: addDays(now, 1).toISOString(), status: 'Agendado', fase: 'Rodada 15' },
        { id: 'match_2', campeonato: 'Brasileirão 2024', campeonatoId: 'champ_1', timeA: 'Corinthians', timeB: 'São Paulo', data: addDays(now, 2).toISOString(), status: 'Agendado', fase: 'Rodada 15' },
        { id: 'match_3', campeonato: 'Brasileirão 2024', campeonatoId: 'champ_1', timeA: 'Vasco da Gama', timeB: 'Botafogo', data: addDays(now, 2).toISOString(), status: 'Agendado', fase: 'Rodada 15' },
        { id: 'match_4', campeonato: 'Copa do Brasil 2024', campeonatoId: 'champ_2', timeA: 'Grêmio', timeB: 'Internacional', data: addDays(now, 0).toISOString(), status: 'Ao Vivo', placarA: 1, placarB: 1, fase: 'Oitavas de Final' },
        { id: 'match_5', campeonato: 'Copa do Brasil 2024', campeonatoId: 'champ_2', timeA: 'Santos', timeB: 'Fluminense', data: addDays(now, 3).toISOString(), status: 'Agendado', fase: 'Oitavas de Final' },
    ],
    recent: [
        { id: 'match_6', campeonato: 'Brasileirão 2024', campeonatoId: 'champ_1', timeA: 'Flamengo', timeB: 'Vasco da Gama', placarA: 2, placarB: 0, data: subDays(now, 1).toISOString(), status: 'Finalizado', fase: 'Rodada 14', maxPontos: 10 },
        { id: 'match_7', campeonato: 'Brasileirão 2024', campeonatoId: 'champ_1', timeA: 'Palmeiras', timeB: 'São Paulo', placarA: 1, placarB: 1, data: subDays(now, 2).toISOString(), status: 'Finalizado', fase: 'Rodada 14', maxPontos: 10 },
        { id: 'match_8', campeonato: 'Copa do Brasil 2024', campeonatoId: 'champ_2', timeA: 'Corinthians', timeB: 'Botafogo', placarA: 0, placarB: 1, data: subDays(now, 5).toISOString(), status: 'Finalizado', fase: 'Oitavas de Final (Ida)', maxPontos: 12 },
    ]
};

export const mockAllMatches = [...mockMatches.upcoming, ...mockMatches.recent];

export const mockPredictions: Prediction[] = [
    { 
        matchId: 'match_1', 
        userId: 'user_1', 
        palpiteUsuario: { placarA: 2, placarB: 1 }, 
        pontos: 0, 
        outrosPalpites: [] 
    },
    { 
        matchId: 'match_6', 
        userId: 'user_1',
        palpiteUsuario: { placarA: 2, placarB: 0 },
        pontos: 10,
        outrosPalpites: [
            { userId: 'user_2', apelido: 'A Estrategista', palpite: '1-0', pontos: 5 },
            { userId: 'user_3', apelido: 'Pé Quente', palpite: '3-1', pontos: 5 },
            { userId: 'user_4', apelido: 'A Vidente', palpite: '1-1', pontos: 0 },
        ]
    },
    { 
        matchId: 'match_7', 
        userId: 'user_1',
        palpiteUsuario: { placarA: 2, placarB: 1 },
        pontos: 0,
        outrosPalpites: [
             { userId: 'user_2', apelido: 'A Estrategista', palpite: '1-1', pontos: 10 },
             { userId: 'user_3', apelido: 'Pé Quente', palpite: '0-0', pontos: 5 },
        ]
    },
    { 
        matchId: 'match_8', 
        userId: 'user_1',
        palpiteUsuario: { placarA: 1, placarB: 1 },
        pontos: 0,
        outrosPalpites: [
             { userId: 'user_2', apelido: 'A Estrategista', palpite: '0-1', pontos: 12 },
             { userId: 'user_3', apelido: 'Pé Quente', palpite: '1-2', pontos: 6 },
        ]
    }
];

// Função para gerar um hash simples de uma string
const simpleHash = (str: string) => {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
        const char = str.charCodeAt(i);
        hash = (hash << 5) - hash + char;
        hash |= 0; // Converte para 32bit integer
    }
    return Math.abs(hash);
};


// Adiciona palpites para outros usuários para ter mais dados
mockAllMatches.forEach(match => {
    mockUsers.forEach(user => {
        // Se o usuário for o mockUser principal e já tiver palpite, pula
        if (user.id === mockUser.id && mockPredictions.some(p => p.userId === user.id && p.matchId === match.id)) {
            return;
        }
        // Se já existir palpite para este user/match, pula
        if (mockPredictions.some(p => p.userId === user.id && p.matchId === match.id)) {
             return;
        }

        // Gera placares determinísticos baseados nos IDs
        const palpiteA = (simpleHash(user.id) + simpleHash(match.id)) % 5; // Gera placar de 0 a 4
        const palpiteB = (simpleHash(user.id) + simpleHash(match.id) + 1) % 4; // Gera placar de 0 a 3

        let pontos = 0;
        
        if (match.status === 'Finalizado' && match.placarA !== null && match.placarB !== null && typeof match.placarA !== 'undefined' && typeof match.placarB !== 'undefined') {
            if (palpiteA === match.placarA && palpiteB === match.placarB) {
                pontos = match.maxPontos || 10;
            } else {
                const vencedorReal = match.placarA > match.placarB ? 'A' : match.placarA < match.placarB ? 'B' : 'E';
                const vencedorPalpite = palpiteA > palpiteB ? 'A' : palpiteA < palpiteB ? 'B' : 'E';
                if (vencedorReal === vencedorPalpite) {
                    pontos = (match.maxPontos || 10) / 2;
                }
            }
        }
        
        const outrosPalpites = mockUsers
            .filter(u => u.id !== user.id && u.funcao === 'usuario')
            .slice(0, 5)
            .map(u => {
                const outroPalpiteA = (simpleHash(u.id) + simpleHash(match.id)) % 5;
                const outroPalpiteB = (simpleHash(u.id) + simpleHash(match.id) + 1) % 4;
                let outrosPontos = 0;
                if (match.status === 'Finalizado' && match.placarA !== null && match.placarB !== null && typeof match.placarA !== 'undefined' && typeof match.placarB !== 'undefined') {
                    if (outroPalpiteA === match.placarA && outroPalpiteB === match.placarB) {
                        outrosPontos = match.maxPontos || 10;
                    } else {
                        const vencedorReal = match.placarA > match.placarB ? 'A' : match.placarA < match.placarB ? 'B' : 'E';
                        const vencedorPalpite = outroPalpiteA > outroPalpiteB ? 'A' : outroPalpiteA < outroPalpiteB ? 'B' : 'E';
                        if (vencedorReal === vencedorPalpite) {
                            outrosPontos = (match.maxPontos || 10) / 2;
                        }
                    }
                }
                return {
                    userId: u.id,
                    apelido: u.apelido,
                    palpite: `${outroPalpiteA} - ${outroPalpiteB}`,
                    pontos: outrosPontos
                }
            });

        mockPredictions.push({
            matchId: match.id,
            userId: user.id,
            palpiteUsuario: { placarA: palpiteA, placarB: palpiteB },
            pontos: pontos,
            outrosPalpites: outrosPalpites
        });
    });
});


export const mockTeams: Team[] = [
  { id: '17', name: 'Grêmio', crestUrl: 'https://crests.football-data.org/17.svg', type: 'club' },
  { id: '18', name: 'Internacional', crestUrl: 'https://crests.football-data.org/18.svg', type: 'club' },
  { id: '38', name: 'Santos FC', crestUrl: 'https://crests.football-data.org/38.svg', type: 'club' },
  { id: '64', name: 'Fluminense FC', crestUrl: 'https://crests.football-data.org/64.svg', type: 'club' },
  { id: '65', name: 'Corinthians', crestUrl: 'https://crests.football-data.org/65.svg', type: 'club' },
  { id: '66', name: 'São Paulo FC', crestUrl: 'https://crests.football-data.org/66.svg', type: 'club' },
  { id: '67', name: 'Palmeiras', crestUrl: 'https://crests.football-data.org/67.svg', type: 'club' },
  { id: '108', name: 'CR Vasco da Gama', crestUrl: 'https://crests.football-data.org/108.svg', type: 'club' },
  { id: '110', name: 'Botafogo FR', crestUrl: 'https://crests.football-data.org/110.svg', type: 'club' },
  { id: '111', name: 'CR Flamengo', crestUrl: 'https://crests.football-data.org/111.svg', type: 'club' },
  { id: '131', name: 'Atlético Mineiro', crestUrl: 'https://crests.football-data.org/131.svg', type: 'club' },
  { id: '764', name: 'Brazil', crestUrl: 'https://crests.football-data.org/764.svg', type: 'national' },
  { id: '773', name: 'Argentina', crestUrl: 'https://crests.football-data.org/773.svg', type: 'national' },
  { id: '784', name: 'Uruguay', crestUrl: 'https://crests.football-data.org/784.svg', type: 'national' },
  { id: '760', name: 'England', crestUrl: 'https://crests.football-data.org/760.svg', type: 'national' },
  { id: '782', name: 'Spain', crestUrl: 'https://crests.football-data.org/782.svg', type: 'national' },
  { id: '788', name: 'Germany', crestUrl: 'https://crests.football-data.org/788.svg', type: 'national' },
  { id: '792', name: 'France', crestUrl: 'https://crests.football-data.org/792.svg', type: 'national' },
  { id: '805', name: 'Italy', crestUrl: 'https://crests.football-data.org/805.svg', type: 'national' },
  { id: '770', name: 'Portugal', crestUrl: 'https://crests.football-data.org/770.svg', type: 'national' },
  { id: '794', name: 'Netherlands', crestUrl: 'https://crests.football-data.org/794.svg', type: 'national' },
];

export const mockChampionships: Championship[] = [
    {
        id: 'champ_1',
        nome: 'Brasileirão 2024',
        iconUrl: 'https://logodetimes.com/times/campeonato-brasileiro-serie-a/logo-campeonato-brasileiro-serie-a-2048.png',
        dataInicio: subDays(now, 30),
        dataFim: addDays(now, 60),
        tipoCampeonato: 'liga',
        modoEquipes: 'times',
        teamIds: ['17', '18', '38', '64', '65', '66', '67', '108', '110', '111', '131'],
        participantes: mockUsers.map(u => u.id),
        status: 'ativo',
        rodadas: 38,
        pontuacao: {
            tradicional: { ativo: true, exato: 10, situacao: 5 },
        },
        banner: { ativo: true, campeonatoLogoUrl: 'https://upload.wikimedia.org/wikipedia/pt/4/42/Campeonato_Brasileiro_S%C3%A9rie_A_logo.png' },
        championPredictionSettings: {
            active: true,
            numberOfPicks: 3,
        }
    },
    {
        id: 'champ_2',
        nome: 'Copa do Brasil 2024',
        iconUrl: 'https://www.ogol.com.br/img/logos/edicoes/180181_imgbank_.png',
        dataInicio: subDays(now, 10),
        dataFim: addDays(now, 45),
        tipoCampeonato: 'copa',
        modoEquipes: 'times',
        teamIds: ['17', '18', '38', '64', '65', '66', '67', '108', '110', '111', '131'],
        participantes: mockUsers.map(u => u.id),
        status: 'ativo',
        formatoFases: 'fases',
        fases: [
            { nome: 'Oitavas de Final', idaEVolta: true },
            { nome: 'Quartas de Final', idaEVolta: true },
            { nome: 'Semifinal', idaEVolta: true },
            { nome: 'Final', idaEVolta: false },
        ],
        pontuacao: {
            tradicional: { ativo: true, exato: 12, situacao: 6 },
        },
        banner: { ativo: false },
        championPredictionSettings: {
            active: false,
            numberOfPicks: 1,
        }
    },
    {
        id: 'champ_3',
        nome: 'Copa América 2024',
        iconUrl: 'https://upload.wikimedia.org/wikipedia/pt/thumb/9/95/Copa_Am%C3%A9rica_2024_Logo.svg/1200px-Copa_Am%C3%A9rica_2024_Logo.svg.png',
        dataInicio: addDays(now, 10),
        dataFim: addDays(now, 40),
        tipoCampeonato: 'copa',
        modoEquipes: 'selecao',
        teamIds: ['764', '773', '784'],
        participantes: mockUsers.map(u => u.id),
        status: 'ativo',
        formatoFases: 'fases',
        fases: [
            { nome: 'Fase de Grupos', idaEVolta: false, rodadas: 3 },
            { nome: 'Quartas de Final', idaEVolta: false },
            { nome: 'Semifinal', idaEVolta: false },
            { nome: 'Final', idaEVolta: false },
        ],
        pontuacao: {
            tradicional: { ativo: true, exato: 15, situacao: 7 },
        },
        banner: { ativo: true },
        championPredictionSettings: {
            active: true,
            numberOfPicks: 2,
        },
        finalRanking: {
          pos1: 'Brazil',
          pos2: 'Argentina',
        }
    },
    {
        id: 'champ_4',
        nome: 'Campeonato Arquivado',
        dataInicio: subDays(now, 100),
        dataFim: subDays(now, 50),
        tipoCampeonato: 'liga',
        modoEquipes: 'times',
        teamIds: ['17', '18', '38'],
        participantes: mockUsers.map(u => u.id),
        status: 'arquivado',
        rodadas: 10,
        pontuacao: {
            tradicional: { ativo: true, exato: 10, situacao: 5 },
        },
        banner: { ativo: false },
    }
];

export const mockLogs: Log[] = [
    { id: 'log_1', timestamp: new Date(Date.now() - 3600000).toISOString(), actor: { id: 'user_1', apelido: 'O Profeta', type: 'user' }, action: 'login', details: 'Login bem-sucedido via e-mail.' },
    { id: 'log_2', timestamp: new Date(Date.now() - 7200000).toISOString(), actor: { id: 'user_11', apelido: 'Admin', type: 'admin' }, action: 'user_management', details: 'Bloqueou o usuário O Corneta (user_5).' },
    { id: 'log_3', timestamp: new Date(Date.now() - 10800000).toISOString(), actor: { id: 'user_2', apelido: 'A Estrategista', type: 'user' }, action: 'prediction_update', details: 'Alterou o palpite para Flamengo vs Palmeiras.' },
    { id: 'log_4', timestamp: new Date(Date.now() - 86400000).toISOString(), actor: { id: 'user_6', apelido: 'A Analista', type: 'moderator' }, action: 'championship_create', details: 'Criou o campeonato "Copa do Brasil 2024".' },
    { id: 'log_5', timestamp: new Date(Date.now() - 172800000).toISOString(), actor: { id: 'user_3', apelido: 'Pé Quente', type: 'user' }, action: 'profile_update', details: 'Atualizou a foto de perfil.' },
     { id: 'log_6', timestamp: new Date(Date.now() - 182800000).toISOString(), actor: { id: 'user_11', apelido: 'Admin', type: 'admin' }, action: 'emergency_message', details: { title: 'Manutenção Programada', message: 'O sistema ficará offline por 30 minutos hoje à noite.', target: 'Todos os Usuários' } },
     { id: 'log_7', timestamp: new Date(Date.now() - 192800000).toISOString(), actor: { id: 'user_11', apelido: 'Sistema (IA)', type: 'admin' }, action: 'ai_notification', details: { title: 'Parabéns, craque!', message: 'Você mandou bem no jogo do Flamengo vs Vasco da Gama e ganhou 10 pontos!', target: 'O Profeta' } },
];


export const mockNotifications: Notification[] = [
    { id: 'notif_1', title: 'Seu palpite foi salvo!', message: 'Seu palpite para Flamengo vs Palmeiras foi registrado com sucesso. Boa sorte!', read: false, createdAt: new Date(Date.now() - 60000), href: '/dashboard/predictions' },
    { id: 'notif_2', title: 'Você subiu no ranking!', message: 'Parabéns! Você ganhou 10 pontos na última rodada e agora está em 1º lugar.', read: false, createdAt: new Date(Date.now() - 3600000), href: '/dashboard/leaderboard' },
    { id: 'notif_3', title: 'Alerta de Início', message: 'A partida Corinthians vs São Paulo começa em 2 horas! Não se esqueça de palpitar.', read: true, createdAt: new Date(Date.now() - 86400000), href: '/dashboard/predictions' },
    { id: 'notif_4', title: 'Novo Campeonato Disponível', message: 'A Copa América 2024 foi aberta para palpites. Participe agora!', read: true, createdAt: new Date(Date.now() - 172800000), href: '/dashboard/predictions' },
    { id: 'notif_5', title: 'Você caiu no ranking', message: 'Ih, deu ruim. Você zerou na rodada e caiu para a 3ª posição.', read: true, createdAt: new Date(Date.now() - 259200000), href: '/dashboard/leaderboard' },
];

export const mockEmergencyMessage = {
    id: 'msg_1',
    active: false,
    title: 'Manutenção Programada',
    message: 'O FutBolão Pro ficará offline para uma manutenção programada hoje, das 23:00 às 23:30. Agradecemos a compreensão.',
    targetUserIds: ['all'],
    type: 'urgent' as 'urgent' | 'normal',
};

export const mockHallOfFame: HallOfFameBanner[] = [
     {
        id: 'hof_champ_1',
        campeonatoLogoUrl: 'https://www.ogol.com.br/img/logos/edicoes/129979_imgbank_.png',
        campeonatoNome: 'Brasileirão 2023',
        campeaoGeralNome: 'O Profeta',
        campeaoGeralAvatarUrl: 'https://picsum.photos/id/1005/128/128',
        modoEquipes: 'times',
        palpiteiroNome: 'A Estrategista',
        palpiteiroAvatarUrl: 'https://picsum.photos/id/1011/128/128',
        displayMode: 'photo_and_names',
    },
    {
        id: 'hof_champ_2',
        campeonatoLogoUrl: 'https://upload.wikimedia.org/wikipedia/pt/f/f3/Copa_do_Mundo_FIFA_2022.png',
        campeonatoNome: 'Copa do Mundo 2022',
        campeaoGeralNome: 'A Analista, Beto Mod',
        campeaoGeralAvatarUrl: 'https://picsum.photos/id/1062/128/128',
        modoEquipes: 'selecao',
        palpiteiroNome: 'O Profeta, A Vidente, Pé Quente',
        palpiteiroAvatarUrl: 'https://picsum.photos/id/1005/128/128',
        displayMode: 'names_only'
    }
]
