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
import { ObjectStorageService, ObjectNotFoundError } from "./objectStorage";
import { setupManualAuth, isManualAuthenticated as isAuthenticated } from "./manualAuth";

export async function registerRoutes(
  httpServer: Server,
  app: Express
): Promise<Server> {
  
  // Setup manual authentication routes
  setupManualAuth(app);

  // Users endpoint removed for privacy - users should not see other users
  // Participant invitation is now done via email only

  // Stats
  app.get("/api/stats", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.session!.userId!;
      
      // Check if user is admin
      const user = await storage.getUser(userId);
      if (user?.isAdmin) {
        // Admins see global stats
        const stats = await storage.getStats();
        return res.json(stats);
      }
      
      // Regular users see only their stats
      const stats = await storage.getStatsForUser(userId);
      res.json(stats);
    } catch (error) {
      console.error("Error fetching stats:", error);
      res.status(500).json({ error: "Failed to fetch stats" });
    }
  });

  // Categories
  app.get("/api/categories", async (req: any, res) => {
    try {
      const withItems = req.query.withItems === "true";
      if (withItems) {
        // Get user info for filtering items
        const userId = req.session?.userId;
        let isAdmin = false;
        if (userId) {
          const user = await storage.getUser(userId);
          isAdmin = user?.isAdmin ?? false;
        }
        const categories = await storage.getCategoriesWithItems(userId, isAdmin);
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
      
      // Log activity
      await storage.createActivityLog({
        action: "إضافة فئة",
        details: `تم إضافة فئة "${category.nameAr}"`,
      });
      
      res.status(201).json(category);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: error.errors });
      }
      console.error("Error creating category:", error);
      res.status(500).json({ error: "Failed to create category" });
    }
  });

  app.patch("/api/categories/:id", async (req, res) => {
    try {
      const data = insertCategorySchema.partial().parse(req.body);
      const category = await storage.updateCategory(req.params.id, data);
      if (!category) {
        return res.status(404).json({ error: "Category not found" });
      }
      
      // Log activity
      await storage.createActivityLog({
        action: "تعديل فئة",
        details: `تم تعديل فئة "${category.nameAr}"`,
      });
      
      res.json(category);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: error.errors });
      }
      console.error("Error updating category:", error);
      res.status(500).json({ error: "Failed to update category" });
    }
  });

  app.delete("/api/categories/:id", async (req, res) => {
    try {
      const category = await storage.getCategory(req.params.id);
      if (!category) {
        return res.status(404).json({ error: "Category not found" });
      }
      
      const deleted = await storage.deleteCategory(req.params.id);
      if (deleted) {
        // Log activity
        await storage.createActivityLog({
          action: "حذف فئة",
          details: `تم حذف فئة "${category.nameAr}" وجميع مستلزماتها`,
        });
        
        res.json({ success: true });
      } else {
        res.status(404).json({ error: "Category not found" });
      }
    } catch (error) {
      console.error("Error deleting category:", error);
      res.status(500).json({ error: "Failed to delete category" });
    }
  });

  // Items - with ownership control
  // GET items: authenticated users see system items + their own items, admins see all
  app.get("/api/items", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.session!.userId!;
      const user = await storage.getUser(userId);
      const categoryId = req.query.categoryId as string;
      
      // Admins see all items, regular users see system + their own
      let itemsList;
      if (user?.isAdmin) {
        itemsList = categoryId 
          ? await storage.getItemsByCategory(categoryId)
          : await storage.getItems();
      } else {
        itemsList = await storage.getItemsForUser(userId);
        if (categoryId) {
          itemsList = itemsList.filter(item => item.categoryId === categoryId);
        }
      }
      res.json(itemsList);
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

  // POST items: users create their own items (ownerId = userId)
  app.post("/api/items", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.session!.userId!;
      const data = insertItemSchema.parse(req.body);
      
      // Set ownerId to current user (users create their own items)
      const item = await storage.createItem({ ...data, ownerId: userId });
      
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

  // PATCH items: users can only edit their own items, admins can edit system items
  app.patch("/api/items/:id", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.session!.userId!;
      const user = await storage.getUser(userId);
      const existingItem = await storage.getItem(req.params.id);
      
      if (!existingItem) {
        return res.status(404).json({ error: "Item not found" });
      }
      
      // Check ownership: user can edit own items, admin can edit system items
      const isSystemItem = existingItem.ownerId === null;
      const isOwnItem = existingItem.ownerId === userId;
      
      if (isSystemItem && !user?.isAdmin) {
        return res.status(403).json({ error: "لا يمكن تعديل مستلزمات النظام" });
      }
      if (!isSystemItem && !isOwnItem && !user?.isAdmin) {
        return res.status(403).json({ error: "لا يمكنك تعديل هذا المستلزم" });
      }
      
      const data = insertItemSchema.partial().parse(req.body);
      // Don't allow changing ownerId
      delete (data as any).ownerId;
      
      const item = await storage.updateItem(req.params.id, data);
      if (!item) {
        return res.status(404).json({ error: "Item not found" });
      }
      
      // Log activity
      await storage.createActivityLog({
        action: "تعديل مستلزم",
        details: `تم تعديل "${item.name}"`,
      });
      
      res.json(item);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: error.errors });
      }
      console.error("Error updating item:", error);
      res.status(500).json({ error: "Failed to update item" });
    }
  });

  // DELETE items: users can only delete their own items, admins can delete system items
  app.delete("/api/items/:id", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.session!.userId!;
      const user = await storage.getUser(userId);
      const item = await storage.getItem(req.params.id);
      
      if (!item) {
        return res.status(404).json({ error: "Item not found" });
      }
      
      // Check ownership: user can delete own items, admin can delete system items
      const isSystemItem = item.ownerId === null;
      const isOwnItem = item.ownerId === userId;
      
      if (isSystemItem && !user?.isAdmin) {
        return res.status(403).json({ error: "لا يمكن حذف مستلزمات النظام" });
      }
      if (!isSystemItem && !isOwnItem && !user?.isAdmin) {
        return res.status(403).json({ error: "لا يمكنك حذف هذا المستلزم" });
      }
      
      const deleted = await storage.deleteItem(req.params.id);
      if (!deleted) {
        return res.status(404).json({ error: "Item not found" });
      }
      
      // Log activity
      await storage.createActivityLog({
        action: "حذف مستلزم",
        details: `تم حذف "${item.name}"`,
      });
      
      res.json({ success: true });
    } catch (error) {
      console.error("Error deleting item:", error);
      res.status(500).json({ error: "Failed to delete item" });
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
      // Check if participant can be deleted (no unsettled debts)
      const { canDelete, reason } = await storage.canDeleteParticipant(req.params.id);
      if (!canDelete) {
        return res.status(409).json({ error: reason });
      }
      
      await storage.deleteParticipant(req.params.id);
      res.status(204).send();
    } catch (error) {
      console.error("Error deleting participant:", error);
      res.status(500).json({ error: "Failed to delete participant" });
    }
  });

  // Events - with access control (users only see their own events, admins see all)
  app.get("/api/events", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.session!.userId!;
      // Sync event statuses based on current date before returning
      await storage.syncEventStatuses();
      
      // Check if user is admin
      const user = await storage.getUser(userId);
      if (user?.isAdmin) {
        // Admins see all events
        const events = await storage.getEvents();
        return res.json(events);
      }
      
      // Regular users only see events they're participating in
      const events = await storage.getEventsForUser(userId);
      res.json(events);
    } catch (error) {
      console.error("Error fetching events:", error);
      res.status(500).json({ error: "Failed to fetch events" });
    }
  });

  app.get("/api/events/:id", isAuthenticated, async (req: any, res) => {
    try {
      const eventId = parseInt(req.params.id, 10);
      if (isNaN(eventId)) {
        return res.status(400).json({ error: "Invalid event ID" });
      }
      
      const userId = req.session!.userId!;
      
      // Check if user is admin - admins can access all events
      const user = await storage.getUser(userId);
      if (!user?.isAdmin) {
        // Regular users - check if they have access to this event
        const canAccess = await storage.canUserAccessEvent(eventId, userId);
        if (!canAccess) {
          return res.status(403).json({ error: "Access denied" });
        }
      }
      
      // Sync event statuses before returning single event
      await storage.syncEventStatuses();
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

  app.post("/api/events", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.session!.userId!;
      
      // Extract requiredItems before validation
      const { requiredItems, ...restBody } = req.body;
      
      // Convert date strings to Date objects
      const body = {
        ...restBody,
        date: restBody.date ? new Date(restBody.date) : undefined,
        endDate: restBody.endDate ? new Date(restBody.endDate) : undefined,
      };
      const data = insertEventSchema.parse(body);
      
      // Create event with creator as organizer (auto-adds creator as participant)
      const event = await storage.createEventWithCreator(data, userId);
      
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

  app.patch("/api/events/:id", isAuthenticated, async (req: any, res) => {
    try {
      const eventId = parseInt(req.params.id, 10);
      if (isNaN(eventId)) {
        return res.status(400).json({ error: "Invalid event ID" });
      }
      
      const userId = req.session!.userId!;
      
      // Check if user is admin - admins can edit all events
      const user = await storage.getUser(userId);
      if (!user?.isAdmin) {
        // Regular users need edit permission
        const canEdit = await storage.canUserEditEvent(eventId, userId);
        if (!canEdit) {
          return res.status(403).json({ error: "Access denied - you don't have permission to edit this event" });
        }
      }
      
      // Check if trying to cancel - prevent if event has settlements
      if (req.body.status === "cancelled") {
        const { canCancel, reason } = await storage.canCancelEvent(eventId);
        if (!canCancel) {
          return res.status(400).json({ error: reason });
        }
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

  app.delete("/api/events/:id", isAuthenticated, async (req: any, res) => {
    try {
      const eventId = parseInt(req.params.id, 10);
      if (isNaN(eventId)) {
        return res.status(400).json({ error: "Invalid event ID" });
      }
      
      const userId = req.session!.userId!;
      
      // Check if user is admin - admins can delete all events
      const user = await storage.getUser(userId);
      if (!user?.isAdmin) {
        // Regular users need edit permission to delete
        const canEdit = await storage.canUserEditEvent(eventId, userId);
        if (!canEdit) {
          return res.status(403).json({ error: "Access denied - you don't have permission to delete this event" });
        }
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

  // Enable sharing for an event
  app.post("/api/events/:id/share", isAuthenticated, async (req: any, res) => {
    try {
      const eventId = parseInt(req.params.id, 10);
      if (isNaN(eventId)) {
        return res.status(400).json({ error: "Invalid event ID" });
      }
      
      const userId = req.session!.userId!;
      
      // Check if user is admin or has edit permission
      const user = await storage.getUser(userId);
      if (!user?.isAdmin) {
        const canEdit = await storage.canUserEditEvent(eventId, userId);
        if (!canEdit) {
          return res.status(403).json({ error: "Access denied - only event organizers can enable sharing" });
        }
      }
      
      const result = await storage.enableEventSharing(eventId);
      if (!result) {
        return res.status(404).json({ error: "Event not found" });
      }
      
      await storage.createActivityLog({
        action: "تفعيل المشاركة",
        details: `تم تفعيل مشاركة الطلعة`,
      });
      
      res.json(result);
    } catch (error) {
      console.error("Error enabling share:", error);
      res.status(500).json({ error: "Failed to enable sharing" });
    }
  });

  // Disable sharing for an event
  app.delete("/api/events/:id/share", isAuthenticated, async (req: any, res) => {
    try {
      const eventId = parseInt(req.params.id, 10);
      if (isNaN(eventId)) {
        return res.status(400).json({ error: "Invalid event ID" });
      }
      
      const userId = req.session!.userId!;
      
      // Check if user is admin or has edit permission
      const user = await storage.getUser(userId);
      if (!user?.isAdmin) {
        const canEdit = await storage.canUserEditEvent(eventId, userId);
        if (!canEdit) {
          return res.status(403).json({ error: "Access denied - only event organizers can disable sharing" });
        }
      }
      
      await storage.disableEventSharing(eventId);
      
      await storage.createActivityLog({
        action: "إيقاف المشاركة",
        details: `تم إيقاف مشاركة الطلعة`,
      });
      
      res.status(204).send();
    } catch (error) {
      console.error("Error disabling share:", error);
      res.status(500).json({ error: "Failed to disable sharing" });
    }
  });

  // Get shared event by token
  app.get("/api/shared/:token", async (req, res) => {
    try {
      const event = await storage.getEventWithDetailsByShareToken(req.params.token);
      if (!event) {
        return res.status(404).json({ error: "Shared event not found or sharing disabled" });
      }
      res.json(event);
    } catch (error) {
      console.error("Error getting shared event:", error);
      res.status(500).json({ error: "Failed to get shared event" });
    }
  });

  // Update shared event by token
  app.patch("/api/shared/:token", async (req, res) => {
    try {
      const event = await storage.getEventByShareToken(req.params.token);
      if (!event || !event.isShareEnabled) {
        return res.status(404).json({ error: "Shared event not found or sharing disabled" });
      }
      
      const data = insertEventSchema.partial().parse(req.body);
      const updated = await storage.updateEvent(event.id, data);
      res.json(updated);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: error.errors });
      }
      console.error("Error updating shared event:", error);
      res.status(500).json({ error: "Failed to update shared event" });
    }
  });

  // Add participant to shared event
  app.post("/api/shared/:token/participants", async (req, res) => {
    try {
      const event = await storage.getEventByShareToken(req.params.token);
      if (!event || !event.isShareEnabled) {
        return res.status(404).json({ error: "Shared event not found or sharing disabled" });
      }
      
      const data = insertEventParticipantSchema.parse({
        ...req.body,
        eventId: event.id,
      });
      const ep = await storage.addParticipantToEvent(data);
      res.status(201).json(ep);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: error.errors });
      }
      console.error("Error adding participant to shared event:", error);
      res.status(500).json({ error: "Failed to add participant" });
    }
  });

  // Remove participant from shared event
  app.delete("/api/shared/:token/participants/:participantId", async (req, res) => {
    try {
      const event = await storage.getEventByShareToken(req.params.token);
      if (!event || !event.isShareEnabled) {
        return res.status(404).json({ error: "Shared event not found or sharing disabled" });
      }
      
      await storage.removeParticipantFromEventWithCascade(event.id, req.params.participantId);
      res.status(204).send();
    } catch (error) {
      console.error("Error removing participant from shared event:", error);
      res.status(500).json({ error: "Failed to remove participant" });
    }
  });

  // Add contribution to shared event
  app.post("/api/shared/:token/contributions", async (req, res) => {
    try {
      const event = await storage.getEventByShareToken(req.params.token);
      if (!event || !event.isShareEnabled) {
        return res.status(404).json({ error: "Shared event not found or sharing disabled" });
      }
      
      // Validate participantId if provided and not null - must be part of this event
      const participantId = req.body.participantId;
      if (participantId !== undefined && participantId !== null && participantId !== "") {
        const eventParticipants = await storage.getEventParticipants(event.id);
        const isValidParticipant = eventParticipants.some(
          ep => ep.participantId === participantId
        );
        if (!isValidParticipant) {
          return res.status(403).json({ error: "Participant is not part of this event" });
        }
      }
      
      const data = insertContributionSchema.parse({
        ...req.body,
        eventId: event.id,
        // Normalize empty string to null
        participantId: participantId === "" ? null : participantId,
      });
      const contribution = await storage.createContribution(data);
      res.status(201).json(contribution);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: error.errors });
      }
      console.error("Error adding contribution to shared event:", error);
      res.status(500).json({ error: "Failed to add contribution" });
    }
  });

  // Update contribution in shared event
  app.patch("/api/shared/:token/contributions/:id", async (req, res) => {
    try {
      const event = await storage.getEventByShareToken(req.params.token);
      if (!event || !event.isShareEnabled) {
        return res.status(404).json({ error: "Shared event not found or sharing disabled" });
      }
      
      // Verify contribution belongs to this event
      const contribution = await storage.getContribution(req.params.id);
      if (!contribution || contribution.eventId !== event.id) {
        return res.status(403).json({ error: "Contribution does not belong to this event" });
      }
      
      // Validate participantId if being changed - must be part of this event or null/empty
      const participantId = req.body.participantId;
      if ("participantId" in req.body) {
        // Allow null or empty string (unassign) but validate non-empty values
        if (participantId !== undefined && participantId !== null && participantId !== "") {
          const eventParticipants = await storage.getEventParticipants(event.id);
          const isValidParticipant = eventParticipants.some(
            ep => ep.participantId === participantId
          );
          if (!isValidParticipant) {
            return res.status(403).json({ error: "Participant is not part of this event" });
          }
        }
      }
      
      const data = insertContributionSchema.partial().parse(req.body);
      // Ensure eventId and itemId cannot be changed
      delete (data as any).eventId;
      delete (data as any).itemId;
      // Normalize empty string to null for participantId
      if ((data as any).participantId === "") {
        (data as any).participantId = null;
      }
      
      const updated = await storage.updateContribution(req.params.id, data);
      if (!updated) {
        return res.status(404).json({ error: "Contribution not found" });
      }
      res.json(updated);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: error.errors });
      }
      console.error("Error updating contribution:", error);
      res.status(500).json({ error: "Failed to update contribution" });
    }
  });

  // Delete contribution from shared event
  app.delete("/api/shared/:token/contributions/:id", async (req, res) => {
    try {
      const event = await storage.getEventByShareToken(req.params.token);
      if (!event || !event.isShareEnabled) {
        return res.status(404).json({ error: "Shared event not found or sharing disabled" });
      }
      
      // Verify contribution belongs to this event
      const contribution = await storage.getContribution(req.params.id);
      if (!contribution || contribution.eventId !== event.id) {
        return res.status(403).json({ error: "Contribution does not belong to this event" });
      }
      
      await storage.deleteContribution(req.params.id);
      res.status(204).send();
    } catch (error) {
      console.error("Error deleting contribution:", error);
      res.status(500).json({ error: "Failed to delete contribution" });
    }
  });
  
  // Check if event can be deleted
  app.get("/api/events/:id/can-delete", isAuthenticated, async (req: any, res) => {
    try {
      const eventId = parseInt(req.params.id, 10);
      if (isNaN(eventId)) {
        return res.status(400).json({ error: "Invalid event ID" });
      }
      
      const userId = req.session!.userId!;
      const canAccess = await storage.canUserAccessEvent(eventId, userId);
      if (!canAccess) {
        return res.status(403).json({ error: "Access denied" });
      }
      
      const result = await storage.canDeleteEvent(eventId);
      res.json(result);
    } catch (error) {
      console.error("Error checking event deletion:", error);
      res.status(500).json({ error: "Failed to check event deletion status" });
    }
  });
  
  // Check if event can be cancelled
  app.get("/api/events/:id/can-cancel", isAuthenticated, async (req: any, res) => {
    try {
      const eventId = parseInt(req.params.id, 10);
      if (isNaN(eventId)) {
        return res.status(400).json({ error: "Invalid event ID" });
      }
      
      const userId = req.session!.userId!;
      const canAccess = await storage.canUserAccessEvent(eventId, userId);
      if (!canAccess) {
        return res.status(403).json({ error: "Access denied" });
      }
      
      const result = await storage.canCancelEvent(eventId);
      res.json(result);
    } catch (error) {
      console.error("Error checking event cancellation:", error);
      res.status(500).json({ error: "Failed to check event cancellation status" });
    }
  });

  // Event Participants
  app.post("/api/events/:eventId/participants", isAuthenticated, async (req: any, res) => {
    try {
      const eventId = parseInt(req.params.eventId, 10);
      if (isNaN(eventId)) {
        return res.status(400).json({ error: "Invalid event ID" });
      }
      
      const userId = req.session!.userId!;
      
      // Check if user can manage participants
      const user = await storage.getUser(userId);
      if (!user?.isAdmin) {
        const canManage = await storage.canUserManageParticipants(eventId, userId);
        if (!canManage) {
          return res.status(403).json({ error: "Access denied - you don't have permission to manage participants" });
        }
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

  app.delete("/api/events/:eventId/participants/:participantId", isAuthenticated, async (req: any, res) => {
    try {
      const eventId = parseInt(req.params.eventId, 10);
      if (isNaN(eventId)) {
        return res.status(400).json({ error: "Invalid event ID" });
      }
      
      const userId = req.session!.userId!;
      
      // Check if user can manage participants
      const user = await storage.getUser(userId);
      if (!user?.isAdmin) {
        const canManage = await storage.canUserManageParticipants(eventId, userId);
        if (!canManage) {
          return res.status(403).json({ error: "Access denied - you don't have permission to manage participants" });
        }
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
  app.post("/api/events/:eventId/participants-with-contributions", isAuthenticated, async (req: any, res) => {
    try {
      const eventId = parseInt(req.params.eventId, 10);
      if (isNaN(eventId)) {
        return res.status(400).json({ error: "Invalid event ID" });
      }
      
      const userId = req.session!.userId!;
      
      // Check if user can manage participants
      const user = await storage.getUser(userId);
      if (!user?.isAdmin) {
        const canManage = await storage.canUserManageParticipants(eventId, userId);
        if (!canManage) {
          return res.status(403).json({ error: "Access denied - you don't have permission to manage participants" });
        }
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
  app.get("/api/events/:eventId/contributions", isAuthenticated, async (req: any, res) => {
    try {
      const eventId = parseInt(req.params.eventId, 10);
      if (isNaN(eventId)) {
        return res.status(400).json({ error: "Invalid event ID" });
      }
      
      const userId = req.session!.userId!;
      const canAccess = await storage.canUserAccessEvent(eventId, userId);
      if (!canAccess) {
        return res.status(403).json({ error: "Access denied" });
      }
      
      const contributions = await storage.getContributions(eventId);
      res.json(contributions);
    } catch (error) {
      console.error("Error fetching contributions:", error);
      res.status(500).json({ error: "Failed to fetch contributions" });
    }
  });

  app.post("/api/events/:eventId/contributions", isAuthenticated, async (req: any, res) => {
    try {
      const eventId = parseInt(req.params.eventId, 10);
      if (isNaN(eventId)) {
        return res.status(400).json({ error: "Invalid event ID" });
      }
      
      const userId = req.session!.userId!;
      const canAccess = await storage.canUserAccessEvent(eventId, userId);
      if (!canAccess) {
        return res.status(403).json({ error: "Access denied" });
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

  app.patch("/api/contributions/:id", isAuthenticated, async (req: any, res) => {
    try {
      // Get contribution first to find its event
      const existing = await storage.getContribution(req.params.id);
      if (!existing) {
        return res.status(404).json({ error: "Contribution not found" });
      }
      
      const userId = req.session!.userId!;
      const canAccess = await storage.canUserAccessEvent(existing.eventId, userId);
      if (!canAccess) {
        return res.status(403).json({ error: "Access denied" });
      }
      
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

  app.post("/api/contributions/:id/unassign", isAuthenticated, async (req: any, res) => {
    try {
      // Get contribution first to find its event
      const existing = await storage.getContribution(req.params.id);
      if (!existing) {
        return res.status(404).json({ error: "Contribution not found" });
      }
      
      const userId = req.session!.userId!;
      const canAccess = await storage.canUserAccessEvent(existing.eventId, userId);
      if (!canAccess) {
        return res.status(403).json({ error: "Access denied" });
      }
      
      // Unassign contribution (reset to pending) and prune participant if no other contributions
      const result = await storage.unassignContribution(req.params.id);
      res.json({ unassigned: result.unassigned, participantPruned: result.participantPruned });
    } catch (error) {
      console.error("Error unassigning contribution:", error);
      res.status(500).json({ error: "Failed to unassign contribution" });
    }
  });

  app.delete("/api/contributions/:id", isAuthenticated, async (req: any, res) => {
    try {
      // Get contribution first to find its event
      const existing = await storage.getContribution(req.params.id);
      if (!existing) {
        return res.status(404).json({ error: "Contribution not found" });
      }
      
      const userId = req.session!.userId!;
      const canAccess = await storage.canUserAccessEvent(existing.eventId, userId);
      if (!canAccess) {
        return res.status(403).json({ error: "Access denied" });
      }
      
      // Use cascade delete to auto-remove participant if no contributions remain
      const result = await storage.deleteContributionAndPruneParticipant(req.params.id);
      res.json({ deleted: result.deleted, participantPruned: result.participantPruned });
    } catch (error) {
      console.error("Error deleting contribution:", error);
      res.status(500).json({ error: "Failed to delete contribution" });
    }
  });

  // Activity Logs - filtered by user's events (admins see all)
  app.get("/api/activity-logs", isAuthenticated, async (req: any, res) => {
    try {
      const limit = parseInt(req.query.limit as string) || 100;
      const userId = req.session!.userId!;
      
      // Check if user is admin
      const user = await storage.getUser(userId);
      if (user?.isAdmin) {
        // Admins see all activity logs
        const logs = await storage.getActivityLogs(limit);
        return res.json(logs);
      }
      
      // Regular users only see logs for events they participate in
      const userEvents = await storage.getEventsForUser(userId);
      const userEventIds = userEvents.map(e => e.id);
      
      if (userEventIds.length === 0) {
        return res.json([]);
      }
      
      const allLogs = await storage.getActivityLogs(limit * 10); // Get more to filter
      const filteredLogs = allLogs
        .filter(log => log.eventId && userEventIds.includes(log.eventId))
        .slice(0, limit);
      
      res.json(filteredLogs);
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

  app.get("/api/events/:eventId/settlement", isAuthenticated, async (req: any, res) => {
    try {
      const eventId = parseInt(req.params.eventId, 10);
      if (isNaN(eventId)) {
        return res.status(400).json({ error: "Invalid event ID" });
      }
      
      const userId = req.session!.userId!;
      const canAccess = await storage.canUserAccessEvent(eventId, userId);
      if (!canAccess) {
        return res.status(403).json({ error: "Access denied" });
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

  app.patch("/api/events/:eventId/settlements/:debtorId/:creditorId", isAuthenticated, async (req: any, res) => {
    try {
      const eventId = parseInt(req.params.eventId, 10);
      if (isNaN(eventId)) {
        return res.status(400).json({ error: "Invalid event ID" });
      }
      
      const userId = req.session!.userId!;
      const canAccess = await storage.canUserAccessEvent(eventId, userId);
      if (!canAccess) {
        return res.status(403).json({ error: "Access denied" });
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

  // Debt Portfolio Routes - admins see all, users see only their own
  app.get("/api/debt", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.session!.userId!;
      const user = await storage.getUser(userId);
      
      if (user?.isAdmin) {
        // Admins see all debt summaries
        const summaries = await storage.getDebtSummaries();
        return res.json(summaries);
      }
      
      // Regular users: find their participant and show only their debt
      const participant = await storage.getParticipantByUserId(userId);
      if (!participant) {
        return res.json([]); // No participant linked, no debts
      }
      
      // Get only this user's debt summary using scoped query (no privacy leak)
      const userSummary = await storage.getDebtSummaryForParticipant(participant.id);
      res.json(userSummary ? [userSummary] : []);
    } catch (error) {
      console.error("Error fetching debt summaries:", error);
      res.status(500).json({ error: "Failed to fetch debt summaries" });
    }
  });

  app.get("/api/debt/:participantId", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.session!.userId!;
      const user = await storage.getUser(userId);
      const { participantId } = req.params;
      
      // Check access: admins can access any, users can only access their own
      if (!user?.isAdmin) {
        const userParticipant = await storage.getParticipantByUserId(userId);
        if (!userParticipant || userParticipant.id !== participantId) {
          return res.status(403).json({ error: "Access denied" });
        }
      }
      
      const portfolio = await storage.getDebtPortfolio(participantId);
      if (!portfolio) {
        return res.status(404).json({ error: "Participant not found" });
      }
      res.json(portfolio);
    } catch (error) {
      console.error("Error fetching debt portfolio:", error);
      res.status(500).json({ error: "Failed to fetch debt portfolio" });
    }
  });

  // Settlement Activity Log - admins see all, users see only their events
  app.get("/api/settlement-activity-log", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.session!.userId!;
      const user = await storage.getUser(userId);
      const limit = parseInt(req.query.limit as string) || 100;
      
      if (user?.isAdmin) {
        // Admins see all logs
        const logs = await storage.getSettlementActivityLogs(limit);
        return res.json(logs);
      }
      
      // Regular users: filter logs by their events
      const logs = await storage.getSettlementActivityLogsForUser(userId, limit);
      res.json(logs);
    } catch (error) {
      console.error("Error fetching settlement activity logs:", error);
      res.status(500).json({ error: "Failed to fetch settlement activity logs" });
    }
  });

  // Weather API - fetch weather from Open-Meteo (free, no API key)
  app.get("/api/weather", async (req, res) => {
    try {
      const { lat, lng, date } = req.query;
      
      if (!lat || !lng) {
        return res.status(400).json({ error: "Latitude and longitude are required" });
      }
      
      const latitude = parseFloat(lat as string);
      const longitude = parseFloat(lng as string);
      
      if (isNaN(latitude) || isNaN(longitude)) {
        return res.status(400).json({ error: "Invalid coordinates" });
      }
      
      // Use Open-Meteo API (free, no key required)
      const targetDate = date ? new Date(date as string) : new Date();
      const dateStr = targetDate.toISOString().split('T')[0];
      
      const url = `https://api.open-meteo.com/v1/forecast?latitude=${latitude}&longitude=${longitude}&daily=temperature_2m_max,temperature_2m_min,weathercode&start_date=${dateStr}&end_date=${dateStr}&timezone=auto`;
      
      const response = await fetch(url);
      if (!response.ok) {
        throw new Error("Failed to fetch weather data");
      }
      
      const data = await response.json();
      
      // Map weather codes to Arabic descriptions
      const weatherCodeMap: Record<number, string> = {
        0: "صافي",
        1: "صافي غالباً",
        2: "غائم جزئياً",
        3: "غائم",
        45: "ضباب",
        48: "ضباب متجمد",
        51: "رذاذ خفيف",
        53: "رذاذ متوسط",
        55: "رذاذ كثيف",
        61: "مطر خفيف",
        63: "مطر متوسط",
        65: "مطر غزير",
        71: "ثلج خفيف",
        73: "ثلج متوسط",
        75: "ثلج كثيف",
        77: "حبات ثلج",
        80: "زخات خفيفة",
        81: "زخات متوسطة",
        82: "زخات غزيرة",
        85: "زخات ثلجية خفيفة",
        86: "زخات ثلجية كثيفة",
        95: "عاصفة رعدية",
        96: "عاصفة رعدية مع برد",
        99: "عاصفة رعدية مع برد كثيف",
      };
      
      const weatherCode = data.daily?.weathercode?.[0] || 0;
      const tempMax = data.daily?.temperature_2m_max?.[0];
      const tempMin = data.daily?.temperature_2m_min?.[0];
      const avgTemp = tempMax && tempMin ? Math.round((tempMax + tempMin) / 2) : null;
      
      res.json({
        weather: weatherCodeMap[weatherCode] || "غير معروف",
        temperature: avgTemp,
        tempMax,
        tempMin,
        weatherCode,
      });
    } catch (error) {
      console.error("Error fetching weather:", error);
      res.status(500).json({ error: "Failed to fetch weather data" });
    }
  });

  // Sync event statuses based on current date
  app.post("/api/events/sync-statuses", async (req, res) => {
    try {
      await storage.syncEventStatuses();
      res.json({ success: true });
    } catch (error) {
      console.error("Error syncing event statuses:", error);
      res.status(500).json({ error: "Failed to sync event statuses" });
    }
  });

  // Export all data as JSON snapshot
  app.get("/api/export", async (req, res) => {
    try {
      const [
        categories,
        items,
        participants,
        events,
        activityLogs,
        settlementActivityLogs,
        settlementRecords,
        debtSummaries,
      ] = await Promise.all([
        storage.getCategories(),
        storage.getItems(),
        storage.getParticipants(),
        storage.getEvents(),
        storage.getActivityLogs(),
        storage.getSettlementActivityLogs(10000),
        storage.getAllSettlementRecords(),
        storage.getDebtSummaries(),
      ]);

      // Get event details with contributions and event participants
      const eventsWithDetails = await Promise.all(
        events.map(async (event) => {
          const details = await storage.getEventWithDetails(event.id);
          const settlement = await storage.getEventSettlement(event.id);
          return {
            ...details,
            settlement,
          };
        })
      );

      // Get debt portfolios for each participant
      const debtPortfolios = await Promise.all(
        participants.map(async (p) => {
          const portfolio = await storage.getDebtPortfolio(p.id);
          return portfolio;
        })
      );

      const exportData = {
        exportedAt: new Date().toISOString(),
        version: "1.0.0",
        data: {
          categories,
          items,
          participants,
          events: eventsWithDetails,
          activityLogs,
          settlementActivityLogs,
          settlementRecords,
          debtSummaries,
          debtPortfolios: debtPortfolios.filter(Boolean),
        },
        stats: {
          categoriesCount: categories.length,
          itemsCount: items.length,
          participantsCount: participants.length,
          eventsCount: events.length,
          activityLogsCount: activityLogs.length,
          settlementRecordsCount: settlementRecords.length,
        },
      };

      res.setHeader("Content-Type", "application/json");
      res.setHeader(
        "Content-Disposition",
        `attachment; filename="kashta-export-${new Date().toISOString().split("T")[0]}.json"`
      );
      res.json(exportData);
    } catch (error) {
      console.error("Error exporting data:", error);
      res.status(500).json({ error: "Failed to export data" });
    }
  });

  // Object Storage - Receipt uploads
  app.post("/api/objects/upload", async (req, res) => {
    try {
      const objectStorageService = new ObjectStorageService();
      const uploadURL = await objectStorageService.getObjectEntityUploadURL();
      res.json({ uploadURL });
    } catch (error) {
      console.error("Error getting upload URL:", error);
      res.status(500).json({ error: "Failed to get upload URL" });
    }
  });

  // Serve uploaded objects (public)
  app.get("/objects/:objectPath(*)", async (req, res) => {
    const objectStorageService = new ObjectStorageService();
    try {
      const objectFile = await objectStorageService.getObjectEntityFile(
        req.path
      );
      objectStorageService.downloadObject(objectFile, res);
    } catch (error) {
      console.error("Error serving object:", error);
      if (error instanceof ObjectNotFoundError) {
        return res.sendStatus(404);
      }
      return res.sendStatus(500);
    }
  });

  // Normalize upload path for receipt storage
  app.post("/api/receipts", async (req, res) => {
    try {
      if (!req.body.uploadURL) {
        return res.status(400).json({ error: "uploadURL is required" });
      }
      
      const objectStorageService = new ObjectStorageService();
      const objectPath = objectStorageService.normalizeObjectEntityPath(
        req.body.uploadURL
      );
      
      res.status(200).json({ objectPath });
    } catch (error) {
      console.error("Error normalizing receipt path:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  });

  // ========== Notifications ==========
  app.get("/api/notifications", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.session!.userId!;
      const notifications = await storage.getNotificationsForUser(userId);
      res.json(notifications);
    } catch (error) {
      console.error("Error fetching notifications:", error);
      res.status(500).json({ error: "Failed to fetch notifications" });
    }
  });

  app.get("/api/notifications/count", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.session!.userId!;
      const count = await storage.getUnreadNotificationCount(userId);
      res.json({ count });
    } catch (error) {
      console.error("Error fetching notification count:", error);
      res.status(500).json({ error: "Failed to fetch notification count" });
    }
  });

  app.patch("/api/notifications/:id/read", isAuthenticated, async (req: any, res) => {
    try {
      await storage.markNotificationRead(req.params.id);
      res.json({ success: true });
    } catch (error) {
      console.error("Error marking notification read:", error);
      res.status(500).json({ error: "Failed to mark notification read" });
    }
  });

  // ========== Invitations ==========
  app.get("/api/invitations", isAuthenticated, async (req: any, res) => {
    try {
      const user = await storage.getUser(req.user.claims.sub);
      if (!user?.email) {
        return res.json([]);
      }
      const invitations = await storage.getInvitationsForUser(user.email);
      res.json(invitations);
    } catch (error) {
      console.error("Error fetching invitations:", error);
      res.status(500).json({ error: "Failed to fetch invitations" });
    }
  });

  app.get("/api/events/:eventId/invitations", isAuthenticated, async (req: any, res) => {
    try {
      const eventId = parseInt(req.params.eventId, 10);
      if (isNaN(eventId)) {
        return res.status(400).json({ error: "Invalid event ID" });
      }
      
      const userId = req.session!.userId!;
      const canAccess = await storage.canUserAccessEvent(eventId, userId);
      if (!canAccess) {
        return res.status(403).json({ error: "Access denied" });
      }
      
      const invitations = await storage.getEventInvitations(eventId);
      res.json(invitations);
    } catch (error) {
      console.error("Error fetching event invitations:", error);
      res.status(500).json({ error: "Failed to fetch event invitations" });
    }
  });

  app.post("/api/events/:eventId/invite", isAuthenticated, async (req: any, res) => {
    try {
      const eventId = parseInt(req.params.eventId, 10);
      if (isNaN(eventId)) {
        return res.status(400).json({ error: "معرف الفعالية غير صالح", errorCode: "INVALID_EVENT_ID" });
      }
      
      const userId = req.session!.userId!;
      const user = await storage.getUser(userId);
      const isAdmin = user?.isAdmin === true;
      
      const canManage = await storage.canUserManageParticipants(eventId, userId);
      if (!canManage && !isAdmin) {
        return res.status(403).json({ error: "ليس لديك صلاحية دعوة المشاركين", errorCode: "PERMISSION_DENIED" });
      }
      
      const { email } = req.body;
      if (!email) {
        return res.status(400).json({ error: "البريد الإلكتروني مطلوب", errorCode: "EMAIL_REQUIRED" });
      }
      
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email)) {
        return res.status(400).json({ error: "صيغة البريد الإلكتروني غير صالحة", errorCode: "INVALID_EMAIL_FORMAT" });
      }
      
      const event = await storage.getEvent(eventId);
      if (!event) {
        return res.status(404).json({ error: "الفعالية غير موجودة", errorCode: "EVENT_NOT_FOUND" });
      }
      
      const existingInvitations = await storage.getEventInvitations(eventId);
      const pendingInvite = existingInvitations.find(
        inv => inv.email.toLowerCase() === email.toLowerCase() && inv.status === 'pending'
      );
      if (pendingInvite) {
        return res.status(409).json({ error: "تم دعوة هذا البريد الإلكتروني مسبقاً ولم يرد بعد", errorCode: "ALREADY_INVITED" });
      }
      
      const eventParticipantsList = await storage.getEventParticipants(eventId);
      const allParticipants = await storage.getParticipants();
      const participantInEvent = eventParticipantsList.find(ep => {
        const participant = allParticipants.find(p => p.id === ep.participantId);
        return participant?.email?.toLowerCase() === email.toLowerCase();
      });
      if (participantInEvent) {
        return res.status(409).json({ error: "هذا المستخدم مشارك في الفعالية بالفعل", errorCode: "ALREADY_PARTICIPANT" });
      }
      
      const existingUser = await storage.getUserByEmail(email);
      let invitedParticipantId: string | null = null;
      
      if (existingUser) {
        const existingParticipant = await storage.getParticipantByUserId(existingUser.id);
        if (existingParticipant) {
          invitedParticipantId = existingParticipant.id;
        }
      }
      
      const inviter = await storage.getParticipantByUserId(userId);
      const token = crypto.randomUUID();
      const expiresAt = new Date();
      expiresAt.setDate(expiresAt.getDate() + 7);
      
      const invitation = await storage.createEventInvitation({
        eventId,
        email: email.toLowerCase(),
        token,
        inviterParticipantId: inviter?.id || null,
        invitedParticipantId,
        expiresAt,
      });
      
      if (existingUser) {
        await storage.createNotification({
          userId: existingUser.id,
          type: 'event_invite',
          title: 'دعوة للانضمام لفعالية',
          message: `تمت دعوتك للانضمام إلى "${event.title}"`,
          payload: { eventId, invitationId: invitation.id },
          actionUrl: `/invitations`,
        });
      }
      
      await storage.createActivityLog({
        eventId,
        action: "دعوة مشارك",
        details: `تم دعوة ${email} للطلعة`,
      });
      
      res.status(201).json({ 
        ...invitation, 
        message: existingUser 
          ? "تم إرسال الدعوة بنجاح. سيتلقى المستخدم إشعاراً" 
          : "تم إنشاء الدعوة بنجاح. سيتمكن المستخدم من الانضمام بعد التسجيل",
        userExists: !!existingUser 
      });
    } catch (error) {
      console.error("Error creating invitation:", error);
      res.status(500).json({ error: "حدث خطأ أثناء إنشاء الدعوة", errorCode: "INTERNAL_ERROR" });
    }
  });

  app.post("/api/invitations/:id/respond", isAuthenticated, async (req: any, res) => {
    try {
      const { accept } = req.body;
      if (typeof accept !== "boolean") {
        return res.status(400).json({ error: "accept field is required" });
      }
      
      const user = await storage.getUser(req.user.claims.sub);
      if (!user?.email) {
        return res.status(400).json({ error: "User email not found" });
      }
      
      let participant = await storage.getParticipantByUserId(req.user.claims.sub);
      
      if (!participant) {
        participant = await storage.createParticipant({
          name: user.firstName && user.lastName 
            ? `${user.firstName} ${user.lastName}` 
            : user.email.split("@")[0],
          userId: req.user.claims.sub,
          email: user.email,
          isGuest: false,
        });
      }
      
      const invitation = await storage.respondToInvitation(
        req.params.id,
        accept,
        participant.id
      );
      
      if (!invitation) {
        return res.status(404).json({ error: "Invitation not found" });
      }
      
      if (accept) {
        await storage.addParticipantToEvent({
          eventId: invitation.eventId,
          participantId: participant.id,
          status: "confirmed",
        });
        
        await storage.createActivityLog({
          eventId: invitation.eventId,
          action: "قبول دعوة",
          details: `قبل ${participant.name} الدعوة للطلعة`,
        });
      }
      
      res.json(invitation);
    } catch (error) {
      console.error("Error responding to invitation:", error);
      res.status(500).json({ error: "Failed to respond to invitation" });
    }
  });

  // ========== Settlement Claims ==========
  app.get("/api/settlement-claims", isAuthenticated, async (req: any, res) => {
    try {
      const participant = await storage.getParticipantByUserId(req.user.claims.sub);
      if (!participant) {
        return res.json([]);
      }
      const claims = await storage.getClaimsForParticipant(participant.id);
      res.json(claims);
    } catch (error) {
      console.error("Error fetching settlement claims:", error);
      res.status(500).json({ error: "Failed to fetch settlement claims" });
    }
  });

  app.post("/api/settlement-claims", isAuthenticated, async (req: any, res) => {
    try {
      const participant = await storage.getParticipantByUserId(req.user.claims.sub);
      if (!participant) {
        return res.status(400).json({ error: "Participant profile not found" });
      }
      
      const { eventId, debtorId, creditorId, amount } = req.body;
      if (!eventId || !debtorId || !creditorId || !amount) {
        return res.status(400).json({ error: "Missing required fields" });
      }
      
      if (participant.id !== debtorId && participant.id !== creditorId) {
        return res.status(403).json({ error: "Can only create claims for your own debts" });
      }
      
      const claim = await storage.createSettlementClaim({
        eventId: parseInt(eventId, 10),
        debtorParticipantId: debtorId,
        creditorParticipantId: creditorId,
        amount: amount.toString(),
        submittedByParticipantId: participant.id,
      });
      
      const otherParticipantId = participant.id === debtorId ? creditorId : debtorId;
      const otherParticipant = await storage.getParticipant(otherParticipantId);
      
      if (otherParticipant?.userId) {
        await storage.createNotification({
          userId: otherParticipant.userId,
          type: "settlement_claim",
          title: "طلب تسوية",
          message: `${participant.name} طلب تأكيد تسوية بقيمة ${amount} ر.ق`,
          payload: { eventId: parseInt(eventId, 10), claimId: claim.id },
        });
      }
      
      res.status(201).json(claim);
    } catch (error) {
      console.error("Error creating settlement claim:", error);
      res.status(500).json({ error: "Failed to create settlement claim" });
    }
  });

  app.patch("/api/settlement-claims/:id", isAuthenticated, async (req: any, res) => {
    try {
      const participant = await storage.getParticipantByUserId(req.user.claims.sub);
      if (!participant) {
        return res.status(400).json({ error: "Participant profile not found" });
      }
      
      const { status } = req.body;
      if (!status || !["confirmed", "rejected"].includes(status)) {
        return res.status(400).json({ error: "Invalid status" });
      }
      
      const claim = await storage.respondToSettlementClaim(
        req.params.id,
        status
      );
      
      if (!claim) {
        return res.status(404).json({ error: "Claim not found" });
      }
      
      if (claim.submittedByParticipantId) {
        const initiator = await storage.getParticipant(claim.submittedByParticipantId);
        if (initiator?.userId) {
          await storage.createNotification({
            userId: initiator.userId,
            type: "settlement_response",
            title: status === "confirmed" ? "تم تأكيد التسوية" : "تم رفض التسوية",
            message: `${participant.name} ${status === "confirmed" ? "وافق على" : "رفض"} طلب التسوية`,
            payload: { eventId: claim.eventId, claimId: claim.id },
          });
        }
      }
      
      res.json(claim);
    } catch (error) {
      console.error("Error responding to settlement claim:", error);
      res.status(500).json({ error: "Failed to respond to settlement claim" });
    }
  });

  // Get user's events (events they are part of)
  app.get("/api/my-events", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.session!.userId!;
      const events = await storage.getEventsForUser(userId);
      res.json(events);
    } catch (error) {
      console.error("Error fetching user events:", error);
      res.status(500).json({ error: "Failed to fetch user events" });
    }
  });

  // ============ RBAC - Event Roles ============

  // Get all roles for an event (requires edit_roles permission)
  app.get("/api/events/:eventId/roles", isAuthenticated, async (req: any, res) => {
    try {
      const eventId = parseInt(req.params.eventId, 10);
      const userId = req.session!.userId!;
      
      // Check if user has permission to manage roles
      const hasPermission = await storage.hasPermission(eventId, userId, 'edit_roles');
      if (!hasPermission) {
        return res.status(403).json({ error: "Permission denied: Cannot view role management" });
      }
      
      const roles = await storage.getEventRoles(eventId);
      res.json(roles);
    } catch (error) {
      console.error("Error fetching event roles:", error);
      res.status(500).json({ error: "Failed to fetch event roles" });
    }
  });

  // Get a specific role
  app.get("/api/roles/:roleId", isAuthenticated, async (req: any, res) => {
    try {
      const role = await storage.getEventRole(req.params.roleId);
      if (!role) {
        return res.status(404).json({ error: "Role not found" });
      }
      
      // Check if user can access the event this role belongs to
      const userId = req.session!.userId!;
      const canAccess = await storage.canUserAccessEvent(role.eventId, userId);
      if (!canAccess) {
        return res.status(403).json({ error: "Access denied" });
      }
      
      res.json(role);
    } catch (error) {
      console.error("Error fetching role:", error);
      res.status(500).json({ error: "Failed to fetch role" });
    }
  });

  // Create a new role for an event
  app.post("/api/events/:eventId/roles", isAuthenticated, async (req: any, res) => {
    try {
      const eventId = parseInt(req.params.eventId, 10);
      const userId = req.session!.userId!;
      
      // Check if user has permission to manage roles (needs manage_roles permission)
      const hasPermission = await storage.hasPermission(eventId, userId, 'edit_roles');
      if (!hasPermission) {
        return res.status(403).json({ error: "Permission denied: Cannot manage roles" });
      }
      
      const { name, nameAr, description, isDefault, permissions } = req.body;
      
      if (!name || !nameAr) {
        return res.status(400).json({ error: "Name and nameAr are required" });
      }
      
      const role = await storage.createEventRole({
        eventId,
        name,
        nameAr,
        description,
        isDefault: isDefault ?? false,
        isCreatorRole: false, // Only system can create creator roles
      });
      
      // Set permissions if provided
      if (permissions && Array.isArray(permissions)) {
        await storage.setRolePermissions(role.id, permissions);
      }
      
      // Fetch full role with permissions
      const fullRole = await storage.getEventRole(role.id);
      res.status(201).json(fullRole);
    } catch (error) {
      console.error("Error creating role:", error);
      res.status(500).json({ error: "Failed to create role" });
    }
  });

  // Update a role
  app.patch("/api/roles/:roleId", isAuthenticated, async (req: any, res) => {
    try {
      const roleId = req.params.roleId;
      const userId = req.session!.userId!;
      
      // Get the role first
      const existingRole = await storage.getEventRole(roleId);
      if (!existingRole) {
        return res.status(404).json({ error: "Role not found" });
      }
      
      // Check if user has permission to manage roles
      const hasPermission = await storage.hasPermission(existingRole.eventId, userId, 'edit_roles');
      if (!hasPermission) {
        return res.status(403).json({ error: "Permission denied: Cannot manage roles" });
      }
      
      // Cannot modify creator role name/flags
      if (existingRole.isCreatorRole && (req.body.name || req.body.isCreatorRole !== undefined)) {
        return res.status(400).json({ error: "Cannot modify creator role properties" });
      }
      
      const { name, nameAr, description, isDefault, permissions } = req.body;
      
      const updateData: any = {};
      if (name !== undefined) updateData.name = name;
      if (nameAr !== undefined) updateData.nameAr = nameAr;
      if (description !== undefined) updateData.description = description;
      if (isDefault !== undefined) updateData.isDefault = isDefault;
      
      const role = await storage.updateEventRole(roleId, updateData);
      
      // Update permissions if provided
      if (permissions && Array.isArray(permissions)) {
        await storage.setRolePermissions(roleId, permissions);
      }
      
      // Fetch full role with permissions
      const fullRole = await storage.getEventRole(roleId);
      res.json(fullRole);
    } catch (error) {
      console.error("Error updating role:", error);
      res.status(500).json({ error: "Failed to update role" });
    }
  });

  // Delete a role
  app.delete("/api/roles/:roleId", isAuthenticated, async (req: any, res) => {
    try {
      const roleId = req.params.roleId;
      const userId = req.session!.userId!;
      
      // Get the role first
      const existingRole = await storage.getEventRole(roleId);
      if (!existingRole) {
        return res.status(404).json({ error: "Role not found" });
      }
      
      // Check if user has permission to manage roles
      const hasPermission = await storage.hasPermission(existingRole.eventId, userId, 'edit_roles');
      if (!hasPermission) {
        return res.status(403).json({ error: "Permission denied: Cannot manage roles" });
      }
      
      // Cannot delete creator role
      if (existingRole.isCreatorRole) {
        return res.status(400).json({ error: "Cannot delete the owner role" });
      }
      
      const deleted = await storage.deleteEventRole(roleId);
      if (!deleted) {
        return res.status(400).json({ error: "Failed to delete role" });
      }
      
      res.json({ success: true });
    } catch (error) {
      console.error("Error deleting role:", error);
      res.status(500).json({ error: "Failed to delete role" });
    }
  });

  // Assign a role to a participant
  app.post("/api/event-participants/:epId/role", isAuthenticated, async (req: any, res) => {
    try {
      const epId = req.params.epId;
      const userId = req.session!.userId!;
      const { roleId } = req.body;
      
      if (!roleId) {
        return res.status(400).json({ error: "roleId is required" });
      }
      
      // Get role to find eventId
      const role = await storage.getEventRole(roleId);
      if (!role) {
        return res.status(404).json({ error: "Role not found" });
      }
      
      // Get the event participant to verify it belongs to the same event
      const eventParticipants = await storage.getEventParticipants(role.eventId);
      const targetEp = eventParticipants.find(ep => ep.id === epId);
      if (!targetEp) {
        return res.status(400).json({ error: "Event participant not found in this event" });
      }
      
      // Check if user has permission to assign roles
      const hasPermission = await storage.hasPermission(role.eventId, userId, 'edit_roles');
      if (!hasPermission) {
        return res.status(403).json({ error: "Permission denied: Cannot assign roles" });
      }
      
      const updated = await storage.assignRoleToParticipant(epId, roleId);
      res.json(updated);
    } catch (error) {
      console.error("Error assigning role:", error);
      res.status(500).json({ error: "Failed to assign role" });
    }
  });

  // Get effective permissions for a user in an event
  app.get("/api/events/:eventId/my-permissions", isAuthenticated, async (req: any, res) => {
    try {
      const eventId = parseInt(req.params.eventId, 10);
      const userId = req.session!.userId!;
      
      const permissions = await storage.getEffectivePermissions(eventId, userId);
      res.json({ permissions });
    } catch (error) {
      console.error("Error fetching permissions:", error);
      res.status(500).json({ error: "Failed to fetch permissions" });
    }
  });

  // Admin endpoint: Backfill RBAC roles for existing events
  app.post("/api/admin/backfill-roles", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.session!.userId!;
      const user = await storage.getUser(userId);
      
      if (!user?.isAdmin) {
        return res.status(403).json({ error: "Admin access required" });
      }
      
      const result = await storage.backfillRolesForExistingEvents();
      
      await storage.createActivityLog({
        action: "ترقية النظام",
        details: `تم إضافة أدوار RBAC لـ ${result.processed} طلعة (تخطي ${result.skipped} طلعات موجودة)`,
      });
      
      res.json({
        success: true,
        message: `Backfilled roles for ${result.processed} events, skipped ${result.skipped} events`,
        ...result,
      });
    } catch (error) {
      console.error("Error backfilling roles:", error);
      res.status(500).json({ error: "Failed to backfill roles" });
    }
  });

  return httpServer;
}