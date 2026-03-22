import type { AuthConfig } from "../server/plugins/auth.plugin.js";

export class ExpectConditions {
  constructor(private readonly authConfig: AuthConfig) {}

  apiKey(key: string): void {
    this.authConfig.apiKey = key;
  }
}
