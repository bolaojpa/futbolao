'use server';

import * as fs from 'fs/promises';
import * as path from 'path';

/**
 * Saves the PWA icon files to the public directory.
 * @param dataUrl - The base64 data URL of the cropped image.
 * @returns An object indicating success or failure.
 */
export async function savePwaIcon(dataUrl: string): Promise<{ success: boolean; error?: string }> {
  if (!dataUrl.startsWith('data:image/png;base64,')) {
    return { success: false, error: 'Formato de imagem inválido. Apenas PNG é suportado.' };
  }

  try {
    const base64Data = dataUrl.replace(/^data:image\/png;base64,/, "");
    const buffer = Buffer.from(base64Data, 'base64');
    
    // Define os tamanhos e nomes de arquivo necessários para o manifest.json
    const iconSizes = [
      { name: 'logo-72x72.png', size: 72 },
      { name: 'logo-96x96.png', size: 96 },
      { name: 'logo-128x128.png', size: 128 },
      { name: 'logo-144x144.png', size: 144 },
      { name: 'logo-152x152.png', size: 152 },
      { name: 'logo-192x192.png', size: 192 },
      { name: 'logo-384x384.png', size: 384 },
      { name: 'logo-512x512.png', size: 512 },
    ];
    
    // O sharp não é suportado no ambiente de build, então vamos salvar o mesmo ícone com nomes diferentes.
    // Em um ambiente com suporte, redimensionaríamos a imagem para cada tamanho.
    for (const icon of iconSizes) {
      const filePath = path.join(process.cwd(), 'public', icon.name);
      await fs.writeFile(filePath, buffer);
    }
    
    return { success: true };

  } catch (error) {
    console.error("Error saving PWA icon:", error);
    return { success: false, error: "Não foi possível salvar o ícone do PWA no servidor." };
  }
}
