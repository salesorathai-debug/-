// ที่เก็บข้อมูลคำสั่งซื้อ
// ตอนนี้เก็บในเบราว์เซอร์ (localStorage) ช่วงบ่ายจะเปลี่ยนไฟล์นี้ไฟล์เดียวให้ไปใช้ Supabase
// ฟังก์ชันเป็นแบบ async ไว้ก่อน เพื่อให้หน้าอื่นไม่ต้องแก้ตอนเปลี่ยนไปใช้ฐานข้อมูลออนไลน์

const STORAGE_KEY = "amata-orders-v1";

const STATUS = {
  pending: { label: "รอส่ง", badge: "badge-pending" },
  shipped: { label: "ส่งแล้ว", badge: "badge-shipped" },
  paid: { label: "ชำระแล้ว", badge: "badge-paid" },
};

// รายชื่อร้านค้า (สมมติ)
const SHOPS = [
  "ร้านหนังสือนกกระจิบ",
  "ร้านอักษรริมคลอง",
  "ร้านหนังสือต้นมะขาม",
  "ร้านหน้าต่างบุ๊คส์",
  "ร้านหนังสือเรือนแก้วตะวัน",
  "ร้านหนังสือลมหนาวปลายดอย",
];

// รายชื่อหนังสือและราคาต่อเล่ม (สมมติ)
const BOOKS = [
  { title: "สายลมที่ปลายนา", price: 250 },
  { title: "สวนลับของยาย", price: 195 },
  { title: "เมืองใต้แสงจันทร์", price: 320 },
  { title: "คู่มือปลูกผักบนระเบียง", price: 280 },
  { title: "นิทานก่อนนอนของแมวส้ม", price: 165 },
  { title: "ประวัติศาสตร์ช้อนส้อม", price: 420 },
  { title: "บันทึกนักเดินทางผู้หลงทาง", price: 350 },
  { title: "การเงินฉบับคนเริ่มต้น", price: 299 },
];

// ข้อมูลตัวอย่าง (ร้านและหนังสือสมมติทั้งหมด)
const SAMPLE_ORDERS = [
  {
    id: "AM-0001", shop: "ร้านหนังสือนกกระจิบ", date: "2026-08-14", status: "shipped",
    items: [
      { title: "สายลมที่ปลายนา", qty: 20, price: 250 },
      { title: "สวนลับของยาย", qty: 10, price: 195 },
    ],
  },
  {
    id: "AM-0002", shop: "ร้านอักษรริมคลอง", date: "2026-08-20", status: "paid",
    items: [{ title: "เมืองใต้แสงจันทร์", qty: 15, price: 320 }],
  },
  {
    id: "AM-0003", shop: "ร้านหนังสือต้นมะขาม", date: "2026-08-27", status: "shipped",
    items: [
      { title: "คู่มือปลูกผักบนระเบียง", qty: 12, price: 280 },
      { title: "นิทานก่อนนอนของแมวส้ม", qty: 25, price: 165 },
    ],
  },
  {
    id: "AM-0004", shop: "ร้านหน้าต่างบุ๊คส์", date: "2026-09-03", status: "paid",
    items: [{ title: "ประวัติศาสตร์ช้อนส้อม", qty: 8, price: 420 }],
  },
  {
    id: "AM-0005", shop: "ร้านหนังสือเรือนแก้วตะวัน", date: "2026-09-08", status: "pending",
    items: [{ title: "บันทึกนักเดินทางผู้หลงทาง", qty: 10, price: 350 }],
  },
  {
    id: "AM-0006", shop: "ร้านหนังสือนกกระจิบ", date: "2026-09-15", status: "paid",
    items: [{ title: "การเงินฉบับคนเริ่มต้น", qty: 30, price: 299 }],
  },
  {
    id: "AM-0007", shop: "ร้านหนังสือลมหนาวปลายดอย", date: "2026-09-22", status: "shipped",
    items: [
      { title: "นิทานก่อนนอนของแมวส้ม", qty: 40, price: 165 },
      { title: "สวนลับของยาย", qty: 15, price: 195 },
    ],
  },
  {
    id: "AM-0008", shop: "ร้านอักษรริมคลอง", date: "2026-09-29", status: "shipped",
    items: [{ title: "สายลมที่ปลายนา", qty: 18, price: 250 }],
  },
  {
    id: "AM-0009", shop: "ร้านหนังสือต้นมะขาม", date: "2026-10-05", status: "pending",
    items: [
      { title: "เมืองใต้แสงจันทร์", qty: 10, price: 320 },
      { title: "การเงินฉบับคนเริ่มต้น", qty: 10, price: 299 },
    ],
  },
  {
    id: "AM-0010", shop: "ร้านหน้าต่างบุ๊คส์", date: "2026-10-09", status: "pending",
    items: [{ title: "คู่มือปลูกผักบนระเบียง", qty: 20, price: 280 }],
  },
];

