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
  runtimeConfig: {
    dogeAccessKey: process.env.DOGE_ACCESS_KEY,
    dogeSecretKey: process.env.DOGE_SECRET_KEY,
    dogeBucketName: process.env.DOGE_BUCKET_NAME,
  },
});
