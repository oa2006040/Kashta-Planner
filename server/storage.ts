import { 
  categories, 
  items, 
  participants, 
  events, 
  eventParticipants, 
  contributions, 
  activityLogs,
  users,
  settlementRecords,
  settlementActivityLog,
  eventInvitations,
  notifications,
  settlementClaims,
  type Category,
  type InsertCategory,
  type Item,
  type InsertItem,
  type Participant,
  type InsertParticipant,
  type Event,
  type InsertEvent,
  type EventParticipant,
  type InsertEventParticipant,
  type Contribution,
  type InsertContribution,
  type ActivityLog,
  type InsertActivityLog,
  type User,
  type UpsertUser,
  type CategoryWithItems,
  type EventWithDetails,
  type SettlementRecord,
  type EventSettlement,
  type ParticipantBalance,
  type SettlementRecordWithDetails,
  type ParticipantDebtSummary,
  type ParticipantDebtPortfolio,
  type SettlementActivityLog,
  type EventInvitation,
  type InsertEventInvitation,
  type EventInvitationWithDetails,
  type Notification,
  type InsertNotification,
  type SettlementClaim,
  type InsertSettlementClaim,
  type SettlementClaimWithDetails,
  type EventRole,
} from "@shared/schema";
import { db } from "./db";
import { eq, desc, and, sql, inArray, or } from "drizzle-orm";

export interface IStorage {
  // Categories
  getCategories(): Promise<Category[]>;
  getCategoriesWithItems(): Promise<CategoryWithItems[]>;
  getCategory(id: string): Promise<Category | undefined>;
  createCategory(category: InsertCategory): Promise<Category>;
  updateCategory(id: string, category: Partial<InsertCategory>): Promise<Category | undefined>;
  deleteCategory(id: string): Promise<boolean>;
  
  // Items
  getItems(): Promise<Item[]>;
  getItemsForUser(userId: string): Promise<Item[]>; // System items + user's own items
  getItemsByCategory(categoryId: string): Promise<Item[]>;
  getItem(id: string): Promise<Item | undefined>;
  createItem(item: InsertItem): Promise<Item>;
  updateItem(id: string, item: Partial<InsertItem>): Promise<Item | undefined>;
  deleteItem(id: string): Promise<boolean>;
  
  // Participants
  getParticipants(): Promise<Participant[]>;
  getParticipant(id: string): Promise<Participant | undefined>;
  createParticipant(participant: InsertParticipant): Promise<Participant>;
  updateParticipant(id: string, participant: Partial<InsertParticipant>): Promise<Participant | undefined>;
  deleteParticipant(id: string): Promise<boolean>;
  
  // Events
  getEvents(): Promise<Event[]>;
  getEvent(id: number): Promise<Event | undefined>;
  getEventWithDetails(id: number): Promise<EventWithDetails | undefined>;
  createEvent(event: InsertEvent): Promise<Event>;
  updateEvent(id: number, event: Partial<InsertEvent>): Promise<Event | undefined>;
  deleteEvent(id: number): Promise<boolean>;
  getEventByShareToken(token: string): Promise<Event | undefined>;
  getEventWithDetailsByShareToken(token: string): Promise<EventWithDetails | undefined>;
  enableEventSharing(id: number): Promise<{ token: string } | undefined>;
  disableEventSharing(id: number): Promise<boolean>;
  
  // Event Participants
  getEventParticipants(eventId: number): Promise<EventParticipant[]>;
  addParticipantToEvent(data: InsertEventParticipant): Promise<EventParticipant>;
  removeParticipantFromEvent(eventId: number, participantId: string): Promise<boolean>;
  removeParticipantFromEventWithCascade(eventId: number, participantId: string): Promise<boolean>;
  addParticipantWithContributions(eventId: number, participantId: string, itemIds: string[], costs?: Record<string, string>): Promise<{ eventParticipant: EventParticipant; contributions: Contribution[] }>;
  
  // Contributions
  getContributions(eventId: number): Promise<Contribution[]>;
  getContribution(id: string): Promise<Contribution | undefined>;
  createContribution(contribution: InsertContribution): Promise<Contribution>;
  updateContribution(id: string, contribution: Partial<InsertContribution>): Promise<Contribution | undefined>;
  deleteContribution(id: string): Promise<boolean>;
  unassignContribution(id: string): Promise<{ unassigned: boolean; participantPruned: boolean }>;
  deleteContributionAndPruneParticipant(id: string): Promise<{ deleted: boolean; participantPruned: boolean }>;
  
  // Activity Logs
  getActivityLogs(limit?: number): Promise<ActivityLog[]>;
  createActivityLog(log: InsertActivityLog): Promise<ActivityLog>;
  
  // Stats
  getStats(): Promise<{
    totalEvents: number;
    upcomingEvents: number;
    totalParticipants: number;
    totalItems: number;
    totalBudget: number;
  }>;
  
  // Users (for Replit Auth and manual auth)
  getUser(id: string): Promise<User | undefined>;
  upsertUser(user: UpsertUser): Promise<User>;
  ensureParticipantForUser(userId: string): Promise<Participant>;
  
  // Settlements
  getEventSettlement(eventId: number): Promise<EventSettlement | null>;
  getAllSettlements(): Promise<EventSettlement[]>;
  getAllSettlementRecords(): Promise<SettlementRecord[]>;
  toggleSettlementStatus(eventId: number, debtorId: string, creditorId: string): Promise<SettlementRecord | undefined>;
  syncEventSettlement(eventId: number): Promise<void>;
  
  // Event status sync
  syncEventStatuses(): Promise<void>;
  
  // Event protection (cancellation/deletion)
  canCancelEvent(eventId: number): Promise<{ canCancel: boolean; reason?: string }>;
  canDeleteEvent(eventId: number): Promise<{ canDelete: boolean; reason?: string }>;
  
  // Participant protection (deletion)
  canDeleteParticipant(participantId: string): Promise<{ canDelete: boolean; reason?: string }>;
  
  // Privacy-Aware Event Queries
  getEventsForUser(userId: string): Promise<Event[]>;
  getParticipantByUserId(userId: string): Promise<Participant | undefined>;
  getUserEventRole(eventId: number, userId: string): Promise<EventRole | null>;
  canUserAccessEvent(eventId: number, userId: string): Promise<boolean>;
  
  // Invitations
  createEventInvitation(data: InsertEventInvitation): Promise<EventInvitation>;
  getInvitationsForUser(email: string): Promise<EventInvitationWithDetails[]>;
  getEventInvitations(eventId: number): Promise<EventInvitation[]>;
  respondToInvitation(invitationId: string, accept: boolean, participantId?: string): Promise<EventInvitation | undefined>;
  getInvitationByToken(token: string): Promise<EventInvitationWithDetails | undefined>;
  
  // Notifications
  createNotification(data: InsertNotification): Promise<Notification>;
  getNotificationsForUser(userId: string): Promise<Notification[]>;
  markNotificationRead(notificationId: string): Promise<boolean>;
  getUnreadNotificationCount(userId: string): Promise<number>;
  
  // Settlement Claims
  createSettlementClaim(data: InsertSettlementClaim): Promise<SettlementClaim>;
  respondToSettlementClaim(claimId: string, status: 'confirmed' | 'rejected'): Promise<SettlementClaim | undefined>;
  getClaimsForParticipant(participantId: string): Promise<SettlementClaimWithDetails[]>;
  
  // Settlement Activity Logs
  getSettlementActivityLogs(limit?: number): Promise<SettlementActivityLog[]>;
  getSettlementActivityLogsForUser(userId: string, limit?: number): Promise<SettlementActivityLog[]>;
  
  // Debt Portfolio
  getDebtSummaries(): Promise<ParticipantDebtSummary[]>;
  getDebtSummaryForParticipant(participantId: string): Promise<ParticipantDebtSummary | null>;
  getDebtPortfolio(participantId: string): Promise<ParticipantDebtPortfolio | null>;
}

