export function getSpecialCurrencyFrame(covenant: string): number {
    switch (covenant) {
        case 'snake': return 1;
        case 'phoenix': return 2;
        case 'dragon': return 3;
        default: return 1;
    }
}

export function getRuneFrame(cardType: string): number {
    switch (cardType) {
        case 'boost': return 0;
        case 'unique': return 1;
        case 'base': return 2;
        default: return 2;
    }
}
