import { type Page } from "@playwright/test";
import { QuestionFormComponent } from "./QuestionFormComponent";
import { QuestionListComponent } from "./QuestionListComponent";

export class SessionPage {
  readonly page: Page;
  readonly questionForm: QuestionFormComponent;
  readonly questionList: QuestionListComponent;

  constructor(page: Page) {
    this.page = page;
    this.questionForm = new QuestionFormComponent(page);
    this.questionList = new QuestionListComponent(page);
  }

  async goto(slug: string) {
    await this.page.goto(`/session/${slug}`);
  }

  async waitForLoad() {
    await this.page.waitForLoadState("networkidle");
  }

  async getSessionTitle(): Promise<string> {
    const title = await this.page.locator("h1").textContent();
    return title || "";
  }

  async isOnSessionPage(): Promise<boolean> {
    return this.page.url().includes("/session/");
  }
}
