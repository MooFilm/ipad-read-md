# **การวิเคราะห์เชิงลึกและการสอบเทียบมาตรฐานประสิทธิผลโดยรวมของเครื่องจักร (OEE) ในกระบวนการผลิตชิ้นส่วนความแม่นยำสูง: กลยุทธ์การจัดการดัชนีสมรรถนะเกินร้อยละ 100 และการเพิ่มประสิทธิภาพรอบเวลาการผลิต**

## **1\. บทนำและบริบทของปัญหาในอุตสาหกรรมการผลิตสมัยใหม่**

ในยุคปัจจุบันที่อุตสาหกรรมการผลิตต้องเผชิญกับการแข่งขันที่รุนแรงและความต้องการด้านคุณภาพที่สูงขึ้น การวัดและประเมินผลการปฏิบัติงานของเครื่องจักรกลการผลิต โดยเฉพาะอย่างยิ่งเครื่องจักรควบคุมด้วยคอมพิวเตอร์ (CNC) กลายเป็นปัจจัยวิกฤตที่กำหนดความอยู่รอดขององค์กร ดัชนีชี้วัดประสิทธิผลโดยรวมของเครื่องจักร หรือ Overall Equipment Effectiveness (OEE) ได้รับการยอมรับในระดับสากลว่าเป็นมาตรฐานทองคำในการวัดประสิทธิภาพการผลิต อย่างไรก็ตาม ในทางปฏิบัติมักพบความผิดปกติของข้อมูลที่นำไปสู่การตีความที่คลาดเคลื่อน ดังเช่นกรณีศึกษาที่ระบุไว้ในบทคัดย่อเกี่ยวกับการผลิตชิ้นงานฝามาตรวัดน้ำ (Water Meter Cover) โมเดล HC15-25 ซึ่งพบปรากฏการณ์ที่ดัชนีสมรรถนะ (Performance Rate \- P) มีค่าสูงเกิน 100% ส่งผลให้ค่า OEE โดยรวมอยู่ในระดับสูงเกินความเป็นจริง (ระดับ World Class \>90%) ในขณะที่ดัชนีอัตราการเดินเครื่อง (Availability \- A) กลับต่ำกว่าเกณฑ์มาตรฐาน 1

ปรากฏการณ์นี้มิใช่เพียงความผิดพลาดทางตัวเลข แต่เป็นสัญญาณบ่งชี้ถึงปัญหาเชิงโครงสร้างในการกำหนดมาตรฐานการผลิต โดยเฉพาะอย่างยิ่ง "รอบเวลามาตรฐาน" (Standard Cycle Time) หรือ "รอบเวลาในอุดมคติ" (Ideal Cycle Time) ที่ไม่สอดคล้องกับศักยภาพที่แท้จริงของเครื่องจักร 2 หากปล่อยให้สถานการณ์นี้ดำเนินต่อไป จะส่งผลให้ผู้บริหารไม่สามารถมองเห็นความสูญเสียที่ซ่อนอยู่ (Hidden Losses) และพลาดโอกาสในการปรับปรุงกระบวนการผลิตเพื่อลดต้นทุนและเพิ่มผลกำไร การวิเคราะห์หาสาเหตุที่แท้จริงและการสอบเทียบมาตรฐานใหม่จึงเป็นสิ่งจำเป็นเร่งด่วน

รายงานฉบับนี้มีวัตถุประสงค์เพื่อนำเสนอผลการสังเคราะห์องค์ความรู้จากงานวิจัยระดับนานาชาติและวิทยานิพนธ์ที่เกี่ยวข้อง เพื่อเป็นแนวทางในการแก้ไขปัญหาดังกล่าว โดยเน้นการวิเคราะห์เชิงลึกใน 3 ด้านหลัก ได้แก่ 1\) โครงสร้างและพลวัตของดัชนีชี้วัดย่อย (A, P, Q) ตามมาตรฐาน ISO 22400 2\) ระเบียบวิธีวิจัยในการเก็บรวบรวมข้อมูลและการศึกษาเวลา (Time Study) ที่มีความแม่นยำ และ 3\) การประยุกต์ใช้สถิติขั้นสูง (Statistical Analysis) เช่น ANOVA และ Taguchi Method ในการปรับปรุงกระบวนการและสอบเทียบรอบเวลามาตรฐาน

## **2\. กรอบแนวคิดทฤษฎีและมาตรฐานสากลว่าด้วย OEE และรอบเวลาการผลิต**

การทำความเข้าใจรากฐานทฤษฎีของ OEE และองค์ประกอบย่อยตามมาตรฐานสากล เป็นจุดเริ่มต้นสำคัญในการวิเคราะห์ความผิดปกติที่เกิดขึ้น

### **2.1 โครงสร้างดัชนีชี้วัดตามมาตรฐาน ISO 22400-2**

องค์การระหว่างประเทศว่าด้วยการมาตรฐาน (ISO) ได้กำหนดมาตรฐาน **ISO 22400-2:2014** ว่าด้วยตัวชี้วัดประสิทธิภาพหลักสำหรับการจัดการการปฏิบัติการผลิต (Key Performance Indicators for Manufacturing Operations Management) ซึ่งระบุโครงสร้างของ OEE ไว้อย่างชัดเจนว่าประกอบด้วยผลคูณของสามปัจจัยหลัก 4 ดังแสดงในสมการ:

![][image1]  
การวิเคราะห์ความสัมพันธ์ของแต่ละปัจจัยในบริบทของกรณีศึกษาฝามาตรวัดน้ำ มีรายละเอียดดังนี้:

#### **2.1.1 อัตราการเดินเครื่อง (Availability: A)**

อัตราการเดินเครื่องสะท้อนถึงความพร้อมของเครื่องจักรในการผลิต โดยพิจารณาจาก "เวลาที่วางแผนไว้" (Planned Production Time) เทียบกับ "เวลาที่เครื่องจักรทำงานจริง" (Run Time) ปัจจัยนี้ได้รับผลกระทบโดยตรงจากความสูญเสียด้านการหยุดทำงาน (Downtime Losses) ซึ่งแบ่งออกเป็นสองประเภทหลัก 7:

1. **การหยุดทำงานโดยไม่คาดคิด (Unplanned Stops):** เช่น เครื่องจักรขัดข้อง (Breakdowns), การขาดแคลนวัตถุดิบ, หรือความล้มเหลวของอุปกรณ์สนับสนุน  
2. **การหยุดทำงานตามแผน (Planned Stops):** เช่น การตั้งค่าเครื่องจักร (Setup/Changeover), การอุ่นเครื่อง (Warm-up), หรือการบำรุงรักษาตามแผน

ในกรณีศึกษาที่ค่า A ต่ำกว่าเกณฑ์มาตรฐานสากล บ่งชี้ว่ามีปัญหาเรื่องเสถียรภาพของเครื่องจักร หรือกระบวนการตั้งค่า (Setup) ที่ใช้เวลานานเกินไป ซึ่งสอดคล้องกับงานวิจัยในอุตสาหกรรมทองเหลืองที่พบว่าการหยุดเครื่องเพื่อเปลี่ยนทูล (Tool Regeneration) เป็นสาเหตุหลักของความสูญเสีย 10 การปรับปรุงค่า A จึงต้องมุ่งเน้นที่การลดเวลาเหล่านี้ผ่านเทคนิคเช่น SMED (Single Minute Exchange of Die) หรือการบำรุงรักษาทวีผล (TPM) 9

