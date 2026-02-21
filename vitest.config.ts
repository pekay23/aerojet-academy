import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import { resolve } from 'path';

export default defineConfig({
    plugins: [react()],
    test: {
        environment: 'jsdom',
        globals: true,
        setupFiles: ['./vitest.setup.ts'],
        alias: {
            '@/components': resolve(__dirname, './app/components'),
            '@/app': resolve(__dirname, './app'),
            '@': resolve(__dirname, './')
        }
    },
});
