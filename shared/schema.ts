import { pgTable, text, serial, integer, boolean, timestamp, jsonb } from "drizzle-orm/pg-core";
import { createInsertSchema, createSelectSchema } from "drizzle-zod";
import { relations } from "drizzle-orm";
import { z } from "zod";

// Device table
export const devices = pgTable("devices", {
  id: serial("id").primaryKey(),
  name: text("name").notNull().unique(),
  ipAddress: text("ip_address").notNull(),
  port: integer("port").notNull().default(502),
  slaveId: integer("slave_id").notNull().default(1),
  enabled: boolean("enabled").notNull().default(true),
  deviceType: text("device_type").notNull().default("PLC"),
  description: text("description"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// Register table
export const registers = pgTable("registers", {
  id: serial("id").primaryKey(),
  deviceId: integer("device_id").references(() => devices.id).notNull(),
  name: text("name").notNull(),
  address: integer("address").notNull(),
  type: text("type").notNull(), // "coil", "holding", "input", "discrete"
  dataType: text("data_type").notNull(), // "float", "integer", "boolean", etc.
  unit: text("unit"),
  readOnly: boolean("read_only").notNull().default(false),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// Real-time data table
export const realtimeData = pgTable("realtime_data", {
  id: serial("id").primaryKey(),
  deviceId: integer("device_id").references(() => devices.id).notNull(),
  timestamp: timestamp("timestamp").defaultNow().notNull(),
  data: jsonb("data").notNull(),
  status: boolean("status").notNull().default(true),
  control: jsonb("control").notNull().default({
    type: "local",
    source: "local",
  }),
});

// Historical data table
export const historicalData = pgTable("historical_data", {
  id: serial("id").primaryKey(),
  deviceId: integer("device_id").references(() => devices.id).notNull(),
  timestamp: timestamp("timestamp").defaultNow().notNull(),
  data: jsonb("data").notNull(),
});

// Define relations
export const devicesRelations = relations(devices, ({ many }) => ({
  registers: many(registers),
  realtimeData: many(realtimeData),
  historicalData: many(historicalData),
}));

export const registersRelations = relations(registers, ({ one }) => ({
  device: one(devices, {
    fields: [registers.deviceId],
    references: [devices.id],
  }),
}));

export const realtimeDataRelations = relations(realtimeData, ({ one }) => ({
  device: one(devices, {
    fields: [realtimeData.deviceId],
    references: [devices.id],
  }),
}));

export const historicalDataRelations = relations(historicalData, ({ one }) => ({
  device: one(devices, {
    fields: [historicalData.deviceId],
    references: [devices.id],
  }),
}));

// Validation schemas
export const deviceInsertSchema = createInsertSchema(devices, {
  name: (schema) => schema.min(1, "Device name is required"),
  ipAddress: (schema) => schema.min(1, "IP address is required"),
  port: (schema) => schema.int("Port must be a number").positive("Port must be positive"),
  slaveId: (schema) => schema.int("Slave ID must be a number").positive("Slave ID must be positive"),
});

export const registerInsertSchema = createInsertSchema(registers, {
  name: (schema) => schema.min(1, "Register name is required"),
  address: (schema) => schema.int("Address must be a number").nonnegative("Address must be non-negative"),
  type: (schema) => schema.refine(val => ['coil', 'holding', 'input', 'discrete'].includes(val), {
    message: "Type must be one of: coil, holding, input, discrete"
  }),
  dataType: (schema) => schema.refine(val => ['float', 'integer', 'boolean'].includes(val), {
    message: "Data type must be one of: float, integer, boolean"
  }),
});

// Types
export type Device = typeof devices.$inferSelect;
export type DeviceInsert = z.infer<typeof deviceInsertSchema>;
export type Register = typeof registers.$inferSelect;
export type RegisterInsert = z.infer<typeof registerInsertSchema>;
export type RealtimeData = typeof realtimeData.$inferSelect;
export type HistoricalData = typeof historicalData.$inferSelect;

// Device connection status enum
export enum DeviceStatus {
  ONLINE = "online",
  OFFLINE = "offline",
  ERROR = "error",
}
