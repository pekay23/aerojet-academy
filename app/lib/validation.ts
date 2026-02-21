
export const isValidEmail = (email: string): boolean => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
};

export const sanitizeString = (str: string): string => {
    return str.trim();
};

export const isValidCuid = (id: string): boolean => {
    return /^c[a-z0-9]{24}$/.test(id);
};

export const isValidAmount = (amount: number): boolean => {
    return typeof amount === 'number' && amount >= 0;
};
