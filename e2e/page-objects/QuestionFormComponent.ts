import { type Page, type Locator } from "@playwright/test";

export class QuestionFormComponent {
  readonly page: Page;
  readonly contentInput: Locator;
  readonly authorInput: Locator;
  readonly submitButton: Locator;

  constructor(page: Page) {
    this.page = page;
    this.contentInput = page.getByTestId("question-content-input");
    this.authorInput = page.getByTestId("question-author-input");
    this.submitButton = page.getByTestId("question-submit-button");
  }

  async fillContent(content: string) {
    await this.contentInput.fill(content);
  }

  async fillAuthor(author: string) {
    await this.authorInput.fill(author);
  }

  async submitQuestion() {
    await this.submitButton.click();
  }

  async createQuestion(content: string, author?: string) {
    await this.fillContent(content);
    if (author) {
      await this.fillAuthor(author);
    }
    await this.submitQuestion();
  }

  async isSubmitButtonDisabled(): Promise<boolean> {
    return await this.submitButton.isDisabled();
  }

  async waitForSubmitComplete() {
    await this.page.waitForTimeout(500); // Wait for submission animation/feedback
  }
}
