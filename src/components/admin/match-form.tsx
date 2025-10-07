
"use client";

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/components/ui/popover"
import { Calendar } from '../ui/calendar';
import { CalendarIcon, Save, Loader2, Lock, LockOpen } from 'lucide-react';
import { cn } from '@/lib/utils';
import { format, parseISO, setHours, setMinutes, isPast } from 'date-fns';
import type { Match, Team, Championship } from '@/lib/types';
import { useEffect, useMemo, useState } from 'react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { Combobox } from '../ui/combobox';
import { useToast } from '@/hooks/use-toast';
import { addMatch, updateMatch, addLog } from '@/lib/firebase/firestore';
import { useAuth } from '@/hooks/use-auth';
import { Switch } from '../ui/switch';


const matchFormSchema = z.object({
  timeA: z.string().min(1, { message: "É obrigatório selecionar o Time A." }),
  timeB: z.string().min(1, { message: "É obrigatório selecionar o Time B." }),
  fase: z.string({ required_error: "É obrigatório selecionar uma fase ou rodada."}).min(1, { message: "É obrigatório selecionar uma fase ou rodada." }),
  data: z.date({ required_error: "A data da partida é obrigatória." }),
  horario: z.string({ required_error: "O horário da partida é obrigatório." }).regex(/^([01]\d|2[0-3]):([0-5]\d)$/, "Formato de hora inválido."),
  predictionsLocked: z.boolean().default(false),
}).refine(data => data.timeA !== data.timeB, {
    message: "Os times A e B não podem ser iguais.",
    path: ["timeB"],
});

type MatchFormValues = z.infer<typeof matchFormSchema>;

interface MatchFormProps {
    isOpen: boolean;
    setIsOpen: (open: boolean) => void;
    onSubmitSuccess: () => void;
    match: Match | null;
    championshipId: string;
    championships: Championship[];
    teams: Team[];
}


