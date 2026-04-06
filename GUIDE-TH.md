# คู่มือใช้งาน ReadMD บน iPad และใช้สิทธิ์ GitHub Student ให้คุ้ม

> หมายเหตุ: คู่มือนี้เป็นเอกสารของเวอร์ชันก่อนที่ใช้ `public/docs` และ GitHub เป็นที่เก็บไฟล์อ่านโดยตรง
> เวอร์ชันปัจจุบันของโปรเจกต์ถูกปรับเป็น **ReadShelf Personal แบบ local-only**
> กล่าวคือ ตัวโปรแกรมยัง deploy ผ่าน GitHub Pages ได้ แต่หนังสือ โฟลเดอร์ progress และ bookmark จะเก็บอยู่ในเครื่องที่ใช้งานเป็นหลัก
> ถ้าต้องการ workflow ล่าสุด ให้ยึด [README.md](C:\IE Engineer 2568\ALL Thesis Program\Ipad-Read-MD\README.md) เป็นหลักก่อน

เอกสารนี้อธิบายแบบละเอียดตั้งแต่:

1. โปรเจกต์นี้คืออะไร
2. ใช้งานบนเครื่องตัวเองอย่างไร
3. เอาขึ้น GitHub Pages ให้เปิดจาก iPad ผ่านอินเทอร์เน็ตได้อย่างไร
4. อัปไฟล์ `.md` ขึ้น GitHub แล้วให้อ่านบนเว็บได้อย่างไร
5. ใช้สิทธิ์ GitHub Student กับโปรเจกต์นี้อย่างไร
6. ปัญหาที่เจอบ่อยและวิธีแก้

---

## 1. โปรเจกต์นี้คืออะไร

โปรเจกต์นี้เป็นเว็บแอพสำหรับอ่านไฟล์ Markdown (`.md`) บน iPad โดยมีแนวคิดหลักคือ:

- เปิดอ่านผ่าน Safari ได้
- เอาขึ้น GitHub Pages ได้
- อ่านผ่านอินเทอร์เน็ตได้ ไม่ต้องอยู่ Wi-Fi วงเดียวกับคอม
- จำตำแหน่งที่อ่านล่าสุดของแต่ละเอกสารได้
- มี bookmark สำหรับมาร์กจุดที่อยากกลับมาอ่าน

ตัวเว็บจะโหลดเอกสารจากโฟลเดอร์ `public/docs` หรืออ่านรายชื่อไฟล์จาก GitHub repository ของคุณตอน deploy แล้ว

---

## 2. โครงสร้างไฟล์สำคัญในโปรเจกต์

ไฟล์สำคัญมีดังนี้:

- `src/App.jsx`
  ใช้ควบคุมการแสดงผล, โหลด Markdown, จำตำแหน่งอ่าน, และ bookmark

- `src/styles.css`
  ใช้ควบคุมหน้าตาเว็บ

- `public/docs`
  เป็นที่เก็บไฟล์ `.md` ที่อยากให้อ่านบนเว็บ

- `.github/workflows/deploy-pages.yml`
  เป็น GitHub Actions สำหรับ deploy เว็บขึ้น GitHub Pages อัตโนมัติ

- `vite.config.js`
  ตั้งค่า Vite ให้ใช้ path แบบเหมาะกับ GitHub Pages

---

## 3. วิธีรันโปรเจกต์บนเครื่องตัวเอง

เปิด terminal ในโฟลเดอร์โปรเจกต์นี้ แล้วรัน:

```powershell
npm install
npm run dev
```

หลังจากนั้น Vite จะขึ้น URL สำหรับเปิดเว็บในเครื่อง

ตัวอย่าง:

```text
http://localhost:5173/
```

ถ้าจะเปิดจากอุปกรณ์อื่นในวงเดียวกันชั่วคราว:

```powershell
npm run dev -- --host
```

ข้อสังเกต:

- แบบ `localhost` ใช้เปิดในคอมตัวเอง
- แบบ `--host` ใช้ทดสอบจาก iPad ได้ แต่ต้องอยู่เครือข่ายเดียวกัน
- ถ้าต้องการใช้งานจริงจากที่ไหนก็ได้ ให้ deploy ขึ้น GitHub Pages

---

## 4. วิธีเพิ่มไฟล์ Markdown เพื่อให้อ่านบนเว็บ

### วิธีพื้นฐาน

นำไฟล์ `.md` ของคุณไปวางในโฟลเดอร์:

