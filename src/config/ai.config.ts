// src/config/ai.config.ts
export default () => ({
  huggingFace: {
    apiKey: process.env.HUGGINGFACE_API_KEY || 'your-huggingface-api-key',
    textGeneration: {
      model:
        process.env.HUGGINGFACE_TEXT_MODEL ||
        'meta-llama/Llama-3.2-3B-Instruct',
      temperature:
        parseFloat(process.env.HUGGINGFACE_TEMPERATURE || '0.7') || 0.7,
      maxTokens: parseInt(process.env.HUGGINGFACE_MAX_TOKENS || '50') || 50,
      topP: parseFloat(process.env.HUGGINGFACE_TOP_P || '0.9') || 0.9,
    },
    textToImage: {
      model:
        process.env.HUGGINGFACE_IMAGE_MODEL || 'black-forest-labs/FLUX.1-dev',
      guidanceScale: parseFloat(
        process.env.HUGGINGFACE_GUIDANCE_SCALE ?? '7.5',
      ),
      negativePrompt: process.env.HUGGINGFACE_NEGATIVE_PROMPT ?? '',
      numInferenceSteps: parseInt(
        process.env.HUGGINGFACE_INFERENCE_STEPS ?? '5',
      ),
      width: parseInt(process.env.HUGGINGFACE_IMAGE_WIDTH ?? '512'),
      height: parseInt(process.env.HUGGINGFACE_IMAGE_HEIGHT ?? '512'),
    },
  },
});
