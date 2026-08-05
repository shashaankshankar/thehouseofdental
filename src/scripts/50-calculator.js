(() => {
  const range = document.getElementById("chr-range");
  if (!range) return;
  const amount = document.getElementById("chr-amt");
  const biweekly = document.getElementById("chr-bi");
  const months24 = document.getElementById("chr-24");
  const months60 = document.getElementById("chr-60");
  const money = (value) => `$${Math.round(value).toLocaleString()}`;
  const setPlan = (element, value, suffix) => {
    element.replaceChildren(document.createTextNode(value));
    const detail = document.createElement("i");
    detail.textContent = suffix;
    element.appendChild(detail);
  };
  const update = () => {
    const value = Number.parseInt(range.value, 10);
    amount.textContent = money(value);
    if (value <= 3000) setPlan(biweekly, money(value / 4), "×4");
    else setPlan(biweekly, "Over $3,000", "");
    setPlan(months24, money(value / 24), "/mo");
    setPlan(months60, money(value / 60), "/mo");
  };
  range.addEventListener("input", update);
  update();
})();
