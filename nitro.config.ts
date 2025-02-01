//https://nitro.unjs.io/config
export default defineNitroConfig({
  srcDir: "server",
  compatibilityDate: "2025-02-01",
  openAPI: {
    meta: {
      title: "bangumi-app-edge-worker",
    },
    production: "runtime",
  },
  experimental: {
    openAPI: true,
  },
});
