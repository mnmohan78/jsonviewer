document.addEventListener("DOMContentLoaded", () => {
  const jsonInput = document.getElementById("jsonInput");
  const jsonViewer = document.getElementById("jsonViewer");
  const fileInput = document.getElementById("fileInput");
  const propertiesPanel = document.getElementById("propContent");
  const jsonError = document.getElementById("jsonError");

  const formatBtn = document.getElementById("formatBtn");
  const minifyBtn = document.getElementById("minifyBtn");
  const clearBtn = document.getElementById("clearBtn");
  const viewBtn = document.getElementById("viewBtn");
  const fetchBtn = document.getElementById("fetch-json");

  const tabInput = document.getElementById("tab-input");
  const tabViewer = document.getElementById("tab-viewer");
  const inputSection = document.getElementById("input-section");
  const viewerSection = document.getElementById("viewer-section");

  const copyBtn = document.getElementById("copyBtn");
  const pasteBtn = document.getElementById("pasteBtn");
  const downloadBtn = document.getElementById("downloadBtn");

  let selectedNode = null;
  let selectedKey = null;
  let jsonData = null;
  let selectedValueRef = null;

  // Tab switching
  tabInput.addEventListener("click", () => {
    tabInput.classList.add("active");
    tabViewer.classList.remove("active");
    inputSection.classList.add("active");
    viewerSection.classList.remove("active");
  });

  tabViewer.addEventListener("click", () => {
    tabViewer.classList.add("active");
    tabInput.classList.remove("active");
    viewerSection.classList.add("active");
    inputSection.classList.remove("active");
  });

  // File upload
  fileInput.addEventListener("change", (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        jsonInput.value = event.target.result;
        validateJSON();
      };
      reader.readAsText(file);
    }
  });

  // Live JSON validation
  jsonInput.addEventListener("input", validateJSON);

  function validateJSON() {
    try {
      JSON.parse(jsonInput.value);
      jsonError.textContent = "";
      jsonInput.style.borderColor = "green";
    } catch (err) {
      jsonError.textContent = "Invalid JSON: " + err.message;
      jsonInput.style.borderColor = "red";
    }
  }

  // Buttons
  formatBtn.addEventListener("click", () => {
    try {
      jsonInput.value = JSON.stringify(JSON.parse(jsonInput.value), null, 2);
      validateJSON();
    } catch {
      alert("Invalid JSON");
    }
  });

  minifyBtn.addEventListener("click", () => {
    try {
      jsonInput.value = JSON.stringify(JSON.parse(jsonInput.value));
      validateJSON();
    } catch {
      alert("Invalid JSON");
    }
  });

  clearBtn.addEventListener("click", () => {
    jsonInput.value = "";
    jsonViewer.innerHTML = "";
    propertiesPanel.innerHTML = "Select a node to view details";
    jsonError.textContent = "";
    jsonInput.style.borderColor = "";
  });

  viewBtn.addEventListener("click", () => {
    try {
      jsonData = JSON.parse(jsonInput.value);
      renderViewer();
      tabViewer.click();
    } catch {
      alert("Invalid JSON");
    }
  });

  // Fetch JSON from URL
  fetchBtn.addEventListener("click", async () => {
    const url = document.getElementById("json-url").value.trim();
    if (!url) return alert("Please enter a URL");
    try {
      const response = await fetch(url);
      if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
      const data = await response.json();
      jsonInput.value = JSON.stringify(data, null, 2);
      validateJSON();
      viewBtn.click();
    } catch (err) {
      jsonError.textContent = `Failed to fetch JSON: ${err.message}`;
      jsonInput.style.borderColor = "red";
    }
  });

  // Copy, paste, download
  copyBtn.addEventListener("click", () => {
    if (!jsonInput.value) return alert("No JSON to copy!");
    navigator.clipboard.writeText(jsonInput.value)
      .then(() => alert("JSON copied to clipboard!"))
      .catch(err => alert("Failed to copy: " + err));
  });

  pasteBtn.addEventListener("click", async () => {
    try {
      const text = await navigator.clipboard.readText();
      jsonInput.value = text;
      validateJSON();
    } catch (err) {
      alert("Failed to paste from clipboard: " + err);
    }
  });

  downloadBtn.addEventListener("click", () => {
    if (!jsonInput.value) return alert("No JSON to download!");
    try {
      const json = JSON.parse(jsonInput.value);
      const blob = new Blob([JSON.stringify(json, null, 2)], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = "data.json";
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch {
      alert("Invalid JSON. Cannot download.");
    }
  });

  // Render viewer
  function renderViewer() {
    jsonViewer.innerHTML = "";
    jsonViewer.appendChild(renderJSONTree(jsonData, "(root)", jsonData));
  }

  // Recursive tree renderer (read-only)
  function renderJSONTree(obj, keyName, parentRef) {
    const container = document.createElement("div");
    container.classList.add("tree-node");

    const label = document.createElement("span");
    label.textContent = keyName;
    label.classList.add("tree-key");
    container.appendChild(label);

    container.addEventListener("click", (e) => {
      e.stopPropagation();
      selectNode(container, keyName, obj, parentRef);
    });

    if (typeof obj === "object" && obj !== null) {
      const toggle = document.createElement("span");
      toggle.classList.add("tree-toggle");
      toggle.textContent = Array.isArray(obj) ? "[+]" : "{+}";
      container.insertBefore(toggle, label);

      const children = document.createElement("div");
      children.classList.add("tree-children");
      children.style.display = "none";

      for (const key in obj) {
        const childNode = renderJSONTree(obj[key], key, obj);
        children.appendChild(childNode);
      }

      toggle.addEventListener("click", (e) => {
        e.stopPropagation();
        if (children.style.display === "none") {
          children.style.display = "block";
          toggle.textContent = Array.isArray(obj) ? "[-]" : "{-}";
        } else {
          children.style.display = "none";
          toggle.textContent = Array.isArray(obj) ? "[+]" : "{+}";
        }
      });

      container.appendChild(children);
    } else {
      const valSpan = document.createElement("span");
      valSpan.classList.add("tree-value");
      valSpan.textContent = typeof obj === "string" ? `"${obj}"` : obj;
      container.appendChild(valSpan);
    }

    return container;
  }

  // Selection + editing via property panel
  function selectNode(node, key, value, parentRef = jsonData) {
  if (selectedNode) selectedNode.classList.remove("selected");
  node.classList.add("selected");
  selectedNode = node;
  selectedKey = key;
  displayProperties(key, value, parentRef);
}


 function displayProperties(key, value, parentRef) {
  propertiesPanel.innerHTML = "";

  const title = document.createElement("h4");
  title.textContent = key ? `Editing "${key}"` : "Root Object";
  propertiesPanel.appendChild(title);

  if (typeof value !== "object" || value === null) {
    // For primitive values
    const label = document.createElement("label");
    label.textContent = "Value:";
    const input = document.createElement("input");
    input.type = "text";
    input.value = value;
    const saveBtn = document.createElement("button");
    saveBtn.textContent = "Save";

    saveBtn.addEventListener("click", () => {
      try {
        const newVal = parseSmartValue(input.value);
        if (key === null || key === undefined) {
          jsonData = newVal;
        } else {
          parentRef[key] = newVal;
        }
        jsonInput.value = JSON.stringify(jsonData, null, 2);
        renderViewer();
        alert("✅ Value updated successfully!");
      } catch (err) {
        alert("❌ Invalid value: " + err.message);
      }
    });

    propertiesPanel.append(label, input, saveBtn);
  } else {
    // For object or array nodes
    for (const k in value) {
      const row = document.createElement("div");
      row.classList.add("prop-row");

      const label = document.createElement("label");
      label.textContent = k;

      const input = document.createElement("input");
      input.type = "text";
      input.value = typeof value[k] === "object"
        ? JSON.stringify(value[k])
        : value[k];

      const saveBtn = document.createElement("button");
      saveBtn.textContent = "Save";

      saveBtn.addEventListener("click", () => {
        try {
          const newVal = parseSmartValue(input.value);
          value[k] = newVal;
          jsonInput.value = JSON.stringify(jsonData, null, 2);
          renderViewer();
          alert(`✅ Updated "${k}" successfully!`);
        } catch (err) {
          alert("❌ Invalid value: " + err.message);
        }
      });

      row.append(label, input, saveBtn);
      propertiesPanel.appendChild(row);
    }
  }
}

// Helper to interpret input smartly
function parseSmartValue(val) {
  val = val.trim();
  if (val === "") return "";
  if (val === "true") return true;
  if (val === "false") return false;
  if (val === "null") return null;
  if (!isNaN(val)) return Number(val);

  try {
    return JSON.parse(val);
  } catch {
    return val;
  }
}


});
