import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: ['./src/test-setup.ts'],
    coverage: {
      enabled: true,
      reporter: ['text', 'lcov'], // 'text' prints to console, 'lcov' for HTML report
      reportsDirectory: './coverage',
      all: true, // Show coverage for all modules, not just those tested
      include: ['src/**/*.ts', 'src/**/*.tsx'],
      exclude: [
        'src/background.ts',
        'src/contentScript.ts',
        'src/popup.tsx',
        'src/ui/**', // Exclude the entire ui directory
        'src/**/__testdata__/**', // Exclude test data
        'src/**/*.test.ts', // Exclude test files themselves
        'src/**/*.test.tsx',
        'src/vite-env.d.ts', // Exclude vite env declaration
      ],
      provider: 'v8', // Use the V8 provider for coverage
    },
  },
});
