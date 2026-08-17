import { PrismaClient } from '@prisma/client'
import { Pool } from 'pg'
import { PrismaPg } from '@prisma/adapter-pg'

const connectionString = process.env.DATABASE_URL
const pool = new Pool({ connectionString })
const adapter = new PrismaPg(pool)
const prisma = new PrismaClient({ adapter })

const AUCTION_ITEMS = [
    { no: 1, name: '2 hours of uninterrupted Deep Work every day for 1 week', why: "Most powerful productivity booster" },
    { no: 2, name: 'Ability to say "No" to 5 meetings without guilt', why: 'Protects your time' },
    { no: 3, name: 'Auto-delegation of all low-value repetitive tasks', why: 'Frees up your time' },
    { no: 4, name: 'One full day with zero emails or Slack messages', why: 'Complete focus day' },
    { no: 5, name: 'Immediate approval for any idea you propose', why: 'Removes bureaucracy' },
    { no: 6, name: 'Personal productivity coach for 1 month', why: 'Expert guidance' },
    { no: 7, name: 'Remove all notifications from your phone & laptop', why: 'Reduces distractions' },
    { no: 8, name: 'Permission to work from anywhere you want for 2 weeks', why: 'Better environment' },
    { no: 9, name: '4-day work week (same salary)', why: 'Better work-life balance' },
    { no: 10, name: 'Ability to finish your most important project 2 weeks early', why: 'Big career boost' },
];

const MYTH_STATEMENTS = [
    { no: 1, text: '3dots and Wizi Technologies are operating as competitors in 2026', answer: 'False', explanation: '3dots & Wizi Technologies have joined forces in a strategic partnership!' },
    { no: 2, text: 'Working longer hours makes you more productive', answer: 'False', explanation: 'Productivity drops after 6–7 hours due to fatigue.' },
    { no: 3, text: 'Multitasking helps you get more work done', answer: 'False', explanation: 'It reduces efficiency by up to 40%.' },
    { no: 4, text: 'Morning people are always more productive', answer: 'False', explanation: 'Depends on your chronotype (some are night owls).' },
    { no: 5, text: 'Checking email first thing in the morning is good', answer: 'False', explanation: 'It starts your day in reactive mode.' },
    { no: 6, text: 'Taking breaks reduces productivity', answer: 'False', explanation: 'Regular breaks (Pomodoro) increase output.' },
    { no: 7, text: 'Being busy = Being productive', answer: 'False', explanation: 'Busyness is activity. Productivity is impact.' },
    { no: 8, text: 'You need to be perfect before submitting work', answer: 'False', explanation: 'Done is better than perfect (80/20 rule).' },
    { no: 9, text: 'Team productivity improves with more meetings', answer: 'False', explanation: 'Too many meetings kill deep work.' },
    { no: 10, text: 'Using to-do lists makes you less productive', answer: 'False', explanation: 'Good to-do lists (with priorities) help a lot.' },
    { no: 11, text: 'Productivity is only about individual effort', answer: 'False', explanation: 'Team systems, communication & culture matter more.' },
];

