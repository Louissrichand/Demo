# root+ — เปิดใช้งานระบบบัญชี (Sign in) — คู่มือ 4 ขั้น

ทำใน Supabase โปรเจกต์ **ROOT+ CRM** (`vumqbxlorsemfvrxxkmj`) ตามลำดับ

---

## ขั้น 1 — สร้างตาราง profiles (จำเป็น)
Supabase → **SQL Editor → New query** → วางเนื้อหาไฟล์ **`supabase-auth-setup.sql`** → **Run**
> สร้างตาราง `profiles` (ผูกกับบัญชี) + RLS (แต่ละคนเห็นเฉพาะข้อมูลตัวเอง) + trigger สร้างโปรไฟล์อัตโนมัติเมื่อสมัคร

## ขั้น 2 — ตั้ง URL ของ Auth (จำเป็น)
Supabase → **Authentication → URL Configuration**
- **Site URL:** `https://louissrichand.github.io/Demo/`
- **Redirect URLs** (กด Add แต่ละอัน):
  - `https://louissrichand.github.io/Demo/**`
  - `http://localhost:8087/**`  ← ไว้เทสต์ในเครื่อง

## ขั้น 3 — ปิด "ยืนยันอีเมล" ให้ pilot ลื่น (แนะนำ)
Supabase → **Authentication → Providers → Email** → ปิด/uncheck **"Confirm email"** → Save
> ถ้าเปิดไว้ ผู้สมัครต้องไปคลิกลิงก์ในเมลก่อน login และเมลฟรีของ Supabase ส่งได้จำกัด (~2-4 ฉบับ/ชม.) ไม่เหมาะกับการให้กลุ่มตัวอย่างหลายคนสมัครพร้อมกัน — ปิดไว้ก่อน แล้วค่อยเปิด + ตั้ง SMTP ตอน production

## ขั้น 4 — ตั้งค่า Google Login
### 4.1 สร้าง OAuth ใน Google Cloud
1. เข้า https://console.cloud.google.com → สร้าง/เลือก project
2. **APIs & Services → OAuth consent screen**
   - User type: **External** → Create
   - App name: `root+`, ใส่ User support email + Developer email → Save
   - โหมด **Testing:** กด **Add users** ใส่อีเมลของคนกลุ่มตัวอย่าง (สูงสุด 100 คน ไม่มีหน้าเตือน)
     หรือกด **Publish app** (ใช้ได้กับทุกคน แต่จะมีหน้า "unverified app" จนกว่าจะยืนยันโดเมน)
3. **APIs & Services → Credentials → Create Credentials → OAuth client ID**
   - Application type: **Web application**, Name: `root+ web`
   - **Authorized JavaScript origins:**
     - `https://louissrichand.github.io`
     - `http://localhost:8087`
   - **Authorized redirect URIs:**
     - `https://vumqbxlorsemfvrxxkmj.supabase.co/auth/v1/callback`
   - Create → **คัดลอก Client ID + Client Secret**

### 4.2 ใส่ลง Supabase
Supabase → **Authentication → Providers → Google** → เปิด (toggle) → วาง **Client ID** + **Client Secret** → **Save**

## ขั้น 5 — ตั้งค่า Facebook Login
### 5.1 สร้าง App ใน Meta for Developers
1. เข้า https://developers.facebook.com/apps → **Create App**
2. ประเภท: **Consumer** (หรือ "Authenticate and request data from users with Facebook Login")
3. เพิ่ม product **Facebook Login** → **Settings**
   - **Valid OAuth Redirect URIs:** `https://vumqbxlorsemfvrxxkmj.supabase.co/auth/v1/callback`
4. **Settings → Basic:** คัดลอก **App ID** + **App Secret**
   - ใส่ **Privacy Policy URL:** `https://louissrichand.github.io/Demo/privacy.html` (จำเป็นตอนขึ้น Live)
5. สลับ App เป็น **Live** (สวิตช์บนสุด) เพื่อให้คนทั่วไปใช้ได้
   > โหมด Development จะให้เฉพาะ admin/tester ของ App เท่านั้นที่ login ได้

### 5.2 ใส่ลง Supabase
Supabase → **Authentication → Providers → Facebook** → เปิด → วาง **App ID** (=Client ID) + **App Secret** (=Client Secret) → **Save**

---

## เสร็จแล้วทดสอบ
- เปิด `https://louissrichand.github.io/Demo/` → กด **เข้าสู่ระบบ**
- ลอง **สมัครด้วยอีเมล/รหัสผ่าน** และ **Continue with Google**
- ดูบัญชีที่ **Authentication → Users** และข้อมูลโปรไฟล์ที่ **Table editor → profiles**
- พอ login แล้ว รูป/ชื่อจะขึ้นมุมขวาบน + มีเมนู "ออกจากระบบ"

> โยน URL ให้ผมได้เลยถ้าติดตรงไหน หรือส่ง screenshot หน้า error มา เดี๋ยวผมช่วยไล่ให้