export function MatchForm({ isOpen, setIsOpen, onSubmitSuccess, match, championshipId, championships, teams }: MatchFormProps) {
    const { toast } = useToast();
    const { user: adminUser } = useAuth();
    const [isLoading, setIsLoading] = useState(false);

    const form = useForm<MatchFormValues>({
        resolver: zodResolver(matchFormSchema),
        defaultValues: {
            timeA: '',
            timeB: '',
            fase: '',
            horario: '16:00',
            predictionsLocked: false,
        },
    });

    const selectedChampionship = useMemo(() => {
        return championships.find(c => c.id === championshipId);
    }, [championshipId, championships]);

    const availablePhases = useMemo(() => {
        if (!selectedChampionship) return [];

        if (selectedChampionship.fases && selectedChampionship.fases.length > 0) {
            return selectedChampionship.fases.map(f => f.nome);
        }
        
        if (selectedChampionship.rodadas) {
             return Array.from({ length: selectedChampionship.rodadas }, (_, i) => `Rodada ${i + 1}`);
        }

        return [];
    }, [selectedChampionship]);

    const teamOptions = useMemo(() => {
        if (!selectedChampionship || !selectedChampionship.teamIds) return [];
        
        const participatingTeams: Team[] = selectedChampionship.teamIds
            .map(id => teams.find(team => team.id === id))
            .filter((team): team is Team => !!team);

        return participatingTeams.map(team => ({ label: team.name, value: team.name }));
    }, [selectedChampionship, teams]);


    useEffect(() => {
        if (isOpen) {
            if (match) {
                const matchDate = parseISO(match.data);
                form.reset({
                    timeA: match.timeA,
                    timeB: match.timeB,
                    fase: match.fase,
                    data: matchDate,
                    horario: format(matchDate, 'HH:mm'),
                    predictionsLocked: match.predictionsLocked || isPast(matchDate),
                });
            } else {
                form.reset({
                    timeA: '',
                    timeB: '',
                    fase: '',
                    data: undefined,
                    horario: '16:00',
                    predictionsLocked: false,
                });
            }
        }
    }, [isOpen, match, form]);

    const handleFormSubmit = async (data: MatchFormValues) => {
        setIsLoading(true);
        const [hours, minutes] = data.horario.split(':').map(Number);
        const combinedDate = setMinutes(setHours(data.data, hours), minutes);

        if (!selectedChampionship) return;

        let maxScore = 0;
        if (selectedChampionship.pontuacao.tradicional.ativo) {
            maxScore += selectedChampionship.pontuacao.tradicional.exato;
        }
        if (selectedChampionship.pontuacao.combo?.ativo) {
            maxScore += (selectedChampionship.pontuacao.combo.bonusPlacarExatoGols ?? 0) + (selectedChampionship.pontuacao.combo.pontosGols ?? 0);
        }
        
        const matchData: Partial<Omit<Match, 'id'>> = {
            timeA: data.timeA,
            timeB: data.timeB,
            fase: data.fase,
            data: combinedDate.toISOString(),
            status: 'Agendado',
            campeonato: selectedChampionship.nome,
            campeonatoId: selectedChampionship.id,
            maxPontos: maxScore,
            predictionsLocked: data.predictionsLocked,
        };

        try {
            const actionText = match ? 'editou' : 'criou';
            const logDetails = `O admin ${actionText} a partida: ${data.timeA} vs ${data.timeB} para a fase "${data.fase}" do campeonato "${selectedChampionship.nome}".`;

            if (match) {
                await updateMatch(match.id, matchData);
                toast({ title: "Partida Atualizada!", description: `A partida ${data.timeA} vs ${data.timeB} foi atualizada.` });
            } else {
                await addMatch(matchData as Omit<Match, 'id'>);
                toast({ title: "Partida Criada!", description: `A partida ${data.timeA} vs ${data.timeB} foi adicionada.` });
            }

            if (adminUser) {
                await addLog({
                    action: 'match_update',
                    actor: { id: adminUser.id, apelido: adminUser.apelido, funcao: adminUser.funcao },
                    details: logDetails,
                });
            }
            onSubmitSuccess();
        } catch (error) {
            toast({ title: "Erro ao salvar partida", variant: 'destructive' });
        } finally {
            setIsLoading(false);
        }
    };

    const title = match ? "Editar Partida" : "Adicionar Nova Partida";
    const description = match ? "Altere os dados da partida existente." : "Preencha as informações para adicionar uma nova partida ao campeonato.";
    const buttonText = match ? "Salvar Alterações" : "Adicionar Partida";

    return (
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
            <DialogContent className="sm:max-w-xl">
                <DialogHeader>
                    <DialogTitle>{title}</DialogTitle>
                    <DialogDescription>{description}</DialogDescription>
                </DialogHeader>
                <Form {...form}>
                    <form onSubmit={form.handleSubmit(handleFormSubmit)} className="space-y-6 py-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <FormField
                                control={form.control}
                                name="timeA"
                                render={({ field }) => (
                                    <FormItem className="flex flex-col">
                                    <FormLabel>Time A</FormLabel>
                                    <Combobox
                                        options={teamOptions}
                                        value={field.value}
                                        onChange={field.onChange}
                                        placeholder="Selecione o time da casa"
                                        searchPlaceholder="Buscar time..."
                                        notFoundMessage="Nenhum time encontrado."
                                    />
                                    <FormMessage />
                                    </FormItem>
                                )}
                            />
                            <FormField
                                control={form.control}
                                name="timeB"
                                render={({ field }) => (
                                    <FormItem className="flex flex-col">
                                    <FormLabel>Time B</FormLabel>
                                     <Combobox
                                        options={teamOptions}
                                        value={field.value}
                                        onChange={field.onChange}
                                        placeholder="Selecione o time visitante"
                                        searchPlaceholder="Buscar time..."
                                        notFoundMessage="Nenhum time encontrado."
                                    />
                                    <FormMessage />
                                    </FormItem>
                                )}
                            />
                        </div>
                        <FormField
                            control={form.control}
                            name="fase"
                            render={({ field }) => (
                                <FormItem>
                                <FormLabel>Fase / Rodada</FormLabel>
                                <Select onValueChange={field.onChange} value={field.value} disabled={availablePhases.length === 0}>
                                        <FormControl>
                                            <SelectTrigger>
                                                <SelectValue placeholder={availablePhases.length > 0 ? "Selecione a fase ou rodada" : "Nenhuma fase configurada"} />
                                            </SelectTrigger>
                                        </FormControl>
                                        <SelectContent>
                                            {availablePhases.map(phase => (
                                                <SelectItem key={phase} value={phase}>{phase}</SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                <FormMessage />
                                </FormItem>
                            )}
                        />
                        <div className="flex flex-col sm:flex-row gap-4">
                            <FormField
                                control={form.control}
                                name="data"
                                render={({ field }) => (
                                    <FormItem className="flex flex-col flex-1">
                                    <FormLabel>Data da Partida</FormLabel>
                                    <Popover>
                                        <PopoverTrigger asChild>
                                        <FormControl>
                                            <Button
                                            variant={"outline"}
                                            className={cn(
                                                "pl-3 text-left font-normal",
                                                !field.value && "text-muted-foreground"
                                            )}
                                            >
                                            {field.value ? (
                                                format(field.value, "dd/MM/yyyy")
                                            ) : (
                                                <span>Escolha uma data</span>
                                            )}
                                            <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                                            </Button>
                                        </FormControl>
                                        </PopoverTrigger>
                                        <PopoverContent className="w-auto p-0" align="start">
                                            <Calendar
                                                mode="single"
                                                selected={field.value}
                                                onSelect={field.onChange}
                                                disabled={(date) => date < new Date("1900-01-01")}
                                                initialFocus
                                            />
                                        </PopoverContent>
                                    </Popover>
                                    <FormMessage />
                                    </FormItem>
                                )}
                            />
                            <FormField
                                control={form.control}
                                name="horario"
                                render={({ field }) => (
                                    <FormItem className="flex flex-col flex-1">
                                        <FormLabel>Horário da Partida</FormLabel>
                                        <FormControl>
                                            <Input type="time" {...field} />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                        </div>
                        {match && (
                            <FormField
                                control={form.control}
                                name="predictionsLocked"
                                render={({ field }) => (
                                    <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3 shadow-sm">
                                        <div className="space-y-0.5">
                                            <FormLabel className="text-base flex items-center gap-2">
                                                {field.value ? <Lock /> : <LockOpen />}
                                                Palpites Bloqueados
                                            </FormLabel>
                                            <p className="text-[0.8rem] text-muted-foreground">
                                                Se ativado, impede que usuários façam ou alterem palpites para esta partida.
                                            </p>
                                        </div>
                                        <FormControl>
                                            <Switch
                                                checked={field.value}
                                                onCheckedChange={field.onChange}
                                            />
                                        </FormControl>
                                    </FormItem>
                                )}
                            />
                        )}
                        <DialogFooter>
                            <Button type="button" variant="outline" onClick={() => setIsOpen(false)} disabled={isLoading}>Cancelar</Button>
                            <Button type="submit" disabled={isLoading}>
                                {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
                                {buttonText}
                            </Button>
                        </DialogFooter>
                    </form>
                </Form>
            </DialogContent>
        </Dialog>
    );
}
