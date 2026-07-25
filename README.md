# tool-auto-v-p-pro
Office Agent
AI Agent tự động hóa công việc văn phòng — nhận yêu cầu bằng ngôn ngữ tự nhiên, tự lên kế hoạch và thực thi thông qua hệ thống tool mở rộng được.

Mục tiêu dự án
Office Agent là một backend AI Agent có khả năng:

Nhận yêu cầu bằng ngôn ngữ tự nhiên (vd: "Tổng hợp email tuần này thành báo cáo")
Tự phân tích và lập kế hoạch các bước cần làm
Gọi các tool phù hợp (email, spreadsheet, calendar, document...) để hoàn thành task
Kiến trúc tool-based: dễ dàng mở rộng sang các lĩnh vực khác (mạng xã hội, game, kiểm thử phần mềm) mà không cần viết lại phần lõi
✨ Tính năng
[ ] Agent loop: suy nghĩ → gọi tool → quan sát kết quả → phản hồi
[ ] Tool đọc/tóm tắt email (Gmail API)
[ ] Tool đọc/ghi Google Sheets
[ ] Tool tạo/sửa sự kiện lịch (Calendar API)
[ ] Tool tạo báo cáo (Word/PDF)
[ ] Task queue xử lý công việc chạy nền (BullMQ + Redis)
[ ] Scheduled tasks (cron job tự động hóa định kỳ)
[ ] Lưu lịch sử task (PostgreSQL)
