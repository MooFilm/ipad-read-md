# คู่มือตั้งค่า Private Shelf และ Login

ไฟล์นี้อธิบายวิธีเปิดใช้งานระบบล็อกอิน + ชั้นหนังสือ private สำหรับโปรเจกต์นี้แบบที่ไฟล์ private จะไม่ไปอยู่ใน GitHub และไม่หลุดไปพร้อม repo public

## หลักการสำคัญ

- ไฟล์ใน `public/docs` คือ public ทุกคนเห็นได้
- ไฟล์ที่อยากซ่อน ต้องย้ายไปเก็บใน Supabase Storage แบบ `private bucket`
- รายชื่อไฟล์ private จะถูกเก็บในตาราง `private_documents`
- สิทธิ์ของคนอ่านจะถูกเก็บในตาราง `profiles`
- หน้าเว็บนี้จะเรียกดูไฟล์ private ได้ก็ต่อเมื่อล็อกอินผ่าน Supabase Auth สำเร็จ

## 1. สร้างโปรเจกต์ Supabase

1. ไปที่ [Supabase Dashboard](https://supabase.com/dashboard)
2. กด `New project`
3. ตั้งชื่อโปรเจกต์
4. รอระบบสร้างฐานข้อมูล

## 2. เอาค่า URL และ anon key

ไปที่ `Project Settings > API`

คัดลอก 2 ค่านี้:

- `Project URL`
- `anon public key`

แล้วสร้างไฟล์ `.env` ในโฟลเดอร์โปรเจกต์นี้ตามตัวอย่างจาก `.env.example`

```env
VITE_SUPABASE_URL=ใส่ Project URL
VITE_SUPABASE_ANON_KEY=ใส่ anon key
VITE_SUPABASE_PRIVATE_BUCKET=private-docs
VITE_AUTH_ADMIN_EMAIL=thirasak@readmd.local
VITE_AUTH_USER_EMAIL=user@readmd.local
```

หมายเหตุ:

- ไฟล์ `.env` ห้ามอัปขึ้น GitHub
- โปรเจกต์นี้ตั้ง `.gitignore` กันไว้แล้ว

## 2.1 ตั้งค่าให้ GitHub Pages build ได้ด้วย

เพราะเว็บนี้ถูก build บน GitHub Actions ก่อนขึ้น Pages ดังนั้นค่า `VITE_...` ต้องถูกใส่ใน GitHub ด้วย ไม่ใช่มีแค่ในเครื่อง

ไปที่ repo นี้บน GitHub:

`Settings > Secrets and variables > Actions`

สร้างค่าเหล่านี้:

### Variables

- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_PRIVATE_BUCKET`
- `VITE_AUTH_ADMIN_EMAIL`
- `VITE_AUTH_USER_EMAIL`

### Secret

- `VITE_SUPABASE_ANON_KEY`

ค่าที่แนะนำ:

- `VITE_SUPABASE_PRIVATE_BUCKET=private-docs`
- `VITE_AUTH_ADMIN_EMAIL=thirasak@readmd.local`
- `VITE_AUTH_USER_EMAIL=user@readmd.local`

เมื่อ push โค้ดใหม่ GitHub Actions จะเอาค่าเหล่านี้ไป build ให้หน้าเว็บบน Pages ใช้ Supabase ได้จริง

## 3. รัน schema สำหรับฐานข้อมูล

1. ไปที่ `SQL Editor`
2. เปิดไฟล์ [supabase-schema.sql](C:/IE%20Engineer%202568/ALL%20Thesis%20Program/Ipad-Read-MD/supabase-schema.sql)
3. คัดลอกทั้งหมดไปวาง
4. กด `Run`

schema นี้จะสร้าง:

- ตาราง `profiles`
- ตาราง `private_documents`
- policy สำหรับอ่าน profile ของตัวเอง
- policy สำหรับอ่านเอกสาร private ตาม role

## 4. สร้าง bucket สำหรับไฟล์ private

1. ไปที่ `Storage`
2. กด `New bucket`
3. ตั้งชื่อ `private-docs`
4. ปิด `Public bucket` ให้เป็น private

หลังจากนั้นอัปไฟล์ `.md` ที่อยากซ่อนขึ้น bucket นี้แทนการใส่ไว้ใน `public/docs`

ตัวอย่าง path:

```text
thesis/secret-plan.md
admin/meeting-note.md
shared/internal-guide.md
```

## 5. สร้างผู้ใช้สำหรับ login

ไปที่ `Authentication > Users`

สร้าง user อย่างน้อย 2 คน:

1. Admin
   - Email: `thirasak@readmd.local`
   - Password: ตั้งเองใน Dashboard
2. User
   - Email: `user@readmd.local`
   - Password: ตั้งเองใน Dashboard

ถ้าคุณอยากใช้ email อื่นก็ได้ แต่ต้องแก้ค่าใน `.env` ให้ตรง

หมายเหตุด้านความปลอดภัย:

- รหัสผ่านแบบ `1234` อ่อนมาก
- ถ้าใช้จริง แนะนำให้ใช้รหัสผ่านที่ยาวและเดายากกว่า
- ถ้าคุณตั้งรหัสผ่านง่าย ระบบนี้จะยังปลอดภัยกว่าการ hardcode ลงหน้าเว็บ แต่ตัวบัญชียังเสี่ยงโดนเดา

## 6. ใส่ role ให้ user แต่ละคน

หลังสร้าง user แล้ว ให้คัดลอก `id` ของ user แต่ละคนจากหน้า Authentication

จากนั้นไปที่ `Table Editor > profiles`

เพิ่มข้อมูลประมาณนี้:

### แถวของ admin

- `id` = UUID ของ user admin
- `username` = `Thirasak`
- `display_name` = `Thirasak`
- `role` = `admin`

### แถวของ user

- `id` = UUID ของ user ธรรมดา
- `username` = `User`
- `display_name` = `User`
- `role` = `user`

## 7. ลงทะเบียนไฟล์ private ในฐานข้อมูล

ไปที่ `Table Editor > private_documents`

เพิ่มข้อมูลไฟล์ที่อัปไว้ใน bucket เช่น:

| title | description | folder_path | storage_path | access_role |
|---|---|---|---|---|
| Secret Plan | อ่านได้เฉพาะแอดมิน | thesis | thesis/secret-plan.md | admin |
| Internal Guide | อ่านได้ทั้ง user และ admin | shared | shared/internal-guide.md | user |
| Shared Memo | อ่านได้ทุกคนที่ล็อกอิน | notes | notes/shared-memo.md | shared |

ความหมายของ `access_role`:

- `admin` = admin เห็นคนเดียว
- `user` = user และ admin เห็น
- `shared` = ทุกคนที่ล็อกอินเห็น

## 8. วิธีล็อกอินบนเว็บนี้

บนหน้าเว็บ:

- ช่องชื่อผู้ใช้ให้พิมพ์ `Thirasak` หรือ `User`
- ช่องรหัสผ่านให้ใช้ password ของ user ใน Supabase Auth

ระบบในโค้ดจะ map ชื่อผู้ใช้ไปเป็น email ตาม `.env`

## 9. สิ่งที่ต้องจำให้แม่น

- ถ้าไฟล์อยู่ใน `public/docs` = public
- ถ้าไฟล์อยู่ใน repo GitHub = คนที่โหลด repo ไปก็เห็น
- ถ้าไฟล์อยู่ใน Supabase private bucket และไม่ได้ commit ลง repo = คนที่โหลด repo จะไม่เห็นไฟล์ private

## 10. วิธีอัปเอกสาร private ใหม่

1. อัปไฟล์ `.md` ไปที่ Supabase Storage bucket `private-docs`
2. เพิ่มแถวใหม่ในตาราง `private_documents`
3. รีเฟรชเว็บ

ไม่ต้อง push GitHub ถ้าคุณแค่อัปไฟล์ private เพิ่มใน Supabase

## อ้างอิง

- [Supabase Password Auth](https://supabase.com/docs/guides/auth/passwords)
- [Supabase Storage Fundamentals](https://supabase.com/docs/guides/storage/buckets/fundamentals)
