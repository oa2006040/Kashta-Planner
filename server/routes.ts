import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { 
  insertCategorySchema, 
  insertItemSchema, 
  insertParticipantSchema, 
  insertEventSchema,
  insertEventParticipantSchema,
  insertContributionSchema,
} from "@shared/schema";
import { z } from "zod";

export async function registerRoutes(
  httpServer: Server,
  app: Express
): Promise<Server> {
  
  // Stats
  app.get("/api/stats", async (req, res) => {
    try {
      const stats = await storage.getStats();
      res.json(stats);
    } catch (error) {
      console.error("Error fetching stats:", error);
      res.status(500).json({ error: "Failed to fetch stats" });
    }
  });

  // Categories
  app.get("/api/categories", async (req, res) => {
    try {
      const withItems = req.query.withItems === "true";
      if (withItems) {
        const categories = await storage.getCategoriesWithItems();
        res.json(categories);
      } else {
        const categories = await storage.getCategories();
        res.json(categories);
      }
    } catch (error) {
      console.error("Error fetching categories:", error);
      res.status(500).json({ error: "Failed to fetch categories" });
    }
  });

  app.get("/api/categories/:id", async (req, res) => {
    try {
      const category = await storage.getCategory(req.params.id);
      if (!category) {
        return res.status(404).json({ error: "Category not found" });
      }
      res.json(category);
    } catch (error) {
      console.error("Error fetching category:", error);
      res.status(500).json({ error: "Failed to fetch category" });
    }
  });

  app.post("/api/categories", async (req, res) => {
    try {
      const data = insertCategorySchema.parse(req.body);
      const category = await storage.createCategory(data);
      res.status(201).json(category);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: error.errors });
      }
      console.error("Error creating category:", error);
      res.status(500).json({ error: "Failed to create category" });
    }
  });

  // Items
  app.get("/api/items", async (req, res) => {
    try {
      const categoryId = req.query.categoryId as string;
      if (categoryId) {
        const items = await storage.getItemsByCategory(categoryId);
        res.json(items);
      } else {
        const items = await storage.getItems();
        res.json(items);
      }
    } catch (error) {
      console.error("Error fetching items:", error);
      res.status(500).json({ error: "Failed to fetch items" });
    }
  });

  app.get("/api/items/:id", async (req, res) => {
    try {
      const item = await storage.getItem(req.params.id);
      if (!item) {
        return res.status(404).json({ error: "Item not found" });
      }
      res.json(item);
    } catch (error) {
      console.error("Error fetching item:", error);
      res.status(500).json({ error: "Failed to fetch item" });
    }
  });

  app.post("/api/items", async (req, res) => {
    try {
      const data = insertItemSchema.parse(req.body);
      const item = await storage.createItem(data);
      
      // Log activity
      await storage.createActivityLog({
        action: "إضافة مستلزم",
        details: `تم إضافة "${item.name}"`,
      });
      
      res.status(201).json(item);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: error.errors });
      }
      console.error("Error creating item:", error);
      res.status(500).json({ error: "Failed to create item" });
    }
  });

  // Participants
  app.get("/api/participants", async (req, res) => {
    try {
      const participants = await storage.getParticipants();
      res.json(participants);
    } catch (error) {
      console.error("Error fetching participants:", error);
      res.status(500).json({ error: "Failed to fetch participants" });
    }
  });

  app.get("/api/participants/:id", async (req, res) => {
    try {
      const participant = await storage.getParticipant(req.params.id);
      if (!participant) {
        return res.status(404).json({ error: "Participant not found" });
      }
      res.json(participant);
    } catch (error) {
      console.error("Error fetching participant:", error);
      res.status(500).json({ error: "Failed to fetch participant" });
    }
  });

  app.post("/api/participants", async (req, res) => {
    try {
      const data = insertParticipantSchema.parse(req.body);
      const participant = await storage.createParticipant(data);
      
      // Log activity
      await storage.createActivityLog({
        action: "إضافة مشارك",
        details: `تم إضافة "${participant.name}"`,
      });
      
      res.status(201).json(participant);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: error.errors });
      }
      console.error("Error creating participant:", error);
      res.status(500).json({ error: "Failed to create participant" });
    }
  });

  app.patch("/api/participants/:id", async (req, res) => {
    try {
      const data = insertParticipantSchema.partial().parse(req.body);
      const participant = await storage.updateParticipant(req.params.id, data);
      if (!participant) {
        return res.status(404).json({ error: "Participant not found" });
      }
      res.json(participant);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: error.errors });
      }
      console.error("Error updating participant:", error);
      res.status(500).json({ error: "Failed to update participant" });
    }
  });

  app.delete("/api/participants/:id", async (req, res) => {
    try {
      await storage.deleteParticipant(req.params.id);
      res.status(204).send();
    } catch (error) {
      console.error("Error deleting participant:", error);
      res.status(500).json({ error: "Failed to delete participant" });
    }
  });

  // Events
  app.get("/api/events", async (req, res) => {
    try {
      const events = await storage.getEvents();
      res.json(events);
    } catch (error) {
      console.error("Error fetching events:", error);
      res.status(500).json({ error: "Failed to fetch events" });
    }
  });

  app.get("/api/events/:id", async (req, res) => {
    try {
      const eventId = parseInt(req.params.id, 10);
      if (isNaN(eventId)) {
        return res.status(400).json({ error: "Invalid event ID" });
      }
      const event = await storage.getEventWithDetails(eventId);
      if (!event) {
        return res.status(404).json({ error: "Event not found" });
      }
      res.json(event);
    } catch (error) {
      console.error("Error fetching event:", error);
      res.status(500).json({ error: "Failed to fetch event" });
    }
  });

  app.post("/api/events", async (req, res) => {
    try {
      // Extract requiredItems before validation
      const { requiredItems, ...restBody } = req.body;
      
      // Convert date strings to Date objects
      const body = {
        ...restBody,
        date: restBody.date ? new Date(restBody.date) : undefined,
        endDate: restBody.endDate ? new Date(restBody.endDate) : undefined,
      };
      const data = insertEventSchema.parse(body);
      const event = await storage.createEvent(data);
      
      // Create contributions for required items (without participant assigned)
      if (requiredItems && Array.isArray(requiredItems) && requiredItems.length > 0) {
        for (const itemId of requiredItems) {
          await storage.createContribution({
            eventId: event.id,
            itemId,
            participantId: null,
            quantity: 1,
            cost: "0",
            status: "pending",
          });
        }
      }
      
      // Log activity
      await storage.createActivityLog({
        eventId: event.id,
        action: "إنشاء طلعة",
        details: `تم إنشاء طلعة "${event.title}"${requiredItems?.length ? ` مع ${requiredItems.length} مستلزمات` : ""}`,
      });
      
      res.status(201).json(event);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: error.errors });
      }
      console.error("Error creating event:", error);
      res.status(500).json({ error: "Failed to create event" });
    }
  });

  app.patch("/api/events/:id", async (req, res) => {
    try {
      const eventId = parseInt(req.params.id, 10);
      if (isNaN(eventId)) {
        return res.status(400).json({ error: "Invalid event ID" });
      }
      // Convert date strings to Date objects
      const body = {
        ...req.body,
        date: req.body.date ? new Date(req.body.date) : undefined,
        endDate: req.body.endDate ? new Date(req.body.endDate) : undefined,
      };
      const data = insertEventSchema.partial().parse(body);
      const event = await storage.updateEvent(eventId, data);
      if (!event) {
        return res.status(404).json({ error: "Event not found" });
      }
      
      // Log activity
      await storage.createActivityLog({
        eventId: event.id,
        action: "تحديث طلعة",
        details: `تم تحديث طلعة "${event.title}"`,
      });
      
      res.json(event);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: error.errors });
      }
      console.error("Error updating event:", error);
      res.status(500).json({ error: "Failed to update event" });
    }
  });

  app.delete("/api/events/:id", async (req, res) => {
    try {
      const eventId = parseInt(req.params.id, 10);
      if (isNaN(eventId)) {
        return res.status(400).json({ error: "Invalid event ID" });
      }
      
      // Check if event can be deleted (no non-zero cost contributions)
      const { canDelete, reason } = await storage.canDeleteEvent(eventId);
      if (!canDelete) {
        return res.status(400).json({ error: reason });
      }
      
      const event = await storage.getEvent(eventId);
      if (event) {
        await storage.createActivityLog({
          action: "حذف طلعة",
          details: `تم حذف طلعة "${event.title}"`,
        });
      }
      await storage.deleteEvent(eventId);
      res.status(204).send();
    } catch (error) {
      console.error("Error deleting event:", error);
      res.status(500).json({ error: "Failed to delete event" });
    }
  });
  
  // Check if event can be deleted
  app.get("/api/events/:id/can-delete", async (req, res) => {
    try {
      const eventId = parseInt(req.params.id, 10);
      if (isNaN(eventId)) {
        return res.status(400).json({ error: "Invalid event ID" });
      }
      const result = await storage.canDeleteEvent(eventId);
      res.json(result);
    } catch (error) {
      console.error("Error checking event deletion:", error);
      res.status(500).json({ error: "Failed to check event deletion status" });
    }
  });

  // Event Participants
  app.post("/api/events/:eventId/participants", async (req, res) => {
    try {
      const eventId = parseInt(req.params.eventId, 10);
      if (isNaN(eventId)) {
        return res.status(400).json({ error: "Invalid event ID" });
      }
      const data = insertEventParticipantSchema.parse({
        ...req.body,
        eventId,
      });
      const eventParticipant = await storage.addParticipantToEvent(data);
      res.status(201).json(eventParticipant);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: error.errors });
      }
      console.error("Error adding participant to event:", error);
      res.status(500).json({ error: "Failed to add participant to event" });
    }
  });

  app.delete("/api/events/:eventId/participants/:participantId", async (req, res) => {
    try {
      const eventId = parseInt(req.params.eventId, 10);
      if (isNaN(eventId)) {
        return res.status(400).json({ error: "Invalid event ID" });
      }
      // Use cascade delete to remove all contributions by this participant
      await storage.removeParticipantFromEventWithCascade(eventId, req.params.participantId);
      res.status(204).send();
    } catch (error) {
      console.error("Error removing participant from event:", error);
      res.status(500).json({ error: "Failed to remove participant from event" });
    }
  });

  // Add participant with required contributions
  app.post("/api/events/:eventId/participants-with-contributions", async (req, res) => {
    try {
      const eventId = parseInt(req.params.eventId, 10);
      if (isNaN(eventId)) {
        return res.status(400).json({ error: "Invalid event ID" });
      }
      const { participantId, itemIds, costs } = req.body;
      
      if (!participantId) {
        return res.status(400).json({ error: "Participant ID is required" });
      }
      
      if (!itemIds || !Array.isArray(itemIds) || itemIds.length === 0) {
        return res.status(400).json({ error: "At least one item is required" });
      }
      
      const result = await storage.addParticipantWithContributions(
        eventId,
        participantId,
        itemIds,
        costs
      );
      
      res.status(201).json(result);
    } catch (error) {
      console.error("Error adding participant with contributions:", error);
      res.status(500).json({ error: "Failed to add participant with contributions" });
    }
  });

  // Contributions
  app.get("/api/events/:eventId/contributions", async (req, res) => {
    try {
      const eventId = parseInt(req.params.eventId, 10);
      if (isNaN(eventId)) {
        return res.status(400).json({ error: "Invalid event ID" });
      }
      const contributions = await storage.getContributions(eventId);
      res.json(contributions);
    } catch (error) {
      console.error("Error fetching contributions:", error);
      res.status(500).json({ error: "Failed to fetch contributions" });
    }
  });

  app.post("/api/events/:eventId/contributions", async (req, res) => {
    try {
      const eventId = parseInt(req.params.eventId, 10);
      if (isNaN(eventId)) {
        return res.status(400).json({ error: "Invalid event ID" });
      }
      const data = insertContributionSchema.parse({
        ...req.body,
        eventId,
      });
      const contribution = await storage.createContribution(data);
      res.status(201).json(contribution);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: error.errors });
      }
      console.error("Error creating contribution:", error);
      res.status(500).json({ error: "Failed to create contribution" });
    }
  });

  app.patch("/api/contributions/:id", async (req, res) => {
    try {
      const data = insertContributionSchema.partial().parse(req.body);
      const contribution = await storage.updateContribution(req.params.id, data);
      if (!contribution) {
        return res.status(404).json({ error: "Contribution not found" });
      }
      res.json(contribution);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: error.errors });
      }
      console.error("Error updating contribution:", error);
      res.status(500).json({ error: "Failed to update contribution" });
    }
  });

  app.post("/api/contributions/:id/unassign", async (req, res) => {
    try {
      // Unassign contribution (reset to pending) and prune participant if no other contributions
      const result = await storage.unassignContribution(req.params.id);
      res.json({ unassigned: result.unassigned, participantPruned: result.participantPruned });
    } catch (error) {
      console.error("Error unassigning contribution:", error);
      res.status(500).json({ error: "Failed to unassign contribution" });
    }
  });

  app.delete("/api/contributions/:id", async (req, res) => {
    try {
      // Use cascade delete to auto-remove participant if no contributions remain
      const result = await storage.deleteContributionAndPruneParticipant(req.params.id);
      res.json({ deleted: result.deleted, participantPruned: result.participantPruned });
    } catch (error) {
      console.error("Error deleting contribution:", error);
      res.status(500).json({ error: "Failed to delete contribution" });
    }
  });

  // Activity Logs
  app.get("/api/activity-logs", async (req, res) => {
    try {
      const limit = parseInt(req.query.limit as string) || 100;
      const logs = await storage.getActivityLogs(limit);
      res.json(logs);
    } catch (error) {
      console.error("Error fetching activity logs:", error);
      res.status(500).json({ error: "Failed to fetch activity logs" });
    }
  });

  // Settlements
  app.get("/api/settlements", async (req, res) => {
    try {
      const settlements = await storage.getAllSettlements();
      res.json(settlements);
    } catch (error) {
      console.error("Error fetching settlements:", error);
      res.status(500).json({ error: "Failed to fetch settlements" });
    }
  });

  app.get("/api/events/:eventId/settlement", async (req, res) => {
    try {
      const eventId = parseInt(req.params.eventId, 10);
      if (isNaN(eventId)) {
        return res.status(400).json({ error: "Invalid event ID" });
      }
      const settlement = await storage.getEventSettlement(eventId);
      if (!settlement) {
        return res.status(404).json({ error: "Event not found" });
      }
      res.json(settlement);
    } catch (error) {
      console.error("Error fetching event settlement:", error);
      res.status(500).json({ error: "Failed to fetch event settlement" });
    }
  });

  app.patch("/api/events/:eventId/settlements/:debtorId/:creditorId", async (req, res) => {
    try {
      const eventId = parseInt(req.params.eventId, 10);
      if (isNaN(eventId)) {
        return res.status(400).json({ error: "Invalid event ID" });
      }
      const { debtorId, creditorId } = req.params;
      
      const updated = await storage.toggleSettlementStatus(eventId, debtorId, creditorId);
      if (!updated) {
        return res.status(404).json({ error: "Settlement record not found" });
      }
      res.json(updated);
    } catch (error) {
      console.error("Error toggling settlement status:", error);
      res.status(500).json({ error: "Failed to toggle settlement status" });
    }
  });

  // Debt Portfolio Routes
  app.get("/api/debt", async (req, res) => {
    try {
      const summaries = await storage.getDebtSummaries();
      res.json(summaries);
    } catch (error) {
      console.error("Error fetching debt summaries:", error);
      res.status(500).json({ error: "Failed to fetch debt summaries" });
    }
  });

  app.get("/api/debt/:participantId", async (req, res) => {
    try {
      const portfolio = await storage.getDebtPortfolio(req.params.participantId);
      if (!portfolio) {
        return res.status(404).json({ error: "Participant not found" });
      }
      res.json(portfolio);
    } catch (error) {
      console.error("Error fetching debt portfolio:", error);
      res.status(500).json({ error: "Failed to fetch debt portfolio" });
    }
  });

  // Settlement Activity Log - immutable audit trail
  app.get("/api/settlement-activity-log", async (req, res) => {
    try {
      const limit = parseInt(req.query.limit as string) || 100;
      const logs = await storage.getSettlementActivityLogs(limit);
      res.json(logs);
    } catch (error) {
      console.error("Error fetching settlement activity logs:", error);
      res.status(500).json({ error: "Failed to fetch settlement activity logs" });
    }
  });

  return httpServer;
}