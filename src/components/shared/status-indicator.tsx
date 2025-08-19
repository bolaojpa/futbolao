

"use client";

import type { UserType } from '@/lib/data';
import { cn } from '@/lib/utils';
import { Tooltip, TooltipContent, TooltipTrigger, TooltipProvider } from '@/components/ui/tooltip';

interface StatusIndicatorProps {
    status: UserType['presenceStatus'];
    className?: string;
}

export const StatusIndicator = ({ status, className }: StatusIndicatorProps) => {
    const statusConfig = {
        'Disponível': { color: 'bg-green-500', text: 'Disponível' },
        'Ausente': { color: 'bg-yellow-500', text: 'Ausente' },
        'Ocupado': { color: 'bg-red-500', text: 'Ocupado' },
        'Não perturbe': { color: 'bg-purple-500', text: 'Não perturbe' },
        'Offline': { color: 'bg-gray-500', text: 'Offline' },
    };

    const config = statusConfig[status] || statusConfig['Offline'];

    return (
        <TooltipProvider>
            <Tooltip>
                <TooltipTrigger asChild>
                    <div className={cn("absolute rounded-full border border-background", config.color, className)} />
                </TooltipTrigger>
                <TooltipContent>
                    <p>O usuário está {config.text.toLowerCase()}</p>
                </TooltipContent>
            </Tooltip>
        </TooltipProvider>
    );
};
