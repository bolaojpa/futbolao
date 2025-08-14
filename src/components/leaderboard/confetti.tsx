"use client";

import React, { useEffect, useState } from 'react';
import { cn } from '@/lib/utils';

const ConfettiPiece = ({ id, style }: { id: number; style: React.CSSProperties }) => (
  <div
    key={id}
    className={cn(
      "absolute w-2 h-4 rounded-sm",
      id % 3 === 0 ? 'bg-primary' : id % 3 === 1 ? 'bg-accent' : 'bg-yellow-400'
    )}
    style={style}
  />
);

export function Confetti() {
  const [pieces, setPieces] = useState<Array<{ id: number; style: React.CSSProperties }>>([]);

  useEffect(() => {
    const newPieces = Array.from({ length: 150 }, (_, i) => {
      const style: React.CSSProperties = {
        left: `${Math.random() * 100}%`,
        top: `${-20 - Math.random() * 100}%`,
        transform: `rotate(${Math.random() * 360}deg)`,
        animation: `fall ${4 + Math.random() * 6}s linear ${Math.random() * 2}s forwards`,
      };
      return { id: i, style };
    });

    setPieces(newPieces);

    const styleSheet = document.createElement("style");
    styleSheet.innerHTML = `
      @keyframes fall {
        to {
          top: 120%;
          transform: rotate(${Math.random() * 720}deg);
        }
      }
    `;
    document.head.appendChild(styleSheet);
    
    return () => {
      document.head.removeChild(styleSheet);
    };

  }, []);

  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none z-50">
      {pieces.map(p => <ConfettiPiece key={p.id} {...p} />)}
    </div>
  );
}
