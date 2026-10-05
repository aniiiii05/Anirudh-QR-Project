import { defineConfig, loadEnv, type Plugin, type ViteDevServer } from "vite";
import react from "@vitejs/plugin-react-swc";
import type { IncomingMessage, ServerResponse } from "node:http";
import path from "path";

/**
 * Development only: answers the server routes with the real handlers in api/,
 * loaded through Vite's SSR module loader, so /q, /contact.vcf and
 * /api/contact behave in `npm run dev` as they do on Vercel.
 * Production uses vercel.json + Vercel functions (or scripts/local-vercel.mjs
 * for a local emulation of both).
 */
const DEV_ROUTES: Record<string, string> = {
  "/q": "/api/q.ts",
  "/api/q": "/api/q.ts",
  "/contact.vcf": "/api/vcard.ts",
  "/api/vcard": "/api/vcard.ts",
  "/api/contact": "/api/contact.ts",
};

type Handler = (req: IncomingMessage, res: ServerResponse) => unknown;

function devFunctions(mode: string): Plugin {
  return {
    name: "card-dev-functions",
    apply: "serve",
    configureServer(server: ViteDevServer) {
      // Server-side settings (never exposed to the client bundle): .env values
      // are copied into process.env for the handlers only.
      const env = loadEnv(mode, process.cwd(), "");
      for (const key of [
        "SITE_ORIGIN",
        "CONTACT_ENABLED",
        "RESEND_API_KEY",
        "CONTACT_TO",
        "CONTACT_FROM",
        "UPSTASH_REDIS_REST_URL",
        "UPSTASH_REDIS_REST_TOKEN",
        "RATE_LIMIT_SECRET",
        "RATE_LIMIT_MAX",
        "RATE_LIMIT_WINDOW_SECONDS",
        "RATE_LIMIT_GLOBAL_MAX",
        "RATE_LIMIT_GLOBAL_WINDOW_SECONDS",
        "PRIVACY_NOTICE_VERSION",
      ])
        if (process.env[key] === undefined && env[key] !== undefined)
          process.env[key] = env[key];

      server.middlewares.use(async (req, res, next) => {
        const pathname = (req.url ?? "/").split("?")[0];
        const file = DEV_ROUTES[pathname];
        if (!file) return next();
        try {
          const mod = (await server.ssrLoadModule(file)) as { default: Handler };
          await mod.default(req, res);
        } catch (error) {
          server.config.logger.error(
            `[card-dev-functions] ${pathname} failed: ${(error as Error).message}`,
          );
          if (!res.headersSent) {
            res.statusCode = 500;
            res.setHeader("Content-Type", "text/plain; charset=utf-8");
          }
          res.end("Function failed");
        }
      });
    },
  };
}

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => ({
  server: {
    // Loopback only: the dev middleware runs real handlers with .env values.
    // For LAN testing, opt in with `npm run dev -- --host`.
    host: "127.0.0.1",
    port: 8080,
    hmr: {
      overlay: false,
    },
  },
  plugins: [react(), devFunctions(mode)],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
}));
