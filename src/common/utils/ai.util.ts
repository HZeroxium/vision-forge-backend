export const generateScriptMessages = (
  rawContent: string,
  style: string,
  language: string,
) => {
  const messages = [
    {
      role: 'system',
      content:
        'Bạn là một trợ lý AI chuyên tạo kịch bản video khoa học hấp dẫn, có khả năng chuyển đổi nội dung khoa học thành một kịch bản lôi cuốn, phù hợp với từng đối tượng khán giả. Bạn có thể điều chỉnh phong cách diễn giải theo yêu cầu của người dùng.',
    },
    {
      role: 'user',
      content: `Tôi cần một kịch bản về ${rawContent}, nhưng phải phù hợp với đối tượng phổ thông, dễ hiểu và hấp dẫn.`,
    },
    {
      role: 'system',
      content:
        'Được rồi! Tôi có thể tạo kịch bản theo nhiều phong cách khác nhau. Bạn muốn tôi trình bày theo hướng **giải thích khoa học rõ ràng** hay **kể một câu chuyện hấp dẫn** để thu hút người xem?',
    },
    {
      role: 'user',
      content:
        'Tôi muốn mở đầu bằng một câu chuyện để tạo sự tò mò, sau đó mới giải thích khoa học.',
    },
    {
      role: 'system',
      content:
        'Ý tưởng hay! Một cách tiếp cận hiệu quả là đặt người xem vào một tình huống thực tế hoặc một câu chuyện có thật liên quan đến {rawContent}. Bạn có muốn tôi sử dụng những ví dụ thực tế hoặc thí nghiệm khoa học để minh họa không?',
    },
    {
      role: 'user',
      content:
        'Đúng vậy, hãy thêm những ví dụ thực tế hoặc thí nghiệm để làm cho kịch bản sinh động hơn.',
    },
    {
      role: 'system',
      content:
        'Tuyệt vời! Tôi cũng có thể sử dụng một phép so sánh để giúp người xem dễ hình dung hơn. Bạn có muốn tôi sử dụng một phép so sánh phổ biến để mô tả {rawContent} không?',
    },
    {
      role: 'user',
      content:
        'Có, tôi muốn một phép so sánh đơn giản nhưng mạnh mẽ, giúp người xem dễ tưởng tượng hơn.',
    },
    {
      role: 'user',
      content: `
      Hãy tổng hợp lại tất cả những nội dung trên thành một kịch bản hoàn chỉnh. Kịch bản cần có:
      1. **Mở đầu**: Một câu chuyện hoặc một tình huống gây tò mò liên quan đến {rawContent}.
      2. **Giải thích khoa học**: Cách ${rawContent} hoạt động, những nguyên lý cơ bản đằng sau nó.
      3. **Ví dụ thực tế / Thí nghiệm**: Những nghiên cứu, khám phá quan trọng liên quan đến {rawContent}.
      4. **Phép so sánh**: Một cách so sánh trực quan giúp người xem dễ hiểu hơn.
      5. **Kết luận**: Ý nghĩa của {rawContent} trong thực tế, ứng dụng của nó, và những điều thú vị liên quan.

      Ngôn ngữ: ${language}
      Phong cách: ${style}
    `,
    },
  ];

  return messages;
};
