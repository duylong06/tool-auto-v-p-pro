/**
 * Planner - hiện tại vòng lặp trong agent.ts (ReAct pattern) đã tự làm
 * việc "lập kế hoạch từng bước" thông qua chính khả năng suy luận của Claude.
 *
 * File này để dành cho GIAI ĐOẠN SAU, khi cần:
 * - Lập kế hoạch phức tạp trước khi thực thi (ví dụ: chia nhỏ 1 yêu cầu
 *   thành nhiều task con, chạy song song một số bước)
 * - Validate kế hoạch trước khi cho agent thực thi (an toàn hơn với
 *   các hành động có rủi ro, ví dụ: gửi email thật, xóa dữ liệu)
 *
 * TODO: implement khi cần - hiện tại chưa dùng, agent.ts đủ cho MVP.
 */

export {};
