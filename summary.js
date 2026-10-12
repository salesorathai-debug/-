// หน้าสรุปยอด: การ์ดตัวเลข และกราฟแท่งแนวนอน

function escapeHtml(text) {
  const div = document.createElement("div");
  div.textContent = text;
  return div.innerHTML;
}

// กราฟแท่งแนวนอน rows = [{ label, value, display, color }]
function barChart(rows) {
  const max = Math.max(...rows.map((r) => r.value), 1);
  return rows
    .map((r) => {
      const width = (r.value / max) * 100;
      return `
        <div class="bar-row" title="${escapeHtml(r.label)}: ${r.display}">
          <div class="bar-label">${escapeHtml(r.label)}</div>
          <div class="bar-track">
            <div class="bar-fill" style="width: ${width}%; background: ${r.color};"></div>
          </div>
          <div class="bar-value">${r.display}</div>
        </div>`;
    })
    .join("");
}

async function renderSummary() {
  const orders = await listOrders();

  const totalSales = orders.reduce((sum, o) => sum + orderTotal(o), 0);
  const unpaid = orders.filter((o) => o.status !== "paid");
  const unpaidTotal = unpaid.reduce((sum, o) => sum + orderTotal(o), 0);
  const overdue = orders.filter(isOverdue);
  const overdueTotal = overdue.reduce((sum, o) => sum + orderTotal(o), 0);

  const counts = { pending: 0, shipped: 0, paid: 0 };
  orders.forEach((o) => counts[o.status]++);

  // การ์ดตัวเลข
  document.getElementById("total-sales").textContent = formatBaht(totalSales);
  document.getElementById("total-sales-note").textContent =
    "จากคำสั่งซื้อทั้งหมด " + orders.length.toLocaleString("th-TH") + " รายการ";

  document.getElementById("unpaid-total").textContent = formatBaht(unpaidTotal);
  document.getElementById("unpaid-note").textContent =
    unpaid.length.toLocaleString("th-TH") + " รายการ" +
    (overdue.length ? ` · เกิน 30 วัน ${overdue.length} รายการ ${formatBaht(overdueTotal)}` : "");

  ["pending", "shipped", "paid"].forEach((key) => {
    document.getElementById("count-" + key).textContent = counts[key].toLocaleString("th-TH");
  });

  // กราฟจำนวนคำสั่งซื้อแยกตามสถานะ (ใช้สีเดียวกับป้ายสถานะ)
  const statusColors = {
    pending: "var(--status-pending)",
    shipped: "var(--status-shipped)",
    paid: "var(--status-paid)",
  };
  document.getElementById("status-chart").innerHTML = barChart(
    ["pending", "shipped", "paid"].map((key) => ({
      label: STATUS[key].label,
      value: counts[key],
      display: counts[key].toLocaleString("th-TH") + " รายการ",
      color: statusColors[key],
    }))
  );

  // ร้านที่ยอดสูงสุด 5 อันดับ
  const byShop = {};
  orders.forEach((o) => {
    byShop[o.shop] = (byShop[o.shop] || 0) + orderTotal(o);
  });
  const top5 = Object.entries(byShop)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5);

  document.getElementById("shop-chart").innerHTML = barChart(
    top5.map(([shop, total], i) => ({
      label: `${i + 1}. ${shop}`,
      value: total,
      display: formatBaht(total),
      color: "var(--primary)",
    }))
  );
}

renderSummary();
