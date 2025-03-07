// common/utils/ai.utils.ts

// Helper function to create a message object
const buildMessage = (role: string, content: string) => ({ role, content });

/**
 * Generates a detailed chat history for script creation.
 * Applies advanced prompt engineering techniques (Chain of Thought, Few-shot, Zero-shot)
 * and enforces a maximum token limit for optimal content generation.
 * OUTPUT format: { section: string, content: string } for each part.
 */
export const generateScriptMessages = (
  rawContent: string,
  style: string,
  language: string,
  maxTokens: number,
) => {
  const messages = [
    buildMessage(
      'system',
      `Bạn là một trợ lý AI chuyên tạo kịch bản video khoa học hấp dẫn, chi tiết và dễ hiểu, sử dụng các kỹ thuật như Chain of Thought, Few-shot và Zero-shot. Sử dụng tối đa ${maxTokens} tokens để đảm bảo nội dung vừa đủ và có ý nghĩa.`,
    ),
    buildMessage(
      'user',
      `Tôi cần một kịch bản chi tiết về "${rawContent}" dành cho đối tượng phổ thông, đảm bảo tính rõ ràng và hấp dẫn.`,
    ),
    buildMessage(
      'system',
      'Hãy bắt đầu bằng việc đưa ra một chain of thought để phân tích yêu cầu, xác định các yếu tố chính và chia nhỏ nội dung kịch bản.',
    ),
    buildMessage(
      'user',
      'Hãy tạo phần mở đầu với một câu chuyện thực tế gây tò mò và hấp dẫn khán giả, đảm bảo định dạng OUTPUT: { section: string, content: string }.',
    ),
    buildMessage(
      'system',
      'Tiếp theo, phân đoạn kịch bản thành các phần: Giới thiệu, Giải thích khoa học, Ví dụ thực tế, và Kết luận. Mỗi phần phải theo định dạng OUTPUT: { section: string, content: string }.',
    ),
    buildMessage(
      'user',
      `Hãy đảm bảo rằng toàn bộ kịch bản xuất ra có định dạng OUTPUT đã quy định và sử dụng tối đa ${maxTokens} tokens cho toàn bộ nội dung.`,
    ),
    buildMessage(
      'system',
      `Sử dụng phong cách "${style}" và viết toàn bộ kịch bản bằng tiếng ${language}.`,
    ),
    buildMessage(
      'user',
      'Hãy giải thích cặn kẽ từng bước, cung cấp ví dụ minh họa cụ thể cho mỗi phần nếu cần, và đảm bảo nội dung không vượt quá giới hạn token.',
    ),
    buildMessage(
      'system',
      'Kết hợp tất cả các chỉ dẫn trên, đảm bảo kịch bản hoàn chỉnh, tối ưu và có tính liên tục cao, sử dụng các kỹ thuật prompt engineering tiên tiến.',
    ),
    buildMessage(
      'user',
      'Hãy tổng hợp lại tất cả nội dung trên thành một kịch bản hoàn chỉnh theo định dạng OUTPUT đã quy định.',
    ),
  ];

  return messages;
};

/**
 * Summarizes a generated script into concise visual prompts for image creation.
 * Applies advanced prompt engineering techniques and enforces a maximum token limit.
 * OUTPUT format: A JSON object with a key "prompts" containing an array of objects,
 * each with keys "scene" and "prompt". The final output MUST strictly follow this format.
 */
