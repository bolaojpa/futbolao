
import { Award, Crown, Star } from 'lucide-react';
import type React from 'react';
import { cn } from '@/lib/utils';
import { cva, type VariantProps } from 'class-variance-authority';

const honorificsVariants = cva(
    "absolute bottom-0 left-0 w-full h-1/4 flex items-center justify-center gap-0.5",
    {
        variants: {
            variant: {
                default: "",
                badge: "",
            },
        },
        defaultVariants: {
            variant: "default",
        },
    }
);

interface HonorificsProps extends VariantProps<typeof honorificsVariants> {
  count: number;
}

export const Honorifics = ({ count, variant }: HonorificsProps) => {
    if (count === 0) return null;

    let IconComponent: React.ComponentType<{ className?: string }>;
    let displayCount = 0;
    let iconClass = "text-yellow-400 fill-yellow-400 [filter:drop-shadow(0_1px_1px_rgba(0,0,0,0.7))]";
    
    // Os ícones devem ser dimensionados para preencher a altura do container (25% do avatar)
    let iconSize = "h-full w-auto"; 

    if (count >= 10) {
        IconComponent = Crown;
        displayCount = Math.min(count - 9, 3);
    } else if (count >= 7) {
        IconComponent = Award;
        displayCount = Math.min(count - 6, 3);
    } else if (count >= 4) {
        IconComponent = Award;
        displayCount = Math.min(count - 3, 3);
    } else { // 1-3
        IconComponent = Star; 
        displayCount = Math.min(count, 3);
    }
    
    const icons = Array.from({ length: displayCount }, (_, i) => (
        <IconComponent key={i} className={cn(iconClass, iconSize)} />
    ));

    return (
        <div className={cn(honorificsVariants({ variant }))}>
            {icons}
        </div>
    );
};
