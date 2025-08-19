
"use client";

import { Sparkle } from "lucide-react";
import { cn } from "@/lib/utils";

// Função para gerar um número aleatório em um intervalo
const random = (min: number, max: number) => Math.floor(Math.random() * (max - min)) + min;

// Cria um array de estrelas com posições e delays aleatórios
const sparkles = Array.from({ length: 20 }).map((_, i) => {
    const angle = random(0, 360); // Direção aleatória
    const distance = random(50, 150); // Distância da explosão
    const delay = random(0, 200); // Atraso para um efeito mais natural

    // Coordenadas finais da estrela
    const x = Math.cos(angle * Math.PI / 180) * distance;
    const y = Math.sin(angle * Math.PI / 180) * distance;

    return {
        id: i,
        style: {
            '--tx-end': `${x}px`,
            '--ty-end': `${y}px`,
            animationDelay: `${delay}ms`,
        } as React.CSSProperties,
        className: i % 2 === 0 ? "text-primary" : "text-amber-400"
    }
});


export function SparkleAnimation() {
    return (
        <div className="absolute inset-0 pointer-events-none">
            {sparkles.map(sparkle => (
                <Sparkle
                    key={sparkle.id}
                    className={cn(
                        "absolute top-1/2 left-1/2 w-4 h-4 animate-sparkle-burst",
                        sparkle.className
                    )}
                    style={sparkle.style}
                />
            ))}
        </div>
    )
}
