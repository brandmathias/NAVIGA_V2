export type FonnteRecipient = { target: string; message: string };
export type FonnteQueueResult = { accepted: number; reference?: string; unavailable?: true };

export function getFonnteStatus(): { enabled: boolean };
export function queueFonnteMessages(options: {
  recipients: FonnteRecipient[];
  fetchImpl?: typeof fetch;
}): Promise<FonnteQueueResult>;
