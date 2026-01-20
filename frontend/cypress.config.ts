import { defineConfig } from "cypress";

export default defineConfig({
  e2e: {
    baseUrl: "http://localhost:5175",
    setupNodeEvents(on, _config) {
      on('task', {
        log(message: string) {
          console.log(message);
          return null;
        },
        table(message: unknown[]) {
          console.table(message);
          return null;
        },
      });
    },
    viewportWidth: 1280,
    viewportHeight: 720,
  },
});
