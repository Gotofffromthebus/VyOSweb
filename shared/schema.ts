import { sql } from "drizzle-orm";
import { pgTable, text, varchar, timestamp, jsonb } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Configuration schema
export const configurations = pgTable("configurations", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: text("name").notNull(),
  description: text("description"),
  content: text("content").notNull(),
  type: text("type").notNull(), // 'firewall', 'vpn', 'routing', 'interface', 'custom'
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const insertConfigurationSchema = createInsertSchema(configurations).omit({
  id: true,
  createdAt: true,
});

export type InsertConfiguration = z.infer<typeof insertConfigurationSchema>;
export type Configuration = typeof configurations.$inferSelect;

// Template schema
export const templates = pgTable("templates", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: text("name").notNull(),
  description: text("description").notNull(),
  category: text("category").notNull(), // 'firewall', 'vpn', 'routing', 'qos', 'interface'
  icon: text("icon").notNull(),
  content: text("content").notNull(),
  tags: text("tags").array(),
});

export const insertTemplateSchema = createInsertSchema(templates).omit({
  id: true,
});

export type InsertTemplate = z.infer<typeof insertTemplateSchema>;
export type Template = typeof templates.$inferSelect;

// Topology Node schema
export const topologyNodes = pgTable("topology_nodes", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  label: text("label").notNull(),
  type: text("type").notNull(), // 'router', 'switch', 'firewall', 'server', 'client'
  position: jsonb("position").notNull(), // { x: number, y: number }
  properties: jsonb("properties"), // additional node properties
  configId: varchar("config_id").references(() => configurations.id),
});

export const insertTopologyNodeSchema = createInsertSchema(topologyNodes).omit({
  id: true,
});

export type InsertTopologyNode = z.infer<typeof insertTopologyNodeSchema>;
export type TopologyNode = typeof topologyNodes.$inferSelect;

// Topology Connection schema
export const topologyConnections = pgTable("topology_connections", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  sourceId: varchar("source_id").notNull().references(() => topologyNodes.id),
  targetId: varchar("target_id").notNull().references(() => topologyNodes.id),
  label: text("label"),
  protocol: text("protocol"), // 'bgp', 'ospf', 'static', 'ethernet'
});

export const insertTopologyConnectionSchema = createInsertSchema(topologyConnections).omit({
  id: true,
});

export type InsertTopologyConnection = z.infer<typeof insertTopologyConnectionSchema>;
export type TopologyConnection = typeof topologyConnections.$inferSelect;

// AI Intent History schema
export const intentHistory = pgTable("intent_history", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  intent: text("intent").notNull(),
  generatedConfig: text("generated_config").notNull(),
  applied: text("applied").notNull().default('false'),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const insertIntentHistorySchema = createInsertSchema(intentHistory).omit({
  id: true,
  createdAt: true,
});

export type InsertIntentHistory = z.infer<typeof insertIntentHistorySchema>;
export type IntentHistory = typeof intentHistory.$inferSelect;

// Validation Result types (not stored in DB)
export const validationResultSchema = z.object({
  valid: z.boolean(),
  errors: z.array(z.object({
    line: z.number(),
    message: z.string(),
    severity: z.enum(['error', 'warning', 'info']),
  })),
  warnings: z.array(z.object({
    line: z.number(),
    message: z.string(),
  })),
});

export type ValidationResult = z.infer<typeof validationResultSchema>;

// Command Suggestion types
export const commandSuggestionSchema = z.object({
  command: z.string(),
  description: z.string(),
  syntax: z.string(),
  category: z.string(),
});

export type CommandSuggestion = z.infer<typeof commandSuggestionSchema>;

// AI Generation Request/Response
export const aiGenerationRequestSchema = z.object({
  intent: z.string().min(1, "Intent cannot be empty"),
});

export type AIGenerationRequest = z.infer<typeof aiGenerationRequestSchema>;

export const aiGenerationResponseSchema = z.object({
  configuration: z.string(),
  explanation: z.string(),
});

export type AIGenerationResponse = z.infer<typeof aiGenerationResponseSchema>;
