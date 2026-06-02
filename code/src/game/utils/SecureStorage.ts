const GAME_PREFIXES = ['glossary_', 'items_', 'bestiary_', 'locations_'];
const KEY_SALT = "gLoSsArY_kEy_sEcrEt_2026";
const VALUE_SALT = "gLoSsArY_vAlUe_sEcrEt_2026";

function isGameKey(key: string): boolean {
    return GAME_PREFIXES.some(prefix => key.startsWith(prefix));
}

function obfuscateKey(key: string): string {
    let hash1 = 0;
    const saltedKey = key + KEY_SALT;
    for (let i = 0; i < saltedKey.length; i++) {
        hash1 = (hash1 << 5) - hash1 + saltedKey.charCodeAt(i);
        hash1 |= 0;
    }
    const hashStr1 = Math.abs(hash1).toString(16).padStart(8, '0');

    let hash2 = 5381;
    for (let i = 0; i < saltedKey.length; i++) {
        hash2 = ((hash2 << 5) + hash2) + saltedKey.charCodeAt(i);
        hash2 |= 0;
    }
    const hashStr2 = Math.abs(hash2).toString(16).padStart(8, '0');

    return `gls_${hashStr1}${hashStr2}`;
}

function simpleChecksum(str: string): number {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
        hash = (hash << 5) - hash + str.charCodeAt(i);
        hash |= 0;
    }
    return hash;
}

function mulberry32(a: number) {
    return function() {
        let t = a += 0x6D2B79F5;
        t = Math.imul(t ^ (t >>> 15), t | 1);
        t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
        return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
}

function encryptValue(key: string, value: string): string {
    const rawData = JSON.stringify({
        val: value,
        ts: Date.now(),
        chk: simpleChecksum(value + VALUE_SALT)
    });

    const utf8Bytes = new TextEncoder().encode(rawData);
    const seed = simpleChecksum(key + VALUE_SALT);
    const random = mulberry32(seed);

    const encryptedBytes = new Uint8Array(utf8Bytes.length);
    for (let i = 0; i < utf8Bytes.length; i++) {
        const keyChar = Math.floor(random() * 256);
        encryptedBytes[i] = utf8Bytes[i] ^ keyChar;
    }

    let binary = '';
    const len = encryptedBytes.byteLength;
    for (let i = 0; i < len; i++) {
        binary += String.fromCharCode(encryptedBytes[i]);
    }
    return window.btoa(binary);
}

function decryptValue(key: string, encrypted: string): string | null {
    try {
        const binary = window.atob(encrypted);
        const len = binary.length;
        const bytes = new Uint8Array(len);
        for (let i = 0; i < len; i++) {
            bytes[i] = binary.charCodeAt(i);
        }

        const seed = simpleChecksum(key + VALUE_SALT);
        const random = mulberry32(seed);
        for (let i = 0; i < len; i++) {
            const keyChar = Math.floor(random() * 256);
            bytes[i] = bytes[i] ^ keyChar;
        }

        const rawData = new TextDecoder().decode(bytes);
        const parsed = JSON.parse(rawData);
        if (parsed && typeof parsed === 'object' && 'val' in parsed && 'chk' in parsed) {
            const expectedChk = simpleChecksum(parsed.val + VALUE_SALT);
            if (parsed.chk === expectedChk) {
                return parsed.val;
            }
        }
    } catch (e) {
        // Return null if signature or parsing fails
    }
    return null;
}

// 1. Perform Migration for existing unencrypted keys
try {
    const keysToMigrate: string[] = [];
    for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && isGameKey(key)) {
            keysToMigrate.push(key);
        }
    }

    for (const key of keysToMigrate) {
        const val = localStorage.getItem(key);
        if (val !== null) {
            const obsKey = obfuscateKey(key);
            if (localStorage.getItem(obsKey) === null) {
                const encVal = encryptValue(key, val);
                localStorage.setItem(obsKey, encVal);
            }
            localStorage.removeItem(key);
        }
    }
} catch (e) {
    console.error("[SecureStorage] Migration failed:", e);
}

// 2. Wrap prototype functions
const originalGetItem = Storage.prototype.getItem;
const originalSetItem = Storage.prototype.setItem;
const originalRemoveItem = Storage.prototype.removeItem;

Storage.prototype.getItem = function(key: string): string | null {
    if (isGameKey(key)) {
        const obsKey = obfuscateKey(key);
        const rawVal = originalGetItem.call(this, obsKey);
        if (rawVal === null) return null;
        return decryptValue(key, rawVal);
    }
    return originalGetItem.call(this, key);
};

Storage.prototype.setItem = function(key: string, value: string): void {
    if (isGameKey(key)) {
        const obsKey = obfuscateKey(key);
        const encVal = encryptValue(key, value);
        originalSetItem.call(this, obsKey, encVal);
    } else {
        originalSetItem.call(this, key, value);
    }
};

Storage.prototype.removeItem = function(key: string): void {
    if (isGameKey(key)) {
        const obsKey = obfuscateKey(key);
        originalRemoveItem.call(this, obsKey);
    } else {
        originalRemoveItem.call(this, key);
    }
};
