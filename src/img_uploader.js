// img_uploader.js

export class image_upload {
  constructor() {
    this.noteContent = document.getElementById("noteContent");
    this.activeImage = null;
    this.resizing = false;
    this.startX = 0;
    this.startWidth = 0;
    this.startHeight = 0;
    this.init();
  }

  init() {
    if (!this.noteContent) {
      console.error("noteContent element not found");
      return;
    }

    // Prevent default drag behaviors
    ["dragenter", "dragover", "dragleave", "drop"].forEach((eventName) => {
      this.noteContent.addEventListener(eventName, this.preventDefaults.bind(this), false);
    });

    // Handle file drop
    this.noteContent.addEventListener("drop", (e) => this.handleDrop(e));

    // Handle image clicks to show controls
    this.noteContent.addEventListener("click", (e) => {
      if (
        e.target.tagName === "IMG" &&
        e.target.classList.contains("uploaded-image")
      ) {
        this.selectImage(e.target);
      } else if (!e.target.closest('.image-toolbar') && !e.target.closest('.resize-handle')) {
        // Only deselect if clicking outside toolbar and resize handle
        this.deselectImage();
      }
    });

    // Global mouse events for resize
    document.addEventListener("mousemove", (e) => this.handleMouseMove(e));
    document.addEventListener("mouseup", () => this.handleMouseUp());
  }

  preventDefaults(e) {
    e.preventDefault();
    e.stopPropagation();
  }