export class DatabaseStorage implements IStorage {
  // Categories
  async getCategories(): Promise<Category[]> {
    return db.select().from(categories).orderBy(categories.sortOrder);
  }

  async getCategoriesWithItems(): Promise<CategoryWithItems[]> {
    const allCategories = await db.select().from(categories).orderBy(categories.sortOrder);
    const allItems = await db.select().from(items);
    
    // Get all unique owner IDs
    const ownerIds = Array.from(new Set(allItems.filter(i => i.ownerId).map(i => i.ownerId!)));
    const ownersList = ownerIds.length > 0
      ? await db.select({ id: users.id, firstName: users.firstName, lastName: users.lastName })
          .from(users).where(inArray(users.id, ownerIds))
      : [];
    
    // Map items with owner info
    const itemsWithOwner = allItems.map(item => ({
      ...item,
      owner: item.ownerId ? ownersList.find(u => u.id === item.ownerId) || null : null,
    }));
    
    return allCategories.map(cat => ({
      ...cat,
      items: itemsWithOwner.filter(item => item.categoryId === cat.id),
    }));
  }

  async getCategory(id: string): Promise<Category | undefined> {
    const [category] = await db.select().from(categories).where(eq(categories.id, id));
    return category;
  }

  async createCategory(category: InsertCategory): Promise<Category> {
    const [created] = await db.insert(categories).values(category).returning();
    return created;
  }

  async updateCategory(id: string, category: Partial<InsertCategory>): Promise<Category | undefined> {
    const [updated] = await db.update(categories).set(category).where(eq(categories.id, id)).returning();
    return updated;
  }

  async deleteCategory(id: string): Promise<boolean> {
    // First delete all items in this category
    await db.delete(items).where(eq(items.categoryId, id));
    // Then delete the category
    const result = await db.delete(categories).where(eq(categories.id, id));
    return (result.rowCount ?? 0) > 0;
  }

  // Items
  async getItems(): Promise<Item[]> {
    return db.select().from(items);
  }

  async getItemsForUser(userId: string): Promise<Item[]> {
    // Return system items (ownerId = null) + user's own items
    return db.select().from(items).where(
      or(
        sql`${items.ownerId} IS NULL`,
        eq(items.ownerId, userId)
      )
    );
  }

  async getItemsByCategory(categoryId: string): Promise<Item[]> {
    return db.select().from(items).where(eq(items.categoryId, categoryId));
  }

  async getItem(id: string): Promise<Item | undefined> {
    const [item] = await db.select().from(items).where(eq(items.id, id));
    return item;
  }

  async createItem(item: InsertItem): Promise<Item> {
    const [created] = await db.insert(items).values(item).returning();
    return created;
  }

  async updateItem(id: string, item: Partial<InsertItem>): Promise<Item | undefined> {
    const [updated] = await db.update(items).set(item).where(eq(items.id, id)).returning();
    return updated;
  }

  async deleteItem(id: string): Promise<boolean> {
    const result = await db.delete(items).where(eq(items.id, id)).returning();
    return result.length > 0;
  }

  // Participants
  async getParticipants(): Promise<Participant[]> {
    return db.select().from(participants).orderBy(desc(participants.tripCount));
  }

  async getParticipant(id: string): Promise<Participant | undefined> {
    const [participant] = await db.select().from(participants).where(eq(participants.id, id));
    return participant;
  }

  async createParticipant(participant: InsertParticipant): Promise<Participant> {
    const [created] = await db.insert(participants).values({
      ...participant,
      tripCount: 0,
    }).returning();
    return created;
  }

  async updateParticipant(id: string, data: Partial<InsertParticipant>): Promise<Participant | undefined> {
    const [updated] = await db.update(participants)
      .set(data)
      .where(eq(participants.id, id))
      .returning();
    return updated;
  }

  async deleteParticipant(id: string): Promise<boolean> {
    const result = await db.delete(participants).where(eq(participants.id, id));
    return true;
  }

  // Events
  async getEvents(): Promise<Event[]> {
    return db.select().from(events).orderBy(desc(events.date));
  }

  async getEvent(id: number): Promise<Event | undefined> {
    const [event] = await db.select().from(events).where(eq(events.id, id));
    return event;
  }

  async getEventWithDetails(id: number): Promise<EventWithDetails | undefined> {
    const [event] = await db.select().from(events).where(eq(events.id, id));
    if (!event) return undefined;

    // Get event participants with participant details
    const eventParticipantsList = await db
      .select()
      .from(eventParticipants)
      .where(eq(eventParticipants.eventId, id));
    
    const participantIds = eventParticipantsList.map(ep => ep.participantId);
    const participantsList = participantIds.length > 0 
      ? await db.select().from(participants).where(inArray(participants.id, participantIds))
      : [];

    const eventParticipantsWithDetails = eventParticipantsList.map(ep => ({
      ...ep,
      participant: participantsList.find(p => p.id === ep.participantId)!,
    }));

    // Get contributions with item and participant details
    const contributionsList = await db
      .select()
      .from(contributions)
      .where(eq(contributions.eventId, id));
    
    const itemIds = Array.from(new Set(contributionsList.map(c => c.itemId)));
    const itemsList = itemIds.length > 0 
      ? await db.select().from(items).where(inArray(items.id, itemIds))
      : [];

    // Get item owners (users) for private items
    const ownerIds = Array.from(new Set(itemsList.filter(i => i.ownerId).map(i => i.ownerId!)));
    const ownersList = ownerIds.length > 0
      ? await db.select({ id: users.id, firstName: users.firstName, lastName: users.lastName })
          .from(users).where(inArray(users.id, ownerIds))
      : [];

    // Map items with owner info
    const itemsWithOwner = itemsList.map(item => ({
      ...item,
      owner: item.ownerId ? ownersList.find(u => u.id === item.ownerId) || null : null,
    }));

    const contributionsWithDetails = contributionsList.map(c => ({
      ...c,
      item: itemsWithOwner.find(i => i.id === c.itemId)!,
      participant: c.participantId 
        ? participantsList.find(p => p.id === c.participantId) || null
        : null,
    }));

    return {
      ...event,
      eventParticipants: eventParticipantsWithDetails,
      contributions: contributionsWithDetails,
    };
  }

  async createEvent(event: InsertEvent): Promise<Event> {
    const [created] = await db.insert(events).values(event).returning();
    return created;
  }

  async updateEvent(id: number, data: Partial<InsertEvent>): Promise<Event | undefined> {
    const [updated] = await db.update(events)
      .set(data)
      .where(eq(events.id, id))
      .returning();
    return updated;
  }

  async deleteEvent(id: number): Promise<boolean> {
    await db.delete(events).where(eq(events.id, id));
    return true;
  }

  async getEventByShareToken(token: string): Promise<Event | undefined> {
    const [event] = await db.select().from(events)
      .where(eq(events.shareToken, token));
    return event;
  }

  async getEventWithDetailsByShareToken(token: string): Promise<EventWithDetails | undefined> {
    const event = await this.getEventByShareToken(token);
    if (!event || !event.isShareEnabled) return undefined;
    return this.getEventWithDetails(event.id);
  }

  async enableEventSharing(id: number): Promise<{ token: string } | undefined> {
    const event = await this.getEvent(id);
    if (!event) return undefined;
    
    const token = crypto.randomUUID();
    await db.update(events)
      .set({ shareToken: token, isShareEnabled: true })
      .where(eq(events.id, id));
    
    return { token };
  }

  async disableEventSharing(id: number): Promise<boolean> {
    await db.update(events)
      .set({ shareToken: null, isShareEnabled: false })
      .where(eq(events.id, id));
    return true;
  }

