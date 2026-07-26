# tool-auto-v-p-pro
Office Agent
AI Agent tự động hóa công việc văn phòng — nhận yêu cầu bằng ngôn ngữ tự nhiên, tự lên kế hoạch và thực thi thông qua hệ thống tool mở rộng được.

Mục tiêu dự án
Office Agent là một backend AI Agent có khả năng:

Nhận yêu cầu bằng ngôn ngữ tự nhiên (vd: "Tổng hợp email tuần này thành báo cáo").
Tự phân tích và lập kế hoạch các bước cần làm.
Gọi các tool phù hợp (email, spreadsheet, calendar, document...) để hoàn thành task.
Kiến trúc tool-based: dễ dàng mở rộng sang các lĩnh vực khác (mạng xã hội, game, kiểm thử phần mềm) mà không cần viết lại phần lõi.
✨ Tính năng:
[ ] Agent loop: suy nghĩ → gọi tool → quan sát kết quả → phản hồi.
[ ] Tool đọc/tóm tắt email (Gmail API).
[ ] Tool đọc/ghi Google Sheets.
[ ] Tool tạo/sửa sự kiện lịch (Calendar API).
[ ] Tool tạo báo cáo (Word/PDF).
[ ] Task queue xử lý công việc chạy nền (BullMQ + Redis).
[ ] Scheduled tasks (cron job tự động hóa định kỳ).
[ ] Lưu lịch sử task (PostgreSQL).

KIẾN TRÚC TỔNG QUAN
<img width="3644" height="3440" alt="image" src="https://github.com/user-attachments/assets/5e5763f5-3372-4069-b536-33b55651489b" />

LUỒNG SỬ LÝ 1 TASK ( VÍ DỤ )
<img width="4728" height="2168" alt="image" src="https://github.com/user-attachments/assets/3291dd6b-ad05-41d4-a1e5-152a4a488c02" />

🧩 Kiến trúc thư mục
office-agent/
├── src/
│   ├── core/
│   │   ├── agent.ts          # Vòng lặp agent chính
│   │   ├── planner.ts        # Lập kế hoạch từ yêu cầu người dùng
│   │   └── memory.ts         # Lưu ngữ cảnh / lịch sử hội thoại
│   ├── tools/                # Mỗi tool là 1 module độc lập
│   │   ├── base.tool.ts      # Interface chung cho mọi tool
│   │   ├── email.tool.ts
│   │   ├── spreadsheet.tool.ts
│   │   ├── calendar.tool.ts
│   │   └── document.tool.ts
│   ├── queue/                # Xử lý task nền
│   ├── api/                  # REST API layer
│   └── llm/                  # Tích hợp Claude API
├── .env.example
├── package.json
└── README.md
🛠️ Công nghệ sử dụng
Giai đoạn đầu — dùng 1 ngôn ngữ duy nhất để tập trung xây nền tảng vững, tránh học nhiều thứ cùng lúc:

Thành phần	Công nghệ
Ngôn ngữ	TypeScript / Node.js
API Framework	Express.js
Database	PostgreSQL
Cache / Queue	Redis + BullMQ
LLM	Claude API (Tool Use)
Auth	JWT + OAuth 2.0 (Google)
Chiến lược đa ngôn ngữ (polyglot) — chỉ áp dụng khi cần thiết
Kiến trúc tool-based cho phép các module giao tiếp qua REST API / message queue, nên về lý thuyết mỗi tool có thể dùng ngôn ngữ khác nhau. Tuy nhiên, để tránh quá tải khi mới học backend, dự án chỉ tách ngôn ngữ khi có lý do kỹ thuật rõ ràng, không tách chỉ vì muốn "polyglot cho xịn":

Module	Ngôn ngữ	Khi nào cần
Core (agent, planner, API)	Node.js/TypeScript	Luôn dùng — nền tảng chính
Tool văn phòng, social (gọi REST API)	Node.js/TypeScript	Cùng hệ với core, không cần tách
Tool Computer Vision (game không có API)	Python	Khi cần OpenCV/PyTorch — hệ sinh thái CV mạnh hơn hẳn
Tool kiểm thử cần chạy song song nhiều test	Python hoặc Go	Khi cần concurrency mạnh, không bắt buộc
Nguyên tắc: hoàn thiện tốt bằng Node.js/TypeScript trước. Chỉ thêm Python (hoặc ngôn ngữ khác) cho 1 service riêng khi gặp bài toán mà TypeScript không phù hợp (vd: Computer Vision), giao tiếp với core qua REST API đơn giản.

🚀 Roadmap phát triển
Giai đoạn 1 — Agent loop cơ bản + 1 tool đầu tiên (email)
Giai đoạn 2 — Mở rộng tool (Sheets, Calendar, Document) + xử lý lỗi
Giai đoạn 3 — Task queue, scheduled tasks, OAuth thật
Giai đoạn 4 — Mở rộng sang lĩnh vực khác (social media, game, testing) dựa trên kiến trúc tool-based có sẵn
🌐 Tầm nhìn dài hạn: 4 lĩnh vực ứng dụng
Office Agent được thiết kế theo kiến trúc tool-based ngay từ đầu, với mục tiêu cuối cùng là trở thành nền tảng agent đa lĩnh vực. Việc thêm tool cho lĩnh vực mới không cần sửa phần lõi (core/agent.ts, core/planner.ts) — chỉ cần tạo tool mới tuân theo interface chung và đăng ký vào Tool Router.

Lĩnh vực	Ví dụ tool	Trạng thái
🏢 Tự động hóa văn phòng	Email, Spreadsheet, Calendar, Document	🔨 Đang phát triển (giai đoạn 1-3)
📱 Mạng xã hội	Đăng bài, trả lời comment, phân tích tương tác	📋 Kế hoạch
🎮 Game	Điều khiển nhân vật, chơi game turn-based/real-time	📋 Kế hoạch
🧪 Kiểm thử phần mềm	Chạy test tự động, đọc/report kết quả, phát hiện lỗi	📋 Kế hoạch
Cách tiếp cận kỹ thuật cho từng lĩnh vực
Mạng xã hội — gọi trực tiếp API nền tảng (Facebook Graph API, Twitter/X API...) để đăng bài, đọc/trả lời bình luận.

Game — tùy loại game, chọn hướng phù hợp:

Cách tiếp cận	Phù hợp với	Độ khó
Gọi API/SDK của game (turn-based)	Cờ vua, caro, game bài	Dễ
Headless browser control (Playwright/Puppeteer)	Game chạy trên web	Trung bình
Screen capture + Computer Vision	Game không có API, tương tự Claude Computer Use	Khó
Memory reading / game injection	Bot cho game cụ thể	Khó, cần lưu ý ToS
Kiểm thử phần mềm — tool gọi test runner (Jest, Pytest...), đọc log/report, tự động phân tích lỗi và đề xuất fix.

Nguyên tắc chung: mỗi lĩnh vực mới = 1 module tool độc lập, agent core không đổi. Nên hoàn thiện vững lĩnh vực văn phòng trước khi mở rộng, để kiến trúc tool/queue/error-handling đã được kiểm chứng kỹ.

⚙️ Cài đặt & chạy thử
git clone https://github.com/<username>/office-agent.git
cd office-agent
npm install
cp .env.example .env   # điền API key của bạn
npm run dev
📄 License
MIT
