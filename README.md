# 9router · GBsoul

> เราทำโปรเจกต์นี้โดยนำ [9router](https://github.com/decolua/9router) มาปรับปรุงต่อด้วย **Claude (Claude Code)**

ตัวกลางรวม AI ไว้ที่เดียวบนเครื่องเรา ต่อ Claude Code, Codex, Cursor, Cline หรือเครื่องมือเขียนโค้ดตัวไหนก็ได้ เข้าที่ปลายทางเดียว `http://localhost:20128` แล้วเลือกได้ว่าจะส่งงานไปโมเดลไหน

เวอร์ชันนี้ทำเพิ่มเองให้ **ส่งงานไปหา Hermes Agent ที่รันอยู่บนเครื่องได้โดยตรง** ไม่ต้องใช้ API key และไม่ต้องส่งข้อมูลออกนอกเครื่อง

---

## สิ่งที่เวอร์ชันนี้ต่างออกไป

| | |
|---|---|
| **Hermes Local** | provider ใหม่ชื่อ `hermes-local` วิ่งผ่าน `hermes proxy` (ค่าเริ่มต้น `http://localhost:8645`) ไม่ต้องใส่ key, เปลี่ยน host/พอร์ตได้, ดึงรายชื่อโมเดลจาก Hermes อัตโนมัติ |
| **ช่องกรอกในหน้า Providers** | มีช่อง "Hermes Proxy URL" ให้กรอก หรือเว้นว่างไว้ก็ได้ ปุ่ม Test ใช้ได้ทันที |
| **อัปเดตตามต้นทางตลอด** | ฐานโค้ดตอนนี้ตรงกับ 9router v0.5.123 |

---

## ติดตั้งครั้งแรก (ทีละขั้น)

**สิ่งที่ต้องมีก่อน:** Node.js 20 ขึ้นไป, git และ Hermes Agent (ถ้าจะใช้ Hermes Local)

1. ดาวน์โหลดโค้ด
   ```bash
   git clone https://github.com/GBsoul/9router.git
   cd 9router
   ```
2. สร้างไฟล์ตั้งค่า
   ```bash
   cp .env.example .env
   ```
3. ติดตั้งแพ็กเกจ (ครั้งแรกใช้เวลาสักพัก)
   ```bash
   npm install
   ```
4. เปิดโปรแกรม
   ```bash
   PORT=20128 NEXT_PUBLIC_BASE_URL=http://localhost:20128 npm run dev
   ```
5. เปิดเบราว์เซอร์ไปที่ **http://localhost:20128/dashboard**

> จะรันแบบ Docker แทนก็ได้ ใช้ `./start.sh` ซึ่งจะ build image แล้วเปิดที่พอร์ต 20128 (ข้อมูลเก็บใน volume `9router-data`)

---

## ใช้งาน Hermes Local

1. เปิด proxy ของ Hermes ในเทอร์มินัล
   ```bash
   hermes proxy start
   ```
2. ในแดชบอร์ด ไปที่เมนู **Providers** → หา **Hermes Local** → กด **Add**
3. ช่อง **Hermes Proxy URL**
   - Hermes อยู่เครื่องเดียวกัน → เว้นว่างไว้ (ใช้ `http://localhost:8645`)
   - Hermes อยู่เครื่องอื่น → ใส่ URL เต็ม เช่น `http://192.168.1.20:8645`
4. กด **Test** ให้ขึ้นว่า Valid แล้วกด **Save**
5. เวลาเรียกใช้ ให้ตั้งชื่อโมเดลเป็น `hermes-local/<ชื่อโมเดล>` (ดูชื่อโมเดลได้ในหน้า provider นั้น)

---

## ต่อเครื่องมือเขียนโค้ดเข้ามา

1. ในแดชบอร์ดไปที่เมนู **Endpoint** → คัดลอก API key ของ 9router
2. ไปที่เมนู **CLI Tools** → เลือกเครื่องมือที่ใช้ (เช่น Claude Code) → ให้แดชบอร์ดตั้งค่าให้อัตโนมัติ
3. ถ้าจะตั้งเองในเครื่องมืออื่นที่รองรับ OpenAI:
   - Base URL: `http://localhost:20128/v1`
   - API key: key ที่คัดลอกมา
   - Model: เช่น `hermes-local/<ชื่อโมเดล>`

---

## แก้ปัญหาที่เจอบ่อย

| อาการ | วิธีแก้ |
|---|---|
| กด Test ที่ Hermes Local แล้วขึ้น Invalid | เช็กว่ารัน `hermes proxy start` แล้ว และเปิด `http://localhost:8645/v1/models` ในเบราว์เซอร์ต้องเห็นรายชื่อโมเดล |
| ไม่มีรายชื่อโมเดลให้เลือก | Hermes ยังไม่ได้โหลดโมเดล ให้เปิด Hermes ให้พร้อมก่อน แล้วกดรีเฟรชรายชื่อในหน้า provider |
| เปิด localhost:20128 ไม่ขึ้น | ดูว่าเทอร์มินัลที่รัน `npm run dev` ยังเปิดอยู่และไม่มี error หรือพอร์ต 20128 ถูกโปรแกรมอื่นใช้อยู่ |

---

## อัปเดตให้ตรงกับต้นทาง

```bash
git remote add upstream https://github.com/decolua/9router.git   # ทำครั้งแรกครั้งเดียว
git fetch upstream
git rebase upstream/master
git push --force-with-lease origin master
```

---

## ที่มาและสัญญาอนุญาต

ต่อยอดจาก [decolua/9router](https://github.com/decolua/9router) ภายใต้ MIT License ดูรายละเอียดในไฟล์ [LICENSE](./LICENSE)