  // Event Participants
  async getEventParticipants(eventId: number): Promise<EventParticipant[]> {
    return db.select().from(eventParticipants).where(eq(eventParticipants.eventId, eventId));
  }

  async addParticipantToEvent(data: InsertEventParticipant): Promise<EventParticipant> {
    const [created] = await db.insert(eventParticipants).values(data).returning();
    // Increment participant trip count
    await db.update(participants)
      .set({ tripCount: sql`${participants.tripCount} + 1` })
      .where(eq(participants.id, data.participantId));
    return created;
  }

  async removeParticipantFromEvent(eventId: number, participantId: string): Promise<boolean> {
    await db.delete(eventParticipants)
      .where(and(
        eq(eventParticipants.eventId, eventId),
        eq(eventParticipants.participantId, participantId)
      ));
    return true;
  }

  async removeParticipantFromEventWithCascade(eventId: number, participantId: string): Promise<boolean> {
    // First remove all contributions by this participant for this event
    await db.delete(contributions)
      .where(and(
        eq(contributions.eventId, eventId),
        eq(contributions.participantId, participantId)
      ));
    
    // Then remove the event participant link
    await db.delete(eventParticipants)
      .where(and(
        eq(eventParticipants.eventId, eventId),
        eq(eventParticipants.participantId, participantId)
      ));
    
    // Decrement participant trip count
    await db.update(participants)
      .set({ tripCount: sql`GREATEST(${participants.tripCount} - 1, 0)` })
      .where(eq(participants.id, participantId));
    
    return true;
  }

  async addParticipantWithContributions(
    eventId: number, 
    participantId: string, 
    itemIds: string[], 
    costs?: Record<string, string>
  ): Promise<{ eventParticipant: EventParticipant; contributions: Contribution[] }> {
    // Check if participant already exists in event
    const existing = await db.select()
      .from(eventParticipants)
      .where(and(
        eq(eventParticipants.eventId, eventId),
        eq(eventParticipants.participantId, participantId)
      ));
    
    let eventParticipant: EventParticipant;
    
    if (existing.length === 0) {
      // Add participant to event
      [eventParticipant] = await db.insert(eventParticipants)
        .values({ eventId, participantId })
        .returning();
      
      // Increment trip count
      await db.update(participants)
        .set({ tripCount: sql`${participants.tripCount} + 1` })
        .where(eq(participants.id, participantId));
    } else {
      eventParticipant = existing[0];
    }
    
    // Create contributions for each item
    const createdContributions: Contribution[] = [];
    for (const itemId of itemIds) {
      const [contribution] = await db.insert(contributions)
        .values({
          eventId,
          itemId,
          participantId,
          cost: costs?.[itemId] || "0",
        })
        .returning();
      createdContributions.push(contribution);
    }
    
    return { eventParticipant, contributions: createdContributions };
  }

  // Contributions
  async getContributions(eventId: number): Promise<Contribution[]> {
    return db.select().from(contributions).where(eq(contributions.eventId, eventId));
  }
  
  async getContribution(id: string): Promise<Contribution | undefined> {
    const [contribution] = await db.select().from(contributions).where(eq(contributions.id, id));
    return contribution;
  }

  async createContribution(contribution: InsertContribution): Promise<Contribution> {
    const [created] = await db.insert(contributions).values(contribution).returning();
    return created;
  }

  async updateContribution(id: string, data: Partial<InsertContribution>): Promise<Contribution | undefined> {
    // Get the contribution first to know the event
    const [existingContribution] = await db.select()
      .from(contributions)
      .where(eq(contributions.id, id));
    
    if (!existingContribution) {
      return undefined;
    }
    
    const [updated] = await db.update(contributions)
      .set(data)
      .where(eq(contributions.id, id))
      .returning();
    
    // If a participant is being assigned, ensure they're part of the event
    if (data.participantId && data.participantId !== existingContribution.participantId) {
      const existingParticipant = await db.select()
        .from(eventParticipants)
        .where(and(
          eq(eventParticipants.eventId, existingContribution.eventId),
          eq(eventParticipants.participantId, data.participantId)
        ));
      
      // Add participant to event if not already there
      if (existingParticipant.length === 0) {
        await db.insert(eventParticipants)
          .values({
            eventId: existingContribution.eventId,
            participantId: data.participantId,
          });
        
        // Increment trip count
        await db.update(participants)
          .set({ tripCount: sql`${participants.tripCount} + 1` })
          .where(eq(participants.id, data.participantId));
      }
    }
    
    return updated;
  }

  async deleteContribution(id: string): Promise<boolean> {
    await db.delete(contributions).where(eq(contributions.id, id));
    return true;
  }

  async unassignContribution(id: string): Promise<{ unassigned: boolean; participantPruned: boolean }> {
    // Get the contribution first to know the event and participant
    const [contribution] = await db.select()
      .from(contributions)
      .where(eq(contributions.id, id));
    
    if (!contribution) {
      return { unassigned: false, participantPruned: false };
    }
    
    const { eventId, participantId } = contribution;
    
    // Reset the contribution to unfulfilled state
    await db.update(contributions)
      .set({
        participantId: null,
        cost: "0",
        status: "pending",
      })
      .where(eq(contributions.id, id));
    
    // If no participant was assigned, we're done
    if (!participantId) {
      return { unassigned: true, participantPruned: false };
    }
    
    // Check if this participant has any remaining fulfilled contributions for this event
    const remainingContributions = await db.select()
      .from(contributions)
      .where(and(
        eq(contributions.eventId, eventId),
        eq(contributions.participantId, participantId)
      ));
    
    // If no more contributions, remove participant from event
    if (remainingContributions.length === 0) {
      await db.delete(eventParticipants)
        .where(and(
          eq(eventParticipants.eventId, eventId),
          eq(eventParticipants.participantId, participantId)
        ));
      
      // Decrement trip count
      await db.update(participants)
        .set({ tripCount: sql`GREATEST(${participants.tripCount} - 1, 0)` })
        .where(eq(participants.id, participantId));
      
      return { unassigned: true, participantPruned: true };
    }
    
    return { unassigned: true, participantPruned: false };
  }

  async deleteContributionAndPruneParticipant(id: string): Promise<{ deleted: boolean; participantPruned: boolean }> {
    // Get the contribution first to know the event and participant
    const [contribution] = await db.select()
      .from(contributions)
      .where(eq(contributions.id, id));
    
    if (!contribution) {
      return { deleted: false, participantPruned: false };
    }
    
    const { eventId, participantId } = contribution;
    
    // Delete the contribution
    await db.delete(contributions).where(eq(contributions.id, id));
    
    // If no participant was assigned, we're done
    if (!participantId) {
      return { deleted: true, participantPruned: false };
    }
    
    // Check if this participant has any remaining contributions for this event
    const remainingContributions = await db.select()
      .from(contributions)
      .where(and(
        eq(contributions.eventId, eventId),
        eq(contributions.participantId, participantId)
      ));
    
    // If no more contributions, remove participant from event
    if (remainingContributions.length === 0) {
      await db.delete(eventParticipants)
        .where(and(
          eq(eventParticipants.eventId, eventId),
          eq(eventParticipants.participantId, participantId)
        ));
      
      // Decrement trip count
      await db.update(participants)
        .set({ tripCount: sql`GREATEST(${participants.tripCount} - 1, 0)` })
        .where(eq(participants.id, participantId));
      
      return { deleted: true, participantPruned: true };
    }
    
    return { deleted: true, participantPruned: false };
  }

  // Activity Logs
  async getActivityLogs(limit: number = 100): Promise<ActivityLog[]> {
    return db.select()
      .from(activityLogs)
      .orderBy(desc(activityLogs.createdAt))
      .limit(limit);
  }

  async createActivityLog(log: InsertActivityLog): Promise<ActivityLog> {
    const [created] = await db.insert(activityLogs).values(log).returning();
    return created;
  }

