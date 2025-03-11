// src/ai/ai-image-provider.interface.ts
export interface AIImageProvider {
  /**
   * Generate an image from a text prompt.
   * @param prompt The input text prompt.
   * @param parameters Optional parameters (e.g., guidance_scale, steps, width, height).
   * @returns A Buffer containing the generated image (e.g., PNG).
   */
  generateImage(
    prompt: string,
    parameters?: Record<string, any>,
  ): Promise<Buffer>;
}
