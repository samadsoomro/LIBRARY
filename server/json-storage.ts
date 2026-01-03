import fs from "fs/promises";
import path from "path";
import { randomBytes } from "crypto";

const DATA_DIR = path.join(process.cwd(), ".data");

function generateId(): string {
  return randomBytes(8).toString("hex");
}

interface StorageData {
  users: any[];
  profiles: any[];
  contactMessages: any[];
  bookBorrows: any[];
  libraryCardApplications: any[];
  donations: any[];
  userRoles: any[];
  notes: any[];
  rareBooks: any[];
  books: any[];
  students: any[];
  events: any[];
  notifications: any[];
}

class JsonStorage {
  private data: StorageData = {
    users: [],
    profiles: [],
    contactMessages: [],
    bookBorrows: [],
    libraryCardApplications: [],
    donations: [],
    userRoles: [],
    notes: [],
    rareBooks: [],
    books: [],
    students: [],
    events: [],
    notifications: []
  };

  async init() {
    try {
      await fs.mkdir(DATA_DIR, { recursive: true });
      const dataFile = path.join(DATA_DIR, "data.json");
      try {
        const content = await fs.readFile(dataFile, "utf-8");
        this.data = JSON.parse(content);
        // Ensure all arrays exist
        Object.keys(this.data).forEach(key => {
          if (!Array.isArray((this.data as any)[key])) {
            (this.data as any)[key] = [];
          }
        });

        // Data migration: Ensure all library card applications have a status
        if (this.data.libraryCardApplications) {
          let migrated = false;
          this.data.libraryCardApplications.forEach(app => {
            if (!app.status) {
              app.status = "pending";
              migrated = true;
            }
          });
          if (migrated) await this.save();
        }

        // Add default admin if no users exist
        if (this.data.users.length === 0) {
          this.data.users.push({
            id: "1",
            username: "admin",
            password: "password", // This matches the user's likely expectation for a default
            isAdmin: true,
            fullName: "System Admin",
            email: "admin@gcmn.edu.pk",
            type: "admin"
          });
          await this.save();
        }
      } catch {
        // Initialize with default admin
        this.data.users = [{
          id: "1",
          username: "admin",
          password: "password",
          isAdmin: true,
          fullName: "System Admin",
          email: "admin@gcmn.edu.pk",
          type: "admin"
        }];
        await this.save();
      }
    } catch (error) {
      console.error("Error initializing storage:", error);
    }
  }

  private async save() {
    const dataFile = path.join(DATA_DIR, "data.json");
    await fs.writeFile(dataFile, JSON.stringify(this.data, null, 2));
  }

  async getUser(id: string) {
    return this.data.users.find((u) => u.id === id);
  }

  async getUserByEmail(email: string) {
    return this.data.users.find((u) => u.email === email);
  }

  async createUser(user: any) {
    const id = generateId();
    const newUser = { id, ...user, createdAt: new Date().toISOString() };
    this.data.users.push(newUser);
    await this.save();
    return newUser;
  }

  async deleteUser(id: string) {
    this.data.users = this.data.users.filter((u) => u.id !== id);
    this.data.profiles = this.data.profiles.filter((p) => p.userId !== id);
    this.data.userRoles = this.data.userRoles.filter((r) => r.userId !== id);
    await this.save();
  }

  async getProfile(userId: string) {
    return this.data.profiles.find((p) => p.userId === userId);
  }

  async createProfile(profile: any) {
    const newProfile = { id: generateId(), ...profile, createdAt: new Date().toISOString() };
    this.data.profiles.push(newProfile);
    await this.save();
    return newProfile;
  }

  async updateProfile(userId: string, profile: any) {
    const existing = this.data.profiles.find((p) => p.userId === userId);
    if (!existing) return undefined;
    Object.assign(existing, profile, { updatedAt: new Date().toISOString() });
    await this.save();
    return existing;
  }

  async getUserRoles(userId: string) {
    return this.data.userRoles.filter((r) => r.userId === userId);
  }

