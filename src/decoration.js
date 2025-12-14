// decoration.js
class TextDecorationToolbar {
  constructor() {
    this.toolbar = null;
    this.noteContent = document.getElementById('noteContent');
    this.init();
  }

  init() {
    this.createToolbar();
    this.attachEventListeners();
  }

  createToolbar() {
    // Create toolbar element
    this.toolbar = document.createElement('div');
    this.toolbar.className = 'decoration-toolbar';
    this.toolbar.innerHTML = `
      <button class="decoration-btn" data-command="bold" data-tooltip="Bold (Ctrl+B)">
        <i class="fa-solid fa-bold"></i>
      </button>
      <button class="decoration-btn" data-command="italic" data-tooltip="Italic (Ctrl+I)">
        <i class="fa-solid fa-italic"></i>
      </button>
      <button class="decoration-btn" data-command="underline" data-tooltip="Underline (Ctrl+U)">
        <i class="fa-solid fa-underline"></i>
      </button>
      <div class="toolbar-separator"></div>
      <div class="color-picker-wrapper">
        <button class="decoration-btn" data-command="highlight" data-tooltip="Highlight">
          <i class="fa-solid fa-highlighter"></i>
          <input type="color" id="highlightColor" value="#ffeb3b">
        </button>
      </div>
      <div class="color-picker-wrapper">
        <button class="decoration-btn" data-command="textColor" data-tooltip="Text Color">
          <i class="fa-solid fa-palette"></i>
          <input type="color" id="textColor" value="#d9985b">
        </button>
      </div>
      <div class="toolbar-separator"></div>
      <button class="decoration-btn" data-command="removeFormat" data-tooltip="Clear Formatting">
        <i class="fa-solid fa-eraser"></i>
      </button>
    `;
    
    document.body.appendChild(this.toolbar);
  }

  attachEventListeners() {
    // Show toolbar on text selection
    this.noteContent.addEventListener('mouseup', (e) => this.handleSelection(e));
    this.noteContent.addEventListener('keyup', (e) => this.handleSelection(e));
    
    // Hide toolbar when clicking outside
    document.addEventListener('mousedown', (e) => {
      if (!this.toolbar.contains(e.target) && e.target !== this.noteContent) {
        this.hideToolbar();
      }
    });

    // Decoration button clicks
    this.toolbar.querySelectorAll('.decoration-btn').forEach(btn => {
      btn.addEventListener('mousedown', (e) => {
        e.preventDefault(); // Prevent losing selection
        const command = btn.dataset.command;
        this.applyDecoration(command);
      });
    });

    // Color pickers
    document.getElementById('highlightColor').addEventListener('input', (e) => {
      e.stopPropagation();
      this.applyHighlight(e.target.value);
    });

    document.getElementById('textColor').addEventListener('input', (e) => {
      e.stopPropagation();
      this.applyTextColor(e.target.value);
    });

    // Keyboard shortcuts
    this.noteContent.addEventListener('keydown', (e) => this.handleKeyboard(e));

    // Update active states when selection changes
    this.noteContent.addEventListener('mouseup', () => this.updateActiveStates());
    this.noteContent.addEventListener('keyup', () => this.updateActiveStates());
  }

  handleSelection(e) {
    const selection = window.getSelection();
    const selectedText = selection.toString().trim();

    if (selectedText.length > 0) {
      this.showToolbar(selection);
    } else {
      this.hideToolbar();
    }
  }

  showToolbar(selection) {
    const range = selection.getRangeAt(0);
    const rect = range.getBoundingClientRect();
    
    // Position toolbar above selection (using fixed positioning)
    const toolbarHeight = 50;
    const top = rect.top - toolbarHeight;
    const left = rect.left + (rect.width / 2);

    this.toolbar.style.top = `${top}px`;
    this.toolbar.style.left = `${left}px`;
    this.toolbar.style.transform = 'translateX(-50%)';
    this.toolbar.classList.add('active');

    this.updateActiveStates();
  }

  hideToolbar() {
    this.toolbar.classList.remove('active');
  }

  applyDecoration(command) {
    const selection = window.getSelection();
    if (!selection.rangeCount) return;

    switch(command) {
      case 'bold':
        document.execCommand('bold', false, null);
        break;
      case 'italic':
        document.execCommand('italic', false, null);
        break;
      case 'underline':
        document.execCommand('underline', false, null);
        break;
      case 'removeFormat':
        document.execCommand('removeFormat', false, null);
        // Also remove background color
        document.execCommand('hiliteColor', false, 'transparent');
        break;
    }

    this.updateActiveStates();
    
    // Trigger input event to save changes
    this.noteContent.dispatchEvent(new Event('input', { bubbles: true }));
  }

  applyHighlight(color) {
    const selection = window.getSelection();
    if (!selection.rangeCount) return;

    document.execCommand('hiliteColor', false, color);
    
    // Trigger input event to save changes
    this.noteContent.dispatchEvent(new Event('input', { bubbles: true }));
  }

  applyTextColor(color) {
    const selection = window.getSelection();
    if (!selection.rangeCount) return;

    document.execCommand('foreColor', false, color);
    
    // Trigger input event to save changes
    this.noteContent.dispatchEvent(new Event('input', { bubbles: true }));
  }

  updateActiveStates() {
    // Update button states based on current selection
    const commands = ['bold', 'italic', 'underline'];
    
    commands.forEach(command => {
      const btn = this.toolbar.querySelector(`[data-command="${command}"]`);
      if (btn) {
        const isActive = document.queryCommandState(command);
        btn.classList.toggle('active', isActive);
      }
    });
  }

  handleKeyboard(e) {
    // Keyboard shortcuts
    if (e.ctrlKey || e.metaKey) {
      switch(e.key.toLowerCase()) {
        case 'b':
          e.preventDefault();
          this.applyDecoration('bold');
          break;
        case 'i':
          e.preventDefault();
          this.applyDecoration('italic');
          break;
        case 'u':
          e.preventDefault();
          this.applyDecoration('underline');
          break;
      }
    }
  }
}

// Initialize the decoration toolbar when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
  new TextDecorationToolbar();
});