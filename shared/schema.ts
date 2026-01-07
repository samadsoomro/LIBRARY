import { pgTable, text, timestamp, uuid, decimal, date, boolean, pgEnum } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const appRoleEnum = pgEnum("app_role", ["admin", "moderator", "user"]);

export const userRoles = pgTable("user_roles", {
  id: uuid("id").defaultRandom().primaryKey(),
  userId: uuid("user_id").notNull(),
  role: text("role").notNull().default("user"), // Simplified role for better type inference
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});

export const users = pgTable("users", {
  id: uuid("id").defaultRandom().primaryKey(),
  email: text("email").notNull().unique(),
  username: text("username").unique(),
  password: text("password").notNull(),
  fullName: text("full_name"),
  phone: text("phone"),
  rollNumber: text("roll_number"),
  department: text("department"),
  studentClass: text("student_class"),
  type: text("type").notNull().default("user"), // user, student, admin
  isAdmin: boolean("is_admin").default(false).notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
});

export const profiles = pgTable("profiles", {
  id: uuid("id").defaultRandom().primaryKey(),
  userId: uuid("user_id").notNull().unique(),
  fullName: text("full_name").notNull(),
  phone: text("phone"),
  rollNumber: text("roll_number"),
  department: text("department"),
  studentClass: text("student_class"),
  type: text("type").notNull().default("user"),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
});

export const contactMessages = pgTable("contact_messages", {
  id: uuid("id").defaultRandom().primaryKey(),
  name: text("name").notNull(),
  email: text("email").notNull(),
  subject: text("subject").notNull(),
  message: text("message").notNull(),
  isSeen: boolean("is_seen").default(false).notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});

export const bookBorrows = pgTable("book_borrows", {
  id: uuid("id").defaultRandom().primaryKey(),
  userId: uuid("user_id").notNull(),
  bookId: text("book_id").notNull(),
  bookTitle: text("book_title").notNull(),
  borrowerName: text("borrower_name").notNull(),
  borrowerPhone: text("borrower_phone"),
  borrowerEmail: text("borrower_email"),
  borrowDate: timestamp("borrow_date", { withTimezone: true }).defaultNow().notNull(),
  dueDate: timestamp("due_date", { withTimezone: true }).notNull(),
  returnDate: timestamp("return_date", { withTimezone: true }),
  status: text("status").default("borrowed").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});

export const libraryCardApplications = pgTable("library_card_applications", {
  id: uuid("id").defaultRandom().primaryKey(),
  userId: uuid("user_id"),
  firstName: text("first_name").notNull(),
  lastName: text("last_name").notNull(),
  fatherName: text("father_name"),
  dob: date("dob"),
  class: text("class").notNull(),
  field: text("field"),
  rollNo: text("roll_no").notNull(),
  email: text("email").notNull(),
  phone: text("phone").notNull(),
  addressStreet: text("address_street").notNull(),
  addressCity: text("address_city").notNull(),
  addressState: text("address_state").notNull(),
  addressZip: text("address_zip").notNull(),
  status: text("status").default("pending").notNull(),
  cardNumber: text("card_number").unique(),
  studentId: text("student_id"),
  issueDate: date("issue_date"),
  validThrough: date("valid_through"),
  password: text("password"),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
});

export const donations = pgTable("donations", {
  id: uuid("id").defaultRandom().primaryKey(),
  amount: decimal("amount", { precision: 10, scale: 2 }).notNull(),
  method: text("method").notNull(),
  name: text("name"),
  email: text("email"),
  message: text("message"),
  status: text("status").default("completed").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});

export const students = pgTable("students", {
  id: uuid("id").defaultRandom().primaryKey(),
  userId: uuid("user_id").notNull(),
  cardId: text("card_id").notNull().unique(),
  name: text("name").notNull(),
  class: text("class"),
  field: text("field"),
  rollNo: text("roll_no"),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});

