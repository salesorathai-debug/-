// หน้าเพิ่มคำสั่งซื้อ: เลือกร้าน เลือกหนังสือ ใส่จำนวน คิดยอดให้อัตโนมัติ แล้วบันทึก

const form = document.getElementById("order-form");
const itemsBox = document.getElementById("items");
const formAlert = document.getElementById("form-alert");

function fillShops() {
  const select = document.getElementById("shop");
  select.innerHTML =
    `<option value="">-- เลือกร้าน --</option>` +
    SHOPS.map((s) => `<option value="${s}">${s}</option>`).join("");
}

function bookOptions() {
  return (
    `<option value="">-- เลือกหนังสือ --</option>` +
    BOOKS.map((b, i) => `<option value="${i}">${b.title}</option>`).join("")
  );
}

function addItemRow() {
  const row = document.createElement("div");
  row.className = "item-row";
  row.innerHTML = `
    <div class="field field-book">
      <label>หนังสือ</label>
      <select class="book">${bookOptions()}</select>
      <div class="field-error"></div>
    </div>
    <div class="field">
      <label>จำนวน (เล่ม)</label>
      <input class="qty" type="number" min="1" step="1" inputmode="numeric">
      <div class="field-error"></div>
    </div>
    <div class="field">
      <label>ราคาต่อเล่ม</label>
      <div class="readonly price">-</div>
    </div>
    <div class="field">
      <label>รวม</label>
      <div class="readonly subtotal">-</div>
    </div>
    <div class="remove-cell">
      <button type="button" class="btn-link remove">ลบ</button>
    </div>`;
  itemsBox.appendChild(row);
  updateRemoveButtons();
  recalc();
}

// ต้องมีหนังสืออย่างน้อย 1 แถวเสมอ จึงซ่อนปุ่มลบเมื่อเหลือแถวเดียว
function updateRemoveButtons() {
  const rows = itemsBox.querySelectorAll(".item-row");
  rows.forEach((row) => {
    row.querySelector(".remove").hidden = rows.length === 1;
  });
}

function readRow(row) {
  const bookIndex = row.querySelector(".book").value;
  const qtyText = row.querySelector(".qty").value.trim();
  const book = bookIndex === "" ? null : BOOKS[Number(bookIndex)];
  const qty = Number(qtyText);
  return { row, book, qtyText, qty };
}

function recalc() {
  let total = 0;
  itemsBox.querySelectorAll(".item-row").forEach((row) => {
    const { book, qty } = readRow(row);
    const validQty = Number.isInteger(qty) && qty > 0;
    row.querySelector(".price").textContent = book ? formatBaht(book.price) : "-";
    if (book && validQty) {
      const subtotal = book.price * qty;
      total += subtotal;
      row.querySelector(".subtotal").textContent = formatBaht(subtotal);
    } else {
      row.querySelector(".subtotal").textContent = "-";
    }
  });
  document.getElementById("grand-total").textContent = formatBaht(total);
}

function showDateHint() {
  const value = document.getElementById("date").value;
  document.getElementById("date-hint").textContent = value ? "ตรงกับวันที่ " + formatThaiDate(value) : "";
}

function setError(input, message) {
  const field = input.closest(".field");
  field.classList.toggle("has-error", Boolean(message));
  field.querySelector(".field-error").textContent = message || "";
}

function validate() {
  let ok = true;

  const shop = document.getElementById("shop");
  if (!shop.value) {
    setError(shop, "กรุณาเลือกร้าน");
    ok = false;
  } else setError(shop, "");

  const date = document.getElementById("date");
  if (!date.value) {
    setError(date, "กรุณาเลือกวันที่สั่ง");
    ok = false;
  } else if (date.value > todayIso()) {
    setError(date, "วันที่สั่งต้องไม่เกินวันนี้");
    ok = false;
  } else setError(date, "");

  const seen = new Set();
  itemsBox.querySelectorAll(".item-row").forEach((row) => {
    const { book, qtyText, qty } = readRow(row);
    const bookSelect = row.querySelector(".book");
    const qtyInput = row.querySelector(".qty");

    if (!book) {
      setError(bookSelect, "กรุณาเลือกหนังสือ");
      ok = false;
    } else if (seen.has(book.title)) {
      setError(bookSelect, "เลือกหนังสือเรื่องนี้ไปแล้ว ให้เพิ่มจำนวนในแถวเดิมแทน");
      ok = false;
    } else {
      setError(bookSelect, "");
      seen.add(book.title);
    }

    if (qtyText === "") {
      setError(qtyInput, "กรุณาใส่จำนวน");
      ok = false;
    } else if (!Number.isInteger(qty) || qty < 1) {
      setError(qtyInput, "จำนวนต้องเป็นเลขจำนวนเต็มตั้งแต่ 1 ขึ้นไป");
      ok = false;
    } else setError(qtyInput, "");
  });

  return ok;
}

async function onSubmit(event) {
  event.preventDefault();

  if (!validate()) {
    formAlert.textContent = "กรอกข้อมูลไม่ครบหรือไม่ถูกต้อง กรุณาตรวจช่องที่เป็นสีแดง";
    formAlert.hidden = false;
    formAlert.scrollIntoView({ behavior: "smooth", block: "center" });
    return;
  }

  const items = [...itemsBox.querySelectorAll(".item-row")].map((row) => {
    const { book, qty } = readRow(row);
    return { title: book.title, qty, price: book.price };
  });

  const order = await addOrder({
    shop: document.getElementById("shop").value,
    date: document.getElementById("date").value,
    items,
  });

  location.href = "index.html?added=" + encodeURIComponent(order.id);
}

itemsBox.addEventListener("input", recalc);
itemsBox.addEventListener("change", recalc);
itemsBox.addEventListener("click", (event) => {
  if (!event.target.classList.contains("remove")) return;
  event.target.closest(".item-row").remove();
  updateRemoveButtons();
  recalc();
});

document.getElementById("add-item").addEventListener("click", addItemRow);
document.getElementById("date").addEventListener("input", showDateHint);
form.addEventListener("submit", onSubmit);

fillShops();
document.getElementById("date").value = todayIso();
document.getElementById("date").max = todayIso();
showDateHint();
addItemRow();
