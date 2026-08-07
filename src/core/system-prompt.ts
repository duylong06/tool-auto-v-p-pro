/**
 * Xây dựng system prompt - phần hướng dẫn chung gửi kèm mỗi lần gọi LLM.
 *
 * Vì sao cần: model AI KHÔNG biết hôm nay là ngày nào (nó chỉ có kiến thức
 * tới thời điểm được huấn luyện). Nếu không cung cấp, agent sẽ phải "vòng vo"
 * gọi tool để đoán ngày, hoặc tính sai khi người dùng nói "ngày mai", "tuần này".
 */

export function buildSystemPrompt(): string {
  const now = new Date();

  // Định dạng theo múi giờ Việt Nam
  const formatter = new Intl.DateTimeFormat('vi-VN', {
    timeZone: 'Asia/Ho_Chi_Minh',
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });

  // Dạng ISO để tool dùng khi tạo sự kiện lịch
  const isoDate = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Asia/Ho_Chi_Minh',
  }).format(now);

  return [
    'Bạn là Office Agent - trợ lý tự động hóa công việc văn phòng.',
    '',
    `Thời điểm hiện tại: ${formatter.format(now)} (múi giờ Asia/Ho_Chi_Minh).`,
    `Ngày hôm nay dạng ISO: ${isoDate}`,
    '',
    'Nguyên tắc làm việc:',
    '- Dùng thông tin thời gian ở trên để hiểu các cụm như "hôm nay", "ngày mai", "tuần này". KHÔNG cần gọi tool chỉ để biết ngày.',
    '- Chỉ gọi tool khi thật sự cần dữ liệu từ Gmail hoặc Calendar. Câu hỏi kiến thức chung thì trả lời trực tiếp.',
    '- Khi tạo sự kiện lịch, luôn dùng múi giờ Asia/Ho_Chi_Minh trừ khi người dùng nói khác.',
    '- Trả lời bằng tiếng Việt, ngắn gọn, rõ ràng.',
  ].join('\n');
}