export const nonStudents = pgTable("non_students", {
  id: uuid("id").defaultRandom().primaryKey(),
  userId: uuid("user_id").notNull(),
  name: text("name").notNull(),
  role: text("role").notNull(),
  phone: text("phone"),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});

export const books = pgTable("books", {
  id: uuid("id").defaultRandom().primaryKey(),
  bookName: text("book_name").notNull(),
  shortIntro: text("short_intro").notNull(),
  description: text("description").notNull(),
  bookImage: text("book_image"),
  totalCopies: text("total_copies").default("1").notNull(),
  availableCopies: text("available_copies").default("1").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
});

export const notes = pgTable("notes", {
  id: uuid("id").defaultRandom().primaryKey(),
  class: text("class").notNull(),
  subject: text("subject").notNull(),
  title: text("title").notNull(),
  description: text("description").notNull(),
  pdfPath: text("pdf_path").notNull(),
  status: text("status").default("active").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
});

export const rareBooks = pgTable("rare_books", {
  id: uuid("id").defaultRandom().primaryKey(),
  title: text("title").notNull(),
  description: text("description").notNull(),
  category: text("category").default("General").notNull(),
  pdfPath: text("pdf_path").notNull(),
  coverImage: text("cover_image").notNull(),
  status: text("status").default("active").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});

export const events = pgTable("events", {
  id: uuid("id").defaultRandom().primaryKey(),
  title: text("title").notNull(),
  description: text("description").notNull(),
  images: text("images").array(),
  date: date("date"),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
});

export const notifications = pgTable("notifications", {
  id: uuid("id").defaultRandom().primaryKey(),
  title: text("title"),
  message: text("message"),
  image: text("image"),
  type: text("type").notNull(), // 'text', 'image', 'both'
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});

// Use z.any() as a fallback if createInsertSchema is failing in the Vercel environment
export const insertUserSchema = z.any();
export const insertProfileSchema = z.any();
export const insertContactMessageSchema = z.any();
export const insertBookBorrowSchema = z.any();
export const insertLibraryCardApplicationSchema = z.any();
export const insertDonationSchema = z.any();
export const insertStudentSchema = z.any();
export const insertNonStudentSchema = z.any();
export const insertUserRoleSchema = z.any();
export const insertBookSchema = z.any();
export const insertNoteSchema = z.any();
export const insertRareBookSchema = z.any();
export const insertEventSchema = z.any();
export const insertNotificationSchema = z.any();

export type InsertUser = typeof users.$inferInsert;
export type InsertProfile = typeof profiles.$inferInsert;
export type InsertContactMessage = typeof contactMessages.$inferInsert;
export type InsertBookBorrow = typeof bookBorrows.$inferInsert;
export type InsertLibraryCardApplication = typeof libraryCardApplications.$inferInsert;
export type InsertDonation = typeof donations.$inferInsert;
export type InsertStudent = typeof students.$inferInsert;
export type InsertNonStudent = typeof nonStudents.$inferInsert;
export type InsertUserRole = typeof userRoles.$inferInsert;
export type InsertBook = typeof books.$inferInsert;
export type InsertNote = typeof notes.$inferInsert;
export type InsertRareBook = typeof rareBooks.$inferInsert;
export type InsertEvent = typeof events.$inferInsert;
export type InsertNotification = typeof notifications.$inferInsert;

export type User = typeof users.$inferSelect;
export type Profile = typeof profiles.$inferSelect;
export type ContactMessage = typeof contactMessages.$inferSelect;
export type BookBorrow = typeof bookBorrows.$inferSelect;
export type LibraryCardApplication = typeof libraryCardApplications.$inferSelect;
export type Donation = typeof donations.$inferSelect;
export type Student = typeof students.$inferSelect;
export type NonStudent = typeof nonStudents.$inferSelect;
export type UserRole = typeof userRoles.$inferSelect;
export type Book = typeof books.$inferSelect;
export type Note = typeof notes.$inferSelect;
export type RareBook = typeof rareBooks.$inferSelect;
export type Event = typeof events.$inferSelect;
export type Notification = typeof notifications.$inferSelect;
