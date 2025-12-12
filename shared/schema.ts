import { sql } from "drizzle-orm";
import { pgTable, text, varchar, integer, boolean, timestamp, decimal, jsonb, serial } from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Categories table - 8 Gulf-specific categories
export const categories = pgTable("categories", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: text("name").notNull(),
  nameAr: text("name_ar").notNull(),
  icon: text("icon").notNull(),
  color: text("color").notNull(),
  sortOrder: integer("sort_order").default(0),
});

export const categoriesRelations = relations(categories, ({ many }) => ({
  items: many(items),
}));

export const insertCategorySchema = createInsertSchema(categories).omit({ id: true });
export type InsertCategory = z.infer<typeof insertCategorySchema>;
export type Category = typeof categories.$inferSelect;

// Items table - global shared items database
export const items = pgTable("items", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  categoryId: varchar("category_id").notNull().references(() => categories.id),
  name: text("name").notNull(),
  description: text("description"),
  isCommon: boolean("is_common").default(true),
});

export const itemsRelations = relations(items, ({ one, many }) => ({
  category: one(categories, {
    fields: [items.categoryId],
    references: [categories.id],
  }),
  contributions: many(contributions),
}));

export const insertItemSchema = createInsertSchema(items).omit({ id: true });
export type InsertItem = z.infer<typeof insertItemSchema>;
export type Item = typeof items.$inferSelect;

// Participants table
export const participants = pgTable("participants", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: text("name").notNull(),
  phone: text("phone"),
  avatar: text("avatar"),
  tripCount: integer("trip_count").default(0),
});

export const participantsRelations = relations(participants, ({ many }) => ({
  contributions: many(contributions),
  eventParticipants: many(eventParticipants),
}));

export const insertParticipantSchema = createInsertSchema(participants).omit({ id: true });
export type InsertParticipant = z.infer<typeof insertParticipantSchema>;
export type Participant = typeof participants.$inferSelect;

// Events table - kashta outings
export const events = pgTable("events", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  description: text("description"),
  location: text("location"),
  latitude: decimal("latitude", { precision: 10, scale: 7 }),
  longitude: decimal("longitude", { precision: 10, scale: 7 }),
  date: timestamp("date").notNull(),
  endDate: timestamp("end_date"),
  status: text("status").default("upcoming"), // upcoming, ongoing, completed, cancelled
  imageUrl: text("image_url"),
  weather: text("weather"),
  temperature: integer("temperature"),
  totalBudget: decimal("total_budget", { precision: 10, scale: 2 }).default("0"),
  shareToken: text("share_token").unique(),
  isShareEnabled: boolean("is_share_enabled").default(false),
  createdAt: timestamp("created_at").defaultNow(),
});

export const eventsRelations = relations(events, ({ many }) => ({
  contributions: many(contributions),
  eventParticipants: many(eventParticipants),
  activityLogs: many(activityLogs),
}));

export const insertEventSchema = createInsertSchema(events).omit({ id: true, createdAt: true }).extend({
  latitude: z.union([z.string(), z.number()]).transform(val => val?.toString()).nullable().optional(),
  longitude: z.union([z.string(), z.number()]).transform(val => val?.toString()).nullable().optional(),
});
export type InsertEvent = z.infer<typeof insertEventSchema>;
export type Event = typeof events.$inferSelect;

// Event Participants junction table
export const eventParticipants = pgTable("event_participants", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  eventId: integer("event_id").notNull().references(() => events.id, { onDelete: "cascade" }),
  participantId: varchar("participant_id").notNull().references(() => participants.id, { onDelete: "cascade" }),
  role: text("role").default("member"), // organizer, member
  confirmedAt: timestamp("confirmed_at"),
});

export const eventParticipantsRelations = relations(eventParticipants, ({ one }) => ({
  event: one(events, {
    fields: [eventParticipants.eventId],
    references: [events.id],
  }),
  participant: one(participants, {
    fields: [eventParticipants.participantId],
    references: [participants.id],
  }),
}));

export const insertEventParticipantSchema = createInsertSchema(eventParticipants).omit({ id: true });
export type InsertEventParticipant = z.infer<typeof insertEventParticipantSchema>;
export type EventParticipant = typeof eventParticipants.$inferSelect;

// Contributions table - who brings what
export const contributions = pgTable("contributions", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  eventId: integer("event_id").notNull().references(() => events.id, { onDelete: "cascade" }),
  itemId: varchar("item_id").notNull().references(() => items.id),
  participantId: varchar("participant_id").references(() => participants.id),
  quantity: integer("quantity").default(1),
  cost: decimal("cost", { precision: 10, scale: 2 }).default("0"),
  status: text("status").default("pending"), // pending, confirmed, delivered
  notes: text("notes"),
  receiptUrl: text("receipt_url"), // URL to receipt/invoice image
  createdAt: timestamp("created_at").defaultNow(),
});

export const contributionsRelations = relations(contributions, ({ one }) => ({
  event: one(events, {
    fields: [contributions.eventId],
    references: [events.id],
  }),
  item: one(items, {
    fields: [contributions.itemId],
    references: [items.id],
  }),
  participant: one(participants, {
    fields: [contributions.participantId],
    references: [participants.id],
  }),
}));

export const insertContributionSchema = createInsertSchema(contributions).omit({ id: true, createdAt: true });
export type InsertContribution = z.infer<typeof insertContributionSchema>;
export type Contribution = typeof contributions.$inferSelect;