#### **2.1.2 อัตราสมรรถนะ (Performance: P) และนัยสำคัญของค่าเกิน 100%**

ดัชนีสมรรถนะเป็นตัวชี้วัดความเร็วในการผลิต เปรียบเทียบระหว่าง "จำนวนชิ้นงานที่ผลิตได้จริง" กับ "จำนวนชิ้นงานที่ควรผลิตได้ตามทฤษฎี" ภายในเวลาที่เครื่องจักรเดิน สูตรการคำนวณตามมาตรฐานคือ 3:

![][image2]  
หรือคำนวณจากอัตราความเร็ว:

![][image3]  
ตามทฤษฎีแล้ว ค่า P ไม่ควรเกิน 100% เพราะนั่นหมายถึงการผลิตที่เร็วกว่า "ขีดจำกัดสูงสุด" ของเครื่องจักร หากค่า P \> 100% เกิดขึ้น แสดงว่าตัวแปร **Ideal Cycle Time** (รอบเวลาในอุดมคติ) ถูกกำหนดไว้ **สูงเกินไป** (หรือความเร็วมาตรฐานถูกกำหนดไว้ต่ำเกินไป) 2 สาเหตุของความคลาดเคลื่อนนี้มักเกิดจาก:

* **การใช้ค่าเฉลี่ยในอดีต (Historical Average):** หลายโรงงานใช้ค่าเฉลี่ยจากการผลิตในอดีตมาเป็นมาตรฐาน ซึ่งค่าเหล่านี้รวมความสูญเสียเล็กน้อย (Minor Stops) และความไร้ประสิทธิภาพไว้แล้ว ทำให้มาตรฐานต่ำกว่าศักยภาพจริง  
* **การเปลี่ยนแปลงกระบวนการโดยไม่สอบเทียบ:** เมื่อมีการปรับปรุงเครื่องมือตัด (Tooling Improvement) หรือโปรแกรม CNC แต่ไม่ได้ปรับค่ามาตรฐานในระบบ ERP หรือ MES ค่า P จะกระโดดสูงขึ้นทันที 12  
* **เจตนาในการบริหารจัดการ:** บางครั้งมีการตั้งเป้าหมายให้ต่ำเพื่อให้พนักงานบรรลุเป้าหมายได้ง่าย ซึ่งเป็นการบิดเบือนข้อมูลเพื่อผลทางจิตวิทยา แต่ทำลายระบบการวัดผลทางวิศวกรรม 14

#### **2.1.3 อัตราคุณภาพ (Quality: Q)**

อัตราคุณภาพวัดสัดส่วนของชิ้นงานดี (Good Count) ต่อชิ้นงานทั้งหมด (Total Count) ซึ่งรวมถึงชิ้นงานที่ต้องนำมาแก้ไข (Rework) และชิ้นงานเสีย (Scrap) 3 ในกระบวนการผลิตที่มีความแม่นยำสูง ค่า Q มักจะสูง แต่ต้องระวังว่าการเร่งความเร็วเครื่องจักรเพื่อเพิ่มค่า P อาจส่งผลกระทบให้ค่า Q ลดลงได้ หากไม่มีการควบคุมกระบวนการที่ดี

### **2.2 มาตรฐานรอบเวลา (Standard Cycle Time) กับรอบเวลาในอุดมคติ (Ideal Cycle Time)**

ความสับสนระหว่างสองคำนี้เป็นสาเหตุหนึ่งของปัญหา P \> 100%

* **Ideal Cycle Time:** คือเวลาที่สั้นที่สุดตามทฤษฎีที่เครื่องจักรสามารถผลิตชิ้นงานได้ 1 ชิ้น ภายใต้เงื่อนไขที่ดีที่สุด โดยไม่มีการหยุดชะงักใดๆ เป็นค่าคงที่ทางฟิสิกส์ (Physics-based limit) 12  
* **Standard Cycle Time:** มักหมายถึงเวลามาตรฐานที่ใช้ในการวางแผนการผลิตและการคิดต้นทุน ซึ่งอาจรวมเวลาเผื่อ (Allowances) สำหรับความล้าของพนักงานหรือเหตุสุดวิสัยเข้าไปด้วย

ในการคำนวณ OEE ที่ถูกต้องตามหลักการ ISO 22400-2 ต้องใช้ **Ideal Cycle Time** เป็นตัวหาร เพื่อให้ค่า P สะท้อนถึง "ความสูญเสียด้านความเร็ว" (Speed Loss) ที่แท้จริง หากใช้ Standard Cycle Time ที่รวมเวลาเผื่อเข้าไป จะทำให้ค่า P สูงเกินจริงและบดบังปัญหา 12

## ---

**3\. ระเบียบวิธีวิจัยและการเก็บรวบรวมข้อมูลเชิงประจักษ์ (Advanced Methodology for Data Collection)**

เพื่อแก้ไขปัญหาความคลาดเคลื่อนของค่า OEE และสอบเทียบรอบเวลามาตรฐาน จำเป็นต้องมีการออกแบบการเก็บข้อมูลที่รัดกุมและเป็นระบบ โดยอ้างอิงจากมาตรฐานสากลและงานวิจัยที่เกี่ยวข้อง

### **3.1 การออกแบบการศึกษาเวลา (Time Study Design) และการกำหนดขนาดตัวอย่าง**

การศึกษาเวลาในอุตสาหกรรมยุคใหม่ (Industry 4.0) ต้องผสมผสานระหว่างการสังเกตการณ์โดยมนุษย์และการใช้ข้อมูลจากระบบดิจิทัล

#### **3.1.1 เกณฑ์การกำหนดขนาดตัวอย่าง (Sample Size Determination)**

ความถูกต้องของข้อมูลขึ้นอยู่กับจำนวนตัวอย่างที่เพียงพอทางสถิติ ตามเอกสารทางเทคนิคของ **NIST (National Institute of Standards and Technology)** ฉบับที่ 2119 ว่าด้วยวิธีการทางสถิติสำหรับการตรวจสอบความถูกต้องของสมรรถนะ 17 แนะนำให้ใช้วิธีการกำหนดขนาดตัวอย่างตามระดับความเชื่อมั่น (Confidence Level) และความคลาดเคลื่อนที่ยอมรับได้ (Margin of Error)

สูตรสำหรับการคำนวณขนาดตัวอย่าง (![][image4]) เมื่อต้องการประมาณค่าเฉลี่ยของเวลา ($ \\mu $) คือ:

![][image5]  
โดยที่:

* ![][image6] คือ ค่า Z-score ที่ระดับความเชื่อมั่น (เช่น 1.96 สำหรับความเชื่อมั่น 95% หรือ 2.58 สำหรับ 99%)  
* ![][image7] คือ ส่วนเบี่ยงเบนมาตรฐาน (Standard Deviation) ของข้อมูลชุดนำร่อง (Pilot Data)  
* ![][image8] คือ ค่าความคลาดเคลื่อนที่ยอมรับได้ (Absolute Error)

