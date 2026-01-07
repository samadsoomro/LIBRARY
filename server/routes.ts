import type { Express, Request } from "express";
import { storage } from "./storage.js";
import bcrypt from "bcryptjs";
import multer from "multer";
import path from "path";
import fs from "fs";

const uploadDir = path.join(process.cwd(), "server", "uploads");
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

const storage_multer = multer.diskStorage({
  destination: function (_req, _file, cb) {
    cb(null, uploadDir);
  },
  filename: function (_req, file, cb) {
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    cb(null, uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({ storage: storage_multer });

const ADMIN_EMAIL = process.env.ADMIN_EMAIL || "admin@gcmn.edu.pk";
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || "admin123";
const ADMIN_SECRET_KEY = process.env.ADMIN_SECRET_KEY || "gcmn-admin-2024";

function requireAdmin(req: Request, res: any, next: any) {
  if (!req.session.isAdmin) {
    return res.status(403).json({ error: "Admin access required" });
  }
  next();
}

export async function registerRoutes(app: Express) {
  // Auth Routes
  app.post("/api/auth/register", async (req, res) => {
    try {
      const { email, password, fullName, phone, rollNumber, department, studentClass } = req.body;
      const existing = await storage.getUserByEmail(email);
      if (existing) {
        return res.status(400).json({ error: "Email already registered" });
      }

      const hashedPassword = await bcrypt.hash(password, 10);
      const user = await storage.createUser({
        email,
        password: hashedPassword,
        fullName,
        phone,
        rollNumber,
        department,
        studentClass,
        type: (studentClass ? "student" : "user") as string,
        isAdmin: false
      } as any);

      await storage.createUserRole({ userId: user.id, role: "user" } as any);

      req.session.userId = user.id;
      req.session.isAdmin = false;

      res.json({ user: { id: user.id, email: user.email } });
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  });

  app.post("/api/auth/login", async (req, res) => {
    try {
      const { email, password, secretKey, libraryCardId } = req.body;

      if (secretKey) {
        if (email === ADMIN_EMAIL && password === ADMIN_PASSWORD && secretKey === ADMIN_SECRET_KEY) {
          req.session.userId = "admin";
          req.session.isAdmin = true;
          return res.json({
            user: { id: "admin", email: ADMIN_EMAIL },
            isAdmin: true,
            redirect: "/admin-dashboard"
          });
        }
      }

      if (libraryCardId) {
        const cardApp = await storage.getLibraryCardByCardNumber(libraryCardId);
        const invalidCredentialsMsg = "Write correct details";

        if (!cardApp) {
          return res.status(401).json({ error: invalidCredentialsMsg });
        }

        if (cardApp.password) {
          const valid = await bcrypt.compare(password, cardApp.password);
          if (!valid) {
            return res.status(401).json({ error: invalidCredentialsMsg });
          }
        }

        if (cardApp.status === "pending") {
          return res.status(401).json({ error: "Your account is pending for approval" });
        } else if (cardApp.status === "rejected") {
          return res.status(401).json({ error: "Your application was rejected. Please contact library." });
        }

        req.session.userId = cardApp.id;
        req.session.isAdmin = false;
        return res.json({ user: { id: cardApp.id, email: cardApp.email } });
      }

      const user = await storage.getUserByEmail(email);
      if (!user) {
        return res.status(401).json({ error: "Invalid credentials" });
      }

      const validPassword = await bcrypt.compare(password, user.password);
      if (!validPassword) {
        return res.status(401).json({ error: "Invalid credentials" });
      }

      req.session.userId = user.id;
      req.session.isAdmin = user.isAdmin;

      res.json({ user: { id: user.id, email: user.email }, isAdmin: user.isAdmin });
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  });

  app.post("/api/auth/logout", (req, res) => {
    req.session.destroy(() => {
      res.json({ success: true });
    });
  });

  app.get("/api/auth/me", async (req, res) => {
    if (!req.session.userId) {
      return res.status(401).json({ error: "Not logged in" });
    }

    if (req.session.userId === "admin") {
      return res.json({ user: { id: "admin", email: ADMIN_EMAIL }, isAdmin: true });
    }

    const user = await storage.getUser(req.session.userId);
    if (!user) {
      const cardApp = await storage.getLibraryCardApplication(req.session.userId);
      if (cardApp) {
        return res.json({ user: { id: cardApp.id, email: cardApp.email }, isAdmin: false });
      }
      return res.status(401).json({ error: "User not found" });
    }

    res.json({ user: { id: user.id, email: user.email }, isAdmin: user.isAdmin });
  });

  // Profile Routes
  app.get("/api/profile", async (req, res) => {
    if (!req.session.userId) return res.status(401).json({ error: "Unauthorized" });
    const profile = await storage.getProfile(req.session.userId);
    res.json(profile || {});
  });

  app.post("/api/profile", async (req, res) => {
    if (!req.session.userId) return res.status(401).json({ error: "Unauthorized" });
    const profile = await storage.updateProfile(req.session.userId, req.body);
    res.json(profile);
  });

  // Book Routes
  app.get("/api/books", async (_req, res) => {
    const books = await storage.getBooks();
    res.json(books);
  });

  app.post("/api/books", requireAdmin, upload.single("bookImage"), async (req, res) => {
    try {
      const bookData = {
        ...req.body,
        bookImage: req.file ? `/server/uploads/${req.file.filename}` : req.body.bookImage
      };
      const book = await storage.createBook(bookData);
      res.json(book);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  });

  app.patch("/api/books/:id", requireAdmin, upload.single("bookImage"), async (req, res) => {
    try {
      const bookData = {
        ...req.body,
        bookImage: req.file ? `/server/uploads/${req.file.filename}` : req.body.bookImage
      };
      const book = await storage.updateBook(req.params.id, bookData);
      res.json(book);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  });

  app.delete("/api/books/:id", requireAdmin, async (req, res) => {
    await storage.deleteBook(req.params.id);
    res.json({ success: true });
  });

  // Library Card Routes
  app.get("/api/library-card/applications", requireAdmin, async (_req, res) => {
    const applications = await storage.getLibraryCardApplications();
    res.json(applications);
  });

  app.post("/api/library-card/apply", async (req, res) => {
    try {
      const application = await storage.createLibraryCardApplication(req.body);
      res.json(application);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  });

  app.patch("/api/library-card/applications/:id/status", requireAdmin, async (req, res) => {
    const application = await storage.updateLibraryCardApplicationStatus(req.params.id, req.body.status);
    res.json(application);
  });

  app.delete("/api/library-card/applications/:id", requireAdmin, async (req, res) => {
    await storage.deleteLibraryCardApplication(req.params.id);
    res.json({ success: true });
  });

  // Book Borrow Routes
  app.get("/api/book-borrows", requireAdmin, async (_req, res) => {
    const borrows = await storage.getBookBorrows();
    res.json(borrows);
  });

  app.post("/api/book-borrows", requireAdmin, async (req, res) => {
    try {
      const borrow = await storage.createBookBorrow(req.body);
      res.json(borrow);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  });

  app.patch("/api/book-borrows/:id/status", requireAdmin, async (req, res) => {
    const borrow = await storage.updateBookBorrowStatus(req.params.id, req.body.status, req.body.returnDate ? new Date(req.body.returnDate) : undefined);
    res.json(borrow);
  });

  app.delete("/api/book-borrows/:id", requireAdmin, async (req, res) => {
    await storage.deleteBookBorrow(req.params.id);
    res.json({ success: true });
  });

  // Rare Books Routes
  app.get("/api/rare-books", async (_req, res) => {
    const books = await storage.getRareBooks();
    res.json(books);
  });

  app.post("/api/rare-books", requireAdmin, upload.fields([
    { name: "pdf", maxCount: 1 },
    { name: "cover", maxCount: 1 }
  ]), async (req, res) => {
    try {
      const files = req.files as { [fieldname: string]: Express.Multer.File[] };
      const bookData = {
        ...req.body,
        pdfPath: files.pdf ? `/server/uploads/${files.pdf[0].filename}` : "",
        coverImage: files.cover ? `/server/uploads/${files.cover[0].filename}` : ""
      };
      const book = await storage.createRareBook(bookData);
      res.json(book);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  });

  app.patch("/api/rare-books/:id/toggle", requireAdmin, async (req, res) => {
    const book = await storage.toggleRareBookStatus(req.params.id);
    res.json(book);
  });

  app.delete("/api/rare-books/:id", requireAdmin, async (req, res) => {
    await storage.deleteRareBook(req.params.id);
    res.json({ success: true });
  });

  // Notes Routes
  app.get("/api/notes", async (req, res) => {
    const { class: studentClass, subject } = req.query;
    let notes;
    if (studentClass && subject) {
      notes = await storage.getNotesByClassAndSubject(studentClass as string, subject as string);
    } else {
      notes = await storage.getActiveNotes();
    }
    res.json(notes);
  });

  app.get("/api/admin/notes", requireAdmin, async (_req, res) => {
    const notes = await storage.getNotes();
    res.json(notes);
  });

  app.post("/api/notes", requireAdmin, upload.single("pdf"), async (req, res) => {
    try {
      const noteData = {
        ...req.body,
        pdfPath: req.file ? `/server/uploads/${req.file.filename}` : ""
      };
      const note = await storage.createNote(noteData);
      res.json(note);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  });

  app.patch("/api/notes/:id", requireAdmin, async (req, res) => {
    const note = await storage.updateNote(req.params.id, req.body);
    res.json(note);
  });

  app.patch("/api/notes/:id/toggle", requireAdmin, async (req, res) => {
    const note = await storage.toggleNoteStatus(req.params.id);
    res.json(note);
  });

  app.delete("/api/notes/:id", requireAdmin, async (req, res) => {
    await storage.deleteNote(req.params.id);
    res.json({ success: true });
  });

  // Events Routes
  app.get("/api/events", async (_req, res) => {
    const events = await storage.getEvents();
    res.json(events);
  });

  app.post("/api/events", requireAdmin, upload.array("images", 10), async (req, res) => {
    try {
      const files = req.files as Express.Multer.File[];
      const eventData = {
        ...req.body,
        images: files ? files.map(f => `/server/uploads/${f.filename}`) : []
      };
      const event = await storage.createEvent(eventData);
      res.json(event);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  });

  app.patch("/api/events/:id", requireAdmin, async (req, res) => {
    const event = await storage.updateEvent(req.params.id, req.body);
    res.json(event);
  });

  app.delete("/api/events/:id", requireAdmin, async (req, res) => {
    await storage.deleteEvent(req.params.id);
    res.json({ success: true });
  });

  // Notifications Routes
  app.get("/api/notifications", async (_req, res) => {
    const notifications = await storage.getNotifications();
    res.json(notifications);
  });

  app.post("/api/notifications", requireAdmin, upload.single("image"), async (req, res) => {
    try {
      const notificationData = {
        ...req.body,
        image: req.file ? `/server/uploads/${req.file.filename}` : req.body.image
      };
      const notification = await storage.createNotification(notificationData);
      res.json(notification);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  });

  app.delete("/api/notifications/:id", requireAdmin, async (req, res) => {
    await storage.deleteNotification(req.params.id);
    res.json({ success: true });
  });

  // Contact Messages
  app.get("/api/contact-messages", requireAdmin, async (_req, res) => {
    const messages = await storage.getContactMessages();
    res.json(messages);
  });

  app.post("/api/contact", async (req, res) => {
    try {
      const message = await storage.createContactMessage(req.body);
      res.json(message);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  });

  app.patch("/api/contact-messages/:id/seen", requireAdmin, async (req, res) => {
    const message = await storage.updateContactMessageSeen(req.params.id, req.body.isSeen);
    res.json(message);
  });

  app.delete("/api/contact-messages/:id", requireAdmin, async (req, res) => {
    await storage.deleteContactMessage(req.params.id);
    res.json({ success: true });
  });

  // Donations
  app.get("/api/donations", requireAdmin, async (_req, res) => {
    const donations = await storage.getDonations();
    res.json(donations);
  });

  app.post("/api/donations", async (req, res) => {
    try {
      const donation = await storage.createDonation(req.body);
      res.json(donation);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  });

  app.delete("/api/donations/:id", requireAdmin, async (req, res) => {
    await storage.deleteDonation(req.params.id);
    res.json({ success: true });
  });
}
