export type FonnteRecipient = { target: string; message: string };

export function getFonnteStatus(): { enabled: boolean };
export function queueFonnteMessages(options: {
  recipients: FonnteRecipient[];
  fetchImpl?: typeof fetch;
}): Promise<{ accepted: number; reference?: string }>;
