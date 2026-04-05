# ReadMD on iPad

Starter web app สำหรับอ่านไฟล์ Markdown บน iPad พร้อมระบบจำตำแหน่งอ่านและ bookmark

## เริ่มใช้งานในเครื่อง

```bash
npm install
npm run dev
```

ถ้าจะเปิดจากอุปกรณ์อื่นในวงเดียวกันชั่วคราว ใช้:

```bash
npm run dev -- --host
```

## เพิ่มไฟล์ Markdown

1. วางไฟล์ไว้ใน `public/docs`
2. commit แล้ว push ขึ้น GitHub

เมื่อเว็บรันบน GitHub Pages ระบบจะอ่านรายการไฟล์ `.md` จากโฟลเดอร์ `public/docs` ใน repository ของคุณอัตโนมัติ

## Deploy ขึ้น GitHub Pages

โปรเจกต์นี้มี workflow ที่ deploy ให้อัตโนมัติเมื่อ push ขึ้น branch `main`

1. สร้าง repository บน GitHub
2. push โค้ดชุดนี้ขึ้น branch `main`
3. เข้า `Settings > Pages`
4. ที่ `Source` เลือก `GitHub Actions`
5. รอ workflow `Deploy to GitHub Pages` ทำงานเสร็จ
6. เปิดลิงก์เว็บจาก GitHub Pages บน iPad ได้เลย

URL จะมีหน้าตาประมาณ:

```text
https://YOUR-USERNAME.github.io/YOUR-REPOSITORY/
```

## วิธีอัปไฟล์ .md ขึ้นเว็บ

ทุกครั้งที่อยากเพิ่มหรือแก้ไฟล์อ่าน:

1. เพิ่มไฟล์ `.md` ลงใน `public/docs`
2. `git add .`
3. `git commit -m "add new markdown"`
4. `git push`

ไม่ต้องเปิดเครื่องค้างไว้ และไม่ต้องอยู่ Wi-Fi เดียวกับ iPad เพราะไฟล์ถูกเสิร์ฟจาก GitHub Pages ผ่านอินเทอร์เน็ต

ถ้าสะดวกทำผ่านหน้าเว็บ GitHub ก็ได้:

1. เข้า repository ของคุณ
2. เปิดโฟลเดอร์ `public/docs`
3. กด `Add file`
4. เลือก `Upload files`
5. ลากไฟล์ `.md` เข้าไปแล้ว commit

## ไอเดียต่อยอด

- ซิงก์ตำแหน่งอ่านข้ามอุปกรณ์ด้วยฐานข้อมูล
- ระบบอัปโหลดไฟล์ผ่านหน้าเว็บ
- สารบัญจาก heading อัตโนมัติ