  async createUserRole(role: any) {
    const newRole = { id: generateId(), ...role, createdAt: new Date().toISOString() };
    this.data.userRoles.push(newRole);
    await this.save();
    return newRole;
  }

  async hasRole(userId: string, role: string) {
    return this.data.userRoles.some((r) => r.userId === userId && r.role === role);
  }

  async getContactMessages() {
    return this.data.contactMessages;
  }

  async getContactMessage(id: string) {
    return this.data.contactMessages.find((m) => m.id === id);
  }

  async createContactMessage(message: any) {
    const newMessage = { id: generateId(), ...message, createdAt: new Date().toISOString(), isSeen: false };
    this.data.contactMessages.push(newMessage);
    await this.save();
    return newMessage;
  }

  async updateContactMessageSeen(id: string, isSeen: boolean) {
    const message = this.data.contactMessages.find((m) => m.id === id);
    if (!message) return undefined;
    message.isSeen = isSeen;
    await this.save();
    return message;
  }

  async deleteContactMessage(id: string) {
    this.data.contactMessages = this.data.contactMessages.filter((m) => m.id !== id);
    await this.save();
  }

  async getBookBorrows() {
    return this.data.bookBorrows;
  }

  async getBookBorrowsByUser(userId: string) {
    return this.data.bookBorrows.filter((b) => b.userId === userId);
  }

  async createBookBorrow(borrow: any) {
    const newBorrow = { id: generateId(), ...borrow, createdAt: new Date().toISOString() };
    this.data.bookBorrows.push(newBorrow);
    await this.save();
    return newBorrow;
  }

  async updateBookBorrowStatus(id: string, status: string, returnDate?: Date) {
    const borrow = this.data.bookBorrows.find((b) => b.id === id);
    if (!borrow) return undefined;
    borrow.status = status;
    if (returnDate) borrow.actualReturnDate = returnDate.toISOString();
    await this.save();
    return borrow;
  }

  async deleteBookBorrow(id: string) {
    this.data.bookBorrows = this.data.bookBorrows.filter((b) => b.id !== id);
    await this.save();
  }

  async getLibraryCardApplications() {
    return this.data.libraryCardApplications;
  }

  async getLibraryCardApplication(id: string) {
    const cleanId = (id || "").toString().trim();
    console.log(`[DEBUG] getLibraryCardApplication called with: "${id}" (cleaned: "${cleanId}")`);
    const app = this.data.libraryCardApplications.find((a) => a.id.toString().trim() === cleanId);
    console.log(`[DEBUG] getLibraryCardApplication result: ${app ? "found" : "NOT FOUND"}`);
    return app;
  }

  async getLibraryCardApplicationsByUser(userId: string) {
    return this.data.libraryCardApplications.filter((a) => a.userId === userId);
  }

  async createLibraryCardApplication(application: any) {
    const existingApplication = this.data.libraryCardApplications.find(
      (app) => app.email.toLowerCase() === application.email.toLowerCase()
    );
    if (existingApplication) {
      throw new Error("A library card application with this email already exists");
    }

    const fieldCodeMap: Record<string, string> = {
      "Computer Science": "CS",
      "Commerce": "COM",
      "Humanities": "HM",
      "Pre-Engineering": "PE",
      "Pre-Medical": "PM"
    };

    const fieldCode = fieldCodeMap[application.field] || "XX";
    const classNumber = application.class.replace(/[^\d]/g, '') || application.class;
    let cardNumber = `${fieldCode}-${application.rollNo}-${classNumber}`;

    let counter = 1;
    const baseCardNumber = cardNumber;
    while (this.data.libraryCardApplications.some(app => app.cardNumber.toLowerCase() === cardNumber.toLowerCase())) {
      cardNumber = `${baseCardNumber}-${counter}`;
      counter++;
    }

    const studentId = `GCMN-${Math.floor(Math.random() * 1000000).toString().padStart(6, "0")}`;
    const issueDate = new Date().toISOString().split("T")[0];
    const validThrough = new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString().split("T")[0];

    const newApplication = {
      id: generateId(),
      ...application,
      status: "pending",
      cardNumber,
      studentId,
      issueDate,
      validThrough,
      createdAt: new Date().toISOString()
    };
    this.data.libraryCardApplications.push(newApplication);
    await this.save();
    return newApplication;
  }

