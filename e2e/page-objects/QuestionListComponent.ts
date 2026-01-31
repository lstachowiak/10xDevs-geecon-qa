import { type Page, type Locator, expect } from "@playwright/test";

export class QuestionListComponent {
  readonly page: Page;
  readonly questionsList: Locator;

  constructor(page: Page) {
    this.page = page;
    this.questionsList = page.getByTestId("questions-list");
  }

  getQuestionItems(): Locator {
    return this.page.getByTestId("question-item");
  }

  async getQuestionsCount(): Promise<number> {
    return await this.getQuestionItems().count();
  }

  async getQuestionByIndex(index: number): QuestionItemComponent {
    const questionItem = this.getQuestionItems().nth(index);
    const questionId = await questionItem.getAttribute("data-question-id");
    if (!questionId) {
      throw new Error(`Question at index ${index} does not have data-question-id attribute`);
    }
    return new QuestionItemComponent(this.page, questionId);
  }

  async getQuestionByContent(content: string): QuestionItemComponent | null {
    const questions = await this.getQuestionItems().all();
    
    for (const question of questions) {
      const text = await question.textContent();
      if (text?.includes(content)) {
        // Get the question ID to create a stable locator
        const questionId = await question.getAttribute("data-question-id");
        if (questionId) {
          return new QuestionItemComponent(this.page, questionId);
        }
      }
    }
    
    return null;
  }

  async waitForQuestionsToLoad() {
    await this.questionsList.waitFor({ state: "visible" });
  }
}

export class QuestionItemComponent {
  readonly page: Page;
  readonly questionId: string;
  
  // Dynamic locators that will always find the current element by ID
  get container(): Locator {
    return this.page.locator(`[data-question-id="${this.questionId}"]`);
  }
  
  get upvoteButton(): Locator {
    return this.container.getByTestId("question-upvote-button");
  }
  
  get upvoteCount(): Locator {
    return this.container.getByTestId("question-upvote-count");
  }

  constructor(page: Page, questionId: string) {
    this.page = page;
    this.questionId = questionId;
  }

  async upvote() {
    await this.upvoteButton.click();
  }

  async getUpvoteCount(): Promise<number> {
    const text = await this.upvoteCount.textContent();
    return parseInt(text || "0", 10);
  }

  async isUpvoted(): Promise<boolean> {
    // Check if button has "default" variant (upvoted state)
    const variant = await this.upvoteButton.getAttribute("data-variant");
    return variant === "default";
  }

  async isUpvoteButtonDisabled(): Promise<boolean> {
    return await this.upvoteButton.isDisabled();
  }

  async getContent(): Promise<string> {
    const text = await this.container.textContent();
    return text || "";
  }

  async waitForUpvoteComplete() {
    // Wait for the upvote count to change in the DOM
    await this.page.waitForTimeout(500);
  }

  async waitForUpvoteCountToBe(expectedCount: number) {
    // Use Playwright's expect with retry logic
    await expect(this.upvoteCount).toHaveText(expectedCount.toString(), { timeout: 5000 });
  }
}