function readStore() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) return JSON.parse(raw);
  } catch (e) {
    // เปิดอ่านไม่ได้ (เช่น โหมดไม่ระบุตัวตน) ใช้ข้อมูลตัวอย่างแทน
  }
  return null;
}

function writeStore(orders) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(orders));
  } catch (e) {
    // บันทึกไม่ได้ ข้อมูลจะอยู่แค่จนกว่าจะปิดหน้า
  }
}

async function listOrders() {
  let orders = readStore();
  if (!orders) {
    orders = structuredClone(SAMPLE_ORDERS);
    writeStore(orders);
  }
  return orders;
}

// เพิ่มคำสั่งซื้อใหม่ ระบบตั้งเลขที่และสถานะ "รอส่ง" ให้เอง
async function addOrder({ shop, date, items }) {
  const orders = await listOrders();
  const maxNo = orders.reduce((max, o) => Math.max(max, Number(o.id.split("-")[1]) || 0), 0);
  const order = {
    id: "AM-" + String(maxNo + 1).padStart(4, "0"),
    shop,
    date,
    status: "pending",
    items,
  };
  orders.push(order);
  writeStore(orders);
  return order;
}

// ลำดับสถานะ: รอส่ง → ส่งแล้ว → ชำระแล้ว
const NEXT_STATUS = { pending: "shipped", shipped: "paid" };

async function advanceStatus(id) {
  const orders = await listOrders();
  const order = orders.find((o) => o.id === id);
  if (!order || !NEXT_STATUS[order.status]) return null;
  order.status = NEXT_STATUS[order.status];
  writeStore(orders);
  return order;
}

function todayIso() {
  const d = new Date();
  return [d.getFullYear(), String(d.getMonth() + 1).padStart(2, "0"), String(d.getDate()).padStart(2, "0")].join("-");
}

// ----- ตัวช่วยคำนวณและจัดรูปแบบ -----

function orderTotal(order) {
  return order.items.reduce((sum, item) => sum + item.qty * item.price, 0);
}

function orderQty(order) {
  return order.items.reduce((sum, item) => sum + item.qty, 0);
}

function parseDate(iso) {
  const [y, m, d] = iso.split("-").map(Number);
  return new Date(y, m - 1, d);
}

// วันที่แบบไทย ปี พ.ศ. เช่น 14 ส.ค. 2569
function formatThaiDate(iso) {
  return parseDate(iso).toLocaleDateString("th-TH-u-ca-buddhist", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

function formatBaht(amount) {
  return "฿" + amount.toLocaleString("th-TH", { maximumFractionDigits: 2 });
}

function daysSince(iso) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return Math.floor((today - parseDate(iso)) / 86400000);
}

// ยังไม่ชำระ และสั่งมาเกิน 30 วัน
function isOverdue(order) {
  return order.status !== "paid" && daysSince(order.date) > 30;
}
