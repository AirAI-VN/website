/* English / Vietnamese switch.
   English lives in the HTML itself and is read from the page on load. Vietnamese lives here.
   Elements carry data-i18n="key" (inner HTML) or data-i18n-attr="attr:key" (an attribute).
   The choice is remembered per browser. Runs before main.js, which listens for "langchange". */
(function () {
  'use strict';

  var VI = {
    'meta.title': 'AirAI | Điều khiển dự báo cho hệ thống HVAC văn phòng Hà Nội',
    'meta.desc': 'AirAI bổ sung lớp ra quyết định AI dự báo, cùng lớp chấp hành mà hầu hết tòa nhà còn thiếu, cho hệ thống HVAC hiện có tại các tòa văn phòng Hà Nội. Mục tiêu: giảm chi phí vận hành và giảm phát thải.',

    'skip': 'Chuyển đến nội dung',
    'nav.home': 'AirAI, về đầu trang',
    'nav.aria': 'Điều hướng chính',
    'nav.problem': 'Vấn đề',
    'nav.solution': 'Giải pháp',
    'nav.product': 'Sản phẩm',
    'nav.impact': 'Tác động',
    'nav.faq': 'Hỏi đáp',
    'nav.about': 'Về chúng tôi',
    'nav.cta': 'Hợp tác',
    'lang.aria': 'Ngôn ngữ',
    'menu.open': 'Mở menu',
    'menu.close': 'Đóng menu',
    'cta.partner': 'Hợp tác với chúng tôi',

    'hero.title': '<span class="c-sky">Lớp AI</span> giữa<br> <span class="c-amber">BMS của bạn</span> và<br> <span class="c-amber">hóa đơn tiền điện</span>',
    'hero.cue': 'Cuộn',
    'hero.cue.aria': 'Cuộn xuống phần vấn đề',

    'opener.title': 'Các tòa văn phòng Hà Nội đang trả tiền để làm mát và lọc khí cho những không gian không có ai.',
    'opener.lede': 'HVAC là phần chi phí năng lượng có thể kiểm soát lớn nhất của một tòa văn phòng Hà Nội, nhưng vẫn chạy theo lịch cố định, không phân biệt tầng đang kín người hay bỏ trống.',
    'opener.how': 'Xem cách hoạt động',

    'problem.title': 'Tòa nhà đã có sẵn phần cứng. Thứ còn thiếu là trí tuệ để vận hành nó.',
    'problem.lede': 'Giá điện ngày càng tăng, mục tiêu khí hậu ngày càng khắt khe, nhưng hầu hết hệ thống điều hòa vẫn chạy như nhau dù tầng trống hay đầy người.',
    'problem.img': 'Dãy dàn nóng điều hòa trên mái một tòa nhà trong thành phố',
    'fig1.num': '105,9',
    'fig1.text': 'kWh/m² mỗi năm, mức tiêu thụ năng lượng trung bình của một tòa văn phòng Hà Nội',
    'fig2.text': 'trong số đó ước tính dành riêng cho HVAC',
    'fig3.text': 'mức tăng giá điện kinh doanh của EVN từ đầu năm 2023',
    'problem.source': 'Nguồn: Hoang và cộng sự (2022), khảo sát các tòa văn phòng tại Hà Nội; Tuoi Tre News (2025).',

    'solution.title': 'Chúng tôi không thay thế hệ thống HVAC của bạn. Chúng tôi giúp nó tự vận hành thông minh.',
    'solution.lede': 'Hầu hết phần mềm “tòa nhà thông minh” chỉ dừng ở khuyến nghị. AirAI khép kín vòng điều khiển đến tận thiết bị.',
    'step1.title': 'Cảm biến',
    'step1.text': 'Dữ liệu thời gian thực về số người, nhiệt độ và CO<sub>2</sub> ở từng khu vực, cùng cảm biến dòng điện (CT) xác nhận thiết bị đã thực sự phản hồi.',
    'step2.title': 'Ra quyết định',
    'step2.text': 'Máy học (LSTM, XGBoost) dự báo nhu cầu nhiệt của từng khu vực; Điều khiển dự báo theo mô hình (MPC) đặt van, tốc độ quạt và nhiệt độ cài đặt trước khi nhu cầu lên đỉnh.',
    'step3.title': 'Chấp hành',
    'step3.text': 'Lệnh được thực thi trực tiếp trên thiết bị: qua BMS nếu tòa nhà đã có, hoặc qua bộ chấp hành do AirAI lắp đặt nếu chưa có.',
    'step.hintHover': 'Rê chuột để xem thêm',
    'step.hintTap': 'Chạm để xem thêm',
    'step2.accent': 'Hầu hết công cụ tòa nhà thông minh dừng ở bước này.',
    'step3.accent': 'AirAI hành động, rồi xác nhận từng lệnh đã được thực hiện và đưa kết quả vào lần dự báo tiếp theo.',
    'demo.title': 'Xem sự khác biệt trên một tòa nhà.',
    'demo.text': 'Chín tầng, bốn tầng bỏ trống. Chuyển chế độ để xem khí điều hòa đi về đâu.',
    'demo.aria': 'Cách tòa nhà được điều khiển',
    'demo.fixed': 'Lịch cố định',
    'demo.ai': 'Với AirAI',
    'demo.key': '<span class="key key--person" aria-hidden="true"></span>Con người <span class="key key--air" aria-hidden="true"></span>Khí điều hòa <span class="key key--waste" aria-hidden="true"></span>Làm mát lãng phí',
    'viz.cap.fixed': 'Theo lịch cố định, mọi tầng đều được làm mát cả ngày. Các tầng màu hổ phách đang bỏ trống.',
    'viz.cap.ai': 'Với AirAI, luồng khí đi theo con người. Tầng trống giảm về mức thông gió tối thiểu; tầng đông người được ưu tiên.',
    'viz.label.fixed': 'Minh họa tòa văn phòng chín tầng. Theo lịch cố định, khí điều hòa được cấp vào mọi tầng, kể cả bốn tầng bỏ trống.',
    'viz.label.ai': 'Minh họa cùng tòa nhà với AirAI. Khí chủ yếu được cấp cho các tầng có người; bốn tầng trống chỉ nhận mức thông gió tối thiểu.',
    'safe.aria': 'Cơ chế an toàn',
    'safe1.title': 'Chạy chế độ bóng trước',
    'safe1.text': 'AI đưa ra quyết định nhưng chưa thực thi cho đến khi được kiểm chứng trên chính tòa nhà.',
    'safe2.title': 'Dự phòng tại chỗ',
    'safe2.text': 'Gateway tại tòa nhà giữ thiết bị vận hành an toàn nếu mất kết nối đám mây.',
    'safe3.title': 'Tiết kiệm được kiểm chứng độc lập',
    'safe3.text': 'Kiểm toán IPMVP dựa trên đường cơ sở hiệu chỉnh theo thời tiết và mật độ sử dụng, tách tiết kiệm thực khỏi yếu tố ngẫu nhiên.',
    'safe4.title': 'Mã hóa đầu cuối',
    'safe4.text': 'TLS xác thực hai chiều giữa gateway và đám mây.',
    'edge.img': 'Đường ống gió và ống dẫn HVAC cách nhiệt chạy dọc trần văn phòng',
    'edge.title': 'Lớp chấp hành tiếp cận những tòa nhà mà đối thủ không thể.',
    'edge.text': 'Các đối thủ chỉ có phần mềm mặc định tòa nhà đã có bộ chấp hành điện tử. Phần lớn văn phòng Hà Nội vẫn dùng van và cửa gió cơ, khí nén hoặc vận hành thủ công, nên AirAI Full lắp đặt chúng.',
    'proof.intro': 'Mô hình lớp phủ đã được chứng minh ở nước ngoài. Các hệ thống tương tự đã đạt được:',
    'proof.cost': '<span class="proof__num">15 đến 25%</span> giảm chi phí',
    'proof.carbon': '<span class="proof__num">20 đến 40%</span> giảm phát thải carbon',
    'proof.source': 'Nguồn: các nghiên cứu điển hình trong ngành (2020, 2021).',

    'product.title': 'Một lõi AI, hai cách triển khai. Không tòa nhà nào bị bỏ lại.',
    'lite.img': 'Mặt dựng kính văn phòng hiện đại với một ô cửa sổ mở',
    'lite.for': 'Cho tòa nhà có BMS hỗ trợ ghi lệnh',
    'lite.price': '<span class="plan__num">0 đồng</span> trả trước. AirAI chi trả chi phí lắp đặt.',
    'lite.l1': 'Chỉ tích hợp phần mềm, không lắp đặt phần cứng',
    'lite.l2': 'Triển khai nhanh nhất',
    'lite.then': 'Sau đó 300.000 đồng mỗi khu vực mỗi tháng, cộng 15% khoản tiết kiệm đã kiểm chứng.',
    'lite.best': '<strong>Phù hợp nhất</strong> cho tòa nhà đã có cảm biến và bộ chấp hành hoạt động tốt, chỉ cần thêm lớp ra quyết định AI.',
    'full.img': 'Cụm máy làm lạnh trên mái tòa nhà thương mại với đường ống cách nhiệt',
    'full.for': 'Cho tòa nhà chưa có BMS hỗ trợ ghi lệnh, chiếm phần lớn thị trường',
    'full.price': '<span class="plan__num">218,75 triệu</span> đồng phí thiết lập một lần, bằng một nửa chi phí lắp đặt. AirAI chi trả phần còn lại.',
    'full.l1': 'Bổ sung lớp cảm biến và chấp hành mà hầu hết dự án AI cho tòa nhà bỏ qua',
    'full.then': 'Sau đó 800.000 đồng mỗi khu vực mỗi tháng, cộng 15% khoản tiết kiệm đã kiểm chứng.',
    'plans.note': 'Số liệu cho một tòa văn phòng điển hình 15.000 m², 25 khu vực tại Hà Nội. Phí hằng tháng thay đổi theo số khu vực.',
    'full.best': '<strong>Phù hợp nhất</strong> cho phần lớn văn phòng hạng A/B tại Hà Nội, nơi các đối thủ chỉ có phần mềm không thể tiếp cận.',
    'fit.title': 'Dòng sản phẩm nào cho tòa nhà nào',
    'fit.text': 'Mỗi tòa nhà được khảo sát kỹ thuật trong 6 đến 8 tuần trước khi ký hợp đồng: hóa đơn điện 12 tháng, diện tích sàn, cường độ sử dụng năng lượng và kiểm tra toàn bộ cửa gió, bộ chấp hành.',
    'fit.caption': 'Mỗi loại tòa nhà đã có gì và AirAI bổ sung gì',
    'fit.layer': 'Lớp',
    'fit.a': 'Kịch bản A',
    'fit.b': 'Kịch bản B <span class="fit__common">phổ biến nhất</span>',
    'fit.c': 'Kịch bản C',
    'fit.sensing': 'Cảm biến',
    'fit.actuation': 'Chấp hành',
    'fit.ai': 'Lớp ra quyết định AI',
    'fit.deploy': 'Triển khai với',
    'fit.have': '<span class="dot dot--have"></span>Đã có',
    'fit.add': '<span class="dot dot--add"></span>Bổ sung',
    'fit.dA': 'Lite, không chi phí trả trước',
    'fit.dB': 'Full, phí thiết lập 218,75 triệu đồng',
    'fit.dC': 'Full, phí thiết lập khoảng 280 triệu đồng',

    'impact.title': 'Bớt điện lãng phí.<br> Bớt carbon.<br> Tiết kiệm có kiểm chứng.',
    'impact.note': 'Số liệu dự báo từ mô hình, chưa phải kết quả thí điểm.',
    'target.lead': 'Mức cắt giảm điện HVAC dự kiến. Với một tòa văn phòng điển hình 15.000 m² tại Hà Nội, con số này tương đương khoảng 174.735 kWh và 115 tấn CO<sub>2</sub> mỗi năm.',
    'target.note': 'Dựa trên các hệ thống tương tự ở nước ngoài, vốn đã giảm 15 đến 25% chi phí. Mức 20% của chúng tôi là điểm giữa của khoảng đó.',
    'out1.title': 'Ai hưởng khoản tiết kiệm',
    'out1.aria': 'Chủ tòa nhà giữ 85% khoản tiết kiệm đã kiểm chứng; AirAI nhận 15%.',
    'out1.owner': 'Chủ tòa nhà 85%',
    'out1.text': 'AirAI nhận 15% khoản tiết kiệm đã kiểm chứng theo IPMVP; chủ tòa nhà giữ 85%. Chúng tôi chỉ có doanh thu khi hóa đơn giảm.',
    'outE.title': 'Điện tiết kiệm khi mở rộng',
    'outE.num': '4,5 GWh',
    'outE.text': 'Mỗi năm, dự kiến trên 26 tòa nhà mục tiêu.',
    'out2.title': 'Lượng carbon giảm khi mở rộng',
    'out2.num': '2.990 tấn',
    'out2.text': 'CO<sub>2</sub> mỗi năm, dự kiến trên 26 tòa nhà mục tiêu.',
    'esg.title': 'Tác động môi trường, xã hội và quản trị',
    'esg.e': 'Môi trường',
    'esg.e1': '<strong>Giảm điện than.</strong> Hỗ trợ lộ trình net zero của Việt Nam.',
    'esg.e2': '<strong>Không cần thay mới.</strong> Giữ nguyên thiết bị hiện có, tránh lượng carbon hàm chứa của phần cứng mới.',
    'esg.s': 'Xã hội',
    'esg.s1': '<strong>Tiện nghi ổn định hơn.</strong> Không còn sáng lạnh buốt, chiều ngột ngạt.',
    'esg.s2': '<strong>Theo dõi được chất lượng không khí.</strong> Cảm biến CO<sub>2</sub>, PM2.5 và VOC tùy chọn, kèm bảng điều khiển trực tuyến.',
    'esg.s3': '<strong>Không khí sạch hơn cho Hà Nội.</strong> Thành phố đốt ít than hơn.',
    'esg.s4': '<strong>Kỹ năng trong nước.</strong> Chuyên môn tự động hóa tòa nhà và AI được phát triển tại Việt Nam.',
    'esg.g': 'Quản trị',
    'esg.g1': '<strong>Điều khoản rõ từ đầu.</strong> Đường cơ sở, kỳ đo lường và đơn vị kiểm toán được thống nhất trước khi triển khai.',
    'esg.g2': '<strong>Dữ liệu sẵn sàng cho ESG.</strong> Số liệu có thể kiểm toán cho khách thuê, nhà đầu tư và cơ quan quản lý.',
    'calc.title': 'Ước tính cho một tòa nhà',
    'calc.text': 'Nhập diện tích sàn để xem mô hình tài chính của chúng tôi dự báo.',
    'calc.area': 'Diện tích sàn văn phòng',
    'calc.help': 'Tòa nhà tham chiếu: 15.000 m², hạng A, 10 đến 15 tầng.',
    'calc.err': 'Nhập diện tích sàn từ 1.000 đến 100.000 m².',
    'calc.rate': 'Tỷ lệ tiết kiệm',
    'calc.r15': '15%, mức tối thiểu',
    'calc.r20': '20%, mục tiêu',
    'calc.reset': 'Đặt lại về tòa nhà tham chiếu',
    'res.kwh': 'Điện HVAC tiết kiệm được',
    'res.kwhUnit': 'kWh/năm',
    'res.vnd': 'Giá trị khoản tiết kiệm',
    'res.vndUnit': 'đồng/năm',
    'res.co2': 'Lượng CO<sub>2</sub> giảm',
    'res.co2Unit': 'tấn/năm',
    'res.owner': 'Chủ tòa nhà giữ 85%',
    'res.airai': 'Phần 15% của AirAI',
    'calc.backTitle': 'Cơ sở của các con số',
    'calc.back': 'Mọi số liệu trên trang dùng chung một mô hình: tòa nhà tham chiếu 15.000 m², mức tiêu thụ năng lượng trung bình của văn phòng Hà Nội là 105,9 kWh/m² mỗi năm, giả định HVAC chiếm 55%, tiết kiệm 20%, giá điện khoảng 4.000 đồng/kWh và hệ số phát thải lưới điện chính thức năm 2023 của Việt Nam là 0,6592 tấn CO<sub>2</sub>/MWh. Đây là dự báo, không phải báo giá.',

    'ask.title': 'Kỷ nguyên quản lý năng lượng kém hiệu quả đã qua.',
    'ask.lede': 'Chủ tòa nhà, nhà đầu tư và đối tác thành phố: hãy cùng chúng tôi xây dựng một Hà Nội xanh hơn. Bắt đầu thí điểm, tham gia vòng gọi vốn hạt giống, hoặc cùng chúng tôi nhân rộng trên toàn thành phố.',

    'about.img': 'Sáu thành viên AirAI trên sân khấu nhận giải Nhất FTU-UQ Hackathon, cùng hai đại diện ban tổ chức',
    'about.title': 'Về chúng tôi',
    'about.text': 'Chúng tôi là sáu sinh viên tại Hà Nội đứng sau AirAI, đề xuất về một lớp AI giúp các tòa văn phòng ngừng lãng phí năng lượng cho những tầng bỏ trống, bằng cách để hệ thống HVAC hiện có phản ứng theo điều kiện thực tế thay vì lịch cố định.',
    'about.prize': 'Ý tưởng đã giành giải Nhất tại FTU-UQ Hackathon.',

    'faq.title': 'Câu hỏi thường gặp',
    'faq.q1': 'AI có thể khiến tòa nhà của chúng tôi kém tiện nghi hoặc mất an toàn không?',
    'faq.a1': 'Trước khi vận hành thật, AI chạy ở chế độ bóng: đưa ra quyết định nhưng chưa thực thi, để đối chiếu với vận hành thực tế. Cơ chế dự phòng tại chỗ giữ thiết bị vận hành an toàn nếu mất kết nối đám mây.',
    'faq.q2': 'Dữ liệu tòa nhà của chúng tôi được bảo vệ thế nào?',
    'faq.a2': 'Dữ liệu truyền đi được mã hóa bằng TLS/SSL, với xác thực hai chiều giữa gateway tại tòa nhà và đám mây.',
    'faq.q3': 'Mất bao lâu để bắt đầu?',
    'faq.a3': 'Mỗi dự án bắt đầu bằng đợt khảo sát kỹ thuật 6 đến 8 tuần trước khi ký hợp đồng. Sau khi ký, AirAI Lite đặt mục tiêu triển khai trong vòng 6 tuần.',
    'faq.q4': 'AirAI có hỗ trợ báo cáo ESG của chúng tôi không?',
    'faq.a4': 'Có. Khoản tiết kiệm và lượng phát thải giảm đã được kiểm chứng cung cấp số liệu có thể kiểm toán cho báo cáo phát triển bền vững. Gói tùy chọn bổ sung theo dõi CO<sub>2</sub>, PM2.5 và VOC.',

    'form.title': 'Hợp tác cùng AirAI.',
    'form.text': 'Chủ tòa nhà, nhà đầu tư và đối tác thành phố: hãy để lại lời nhắn, chúng tôi sẽ liên hệ lại.',
    'form.alt': 'Muốn gửi email trực tiếp?',
    'form.name': 'Họ và tên',
    'form.email': 'Email',
    'form.role': 'Tôi là',
    'form.roleChoose': 'Chọn một',
    'form.roleOwner': 'Chủ hoặc quản lý tòa nhà',
    'form.roleInvestor': 'Nhà đầu tư',
    'form.roleIntegrator': 'Đơn vị tích hợp BMS',
    'form.roleCity': 'Đối tác thành phố hoặc PropTech',
    'form.roleOther': 'Khác',
    'form.org': 'Tổ chức',
    'form.optional': 'không bắt buộc',
    'form.area': 'Diện tích sàn tòa nhà (m²)',
    'form.areaHint': 'Giúp chúng tôi chuẩn bị ước tính sơ bộ trước buổi trao đổi đầu tiên.',
    'form.message': 'Lời nhắn',
    'form.send': 'Liên hệ',
    'form.sending': 'Đang gửi...',
    'form.errName': 'Vui lòng nhập họ và tên.',
    'form.errEmail': 'Vui lòng nhập địa chỉ email hợp lệ.',
    'form.errMessage': 'Vui lòng nhập lời nhắn.',
    'form.notConnected': 'Biểu mẫu chưa được kết nối. Vui lòng gửi email tới hello.airai.vn@gmail.com.',
    'form.error': 'Đã có lỗi xảy ra. Vui lòng thử lại hoặc gửi email tới hello.airai.vn@gmail.com.',
    'form.doneTitle': 'Cảm ơn bạn.',
    'form.doneText': 'Tin nhắn của bạn đã được gửi. Đội ngũ AirAI sẽ sớm liên hệ lại.',

    'footer.logo': 'AirAI, không khí thông minh, cuộc sống tốt hơn',
    'footer.powered': 'Được hỗ trợ bởi',
    'footer.aria': 'Chân trang',
    'footer.explore': 'Khám phá',
    'footer.about': 'Về chúng tôi',
    'footer.contact': 'Liên hệ',
    'footer.address': '91 Chùa Láng, phường Láng, Hà Nội, Việt Nam',
    'footer.tagline': 'Không khí thông minh. Cuộc sống tốt hơn.'
  };

  // English strings that are not in the HTML (set by main.js at runtime)
  var EN = {
    'menu.open': 'Open menu',
    'menu.close': 'Close menu',
    'form.sending': 'Sending...',
    'form.errName': 'Please enter your name.',
    'form.errEmail': 'Please enter a valid email address.',
    'form.errMessage': 'Please write a short message.',
    'form.notConnected': 'The form isn’t connected yet. Please email us at hello.airai.vn@gmail.com.',
    'form.error': 'Something went wrong. Please try again or email us at hello.airai.vn@gmail.com.',
    'viz.cap.fixed': 'On a fixed schedule every floor is cooled all day. The amber floors are empty.',
    'viz.cap.ai': 'With AirAI the air follows the people. Empty floors drop to minimum ventilation; busy floors come first.',
    'viz.label.fixed': 'Illustration of a nine-floor office building. On a fixed schedule, conditioned air flows into every floor, including four empty ones.',
    'viz.label.ai': 'Illustration of the same building with AirAI. Air flows mainly to occupied floors; the four empty floors receive only minimum ventilation.'
  };

  var root = document.documentElement;
  var desc = document.querySelector('meta[name="description"]');
  var textEls = Array.prototype.slice.call(document.querySelectorAll('[data-i18n]'));
  var attrEls = [];

  // read the English originals from the page before anything changes it
  EN['meta.title'] = document.title;
  EN['meta.desc'] = desc ? desc.content : '';
  textEls.forEach(function (el) {
    var k = el.getAttribute('data-i18n');
    if (!(k in EN)) EN[k] = el.innerHTML;
  });
  document.querySelectorAll('[data-i18n-attr]').forEach(function (el) {
    el.getAttribute('data-i18n-attr').split('|').forEach(function (pair) {
      var p = pair.split(':'), attr = p[0], k = p[1];
      if (!(k in EN)) EN[k] = el.getAttribute(attr) || '';
      attrEls.push({ el: el, attr: attr, key: k });
    });
  });

  var lang = 'en';

  function t(k) { return lang === 'vi' && k in VI ? VI[k] : (k in EN ? EN[k] : ''); }

  function apply(next, save) {
    lang = next === 'vi' ? 'vi' : 'en';
    root.lang = lang;
    document.title = t('meta.title');
    if (desc) desc.content = t('meta.desc');
    textEls.forEach(function (el) { el.innerHTML = t(el.getAttribute('data-i18n')); });
    attrEls.forEach(function (a) { a.el.setAttribute(a.attr, t(a.key)); });
    document.querySelectorAll('.lang button').forEach(function (b) {
      b.setAttribute('aria-pressed', String(b.getAttribute('data-lang') === lang));
    });
    if (save) { try { localStorage.setItem('airai-lang', lang); } catch (e) {} }
    document.dispatchEvent(new CustomEvent('langchange', { detail: { lang: lang } }));
  }

  document.querySelectorAll('.lang button').forEach(function (b) {
    b.addEventListener('click', function () {
      var next = b.getAttribute('data-lang');
      if (next !== lang) apply(next, true);
    });
  });

  window.I18N = { t: t, lang: function () { return lang; } };

  var saved = 'en';
  try { saved = localStorage.getItem('airai-lang') || 'en'; } catch (e) {}
  if (saved === 'vi') apply('vi', false); else root.lang = 'en';
})();