งานวิจัยในบริบทของโรงงานผลิตแนะนำว่า สำหรับการตรวจสอบเบื้องต้น (Initial Validation) ควรเก็บข้อมูลอย่างน้อย **10-20 รอบ** เพื่อประเมินค่าความแปรปรวนเบื้องต้น และสำหรับงานที่มีความเสถียร ควรใช้ตัวอย่าง **50-100 รอบ** เพื่อให้ได้ช่วงความเชื่อมั่นที่แคบและแม่นยำสำหรับการกำหนดมาตรฐานใหม่ 16

#### **3.1.2 การระบุจุดเริ่มต้นและสิ้นสุด (Start/Stop Points)**

ความคลาดเคลื่อนมักเกิดจากการนิยามจุดตัดของรอบเวลาที่ไม่ชัดเจน มาตรฐานการศึกษาเวลาของ ILO แนะนำให้ระบุจุดตัดที่สังเกตเห็นได้ชัดเจนและสม่ำเสมอ 19:

* **จุดเริ่มต้น:** เมื่อนิ้วของพนักงานกดปุ่ม "Cycle Start" หรือเมื่อประตูเครื่องจักรปิดล็อก  
* **จุดสิ้นสุด:** เมื่อประตูเครื่องจักรเปิดออก หรือเมื่อเครื่องมือตัดถอยกลับสู่ตำแหน่ง Home และแกนหมุนหยุดสนิท  
* **ข้อควรระวัง:** ต้องแยกแยะ "เวลารอบเครื่องจักร" (Machine Cycle Time) ออกจาก "เวลาขนถ่าย" (Loading/Unloading Time) อย่างชัดเจน หากรวมเวลาขนถ่ายเข้าไปใน Ideal Cycle Time จะทำให้การคำนวณสมรรถนะของเครื่องจักรผิดเพี้ยนไป 12

### **3.2 เครื่องมือและเทคนิคการเก็บข้อมูล (Data Collection Techniques)**

#### **3.2.1 การวิเคราะห์บันทึกข้อมูลของเครื่องจักร (Machine Log Analysis)**

สำหรับเครื่องจักร CNC สมัยใหม่ การดึงข้อมูลจาก Controller (เช่น FANUC, Siemens, Mitsubishi) เป็นวิธีที่แม่นยำที่สุด ข้อมูลที่ควรดึงประกอบด้วย:

* **Cycle Start/End Timestamps:** เพื่อคำนวณเวลารอบการทำงานจริงในระดับมิลลิวินาที  
* **Spindle Load & Feed Rate Override:** เพื่อตรวจสอบว่าพนักงานมีการปรับลดความเร็วหน้าเครื่องหรือไม่  
* **Alarm History:** เพื่อวิเคราะห์สาเหตุของการหยุดเครื่องระยะสั้น (Micro-stops) การใช้ซอฟต์แวร์เช่น **MT-LINKi** หรือระบบ MES สามารถช่วยเก็บข้อมูลเหล่านี้ได้โดยอัตโนมัติและลดความผิดพลาดจากมนุษย์ (Human Error) 16

#### **3.2.2 การศึกษาเวลาด้วยวิดีโอ (Video Time Study)**

การบันทึกวิดีโอช่วยให้สามารถวิเคราะห์องค์ประกอบของการทำงานแบบละเอียด (Micro-motion study) ได้ โดยเฉพาะในช่วงเวลา Setup หรือ Loading ซึ่งเป็นช่วงที่เกิดความผันแปรสูง เทคนิคนี้ช่วยให้แยกแยะกิจกรรมที่มีคุณค่า (Value Added) และไม่มีคุณค่า (Non-Value Added) ออกจากกันได้ชัดเจน เพื่อนำไปสู่การปรับปรุงตามแนวทาง Lean 22

### **3.3 รายละเอียดข้อมูลและเงื่อนไขที่ต้องบันทึก (Data Recording Protocol)**

เพื่อให้การวิเคราะห์สาเหตุความผิดปกติของ OEE สมบูรณ์แบบ ตารางบันทึกข้อมูลควรประกอบด้วยพารามิเตอร์ดังต่อไปนี้ 20:

| หมวดหมู่ข้อมูล | พารามิเตอร์รายละเอียด | นัยสำคัญต่อการวิเคราะห์ |
| :---- | :---- | :---- |
| **ข้อมูลการผลิต** | Part ID, Lot No., Shift, Operator ID | เพื่อระบุความผันแปรที่เกิดจากคนหรือช่วงเวลา |
| **พารามิเตอร์เครื่องจักร** | Spindle Speed (RPM), Feed Rate (mm/min), Depth of Cut (mm) | ปัจจัยหลักที่กำหนด Cycle Time ทางทฤษฎี |
| **ข้อมูลเวลา** | Cycle Time (Machine), Loading Time, Inspection Time | แยกแยะเวลาเครื่องจักรและเวลาคน |
| **ข้อมูลเครื่องมือตัด** | Tool ID, Tool Life Status, Change frequency | วิเคราะห์ผลกระทบของการเปลี่ยนทูลต่อ Availability |
| **เหตุการณ์ขัดข้อง** | Stop Reason, Stop Duration, Micro-stop count | วิเคราะห์ 6 Big Losses |

## ---

**4\. การวิเคราะห์ทางสถิติและการสอบเทียบรอบเวลามาตรฐาน (Statistical Analysis & Recalibration Methodology)**

เมื่อได้ข้อมูลดิบที่มีคุณภาพแล้ว ขั้นตอนต่อไปคือการใช้เครื่องมือทางสถิติเพื่อวิเคราะห์ความสัมพันธ์และกำหนดค่ามาตรฐานใหม่ที่ถูกต้อง

### **4.1 การวิเคราะห์ความแปรปรวน (ANOVA) เพื่อระบุปัจจัยที่มีอิทธิพลต่อ Cycle Time**

การใช้ **Analysis of Variance (ANOVA)** ช่วยให้วิศวกรสามารถระบุได้อย่างชัดเจนว่าปัจจัยใดมีผลกระทบต่อเวลาในการผลิตมากที่สุด และปัจจัยใดที่ไม่มีนัยสำคัญ ซึ่งจะช่วยในการปรับจูนพารามิเตอร์เพื่อลดเวลา Cycle Time ได้อย่างตรงจุด

จากงานวิจัยที่ศึกษาการปรับปรุงเวลาในกระบวนการกลึง CNC (Turning Optimization) พบผลการวิเคราะห์ ANOVA ที่น่าสนใจดังนี้ 25:

* **อัตราป้อน (Feed Rate):** เป็นปัจจัยที่มีอิทธิพลสูงสุดต่อเวลาในการตัด (Cutting Time) โดยมีค่า P-value \< 0.05 (นัยสำคัญทางสถิติ) และมีสัดส่วนผลกระทบ (Contribution) สูงถึง **54.98%**  
* **ความเร็วตัด (Cutting Speed):** เป็นปัจจัยที่มีอิทธิพลรองลงมา มีค่า P-value \< 0.05 และมีสัดส่วนผลกระทบ **42.58%**  
* **ความลึกในการตัด (Depth of Cut) และ รัศมีจมูกมีด (Nose Radius):** พบว่าไม่มีนัยสำคัญทางสถิติโดยตรงต่อ "เวลา" ในการตัด แต่มีผลต่อคุณภาพผิวงาน (Surface Roughness) และการสึกหรอของเครื่องมือ (Tool Wear)

