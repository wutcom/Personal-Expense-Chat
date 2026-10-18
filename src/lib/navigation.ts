export const navigation = [
  { href: "/chat", label: "แชต", description: "บันทึกค่าใช้จ่ายด้วยข้อความ" },
  {
    href: "/dashboard",
    label: "ภาพรวม",
    description: "มองเห็นแผนและค่าใช้จ่ายในแต่ละเดือน",
  },
  {
    href: "/budgets",
    label: "แผนรายเดือน",
    description: "จัดสรรงบให้หมวดหมู่ของคุณ",
  },
  {
    href: "/history",
    label: "ประวัติ",
    description: "ทบทวนรายการค่าใช้จ่ายและเงินคืน",
  },
  {
    href: "/settings",
    label: "ตั้งค่า",
    description: "จัดการโปรไฟล์และการใช้งาน",
  },
] as const;
