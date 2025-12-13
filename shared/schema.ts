import { sql } from "drizzle-orm";
import { pgTable, text, varchar, integer, boolean, timestamp, decimal, jsonb, serial, index } from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";
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
// ownerId: null = system item (visible to all), userId = private item (visible to owner + event participants)
export const items = pgTable("items", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  categoryId: varchar("category_id").notNull().references(() => categories.id),
  ownerId: varchar("owner_id").references(() => users.id), // null = system item, userId = private item
  name: text("name").notNull(),
  description: text("description"),
  isCommon: boolean("is_common").default(true),
});

export const itemsRelations = relations(items, ({ one, many }) => ({
  category: one(categories, {
    fields: [items.categoryId],
    references: [categories.id],
  }),
  owner: one(users, {
    fields: [items.ownerId],
    references: [users.id],
  }),
  contributions: many(contributions),
}));

export const insertItemSchema = createInsertSchema(items).omit({ id: true });
export type InsertItem = z.infer<typeof insertItemSchema>;
export type Item = typeof items.$inferSelect;

// Participants table - linked to users for privacy
export const participants = pgTable("participants", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").references(() => users.id), // Link to auth user (null for guests)
  name: text("name").notNull(),
  email: text("email"), // For invitations
  phone: text("phone"),
  avatar: text("avatar"),
  isGuest: boolean("is_guest").default(false), // True for guest participants
  tripCount: integer("trip_count").default(0),
  createdAt: timestamp("created_at").defaultNow(),
});

export const participantsRelations = relations(participants, ({ one, many }) => ({
  user: one(users, {
    fields: [participants.userId],
    references: [users.id],
  }),
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
  creatorParticipantId: varchar("creator_participant_id").references(() => participants.id), // Event creator/owner
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

// ============================================
// RBAC (Role-Based Access Control) System
// ============================================

// Permission keys for granular access control
export const PERMISSION_KEYS = [
  'invite_participants',
  'remove_participants',
  'edit_roles',
  'assign_item',
  'unassign_item',
  'edit_event',
  'delete_event'
] as const;
export type PermissionKey = typeof PERMISSION_KEYS[number];

// Event Roles table - customizable roles per event
export const eventRoles = pgTable("event_roles", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  eventId: integer("event_id").notNull().references(() => events.id, { onDelete: "cascade" }),
  name: text("name").notNull(), // English name
  nameAr: text("name_ar").notNull(), // Arabic name
  description: text("description"),
  isCreatorRole: boolean("is_creator_role").default(false), // Only one per event, cannot be deleted
  isDefault: boolean("is_default").default(false), // Default role for new participants
  sortOrder: integer("sort_order").default(0),
  createdAt: timestamp("created_at").defaultNow(),
});

export const eventRolesRelations = relations(eventRoles, ({ one, many }) => ({
  event: one(events, {
    fields: [eventRoles.eventId],
    references: [events.id],
  }),
  permissions: many(rolePermissions),
  eventParticipants: many(eventParticipants),
}));

export const insertEventRoleSchema = createInsertSchema(eventRoles).omit({ id: true, createdAt: true });
export type InsertEventRole = z.infer<typeof insertEventRoleSchema>;
export type EventRoleRecord = typeof eventRoles.$inferSelect;

// Role Permissions table - which permissions each role has
export const rolePermissions = pgTable("role_permissions", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  roleId: varchar("role_id").notNull().references(() => eventRoles.id, { onDelete: "cascade" }),
  permissionKey: text("permission_key").notNull(), // One of PERMISSION_KEYS
  allowed: boolean("allowed").default(true),
});

export const rolePermissionsRelations = relations(rolePermissions, ({ one }) => ({
  role: one(eventRoles, {
    fields: [rolePermissions.roleId],
    references: [eventRoles.id],
  }),
}));

export const insertRolePermissionSchema = createInsertSchema(rolePermissions).omit({ id: true });
export type InsertRolePermission = z.infer<typeof insertRolePermissionSchema>;
export type RolePermission = typeof rolePermissions.$inferSelect;

// Per-participant permission overrides (optional granular control)
export const participantPermissionOverrides = pgTable("participant_permission_overrides", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  eventParticipantId: varchar("event_participant_id").notNull().references(() => eventParticipants.id, { onDelete: "cascade" }),
  permissionKey: text("permission_key").notNull(),
  allowed: boolean("allowed").notNull(),
});

export const participantPermissionOverridesRelations = relations(participantPermissionOverrides, ({ one }) => ({
  eventParticipant: one(eventParticipants, {
    fields: [participantPermissionOverrides.eventParticipantId],
    references: [eventParticipants.id],
  }),
}));

