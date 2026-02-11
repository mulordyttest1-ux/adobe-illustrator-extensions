
Nếu bạn chỉ copy ra folder khác mà không sửa đổi các mã định danh (ID), Adobe Illustrator sẽ bị "loạn". Nó sẽ không biết nên load bản cũ hay bản mới, và nghiêm trọng hơn, hai bản này sẽ **ghi đè logic của nhau** (conflict) khiến cả hai cùng lỗi.

Để chạy song song "Bản Ổn Định" (Stable) và "Bản Dev" (Beta) trên cùng một máy, bạn cần thực hiện **3 bước sửa đổi bắt buộc** sau đây trên folder mới:

### ---

**Bước 1: Đổi "Căn Cước Công Dân" (Extension ID)**

Illustrator phân biệt extension bằng ID, không phải bằng tên folder.

* **File cần sửa:** CSXS/manifest.xml  
* **Thao tác:**  
  1. Tìm dòng ExtensionBundleId.  
  2. Thêm hậu tố .dev hoặc .v2 vào.  
  3. Tìm dòng Menu Name (tên hiển thị trong menu Window \> Extensions) để đổi tên cho dễ phân biệt.

**Ví dụ:**

XML

\<ExtensionBundleId\>com.dinhson.weddingscripter\</ExtensionBundleId\>  
\<Menu\>Wedding Scripter\</Menu\>

\<ExtensionBundleId\>com.dinhson.weddingscripter.dev\</ExtensionBundleId\>  
\<Menu\>Wedding Scripter (DEV)\</Menu\>

### ---

**Bước 2: Cách ly môi trường JSX (QUAN TRỌNG NHẤT)**

Adobe Illustrator dùng chung một bộ nhớ Global cho tất cả script. Extension cũ của bạn đang dùng biến toàn cục IllustratorBridge. Nếu bản Dev cũng dùng tên này, khi bạn chạy bản Dev, nó sẽ ghi đè code vào bản Stable (hoặc ngược lại).

Bạn cần đổi tên cầu nối (Bridge) trong bản Dev.

**A. Sửa file jsx/illustrator.jsx:**

Tìm dòng:

JavaScript

$.global.IllustratorBridge \= { ... }

Sửa thành (ví dụ thêm chữ Dev):

JavaScript

$.global.IllustratorBridgeDev \= { ... }

**B. Sửa file js/bridge.js:**

Bạn cần bảo code JS gọi đúng cái tên mới vừa đổi ở trên.

Tìm đoạn tạo script gọi xuống Illustrator (khoảng dòng 38-40):

JavaScript

// CŨ  
script \= \`IllustratorBridge.${fnName}('${jsonArg}')\`;

// MỚI (Sửa ở bản copy)  
script \= \`IllustratorBridgeDev.${fnName}('${jsonArg}')\`;

### ---

**Bước 3: Đổi cổng Debug (Để không tranh chấp)**

Nếu bạn định bật chế độ debug cho cả 2 bản cùng lúc, chúng cần 2 cổng khác nhau.

* **File cần sửa:** .debug  
* **Thao tác:** Đổi số cổng (Port) sang số khác.

**Ví dụ:**

XML

\<Host Name\="PHXS" Port\="8088" /\>

\<Host Name\="PHXS" Port\="8099" /\>

### ---

**Tóm tắt việc cần làm cho Folder "Copy"**

| File | Mục đích | Sửa gì? |
| :---- | :---- | :---- |
| CSXS/manifest.xml | Để Illustrator nhận diện đây là tool khác | Thêm đuôi .dev vào BundleId và Extension Name. |
| jsx/illustrator.jsx | Để không làm hỏng logic bản cũ | Đổi IllustratorBridge thành IllustratorBridgeDev. |
| js/bridge.js | Để JS gọi đúng logic bản mới | Đổi chuỗi gọi hàm thành IllustratorBridgeDev... |
| .debug | Để debug được bản mới | Đổi Port 8088 thành 8099\. |
| index.html | Để mắt bạn không nhìn nhầm | Sửa tiêu đề \<h1\> thành "Wedding Pro DEV". |

Sau khi sửa xong, bạn chạy lại file cài đặt (hoặc copy vào thư mục extension), khởi động lại Illustrator. Bạn sẽ thấy 2 mục trong menu Extensions:

1. **Wedding Scripter** (Bản cũ, xài làm việc).  
2. **Wedding Scripter (DEV)** (Bản mới, tha hồ đập đi xây lại).