Giải mã Thuật toán tính Lề (Margin Algorithm)
Dưới đây là cách hệ thống xử lý khi bạn có một danh sách dài các yêu cầu lề hỗn độn.

Ví dụ cho Cạnh Trái (Left) của bạn:

Baseline (An toàn): 3mm, 4mm, 5mm.
Structural (Cấu trúc): 3mm, 4mm, 5mm.
Additive (Cộng thêm): 3mm, 4mm, 5mm.
Bước 1: Sàn đấu "Ai lớn nhất?" (Max)
Hệ thống sẽ gom tất cả Baseline và Structural lại để thi đấu. Kẻ lớn nhất sẽ chiến thắng.

Nhóm 1 (Base/Struct): [3, 4, 5, 3, 4, 5].
Người chiến thắng (Max): 5mm.
Tại sao: Dù bạn muốn an toàn 3mm, nhưng cấu trúc rãnh xé yêu cầu 5mm thì bắt buộc phải theo cái lớn nhất (5mm) để không bị hỏng sản phẩm.
Bước 2: Phép cộng dồn (Sum)
Hệ thống gom tất cả Additive lại và cộng tổng.

Nhóm 2 (Additive): [3, 4, 5].
Tổng cộng thêm (Total Add): 3 + 4 + 5 = 12mm.
Tại sao: Gáy, Keo, Bù xéo... là những thứ đắp thêm vào vật lý. Gáy dày 3mm + lớp keo 4mm thì tổng cộng nó chiếm mất 7mm không gian. Chúng không thể dùng chung chỗ.
Bước 3: Kết quả Final
Lề Cuối Cùng = (Max Base/Struct) + (Total Add)

Kết quả: 5mm + 12mm = 17mm.
📉 Liên quan đến Kích thước Thành phẩm (Finish Size)
Giả sử Thành phẩm (Khung đen Finish Bounds) của bạn là 100mm.

Finish Size (100mm): Là cái vỏ bao ngoài cùng.
Margin (17mm): Là phần thịt bị "ăn bớt" vào trong.
Safe Zone (Vùng in): Là phần lõi còn lại để chứa thiết kế của bạn.
Rộng Safe = 100 - 17 = 83mm.
👉 Quy tắc nhớ nhanh:

Cơ bản & Cấu trúc: Kẻ mạnh nhất thắng (Max).
Cộng thêm: Càng nhiều thì càng dày (Sum).
Kết quả: Càng nhiều lề thì Vùng in (Safe Zone) càng bé 