// ai/ai-provider.interface.ts

export interface AIProvider {
  /**
   * Generate text from a prompt
   * @param messages array of messages
   * @returns text string
   */
  generateText(messages: { role: string; content: string }[]): Promise<string>;
}