**นัยสำคัญต่อกรณีศึกษา:** การที่ค่า P \> 100% อาจเกิดจากการตั้งค่า Feed Rate หรือ Cutting Speed ในสูตรคำนวณ Ideal Cycle Time ต่ำกว่าความเป็นจริง การแก้ไขจึงต้องสอบเทียบค่าเหล่านี้ใหม่ให้สอดคล้องกับความสามารถสูงสุดของเครื่องจักร โดยใช้ผลจาก ANOVA เป็นเครื่องยืนยันว่าการปรับเปลี่ยนค่าเหล่านี้จะมีผลอย่างมีนัยสำคัญต่อเวลาที่ได้

### **4.2 การประยุกต์ใช้ Taguchi Method ในการออกแบบการทดลอง**

เพื่อหาค่าพารามิเตอร์ที่เหมาะสมที่สุด (Optimal Parameters) ที่ทำให้ Cycle Time ต่ำที่สุดโดยไม่กระทบต่อคุณภาพ งานวิจัยแนะนำให้ใช้ระเบียบวิธีของ **Taguchi** โดยใช้ **Signal-to-Noise (S/N) Ratio** ในการวิเคราะห์ 25

* **Design of Experiment (DOE):** สร้างตาราง Orthogonal Array (เช่น L9 หรือ L27) เพื่อทดสอบการผสมผสานของ Speed, Feed, และ Depth of Cut ที่ระดับต่างๆ  
* **การวิเคราะห์ผล:** หาค่า S/N Ratio สำหรับ Cycle Time (ใช้เกณฑ์ "Smaller-is-Better") และคุณภาพผิวงาน (ใช้เกณฑ์ตามสเปค)  
* **ผลลัพธ์:** จะได้ชุดพารามิเตอร์ (เช่น S3F3 \- Speed ระดับ 3, Feed ระดับ 3\) ที่ให้เวลาต่ำสุดที่เป็นไปได้จริง ค่านี้ควรถูกนำมากำหนดเป็น **New Ideal Cycle Time**

### **4.3 กระบวนการสอบเทียบรอบเวลามาตรฐาน (Standard Cycle Time Recalibration Protocol)**

การแก้ไขปัญหา Performance \> 100% อย่างยั่งยืน ต้องทำผ่านกระบวนการ Recalibration ตามขั้นตอนดังนี้ 12:

1. **คำนวณ Ideal Cycle Time ทางทฤษฎี (Theoretical Calculation):**  
   ใช้สูตรพื้นฐานทางวิศวกรรมสำหรับการกลึง:  
   ![][image9]  
   โดยที่ ![][image10] คือเวลาตัด, ![][image11] คือความยาวในการตัด, ![][image12] คืออัตราป้อน (mm/rev), และ ![][image13] คือความเร็วรอบ (RPM)  
   ค่าที่ได้นี้คือ "ขีดจำกัดทางฟิสิกส์" ที่เครื่องจักรทำได้  
2. **ตรวจสอบด้วยข้อมูลประวัติ (Historical Validation with Buffer):**  
   หากการคำนวณทางทฤษฎีซับซ้อนเกินไป ให้ใช้ข้อมูลจาก Machine Log ย้อนหลัง 2 ปี หาค่า Cycle Time ที่ "เร็วที่สุด" ที่เคยทำได้ (Best Demonstrated Speed) แล้วนำมาใช้เป็นฐาน อาจบวกส่วนเผื่อ (Margin) เล็กน้อย (เช่น 5-10% ไม่ใช่ 20% ตามที่บางแหล่งแนะนำ เพื่อความท้าทาย) เพื่อป้องกันไม่ให้ค่า P ทะลุ 100% อีกในอนาคต  
3. **แยกเวลาคนออกจากเวลาเครื่อง (Separation of Man-Machine Time):**  
   สูตร OEE ที่แม่นยำต้องไม่รวมเวลาขนถ่าย (Handling Time) เข้าไปใน Ideal Cycle Time ของเครื่องจักร การเสียเวลาในการขนถ่ายควรถูกบันทึกเป็น Speed Loss หรือ Minor Stop แทน เพื่อให้เห็นปัญหาที่แท้จริงของการจัดการคน  
4. **การปรับเปลี่ยนกระบวนทัศน์ (Paradigm Shift):**  
   สื่อสารให้องค์กรเข้าใจว่า 100% OEE คือ "ทิศเหนือ" (North Star) หรือจุดอ้างอิงทางอุดมคติ ไม่ใช่เป้าหมายที่ต้องทำให้ได้ในทันที การมีค่า OEE ที่ลดลงจากการปรับฐานเวลาใหม่ (เช่น จาก 95% เหลือ 60%) คือการ "เปิดเผยความจริง" เพื่อนำไปสู่การปรับปรุง ไม่ใช่ความล้มเหลว

## ---

**5\. กรณีศึกษาเชิงลึกและแนวทางการปฏิบัติที่เป็นเลิศ (Case Studies & Best Practices)**

การวิเคราะห์กรณีศึกษาที่เกี่ยวข้องช่วยให้เห็นภาพการนำทฤษฎีไปปฏิบัติจริง และผลลัพธ์ที่เป็นรูปธรรม

### **5.1 กรณีศึกษา: การปรับปรุงผลิตภาพในโรงงานผลิตฝามาตรวัดน้ำทองเหลือง (Poland Case Study)**

งานวิจัยจากประเทศโปแลนด์ที่ศึกษาโรงงานผลิตตัวเรือนมาตรวัดน้ำ (Water Meter Body) ที่ทำจากทองเหลือง (Brass MO 58\) ซึ่งมีบริบทใกล้เคียงกับบทคัดย่อของผู้ใช้มากที่สุด ให้ข้อมูลเชิงลึกที่สำคัญดังนี้ 10:

* **ปัญหาคุณภาพและเวลา:** พบอัตราของเสียสูงถึง 9.5% (ประมาณ 114,000 ชิ้นต่อปี) ซึ่งเกิดจากกระบวนการตีขึ้นรูป (Forging) และการตัดเฉือน (Machining) ปัญหาหลักคือการหยุดเครื่องเพื่อเปลี่ยนและลับคมเครื่องมือตัด (Tool Regeneration) ซึ่งใช้เวลานานถึง **48 นาที** ต่อครั้ง ส่งผลกระทบต่อค่า Availability อย่างรุนแรง  
* **ปัญหาโลจิสติกส์:** การรอคอยวัตถุดิบ (Material Waiting) นาน 15 นาที ส่งผลให้สูญเสียโอกาสการผลิตไปถึง 64 ชิ้นต่อกะ  
* **แนวทางการแก้ไขและการปรับปรุง:**  
  * **การจัดการเครื่องมือตัด:** เปลี่ยนระบบจากการที่พนักงานต้องลับคมเอง เป็นการเตรียม **Spare Tools** ที่ลับคมและตั้งค่าไว้ล่วงหน้า (Presetting) สามารถลดเวลา Downtime จาก 48 นาที เหลือเพียง **21 นาที** (ลดลงกว่า 56%)  
  * **การอัปเกรดเทคโนโลยี:** การนำเครื่องปั๊มไฮดรอลิกสมัยใหม่ (MECOL PRESS ME 250\) มาใช้แทนเครื่องเดิม ช่วยเพิ่มกำลังการผลิตได้ 2 เท่า และลดขั้นตอนการตัดขอบ (Trimming) ทำให้ Cycle Time รวมลดลงอย่างมีนัยสำคัญ  
  * **ระบบสื่อสาร:** การใช้ระบบวิทยุสื่อสารเรียกพนักงานขนส่งวัสดุ ช่วยลดเวลาการรอคอยและเพิ่ม Availability ของเครื่องจักร

