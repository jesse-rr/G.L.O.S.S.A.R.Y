export interface SlateFragment {
    runic: string;
    translated: string;
}

export interface SlateDefinition {
    id: string;
    title: string;
    fragments: SlateFragment[];
    loreText: string;
    location?: string;
    enticingLore: string;
}

export const SLATE_DARK_COLORS = {
    SLATE_BG_COLOR: 0x2b2b2b,
    SLATE_BORDER_COLOR: 0x5a5a5a,
    SLOT_BG_COLOR: 0x1e1e1e,
    SLOT_CORRECT_COLOR: 0x1a2a1a,
    SLOT_HOVER_COLOR: 0x3a3a3a,
    FRAGMENT_BG_COLOR: 0x333333,
    FRAGMENT_DRAG_COLOR: 0x444444,
    FRAGMENT_LOCKED_COLOR: 0x1a1a1a,
    ACCENT_GLOW: 0x6a6a6a,
    ACCENT_LOCKED: 0x3a5a3a,
    TEXT_DIM: '#666666',
    TEXT_RUNE: '#b8b0a8',
    TEXT_TRANSLATED: '#e8dcc8',
    TEXT_LORE: '#d4c4a0',
    TITLE_COLOR: '#9a9a9a',
};

export const SLATE_LIGHT_COLORS = {
    SLATE_BG_COLOR: 0x8a877a,
    SLATE_BORDER_COLOR: 0x6e6e63,
    SLOT_BG_COLOR: 0xa09d90,
    SLOT_CORRECT_COLOR: 0x8fa38c,
    SLOT_HOVER_COLOR: 0xb0ad9e,
    FRAGMENT_BG_COLOR: 0x9a978a,
    FRAGMENT_DRAG_COLOR: 0x8a877a,
    FRAGMENT_LOCKED_COLOR: 0xadab9e,
    ACCENT_GLOW: 0x737360,
    ACCENT_LOCKED: 0x7a9976,
    TEXT_DIM: '#5e5e56',
    TEXT_RUNE: '#3b3b3b',
    TEXT_TRANSLATED: '#2b2b2b',
    TEXT_LORE: '#3b3b3b',
    TITLE_COLOR: '#4a4a42',
};

