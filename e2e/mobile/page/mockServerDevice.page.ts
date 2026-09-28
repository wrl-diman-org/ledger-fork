import { Step } from "jest-allure2-reporter/api";
import { MockServerSessionHandle } from "@ledgerhq/live-e2e-shared/mockServer/session";

const PROMPT_VISIBLE_TIMEOUT_MS = 60_000;
const PROMPT_HIDDEN_POLL_MS = 400;

export class MockServerDevicePage extends MockServerSessionHandle {
  @Step("Confirm the open device prompt")
  async confirmDeviceIntent(testId: string) {
    const prompt = element(by.id(testId));
    await waitFor(prompt).toBeVisible().withTimeout(PROMPT_VISIBLE_TIMEOUT_MS);
    await this.approvePromptsUntil(async () => {
      try {
        await waitFor(prompt).not.toBeVisible().withTimeout(PROMPT_HIDDEN_POLL_MS);
        return true;
      } catch {
        return false;
      }
    });
  }
}