export const summarizeScriptToImagePrompts = (
  scriptContent: string,
  language: string,
  style: string,
  maxTokens: number,
  numPrompts: number,
) => {
  const messages = [
    // 1. Define AI role: Convert the original script into an array of plain text prompts.
    buildMessage(
      'system',
      `Bạn là trợ lý AI chuyên tóm tắt nội dung kịch bản thành các prompt tạo ảnh. Bạn cần chuyển đổi nội dung kịch bản ban đầu thành một mảng các prompt dạng text, không dùng định dạng JSON, markdown hay ký tự đặc biệt. Mỗi prompt phải bắt đầu bằng "Tạo ảnh ..." và không có chi tiết thừa. Output phải có dạng: [Prompt1, Prompt2, Prompt3, ...].`,
    ),
    // 2. Instruct to use advanced techniques and token limits.
    buildMessage(
      'system',
      `Sử dụng kỹ thuật Chain of Thought, Few-shot và Zero-shot với giới hạn tối đa ${maxTokens} tokens để đảm bảo nội dung súc tích, chính xác và đầy đủ.`,
    ),
    // 3. Provide the original script content.
    buildMessage('user', `Tóm tắt kịch bản sau: "${scriptContent}"`),
    // 4. Analyze visual elements: colors, space, characters, and background.
    buildMessage(
      'system',
      'Phân tích các yếu tố trực quan như màu sắc, không gian, nhân vật và bối cảnh; chỉ giữ lại những thông tin quan trọng để tạo prompt.',
    ),
    // 5. Specify the desired language and style.
    buildMessage(
      'user',
      `Viết các prompt theo phong cách "${style}" và bằng tiếng ${language}.`,
    ),
    // 6. Instruct that output must be plain text prompts only.
    buildMessage(
      'system',
      'Chỉ xuất ra các prompt dạng text, không sử dụng định dạng JSON, markdown hay các ký tự đặc biệt khác.',
    ),
    // 7. Request that each prompt describes a specific scene in detail.
    buildMessage(
      'user',
      'Hãy đảm bảo mỗi prompt là một mô tả chi tiết, ngắn gọn nhưng đủ ý về một cảnh cụ thể trong kịch bản, bắt đầu với "Tạo ảnh ...".',
    ),
    // 8. Emphasize the required output format.
    buildMessage(
      'system',
      'Output cuối cùng phải có dạng: "Prompt1, Prompt2, Prompt3, ..." với mỗi Prompt chỉ là một câu văn mô tả cảnh.',
    ),
    // 9. Introduce the need for 5 diverse, detailed examples.
    buildMessage(
      'system',
      'Đưa ra 5 ví dụ cụ thể để hướng dẫn cách tạo prompt. Mỗi ví dụ sẽ là: "Đối với kịch bản <Nội dung kịch bản> thì OUTPUT sẽ có dạng là [a, b, c, ...]."',
    ),
    // 10. Example 1: Not only about the Sun.
    buildMessage(
      'system',
      'Ví dụ 1: Đối với kịch bản "Mặt Trời", OUTPUT sẽ có dạng là "Tạo ảnh Mặt Trời rực rỡ với ánh sáng vàng chói", "Tạo ảnh Mặt Trời với nhiệt độ bề mặt 5.500 độ C", "Tạo ảnh Mặt Trời với nền không gian vũ trụ rộng lớn".',
    ),
    // 11. Example 2: A modern cityscape.
    buildMessage(
      'system',
      'Ví dụ 2: Đối với kịch bản "Thành phố hiện đại", OUTPUT sẽ có dạng là "Tạo ảnh thành phố hiện đại với ánh đèn neon rực rỡ", "Tạo ảnh các tòa nhà chọc trời cao vút", "Tạo ảnh giao thông sôi động về đêm".',
    ),
    // 12. Example 3: A tropical forest.
    buildMessage(
      'system',
      'Ví dụ 3: Đối với kịch bản "Rừng nhiệt đới", OUTPUT sẽ có dạng là "Tạo ảnh rừng nhiệt đới với cây cối xanh tươi", "Tạo ảnh ánh sáng xuyên qua tán lá", "Tạo ảnh khung cảnh hoang dã và yên bình".',
    ),
    // 13. Example 4: A pristine beach.
    buildMessage(
      'system',
      'Ví dụ 4: Đối với kịch bản "Bãi biển hoang sơ", OUTPUT sẽ có dạng là "Tạo ảnh bãi biển với cát trắng mịn", "Tạo ảnh nước biển trong xanh", "Tạo ảnh bầu trời xanh thẳm và yên bình".',
    ),
    // 14. Example 5: Climate change impact.
    buildMessage(
      'system',
      'Ví dụ 5: Đối với kịch bản "Biến đổi khí hậu", OUTPUT sẽ có dạng là "Tạo ảnh cảnh quan ô nhiễm sau biến đổi khí hậu", "Tạo ảnh thành phố đổ nát và bầu không khí u ám", "Tạo ảnh biểu hiện sự thay đổi mạnh mẽ của môi trường".',
    ),
    // 15. Instruct to use the above examples as guidelines.
    buildMessage(
      'user',
      'Dựa trên 5 ví dụ trên, hãy tạo ra danh sách các prompt cuối cùng mô tả các cảnh chính trong kịch bản.',
    ),
    // 16. Emphasize that the final output must be an array of text prompts.
    buildMessage(
      'system',
      'Đảm bảo output cuối cùng là một mảng các prompt dạng text, mỗi prompt bắt đầu bằng "Tạo ảnh ..." và không chứa các chi tiết thừa.',
    ),
    // 17. Instruct to remove any extra formatting.
    buildMessage(
      'user',
      'Kiểm tra và đảm bảo rằng các prompt không chứa định dạng JSON, markdown hay ký tự đặc biệt nào.',
    ),
    // 18. Instruct to filter out only the necessary information.
    buildMessage(
      'system',
      'Lọc ra các thông tin không cần thiết từ kịch bản, chỉ giữ lại những chi tiết quan trọng để tạo prompt.',
    ),
    // 19. Specify the language and tone clearly.
    buildMessage(
      'user',
      'Hãy sử dụng tiếng Việt với phong cách "phổ thông" cho toàn bộ prompt.',
    ),
    // 20. Final instruction: Compile and output the final list.
    buildMessage(
      'system',
      'Cuối cùng, xuất ra danh sách các prompt cuối cùng dưới dạng một mảng các text, mỗi prompt mô tả chi tiết một cảnh cụ thể và có thể áp dụng trực tiếp để tạo ảnh.',
    ),
    // 21. Enforce the number of prompts to be exactly as specified.
    buildMessage(
      'system',
      `Số lượng prompt cuối cùng phải là chính xác ${numPrompts} với kịch bản nội dung là ${scriptContent}.`,
    ),
  ];

  return messages;
};