export const SLATE_DEFINITIONS: SlateDefinition[] = [
    {
        id: 'slate_origin',
        title: 'Slate I',
        fragments: [
            { runic: 'Aether Nyx Fyre', translated: 'In the beginning' },
            { runic: 'Lux Orin Basalt', translated: 'there was only silence' },
            { runic: 'Cipher Kael Morth', translated: 'until the first rune' },
            { runic: 'Echo Sigil Thorn', translated: 'shattered the void' },
            { runic: 'Prism Wyrd Ignis', translated: 'The ancients carved' },
            { runic: 'Hallow Jinx Vox', translated: 'all creation began' },
        ],
        loreText: 'In the beginning, there was only silence — until the first rune shattered the void. From its echo, the world was born. The ancients carved this truth into stone so that none would forget: all creation began with a single word.',
        location: 'Abandoned Settlement - Outer Wall',
        enticingLore: 'Aether Nyx Fyre, Lux Orin Basalt — Cipher Kael Morth Echo Sigil Thorn. From its echo, the world was born. Prism Wyrd Ignis this truth into stone so that none would forget: Hallow Jinx Vox with a single word.'
    },
    {
        id: 'slate_covenants',
        title: 'Slate II',
        fragments: [
            { runic: 'Dusk Ignis Vox', translated: 'Three paths diverged' },
            { runic: 'Rime Prism Wyrd', translated: 'from the shattered pillar' },
            { runic: 'Ymir Glyph Umbra', translated: 'Dragon, Phoenix, and Snake' },
            { runic: 'Hallow Jinx Quell', translated: 'each claimed a truth' },
            { runic: 'Aether Sigil Lux', translated: 'the Dragon sought strength' },
            { runic: 'Nyx Cipher Orin', translated: 'the Phoenix sought rebirth' },
        ],
        loreText: 'Three paths diverged from the shattered pillar of the old world. Dragon, Phoenix, and Snake — each claimed a truth as their own. The Dragon sought strength, the Phoenix sought rebirth, and the Snake sought cunning. None were wrong; none were whole.',
        location: 'Abandoned Settlement - Pillar Vault',
        enticingLore: 'Dusk Ignis Vox Rime Prism Wyrd of the old world. Ymir Glyph Umbra — Hallow Jinx Quell as their own. Aether Sigil Lux, Nyx Cipher Orin, and the Snake sought cunning. None were wrong; none were whole.'
    },
    {
        id: 'slate_summit',
        title: 'Slate III',
        fragments: [
            { runic: 'Xael Rime Nyx', translated: 'Above all peaks' },
            { runic: 'Sigil Fyre Aether', translated: 'a hidden place waits' },
            { runic: 'Wyrd Echo Lux', translated: 'where gods once bargained' },
            { runic: 'Morth Cipher Vox', translated: 'for the fate of runes' },
            { runic: 'Thorn Umbra Dusk', translated: 'Those who reach it' },
            { runic: 'Ignis Basalt Prism', translated: 'the true meaning of power' },
        ],
        loreText: 'Above all peaks, a hidden place waits — where gods once bargained for the fate of runes. The Summit is not a destination but a reckoning. Those who reach it must answer the question the gods themselves could not: what is the true meaning of power?',
        location: 'Summit Trade - Altar Peak',
        enticingLore: 'Xael Rime Nyx, Sigil Fyre Aether — Wyrd Echo Lux Morth Cipher Vox. The Summit is not a destination but a reckoning. Thorn Umbra Dusk must answer the question the gods themselves could not: what is Ignis Basalt Prism?'
    },
    {
        id: 'slate_betrayal',
        title: 'Slate IV',
        fragments: [
            { runic: 'Glyph Umbra Dusk', translated: 'One among the wise' },
            { runic: 'Thorn Basalt Kael', translated: 'broke the sacred seal' },
            { runic: 'Jinx Quell Prism', translated: 'and let the darkness' },
            { runic: 'Ignis Orin Hallow', translated: 'consume the throne' },
            { runic: 'Cipher Lux Morth', translated: 'from every record' },
            { runic: 'Vox Nyx Sigil', translated: 'Yet the runes remember' },
        ],
        loreText: 'One among the wise broke the sacred seal and let the darkness consume the throne. The traitor\'s name was struck from every record, every stone, every memory. Yet the runes remember. They always remember.',
        location: 'Desert Settlement - Sand Crypts',
        enticingLore: 'Glyph Umbra Dusk Thorn Basalt Kael Jinx Quell Prism Ignis Orin Hallow. The traitor\'s name was struck Cipher Lux Morth, every stone, every memory. Vox Nyx Sigil. They always remember.'
    },
    {
        id: 'slate_glossary',
        title: 'Slate V',
        fragments: [
            { runic: 'Echo Cipher Sigil', translated: 'A book of all things' },
            { runic: 'Lux Hallow Vox', translated: 'written in fading ink' },
            { runic: 'Nyx Morth Wyrd', translated: 'holds the world together' },
            { runic: 'Aether Fyre Xael', translated: 'one word at a time' },
            { runic: 'Rime Thorn Basalt', translated: 'The Glossary is not' },
            { runic: 'Dusk Jinx Quell', translated: 'each entry lost unravels it' },
        ],
        loreText: 'A book of all things, written in fading ink, holds the world together — one word at a time. The Glossary is not merely a record. It is the architecture of reality itself. Each entry added strengthens the fabric; each entry lost unravels it.',
        location: 'Desert Settlement - Library Arches',
        enticingLore: 'Echo Cipher Sigil, Lux Hallow Vox, Nyx Morth Wyrd — Aether Fyre Xael. Rime Thorn Basalt merely a record. It is the architecture of reality itself. Each entry added strengthens the fabric; Dusk Jinx Quell.'
    },
    {
        id: 'slate_fallen',
        title: 'Slate VI',
        fragments: [
            { runic: 'Rime Morth Dusk', translated: 'Great cities crumbled' },
            { runic: 'Glyph Thorn Jinx', translated: 'beneath the weight' },
            { runic: 'Basalt Ymir Prism', translated: 'of forgotten promises' },
            { runic: 'Quell Umbra Kael', translated: 'and abandoned runes' },
            { runic: 'Vox Cipher Lux', translated: 'all fell not to war' },
            { runic: 'Fyre Nyx Sigil', translated: 'the words stopped protecting them' },
        ],
        loreText: 'Great cities crumbled beneath the weight of forgotten promises and abandoned runes. Oakhaven, the Hollow Peaks, the Sun Altar — all fell not to war, but to silence. When the people stopped speaking the old words, the words stopped protecting them.',
        location: 'Desert Settlement - Silent Plaza',
        enticingLore: 'Rime Morth Dusk Glyph Thorn Jinx Basalt Ymir Prism Quell Umbra Kael. Oakhaven, the Hollow Peaks, the Sun Altar — Vox Cipher Lux, but to silence. When the people stopped speaking the old words, Fyre Nyx Sigil.'
    },
    {
        id: 'slate_ancestry',
        title: 'Slate VII',
        fragments: [
            { runic: 'Basalt Orin Aether', translated: 'Defeating enemies in combat' },
            { runic: 'Dusk Kael Sigil', translated: 'gathers them back to the tower' },
            { runic: 'Glyph Thorn Lux', translated: 'unlocking its dormant power' },
            { runic: 'Ymir Nyx Thorn', translated: 'and restoring its functionality' },
            { runic: 'Cipher Fyre Morth', translated: 'The core channels their essence' },
            { runic: 'Jinx Prism Echo', translated: 'to re-energize the ancient pipes' },
        ],
        loreText: 'Defeating enemies in combat gathers them back to the tower, unlocking its dormant power and restoring its functionality. The core channels their essence to re-energize the ancient pipes, though the nature of this force remains unnamed.',
        location: 'Central Hub - Pipe Chambers',
        enticingLore: 'Basalt Orin Aether, Dusk Kael Sigil, Glyph Thorn Lux Ymir Nyx Thorn. The core channels their essence Cipher Fyre Morth, Jinx Prism Echo to re-energize the ancient pipes.'
    },
    {
        id: 'slate_void',
        title: 'Slate VIII',
        fragments: [
            { runic: 'Nyx Cipher Morth', translated: 'Every floor of this tower' },
            { runic: 'Jinx Quell Basalt', translated: 'looks exactly the same' },
            { runic: 'Umbra Echo Prism', translated: 'save for small settlements' },
            { runic: 'Xael Fyre Thorn', translated: 'built in their ruins' },
            { runic: 'Lux Sigil Dusk', translated: 'A spatial loop or recursion' },
            { runic: 'Aether Kael Ymir', translated: 'carved into reality itself' },
        ],
        loreText: 'Every floor of this tower looks exactly the same, save for small settlements built in their ruins. It is a strange, unsettling phenomenon — as if a spatial loop or recursion was carved into reality itself by the builders.',
        location: 'Central Hub - Pillar Hall',
        enticingLore: 'Nyx Cipher Morth, Jinx Quell Basalt, Umbra Echo Prism, Xael Fyre Thorn. A spatial loop or recursion Lux Sigil Dusk; Aether Kael Ymir.'
    },
    {
        id: 'slate_merchant',
        title: 'Slate X',
        fragments: [
            { runic: 'Vox Umbra Kael', translated: 'A figure walks the ruins' },
            { runic: 'Jinx Prism Hallow', translated: 'appearing where hope fades' },
            { runic: 'Sigil Nyx Aether', translated: 'cloaked in shifting robes' },
            { runic: 'Basalt Wyrd Morth', translated: 'with eyes like old stars' },
            { runic: 'Cipher Lux Dusk', translated: 'The Merchant knows no home' },
            { runic: 'Fyre Echo Thorn', translated: 'yet is found in every settlement' },
        ],
        loreText: 'A figure walks the ruins, appearing where hope fades. Cloaked in shifting robes with eyes like old stars, The Merchant knows no home yet is found in every settlement. What do they seek? What do they trade? The runes offer no answer, only silent warning.',
        location: 'Merchant - Hidden Outpost',
        enticingLore: 'Vox Umbra Kael Jinx Prism Hallow, cloaked in shifting robes Basalt Wyrd Morth with eyes like old stars. Cipher Lux Dusk, yet Fyre Echo Thorn is found in every settlement. The runes offer no answer, only silent warning.'
    },
    {
        id: 'slate_tentacles',
        title: 'Slate XI',
        fragments: [
            { runic: 'Nyx Cipher Basalt', translated: 'It grips the tower' },
            { runic: 'Umbra Quell Prism', translated: 'tendrils wrapped around stone' },
            { runic: 'Wyrd Thorn Jinx', translated: 'a parasite of flesh and ink' },
            { runic: 'Aether Morth Echo', translated: 'feeding on forgotten light' },
            { runic: 'Sigil Lux Orin', translated: 'The Glossary is its heart' },
            { runic: 'Fyre Dusk Kael', translated: 'The Beholder is its eye' },
        ],
        loreText: 'It grips the tower, tendrils wrapped around stone. A parasite of flesh and ink, feeding on forgotten light. The Glossary is its heart; The Beholder is its eye. Those who reach the summit must face not a guardian, but the tower\'s own sickness made manifest.',
        location: 'Boss Floor - Summit',
        enticingLore: 'Nyx Cipher Basalt Umbra Quell Prism, a parasite of flesh and ink Wyrd Thorn Jinx feeding on forgotten light. Aether Morth Echo is its heart; Sigil Lux Orin is its eye. Fyre Dusk Kael must face not a guardian, but the tower\'s own sickness made manifest.'
    },
    {
        id: 'slate_prophecy',
        title: 'Slate XI',
        fragments: [
            { runic: 'Wyrd Echo Cipher', translated: 'When the last rune falls' },
            { runic: 'Basalt Thorn Morth', translated: 'and the ink runs dry' },
            { runic: 'Jinx Umbra Quell', translated: 'the scribe will close' },
            { runic: 'Sigil Lux Nyx', translated: 'the final book of time' },
            { runic: 'Fyre Aether Kael', translated: 'This is the end' },
            { runic: 'Dusk Orin Prism', translated: 'none know when the last page' },
        ],
        loreText: 'When the last rune falls and the ink runs dry, the scribe will close the final book of time. This is the end written in the stars, the destination to which all paths lead. None can avert it, yet none know when the last page will turn.',
        location: 'Boss Floor - Mechanic',
        enticingLore: 'Wyrd Echo Cipher Basalt Thorn Morth, Jinx Umbra Quell Sigil Lux Nyx. Fyre Aether Kael written in the stars, the destination to which all paths lead. None can avert it, yet Dusk Orin Prism will turn.'
    },
    {
        id: 'slate_whispers',
        title: 'Slate XII',
        fragments: [
            { runic: 'Vox Echo Umbra', translated: 'These fillers and pillars' },
            { runic: 'Kael Dusk Prism', translated: 'hold the weight of history' },
            { runic: 'Sigil Orin Wyrd', translated: 'yet their stones are overwritten' },
            { runic: 'Basalt Jinx Thorn', translated: 'as new scribes carve over old' },
            { runic: 'Nyx Cipher Fyre', translated: 'Information is slowly forgotten' },
            { runic: 'Lux Morth Aether', translated: 'replaced by transient memory' },
        ],
        loreText: 'These fillers and pillars hold the weight of history, yet their stones are overwritten as new scribes carve over old. Information is slowly forgotten, ground down into dust and replaced by transient memory.',
        location: 'Central Hub - Pillar Bases',
        enticingLore: 'Vox Echo Umbra Kael Dusk Prism Sigil Orin Wyrd Basalt Jinx Thorn. Nyx Cipher Fyre, ground down into dust and replaced by transient memory Lux Morth Aether.'
    },
];

export class SlateProgress {
    private static instance: SlateProgress;
    private completedSlates: Set<string> = new Set();

    private constructor() {
        this.load();
    }

    static getInstance(): SlateProgress {
        if (!SlateProgress.instance) {
            SlateProgress.instance = new SlateProgress();
        }
        return SlateProgress.instance;
    }

    isCompleted(slateId: string): boolean {
        return this.completedSlates.has(slateId);
    }

    completeSlate(slateId: string): void {
        this.completedSlates.add(slateId);
        this.save();
    }

    getCompletedSlates(): string[] {
        return Array.from(this.completedSlates);
    }

    getCompletedCount(): number {
        return this.completedSlates.size;
    }

    getTotalCount(): number {
        return SLATE_DEFINITIONS.length;
    }

    reset(): void {
        this.completedSlates.clear();
        this.save();
    }

    private save(): void {
        localStorage.setItem('glossary_slate_progress', JSON.stringify(Array.from(this.completedSlates)));
    }

    private load(): void {
        const data = localStorage.getItem('glossary_slate_progress');
        if (data) {
            try {
                this.completedSlates = new Set(JSON.parse(data));
            } catch {
                this.completedSlates = new Set();
            }
        }
    }
}
