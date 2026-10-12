// หน้ารายการคำสั่งซื้อ: แสดงตาราง และเปลี่ยนสถานะ

function escapeHtml(text) {
  const div = document.createElement("div");
  div.textContent = text;
  return div.innerHTML;
}

function renderRow(order) {
  const status = STATUS[order.status];
  const overdue = isOverdue(order);
  const next = NEXT_STATUS[order.status];

  const books = order.items
    .map((item) => `<li>${escapeHtml(item.title)} <span class="qty">× ${item.qty}</span></li>`)
    .join("");

  const overdueNote = overdue
    ? `<span class="overdue-note">ค้างชำระ ${daysSince(order.date)} วัน</span>`
    : "";

  const button = next
    ? `<button type="button" class="btn btn-outline btn-small" data-id="${order.id}">เปลี่ยนเป็น ${STATUS[next].label}</button>`
    : "";

  return `
    <tr class="${overdue ? "overdue" : ""}" id="row-${order.id}">
      <td class="order-id">${order.id}</td>
      <td class="shop">${escapeHtml(order.shop)}</td>
      <td class="books"><ul class="book-list">${books}</ul></td>
      <td class="num">${orderQty(order).toLocaleString("th-TH")} เล่ม</td>
      <td class="num">${formatBaht(orderTotal(order))}</td>
      <td class="nowrap">${formatThaiDate(order.date)}</td>
      <td class="status-cell">
        <span class="badge ${status.badge}">${status.label}</span>
        ${overdueNote}
        ${button}
      </td>
    </tr>`;
}

async function renderTable() {
  const orders = await listOrders();
  // ใหม่สุดอยู่บน
  orders.sort((a, b) => b.date.localeCompare(a.date) || b.id.localeCompare(a.id));

  const shown = orders.filter(matchesFilter);

  const body = document.getElementById("orders-body");
  body.innerHTML = shown.length
    ? shown.map(renderRow).join("")
    : `<tr><td colspan="7" class="empty-row">ไม่พบคำสั่งซื้อที่ตรงกับการค้นหา</td></tr>`;

  document.getElementById("order-count").textContent =
    "ทั้งหมด " + orders.length.toLocaleString("th-TH") + " รายการ";

  const filtering = currentStatus !== "all" || searchText() !== "";
  document.getElementById("result-count").textContent = filtering
    ? `แสดง ${shown.length.toLocaleString("th-TH")} จาก ${orders.length.toLocaleString("th-TH")} รายการ`
    : "";
}

// ----- ค้นหาและกรอง -----

let currentStatus = "all";

function searchText() {
  return document.getElementById("search").value.trim().toLowerCase();
}

function matchesFilter(order) {
  if (currentStatus !== "all" && order.status !== currentStatus) return false;
  const q = searchText();
  if (!q) return true;
  return (
    order.shop.toLowerCase().includes(q) ||
    order.items.some((item) => item.title.toLowerCase().includes(q))
  );
}

function onFilterClick(event) {
  const button = event.target.closest("button[data-status]");
  if (!button) return;
  currentStatus = button.dataset.status;
  document.querySelectorAll(".filter-group button").forEach((b) => {
    const active = b === button;
    b.classList.toggle("active", active);
    b.setAttribute("aria-pressed", active);
  });
  renderTable();
}

async function onStatusClick(event) {
  const button = event.target.closest("button[data-id]");
  if (!button) return;

  const id = button.dataset.id;
  const orders = await listOrders();
  const order = orders.find((o) => o.id === id);
  const nextLabel = STATUS[NEXT_STATUS[order.status]].label;

  if (!confirm(`เปลี่ยนสถานะคำสั่งซื้อ ${id} (${order.shop}) เป็น "${nextLabel}" ใช่หรือไม่`)) return;

  await advanceStatus(id);
  await renderTable();
}

function showAddedMessage() {
  const params = new URLSearchParams(location.search);
  const added = params.get("added");
  if (!added) return;

  const box = document.getElementById("message");
  box.textContent = `บันทึกคำสั่งซื้อ ${added} เรียบร้อยแล้ว`;
  box.hidden = false;
}

document.getElementById("orders-body").addEventListener("click", onStatusClick);
document.querySelector(".filter-group").addEventListener("click", onFilterClick);
document.getElementById("search").addEventListener("input", renderTable);
showAddedMessage();
renderTable();
