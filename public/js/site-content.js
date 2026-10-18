

(function () {
  async function applySiteContent() {
    const nodes = document.querySelectorAll("[data-content-key]");
    if (!nodes.length) return;

    try {
      const { body } = await cvrApiGet("content/site");
      if (!body || !body.success || !body.data || !body.data.content) return;
      const content = body.data.content;

      nodes.forEach((el) => {
        const key = el.getAttribute("data-content-key");
        const value = content[key];
        if (value === undefined || value === null || value === "") return;

        if (el.tagName === "IMG") {
          el.src = value;
        } else if (el.hasAttribute("data-content-html")) {
          el.innerHTML = value;
        } else {
          el.textContent = value;
        }
      });
    } catch (err) {

      console.warn("Could not load site content overrides:", err);
    }
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", applySiteContent);
  } else {
    applySiteContent();
  }
})();
