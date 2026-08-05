(() => {
  const form = document.getElementById("appointment-form");
  if (!form) return;
  form.addEventListener("submit", (event) => {
    event.preventDefault();
    const status = document.getElementById("form-status");
    if (!form.checkValidity()) {
      form.reportValidity();
      status.textContent = "Please complete the required fields. Nothing was sent.";
      return;
    }
    status.replaceChildren(document.createTextNode("Nothing was sent. Please call "));
    const phone = document.createElement("a");
    phone.href = "tel:+14076781400";
    phone.textContent = "(407) 678-1400";
    status.append(phone, document.createTextNode(" to schedule while online requests are being connected."));
  });
})();
