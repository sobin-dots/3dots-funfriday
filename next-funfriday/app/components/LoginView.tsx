'use client';

import { useState } from 'react';
import { PartyPopper, UserPlus, Settings, Presentation, MonitorPlay, ArrowRight } from 'lucide-react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';

interface LoginViewProps {
    onJoin: (name: string, team: string) => void;
    onAdminLogin: (password: string) => void;
}

export default function LoginView({ onJoin, onAdminLogin }: LoginViewProps) {
    const [name, setName] = useState('');
    const [team, setTeam] = useState('');
    const [password, setPassword] = useState('');

    return (
        <section id="view-login" className="max-w-4xl mx-auto mt-10">
            <div className="text-center mb-10">
                <h1 className="text-4xl font-extrabold mb-3 flex items-center justify-center gap-3">
                    <PartyPopper className="w-10 h-10 text-indigo-500" /> Fun Friday
                </h1>
                <p className="text-muted-foreground text-lg">Auction · Myth Buster · Vintage Logo Finder · Connection</p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Card className="border-indigo-500/20 shadow-lg bg-card/50 backdrop-blur-sm">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2 text-xl">
                            <UserPlus className="w-5 h-5 text-indigo-400" /> Join as a team member
                        </CardTitle>
                        <CardDescription>Enter your details to participate in the games.</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="space-y-2">
                            <label htmlFor="in-name" className="text-sm font-medium text-muted-foreground">Your name</label>
                            <Input
                                id="in-name"
                                type="text"
                                placeholder="e.g. Priya"
                                maxLength={40}
                                autoComplete="off"
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                                onKeyDown={(e) => e.key === 'Enter' && document.getElementById('in-team')?.focus()}
                                className="bg-background/50"
                            />
                        </div>
                        <div className="space-y-2">
                            <label htmlFor="in-team" className="text-sm font-medium text-muted-foreground">Your team</label>
                            <Input
                                id="in-team"
                                type="text"
                                placeholder="e.g. Team Rocket"
                                maxLength={40}
                                autoComplete="off"
                                value={team}
                                onChange={(e) => setTeam(e.target.value)}
                                onKeyDown={(e) => e.key === 'Enter' && onJoin(name, team)}
                                className="bg-background/50"
                            />
                        </div>
                    </CardContent>
                    <CardFooter>
                        <Button className="w-full font-bold" onClick={() => onJoin(name, team)}>
                            Join the fun <ArrowRight className="w-4 h-4 ml-2" />
                        </Button>
                    </CardFooter>
                </Card>

                <Card className="border-purple-500/20 shadow-lg bg-card/50 backdrop-blur-sm">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2 text-xl">
                            <Settings className="w-5 h-5 text-purple-400" /> Admin / Facilitator
                        </CardTitle>
                        <CardDescription>Run the auction and games from here.</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="space-y-2">
                            <label htmlFor="in-pass" className="text-sm font-medium text-muted-foreground">Admin password</label>
                            <Input
                                id="in-pass"
                                type="password"
                                placeholder="••••••••"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                onKeyDown={(e) => e.key === 'Enter' && onAdminLogin(password)}
                                className="bg-background/50"
                            />
                        </div>
                    </CardContent>
                    <CardFooter className="flex-col gap-4 items-start">
                        <Button variant="secondary" className="w-full font-bold" onClick={() => onAdminLogin(password)}>
                            Open control panel
                        </Button>
                        <div className="text-sm text-muted-foreground space-y-2 w-full pt-4 border-t border-border/50">
                            <a href="/deck.html" target="_blank" rel="noopener" className="flex items-center gap-2 hover:text-indigo-400 transition-colors">
                                <Presentation className="w-4 h-4" /> Slide Deck (PPT)
                            </a>
                            <a href="/present" target="_blank" rel="noopener" className="flex items-center gap-2 hover:text-purple-400 transition-colors">
                                <MonitorPlay className="w-4 h-4" /> Projector View
                            </a>
                        </div>
                    </CardFooter>
                </Card>
            </div>
        </section>
    );
}