export const insertParticipantPermissionOverrideSchema = createInsertSchema(participantPermissionOverrides).omit({ id: true });
export type InsertParticipantPermissionOverride = z.infer<typeof insertParticipantPermissionOverrideSchema>;
export type ParticipantPermissionOverride = typeof participantPermissionOverrides.$inferSelect;

// Event Participants junction table
export const eventParticipants = pgTable("event_participants", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  eventId: integer("event_id").notNull().references(() => events.id, { onDelete: "cascade" }),
  participantId: varchar("participant_id").notNull().references(() => participants.id, { onDelete: "cascade" }),
  roleId: varchar("role_id").references(() => eventRoles.id), // New RBAC role reference
  role: text("role").default("member"), // Legacy: organizer, co_organizer, member, viewer
  status: text("status").default("active"), // pending, active, declined
  confirmedAt: timestamp("confirmed_at"),
  canEdit: boolean("can_edit").default(false), // Legacy: Can edit event details and contributions
  canManageParticipants: boolean("can_manage_participants").default(false), // Legacy: Can invite/remove participants
});

export const eventParticipantsRelations = relations(eventParticipants, ({ one, many }) => ({
  event: one(events, {
    fields: [eventParticipants.eventId],
    references: [events.id],
  }),
  participant: one(participants, {
    fields: [eventParticipants.participantId],
    references: [participants.id],
  }),
  eventRole: one(eventRoles, {
    fields: [eventParticipants.roleId],
    references: [eventRoles.id],
  }),
  permissionOverrides: many(participantPermissionOverrides),
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

// Event Invitations table - for inviting users to events
export const eventInvitations = pgTable("event_invitations", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  eventId: integer("event_id").notNull().references(() => events.id, { onDelete: "cascade" }),
  email: text("email").notNull(),
  inviterParticipantId: varchar("inviter_participant_id").references(() => participants.id),
  invitedParticipantId: varchar("invited_participant_id").references(() => participants.id),
  status: text("status").default("pending"), // pending, accepted, declined, expired
  token: text("token").notNull().unique(),
  expiresAt: timestamp("expires_at"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const eventInvitationsRelations = relations(eventInvitations, ({ one }) => ({
  event: one(events, {
    fields: [eventInvitations.eventId],
    references: [events.id],
  }),
  inviter: one(participants, {
    fields: [eventInvitations.inviterParticipantId],
    references: [participants.id],
  }),
}));

export const insertEventInvitationSchema = createInsertSchema(eventInvitations).omit({ id: true, createdAt: true });
export type InsertEventInvitation = z.infer<typeof insertEventInvitationSchema>;
export type EventInvitation = typeof eventInvitations.$inferSelect;

// Notifications table - user notifications
export const notifications = pgTable("notifications", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  type: text("type").notNull(), // event_invite, manager_assigned, debt_claim, debt_confirmed, debt_rejected
  title: text("title").notNull(),
  message: text("message"),
  payload: jsonb("payload"), // Additional data (eventId, participantId, etc.)
  isRead: boolean("is_read").default(false),
  actionUrl: text("action_url"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const notificationsRelations = relations(notifications, ({ one }) => ({
  user: one(users, {
    fields: [notifications.userId],
    references: [users.id],
  }),
}));

export const insertNotificationSchema = createInsertSchema(notifications).omit({ id: true, createdAt: true });
export type InsertNotification = z.infer<typeof insertNotificationSchema>;
export type Notification = typeof notifications.$inferSelect;

// Settlement Claims table - for debt confirmation workflow
export const settlementClaims = pgTable("settlement_claims", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  settlementRecordId: varchar("settlement_record_id").references(() => settlementRecords.id),
  eventId: integer("event_id").notNull().references(() => events.id),
  debtorParticipantId: varchar("debtor_participant_id").notNull().references(() => participants.id),
  creditorParticipantId: varchar("creditor_participant_id").notNull().references(() => participants.id),
  amount: decimal("amount", { precision: 10, scale: 2 }).notNull(),
  status: text("status").default("pending"), // pending, confirmed, rejected
  submittedByParticipantId: varchar("submitted_by_participant_id").references(() => participants.id),
  respondedAt: timestamp("responded_at"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const settlementClaimsRelations = relations(settlementClaims, ({ one }) => ({
  event: one(events, {
    fields: [settlementClaims.eventId],
    references: [events.id],
  }),
  debtor: one(participants, {
    fields: [settlementClaims.debtorParticipantId],
    references: [participants.id],
  }),
  creditor: one(participants, {
    fields: [settlementClaims.creditorParticipantId],
    references: [participants.id],
  }),
  submittedBy: one(participants, {
    fields: [settlementClaims.submittedByParticipantId],
    references: [participants.id],
  }),
}));

export const insertSettlementClaimSchema = createInsertSchema(settlementClaims).omit({ id: true, createdAt: true });
export type InsertSettlementClaim = z.infer<typeof insertSettlementClaimSchema>;
export type SettlementClaim = typeof settlementClaims.$inferSelect;

// User storage table - supports both Replit Auth and manual auth
export const users = pgTable("users", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  email: varchar("email").unique(),
  passwordHash: varchar("password_hash"), // For manual auth (null for Replit Auth users)
  firstName: varchar("first_name"),
  lastName: varchar("last_name"),
  phone: varchar("phone"),
  profileImageUrl: varchar("profile_image_url"),
  isAdmin: boolean("is_admin").default(false), // Admin flag for system-level access
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const usersRelations = relations(users, ({ many }) => ({
  notifications: many(notifications),
  participants: many(participants),
}));

// Insert schema for user registration
export const insertUserSchema = createInsertSchema(users).omit({ 
  id: true, 
  createdAt: true, 
  updatedAt: true,
  passwordHash: true, // Handle separately for security
});

// Registration schema with password validation
export const registerUserSchema = z.object({
  email: z.string().email("البريد الإلكتروني غير صالح"),
  password: z.string().min(6, "كلمة المرور يجب أن تكون 6 أحرف على الأقل"),
  confirmPassword: z.string(),
  firstName: z.string().min(1, "الاسم الأول مطلوب"),
  lastName: z.string().optional(),
  phone: z.string().optional(),
}).refine((data) => data.password === data.confirmPassword, {
  message: "كلمات المرور غير متطابقة",
  path: ["confirmPassword"],
});

// Login schema
export const loginUserSchema = z.object({
  email: z.string().email("البريد الإلكتروني غير صالح"),
  password: z.string().min(1, "كلمة المرور مطلوبة"),
  rememberMe: z.boolean().optional().default(false),
});

// Profile update schema
export const updateProfileSchema = z.object({
  firstName: z.string().min(1, "الاسم الأول مطلوب").optional(),
  lastName: z.string().optional(),
  phone: z.string().optional(),
  email: z.string().email("البريد الإلكتروني غير صالح").optional(),
});

// Password change schema
export const changePasswordSchema = z.object({
  currentPassword: z.string().min(1, "كلمة المرور الحالية مطلوبة"),
  newPassword: z.string().min(6, "كلمة المرور الجديدة يجب أن تكون 6 أحرف على الأقل"),
  confirmNewPassword: z.string(),
}).refine((data) => data.newPassword === data.confirmNewPassword, {
  message: "كلمات المرور غير متطابقة",
  path: ["confirmNewPassword"],
});

export type InsertUser = z.infer<typeof insertUserSchema>;
export type RegisterUser = z.infer<typeof registerUserSchema>;
export type LoginUser = z.infer<typeof loginUserSchema>;
export type UpdateProfile = z.infer<typeof updateProfileSchema>;
export type ChangePassword = z.infer<typeof changePasswordSchema>;
export type UpsertUser = typeof users.$inferInsert;
export type User = typeof users.$inferSelect;

// Safe user type without password hash for API responses
export type SafeUser = Omit<User, 'passwordHash'>;

// Refresh tokens for "Remember Me" functionality
export const refreshTokens = pgTable("refresh_tokens", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  tokenHash: varchar("token_hash").notNull(),
  deviceName: text("device_name"),
  userAgent: text("user_agent"),
  ipAddress: text("ip_address"),
  issuedAt: timestamp("issued_at").defaultNow(),
  expiresAt: timestamp("expires_at").notNull(),
  lastUsedAt: timestamp("last_used_at"),
  revokedAt: timestamp("revoked_at"),
});

export const refreshTokensRelations = relations(refreshTokens, ({ one }) => ({
  user: one(users, {
    fields: [refreshTokens.userId],
    references: [users.id],
  }),
}));

export const insertRefreshTokenSchema = createInsertSchema(refreshTokens).omit({ id: true, issuedAt: true });
export type InsertRefreshToken = z.infer<typeof insertRefreshTokenSchema>;
export type RefreshToken = typeof refreshTokens.$inferSelect;

// WebAuthn credentials for biometric login
export const webauthnCredentials = pgTable("webauthn_credentials", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  credentialId: text("credential_id").notNull().unique(),
  publicKey: text("public_key").notNull(),
  signCount: integer("sign_count").default(0),
  transports: text("transports"),
  friendlyName: text("friendly_name"),
  lastUsedAt: timestamp("last_used_at"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const webauthnCredentialsRelations = relations(webauthnCredentials, ({ one }) => ({
  user: one(users, {
    fields: [webauthnCredentials.userId],
    references: [users.id],
  }),
}));

export const insertWebauthnCredentialSchema = createInsertSchema(webauthnCredentials).omit({ id: true, createdAt: true });
export type InsertWebauthnCredential = z.infer<typeof insertWebauthnCredentialSchema>;
export type WebauthnCredential = typeof webauthnCredentials.$inferSelect;

// Item with owner info for display
export type ItemWithOwner = Item & {
  owner?: { id: string; firstName: string | null; lastName: string | null } | null;
};

// Extended types for frontend use
export type EventWithDetails = Event & {
  contributions: (Contribution & { item: ItemWithOwner; participant: Participant | null })[];
  eventParticipants: (EventParticipant & { participant: Participant })[];
};

export type CategoryWithItems = Category & {
  items: ItemWithOwner[];
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

// Extended types for invitations and notifications
export type EventInvitationWithDetails = EventInvitation & {
  event: Event;
  inviter?: Participant;
};

export type NotificationWithPayload = Notification & {
  payload: {
    eventId?: number;
    participantId?: string;
    invitationId?: string;
    claimId?: string;
    amount?: number;
  } | null;
};

export type SettlementClaimWithDetails = SettlementClaim & {
  event: Event;
  debtor: Participant;
  creditor: Participant;
  submittedBy?: Participant;
};

// Legacy role permissions type (kept for backward compatibility)
export type EventRole = 'manager' | 'co_manager' | 'member' | 'viewer';

export const EVENT_ROLE_PERMISSIONS = {
  manager: {
    canInvite: true,
    canAssignRoles: true,
    canEditEvent: true,
    canDeleteEvent: true,
    canViewAllDebts: true,
    canAssignOthers: true,
    canAssignSelf: true,
  },
  co_manager: {
    canInvite: true,
    canAssignRoles: false,
    canEditEvent: true,
    canDeleteEvent: false,
    canViewAllDebts: true,
    canAssignOthers: true,
    canAssignSelf: true,
  },
  member: {
    canInvite: false,
    canAssignRoles: false,
    canEditEvent: false,
    canDeleteEvent: false,
    canViewAllDebts: false,
    canAssignOthers: false,
    canAssignSelf: true,
  },
  viewer: {
    canInvite: false,
    canAssignRoles: false,
    canEditEvent: false,
    canDeleteEvent: false,
    canViewAllDebts: false,
    canAssignOthers: false,
    canAssignSelf: false,
  },
} as const;

// ============================================
// New RBAC Default Roles Configuration
// ============================================

// Default roles to create for each new event
export const DEFAULT_EVENT_ROLES: Array<{
  name: string;
  nameAr: string;
  description: string;
  isCreatorRole: boolean;
  isDefault: boolean;
  sortOrder: number;
  permissions: PermissionKey[];
}> = [
  {
    name: 'Owner',
    nameAr: 'المنظم الرئيسي',
    description: 'Event creator with full control',
    isCreatorRole: true,
    isDefault: false,
    sortOrder: 0,
    permissions: ['invite_participants', 'remove_participants', 'edit_roles', 'assign_item', 'unassign_item', 'edit_event', 'delete_event'],
  },
  {
    name: 'Admin',
    nameAr: 'مشرف',
    description: 'Can manage participants and items',
    isCreatorRole: false,
    isDefault: false,
    sortOrder: 1,
    permissions: ['invite_participants', 'remove_participants', 'edit_roles', 'assign_item', 'unassign_item', 'edit_event'],
  },
  {
    name: 'Coordinator',
    nameAr: 'منسق',
    description: 'Can invite and manage item assignments',
    isCreatorRole: false,
    isDefault: false,
    sortOrder: 2,
    permissions: ['invite_participants', 'assign_item', 'unassign_item'],
  },
  {
    name: 'Contributor',
    nameAr: 'مساهم',
    description: 'Can assign items to themselves',
    isCreatorRole: false,
    isDefault: true,
    sortOrder: 3,
    permissions: ['assign_item'],
  },
  {
    name: 'Viewer',
    nameAr: 'مشاهد',
    description: 'Read-only access',
    isCreatorRole: false,
    isDefault: false,
    sortOrder: 4,
    permissions: [],
  },
];

// Extended type for role with permissions
export type EventRoleWithPermissions = EventRoleRecord & {
  permissions: RolePermission[];
};

// Extended type for event participant with role details
export type EventParticipantWithRole = EventParticipant & {
  participant: Participant;
  eventRole?: EventRoleRecord | null;
};