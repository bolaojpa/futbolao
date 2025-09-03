
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
    id?: string; // O ID do documento no Firestore
    matchId: string;
    userId: string;
    palpiteUsuario: {
      placarA: number;
      placarB: number;
    };
    pontos: number;
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

export interface EmergencyMessage {
    id: string;
    active: boolean;
    title: string;
    message: string;
    targetUserIds: string[]; // 'all' ou IDs de usuários
    type: 'urgent' | 'normal';
}