```text
public/docs
```

ตัวอย่าง:

```text
public/docs/thesis-log.md
public/docs/lecture-week-1.md
public/docs/research-note.md
```

### หลังจากเพิ่มไฟล์แล้ว

ถ้าเว็บรันจาก GitHub Pages:

- ระบบจะพยายามอ่านรายชื่อไฟล์ `.md` จาก `public/docs` ใน repo ของคุณอัตโนมัติ
- ไม่จำเป็นต้องแก้รายชื่อในโค้ดทุกครั้ง

ถ้ารันในเครื่องและอยากมีไฟล์ตัวอย่าง fallback:

- โปรเจกต์ยังมี fallback document อยู่ใน `src/App.jsx`

---

## 5. วิธีใช้งานบน iPad แบบไม่ต้องพึ่ง Wi-Fi วงเดียวกัน

แนวทางที่ถูกต้องคือ:

1. Push โค้ดขึ้น GitHub
2. ใช้ GitHub Actions deploy ขึ้น GitHub Pages
3. เปิด URL นั้นบน iPad ผ่านอินเทอร์เน็ต

เมื่อทำเสร็จแล้ว URL จะหน้าตาประมาณนี้:

```text
https://USERNAME.github.io/REPO/
```

ตัวอย่าง:

```text
https://moofilm.github.io/ipad-read-md/
```

จากนั้นเปิดผ่าน Safari บน iPad ได้ทันที

---

## 6. วิธีสร้าง GitHub repository และ push โปรเจกต์ขึ้นไป

ถ้ายังไม่ได้สร้าง repo:

1. ไปที่ GitHub
2. กด `New repository`
3. ตั้งชื่อ repo เช่น `ipad-read-md`
4. กดสร้าง repository

จากนั้นกลับมาที่ terminal ในเครื่อง แล้วรัน:

```powershell
git init
git add .
git commit -m "initial readmd app"
git branch -M main
git remote add origin https://github.com/USERNAME/REPO.git
git push -u origin main
```

เปลี่ยน `USERNAME` และ `REPO` ให้ตรงกับของจริง

ตัวอย่าง:

```powershell
git remote add origin https://github.com/MooFilm/ipad-read-md.git
```

---

## 7. วิธีเปิด GitHub Pages

หลัง push โค้ดขึ้น GitHub แล้ว:

1. เข้า repo ของคุณบน GitHub
2. ไปที่ `Settings`
3. ไปที่ `Pages`
4. ในหัวข้อ `Source` ให้เลือก `GitHub Actions`

โปรเจกต์นี้มีไฟล์ workflow พร้อมแล้วที่:

```text
.github/workflows/deploy-pages.yml
```

เมื่อ push ขึ้น branch `main`:

- GitHub จะ build โปรเจกต์
- สร้างไฟล์เว็บจาก `dist`
- deploy ขึ้น GitHub Pages อัตโนมัติ

---

## 8. วิธีอัปไฟล์ `.md` ขึ้น GitHub เพื่อให้อ่านได้จาก iPad

มี 2 วิธี

### วิธีที่ 1: อัปจากเครื่องตัวเอง

1. วางไฟล์ `.md` ลงใน `public/docs`
2. รัน:

```powershell
git add .
git commit -m "add markdown files"
git push
```

3. รอ GitHub Actions deploy ใหม่
4. เปิดเว็บบน iPad แล้วรีเฟรช

### วิธีที่ 2: อัปผ่านหน้าเว็บ GitHub

1. เข้า repo ของคุณ
2. เปิดโฟลเดอร์ `public/docs`
3. กด `Add file`
4. เลือก `Upload files`
5. ลากไฟล์ `.md` ลงไป
6. กด commit

ข้อดีของวิธีนี้:

- ไม่ต้องเปิดคอมก็ได้ ถ้าคุณอัปจากเครื่องอื่น
- แก้เอกสารเล็ก ๆ น้อย ๆ ได้เร็ว

---

## 9. วิธีที่ระบบจำจุดอ่านทำงาน

ระบบนี้ใช้ `localStorage` ของ browser

หมายความว่า:

- ถ้าคุณอ่านบน iPad เครื่องเดิมใน browser เดิม ตำแหน่งอ่านจะถูกจำไว้
- ถ้าเปลี่ยนเครื่อง หรือเปลี่ยน browser ค่าจะไม่ซิงก์กันเอง

สิ่งที่จำไว้ตอนนี้:

