// main.js
require("dotenv").config();
const { app, BrowserWindow, ipcMain } = require("electron");
app.commandLine.appendSwitch("enable-speech-input");
const path = require("path");
const bcrypt = require("bcryptjs");
const { createClient } = require("@supabase/supabase-js");

const {
    Document,
    Packer,
    Paragraph,
    TextRun,
    HeadingLevel,
    BorderStyle,
} = require("docx");
const { spawn } = require("child_process");


let speechProcess = null;
let mainWindow = null;
let currentUserId = null;

// Initialize Supabase client
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_ANON_KEY;
// Validate environment variables
if (!supabaseUrl || !supabaseKey) {
    console.error('ERROR: Missing Supabase credentials!');
    console.error('Please create a .env file with SUPABASE_URL and SUPABASE_ANON_KEY');
    app.quit();
}

const supabase = createClient(supabaseUrl, supabaseKey);


// Start speech recognition service
function startSpeechService() {
    if (speechProcess) {
        console.log("Speech service already running");
        return;
    }

    console.log("Starting speech service...");

    const speechBinaryPath = path.join(__dirname, "..", "dist", "speech_service");
    console.log("Binary path:", speechBinaryPath);

    speechProcess = spawn(speechBinaryPath, [], {
        stdio: ["ignore", "pipe", "pipe"],
    });

    console.log("Speech process spawned, PID:", speechProcess.pid);

    speechProcess.stdout.on("data", (data) => {
        const output = data.toString().trim();
        console.log("RAW STDOUT:", output);

        if (output.startsWith("Text: ")) {
            const text = output.replace("Text:", "").trim();
            console.log("Sending FINAL text to renderer:", text);

            if (mainWindow && !mainWindow.isDestroyed()) {
                mainWindow.webContents.send("speech-final", text);
                console.log("Final text sent successfully");
            } else {
                console.error("mainWindow not available!");
            }
        }

        if (output.startsWith("Partial: ")) {
            const partial = output.replace("Partial:", "").trim();
            console.log("⚡ Sending PARTIAL text to renderer:", partial);

            if (mainWindow && !mainWindow.isDestroyed()) {
                mainWindow.webContents.send("speech-partial", partial);
                console.log("Partial text sent successfully");
            } else {
                console.error("mainWindow not available!");
            }
        }
    });

    speechProcess.stderr.on("data", (data) => {
        const errMsg = data.toString();
        console.log("Speech service stderr:", errMsg);
    });

    speechProcess.on("close", (code) => {
        console.log("Speech service stopped with code", code);
        speechProcess = null;
    });

    speechProcess.on("error", (error) => {
        console.error("Speech process error:", error);
        speechProcess = null;
    });
}

function stopSpeechService() {
    if (speechProcess) {
        console.log("Stopping speech service...");
        speechProcess.kill();
        speechProcess = null;
    }
}

ipcMain.handle("start-speech-service", async () => {
    console.log("IPC start-speech-service called");
    startSpeechService();
    return { success: true };
});

ipcMain.handle("stop-speech-service", async () => {
    console.log("IPC: stop-speech-service called");
    stopSpeechService();
    return { success: true };
});

// Initialize database tables
async function initDatabase() {
    try {
        // Better approach: try to query and handle any error
        const { data, error } = await supabase
            .from('users')
            .select('id')
            .limit(1);

        if (error) {
            console.log("Database tables may not exist yet.");
            console.log("Please run this SQL in your Supabase SQL Editor:");
            console.log(`
        CREATE TABLE IF NOT EXISTS users (
          id SERIAL PRIMARY KEY,
          username VARCHAR(50) UNIQUE NOT NULL,
          password VARCHAR(255) NOT NULL
        );

        CREATE TABLE IF NOT EXISTS notes (
          id VARCHAR(20) PRIMARY KEY,
          title VARCHAR(255) NOT NULL,
          content TEXT,
          created_at TIMESTAMP NOT NULL DEFAULT NOW(),
          updated_at TIMESTAMP NOT NULL DEFAULT NOW()
        );
        
        CREATE INDEX IF NOT EXISTS idx_notes_updated_at ON notes(updated_at DESC);
      `);
        } else {
            console.log("Database connection successful!");
        }
    } catch (err) {
        console.error("Error checking database:", err);
    }
}