  async getLibraryCardByCardNumber(cardNumber: string) {
    return this.data.libraryCardApplications.find((a) => a.cardNumber.toLowerCase() === cardNumber.toLowerCase());
  }

  async updateLibraryCardApplicationStatus(id: string, status: string) {
    const cleanId = (id || "").toString().trim();
    const cleanStatus = (status || "").toString().trim().toLowerCase();

    console.log(`[TRACE] updateLibraryCardApplicationStatus started: id="${cleanId}", status="${cleanStatus}"`);

    const index = this.data.libraryCardApplications.findIndex((a) => a.id.toString().trim() === cleanId);

    if (index === -1) {
      console.error(`[TRACE] update FAILED - NO MATCH for ID: "${cleanId}"`);
      // Trace first 3 IDs to check format
      if (this.data.libraryCardApplications.length > 0) {
        console.log(`[TRACE] Sample IDs in storage: ${this.data.libraryCardApplications.slice(0, 3).map(a => `"${a.id}"`).join(", ")}`);
      }
      return undefined;
    }

    const application = { ...this.data.libraryCardApplications[index] };
    const oldStatus = application.status;
    application.status = cleanStatus;
    application.updatedAt = new Date().toISOString();

    // Replace in array
    this.data.libraryCardApplications[index] = application;
    console.log(`[TRACE] In-memory update success: "${oldStatus}" -> "${application.status}"`);

    // If approved, ensure student record exists
    if (cleanStatus === "approved") {
      if (!this.data.students) this.data.students = [];
      const cardToMatch = (application.cardNumber || "").toString().trim().toLowerCase();

      const existingStudent = this.data.students.find((s: any) =>
        (s.cardId || "").toString().trim().toLowerCase() === cardToMatch
      );

      if (!existingStudent) {
        console.log(`[TRACE] Creating student record for card: ${application.cardNumber}`);
        const studentData = {
          id: generateId(),
          userId: application.userId || `card-${application.id}`,
          cardId: application.cardNumber,
          name: `${application.firstName} ${application.lastName}`,
          class: application.class,
          field: application.field,
          rollNo: application.rollNo,
          email: application.email,
          phone: application.phone,
          createdAt: new Date().toISOString()
        };
        this.data.students.push(studentData);
      } else {
        console.log(`[TRACE] Student record exists for card: ${application.cardNumber}`);
      }
    }

    await this.save();
    console.log(`[TRACE] updateLibraryCardApplicationStatus completed successfully`);
    return application;
  }

  async deleteLibraryCardApplication(id: string) {
    this.data.libraryCardApplications = this.data.libraryCardApplications.filter((a) => a.id !== id);
    await this.save();
  }

  async getDonations() {
    return this.data.donations;
  }

  async createDonation(donation: any) {
    const newDonation = { id: generateId(), ...donation, createdAt: new Date().toISOString() };
    this.data.donations.push(newDonation);
    await this.save();
    return newDonation;
  }

  async deleteDonation(id: string) {
    this.data.donations = this.data.donations.filter((d) => d.id !== id);
    await this.save();
  }

  async getStudents() {
    return this.data.students || [];
  }

  async createStudent(student: any) {
    const id = generateId();
    const newStudent = { id, ...student, createdAt: new Date().toISOString() };
    if (!this.data.students) this.data.students = [];
    this.data.students.push(newStudent);
    await this.save();
    return newStudent;
  }

  async getNonStudents() {
    return this.data.users
      .filter((u) => u.type !== "student")
      .map(u => ({
        id: u.id,
        userId: u.id,
        name: u.fullName || u.username || u.email,
        role: u.type === 'admin' ? 'System Admin' : (u.type || 'User'),
        phone: u.phone || "-",
        createdAt: u.createdAt || new Date().toISOString()
      }));
  }

  async getNotes() {
    return this.data.notes;
  }

