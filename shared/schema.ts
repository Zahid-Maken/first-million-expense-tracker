import {
  pgTable,
  text,
  varchar,
  timestamp,
  jsonb,
  index,
  serial,
  decimal,
  boolean,
  date,
} from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Session storage table.
// (IMPORTANT) This table is mandatory for Replit Auth, don't drop it.
export const sessions = pgTable(
  "sessions",
  {
    sid: varchar("sid").primaryKey(),
    sess: jsonb("sess").notNull(),
    expire: timestamp("expire").notNull(),
  },
  (table) => [index("IDX_session_expire").on(table.expire)],
);

// User storage table.
// (IMPORTANT) This table is mandatory for Replit Auth, don't drop it.
export const users = pgTable("users", {
  id: varchar("id").primaryKey().notNull(),
  email: varchar("email").unique(),
  firstName: varchar("first_name"),
  lastName: varchar("last_name"),
  profileImageUrl: varchar("profile_image_url"),
  isProUser: boolean("is_pro_user").default(false),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const categories = pgTable("categories", {
  id: serial("id").primaryKey(),
  userEmail: varchar("user_email").notNull(),
  type: varchar("type", { enum: ["income", "expense"] }).notNull(),
  name: varchar("name").notNull(),
  icon: varchar("icon").notNull(),
  color: varchar("color").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
});

export const transactions = pgTable("transactions", {
  id: serial("id").primaryKey(),
  userEmail: varchar("user_email").notNull(),
  categoryId: serial("category_id").references(() => categories.id),
  type: varchar("type", { enum: ["income", "expense"] }).notNull(),
  amount: decimal("amount", { precision: 10, scale: 2 }).notNull(),
  description: text("description"),
  date: date("date").notNull(),
  receivedIn: varchar("received_in", { enum: ["cash", "card", "bank", "assets", "other"] }),
  paidThrough: varchar("paid_through", { enum: ["cash", "card", "bank", "assets", "other"] }),
  createdAt: timestamp("created_at").defaultNow(),
});

export const investments = pgTable("investments", {
  id: serial("id").primaryKey(),
  userEmail: varchar("user_email").notNull(),
  name: varchar("name").notNull(),
  investment_type: varchar("investment_type", { enum: ["business"] }).default("business").notNull(),
  initial_amount: decimal("initial_amount", { precision: 10, scale: 2 }).notNull(),
  current_value: decimal("current_value", { precision: 10, scale: 2 }).notNull(),
  profit_strategy: varchar("profit_strategy", { enum: ["manual", "automatic"] }).notNull(),
  // Fields for automatic profit strategy
  profit_type: varchar("profit_type", { enum: ["fixed", "percentage"] }),
  profit_value: decimal("profit_value", { precision: 10, scale: 2 }),
  profit_frequency: varchar("profit_frequency", { enum: ["weekly", "monthly", "yearly"] }),
  paid_from_asset_id: varchar("paid_from_asset_id"),
  notes: text("notes"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const businessInvestments = pgTable("business_investments", {
  id: serial("id").primaryKey(),
  userEmail: varchar("user_email").notNull(),
  businessName: varchar("business_name").notNull(),
  investmentAmount: decimal("investment_amount", { precision: 10, scale: 2 }).notNull(),
  currentValue: decimal("current_value", { precision: 10, scale: 2 }).notNull(),
  profitLoss: decimal("profit_loss", { precision: 10, scale: 2 }).default("0"),
  description: text("description"),
  businessType: varchar("business_type"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const goals = pgTable("goals", {
  id: serial("id").primaryKey(),
  userEmail: varchar("user_email").notNull(),
  name: varchar("name").notNull(),
  targetAmount: decimal("target_amount", { precision: 10, scale: 2 }).notNull(),
  categoryId: serial("category_id").references(() => categories.id),
  deadline: date("deadline"),
  completed: boolean("completed").default(false),
  createdAt: timestamp("created_at").defaultNow(),
});

// Schema types
export type UpsertUser = typeof users.$inferInsert;
export type User = typeof users.$inferSelect;

export type InsertCategory = typeof categories.$inferInsert;
export type Category = typeof categories.$inferSelect;

export type InsertTransaction = typeof transactions.$inferInsert;
export type Transaction = typeof transactions.$inferSelect;

export type InsertInvestment = typeof investments.$inferInsert;
export type Investment = typeof investments.$inferSelect;

export type InsertGoal = typeof goals.$inferInsert;
export type Goal = typeof goals.$inferSelect;

// Insert schemas
export const insertCategorySchema = createInsertSchema(categories).omit({
  id: true,
  createdAt: true,
});

export const insertTransactionSchema = createInsertSchema(transactions).omit({
  id: true,
  createdAt: true,
});

export const insertInvestmentSchema = createInsertSchema(investments).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertGoalSchema = createInsertSchema(goals).omit({
  id: true,
  createdAt: true,
  alertTriggered: true,
});