function registerIPCHandlers() {
    console.log("Registering IPC handlers...");

    // Handle DOCX generation
    ipcMain.handle("generate-docx", async (event, noteData) => {
        try {
            console.log("Generating DOCX for note:", noteData.title);
            const { title, content, createdAt, updatedAt } = noteData;

            const contentParagraphs = content.split("\n").map(
                (line) =>
                    new Paragraph({
                        children: [
                            new TextRun({
                                text: line || " ",
                                size: 24,
                            }),
                        ],
                        spacing: {
                            after: 100,
                        },
                    })
            );

            const doc = new Document({
                sections: [
                    {
                        properties: {},
                        children: [
                            new Paragraph({
                                text: title,
                                heading: HeadingLevel.HEADING_1,
                                spacing: {
                                    after: 200,
                                },
                            }),

                            new Paragraph({
                                border: {
                                    bottom: {
                                        color: "000000",
                                        space: 1,
                                        style: BorderStyle.SINGLE,
                                        size: 6,
                                    },
                                },
                                spacing: {
                                    after: 200,
                                },
                            }),

                            ...contentParagraphs,

                            new Paragraph({
                                text: "",
                                spacing: {
                                    after: 200,
                                },
                            }),

                            new Paragraph({
                                children: [
                                    new TextRun({
                                        text: `Created: ${new Date(createdAt).toLocaleString()}`,
                                        size: 18,
                                        color: "808080",
                                    }),
                                ],
                            }),
                            new Paragraph({
                                children: [
                                    new TextRun({
                                        text: `Last Updated: ${new Date(updatedAt).toLocaleString()}`,
                                        size: 18,
                                        color: "808080",
                                    }),
                                ],
                            }),
                        ],
                    },
                ],
            });

            const buffer = await Packer.toBuffer(doc);
            console.log("DOCX generated successfully, size:", buffer.length, "bytes");
            return Array.from(buffer);
        } catch (error) {
            console.error("DOCX creation error:", error);
            throw error;
        }
    });

    // Handle login attempt
    ipcMain.handle("login-attempt", async (event, { username, password }) => {
        try {
            const { data, error } = await supabase
                .from('users')
                .select('*')
                .eq('username', username)
                .single();

            if (error || !data) {
                return { success: false, message: "User not found" };
            }

            const valid = bcrypt.compareSync(password, data.password);

            if (valid) {
                currentUserId = data.id; // Store the user ID
                return { success: true, message: "Login successful" };
            } else {
                return { success: false, message: "Wrong password" };
            }
        } catch (err) {
            console.error("Login error:", err);
            return { success: false, message: "Server error" };
        }
    });

    // Handle load notes
    ipcMain.handle("load-notes", async () => {
        try {
            const { data, error } = await supabase
                .from('notes')
                .select('*')
                .eq('user_id', currentUserId)
                .order('updated_at', { ascending: false });

            if (error) {
                console.error("Error loading notes:", error);
                return [];
            }

            console.log("Successfully loaded", data.length, "notes");

            return data.map((note) => ({
                id: note.id,
                title: note.title,
                content: note.content,
                createdAt: note.created_at,
                updatedAt: note.updated_at,
            }));
        } catch (error) {
            console.error("Error loading notes:", error);
            return [];
        }
    });

    // Handle save notes
    ipcMain.handle("save-notes", async (event, notes) => {
        if (!Array.isArray(notes) || notes.length === 0) {
            return;
        }

        try {
            // Prepare notes for upsert
            const notesToSave = notes.map((note) => ({
                id: note.id,
                title: note.title,
                content: note.content,
                created_at: note.createdAt,
                updated_at: note.updatedAt,
                user_id: currentUserId,
            }));

            const { error } = await supabase
                .from('notes')
                .upsert(notesToSave, { onConflict: 'id' });

            if (error) {
                console.error("Error saving notes:", error);
                throw error;
            }

            console.log(`Successfully saved ${notes.length} notes`);
        } catch (err) {
            console.error("Error saving notes:", err);
            throw err;
        }
    });

    // Handle delete note
    ipcMain.handle("delete-note", async (event, noteId) => {
        try {
            const { error } = await supabase
                .from('notes')
                .delete()
                .eq('id', noteId)
                .eq('user_id', currentUserId);

            if (error) {
                console.error("Error deleting note:", error);
                throw error;
            }

            console.log(`Successfully deleted note ${noteId}`);
        } catch (err) {
            console.error("Error deleting note:", err);
            throw err;
        }
    });
    ipcMain.handle("signup-attempt", async (event, { username, password }) => {
        try {
            const { data: existingUser, error: checkError } = await supabase.from('users').select('username').eq('username', username).single();
            if (existingUser) {
                return { success: false, message: "Username already exists" };
            }
            const hashedPassword = bcrypt.hashSync(password, 10);

            // Insert new user
            const { data, error } = await supabase.from('users').insert([
                {
                    username: username,
                    password: hashedPassword
                }
            ]).select().single();
            if (error) {
                console.error("Signup error: ", error);
                return { success: false, message: "Failed to create account" };
            }
            currentUserId = data.id;
            return { success: true, message: "Account created successfully" };
        } catch (err) {
            console.error("Signup error: ", err);
            return { success: false, message: "Server error" };
        }
    });
    // Handle quit app
    ipcMain.handle("quit-app", async () => {
        currentUserId = null;
        app.quit();
    });

    console.log("All IPC handlers registered successfully");
}

function createWindow() {
    mainWindow = new BrowserWindow({
        width: 900,
        height: 650,
        title: "IdeaVault",
        icon: path.join(__dirname, "assets", "icon.icns"),
        webPreferences: {
            nodeIntegration: false,
            contextIsolation: true,
            preload: path.join(__dirname, "preload.js"),
        },
    });

    mainWindow.loadFile(path.join(__dirname, "login.html"));

    console.log("mainWindow created and assigned to global variable");
}

app.setName("IdeaVault");

app.whenReady().then(async () => {
    registerIPCHandlers();
    await initDatabase();
    createWindow();
});

app.on("window-all-closed", () => {
    if (process.platform !== "darwin") {
        stopSpeechService();
        app.quit();
    }
});

app.on("before-quit", () => {
    stopSpeechService();
});

app.on("activate", () => {
    if (BrowserWindow.getAllWindows().length === 0) {
        createWindow();
    }
});