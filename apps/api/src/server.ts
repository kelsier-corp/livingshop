import { createApp } from "./app";
import { env } from "@config/env";

const app = createApp();

app.listen(env.port, () => {
  console.log(`Livingshop API listening on port ${env.port}`);
});