### **5.2 กรณีศึกษา: การลด Cycle Time ในงานกลึง CNC แบบ High-Mix Low-Volume (MIT Thesis)**

วิทยานิพนธ์จาก MIT นำเสนอวิธีการลด Cycle Time ในสภาพแวดล้อมการผลิตที่มีความหลากหลายสูง ซึ่งเผชิญปัญหาคล้ายคลึงกันคือการตั้งค่าเครื่องจักรที่ไม่เหมาะสม 21:

* **การปรับตั้งค่า Controller:** พบว่าเครื่องจักร CNC มักลดความเร็วลงเองเมื่อเจอทางเดินมีดที่ซับซ้อน งานวิจัยนี้แก้ปัญหาด้วยการเปิดใช้งานฟังก์ชัน **AI Contour Control (AICC)** และ **High-Speed Machining Settings (G05.1 Q1)** ในตัวควบคุม FANUC ซึ่งช่วยให้เครื่องจักรรักษา Feed Rate ได้สูงขึ้นโดยไม่สูญเสียความแม่นยำ  
* **การปรับกลยุทธ์ทางเดินมีด (Toolpath Strategy):** การเปลี่ยนจากรูปแบบการเดินมีดแบบเดิม (Lace/Zig-Zag) เป็นแบบ **Concentric-Optimized** (หรือ VoluMill/Dynamic Milling ในซอฟต์แวร์ CAM สมัยใหม่) ช่วยลดเวลาการเดินเครื่องเปล่า (Air Cutting) และรักษาระดับการกินเนื้องานให้คงที่  
* **ผลลัพธ์:** การปรับปรุงเหล่านี้สามารถลดเวลารอบการผลิต (Total Machining Cycle Time) ลงได้ถึง **25%** และเพิ่มปริมาณผลผลิต (Throughput) ได้ **33%** โดยที่ค่า Material Removal Rate (MRR) เพิ่มขึ้นถึง 60.7% ในบางกระบวนการ

### **5.3 บทเรียนสำหรับการผลิตฝามาตรวัดน้ำ**

จากกรณีศึกษาทั้งสอง สามารถสรุปบทเรียนสำหรับโรงงานผลิตฝามาตรวัดน้ำ HC15-25 ได้ว่า:

1. ปัญหาค่า Availability ต่ำ มักเกิดจาก **Setup Time** และ **Tool Change Time** ที่ยาวนาน การใช้เทคนิค SMED และ Tool Presetting คือทางออกที่ตรงจุด  
2. การเพิ่ม Performance ไม่จำเป็นต้องเร่งเครื่องจักรให้เสี่ยงพัง แต่สามารถทำได้โดยการ **Optimized Toolpath** และการใช้ฟังก์ชันขั้นสูงของ Controller  
3. การลดของเสีย (Quality Improvement) ในงานทองเหลือง ต้องเน้นที่การตรวจสอบสภาพคมตัดทูล (Tool Wear Monitoring) อย่างสม่ำเสมอ เพื่อป้องกันปัญหางานไม่ได้ขนาดหรือเกลียวเสีย

## ---

**6\. บทสรุปและข้อเสนอแนะเชิงกลยุทธ์ (Conclusion & Strategic Recommendations)**

ปัญหาค่า OEE ที่สูงผิดปกติในระดับ World Class (\>90%) อันเนื่องมาจากค่า Performance Rate เกิน 100% ในขณะที่ค่า Availability ต่ำกว่าเกณฑ์ เป็นภาพสะท้อนของ "ภาพลวงตาแห่งประสิทธิภาพ" ที่เกิดจากความล้มเหลวในการกำหนดมาตรฐาน การแก้ไขปัญหานี้ต้องอาศัยการบูรณาการองค์ความรู้ทั้งด้านวิศวกรรมอุตสาหการ สถิติ และการบริหารจัดการการผลิต

จากการสังเคราะห์ข้อมูล รายงานฉบับนี้ขอเสนอข้อเสนอแนะเชิงกลยุทธ์เพื่อการปรับปรุงดังนี้:

1. **การปฏิรูปดัชนีชี้วัด (KPI Reformation):** ยกเลิกการใช้รอบเวลามาตรฐานเดิมที่ทำให้ P \> 100% และกำหนด **Ideal Cycle Time** ใหม่โดยอิงจากขีดจำกัดทางทฤษฎีของเครื่องจักรหรือค่าที่ดีที่สุดในอดีต (Best Demonstrated Practice) เพื่อเปิดเผยความสูญเสียที่แท้จริง  
2. **การประยุกต์ใช้สถิติในการผลิต (Statistical Implementation):** นำระบบ ANOVA มาใช้ในการวิเคราะห์พารามิเตอร์การผลิต (Feed, Speed) เพื่อหาจุดที่เหมาะสมที่สุด และใช้ Taguchi Method ในการออกแบบการทดลองเพื่อลด Cycle Time โดยไม่กระทบคุณภาพ  
3. **การยกระดับการเก็บข้อมูล (Data Collection Upgrade):** เปลี่ยนจากการจดบันทึกด้วยมือมาเป็นการดึงข้อมูล Real-time จาก CNC Controller หรือการใช้เซนเซอร์ IoT เพื่อให้ได้ข้อมูลที่แม่นยำสำหรับการคำนวณ OEE ตามมาตรฐาน ISO 22400  
4. **การมุ่งเน้นที่ Availability:** แก้ไขปัญหาคอขวดด้านเวลาหยุดเครื่อง โดยเน้นการลดเวลา Setup และ Tool Change ด้วยหลักการ SMED และการบริหารจัดการ Spare Tools อย่างมีประสิทธิภาพ

การดำเนินการตามแนวทางนี้จะช่วยเปลี่ยนค่า OEE จากตัวเลขที่บิดเบือน ให้กลายเป็นเข็มทิศที่ชี้ทิศทางสู่การปรับปรุงประสิทธิภาพการผลิตฝามาตรวัดน้ำได้อย่างแท้จริงและยั่งยืน

## ---

**7\. ตารางสรุปข้อมูลทางสถิติและเกณฑ์มาตรฐาน**

### **ตารางที่ 1: ผลการวิเคราะห์ความแปรปรวน (ANOVA) สำหรับปัจจัยที่มีผลต่อ Cycle Time ในงานกลึง**

25

| แหล่งความแปรปรวน (Source) | ระดับนัยสำคัญ (P-Value) | สัดส่วนผลกระทบ (Contribution %) | การตีความผลลัพธ์ (Interpretation) |
| :---- | :---- | :---- | :---- |
| **อัตราป้อน (Feed Rate)** | **0.02** (\< 0.05) | **54.98%** | มีอิทธิพลสูงสุดต่อเวลาในการผลิต ต้องกำหนดค่านี้ให้สูงที่สุดที่คุณภาพยอมรับได้ |
| **ความเร็วตัด (Cutting Speed)** | **0.03** (\< 0.05) | **42.58%** | มีอิทธิพลรองลงมา ควรปรับควบคู่กับ Feed Rate |
| ความลึกในการตัด (Depth of Cut) | \> 0.05 | \- | ไม่มีผลนัยสำคัญต่อเวลาโดยตรง แต่มีผลต่อปริมาณเนื้อวัสดุที่เอาออก (MRR) |
| รัศมีจมูกมีด (Nose Radius) | \> 0.05 | \- | ไม่มีผลนัยสำคัญต่อเวลา แต่มีผลต่อคุณภาพผิวงาน (Ra) |
| **ความคลาดเคลื่อน (Error)** | \- | **2.43%** | ค่าความคลาดเคลื่อนต่ำ แสดงว่าโมเดลมีความน่าเชื่อถือสูง |

