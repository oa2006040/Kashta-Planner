import { 
  categories, 
  items, 
  participants, 
  events, 
  eventParticipants, 
  contributions, 
  activityLogs,
  users,
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
  type InsertUser,
  type CategoryWithItems,
  type EventWithDetails,
} from "@shared/schema";
import { db } from "./db";
import { eq, desc, and, sql, inArray } from "drizzle-orm";

export interface IStorage {
  // Categories
  getCategories(): Promise<Category[]>;
  getCategoriesWithItems(): Promise<CategoryWithItems[]>;
  getCategory(id: string): Promise<Category | undefined>;
  createCategory(category: InsertCategory): Promise<Category>;
  
  // Items
  getItems(): Promise<Item[]>;
  getItemsByCategory(categoryId: string): Promise<Item[]>;
  getItem(id: string): Promise<Item | undefined>;
  createItem(item: InsertItem): Promise<Item>;
  
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
  
  // Event Participants
  getEventParticipants(eventId: number): Promise<EventParticipant[]>;
  addParticipantToEvent(data: InsertEventParticipant): Promise<EventParticipant>;
  removeParticipantFromEvent(eventId: number, participantId: string): Promise<boolean>;
  removeParticipantFromEventWithCascade(eventId: number, participantId: string): Promise<boolean>;
  addParticipantWithContributions(eventId: number, participantId: string, itemIds: string[], costs?: Record<string, string>): Promise<{ eventParticipant: EventParticipant; contributions: Contribution[] }>;
  
  // Contributions
  getContributions(eventId: number): Promise<Contribution[]>;
  createContribution(contribution: InsertContribution): Promise<Contribution>;
  updateContribution(id: string, contribution: Partial<InsertContribution>): Promise<Contribution | undefined>;
  deleteContribution(id: string): Promise<boolean>;
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
  
  // Users (kept for compatibility)
  getUser(id: string): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
}

export class DatabaseStorage implements IStorage {
  // Categories
  async getCategories(): Promise<Category[]> {
    return db.select().from(categories).orderBy(categories.sortOrder);
  }

  async getCategoriesWithItems(): Promise<CategoryWithItems[]> {
    const allCategories = await db.select().from(categories).orderBy(categories.sortOrder);
    const allItems = await db.select().from(items);
    
    return allCategories.map(cat => ({
      ...cat,
      items: allItems.filter(item => item.categoryId === cat.id),
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

  // Items
  async getItems(): Promise<Item[]> {
    return db.select().from(items);
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

    const contributionsWithDetails = contributionsList.map(c => ({
      ...c,
      item: itemsList.find(i => i.id === c.itemId)!,
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

  async createContribution(contribution: InsertContribution): Promise<Contribution> {
    const [created] = await db.insert(contributions).values(contribution).returning();
    return created;
  }

  async updateContribution(id: string, data: Partial<InsertContribution>): Promise<Contribution | undefined> {
    const [updated] = await db.update(contributions)
      .set(data)
      .where(eq(contributions.id, id))
      .returning();
    return updated;
  }

  async deleteContribution(id: string): Promise<boolean> {
    await db.delete(contributions).where(eq(contributions.id, id));
    return true;
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
    
    const [participantsResult] = await db
      .select({ count: sql<number>`count(*)::int` })
      .from(participants);
    
    const [itemsResult] = await db
      .select({ count: sql<number>`count(*)::int` })
      .from(items);
    
    const [budgetResult] = await db
      .select({ total: sql<number>`COALESCE(SUM(cost::numeric), 0)::float` })
      .from(contributions);

    return {
      totalEvents: eventsResult?.count || 0,
      upcomingEvents: upcomingResult?.count || 0,
      totalParticipants: participantsResult?.count || 0,
      totalItems: itemsResult?.count || 0,
      totalBudget: budgetResult?.total || 0,
    };
  }

  // Users
  async getUser(id: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user;
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.username, username));
    return user;
  }

  async createUser(user: InsertUser): Promise<User> {
    const [created] = await db.insert(users).values(user).returning();
    return created;
  }
}

export const storage = new DatabaseStorage();