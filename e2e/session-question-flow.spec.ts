import { test, expect } from "@playwright/test";
import { SessionJoinPage, SessionPage } from "./page-objects";

test.describe("Session Question Flow", () => {
  test.beforeEach(async ({ page }) => {
    // Clear localStorage before each test to ensure clean state
    await page.goto("/");
    await page.evaluate(() => localStorage.clear());
  });

  test("should join session, add question", async ({ page }) => {
    // Arrange
    const sessionSlug = "dudczak";
    const questionContent = `Test question ${Date.now()}`;
    const questionAuthor = "Test User";

    const joinPage = new SessionJoinPage(page);
    const sessionPage = new SessionPage(page);

    // Act - Step 1 & 2: Join session
    await joinPage.goto();
    await joinPage.fillSessionSlug(sessionSlug);

    // Act: Click join button (already waits for enabled state internally)
    await joinPage.joinSession();
    await joinPage.waitForNavigation();

    // Assert: Should be on session page
    expect(await sessionPage.isOnSessionPage()).toBe(true);
    expect(page.url()).toContain(`/session/${sessionSlug}`);

    // Act - Step 3: Add question
    await sessionPage.questionForm.createQuestion(questionContent, questionAuthor);
    await sessionPage.questionForm.waitForSubmitComplete();

    // Assert: Form should be cleared after submission
    await expect(sessionPage.questionForm.contentInput).toHaveValue("");

    // Act - Step 4: Find and upvote the question
    await sessionPage.questionList.waitForQuestionsToLoad();
    const addedQuestion = await sessionPage.questionList.getQuestionByContent(questionContent);

    // Assert: Question should exist
    expect(addedQuestion).not.toBeNull();
  });

  test("should not allow joining with empty slug", async ({ page }) => {
    // Arrange
    const joinPage = new SessionJoinPage(page);

    // Act
    await joinPage.goto();

    // Assert: Button should be disabled with empty slug
    await expect(joinPage.joinButton).toBeDisabled();
  });

  test("should not allow joining with slug shorter than 3 characters", async ({ page }) => {
    // Arrange
    const joinPage = new SessionJoinPage(page);

    // Act
    await joinPage.goto();
    await joinPage.fillSessionSlug("ab");

    // Assert: Button should be disabled
    await expect(joinPage.joinButton).toBeDisabled();
  });

  test("should not allow submitting empty question", async ({ page }) => {
    // Arrange
    const sessionSlug = "dudczak";
    const joinPage = new SessionJoinPage(page);
    const sessionPage = new SessionPage(page);

    // Act: Navigate to session
    await joinPage.goto();
    await joinPage.joinSessionWithSlug(sessionSlug);
    await joinPage.waitForNavigation();

    // Assert: Submit button should be enabled initially
    await expect(sessionPage.questionForm.submitButton).toBeEnabled();

    // Act: Try to submit with empty content
    await sessionPage.questionForm.submitQuestion();

    // Assert: Should still be on the same page (no navigation)
    expect(await sessionPage.isOnSessionPage()).toBe(true);
  });
});
