import { type Page, type Locator, expect } from "@playwright/test";

export class SessionJoinPage {
  readonly page: Page;
  readonly sessionSlugInput: Locator;
  readonly joinButton: Locator;

  constructor(page: Page) {
    this.page = page;
    this.sessionSlugInput = page.getByTestId("session-slug-input");
    this.joinButton = page.getByTestId("session-join-button");
  }

  async goto() {
    await this.page.goto("/");
  }

  async fillSessionSlug(slug: string) {
    await this.sessionSlugInput.click();
    await this.sessionSlugInput.fill(slug);
    // Use type to simulate real user input for better React state updates
    await this.sessionSlugInput.press("End"); // Move cursor to end to trigger any pending events
  }

  async joinSession() {
    // Wait for button to be enabled before clicking
    await this.joinButton.waitFor({ state: "visible" });
    await expect(this.joinButton).toBeEnabled({ timeout: 3000 });
    await this.joinButton.click();
  }

  async joinSessionWithSlug(slug: string) {
    await this.fillSessionSlug(slug);
    await this.joinSession();
  }

  async waitForNavigation() {
    await this.page.waitForURL(/\/session\/.+/);
  }

  async isJoinButtonDisabled(): Promise<boolean> {
    return await this.joinButton.isDisabled();
  }

  async isJoinButtonEnabled(): Promise<boolean> {
    return await this.joinButton.isEnabled();
  }
}