### **ตารางที่ 2: เปรียบเทียบวิธีการกำหนด Ideal Cycle Time เพื่อแก้ไขค่า Performance \> 100%**

12

| วิธีการ (Methodology) | คำอธิบาย (Description) | ข้อดี (Pros) | ข้อควรระวัง (Cons) |
| :---- | :---- | :---- | :---- |
| **Theoretical Maximum** | คำนวณจากสูตรฟิสิกส์และสเปคเครื่องจักร | เป็นค่ามาตรฐานที่แท้จริงที่สุด ไม่เปลี่ยนแปลงตามอารมณ์ | อาจดูเป็นไปไม่ได้ในทางปฏิบัติ ทำให้พนักงานท้อใจ |
| **Best Demonstrated** | ใช้ค่าเวลาที่เร็วที่สุดที่เคยทำได้จริงในอดีต | สมเหตุสมผลและยอมรับได้ง่ายกว่า | ต้องมีข้อมูลย้อนหลังที่น่าเชื่อถือ และต้องอัปเดตสม่ำเสมอ |
| **Best \+ Margin** | ใช้ค่าที่ดีที่สุดบวกส่วนเผื่อความท้าทาย (เช่น 5-10%) | ป้องกันค่า P ทะลุ 100% ในระยะยาว | การกำหนด Margin ต้องมีหลักเกณฑ์ชัดเจน ไม่ใช่การเดา |

---

*(หมายเหตุ: เนื้อหารายงานฉบับนี้เรียบเรียงขึ้นจากการสังเคราะห์ข้อมูลวิจัยที่ได้รับ โดยอ้างอิงแหล่งข้อมูลตามรหัสที่ระบุในชุดข้อมูล Snippets)*

#### **ผลงานที่อ้างอิง**