  handleDrop(e) {
    e.preventDefault();
    const files = e.dataTransfer.files;
    if (!files || files.length === 0) return;

    const file = files[0];
    if (!file.type.startsWith("image/")) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const wrapper = this.createImageWrapper(event.target.result);
      this.insertAtCaret(wrapper);
      
      // Trigger save
      this.noteContent.dispatchEvent(new Event("input", { bubbles: true }));
    };
    reader.readAsDataURL(file);
  }

  createImageWrapper(src) {
    // Create wrapper div
    const wrapper = document.createElement("div");
    wrapper.className = "image-wrapper";
    wrapper.contentEditable = "false";
    wrapper.dataset.align = "left"; // Default alignment
    wrapper.style.cssText = `
      position: relative;
      display: block;
      margin: 10px 0;
      max-width: 100%;
      text-align: left;
    `;

    // Create image
    const img = document.createElement("img");
    img.src = src;
    img.className = "uploaded-image";
    img.style.cssText = `
      max-width: 100%;
      height: auto;
      display: inline-block;
      border-radius: 8px;
      cursor: pointer;
    `;

    wrapper.appendChild(img);
    return wrapper;
  }

  selectImage(img) {
    // If clicking the same image, don't recreate controls
    if (this.activeImage === img) {
      return;
    }

    this.deselectImage();
    this.activeImage = img;
    const wrapper = img.parentElement;

    // Add selection border
    wrapper.style.outline = "2px solid #c9a365";
    wrapper.style.outlineOffset = "2px";

    // Create control handles
    this.createControls(wrapper);
  }

  deselectImage() {
    if (this.activeImage) {
      const wrapper = this.activeImage.parentElement;
      if (wrapper) {
        wrapper.style.outline = "none";

        // Remove existing controls (they're not saved anyway)
        const existingControls = wrapper.querySelectorAll(
          ".image-control, .image-toolbar"
        );
        existingControls.forEach((control) => control.remove());
      }

      this.activeImage = null;
    }
  }

  createControls(wrapper) {
    // Remove any existing controls first (in case of re-selection)
    const existingControls = wrapper.querySelectorAll('.image-toolbar, .image-control');
    existingControls.forEach(control => control.remove());

    // Create toolbar
    const toolbar = document.createElement("div");
    toolbar.className = "image-toolbar";
    toolbar.style.cssText = `
      position: absolute;
      top: -45px;
      left: 50%;
      transform: translateX(-50%);
      display: flex;
      gap: 4px;
      background: rgba(44, 44, 44, 0.95);
      padding: 6px;
      border-radius: 8px;
      z-index: 100;
      box-shadow: 0 4px 12px rgba(0,0,0,0.3);
      white-space: nowrap;
    `;

    // Alignment buttons
    const alignments = [
      { icon: "fa-align-left", align: "left", title: "Align Left" },
      { icon: "fa-align-center", align: "center", title: "Align Center" },
      { icon: "fa-align-right", align: "right", title: "Align Right" },
    ];

    alignments.forEach(({ icon, align, title }) => {
      const btn = document.createElement("button");
      btn.dataset.align = align;
      btn.className = "toolbar-btn";
      btn.innerHTML = `<i class="fa-solid ${icon}"></i>`;
      btn.title = title;
      btn.style.cssText = `
        width: 32px;
        height: 32px;
        background: ${
          wrapper.dataset.align === align ? "#c9a365" : "transparent"
        };
        color: white;
        border: none;
        border-radius: 4px;
        cursor: pointer;
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 14px;
        transition: all 0.2s ease;
      `;

      btn.addEventListener("mouseenter", () => {
        if (wrapper.dataset.align !== align) {
          btn.style.background = "rgba(201, 163, 101, 0.3)";
        }
      });

      btn.addEventListener("mouseleave", () => {
        if (wrapper.dataset.align !== align) {
          btn.style.background = "transparent";
        }
      });

      btn.addEventListener("click", (e) => {
        e.preventDefault();
        e.stopPropagation();
        this.setAlignment(wrapper, align);

        // Update button states
        toolbar.querySelectorAll(".toolbar-btn[data-align]").forEach((b, i) => {
          b.style.background =
            alignments[i].align === align ? "#c9a365" : "transparent";
        });
      });

      toolbar.appendChild(btn);
    });

    // Separator
    const separator = document.createElement("div");
    separator.style.cssText = `
      width: 1px;
      height: 24px;
      background: rgba(255, 255, 255, 0.2);
      margin: 4px 4px;
    `;
    toolbar.appendChild(separator);

    // Delete button
    const deleteBtn = document.createElement("button");
    deleteBtn.className = "toolbar-btn";
    deleteBtn.innerHTML = '<i class="fa-solid fa-trash"></i>';
    deleteBtn.title = "Delete Image";
    deleteBtn.style.cssText = `
      width: 32px;
      height: 32px;
      background: transparent;
      color: #e74c3c;
      border: none;
      border-radius: 4px;
      cursor: pointer;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 14px;
      transition: all 0.2s ease;
    `;

    deleteBtn.addEventListener("mouseenter", () => {
      deleteBtn.style.background = "rgba(231, 76, 60, 0.2)";
    });

    deleteBtn.addEventListener("mouseleave", () => {
      deleteBtn.style.background = "transparent";
    });

    deleteBtn.addEventListener("click", (e) => {
      e.preventDefault();
      e.stopPropagation();
      wrapper.remove();
      this.activeImage = null;
      
      // Trigger save after deletion
      this.noteContent.dispatchEvent(new Event("input", { bubbles: true }));
    });

    toolbar.appendChild(deleteBtn);

    // Resize handle (bottom-right corner)
    const resizeHandle = document.createElement("div");
    resizeHandle.className = "image-control resize-handle";
    resizeHandle.style.cssText = `
      position: absolute;
      bottom: -5px;
      right: -5px;
      width: 16px;
      height: 16px;
      background: #c9a365;
      border: 2px solid white;
      border-radius: 50%;
      cursor: nwse-resize;
      z-index: 10;
      box-shadow: 0 2px 4px rgba(0,0,0,0.2);
    `;

    resizeHandle.addEventListener("mousedown", (e) => {
      e.preventDefault();
      e.stopPropagation();
      this.startResize(e);
    });

    // Width display
    const widthLabel = document.createElement("div");
    widthLabel.className = "image-control width-label";
    widthLabel.textContent = `${Math.round(this.activeImage.offsetWidth)}px`;
    widthLabel.style.cssText = `
      position: absolute;
      bottom: -30px;
      left: 50%;
      transform: translateX(-50%);
      background: rgba(44, 44, 44, 0.9);
      color: white;
      padding: 4px 8px;
      border-radius: 4px;
      font-size: 11px;
      white-space: nowrap;
      z-index: 10;
      pointer-events: none;
    `;

    wrapper.appendChild(toolbar);
    wrapper.appendChild(resizeHandle);
    wrapper.appendChild(widthLabel);
  }

  setAlignment(wrapper, align) {
    wrapper.dataset.align = align;
    wrapper.style.textAlign = align;
    
    // Trigger save after alignment change
    this.noteContent.dispatchEvent(new Event("input", { bubbles: true }));
  }

  startResize(e) {
    if (!this.activeImage) return;
    
    this.resizing = true;
    this.startX = e.clientX;
    this.startWidth = this.activeImage.offsetWidth;
    this.startHeight = this.activeImage.offsetHeight;
    document.body.style.cursor = "nwse-resize";
    document.body.style.userSelect = "none";
  }

  handleMouseMove(e) {
    if (this.resizing && this.activeImage) {
      e.preventDefault();
      
      const deltaX = e.clientX - this.startX;
      const newWidth = this.startWidth + deltaX;
      const maxWidth = this.noteContent.offsetWidth;

      if (newWidth > 50 && newWidth <= maxWidth) {
        this.activeImage.style.width = newWidth + "px";
        this.activeImage.style.maxWidth = "none";
        this.activeImage.style.height = "auto";

        // Update width label
        const wrapper = this.activeImage.parentElement;
        if (wrapper) {
          const widthLabel = wrapper.querySelector(".width-label");
          if (widthLabel) {
            widthLabel.textContent = `${Math.round(newWidth)}px`;
          }
        }
      }
    }
  }

  handleMouseUp() {
    if (this.resizing && this.activeImage) {
      const wrapper = this.activeImage.parentElement;
      if (wrapper) {
        // Store the width in dataset for restoration
        wrapper.dataset.width = this.activeImage.style.width;

        // Trigger save after resize
        this.noteContent.dispatchEvent(
          new Event("input", { bubbles: true })
        );
      }
    }
    
    this.resizing = false;
    document.body.style.cursor = "default";
    document.body.style.userSelect = "";
  }

  insertAtCaret(node) {
    const selection = window.getSelection();
    if (!selection || selection.rangeCount === 0) {
      this.noteContent.appendChild(node);
      
      // Add line break for proper spacing
      const br = document.createElement("br");
      this.noteContent.appendChild(br);
      return;
    }

    const range = selection.getRangeAt(0);
    range.deleteContents();
    range.insertNode(node);

    // Add a line break after the image 
    const br = document.createElement("br");
    range.collapse(false);
    range.insertNode(br);

    // Move caret after the line break
    range.setStartAfter(br);
    range.collapse(true);
    selection.removeAllRanges();
    selection.addRange(range);
  }
}