  // Stats
  async getStats() {
    const [eventsResult] = await db
      .select({ count: sql<number>`count(*)::int` })
      .from(events);
    
    const [upcomingResult] = await db
      .select({ count: sql<number>`count(*)::int` })
      .from(events)
      .where(eq(events.status, 'upcoming'));
    
    const [ongoingResult] = await db
      .select({ count: sql<number>`count(*)::int` })
      .from(events)
      .where(eq(events.status, 'ongoing'));
    
    const [completedResult] = await db
      .select({ count: sql<number>`count(*)::int` })
      .from(events)
      .where(eq(events.status, 'completed'));
    
    const [cancelledResult] = await db
      .select({ count: sql<number>`count(*)::int` })
      .from(events)
      .where(eq(events.status, 'cancelled'));
    
    const [participantsResult] = await db
      .select({ count: sql<number>`count(*)::int` })
      .from(participants);
    
    const [itemsResult] = await db
      .select({ count: sql<number>`count(*)::int` })
      .from(items);
    
    const [budgetResult] = await db
      .select({ total: sql<number>`COALESCE(SUM(cost::numeric), 0)::float` })
      .from(contributions);
    
    // Get paid (settled) debts from settlement records
    const [paidResult] = await db
      .select({ total: sql<number>`COALESCE(SUM(amount::numeric), 0)::float` })
      .from(settlementRecords)
      .where(eq(settlementRecords.isSettled, true));
    
    // Get unpaid (unsettled) debts from settlement records
    const [unpaidResult] = await db
      .select({ total: sql<number>`COALESCE(SUM(amount::numeric), 0)::float` })
      .from(settlementRecords)
      .where(eq(settlementRecords.isSettled, false));

    return {
      totalEvents: eventsResult?.count || 0,
      upcomingEvents: upcomingResult?.count || 0,
      ongoingEvents: ongoingResult?.count || 0,
      completedEvents: completedResult?.count || 0,
      cancelledEvents: cancelledResult?.count || 0,
      totalParticipants: participantsResult?.count || 0,
      totalItems: itemsResult?.count || 0,
      totalBudget: budgetResult?.total || 0,
      paidAmount: paidResult?.total || 0,
      unpaidAmount: unpaidResult?.total || 0,
    };
  }

  // User-specific stats (for non-admin users)
  async getStatsForUser(userId: string) {
    // Get user's participant record
    const participant = await this.getParticipantByUserId(userId);
    if (!participant) {
      return {
        totalEvents: 0,
        upcomingEvents: 0,
        ongoingEvents: 0,
        completedEvents: 0,
        cancelledEvents: 0,
        totalParticipants: 0,
        totalItems: 0,
        totalBudget: 0,
        paidAmount: 0,
        unpaidAmount: 0,
      };
    }

    // Get user's events
    const userEvents = await this.getEventsForUser(userId);
    const userEventIds = userEvents.map(e => e.id);

    if (userEventIds.length === 0) {
      return {
        totalEvents: 0,
        upcomingEvents: 0,
        ongoingEvents: 0,
        completedEvents: 0,
        cancelledEvents: 0,
        totalParticipants: 0,
        totalItems: 0,
        totalBudget: 0,
        paidAmount: 0,
        unpaidAmount: 0,
      };
    }

    // Count events by status
    const upcomingEvents = userEvents.filter(e => e.status === 'upcoming').length;
    const ongoingEvents = userEvents.filter(e => e.status === 'ongoing').length;
    const completedEvents = userEvents.filter(e => e.status === 'completed').length;
    const cancelledEvents = userEvents.filter(e => e.status === 'cancelled').length;

    // Get budget from user's events only
    const [budgetResult] = await db
      .select({ total: sql<number>`COALESCE(SUM(cost::numeric), 0)::float` })
      .from(contributions)
      .where(inArray(contributions.eventId, userEventIds));

    // Get user's paid debts (where user is debtor or creditor)
    const [paidResult] = await db
      .select({ total: sql<number>`COALESCE(SUM(amount::numeric), 0)::float` })
      .from(settlementRecords)
      .where(and(
        inArray(settlementRecords.eventId, userEventIds),
        eq(settlementRecords.isSettled, true),
        or(
          eq(settlementRecords.debtorId, participant.id),
          eq(settlementRecords.creditorId, participant.id)
        )
      ));

    // Get user's unpaid debts
    const [unpaidResult] = await db
      .select({ total: sql<number>`COALESCE(SUM(amount::numeric), 0)::float` })
      .from(settlementRecords)
      .where(and(
        inArray(settlementRecords.eventId, userEventIds),
        eq(settlementRecords.isSettled, false),
        or(
          eq(settlementRecords.debtorId, participant.id),
          eq(settlementRecords.creditorId, participant.id)
        )
      ));

    // Count unique participants in user's events
    const participantIds = new Set<string>();
    for (const eventId of userEventIds) {
      const eps = await db.select()
        .from(eventParticipants)
        .where(eq(eventParticipants.eventId, eventId));
      eps.forEach(ep => participantIds.add(ep.participantId));
    }

    return {
      totalEvents: userEvents.length,
      upcomingEvents,
      ongoingEvents,
      completedEvents,
      cancelledEvents,
      totalParticipants: participantIds.size,
      totalItems: 0, // Not relevant for user-specific view
      totalBudget: budgetResult?.total || 0,
      paidAmount: paidResult?.total || 0,
      unpaidAmount: unpaidResult?.total || 0,
    };
  }

  // Users (for Replit Auth and manual auth)
  async getAllUsers(): Promise<User[]> {
    return db.select().from(users).orderBy(users.firstName);
  }

