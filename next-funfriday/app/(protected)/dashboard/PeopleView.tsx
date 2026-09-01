'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Users, UserMinus, Trash2, Circle } from 'lucide-react';
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

interface PeopleViewProps {
    members: Record<string, Member>;
    onKick?: (memberId: string) => void;
    onResetMembers?: () => void;
}

export default function PeopleView({ members, onKick, onResetMembers }: PeopleViewProps) {
    const memberList = Object.values(members).sort((a, b) => a.name.localeCompare(b.name));

    return (
        <Card className="border-emerald-500/20 shadow-sm bg-card/50 overflow-hidden">
            <CardHeader className="flex flex-row items-center justify-between pb-4 bg-emerald-500/5 border-b border-emerald-500/10">
                <CardTitle className="flex items-center gap-2 text-xl text-emerald-500">
                    <Users className="w-5 h-5" /> Members ({memberList.length})
                </CardTitle>
                <Button variant="destructive" size="sm" onClick={onResetMembers} className="h-8">
                    <Trash2 className="w-4 h-4 mr-1" /> Clear all members
                </Button>
            </CardHeader>
            <CardContent className="p-0">
                {memberList.length > 0 ? (
                    <Table>
                        <TableHeader className="bg-background/50">
                            <TableRow className="hover:bg-transparent border-border/50">
                                <TableHead className="font-bold">Name</TableHead>
                                <TableHead className="font-bold">Team</TableHead>
                                <TableHead className="text-center font-bold">Points</TableHead>
                                <TableHead className="text-center font-bold">Quiz</TableHead>
                                <TableHead className="text-center font-bold">Items</TableHead>
                                <TableHead className="text-right font-bold">Actions</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {memberList.map((member) => (
                                <TableRow key={member.id} className="border-border/50 hover:bg-background/50 transition-colors">
                                    <TableCell className="font-medium flex items-center gap-2">
                                        <Circle className={`w-3 h-3 fill-current ${member.connected ? 'text-emerald-500' : 'text-muted-foreground/50'}`} />
                                        <span className={!member.connected ? 'text-muted-foreground' : ''}>{member.name}</span>
                                    </TableCell>
                                    <TableCell>
                                        <Badge variant="outline" className="bg-background/50">{member.team}</Badge>
                                    </TableCell>
                                    <TableCell className="text-center font-medium text-indigo-300">{member.points}</TableCell>
                                    <TableCell className="text-center font-medium text-amber-400">{member.quizScore}</TableCell>
                                    <TableCell className="text-center text-muted-foreground">{member.wonItems.length}</TableCell>
                                    <TableCell className="text-right">
                                        <Button
                                            variant="ghost"
                                            size="sm"
                                            className="text-red-400 hover:text-red-300 hover:bg-red-500/10 h-8 px-2"
                                            onClick={() => onKick && onKick(member.id)}
                                        >
                                            <UserMinus className="w-4 h-4 mr-1" /> Remove
                                        </Button>
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                ) : (
                    <div className="text-center py-12 text-muted-foreground">
                        <Users className="w-12 h-12 mx-auto mb-3 opacity-20" />
                        <p>Nobody has joined yet.</p>
                        <p className="text-sm">Share the QR / link from the server window.</p>
                    </div>
                )}
            </CardContent>
        </Card>
    );
}
