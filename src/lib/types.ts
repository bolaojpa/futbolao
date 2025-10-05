

import { Timestamp } from 'firebase/firestore';
import { z } from 'zod';

export type TiebreakerRule = 'maiorNumeroExatos' | 'maiorNumeroSituacoes' | 'primeiraBucha';

export interface UserType {
    id: string;
    nome: string;
    apelido: string;
    email: string;
    fotoPerfil: string;
    urlImagemPersonalizada?: string;
    providerId?: string; // Novo campo
    status: 'ativo' | 'pendente' | 'bloqueado';
    funcao: 'usuario' | 'moderador' | 'admin';
    isGhost?: boolean;
    posicaoVariacao?: 'up' | 'down' | 'stable';
    dataCadastro: string | Timestamp;
    ultimaAtividade: string | Timestamp;
    ultimoLogin: string | Timestamp;
    presenceStatus: 'Disponível' | 'Ausente' | 'Ocupado' | 'Não perturbe' | 'Offline';
    ultimoPalpite?: { matchId: string; palpite: string } | null;
    titulos?: number;
    totalJogos?: number;
    timeCoracao?: string;
    championPicks?: { championshipId: string, teams: string[] }[];
    championshipStats?: {
        championshipId: string;
        pontos: number;
        acertosExatos: number;
        acertosSituacao: number;
        maiorSequencia: number;
    }[];
    seenUrgentMessages?: string[]; // Campo para rastrear mensagens urgentes vistas
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
    createdAt?: Timestamp;
    predictionsLocked?: boolean;
}

export interface Prediction {
    id?: string; // O ID do documento no Firestore
    matchId: string;
    userId: string;
    palpiteUsuario: {
      placarA: number | null;
      placarB: number | null;
    };
    palpiteCombo?: { // Palpite para o sistema de combo de gols
      totalGols: number;
    } | null;
    pontos: number;
    acertoTipo?: 'combo' | 'bucha' | 'bonus' | 'situacao' | 'gols' | 'erro';
    createdAt: Timestamp;
    updatedAt: Timestamp;
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
    incluirFantasma: boolean; // Novo campo
    status: 'ativo' | 'arquivado';
    formatoFases?: 'fases' | 'rodadas';
    fases?: { nome: string; idaEVolta: boolean; rodadas?: number }[];
    rodadas?: number;
    regrasDesempate?: TiebreakerRule[];
    pontuacao: {
        tradicional: { ativo: boolean; exato: number; situacao: number; };
        combo: {
            ativo: boolean;
            bonusPlacarExatoGols: number;
            pontosGols: number;
            cotasPorFase: { fase: string; quantidade: number }[];
        };
    };
    predictionAssist?: {
        active: boolean;
    };
    banner: {
        ativo: boolean;
        campeonatoLogoUrl?: string;
        backgroundUrl?: string;
        displayMode?: 'photo_and_names' | 'names_only';
        titleColor?: string;
        subtitleColor?: string;
        namesColor?: string;
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
    createdAt?: Timestamp;
}

export interface Team {
    id: string;
    name: string;
    crestUrl: string;
    type: 'club' | 'national';
    countryOrConfederation?: string;
    league?: string;
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
    userId: string;
    title: string;
    message: string;
    read: boolean;
    createdAt: Date | Timestamp;
    href?: string;
    type: 'normal' | 'urgent';
    originalMessage?: EmergencyMessage; // Guarda o conteúdo completo da mensagem urgente
    readAt?: Date | Timestamp; // Novo campo para data de leitura
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

export interface SupportReply {
    id: string;
    authorId: string;
    authorName: string;
    message: string;
    createdAt: Timestamp;
    readAt?: Timestamp; // Data de leitura da resposta pelo usuário
}

export interface SupportMessage {
  id: string;
  userId: string;
  userApelido: string;
  userFoto: string;
  message: string;
  isReadByAdmin: boolean;
  hasUnreadAdminReply: boolean;
  createdAt: Timestamp;
  replies?: SupportReply[];
  isArchived?: boolean;
  lastActivityAt?: Timestamp;
  readAt?: Timestamp; // Data de leitura da mensagem do usuário pelo admin
}

// Tipo para a entrada da função de sugestão de IA
export type SuggestPredictionsInput = z.infer<typeof SuggestPredictionsInputSchema>;
const SuggestPredictionsInputSchema = z.object({
  userNickname: z.string().describe("O apelido do usuário que está pedindo a sugestão."),
  userPosition: z.number().describe("A posição atual do usuário no ranking do campeonato."),
  totalParticipants: z.number().describe("O número total de participantes no campeonato."),
  currentUserMatches: z.number().describe("O número de partidas que o usuário já disputou/palpitou neste campeonato."),
  totalUserMatches: z.number().describe("O número total de partidas que o usuário disputará no campeonato."),
  predictionData: z
    .array(z.object({
      prediction: z.string().describe('O placar apostado, no formato "X-Y".'),
      count: z.number().describe('O número de usuários que apostaram neste placar.'),
    }))
    .describe('Uma lista de palpites agregados de outros usuários para a partida.'),
});