  async getUser(id: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user;
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.email, email));
    return user;
  }

  async createUser(userData: {
    email: string;
    passwordHash: string;
    firstName: string;
    lastName?: string | null;
    phone?: string | null;
  }): Promise<User> {
    // Use transaction to ensure user and participant are created atomically
    return await db.transaction(async (tx) => {
      const [user] = await tx
        .insert(users)
        .values({
          email: userData.email,
          passwordHash: userData.passwordHash,
          firstName: userData.firstName,
          lastName: userData.lastName,
          phone: userData.phone,
        })
        .returning();
      
      // Auto-create a linked participant for the new user
      const fullName = userData.lastName 
        ? `${userData.firstName} ${userData.lastName}` 
        : userData.firstName;
      
      await tx.insert(participants).values({
        userId: user.id,
        name: fullName,
        email: userData.email,
        phone: userData.phone,
        isGuest: false,
        tripCount: 0,
      });
      
      return user;
    });
  }
  
  // Ensure a participant exists for a user (for backfill/migration)
  async ensureParticipantForUser(userId: string): Promise<Participant> {
    // Check if participant already exists
    const [existing] = await db.select().from(participants).where(eq(participants.userId, userId));
    if (existing) {
      return existing;
    }
    
    // Get user data to create participant
    const [user] = await db.select().from(users).where(eq(users.id, userId));
    if (!user) {
      throw new Error(`User ${userId} not found`);
    }
    
    const fullName = user.lastName 
      ? `${user.firstName} ${user.lastName}` 
      : user.firstName || '';
    
    const [participant] = await db.insert(participants).values({
      userId: user.id,
      name: fullName,
      email: user.email || undefined,
      phone: user.phone || undefined,
      isGuest: false,
      tripCount: 0,
    }).returning();
    
    return participant;
  }

  async updateUser(id: string, data: Partial<{
    firstName: string;
    lastName: string | null;
    phone: string | null;
    email: string;
    passwordHash: string;
    profileImageUrl: string | null;
  }>): Promise<User | undefined> {
    const [user] = await db
      .update(users)
      .set({ ...data, updatedAt: new Date() })
      .where(eq(users.id, id))
      .returning();
    
    // Sync the linked participant if profile fields changed
    if (user && (data.firstName || data.lastName || data.email || data.phone)) {
      const fullName = user.lastName 
        ? `${user.firstName} ${user.lastName}` 
        : user.firstName || '';
      
      // Ensure participant exists (backfill for legacy users)
      await this.ensureParticipantForUser(id);
      
      await db.update(participants)
        .set({
          name: fullName,
          email: user.email || undefined,
          phone: user.phone || undefined,
        })
        .where(eq(participants.userId, id));
    }
    
    return user;
  }

  async upsertUser(userData: UpsertUser): Promise<User> {
    const [user] = await db
      .insert(users)
      .values(userData)
      .onConflictDoUpdate({
        target: users.id,
        set: {
          ...userData,
          updatedAt: new Date(),
        },
      })
      .returning();
    return user;
  }

  // Settlement methods
  
  // Calculate balances using the fair split algorithm
  // Returns balances and also cost breakdowns for UI display
  private calculateEventBalances(
    eventContributions: Contribution[],
    eventParticipantsList: Participant[]
  ): { balances: ParticipantBalance[]; assignedCosts: number; unassignedCosts: number } {
    // Split contributions into assigned and unassigned
    const assignedContributions = eventContributions.filter(c => c.participantId);
    const unassignedContributions = eventContributions.filter(c => !c.participantId);
    
    // Calculate costs for each group (quantity × unit price)
    const assignedCosts = assignedContributions.reduce((sum, c) => {
      const unitCost = parseFloat(c.cost || "0");
      const quantity = c.quantity || 1;
      return sum + (unitCost * quantity);
    }, 0);
    const unassignedCosts = unassignedContributions.reduce((sum, c) => {
      const unitCost = parseFloat(c.cost || "0");
      const quantity = c.quantity || 1;
      return sum + (unitCost * quantity);
    }, 0);
    
    // Sum up what each participant paid (only assigned contributions count)
    const paidByParticipant = new Map<string, number>();
    
    for (const contribution of assignedContributions) {
      if (contribution.participantId) {
        const current = paidByParticipant.get(contribution.participantId) || 0;
        const unitCost = parseFloat(contribution.cost || "0");
        const quantity = contribution.quantity || 1;
        paidByParticipant.set(contribution.participantId, current + (unitCost * quantity));
      }
    }
    
    // Fair share is based ONLY on assigned contributions (so balances net to zero)
    const participantCount = eventParticipantsList.length;
    const fairShare = participantCount > 0 ? assignedCosts / participantCount : 0;
    
    // Calculate balance for each participant
    const balances: ParticipantBalance[] = eventParticipantsList.map(participant => {
      const paid = paidByParticipant.get(participant.id) || 0;
      const balance = paid - fairShare;
      
      let role: 'creditor' | 'debtor' | 'settled' = 'settled';
      if (balance > 0.01) {
        role = 'creditor';
      } else if (balance < -0.01) {
        role = 'debtor';
      }
      
      return {
        participant,
        totalPaid: paid,
        fairShare,
        balance,
        role,
      };
    });
    
    return { balances, assignedCosts, unassignedCosts };
  }
  
  // Generate minimum transactions to settle debts
  private generateSettlementTransactions(
    balances: ParticipantBalance[]
  ): { debtorId: string; creditorId: string; amount: number }[] {
    const transactions: { debtorId: string; creditorId: string; amount: number }[] = [];
    
    // Separate into debtors and creditors
    const debtors = balances
      .filter(b => b.role === 'debtor')
      .map(b => ({ id: b.participant.id, amount: Math.abs(b.balance) }))
      .sort((a, b) => b.amount - a.amount);
    
    const creditors = balances
      .filter(b => b.role === 'creditor')
      .map(b => ({ id: b.participant.id, amount: b.balance }))
      .sort((a, b) => b.amount - a.amount);
    
    // Match debtors to creditors
    let i = 0, j = 0;
    while (i < debtors.length && j < creditors.length) {
      const debtor = debtors[i];
      const creditor = creditors[j];
      
      const transfer = Math.min(debtor.amount, creditor.amount);
      
      if (transfer > 0.01) {
        transactions.push({
          debtorId: debtor.id,
          creditorId: creditor.id,
          amount: Math.round(transfer * 100) / 100, // Round to 2 decimals
        });
      }
      
      debtor.amount -= transfer;
      creditor.amount -= transfer;
      
      if (debtor.amount < 0.01) i++;
      if (creditor.amount < 0.01) j++;
    }
    
    return transactions;
  }
  
  async syncEventSettlement(eventId: number): Promise<void> {
    // Get event with participants and contributions
    const event = await this.getEventWithDetails(eventId);
    if (!event) return;
    
    const participantsList = event.eventParticipants.map(ep => ep.participant);
    const { balances } = this.calculateEventBalances(event.contributions, participantsList);
    const newTransactions = this.generateSettlementTransactions(balances);
    
    // Get existing settlement records for this event
    const existingRecords = await db.select()
      .from(settlementRecords)
      .where(eq(settlementRecords.eventId, eventId));
    
    // Create a map of existing records by debtor-creditor pair
    const existingMap = new Map<string, SettlementRecord>();
    for (const record of existingRecords) {
      existingMap.set(`${record.debtorId}-${record.creditorId}`, record);
    }
    
    // Update or create settlement records
    for (const tx of newTransactions) {
      const key = `${tx.debtorId}-${tx.creditorId}`;
      const existing = existingMap.get(key);
      
      if (existing) {
        // Update existing record if amount changed significantly
        const amountDiff = Math.abs(parseFloat(existing.amount) - tx.amount);
        if (amountDiff > 0.01) {
          await db.update(settlementRecords)
            .set({ 
              amount: tx.amount.toString(),
              isSettled: false, // Reset settled status if amount changed
              updatedAt: new Date(),
            })
            .where(eq(settlementRecords.id, existing.id));
        }
        existingMap.delete(key);
      } else {
        // Create new record
        await db.insert(settlementRecords).values({
          eventId,
          debtorId: tx.debtorId,
          creditorId: tx.creditorId,
          amount: tx.amount.toString(),
          isSettled: false,
        });
      }
    }
    
    // Delete obsolete records (where debt no longer exists)
    const obsoleteRecords = Array.from(existingMap.values());
    for (const record of obsoleteRecords) {
      await db.delete(settlementRecords)
        .where(eq(settlementRecords.id, record.id));
    }
  }
  
  async getEventSettlement(eventId: number): Promise<EventSettlement | null> {
    const event = await this.getEventWithDetails(eventId);
    if (!event) return null;
    
    // Sync settlements first
    await this.syncEventSettlement(eventId);
    
    const participantsList = event.eventParticipants.map(ep => ep.participant);
    const { balances, assignedCosts, unassignedCosts } = this.calculateEventBalances(event.contributions, participantsList);
    
    // Get settlement records with participant details
    const records = await db.select()
      .from(settlementRecords)
      .where(eq(settlementRecords.eventId, eventId));
    
    const allParticipantIds = Array.from(new Set([
      ...records.map(r => r.debtorId),
      ...records.map(r => r.creditorId),
    ]));
    
    const allParticipants = allParticipantIds.length > 0
      ? await db.select().from(participants).where(inArray(participants.id, allParticipantIds))
      : [];
    
    const transactions: SettlementRecordWithDetails[] = records.map(r => ({
      ...r,
      debtor: allParticipants.find(p => p.id === r.debtorId)!,
      creditor: allParticipants.find(p => p.id === r.creditorId)!,
    }));
    
    // Total spent is assigned + unassigned
    const totalSpent = assignedCosts + unassignedCosts;
    const fairShare = participantsList.length > 0 ? assignedCosts / participantsList.length : 0;
    
    return {
      eventId: event.id,
      eventTitle: event.title,
      eventDate: event.date,
      totalSpent,
      assignedCosts,
      unassignedCosts,
      participantCount: participantsList.length,
      fairShare,
      balances,
      transactions,
    };
  }
  
  async getAllSettlements(): Promise<EventSettlement[]> {
    const allEvents = await db.select().from(events).orderBy(desc(events.date));
    const settlements: EventSettlement[] = [];
    
    for (const event of allEvents) {
      const settlement = await this.getEventSettlement(event.id);
      if (settlement && settlement.transactions.length > 0) {
        settlements.push(settlement);
      }
    }
    
    return settlements;
  }

  async getAllSettlementRecords(): Promise<SettlementRecord[]> {
    return await db.select().from(settlementRecords).orderBy(desc(settlementRecords.createdAt));
  }
  
  async toggleSettlementStatus(
    eventId: number, 
    debtorId: string, 
    creditorId: string
  ): Promise<SettlementRecord | undefined> {
    // Find the existing record
    const [record] = await db.select()
      .from(settlementRecords)
      .where(and(
        eq(settlementRecords.eventId, eventId),
        eq(settlementRecords.debtorId, debtorId),
        eq(settlementRecords.creditorId, creditorId)
      ));
    
    if (!record) return undefined;
    
    // Get event and participant details for the activity log
    const [event] = await db.select().from(events).where(eq(events.id, eventId));
    const [debtor] = await db.select().from(participants).where(eq(participants.id, debtorId));
    const [creditor] = await db.select().from(participants).where(eq(participants.id, creditorId));
    
    if (!event || !debtor || !creditor) return undefined;
    
    const newStatus = !record.isSettled;
    
    const [updated] = await db.update(settlementRecords)
      .set({ 
        isSettled: newStatus,
        settledAt: newStatus ? new Date() : null,
        updatedAt: new Date(),
      })
      .where(eq(settlementRecords.id, record.id))
      .returning();
    
    // Log the activity (immutable record)
    await db.insert(settlementActivityLog).values({
      eventId: event.id,
      eventTitle: event.title,
      debtorId: debtor.id,
      debtorName: debtor.name,
      creditorId: creditor.id,
      creditorName: creditor.name,
      amount: record.amount,
      action: newStatus ? 'payment' : 'cancellation',
    });
    
    return updated;
  }
  
  // Settlement Activity Log Methods
  
  async getSettlementActivityLogs(limit: number = 100): Promise<SettlementActivityLog[]> {
    return await db.select()
      .from(settlementActivityLog)
      .orderBy(desc(settlementActivityLog.createdAt))
      .limit(limit);
  }
  
  async getSettlementActivityLogsForUser(userId: string, limit: number = 100): Promise<SettlementActivityLog[]> {
    // Get user's participant
    const participant = await this.getParticipantByUserId(userId);
    if (!participant) {
      return [];
    }
    
    // Get events the user participates in
    const userEventParticipants = await db.select()
      .from(eventParticipants)
      .where(eq(eventParticipants.participantId, participant.id));
    
    const userEventIds = userEventParticipants.map(ep => ep.eventId);
    
    if (userEventIds.length === 0) {
      return [];
    }
    
    // Get logs only for user's events
    return await db.select()
      .from(settlementActivityLog)
      .where(inArray(settlementActivityLog.eventId, userEventIds))
      .orderBy(desc(settlementActivityLog.createdAt))
      .limit(limit);
  }
  
  // Event protection (cancellation/deletion)
  
  async canCancelEvent(eventId: number): Promise<{ canCancel: boolean; reason?: string }> {
    // Check if event has any settlement records (debts)
    const eventSettlements = await db.select()
      .from(settlementRecords)
      .where(eq(settlementRecords.eventId, eventId));
    
    if (eventSettlements.length > 0) {
      return { 
        canCancel: false, 
        reason: "لا يمكن إلغاء الطلعة لأنها تحتوي على تسويات وديون. يرجى تسوية جميع الديون أولاً." 
      };
    }
    
    return { canCancel: true };
  }
  
  async canDeleteEvent(eventId: number): Promise<{ canDelete: boolean; reason?: string }> {
    // Check for settlement records first
    const eventSettlements = await db.select()
      .from(settlementRecords)
      .where(eq(settlementRecords.eventId, eventId));
    
    if (eventSettlements.length > 0) {
      return { 
        canDelete: false, 
        reason: "لا يمكن حذف الطلعة لأنها تحتوي على تسويات وديون. يرجى تسوية جميع الديون أولاً." 
      };
    }
    
    // Get all contributions for this event with non-zero costs
    const eventContributions = await db.select()
      .from(contributions)
      .where(eq(contributions.eventId, eventId));
    
    const hasNonZeroCosts = eventContributions.some(c => {
      const cost = parseFloat(c.cost || "0");
      return cost > 0;
    });
    
    if (hasNonZeroCosts) {
      return { 
        canDelete: false, 
        reason: "لا يمكن حذف الطلعة لأنها تحتوي على مساهمات بتكاليف. يرجى إزالة جميع التكاليف أولاً." 
      };
    }
    
    return { canDelete: true };
  }
  
  async canDeleteParticipant(participantId: string): Promise<{ canDelete: boolean; reason?: string }> {
    // Check for unsettled debts as debtor (owes others)
    const debtorRecords = await db.select()
      .from(settlementRecords)
      .where(
        and(
          eq(settlementRecords.debtorId, participantId),
          eq(settlementRecords.isSettled, false)
        )
      );
    
    // Check for unsettled debts as creditor (others owe them)
    const creditorRecords = await db.select()
      .from(settlementRecords)
      .where(
        and(
          eq(settlementRecords.creditorId, participantId),
          eq(settlementRecords.isSettled, false)
        )
      );
    
    const totalOwed = debtorRecords.reduce((sum, r) => sum + parseFloat(r.amount), 0);
    const totalOwedToThem = creditorRecords.reduce((sum, r) => sum + parseFloat(r.amount), 0);
    
    if (totalOwed > 0.01) {
      return { 
        canDelete: false, 
        reason: `لا يمكن حذف المشارك لأنه مدين بمبلغ ${totalOwed.toFixed(2)} ر.ق. يرجى تسوية جميع الديون أولاً.` 
      };
    }
    
    if (totalOwedToThem > 0.01) {
      return { 
        canDelete: false, 
        reason: `لا يمكن حذف المشارك لأن له ديون على الآخرين بمبلغ ${totalOwedToThem.toFixed(2)} ر.ق. يرجى تسوية جميع الديون أولاً.` 
      };
    }
    
    return { canDelete: true };
  }
  
  // Debt Portfolio Methods
  
  async getDebtSummaries(): Promise<ParticipantDebtSummary[]> {
    // Get all participants
    const allParticipants = await db.select().from(participants);
    
    // Get all settlement records (unsettled only for active debts)
    const allRecords = await db.select()
      .from(settlementRecords)
      .where(eq(settlementRecords.isSettled, false));
    
    // Get all contributions for total paid calculations
    const allContributions = await db.select().from(contributions);
    
    // Get all event participations
    const allEventParticipants = await db.select().from(eventParticipants);
    
    const summaries: ParticipantDebtSummary[] = [];
    
    for (const participant of allParticipants) {
      // Total paid across all events (from assigned contributions) - quantity × unit price
      const totalPaid = allContributions
        .filter(c => c.participantId === participant.id)
        .reduce((sum, c) => {
          const unitCost = parseFloat(c.cost || "0");
          const quantity = c.quantity || 1;
          return sum + (unitCost * quantity);
        }, 0);
      
      // Total owed TO others (this participant is debtor)
      const totalOwed = allRecords
        .filter(r => r.debtorId === participant.id)
        .reduce((sum, r) => sum + parseFloat(r.amount), 0);
      
      // Total owed BY others to this participant (this participant is creditor)
      const totalOwedToYou = allRecords
        .filter(r => r.creditorId === participant.id)
        .reduce((sum, r) => sum + parseFloat(r.amount), 0);
      
      const netPosition = totalOwedToYou - totalOwed;
      
      // Count events participated in
      const eventCount = allEventParticipants.filter(ep => ep.participantId === participant.id).length;
      
      let role: 'creditor' | 'debtor' | 'settled' = 'settled';
      if (netPosition > 0.01) role = 'creditor';
      else if (netPosition < -0.01) role = 'debtor';
      
      summaries.push({
        participant,
        totalPaid,
        totalOwed,
        totalOwedToYou,
        netPosition,
        role,
        eventCount,
      });
    }
    
    // Sort by absolute net position (highest debt/credit first)
    return summaries.sort((a, b) => Math.abs(b.netPosition) - Math.abs(a.netPosition));
  }
  
  async getDebtSummaryForParticipant(participantId: string): Promise<ParticipantDebtSummary | null> {
    // Get participant
    const [participant] = await db.select().from(participants).where(eq(participants.id, participantId));
    if (!participant) return null;
    
    // Get settlement records for this participant only (unsettled)
    const debtorRecords = await db.select()
      .from(settlementRecords)
      .where(and(
        eq(settlementRecords.debtorId, participantId),
        eq(settlementRecords.isSettled, false)
      ));
    
    const creditorRecords = await db.select()
      .from(settlementRecords)
      .where(and(
        eq(settlementRecords.creditorId, participantId),
        eq(settlementRecords.isSettled, false)
      ));
    
    // Get contributions for this participant only
    const participantContributions = await db.select()
      .from(contributions)
      .where(eq(contributions.participantId, participantId));
    
    // Get event participation count
    const eventParticipantCount = await db.select()
      .from(eventParticipants)
      .where(eq(eventParticipants.participantId, participantId));
    
    // Calculate totals (quantity × unit price)
    const totalPaid = participantContributions.reduce((sum, c) => {
      const unitCost = parseFloat(c.cost || "0");
      const quantity = c.quantity || 1;
      return sum + (unitCost * quantity);
    }, 0);
    
    const totalOwed = debtorRecords.reduce((sum, r) => sum + parseFloat(r.amount), 0);
    const totalOwedToYou = creditorRecords.reduce((sum, r) => sum + parseFloat(r.amount), 0);
    const netPosition = totalOwedToYou - totalOwed;
    const eventCount = eventParticipantCount.length;
    
    let role: 'creditor' | 'debtor' | 'settled' = 'settled';
    if (netPosition > 0.01) role = 'creditor';
    else if (netPosition < -0.01) role = 'debtor';
    
    return {
      participant,
      totalPaid,
      totalOwed,
      totalOwedToYou,
      netPosition,
      role,
      eventCount,
    };
  }
  
  async getDebtPortfolio(participantId: string): Promise<ParticipantDebtPortfolio | null> {
    // Get participant
    const [participant] = await db.select().from(participants).where(eq(participants.id, participantId));
    if (!participant) return null;
    
    // Get all events this participant was in
    const participantEvents = await db.select()
      .from(eventParticipants)
      .innerJoin(events, eq(eventParticipants.eventId, events.id))
      .where(eq(eventParticipants.participantId, participantId))
      .orderBy(desc(events.date));
    
    // Get all settlement records involving this participant (unsettled only)
    const debtorRecords = await db.select()
      .from(settlementRecords)
      .innerJoin(events, eq(settlementRecords.eventId, events.id))
      .where(and(
        eq(settlementRecords.debtorId, participantId),
        eq(settlementRecords.isSettled, false)
      ));
    
    const creditorRecords = await db.select()
      .from(settlementRecords)
      .innerJoin(events, eq(settlementRecords.eventId, events.id))
      .where(and(
        eq(settlementRecords.creditorId, participantId),
        eq(settlementRecords.isSettled, false)
      ));
    
    // Get all contributions by this participant
    const participantContributions = await db.select()
      .from(contributions)
      .where(eq(contributions.participantId, participantId));
    
    // Calculate totals (quantity × unit price)
    const totalPaid = participantContributions.reduce((sum, c) => {
      const unitCost = parseFloat(c.cost || "0");
      const quantity = c.quantity || 1;
      return sum + (unitCost * quantity);
    }, 0);
    const totalOwed = debtorRecords.reduce((sum, r) => sum + parseFloat(r.settlement_records.amount), 0);
    const totalOwedToYou = creditorRecords.reduce((sum, r) => sum + parseFloat(r.settlement_records.amount), 0);
    const netPosition = totalOwedToYou - totalOwed;
    
    let role: 'creditor' | 'debtor' | 'settled' = 'settled';
    if (netPosition > 0.01) role = 'creditor';
    else if (netPosition < -0.01) role = 'debtor';
    
    // Get all participants for counterparty details
    const allParticipants = await db.select().from(participants);
    
    // Build counterparty debts (aggregate by counterparty)
    const counterpartyMap = new Map<string, {
      counterparty: Participant;
      totalOwed: number;
      events: { eventId: number; eventTitle: string; amount: number }[];
    }>();
    
    // Add debts (this participant owes to others) - positive amounts
    for (const record of debtorRecords) {
      const creditorId = record.settlement_records.creditorId;
      const existing = counterpartyMap.get(creditorId);
      const amount = parseFloat(record.settlement_records.amount);
      
      if (existing) {
        existing.totalOwed += amount;
        existing.events.push({
          eventId: record.events.id,
          eventTitle: record.events.title,
          amount: amount,
        });
      } else {
        counterpartyMap.set(creditorId, {
          counterparty: allParticipants.find(p => p.id === creditorId)!,
          totalOwed: amount,
          events: [{
            eventId: record.events.id,
            eventTitle: record.events.title,
            amount: amount,
          }],
        });
      }
    }
    
    // Add credits (others owe to this participant) - negative amounts to show they owe us
    for (const record of creditorRecords) {
      const debtorId = record.settlement_records.debtorId;
      const existing = counterpartyMap.get(debtorId);
      const amount = -parseFloat(record.settlement_records.amount); // negative = they owe us
      
      if (existing) {
        existing.totalOwed += amount;
        existing.events.push({
          eventId: record.events.id,
          eventTitle: record.events.title,
          amount: amount,
        });
      } else {
        counterpartyMap.set(debtorId, {
          counterparty: allParticipants.find(p => p.id === debtorId)!,
          totalOwed: amount,
          events: [{
            eventId: record.events.id,
            eventTitle: record.events.title,
            amount: amount,
          }],
        });
      }
    }
    
    const counterpartyDebts = Array.from(counterpartyMap.values())
      .filter(cp => cp.counterparty) // Filter out any undefined counterparties
      .sort((a, b) => Math.abs(b.totalOwed) - Math.abs(a.totalOwed));
    
    // Build event breakdown
    const eventBreakdown: ParticipantDebtPortfolio['eventBreakdown'] = [];
    
    for (const ep of participantEvents) {
      const eventId = ep.events.id;
      
      // Get all contributions for this event by this participant (quantity × unit price)
      const eventContributions = participantContributions.filter(c => c.eventId === eventId);
      const paid = eventContributions.reduce((sum, c) => {
        const unitCost = parseFloat(c.cost || "0");
        const quantity = c.quantity || 1;
        return sum + (unitCost * quantity);
      }, 0);
      
      // Get settlement info for this event
      const settlement = await this.getEventSettlement(eventId);
      const participantBalance = settlement?.balances.find(b => b.participant.id === participantId);
      
      eventBreakdown.push({
        event: ep.events,
        paid,
        fairShare: participantBalance?.fairShare || 0,
        balance: participantBalance?.balance || 0,
        role: participantBalance?.role || 'settled',
      });
    }
    
    return {
      participant,
      totalPaid,
      totalOwed,
      totalOwedToYou,
      netPosition,
      role,
      counterpartyDebts,
      eventBreakdown,
    };
  }
  
  // Sync event statuses based on current date
  async syncEventStatuses(): Promise<void> {
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    
    // Get all events that are not cancelled
    const allEvents = await db.select().from(events);
    
    for (const event of allEvents) {
      // Skip cancelled events - they stay cancelled
      if (event.status === 'cancelled') continue;
      
      const eventDate = new Date(event.date);
      const eventDateOnly = new Date(eventDate.getFullYear(), eventDate.getMonth(), eventDate.getDate());
      
      // Determine end date for multi-day events
      const endDate = event.endDate ? new Date(event.endDate) : eventDate;
      const endDateOnly = new Date(endDate.getFullYear(), endDate.getMonth(), endDate.getDate());
      
      let newStatus: string;
      
      if (eventDateOnly > today) {
        // Event is in the future
        newStatus = 'upcoming';
      } else if (eventDateOnly <= today && endDateOnly >= today) {
        // Event is today or spans today
        newStatus = 'ongoing';
      } else {
        // Event has passed
        newStatus = 'completed';
      }
      
      // Only update if status changed
      if (event.status !== newStatus) {
        await db.update(events)
          .set({ status: newStatus })
          .where(eq(events.id, event.id));
      }
    }
  }

  // Privacy-Aware Event Queries
  async getEventsForUser(userId: string): Promise<Event[]> {
    const participant = await this.getParticipantByUserId(userId);
    if (!participant) return [];
    
    const userEventParticipants = await db.select()
      .from(eventParticipants)
      .where(and(
        eq(eventParticipants.participantId, participant.id),
        eq(eventParticipants.status, 'active')
      ));
    
    if (userEventParticipants.length === 0) return [];
    
    const eventIds = userEventParticipants.map(ep => ep.eventId);
    return db.select().from(events)
      .where(inArray(events.id, eventIds))
      .orderBy(desc(events.date));
  }

  async getParticipantByUserId(userId: string): Promise<Participant | undefined> {
    const [participant] = await db.select()
      .from(participants)
      .where(eq(participants.userId, userId));
    return participant;
  }

  async getUserEventRole(eventId: number, userId: string): Promise<EventRole | null> {
    const participant = await this.getParticipantByUserId(userId);
    if (!participant) return null;
    
    const [ep] = await db.select()
      .from(eventParticipants)
      .where(and(
        eq(eventParticipants.eventId, eventId),
        eq(eventParticipants.participantId, participant.id),
        eq(eventParticipants.status, 'active')
      ));
    
    return ep ? (ep.role as EventRole) : null;
  }

  async canUserAccessEvent(eventId: number, userId: string): Promise<boolean> {
    const role = await this.getUserEventRole(eventId, userId);
    return role !== null;
  }

  // Invitations
  async createEventInvitation(data: InsertEventInvitation): Promise<EventInvitation> {
    const [created] = await db.insert(eventInvitations).values(data).returning();
    return created;
  }

  async getInvitationsForUser(email: string): Promise<EventInvitationWithDetails[]> {
    const invitationsList = await db.select()
      .from(eventInvitations)
      .where(and(
        eq(eventInvitations.email, email),
        eq(eventInvitations.status, 'pending')
      ));
    
    if (invitationsList.length === 0) return [];
    
    const eventIds = Array.from(new Set(invitationsList.map(i => i.eventId)));
    const eventsList = await db.select().from(events).where(inArray(events.id, eventIds));
    
    const inviterIds = invitationsList
      .map(i => i.inviterParticipantId)
      .filter((id): id is string => id !== null);
    const inviters = inviterIds.length > 0
      ? await db.select().from(participants).where(inArray(participants.id, inviterIds))
      : [];
    
    return invitationsList.map(inv => ({
      ...inv,
      event: eventsList.find(e => e.id === inv.eventId)!,
      inviter: inv.inviterParticipantId 
        ? inviters.find(p => p.id === inv.inviterParticipantId)
        : undefined,
    }));
  }

  async getEventInvitations(eventId: number): Promise<EventInvitation[]> {
    return db.select()
      .from(eventInvitations)
      .where(eq(eventInvitations.eventId, eventId));
  }

  async respondToInvitation(invitationId: string, accept: boolean, participantId?: string): Promise<EventInvitation | undefined> {
    const [updated] = await db.update(eventInvitations)
      .set({ 
        status: accept ? 'accepted' : 'declined',
        invitedParticipantId: participantId,
      })
      .where(eq(eventInvitations.id, invitationId))
      .returning();
    return updated;
  }

  async getInvitationByToken(token: string): Promise<EventInvitationWithDetails | undefined> {
    const [invitation] = await db.select()
      .from(eventInvitations)
      .where(eq(eventInvitations.token, token));
    
    if (!invitation) return undefined;
    
    const [event] = await db.select().from(events).where(eq(events.id, invitation.eventId));
    const inviter = invitation.inviterParticipantId
      ? (await db.select().from(participants).where(eq(participants.id, invitation.inviterParticipantId)))[0]
      : undefined;
    
    return { ...invitation, event, inviter };
  }

  // Notifications
  async createNotification(data: InsertNotification): Promise<Notification> {
    const [created] = await db.insert(notifications).values(data).returning();
    return created;
  }

  async getNotificationsForUser(userId: string): Promise<Notification[]> {
    return db.select()
      .from(notifications)
      .where(eq(notifications.userId, userId))
      .orderBy(desc(notifications.createdAt));
  }

  async markNotificationRead(notificationId: string): Promise<boolean> {
    const result = await db.update(notifications)
      .set({ isRead: true })
      .where(eq(notifications.id, notificationId));
    return (result.rowCount ?? 0) > 0;
  }

  async getUnreadNotificationCount(userId: string): Promise<number> {
    const [result] = await db.select({ count: sql<number>`count(*)::int` })
      .from(notifications)
      .where(and(
        eq(notifications.userId, userId),
        eq(notifications.isRead, false)
      ));
    return result?.count || 0;
  }

  // Settlement Claims
  async createSettlementClaim(data: InsertSettlementClaim): Promise<SettlementClaim> {
    const [created] = await db.insert(settlementClaims).values(data).returning();
    return created;
  }

  async respondToSettlementClaim(claimId: string, status: 'confirmed' | 'rejected'): Promise<SettlementClaim | undefined> {
    const [updated] = await db.update(settlementClaims)
      .set({ 
        status,
        respondedAt: new Date(),
      })
      .where(eq(settlementClaims.id, claimId))
      .returning();
    return updated;
  }

  async getClaimsForParticipant(participantId: string): Promise<SettlementClaimWithDetails[]> {
    const claimsList = await db.select()
      .from(settlementClaims)
      .where(or(
        eq(settlementClaims.debtorParticipantId, participantId),
        eq(settlementClaims.creditorParticipantId, participantId)
      ));
    
    if (claimsList.length === 0) return [];
    
    const eventIds = Array.from(new Set(claimsList.map(c => c.eventId)));
    const eventsList = await db.select().from(events).where(inArray(events.id, eventIds));
    
    const participantIds = Array.from(new Set([
      ...claimsList.map(c => c.debtorParticipantId),
      ...claimsList.map(c => c.creditorParticipantId),
      ...claimsList.map(c => c.submittedByParticipantId).filter((id): id is string => id !== null),
    ]));
    const participantsList = await db.select().from(participants).where(inArray(participants.id, participantIds));
    
    return claimsList.map(claim => ({
      ...claim,
      event: eventsList.find(e => e.id === claim.eventId)!,
      debtor: participantsList.find(p => p.id === claim.debtorParticipantId)!,
      creditor: participantsList.find(p => p.id === claim.creditorParticipantId)!,
      submittedBy: claim.submittedByParticipantId
        ? participantsList.find(p => p.id === claim.submittedByParticipantId)
        : undefined,
    }));
  }
}

export const storage = new DatabaseStorage();