const LOGO_ITEMS = [
    { no: 1, level: 'easy', svg: '/logos/apple.svg', hint: 'Founded in 1976 by Steve Jobs & Steve Wozniak in a California garage.', options: ['IBM', 'Apple', 'Xerox', 'Microsoft'], answer: 'Apple', explanation: 'Designed by Ronald Wayne in 1976 featuring Sir Isaac Newton sitting under an apple tree!' },
    { no: 2, level: 'easy', svg: '/logos/starbucks.svg', hint: 'Original 1971 coffee house from Pike Place Market, Seattle.', options: ['Starbucks', 'Costa Coffee', 'Dunkin', 'Tim Hortons'], answer: 'Starbucks', explanation: 'The 1971 original logo featured a brown twin-tailed siren emblem!' },
    { no: 3, level: 'easy', svg: '/logos/pepsi.svg', hint: 'First crafted as "Brad\'s Drink" in 1893 in North Carolina.', options: ['Dr Pepper', 'Coca-Cola', 'Pepsi', '7UP'], answer: 'Pepsi', explanation: 'Caleb Bradham renamed it Pepsi-Cola in 1898 and used this ornate red script logo!' },
    { no: 4, level: 'easy', svg: '/logos/twitter.svg', hint: 'Launched as a podcast side-project at Odeo in 2006.', options: ['Tumblr', 'Skype', 'Twitter', 'WhatsApp'], answer: 'Twitter', explanation: 'Designed by Noah Glass in 2006, the original name was spelled "twttr" with a green slime font!' },
    { no: 5, level: 'easy', svg: '/logos/instagram.svg', hint: 'Launched by Kevin Systrom & Mike Krieger in October 2010.', options: ['Snapchat', 'Instagram', 'Pinterest', 'Flickr'], answer: 'Instagram', explanation: 'The original 2010 icon was inspired by a vintage retro Polaroid camera!' },
    { no: 6, level: 'easy', svg: '/logos/lego.svg', hint: 'Danish wooden toy maker founded by Ole Kirk Christiansen in 1932.', options: ['Lego', 'Hasbro', 'Mattel', 'Bandai'], answer: 'Lego', explanation: 'Derived from Danish "leg godt" (play well), this 1936 ink stamp was used on wooden toys!' },
    { no: 7, level: 'easy', svg: '/logos/cocacola.svg', hint: 'First served at Jacob\'s Pharmacy soda fountain in Atlanta in 1886.', options: ['Dr Pepper', 'Coca-Cola', 'Fanta', 'Sprite'], answer: 'Coca-Cola', explanation: 'Before script lettering was adopted, Coca-Cola used a bold black slab serif font in 1886!' },
    { no: 8, level: 'easy', svg: '/logos/mcdonalds.svg', hint: 'Drive-in barbecue restaurant founded in San Bernardino, CA in 1940.', options: ['Burger King', 'Wendy\'s', 'McDonald\'s', 'Sonic'], answer: 'McDonald\'s', explanation: 'Speedee the chef was McDonald\'s original winking mascot before Ronald McDonald arrived in 1967!' },
    { no: 9, level: 'medium', svg: '/logos/shell.svg', hint: 'Started as a London import business selling antique sea shells in 1891.', options: ['Exxon', 'Chevron', 'Shell', 'BP'], answer: 'Shell', explanation: 'In 1904 Shell adopted a realistic black & white mussel shell drawing before adopting yellow & red colors!' },
    { no: 10, level: 'medium', svg: '/logos/canon.svg', hint: 'Japanese optical camera company founded in 1934.', options: ['Nikon', 'Canon', 'Olympus', 'Sony'], answer: 'Canon', explanation: 'Originally named Kwanon after the Buddhist Goddess of Mercy with a thousand arms!' },
];

const CONNECTION_PUZZLES = [
    {
        no: 1,
        title: 'Puzzle #1 — Tech & Office Life',
        categories: [
            { name: 'TECH GIANTS NAMED AFTER FRUITS OR TREES', level: 'yellow', words: ['Apple', 'BlackBerry', 'Acorn', 'Cherry'] },
            { name: 'THINGS YOU CAN "SAVE"', level: 'green', words: ['File', 'Money', 'Time', 'Face'] },
            { name: 'WORDS STARTING WITH KEYBOARD KEYS', level: 'blue', words: ['Altruism', 'Escape', 'Taboo', 'Delete'] },
            { name: '___ BOARD', level: 'purple', words: ['Dash', 'Key', 'White', 'Score'] },
        ],
    }
];

async function main() {
    console.log('Start seeding...')

    // Seed GameState
    await prisma.gameState.upsert({
        where: { id: 'global' },
        update: {},
        create: { id: 'global', phase: 'lobby' },
    })

    // Seed Auction Items
    for (const item of AUCTION_ITEMS) {
        await prisma.auctionItem.upsert({
            where: { no: item.no },
            update: {},
            create: item,
        })
    }

    // Seed Myth Statements
    for (const myth of MYTH_STATEMENTS) {
        await prisma.mythStatement.upsert({
            where: { no: myth.no },
            update: {},
            create: myth,
        })
    }

    // Seed Logo Items
    for (const logo of LOGO_ITEMS) {
        await prisma.logoItem.upsert({
            where: { no: logo.no },
            update: {},
            create: logo,
        })
    }

    // Seed Connection Puzzles
    for (const puzzle of CONNECTION_PUZZLES) {
        await prisma.connectionPuzzle.upsert({
            where: { no: puzzle.no },
            update: {},
            create: {
                no: puzzle.no,
                title: puzzle.title,
                categories: {
                    create: puzzle.categories.map(c => ({
                        name: c.name,
                        level: c.level,
                        words: c.words
                    }))
                }
            },
        })
    }

    console.log('Seeding finished.')
}

main()
    .then(async () => {
        await prisma.$disconnect()
    })
    .catch(async (e) => {
        console.error(e)
        await prisma.$disconnect()
        process.exit(1)
    })