- เปอร์เซ็นต์ที่อ่านล่าสุด
- bookmark ที่กดมาร์กเอง

ดังนั้นระบบนี้เหมาะมากสำหรับ:

- อ่านบน iPad เครื่องเดิมต่อเนื่อง
- อ่าน lecture note
- อ่าน thesis note
- อ่าน research log

ถ้าในอนาคตอยากซิงก์ข้ามอุปกรณ์ ต้องเพิ่ม backend เช่น:

- Supabase
- Firebase
- GitHub Gist

---

## 10. วิธีใช้เว็บบน iPad ให้เหมือนแอพ

เมื่อ deploy แล้ว:

1. เปิดเว็บใน Safari บน iPad
2. กดปุ่ม Share
3. เลือก `Add to Home Screen`

ผลลัพธ์คือ:

- จะมีไอคอนบนหน้าจอหลัก
- เปิดได้คล้ายแอพ
- เข้าถึงง่ายกว่าการเปิดผ่าน browser ทุกครั้ง

---

## 11. สิทธิ์ GitHub Student ที่เกี่ยวกับโปรเจกต์นี้

ตอนนี้คุณผ่าน GitHub Education แล้ว และประโยชน์ที่น่าใช้กับโปรเจกต์นี้มีดังนี้

### 11.1 GitHub Copilot

ใช้ช่วย:

- เขียน React component
- ช่วยแก้ bug
- ช่วย refactor โค้ด
- ช่วยเขียน Markdown จำนวนมาก
- ช่วยเขียน README และเอกสาร

กรณีใช้งานจริงกับโปรเจกต์นี้:

- ให้ Copilot ช่วยเพิ่มระบบค้นหาในเอกสาร
- ให้ช่วยทำ table of contents
- ให้ช่วยทำ dark mode
- ให้ช่วยเพิ่ม upload file ผ่านหน้าเว็บ

### 11.2 GitHub Pages

ใช้เป็น hosting ฟรีสำหรับเว็บนี้

ข้อดี:

- ฟรี
- เปิดจาก iPad ได้ทันที
- เชื่อมกับ repo โดยตรง
- deploy อัตโนมัติด้วย Actions ได้

### 11.3 Private repositories

ถ้าคุณอยากเก็บงาน thesis หรือ note แบบไม่ public มากนัก บางช่วงอาจใช้ private repo ได้

แต่ต้องเช็กว่า GitHub Pages ของ repo แบบที่คุณใช้เปิดได้ตามสิทธิ์บัญชีในช่วงเวลานั้นหรือไม่

ถ้าต้องการง่ายสุดและไม่มีปัญหาเรื่องเข้าถึง:

- ใช้ public repo สำหรับเว็บอ่าน `.md`

### 11.4 Codespaces

ใช้เปิดโปรเจกต์นี้บน cloud ได้ โดยไม่ต้องพึ่งเครื่องเดิมตลอดเวลา

เหมาะเมื่อ:

- อยากแก้เว็บจากเครื่องอื่น
- อยากแก้จาก browser
- อยากทดลองโดยไม่ตั้งค่าเครื่องใหม่

---

## 12. เช็กลิสต์ก่อนใช้งานจริง

ก่อนเปิดใช้งานจริงบน iPad ให้เช็กดังนี้:

- `npm run build` ผ่าน
- repo push ขึ้น GitHub แล้ว
- เปิด `Settings > Pages` แล้ว
- เลือก `GitHub Actions` เป็น source แล้ว
- มีไฟล์ `.md` อยู่ใน `public/docs`
- เปิด URL ของ Pages ได้แล้ว
- ทดสอบบน iPad แล้วว่าอ่านได้
- ทดสอบรีเฟรชหน้าแล้วตำแหน่งอ่านกลับมา
- ทดสอบ bookmark แล้วใช้งานได้

---

## 13. ปัญหาที่เจอบ่อย

### 13.1 เปิดเว็บแล้วหน้าโล่ง

สาเหตุที่เป็นไปได้:

- GitHub Pages ยัง deploy ไม่เสร็จ
- workflow failed
- path ไฟล์ไม่ถูกต้อง

วิธีเช็ก:

1. ไปที่แท็บ `Actions` ใน repo
2. ดูว่า workflow `Deploy to GitHub Pages` สำเร็จหรือไม่

### 13.2 อัปไฟล์ `.md` แล้วไม่ขึ้นบนเว็บ

เช็กดังนี้:

