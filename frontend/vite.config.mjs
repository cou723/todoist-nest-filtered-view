// vite.config.mjs
import { defineConfig } from 'vite';
import { minifyHTMLLiterals } from 'minify-html-literals';

/**
 * Vite用 minify-html-literals プラグイン
 */
function minifyHtmlLiteralsPlugin() {
  return {
    name: 'minify-html-literals',
    enforce: 'post',
    transform(code, id) {
      // JS/TSファイルのみ対象
      if (!id.match(/\.[cm]?[jt]sx?$/)) return null;
      const result = minifyHTMLLiterals(code);
      return result;
    }
  };
}

export default defineConfig(({ mode }) => ({
  plugins: [
    ...(mode === 'production' ? [minifyHtmlLiteralsPlugin()] : [])
  ],
  build: {
    rollupOptions:{
      output:{
        manualChunks(id) {
          if (id.includes('node_modules')) {
            return id.toString().split('node_modules/')[1].split('/')[0];
          }
        }
      }
    }
  }
}));