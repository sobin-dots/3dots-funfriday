'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Trophy, Users, Star, Coins, Gift } from 'lucide-react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

interface Member {
    id: string;
    name: string;
    team: string;
    points: number;
    quizScore: number;
    connected: boolean;
    wonItems: number[];
}

interface ScoreBoardProps {
    members: Record<string, Member>;
}

export default function ScoreBoard({ members }: ScoreBoardProps) {
    // Calculate team stats from members
    const teamMap: Record<string, { members: number; quizScore: number; pointsLeft: number; itemsWon: number }> = {};

    Object.values(members).forEach((m) => {
        if (!teamMap[m.team]) {
            teamMap[m.team] = { members: 0, quizScore: 0, pointsLeft: 0, itemsWon: 0 };
        }
        teamMap[m.team].members += 1;
        teamMap[m.team].quizScore += m.quizScore;
        teamMap[m.team].pointsLeft += m.points;
        teamMap[m.team].itemsWon += m.wonItems.length;
    });

    // Convert to array and sort by quizScore (descending), then pointsLeft (descending)
    const teams = Object.entries(teamMap)
        .map(([team, stats]) => ({ team, ...stats }))
        .sort((a, b) => b.quizScore - a.quizScore || b.pointsLeft - a.pointsLeft);

    if (teams.length === 0) {
        return (
            <Card className="border-amber-500/20 shadow-sm bg-card/50">
                <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-xl text-amber-500">
                        <Trophy className="w-5 h-5" /> Team scoreboard
                    </CardTitle>
                </CardHeader>
                <CardContent className="text-center py-10 text-muted-foreground">
                    No teams yet.
                </CardContent>
            </Card>
        );
    }

    return (
        <Card className="border-amber-500/20 shadow-sm bg-card/50 overflow-hidden">
            <CardHeader className="bg-amber-500/5 border-b border-amber-500/10">
                <CardTitle className="flex items-center gap-2 text-xl text-amber-500">
                    <Trophy className="w-5 h-5" /> Team scoreboard
                </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
                <Table>
                    <TableHeader className="bg-background/50">
                        <TableRow className="hover:bg-transparent border-border/50">
                            <TableHead className="w-16 text-center font-bold">#</TableHead>
                            <TableHead className="font-bold">Team</TableHead>
                            <TableHead className="text-center font-bold"><div className="flex items-center justify-center gap-1"><Users className="w-4 h-4" /> Members</div></TableHead>
                            <TableHead className="text-center font-bold"><div className="flex items-center justify-center gap-1"><Star className="w-4 h-4 text-amber-400" /> Quiz score</div></TableHead>
                            <TableHead className="text-center font-bold"><div className="flex items-center justify-center gap-1"><Coins className="w-4 h-4 text-indigo-400" /> Points left</div></TableHead>
                            <TableHead className="text-center font-bold"><div className="flex items-center justify-center gap-1"><Gift className="w-4 h-4 text-emerald-400" /> Items won</div></TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {teams.map((t, i) => (
                            <TableRow key={t.team} className="border-border/50 hover:bg-background/50 transition-colors">
                                <TableCell className="text-center font-bold text-muted-foreground">
                                    {i === 0 ? <span className="text-amber-400 text-lg"></span> : i === 1 ? <span className="text-slate-300 text-lg"></span> : i === 2 ? <span className="text-amber-700 text-lg"></span> : i + 1}
                                </TableCell>
                                <TableCell className="font-bold text-base">{t.team}</TableCell>
                                <TableCell className="text-center">{t.members}</TableCell>
                                <TableCell className="text-center font-bold text-amber-400 text-lg">{t.quizScore}</TableCell>
                                <TableCell className="text-center font-medium text-indigo-300">{t.pointsLeft}</TableCell>
                                <TableCell className="text-center font-medium text-emerald-400">{t.itemsWon}</TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </CardContent>
        </Card>
    );
}
