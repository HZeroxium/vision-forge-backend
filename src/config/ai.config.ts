// src/config/ai.config.ts
export default () => ({
  huggingFace: {
    apiKey: process.env.HUGGINGFACE_API_KEY || 'your-huggingface-api-key',
    model: process.env.HUGGINGFACE_MODEL || 'meta-llama/Llama-3.2-3B-Instruct',
    temperature:
      parseFloat(process.env.HUGGINGFACE_TEMPERATURE || '0.7') || 0.7,
    maxTokens: parseInt(process.env.HUGGINGFACE_MAX_TOKENS || '50') || 50,
    topP: parseFloat(process.env.HUGGINGFACE_TOP_P || '0.9') || 0.9,
  },
});
