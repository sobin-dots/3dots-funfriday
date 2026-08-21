'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Puzzle, CheckCircle2, RotateCcw, ArrowRight, Eye } from 'lucide-react';

interface ConnectionCategory {
    id: string;
    name: string;
    level: 'yellow' | 'green' | 'blue' | 'purple';
    words: string[];
    solvedBy: string[]; // array of memberIds
}

interface ConnectionPuzzle {
    id: string;
    no: number;
    title: string;
    status: 'pending' | 'active' | 'solved';
    revealedCategories: string[];
    categories: ConnectionCategory[];
}

interface ConnectionState {
    activePuzzleId: number | null;
    puzzles: ConnectionPuzzle[];
}

interface ConnectionsGridProps {
    role: 'member' | 'admin';
    connection: ConnectionState;
    memberId?: string;
    onSubmit?: (words: string[]) => void;
    onOpen?: (puzzleId: number) => void;
    onRevealCategory?: (categoryName: string) => void;
    onReset?: () => void;
}

export default function ConnectionsGrid({
    role,
    connection,
    memberId,
    onSubmit,
    onOpen,
    onRevealCategory,
    onReset
}: ConnectionsGridProps) {
    const [selectedWords, setSelectedWords] = useState<string[]>([]);

    const activePuzzle = connection.puzzles.find((p) => p.no === connection.activePuzzleId);

    const getCategoryColor = (level: string) => {
        switch (level) {
            case 'yellow': return 'bg-[#f9d854] text-[#2c2102] border-[#f9d854]';
            case 'green': return 'bg-[#60d394] text-[#04231a] border-[#60d394]';
            case 'blue': return 'bg-[#62b6cb] text-[#07232b] border-[#62b6cb]';
            case 'purple': return 'bg-[#b5838d] text-[#230811] border-[#b5838d]';
            default: return 'bg-indigo-500 text-white border-indigo-500';
        }
    };

    if (role === 'member') {
        if (!activePuzzle) {
            return (
                <Card className="text-center p-10 border-dashed border-2 border-border/50 bg-card/30">
                    <CardContent className="pt-6 text-muted-foreground text-lg flex flex-col items-center gap-3">
                        <Puzzle className="w-8 h-8 text-blue-400 opacity-50" />
                        Connection Game is open. Waiting for the facilitator to start a puzzle
                    </CardContent>
                </Card>
            );
        }

        // Find which categories this member has solved (or admin has revealed)
        const solvedCatNames = activePuzzle.categories
            .filter((c) => c.solvedBy.includes(memberId || '') || activePuzzle.revealedCategories.includes(c.name))
            .map((c) => c.name);

        const solvedCategories = activePuzzle.categories.filter((c) => solvedCatNames.includes(c.name));

        // Get all remaining unsolved words
        const unsolvedWords = activePuzzle.categories
            .filter((c) => !solvedCatNames.includes(c.name))
            .flatMap((c) => c.words);

        const toggleWord = (word: string) => {
            if (selectedWords.includes(word)) {
                setSelectedWords(selectedWords.filter((w) => w !== word));
            } else {
                if (selectedWords.length >= 4) return;
                setSelectedWords([...selectedWords, word]);
            }
        };

        const handleSubmit = () => {
            if (selectedWords.length === 4 && onSubmit) {
                onSubmit(selectedWords);
                setSelectedWords([]); // Reset selection after submit
            }
        };

        return (
            <Card className="border-blue-500/20 shadow-lg bg-card/50">
                <CardHeader>
                    <CardTitle className="text-muted-foreground text-sm font-medium flex items-center gap-2">
                        <Puzzle className="w-4 h-4 text-blue-400" /> {activePuzzle.title}  Create 4 groups of 4 words
                    </CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                    <p className="text-center text-muted-foreground font-medium">Select 4 related words and tap <b>Submit Group</b>.</p>

                    {/* Solved Banners */}
                    {solvedCategories.length > 0 && (
                        <div className="space-y-2">
                            {solvedCategories.map((c) => (
                                <div key={c.name} className={`p-4 rounded-xl text-center shadow-sm animate-in zoom-in duration-300 ${getCategoryColor(c.level)}`}>
                                    <div className="font-black text-lg uppercase tracking-wider mb-1">{c.name}</div>
                                    <div className="font-semibold opacity-90 tracking-wide">{c.words.join('  ')}</div>
                                </div>
                            ))}
                        </div>
                    )}

                    {/* Unsolved Words Grid */}
                    {unsolvedWords.length > 0 ? (
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                            {unsolvedWords.map((word) => (
                                <Button
                                    key={word}
                                    variant={selectedWords.includes(word) ? 'default' : 'outline'}
                                    className={`min-h-[80px] h-auto p-2 text-center font-bold text-sm sm:text-base uppercase tracking-wide rounded-xl border-2 transition-all duration-200 whitespace-normal ${selectedWords.includes(word) ? 'bg-blue-600 text-white border-blue-400 shadow-[0_4px_15px_rgba(37,99,235,0.4)] scale-[1.02] hover:bg-blue-700' : 'bg-background/80 border-border hover:border-blue-400 hover:bg-background'}`}
                                    onClick={() => toggleWord(word)}
                                >
                                    {word}
                                </Button>
                            ))}
                        </div>
                    ) : (
                        <div className="p-6 rounded-2xl border bg-emerald-500/10 border-emerald-500/50 text-center animate-in fade-in duration-500">
                            <div className="font-bold text-xl flex flex-col items-center justify-center gap-3 text-emerald-400">
                                <CheckCircle2 className="w-12 h-12" />
                                Incredible! You solved all 4 categories!
                            </div>
                            <p className="text-emerald-300 mt-2 font-medium">+100 Total Quiz Points!</p>
                        </div>
                    )}

                    {/* Action Buttons */}
                    {unsolvedWords.length > 0 && (
                        <div className="flex flex-wrap sm:flex-nowrap gap-3 pt-4 border-t border-border/50">
                            <Button
                                size="lg"
                                className="flex-1 h-14 text-lg font-bold bg-blue-600 hover:bg-blue-700 text-white"
                                disabled={selectedWords.length !== 4}
                                onClick={handleSubmit}
                            >
                                Submit Group ({selectedWords.length}/4)
                            </Button>
                            <Button
                                size="lg"
                                variant="outline"
                                className="h-14"
                                disabled={selectedWords.length === 0}
                                onClick={() => setSelectedWords([])}
                            >
                                Deselect All
                            </Button>
                        </div>
                    )}
                </CardContent>
            </Card>
        );
    }

    // Admin View
    return (
        <div className="space-y-6">
            {activePuzzle && (
                <Card className="border-red-500/30 shadow-lg bg-card/50">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2 text-red-400">
                            <span className="relative flex h-3 w-3 mr-1">
                                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                                <span className="relative inline-flex rounded-full h-3 w-3 bg-red-500"></span>
                            </span>
                            Live now  {activePuzzle.title}
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <p className="text-muted-foreground font-medium">Categories in this puzzle:</p>

                        <div className="space-y-3">
                            {activePuzzle.categories.map((cat) => {
                                const isRevealed = activePuzzle.revealedCategories.includes(cat.name);
                                return (
                                    <div key={cat.name} className={`flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 rounded-xl ${getCategoryColor(cat.level)}`}>
                                        <div>
                                            <div className="font-black text-lg uppercase tracking-wider mb-1">{cat.name}</div>
                                            <div className="font-semibold opacity-90 tracking-wide">{cat.words.join('  ')}</div>
                                        </div>
                                        <Button
                                            variant="secondary"
                                            className="bg-black/20 hover:bg-black/30 text-current border-none shadow-none"
                                            disabled={isRevealed}
                                            onClick={() => onRevealCategory && onRevealCategory(cat.name)}
                                        >
                                            {isRevealed ? <><CheckCircle2 className="w-4 h-4 mr-2" /> Revealed</> : <><Eye className="w-4 h-4 mr-2" /> Reveal category</>}
                                        </Button>
                                    </div>
                                );
                            })}
                        </div>

                        {activePuzzle.no < connection.puzzles.length && (
                            <div className="pt-4 flex justify-end">
                                <Button
                                    size="lg"
                                    variant="secondary"
                                    onClick={() => onOpen && onOpen(activePuzzle.no + 1)}
                                >
                                    Next Puzzle <ArrowRight className="w-5 h-5 ml-2" />
                                </Button>
                            </div>
                        )}
                    </CardContent>
                </Card>
            )}

            <Card className="border-blue-500/20 shadow-sm bg-card/50">
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                    <CardTitle className="flex items-center gap-2 text-xl">
                        <Puzzle className="w-5 h-5 text-blue-400" /> Connection Puzzles
                    </CardTitle>
                    <Button variant="destructive" size="sm" onClick={onReset} className="h-8">
                        <RotateCcw className="w-4 h-4 mr-1" /> Reset game
                    </Button>
                </CardHeader>
                <CardContent>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mt-4">
                        {connection.puzzles.map((pz) => (
                            <div key={pz.id} className={`flex flex-col gap-3 p-4 rounded-xl border ${pz.status === 'active' ? 'border-blue-500 bg-blue-500/10 shadow-[0_0_15px_rgba(59,130,246,0.2)]' : 'border-border/50 bg-background/50'}`}>
                                <div className="flex items-center justify-between">
                                    <span className="font-bold text-muted-foreground">#{pz.no}</span>
                                    <Badge variant={pz.status === 'active' ? 'default' : pz.status === 'solved' ? 'secondary' : 'outline'} className={pz.status === 'active' ? 'bg-blue-500' : pz.status === 'solved' ? 'bg-emerald-500/20 text-emerald-400' : ''}>
                                        {pz.status}
                                    </Badge>
                                </div>
                                <div className="font-bold text-lg leading-tight">{pz.title}</div>
                                <div className="text-sm text-muted-foreground italic flex-1">4 categories  16 words</div>

                                <div className="pt-3 mt-auto border-t border-border/50">
                                    <Button
                                        variant={pz.status === 'active' ? 'secondary' : 'outline'}
                                        size="sm"
                                        className="w-full"
                                        onClick={() => onOpen && onOpen(pz.no)}
                                    >
                                        {pz.status === 'pending' ? 'Open' : 'Re-open'}
                                    </Button>
                                </div>
                            </div>
                        ))}
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