1. ธีรศักดิ์ บทคัดย่อ ส่งอาจารย์.docx  
2. OEE FAQ – Frequently Asked Questions, เข้าถึงเมื่อ กุมภาพันธ์ 17, 2026 [https://www.oee.com/faq/](https://www.oee.com/faq/)  
3. OEE Calculation: Definitions, Formulas, and Examples, เข้าถึงเมื่อ กุมภาพันธ์ 17, 2026 [https://www.oee.com/calculating-oee/](https://www.oee.com/calculating-oee/)  
4. Overall Equipment Effectiveness for Elevators (OEEE) in Industry 4.0: Conceptual Framework and Indicators \- MDPI, เข้าถึงเมื่อ กุมภาพันธ์ 17, 2026 [https://www.mdpi.com/2673-4117/6/9/227](https://www.mdpi.com/2673-4117/6/9/227)  
5. OEE explained: an early warning system for production problems \- Elisa Industriq, เข้าถึงเมื่อ กุมภาพันธ์ 17, 2026 [https://www.elisaindustriq.com/knowledge-center/blog/oee-explained-an-early-warning-system-for-production-problems?hsLang=en](https://www.elisaindustriq.com/knowledge-center/blog/oee-explained-an-early-warning-system-for-production-problems?hsLang=en)  
6. ISO 22400-2:2014 | Codes & Standards \- Purchase | Product | CSA Group, เข้าถึงเมื่อ กุมภาพันธ์ 17, 2026 [https://www.csagroup.org/store/product/iso\_054497/](https://www.csagroup.org/store/product/iso_054497/)  
7. OEE (Overall Equipment Effectiveness): Definition, Factors & Formula \- Symestic, เข้าถึงเมื่อ กุมภาพันธ์ 17, 2026 [https://www.symestic.com/en-us/blog/oee](https://www.symestic.com/en-us/blog/oee)  
8. OEE Factors: Availability, Performance, and Quality, เข้าถึงเมื่อ กุมภาพันธ์ 17, 2026 [https://www.oee.com/oee-factors/](https://www.oee.com/oee-factors/)  
9. Analysis of Overall Equipment Effectiveness (OEE) within different sectors in different Swedish industries. \- Diva-portal.org, เข้าถึงเมื่อ กุมภาพันธ์ 17, 2026 [https://www.diva-portal.org/smash/get/diva2:903747/FULLTEXT01.pdf](https://www.diva-portal.org/smash/get/diva2:903747/FULLTEXT01.pdf)  
10. Productivity improvement of the water meter's body manufacturing process \- MATEC Web of Conferences, เข้าถึงเมื่อ กุมภาพันธ์ 17, 2026 [https://www.matec-conferences.org/articles/matecconf/pdf/2017/26/matecconf\_imane2017\_01003.pdf](https://www.matec-conferences.org/articles/matecconf/pdf/2017/26/matecconf_imane2017_01003.pdf)  
11. Overall Equipment Effectiveness (OEE) Analysis to Minimize Six Big Losses in Continuous Blanking Machine \- Semantic Scholar, เข้าถึงเมื่อ กุมภาพันธ์ 17, 2026 [https://pdfs.semanticscholar.org/f945/74bcec22753461fc29b39b298736f0ceb0ac.pdf](https://pdfs.semanticscholar.org/f945/74bcec22753461fc29b39b298736f0ceb0ac.pdf)  
12. Performance issues in OEE | OEE Academy, เข้าถึงเมื่อ กุมภาพันธ์ 17, 2026 [https://oee.academy/oee-standard/performance-definition/oee-performance-issues/](https://oee.academy/oee-standard/performance-definition/oee-performance-issues/)  
13. How to interpret and improve an OEE over 100 \- TeepTrak, เข้าถึงเมื่อ กุมภาพันธ์ 17, 2026 [https://teeptrak.com/en/comment-interpreter-et-ameliorer-un-oee-superieur-a-100/](https://teeptrak.com/en/comment-interpreter-et-ameliorer-un-oee-superieur-a-100/)  
14. Managing OEE to Optimize Factory Performance \- Semantic Scholar, เข้าถึงเมื่อ กุมภาพันธ์ 17, 2026 [https://pdfs.semanticscholar.org/13ee/1c4be1dd39bd6424100bc826e6e0f89f0d75.pdf](https://pdfs.semanticscholar.org/13ee/1c4be1dd39bd6424100bc826e6e0f89f0d75.pdf)  
15. An Empirical Investigation of the Relationship between Overall Equipment Efficiency (OEE) and Manufacturing Sustainability in Industry 4.0 with Time Study Approach \- MDPI, เข้าถึงเมื่อ กุมภาพันธ์ 17, 2026 [https://www.mdpi.com/2071-1050/10/9/3031](https://www.mdpi.com/2071-1050/10/9/3031)  
16. Practical Guide: Extract Accurate Cycle and Standard Times from CNC Programs for Reliable OEE \- JITbase, เข้าถึงเมื่อ กุมภาพันธ์ 17, 2026 [https://www.jitbase.com/blog/extract-cycle-time-from-cnc-program](https://www.jitbase.com/blog/extract-cycle-time-from-cnc-program)  
17. Estimating Instrument Performance: with Confidence Intervals and ..., เข้าถึงเมื่อ กุมภาพันธ์ 17, 2026 [https://nvlpubs.nist.gov/nistpubs/TechnicalNotes/NIST.TN.2119.pdf](https://nvlpubs.nist.gov/nistpubs/TechnicalNotes/NIST.TN.2119.pdf)  
18. Step-by-Step: Implement Cycle Time Monitoring on Your CNC Shop Floor with Minimal Hardware \- JITbase, เข้าถึงเมื่อ กุมภาพันธ์ 17, 2026 [https://www.jitbase.com/blog/implement-cycle-time-monitoring-cnc-shop-minimal-hardware](https://www.jitbase.com/blog/implement-cycle-time-monitoring-cnc-shop-minimal-hardware)  
19. WORK MEASUREMENT APPROACH TO DETERMINE STANDARD TIME IN ASSEMBLY LINE, เข้าถึงเมื่อ กุมภาพันธ์ 17, 2026 [https://repositori.ukwms.ac.id/id/eprint/26279/1/1-Work\_measurement\_approach\_.pdf](https://repositori.ukwms.ac.id/id/eprint/26279/1/1-Work_measurement_approach_.pdf)  
20. The Ultimate Guide to Manufacturing Time Studies in the Connected Factory, เข้าถึงเมื่อ กุมภาพันธ์ 17, 2026 [https://tulip.co/blog/ultimate-guide-to-time-studies-in-the-connected-factory/](https://tulip.co/blog/ultimate-guide-to-time-studies-in-the-connected-factory/)  
21. Cycle Time Reduction for CNC Machining Workcells in High-Mix Low-Volume Manufacturing, เข้าถึงเมื่อ กุมภาพันธ์ 17, 2026 [https://dspace.mit.edu/bitstream/handle/1721.1/157243/sun-bsun01-meng-meche-2024-thesis.pdf?sequence=1\&isAllowed=y](https://dspace.mit.edu/bitstream/handle/1721.1/157243/sun-bsun01-meng-meche-2024-thesis.pdf?sequence=1&isAllowed=y)  
22. Optimization of Production Process and Machining Time in CNC Cell through the Execution of Different Lean Tools \- Research India Publications, เข้าถึงเมื่อ กุมภาพันธ์ 17, 2026 [https://www.ripublication.com/ijaer17/ijaerv12n23\_38.pdf](https://www.ripublication.com/ijaer17/ijaerv12n23_38.pdf)  
23. Drive Operational Excellence with Time Study Analysis. The Ultimate Guide \- SixSigma.us, เข้าถึงเมื่อ กุมภาพันธ์ 17, 2026 [https://www.6sigma.us/work-measurement/time-study-analysis/](https://www.6sigma.us/work-measurement/time-study-analysis/)  
24. Research on Data-Driven Optimization Algorithm for Machining ..., เข้าถึงเมื่อ กุมภาพันธ์ 17, 2026 [https://ieeexplore.ieee.org/document/11069061/](https://ieeexplore.ieee.org/document/11069061/)  
25. Optimization of Multiple Performance Characteristics for CNC ... \- MDPI, เข้าถึงเมื่อ กุมภาพันธ์ 17, 2026 [https://www.mdpi.com/2075-4701/14/2/186](https://www.mdpi.com/2075-4701/14/2/186)  
26. Design Parameters Optimization in CNC Machining Based on Taguchi, ANOVA, and Screening Method \- UiTM Institutional Repository, เข้าถึงเมื่อ กุมภาพันธ์ 17, 2026 [https://ir.uitm.edu.my/87293/1/87293.pdf](https://ir.uitm.edu.my/87293/1/87293.pdf)  
27. Optimization of Process Parameters in CNC Turning of Aluminum 7075 Alloy Using L27 Array-Based Taguchi Method \- PMC, เข้าถึงเมื่อ กุมภาพันธ์ 17, 2026 [https://pmc.ncbi.nlm.nih.gov/articles/PMC8401492/](https://pmc.ncbi.nlm.nih.gov/articles/PMC8401492/)

[image1]: <data:image/png;base64,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>

[image2]: <data:image/png;base64,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>

[image3]: <data:image/png;base64,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>

[image4]: <data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAwAAAAYCAYAAADOMhxqAAAAtklEQVR4XmNgGAWDDYgBMTMSXwCLGBjwA/EWIPYF4v9AfAaIl0HlhIH4HBBfhfLBwAWIlwNxOgNEwx4GiCEgwAPEB4D4IZQPBp5QvAaI/wGxB5KcEhA/Z0CzAQZ+A/FWIOaA8lkYIDajGwIHIOeUI/EVgfgJEF8HYnEgjgFidpgkyDSQDTYwAQaEn1qh/MlAzAiTNAbi+cgCQKAPxK+BeD8QX0QSBwNQWLOiCzJA/CMJpUcB7QAAc/QdgqUT/vMAAAAASUVORK5CYII=>

[image5]: <data:image/png;base64,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>

[image6]: <data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAoAAAAZCAYAAAAIcL+IAAAAkElEQVR4XmNgGAW0AIxALATErEhivEhsOLgOxP+B+AoQqzBANFZAaTgwRBNwA+IzSHyswACIdwKxPLoEMnAB4h1ALIMugQy8gXgVA8RDOAHIfXOAmBtNTBKJz2AGxM+B+AcQPwXilUB8Goh/ISsSA+L9DBDFIE88YoAE0TcgjkVSBw5cfiQ+BwPEOhA9CogDAIEOEq87fQxPAAAAAElFTkSuQmCC>

[image7]: <data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAkAAAAaCAYAAABl03YlAAAAoElEQVR4XmNgGAXkAmYgFgNiYXQJEABJ5gDxWyA+BMRXgFgeRQUQxADxbSBWhfJlgHgSQhoCTgDxUiBmhPJzgbgBLgsFD4H4FwNEtzYQczNAnIACQIKFQHwJiP8C8X8gFkFWoAbEzkh8ISA+DMSaMAEWIF4OxHNgAlAAspYfxoEpAvkGBsyA+DkSHwwMgPg0EM8C4n1A/AiIw1FUjAKCAACOKhZmQ1qF3gAAAABJRU5ErkJggg==>

[image8]: <data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAA8AAAAbCAYAAACjkdXHAAAA9ElEQVR4Xu2RPw4BQRSHn0QpESEOoCNEoZI4AIVOonAAF5C4BxWRKEkUopE4A6VSo9FpJAqF8PvlzdgxZDnAfsmXnX1/dt7MikQ04PhPWftGCbbgCj7g0bxbO3Bkcn3T88FAtGDqJwwn2PSDJAW3os1dL2dZw5ofJHl4hldYceIFmDHrJSw7uRc8F3fl7pyCJOBC9MNkDrNm/cIdeSd6q3vzznsIxY58gz3RGx7Cu+hEoXwbOQ03EoxMeIwPJqLNfFpycCZBQxzWg3SAPW/YiEWY9IPkYvz6G0R3dad6wz+vSwy24cENVkVvl42/ZB3rIyL+4wm53T9I1ue+FgAAAABJRU5ErkJggg==>

[image9]: <data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAXEAAABKCAYAAABNTWR+AAAEqElEQVR4Xu3dW6imUxgA4Fcoh0Fqcoga5IIiF7ggrigkRlKj3Lii5EJcOFxoJklzJVLKIbmY5BTlVCjDjVM5XMiF1CRyISlFSYz1Wv83+9tr7//f/94/e3//7Oept+n71rf3/FfvXv/7rfWuCAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAmH83lNhT4okmXi2xvfccAAN0dtREvrvE/hIPja6vK7G19xwAA3VEiTeiJnEA5swpJfaFJA4wly4v8XeJH9sBAIatX0p5sBkDYODOiDoDz5l4zsgBmCPXRp2Ff1/i1GYsbYk6WwdggB6NmsSzpLJcsn6pxEXtTQCG4ecYX0o5vMSt7U0AhiNn4fuiLjPsO7TEvSVOb+4DMBDHRU3ir0SddacTSlxZ4pPR2CGj+wAMxFVRE/RKkWUWgME4LOqLukxQn8dCs6cvR/fui9o3ZFeJF6PWi7O3CAADkAn5hxI7YqFM0E/sbengq9AECmAwcqXFU1ETd2dS35Bxy+4A2ADPx9I1z13fkCydtHINNQAD1e8bImEDzJmub0gm8dx+Pquro74YnTYujqV1eACm1PUNyUSeCX1WkjjAOur6hrxb4uhmbCi2HaRxUgDMaFLfkKFok9/BEpI4MLP9Mb4F61r8FEt3PU6K10sc9e9PArAqWYvORDppLfixJR4u8XKJPVF7jQCwwbJD31lRk/juGJ/EswnUzVET/p0lzls0CsBgnRjzc+Zk/hHKz9t1IgTY9M4vcU17c4Bui1rXfytqX5j19lGJ70bxRTOWcgXQ07HQbOyREqf1HwD4P2wtcX3v+sgSZ/auh+KvEreX+CBqeWi95Xr3nVFX+eT/n98I+i4rcX+J36Kux89r3xiAdfFxiVtK3FPiuWZsCLKR169Rl0hmO91fFg+vm7tLvB81Ud/YjKXjo45f0g4AbGaZFCetrlnOSs8eE/XF77RyeebeqN0g80SgnJHnv303RW332+8eCbDpZXJc7cvXz2J8WShX4WRZ5uR2YIL8FpDfUjJBb4laUumuO1kXd+AyQNSDi/NFZrtx6M8Sl/aeGyf7u2Qib08sygSetfXV7qTMPyJZTunkZ8myzjmj6yylvBP1RTHAppeljjzMOGfTH5a4IurMOe9NWwbJRP5NiQtG15nA7yrx9oEnpvdaLK51fx01kT8Q9fdm8s4knskcgJELS/weszXuyi6KeZbom7H23agvxOLSSf+bQs7sn4la9gGgJxPjrEsKc6lflmG2twOr0Na6c/b9WNTPljte34ulpRuATa9ro7tWue49zxs9N2qNvL8mflq5kiW/EbTyCLw/on6+nOXnC08ARrpj5bKcshZZgnm2xOOj620lPi2x48AT08kZdm6KamV5JVeoZBJ37B1Ao6uHZyJfrZwZ74zld03mypSsY6902lD+bH6Gb2PpDs1O1thzS/5/cWISwEGlq4evdo14uiMmJ+nsbTJuHXnKHZnt8sZxs+18dqXNRQCbTibNoZ9IBEBPJuzsTZJ162wk1d9gA8DAZRJ/MmoJJQ92Xuu6bgA2QO7G3FtiV9Rj4wAAAAAAAAAAAAAAAAAAAAAAAAAAAADm1T/VpuMxtPCikAAAAABJRU5ErkJggg==>

[image10]: <data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABIAAAAaCAYAAAC6nQw6AAABFUlEQVR4Xu2TsY5BQRSGj4iERLJWNpR2dRKFROcNFDqdRke2tAmJSJT63U6jXnTiIURLqaDZSkkn9j/OvWucm+VelL7kK+YcM+afO0P0wC0B2HVpC0ZlmpM03MJvOk4YwR38gkVYt37zA5MyzUmDnP9SglP4fKH2RwgOVc0He/BT1QtwDIOqfqAMq6qWhRuYUvUarKjaWTjCnv6J4BY7Fi90Ey9wTndYyD6ftW54wYylv5gnzFh84FdjxtKf3obv3QfJfeLdJ07bRGHYJtnNDL6edIUnOIAd6Id5ywNxuCBZQMsxOa4NX9wVfLPG3OMH75klybu8GT6XpjHmeDlj7JoMnJC8uXfYJ7kyV8G7iMGIbjw4zy8oajlCo9pOlAAAAABJRU5ErkJggg==>

[image11]: <data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAA0AAAAaCAYAAABsONZfAAAAuUlEQVR4XmNgGP4gAIjnAvEsNDwTiIWR1KEAXSAOAeKlQPwfiLOhfGcgZkVShxVMYoBoYkSXwAV4gfgwA0QT0SCIAaLhNLoEPgBz2hx0CVwA2WnRaHI4gSYQvwXiT0CsjyaHEyD7RxBNDgRAYighChIAKcblNJBiP3RBmNO+ArExmhwIgMTE0QVBpuNymgQQH2LAEtlrGSCaQEkIJikNxMlA/BGI/0HFwMASiH8yQDTgwyRF9igYeAAA03ssSn5UfZIAAAAASUVORK5CYII=>

[image12]: <data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAwAAAAYCAYAAADOMhxqAAAAs0lEQVR4XmNgGJJAAIiF0QWxAX4gXgHEF4H4DJSPFzwB4j1A7APEfxmI0PAfiOegC+IDIA3p6IK4AAsQ/wZiG3QJdMABxJJA7A7Ex4FYBcoHhRRe4MtAovurgLgIXRAXEAHiq0CshC6BC2gC8Vsg5kWXwAU8GSBBShQABecaBkiQEgVg7gdhvIAPiAOA2BCIPwHxJFRpTABScACIM4H4KxAbo8hiASAbDgBxMBAzo0oNPwAAvkQaBf3WP04AAAAASUVORK5CYII=>

[image13]: <data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABIAAAAZCAYAAAA8CX6UAAABD0lEQVR4Xu2SsUoDQRRFrxALixAEwcIqZQqjYKXgB9hYBItA/iJfkG9IUkiaQJo0doqIgrWdZfqQ1g9IEfRe3gzOzG42JKTcAweWeW/vzJtdoGRb7ugXnTubcRm39ImOAi+jDsc5faCP9JdOaSWon9EO/aQrOqAnQT3imL7SG1hYL6oCB3QMCyykAQtSoIJm9DSo+43UV4h26rvnBSys/V/GFf2ABRaiEH/sISzojR65tXCjtYRjCb2sEIUpdKexPBpLQRpTY73QatSRQziWRxetC1dY3kYZdOx3epEWYL+Agp5pKy5lSe8npA4b7Qcb7ueQftMJrSU1zzU2jKWGJezo3m7UYegL3qeLJSX75A/RdzUL5u12HAAAAABJRU5ErkJggg==>