  async getNotesByClassAndSubject(studentClass: string, subject: string) {
    return this.data.notes.filter((n) => n.class === studentClass && n.subject === subject && n.status === "active");
  }

  async getActiveNotes() {
    return this.data.notes.filter((n) => n.status === "active");
  }

  async createNote(note: any) {
    const newNote = { id: generateId(), ...note, createdAt: new Date().toISOString() };
    this.data.notes.push(newNote);
    await this.save();
    return newNote;
  }

  async updateNote(id: string, note: any) {
    const existing = this.data.notes.find((n) => n.id === id);
    if (!existing) return undefined;
    Object.assign(existing, note, { updatedAt: new Date().toISOString() });
    await this.save();
    return existing;
  }

  async deleteNote(id: string) {
    this.data.notes = this.data.notes.filter((n) => n.id !== id);
    await this.save();
  }

  async toggleNoteStatus(id: string) {
    const note = this.data.notes.find((n) => n.id === id);
    if (!note) return undefined;
    note.status = note.status === "active" ? "inactive" : "active";
    note.updatedAt = new Date().toISOString();
    await this.save();
    return note;
  }

  async getRareBooks() {
    return this.data.rareBooks || [];
  }

  async getRareBook(id: string) {
    return (this.data.rareBooks || []).find((b) => b.id === id);
  }

  async createRareBook(book: any) {
    const newBook = { id: generateId(), ...book, createdAt: new Date().toISOString() };
    if (!this.data.rareBooks) this.data.rareBooks = [];
    this.data.rareBooks.push(newBook);
    await this.save();
    return newBook;
  }

  async deleteRareBook(id: string) {
    this.data.rareBooks = (this.data.rareBooks || []).filter((b) => b.id !== id);
    await this.save();
  }

  async toggleRareBookStatus(id: string) {
    const book = (this.data.rareBooks || []).find((b) => b.id === id);
    if (!book) return undefined;
    book.status = book.status === "active" ? "inactive" : "active";
    book.updatedAt = new Date().toISOString();
    await this.save();
    return book;
  }

  async getBooks() {
    return (this.data.books || []).sort((a: any, b: any) =>
      new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );
  }

  async getBook(id: string) {
    return (this.data.books || []).find((b) => b.id === id);
  }

  async createBook(book: any) {
    const id = generateId();
    const newBook = { id, ...book, createdAt: new Date().toISOString() };
    if (!this.data.books) this.data.books = [];
    this.data.books.push(newBook);
    await this.save();
    return newBook;
  }

  async updateBook(id: string, book: any) {
    const existing = (this.data.books || []).find((b) => b.id === id);
    if (!existing) return undefined;
    Object.assign(existing, book);
    await this.save();
    return existing;
  }

  async deleteBook(id: string) {
    this.data.books = (this.data.books || []).filter((b) => b.id !== id);
    await this.save();
  }

  async getEvents() {
    return this.data.events || [];
  }

  async createEvent(event: any) {
    const id = generateId();
    const newEvent = { id, ...event, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() };
    if (!this.data.events) this.data.events = [];
    this.data.events.push(newEvent);
    await this.save();
    return newEvent;
  }

  async updateEvent(id: string, event: any) {
    const existing = (this.data.events || []).find((e) => e.id === id);
    if (!existing) return undefined;
    Object.assign(existing, event, { updatedAt: new Date().toISOString() });
    await this.save();
    return existing;
  }

  async deleteEvent(id: string) {
    this.data.events = (this.data.events || []).filter((e) => e.id !== id);
    await this.save();
  }

  async getNotifications() {
    return (this.data.notifications || []).sort((a: any, b: any) =>
      new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );
  }

  async createNotification(notification: any) {
    const id = generateId();
    const newNotification = { id, ...notification, createdAt: new Date().toISOString() };
    if (!this.data.notifications) this.data.notifications = [];
    this.data.notifications.push(newNotification);
    await this.save();
    return newNotification;
  }

  async deleteNotification(id: string) {
    this.data.notifications = (this.data.notifications || []).filter((n) => n.id !== id);
    await this.save();
  }
}

export const storage = new JsonStorage();