1. ไฟล์อยู่ใน `public/docs` จริงหรือไม่
2. นามสกุลเป็น `.md` จริงหรือไม่
3. commit แล้ว push แล้วหรือยัง
4. GitHub Pages deploy ใหม่เสร็จหรือยัง

### 13.3 ตำแหน่งอ่านไม่จำ

เช็กดังนี้:

- ใช้ browser เดิมหรือไม่
- เปิดโหมด private/incognito หรือไม่
- browser ล้าง localStorage หรือไม่

### 13.4 อ่านบน iPad ได้ แต่พอกลับมาอีกวันตำแหน่งไม่เหมือนเดิม

สาเหตุ:

- localStorage ถูกลบ
- เปลี่ยน browser
- เอกสารถูกแก้ไขจนความยาวเปลี่ยนไป

---

## 14. แนวทางพัฒนาต่อในอนาคต

ถ้าจะทำให้โปรเจกต์นี้ดีขึ้นอีก สามารถเพิ่มได้ดังนี้:

### 14.1 ระบบซิงก์ข้ามอุปกรณ์

แนวคิด:

- เก็บ progress ไว้ในฐานข้อมูล
- ผูกกับ user account
- เปิดจาก iPad หรือคอมก็จำจุดเดียวกันได้

เครื่องมือที่เหมาะ:

- Supabase
- Firebase

### 14.2 ระบบอัปโหลดไฟล์ผ่านหน้าเว็บ

ตอนนี้การอัป `.md` ต้องทำผ่าน GitHub หรือ git

ถ้าจะให้ง่ายขึ้น:

- ทำหน้า admin
- อัปโหลดไฟล์ผ่าน browser
- เซฟเข้า storage หรือ repo

### 14.3 สารบัญอัตโนมัติ

อ่าน heading จาก Markdown แล้วสร้าง:

- table of contents
- jump links
- mini navigator ด้านข้าง

### 14.4 ระบบค้นหาในเอกสาร

ช่วยเวลาอ่านเอกสารยาว ๆ มาก

---

## 15. คำสั่งที่ใช้บ่อย

ติดตั้งแพ็กเกจ:

```powershell
npm install
```

รัน dev server:

```powershell
npm run dev
```

build สำหรับ production:

```powershell
npm run build
```

push งานขึ้น GitHub:

```powershell
git add .
git commit -m "update markdown library"
git push
```

---

## 16. รูปแบบ workflow ที่แนะนำสำหรับคุณ

ผมแนะนำ workflow ใช้งานจริงแบบนี้:

1. เขียนหรือแก้ไฟล์ `.md` บนคอม
2. วางไฟล์ใน `public/docs`
3. commit และ push ขึ้น GitHub
4. รอ GitHub Pages deploy อัตโนมัติ
5. เปิดจาก iPad อ่านต่อ
6. ถ้าอ่านค้างไว้ ระบบจะจำตำแหน่งให้อัตโนมัติ

กรณีรีบมาก:

1. เข้า GitHub จาก browser
2. อัปโหลด `.md` เข้า `public/docs`
3. รอ deploy
4. เปิดบน iPad

---

## 17. ข้อแนะนำสุดท้าย

สำหรับระยะแรก ผมแนะนำให้ใช้โปรเจกต์นี้แบบง่ายที่สุดก่อน:

- ใช้ GitHub Pages เป็นที่เปิดเว็บ
- ใช้ `public/docs` เป็นที่เก็บไฟล์
- ใช้ iPad เครื่องเดิมอ่านต่อเนื่อง

พอใช้งานจริงคล่องแล้ว ค่อยเพิ่ม:

- search
- table of contents
- sync ข้ามอุปกรณ์
- upload ผ่านหน้าเว็บ

แนวนี้จะทำให้คุณได้ของที่ใช้งานได้จริงเร็วที่สุด และไม่ซับซ้อนเกินไปในรอบแรก

---

## 18. สรุปสั้นที่สุด

ถ้าอยากใช้งานให้ได้จริงเร็วที่สุด:

1. push โปรเจกต์ขึ้น GitHub
2. เปิด GitHub Pages
3. ใส่ไฟล์ `.md` ไว้ใน `public/docs`
4. push ทุกครั้งที่มีไฟล์ใหม่
5. เปิดเว็บจาก iPad ผ่านลิงก์ GitHub Pages

เท่านี้คุณก็จะมีเว็บอ่าน Markdown ของตัวเองที่เปิดจาก iPad ได้จริงแล้ว
