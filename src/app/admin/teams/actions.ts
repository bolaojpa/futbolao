
'use server';

interface TeamFromApi {
    id: number;
    name: string;
    crestUrl: string;
}

interface ApiResponse {
    teams: TeamFromApi[];
}

export async function fetchTeamsFromApi(competitionCode: string): Promise<{ teams?: TeamFromApi[], error?: string }> {
    const API_KEY = '4d0de3bcc1d64cf2bc0f464545b4eaef';
    const API_URL = `https://api.football-data.org/v4/competitions/${competitionCode}/teams`;

    try {
        const response = await fetch(API_URL, {
            headers: {
                'X-Auth-Token': API_KEY,
            },
        });

        if (!response.ok) {
            const errorData = await response.json();
            console.error('API Error:', errorData);
            throw new Error(errorData.message || `Erro na API: ${response.statusText}`);
        }

        const data: ApiResponse = await response.json();
        
        // football-data.org às vezes retorna 'crest' e outras vezes 'crestUrl'
        const teams = data.teams.map((team: any) => ({
            id: team.id,
            name: team.name,
            crestUrl: team.crest || team.crestUrl,
        }));

        return { teams };

    } catch (error) {
        console.error('Failed to fetch teams:', error);
        if (error instanceof Error) {
            return { error: error.message };
        }
        return { error: 'Ocorreu um erro desconhecido ao buscar as equipes.' };
    }
}
