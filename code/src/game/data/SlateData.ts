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
            { runic: 'Basalt Orin Aether', translated: 'Before the age of man' },
            { runic: 'Dusk Kael Sigil', translated: 'the first builders rose' },
            { runic: 'Glyph Thorn Lux', translated: 'shaping the core stone' },
            { runic: 'Ymir Nyx Thorn', translated: 'with their bare hands' },
            { runic: 'Cipher Fyre Morth', translated: 'We walk in their shadows' },
            { runic: 'Jinx Prism Echo', translated: 'completely ignorant of the giants' },
        ],
        loreText: 'Before the age of man, the first builders rose, shaping the core stone with their bare hands. They left behind the great ruins and the monuments that litter our horizons. We walk in their shadows, using their leftover sigils, completely ignorant of the giants who stood here first.',
        location: 'Mechanic Settlement',
        enticingLore: 'Basalt Orin Aether, Dusk Kael Sigil, Glyph Thorn Lux Ymir Nyx Thorn. They left behind the great ruins and the monuments that litter our horizons. Cipher Fyre Morth, using their leftover sigils, Jinx Prism Echo who stood here first.'
    },
    {
        id: 'slate_void',
        title: 'Slate VIII',
        fragments: [
            { runic: 'Nyx Cipher Morth', translated: 'In the deepest dark' },
            { runic: 'Jinx Quell Basalt', translated: 'where light cannot reach' },
            { runic: 'Umbra Echo Prism', translated: 'unseen horrors slumber' },
            { runic: 'Xael Fyre Thorn', translated: 'waiting for the call' },
            { runic: 'Lux Sigil Dusk', translated: 'the void is not empty' },
            { runic: 'Aether Kael Ymir', translated: 'for the boundaries to collapse' },
        ],
        loreText: 'In the deepest dark, where light cannot reach, unseen horrors slumber, waiting for the call. The void is not empty; it is merely silent, holding its breath until the runes fade enough for the boundaries to collapse.',
        location: 'Mechanic Settlement - Power Core',
        enticingLore: 'Nyx Cipher Morth, Jinx Quell Basalt, Umbra Echo Prism, Xael Fyre Thorn. Lux Sigil Dusk; it is merely silent, holding its breath until the runes fade enough Aether Kael Ymir.'
    },
    {
        id: 'slate_eclipse',
        title: 'Slate IX',
        fragments: [
            { runic: 'Prism Lux Orin', translated: 'When the sun dies' },
            { runic: 'Umbra Dusk Fyre', translated: 'and the moon turns red' },
            { runic: 'Sigil Basalt Nyx', translated: 'the old gates open' },
            { runic: 'Kael Thorn Aether', translated: 'revealing forgotten paths' },
            { runic: 'Cipher Wyrd Jinx', translated: 'during the alignment' },
            { runic: 'Echo Morth Rime', translated: 'allowing mortals to glimpse' },
        ],
        loreText: 'When the sun dies and the moon turns red, the old gates open, revealing forgotten paths. It is during the alignment of celestial bodies that the veil grows thin, allowing mortals to glimpse the eternal fire.',
        location: 'Boss Floor - Abandoned',
        enticingLore: 'Prism Lux Orin Umbra Dusk Fyre, Sigil Basalt Nyx, Kael Thorn Aether. It is Cipher Wyrd Jinx of celestial bodies that the veil grows thin, Echo Morth Rime the eternal fire.'
    },
    {
        id: 'slate_rebirth',
        title: 'Slate X',
        fragments: [
            { runic: 'Fyre Prism Hallow', translated: 'Out of the ashes' },
            { runic: 'Ymir Ignis Echo', translated: 'a new world blooms' },
            { runic: 'Lux Vox Aether', translated: 'cleansed of past sins' },
            { runic: 'Morth Thorn Quell', translated: 'by the eternal flame' },
            { runic: 'Nyx Sigil Dusk', translated: 'the cycle of death' },
            { runic: 'Cipher Basalt Rime', translated: 'only remade into a shape' },
        ],
        loreText: 'Out of the ashes, a new world blooms, cleansed of past sins by the eternal flame. The cycle of death and rebirth is absolute; nothing is truly destroyed, only remade into a shape more fitting for the coming age.',
        location: 'Boss Floor - Desert',
        enticingLore: 'Fyre Prism Hallow, Ymir Ignis Echo, Lux Vox Aether Morth Thorn Quell. Nyx Sigil Dusk and rebirth is absolute; nothing is truly destroyed, Cipher Basalt Rime more fitting for the coming age.'
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
            { runic: 'Vox Echo Umbra', translated: 'Listen to the wind' },
            { runic: 'Kael Dusk Prism', translated: 'carrying ancient secrets' },
            { runic: 'Sigil Orin Wyrd', translated: 'through the hollow peaks' },
            { runic: 'Basalt Jinx Thorn', translated: 'to those who listen' },
            { runic: 'Nyx Cipher Fyre', translated: 'the world speaks softly' },
            { runic: 'Lux Morth Aether', translated: 'that the modern kingdoms' },
        ],
        loreText: 'Listen to the wind carrying ancient secrets through the hollow peaks to those who listen. The world speaks softly, using rustling leaves and creaking stone to pass down warnings that the modern kingdoms have long since forgotten.',
        location: 'Summit - Secret Chamber',
        enticingLore: 'Vox Echo Umbra Kael Dusk Prism Sigil Orin Wyrd Basalt Jinx Thorn. Nyx Cipher Fyre, using rustling leaves and creaking stone to pass down warnings Lux Morth Aether have long since forgotten.'
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