// Activity Logs table
export const activityLogs = pgTable("activity_logs", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  eventId: integer("event_id").references(() => events.id, { onDelete: "cascade" }),
  action: text("action").notNull(),
  details: text("details"),
  metadata: jsonb("metadata"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const activityLogsRelations = relations(activityLogs, ({ one }) => ({
  event: one(events, {
    fields: [activityLogs.eventId],
    references: [events.id],
  }),
}));

export const insertActivityLogSchema = createInsertSchema(activityLogs).omit({ id: true, createdAt: true });
export type InsertActivityLog = z.infer<typeof insertActivityLogSchema>;
export type ActivityLog = typeof activityLogs.$inferSelect;

// Settlement Records table - tracks who owes whom after expense equalization
export const settlementRecords = pgTable("settlement_records", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  eventId: integer("event_id").notNull().references(() => events.id, { onDelete: "cascade" }),
  debtorId: varchar("debtor_id").notNull().references(() => participants.id, { onDelete: "cascade" }),
  creditorId: varchar("creditor_id").notNull().references(() => participants.id, { onDelete: "cascade" }),
  amount: decimal("amount", { precision: 10, scale: 2 }).notNull(),
  isSettled: boolean("is_settled").default(false),
  settledAt: timestamp("settled_at"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const settlementRecordsRelations = relations(settlementRecords, ({ one }) => ({
  event: one(events, {
    fields: [settlementRecords.eventId],
    references: [events.id],
  }),
  debtor: one(participants, {
    fields: [settlementRecords.debtorId],
    references: [participants.id],
  }),
  creditor: one(participants, {
    fields: [settlementRecords.creditorId],
    references: [participants.id],
  }),
}));

export const insertSettlementRecordSchema = createInsertSchema(settlementRecords).omit({ id: true, createdAt: true, updatedAt: true });
export type InsertSettlementRecord = z.infer<typeof insertSettlementRecordSchema>;
export type SettlementRecord = typeof settlementRecords.$inferSelect;

// Settlement Activity Log - immutable audit trail for all payment activities
// This table never deletes records even if events/participants are deleted
export const settlementActivityLog = pgTable("settlement_activity_log", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  eventId: integer("event_id"), // Reference only, no FK constraint to preserve history
  eventTitle: text("event_title").notNull(), // Snapshot of event title at time of action
  debtorId: varchar("debtor_id"), // Reference only, no FK constraint
  debtorName: text("debtor_name").notNull(), // Snapshot of debtor name
  creditorId: varchar("creditor_id"), // Reference only, no FK constraint
  creditorName: text("creditor_name").notNull(), // Snapshot of creditor name
  amount: decimal("amount", { precision: 10, scale: 2 }).notNull(),
  action: text("action").notNull(), // 'payment' or 'cancellation'
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const insertSettlementActivityLogSchema = createInsertSchema(settlementActivityLog).omit({ id: true, createdAt: true });
export type InsertSettlementActivityLog = z.infer<typeof insertSettlementActivityLogSchema>;
export type SettlementActivityLog = typeof settlementActivityLog.$inferSelect;

// Users table (keep existing)
export const users = pgTable("users", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
});

export const insertUserSchema = createInsertSchema(users).pick({
  username: true,
  password: true,
});

export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;

// Extended types for frontend use
export type EventWithDetails = Event & {
  contributions: (Contribution & { item: Item; participant: Participant | null })[];
  eventParticipants: (EventParticipant & { participant: Participant })[];
};

export type CategoryWithItems = Category & {
  items: Item[];
};

export type ParticipantWithStats = Participant & {
  totalContributions: number;
  totalSpent: number;
};

// Settlement types for expense equalization
export type SettlementRecordWithDetails = SettlementRecord & {
  debtor: Participant;
  creditor: Participant;
  event?: Event;
};

export type ParticipantBalance = {
  participant: Participant;
  totalPaid: number;
  fairShare: number;
  balance: number; // positive = creditor (overpaid), negative = debtor (underpaid)
  role: 'creditor' | 'debtor' | 'settled';
};

export type EventSettlement = {
  eventId: number;
  eventTitle: string;
  eventDate: Date;
  totalSpent: number; // Total of ALL contribution costs (assigned + unassigned)
  assignedCosts: number; // Total of assigned contribution costs only
  unassignedCosts: number; // Total of unassigned contribution costs
  participantCount: number;
  fairShare: number; // Based on assigned costs only
  balances: ParticipantBalance[];
  transactions: SettlementRecordWithDetails[];
};

// Debt portfolio types for cross-event debt aggregation
export type CounterpartyDebt = {
  counterparty: Participant;
  totalOwed: number; // Amount this participant owes to counterparty (positive) or is owed by (negative)
  events: { eventId: number; eventTitle: string; amount: number }[];
};

export type ParticipantDebtSummary = {
  participant: Participant;
  totalPaid: number; // Total paid across all events
  totalOwed: number; // Total amount owed to others (debts)
  totalOwedToYou: number; // Total amount others owe to this participant (credits)
  netPosition: number; // Positive = net creditor, Negative = net debtor
  role: 'creditor' | 'debtor' | 'settled';
  eventCount: number; // Number of events participated in
};

export type ParticipantDebtPortfolio = {
  participant: Participant;
  totalPaid: number; // Total paid across all events
  totalOwed: number; // Total amount owed to others
  totalOwedToYou: number; // Total amount others owe to this participant
  netPosition: number;
  role: 'creditor' | 'debtor' | 'settled';
  counterpartyDebts: CounterpartyDebt[]; // Breakdown by person
  eventBreakdown: {
    event: Event;
    paid: number;
    fairShare: number;
    balance: number;
    role: 'creditor' | 'debtor' | 'settled';
  }[];
};