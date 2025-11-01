
"use client";

import { useState, useEffect } from 'react';
import { parseISO, differenceInSeconds } from 'date-fns';

interface CountdownProps {
    targetDate: string;
    prefix?: string;
}

export function Countdown({ targetDate, prefix = "Fecha em: " }: CountdownProps) {
    const [isClient, setIsClient] = useState(false);

    useEffect(() => {
        setIsClient(true);
    }, []);

    const calculateTimeLeft = () => {
        const target = parseISO(targetDate);
        const now = new Date();
        const difference = differenceInSeconds(target, now);

        if (difference <= 0) {
            return { hours: 0, minutes: 0, seconds: 0 };
        }

        const hours = Math.floor(difference / 3600);
        const minutes = Math.floor((difference % 3600) / 60);
        const seconds = difference % 60;

        return { hours, minutes, seconds };
    };

    const [timeLeft, setTimeLeft] = useState(calculateTimeLeft);

    useEffect(() => {
        if (!isClient) return;

        const timer = setTimeout(() => {
            setTimeLeft(calculateTimeLeft());
        }, 1000);

        return () => clearTimeout(timer);
    }, [isClient, timeLeft, targetDate]);

    if (!isClient) {
        return <span>Carregando...</span>
    }

    const formatTime = (time: number) => time.toString().padStart(2, '0');

    return (
        <span>
            {prefix}{formatTime(timeLeft.hours)}:{formatTime(timeLeft.minutes)}:{formatTime(timeLeft.seconds)}
        </span>
    );
}
