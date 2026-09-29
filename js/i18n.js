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
    'nav.market': 'Thị trường',
    'nav.roadmap': 'Lộ trình',
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
    'steps.note': 'Hầu hết công cụ tòa nhà thông minh dừng ở bước hai. AirAI hành động, rồi xác nhận từng lệnh đã được thực hiện và đưa kết quả vào lần dự báo tiếp theo.',
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
    'lite.price': '<span class="plan__num">100 triệu</span> đồng mỗi công trình, ước tính',
    'lite.l1': 'Chỉ tích hợp phần mềm, không lắp đặt phần cứng',
    'lite.l2': 'Triển khai nhanh nhất',
    'lite.l3': '300.000 đồng mỗi khu vực mỗi tháng, cộng 15% khoản tiết kiệm đã kiểm chứng',
    'lite.best': '<strong>Phù hợp nhất</strong> cho tòa nhà đã có cảm biến và bộ chấp hành hoạt động tốt, chỉ cần thêm lớp ra quyết định AI.',
    'full.img': 'Cụm máy làm lạnh trên mái tòa nhà thương mại với đường ống cách nhiệt',
    'full.for': 'Cho tòa nhà chưa có BMS hỗ trợ ghi lệnh, chiếm phần lớn thị trường',
    'full.price': '<span class="plan__num">437,5 triệu</span> đồng mỗi công trình trong trường hợp phổ biến nhất; khoảng 560 triệu nếu hoàn toàn chưa có BMS.',
    'full.l1': 'Bổ sung lớp cảm biến và chấp hành mà hầu hết dự án AI cho tòa nhà bỏ qua',
    'full.l2': '800.000 đồng mỗi khu vực mỗi tháng, cộng 15% khoản tiết kiệm đã kiểm chứng',
    'full.l3': 'Phí thiết lập một lần bằng một nửa chi phí lắp đặt',
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
    'fit.dA': 'Lite, khoảng 100 triệu đồng',
    'fit.dB': 'Full, khoảng 437,5 triệu đồng',
    'fit.dC': 'Full, khoảng 560 triệu đồng',

    'impact.title': 'Bớt điện lãng phí.<br> Bớt carbon.<br> Tiết kiệm có kiểm chứng.',
    'impact.note': 'Số liệu dự báo từ mô hình, chưa phải kết quả thí điểm.',
    'target.lead': 'Mức cắt giảm điện HVAC dự kiến: khoảng 174.735 kWh và 115 tấn CO<sub>2</sub> mỗi tòa nhà mỗi năm.',
    'target.floor': 'Chúng tôi chỉ mở rộng nếu tiết kiệm đã kiểm chứng đạt ít nhất 15%, mức thấp nhất mà các hệ thống tương tự đạt được ở nước ngoài.',
    'out1.title': 'Ai hưởng khoản tiết kiệm',
    'out1.aria': 'Chủ tòa nhà giữ 85% khoản tiết kiệm đã kiểm chứng; AirAI nhận 15%.',
    'out1.owner': 'Chủ tòa nhà 85%',
    'out1.text': 'AirAI nhận 15% khoản tiết kiệm đã kiểm chứng theo IPMVP; chủ tòa nhà giữ 85%. Chúng tôi chỉ có doanh thu khi hóa đơn giảm.',
    'out2.title': 'Lượng carbon giảm khi mở rộng',
    'out2.num': '2.990 tấn',
    'out2.text': 'CO<sub>2</sub> mỗi năm, dự kiến trên 26 tòa nhà mục tiêu.',
    'out3.title': 'Điểm hòa vốn của công ty',
    'out3.num': '11 <span class="outcome__unit">công trình</span>',
    'out3.text': 'Khoảng 11 công trình Full, hoặc 19 công trình Lite, đủ bù chi phí công ty. Kế hoạch cơ sở, 11 Lite và 5 Full, dự kiến hòa vốn vào tháng 35.',
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
    'econ.title': 'Minh họa kinh tế của một công trình AirAI Full',
    'econ.sub': 'Tòa nhà 15.000 m², 25 khu vực, đơn vị triệu đồng.',
    'econ.r1': 'Doanh thu năm 1',
    'econ.r2': 'Doanh thu từ năm 2',
    'econ.r3': 'Lợi nhuận từ năm 2',
    'econ.v1': '563,6',
    'econ.v2': '344,8 mỗi năm',
    'econ.v3': '249,8 mỗi năm',
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

    'market.img': 'Tòa văn phòng lúc chạng vạng với đèn sáng ở nhiều tầng',
    'market.title': 'Vì sao là văn phòng, và vì sao là lúc này.',
    'market.lede': 'Các tòa văn phòng đã có sẵn phần cứng HVAC và ngày càng nhiều nơi có hệ thống quản lý tòa nhà (BMS). Họ không cần hạ tầng mới tốn kém, chỉ cần lớp ra quyết định còn thiếu.',
    'market.text': 'Vì vậy đây là nơi nhanh nhất để chứng minh mô hình trước khi mở rộng sang trung tâm thương mại, bệnh viện và chung cư.',
    'path.aria': 'Hướng mở rộng tiếp theo của AirAI',
    'path.1': '<span><strong>Văn phòng</strong>, hiện tại</span>',
    'path.2': 'Trung tâm thương mại',
    'path.3': 'Bệnh viện tư nhân',
    'path.4': 'Chung cư cao tầng',
    'press.title': 'Ba áp lực đang hội tụ',
    'press1.title': 'Chi phí năng lượng tăng',
    'press1.text': 'EVN đã tăng giá điện kinh doanh bốn lần từ đầu năm 2023, nên lãng phí HVAC ngày càng tốn kém.',
    'press2.title': 'Cam kết khí hậu ngày càng chặt',
    'press2.text': 'Việt Nam cam kết net zero vào năm 2050 và loại bỏ điện than trong thập niên 2040. Các tòa nhà chạy theo lịch cố định đang tụt lại so với kỳ vọng của cơ quan quản lý, khách thuê và nhà đầu tư.',
    'press3.num': '15 đến 25%',
    'press3.title': 'Mô hình đã được chứng minh, chưa có ở Việt Nam',
    'press3.text': 'Các hệ thống tương tự ở nước ngoài giảm 15 đến 25% chi phí và 20 đến 40% carbon, nhưng không thể phục vụ tòa nhà thiếu bộ chấp hành điện tử, tức phần lớn Hà Nội. Khoảng trống đó là cơ hội của chúng tôi.',

    'road.title': 'Ba giai đoạn, mỗi giai đoạn đều có điều kiện trước vòng gọi vốn tiếp theo.',
    'road.m0': 'Tháng 0',
    'ph1.title': 'Phát triển MVP',
    'ph1.when': 'Tháng 0 đến 6',
    'ph1.text': 'Xây dựng lõi AI và chạy thử ở chế độ bóng trên dữ liệu thực của một tòa nhà Việt Nam.',
    'ph1.gate': '<strong>Chuyển giai đoạn khi</strong> dự báo đủ chính xác và có một tòa nhà cam kết thí điểm.',
    'ph2.title': 'Thí điểm thương mại',
    'ph2.when': 'Tháng 6 đến 18',
    'ph2.text': 'Triển khai AirAI Lite tại 2 đến 3 tòa nhà, kiểm chứng tiết kiệm qua kiểm toán IPMVP độc lập và xây dựng các nghiên cứu điển hình đầu tiên.',
    'ph2.gate': '<strong>Chuyển giai đoạn khi</strong> tiết kiệm đo được đạt 15% điện năng HVAC và có ít nhất một khách hàng gia hạn.',
    'ph3.title': 'Mở rộng',
    'ph3.when': 'Tháng 18 đến 48',
    'ph3.text': 'Mở rộng danh mục và triển khai AirAI Full song song với Lite.',
    'ph3.gate': '<strong>Mục tiêu</strong> hòa vốn hoạt động vào tháng 35, với 11 công trình Lite và 5 công trình Full.',
    'ms.title': 'Các cột mốc',
    'ms.t1': 'Tháng 0',
    'ms.d1': 'Hoàn tất vòng tiền hạt giống 4,2 tỷ đồng, tài trợ giai đoạn 1 và 2',
    'ms.t2': 'Tháng 6',
    'ms.d2': 'Hoàn thành MVP và chế độ chạy bóng',
    'ms.t3': 'Tháng 8',
    'ms.d3': 'Hợp đồng AirAI Lite thương mại đầu tiên',
    'ms.t4': 'Tháng 14',
    'ms.d4': 'Báo cáo IPMVP độc lập đầu tiên',
    'ms.t5': 'Tháng 18',
    'ms.d5': 'Hoàn tất vòng hạt giống 6,0 tỷ đồng dựa trên kết quả thí điểm',
    'ms.t6': 'Tháng 20 đến 24',
    'ms.d6': 'Triển khai AirAI Full đầu tiên',
    'ms.t7': 'Tháng 35',
    'ms.d7': 'Hòa vốn hoạt động, 11 công trình Lite và 5 Full',

    'ask.title': 'Kỷ nguyên quản lý năng lượng kém hiệu quả đã qua.',
    'ask.lede': 'Chủ tòa nhà, nhà đầu tư và đối tác thành phố: hãy cùng chúng tôi xây dựng một Hà Nội xanh hơn. Bắt đầu thí điểm, tham gia vòng gọi vốn hạt giống, hoặc cùng chúng tôi nhân rộng trên toàn thành phố.',

    'about.img': 'Sáu thành viên AirAI trên sân khấu nhận giải Nhất FTU-UQ Hackathon, cùng hai đại diện ban tổ chức',
    'about.title': 'Về chúng tôi',
    'about.text': 'Chúng tôi là sáu sinh viên tại Hà Nội đứng sau AirAI, đề xuất về một lớp AI giúp các tòa văn phòng ngừng lãng phí năng lượng cho những tầng bỏ trống, bằng cách để hệ thống HVAC hiện có phản ứng theo điều kiện thực tế thay vì lịch cố định.',
    'about.prize': 'Ý tưởng đã giành giải Nhất tại FTU-UQ Hackathon.',

    'footer.logo': 'AirAI, không khí thông minh, cuộc sống tốt hơn',
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
