
'use server';

import { generatePerformanceUpdate } from '@/ai/flows/generate-performance-update';
import { mockUser } from '@/lib/data';

export async function testPerformanceUpdate(): Promise<{
  title: string;
  message: string;
} | {
    error: string;
}> {
  try {
    // Simula um cenário onde o usuário subiu no ranking
    const mockPerformanceData = {
      apelido: mockUser.apelido,
      pontosGanhos: 25,
      posicaoAnterior: 5,
      novaPosicao: 3,
    };

    const result = await generatePerformanceUpdate(mockPerformanceData);
    
    // Em uma aplicação real, salvaríamos esta notificação no banco de dados do usuário.
    // Aqui, apenas retornamos para exibição no cliente.
    
    return {
      title: result.titulo,
      message: result.mensagem,
    };
  } catch (error) {
    console.error("Error testing performance update:", error);
    return { error: "Não foi possível gerar a notificação de teste da IA." };
  }
}
