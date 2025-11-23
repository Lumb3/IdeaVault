# 💡 IdeaVault — A Secure Note-Taking Desktop Application

Welcome to **IdeaVault v1.0.0**!  
IdeaVault is a simple, user-friendly desktop application designed for organizing school notes and securely storing personal information. While the first deployment is intended for my personal use, future releases will support more users.

---

## ✨ Features

- **Secure Login** — The login password is safely stored using bcrypt hashing.
- **Note-Taking** — Create and organize notes for classes, projects, or personal use.
- **Remote Database** — All data is stored in a remote PostgreSQL database.
- **Auto-Save** — Notes are automatically saved to prevent data loss.
- **Cross-Platform** — Built with Electron.js for compatibility across macOS, Windows, and Linux.

---

## 🛠️ Technologies Used

- **Electron.js** — Framework for building cross-platform desktop apps using HTML, CSS, and JavaScript. (*Font Awesome is used for icon selection.*)
- **PostgreSQL** — Open-source relational database for secure data storage.
- **bcrypt.js** — Used for password hashing and authentication security.
- **Node.js** — Backend runtime environment.

---

## 📦 Installation

### Prerequisites

- macOS (ARM64 architecture for v1.0.0)
- Internet connection for database access

### Download and Install

1. Navigate to the [Releases](https://github.com/Lumb3/IdeaVault/releases/tag/v1.0.0) page
2. Download **v1.0.0** → `dist.zip`
3. Extract the zip file
4. Open the `mac-arm64` folder
5. Double-click the **IdeaVault** application to launch

> **Note:** For first-time users on macOS, you may need to right-click the app and select "Open" to bypass Gatekeeper security.

---

## 🚀 Quick Start

1. **Launch the Application** — Open IdeaVault from your Applications folder
2. **Login** — Enter your credentials (default username and password provided separately)
3. **Create Notes** — Click the "+" button to add a new note
4. **Save Your Work** — Use Cmd+S or click the save button
5. **Exit Safely** — Always use the exit button to ensure data is saved

---

## 🔍 Preview

### Application icon

<p align="center">
  <img src="imgs/icon.png" width="300" alt="IdeaVault Icon">
</p>

### Login page

<p align="center">
  <img src="imgs/login.png" width="600" alt="Login Page">
</p>

### Incorrect password

<p align="center">
  <img src="imgs/incorrect.png" width="600" alt="Incorrect Password">
</p>

Once the username and password match the hashed credentials stored in the PostgreSQL database, access to the main page is granted:

### Main page

<p align="center">
  <img src="imgs/main.png" width="600" alt="Main Page">
</p>

From here, notes can be added, deleted, saved, and safely exited using the toolbar buttons.

### Example usage

<p align="center">
  <img src="imgs/example.png" width="600" alt="Example Usage">
</p>

---

## 🔐 Security

- **Password Protection** — All passwords are hashed using bcrypt before storage
- **Secure Connection** — Data transmitted to PostgreSQL database over secure connections
- **No Local Storage** — Sensitive data is never stored locally in plain text

---

## 🤝 Contributing

This project is currently in development and not open for contributions. However, feedback and suggestions are always welcome!

If you encounter any issues or have feature requests, please open an issue on the [GitHub repository](https://github.com/Lumb3/IdeaVault/issues).

---

## 📝 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

---

## 🚀 Future Plans

This is the first release of IdeaVault and currently supports only a private user.

**Planned Features:**
- 🔄 Multi-user support with individual accounts
- 🌐 Migration to Supabase for scalable authentication
- 🏷️ Note tagging and categorization system
- 🔍 Advanced search functionality
- 📱 Mobile companion app (iOS/Android)
- 🌙 Dark mode support
- 📤 Export notes to PDF/Markdown
- 🔔 Reminder and notification system

---

## 📧 Contact

For questions, feedback, or support, feel free to reach out:
- GitHub: [@Lumb3](https://github.com/Lumb3)
- Open an [issue](https://github.com/Lumb3/IdeaVault/issues) for bug reports or feature requests

---

<p align="center">Made with ❤️ by Lumb333</p>
<p align="center">
  <a href="https://github.com/Lumb3/IdeaVault">⭐ Star this repository if you find it helpful!</a>
</p>