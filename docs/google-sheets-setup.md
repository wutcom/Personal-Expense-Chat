# Google Sheets สำหรับสมุดรายจ่าย

Google Sheets เป็นที่เก็บรายจ่ายและเงินคืนของแอป ส่วน Supabase ใช้ยืนยันตัวตนสำหรับการเข้าสู่ระบบ หน้าสมุดรายจ่ายเปิดให้เฉพาะบัญชีเจ้าของที่ระบุใน environment variable ไม่ต้องรัน SQL migration เพื่อใช้แชต ประวัติ หรือภาพรวม ค่า migration เดิมยังใช้กับ API โปรไฟล์ถ้าต้องการเปิดใช้งานส่วนนั้น

## 1. เตรียมชีต

สร้าง Google Sheet ส่วนตัวใหม่ หรือเลือกไฟล์ส่วนตัวที่ต้องการใช้ แล้วสร้างแท็บชื่อ `Transactions` ใส่หัวตารางแถวแรก A1:G1 ตามลำดับนี้ (คัดลอกบรรทัดเดียวแล้ววางใน A1):

```text
id	created_at	date	type	category	amount_thb	note
```

คัดลอก Spreadsheet ID จาก URL ระหว่าง `/d/` และ `/edit` (ไม่ใช่ `gid`). ให้แท็บนี้เก็บเฉพาะตารางรายการ ไม่เพิ่มยอดรวม สูตร หรือหัวตารางอื่นในคอลัมน์ A:G แอปจะใส่วันตามเวลาไทยและจำนวนเงินบาทเป็นตัวเลข ให้จัดรูปแบบคอลัมน์ F เป็นตัวเลขทศนิยม 2 ตำแหน่งได้ตามต้องการ

## 2. ให้ server เข้าถึงชีต

1. ใน [Google Cloud Console](https://console.cloud.google.com/) เลือกโปรเจกต์ เปิดใช้ **Google Sheets API** แล้วสร้าง **Service Account** เฉพาะสำหรับแอปนี้
2. สร้างคีย์ JSON จากแท็บ Keys ของ Service Account เก็บไฟล์ไว้นอก repository ใช้ค่า `client_email` และ `private_key` ในขั้นตอนถัดไป
3. ใน Google Sheet กด **Share** แล้วเพิ่มอีเมล Service Account เป็น **Editor** เฉพาะไฟล์นี้ เก็บ General access เป็น **Restricted** ไม่ต้องเปิดสิทธิ์ทุกคนที่มีลิงก์

## 3. ตั้ง environment variables

ใน Vercel เลือกโปรเจกต์แอป → **Settings → Environment Variables** เพิ่มค่าต่อไปนี้สำหรับ environment ที่จะ deploy หรือใส่ใน `.env.local` เพื่อทดสอบบนเครื่อง:

| ชื่อตัวแปร                     | ค่าที่ใช้                                                                           |
| ------------------------------ | ----------------------------------------------------------------------------------- |
| `GOOGLE_SHEETS_SPREADSHEET_ID` | Spreadsheet ID                                                                      |
| `GOOGLE_SHEETS_CLIENT_EMAIL`   | `client_email` จาก JSON                                                             |
| `GOOGLE_SHEETS_PRIVATE_KEY`    | `private_key` จาก JSON รวมบรรทัด BEGIN/END; รองรับทั้ง newline จริงและตัวอักษร `\n` |
| `GOOGLE_SHEETS_OWNER_ID`       | UUID ของบัญชีเจ้าของ จาก Supabase → Authentication → Users                          |

คงค่า `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` และ `SITE_URL` ตาม [คู่มือล็อกอิน](supabase-setup.md) เก็บ Google private key เป็น Secret ฝั่ง server โดยไม่ใช้คำนำหน้า `NEXT_PUBLIC_` และอย่า commit คีย์หรือไฟล์ JSON ลง Git สำหรับ Preview ควรใช้ชีตทดสอบแยกจาก Production

หลังตั้งค่า ให้ restart dev server หรือ redeploy จาก branch ที่มีโค้ด Google Sheets

## 4. ทดสอบ

ล็อกอินด้วยบัญชีที่ UUID ตรงกับค่าที่ตั้ง แล้วพิมพ์:

| ข้อความ                     | ผล                                              |
| --------------------------- | ----------------------------------------------- |
| `กาแฟ 65`                   | รายจ่าย 65 บาท หมวดทั่วไป หมายเหตุ “กาแฟ”       |
| `จ่าย อาหาร 120 มื้อเที่ยง` | รายจ่าย 120 บาท หมวดอาหาร หมายเหตุ “มื้อเที่ยง” |
| `คืนเงิน อาหาร 30`          | เงินคืน 30 บาท หมวดอาหาร                        |

ตรวจว่าแต่ละข้อความเพิ่มหนึ่งแถวใน `Transactions` หน้าประวัติแสดง 50 รายการล่าสุด และภาพรวมรวมรายจ่าย เงินคืน และยอดจ่ายสุทธิของเดือนปัจจุบันตามเวลาไทย ทดสอบด้วยบัญชีอื่นแล้วต้องอ่านหรือเขียนชีตจากแอปไม่ได้

หากแอปแจ้งว่ายืนยันการบันทึกไม่ได้ ให้ตรวจชีตหรือหน้าประวัติก่อนส่งข้อความซ้ำ Google Sheets อาจบันทึกสำเร็จแล้วแม้คำตอบกลับไม่ถึงแอป จึงไม่มีการ retry การเขียนอัตโนมัติและยังไม่มีการรับประกัน exactly-once สมุดนี้เหมาะกับการใช้งานส่วนตัว บัญชีที่ได้รับแชร์ไฟล์โดยตรงจะอ่านข้อมูลในชีตได้ตามสิทธิ์ใน Drive

โค้ดนี้ไม่ย้ายรายการเดิมจาก Supabase และไม่เขียนซ้ำไปยัง PostgreSQL หากมีข้อมูลเดิม ให้สำรองและวางแผนย้ายแยกจากการติดตั้งนี้

อ้างอิง: [Sheets values.append](https://developers.google.com/workspace/sheets/api/reference/rest/v4/spreadsheets.values/append) · [Google Workspace credentials](https://developers.google.com/workspace/guides/create-credentials)
