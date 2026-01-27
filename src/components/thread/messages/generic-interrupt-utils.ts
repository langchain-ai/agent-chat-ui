
export function isComplexValue(value: any): boolean {
    return Array.isArray(value) || (typeof value === "object" && value !== null);
}

export function isUrl(value: any): boolean {
    if (typeof value !== "string") return false;
    try {
        return /^https?:\/\/[^\s/$.?#].\S*$/i.test(value);
    } catch {
        return false;
    }
}
