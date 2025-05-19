import { defineConfig, type UserConfig } from 'vite';
import webExtension from 'vite-plugin-web-extension';

export default defineConfig(({ mode }) => {
  const isProduction = mode === 'production';

  const baseConfig: UserConfig = {
    plugins: [webExtension()],
    build: {
      sourcemap: true, // Keep sourcemaps for both, can be adjusted
    },
  };

  if (isProduction) {
    return {
      ...baseConfig,
      build: {
        ...baseConfig.build,
        // Production-specific settings (default Vite behavior)
        minify: 'esbuild', // or true
        // rollupOptions: { /* production specific rollup options if any */ },
      },
    };
  } else {
    // Development-specific settings
    return {
      ...baseConfig,
      build: {
        ...baseConfig.build,
        minify: false,
        rollupOptions: {
          output: {
            format: 'iife',
            inlineDynamicImports: true,
          },
        },
      },
    };
  }
});
