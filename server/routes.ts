import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { 
  insertConfigurationSchema,
  insertTemplateSchema,
  insertTopologyNodeSchema,
  insertTopologyConnectionSchema,
  insertIntentHistorySchema,
  aiGenerationRequestSchema,
  routerApplyRequestSchema,
} from "@shared/schema";
import { generateVyOSConfiguration, validateVyOSConfiguration, suggestCommands } from "./openai";
import { applyVyOSConfig, testSshCommand } from "./vyos";
import net from "net";
import { spawn } from "child_process";

export async function registerRoutes(app: Express): Promise<Server> {
  
  // AI Generation endpoint
  app.post("/api/ai/generate", async (req, res) => {
    try {
      const { intent } = aiGenerationRequestSchema.parse(req.body);
      const result = await generateVyOSConfiguration(intent);
      
      // Save to history
      await storage.createIntentHistory({
        intent,
        generatedConfig: result.configuration,
        applied: 'false'
      });
      
      res.json(result);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  });

  // Configuration validation endpoint
  app.post("/api/validate", async (req, res) => {
    try {
      const { configuration } = req.body;
      if (!configuration || typeof configuration !== 'string') {
        return res.status(400).json({ error: 'Configuration is required' });
      }
      
      const result = await validateVyOSConfiguration(configuration);
      res.json(result);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // Command suggestions endpoint
  app.get("/api/commands/suggest", async (req, res) => {
    try {
      const partial = (req.query.q as string) || '';
      const suggestions = await suggestCommands(partial);
      res.json(suggestions);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // Configuration CRUD endpoints
  app.get("/api/configurations", async (req, res) => {
    try {
      const configurations = await storage.getAllConfigurations();
      res.json(configurations);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.get("/api/configurations/:id", async (req, res) => {
    try {
      const config = await storage.getConfiguration(req.params.id);
      if (!config) {
        return res.status(404).json({ error: 'Configuration not found' });
      }
      res.json(config);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.post("/api/configurations", async (req, res) => {
    try {
      const data = insertConfigurationSchema.parse(req.body);
      const config = await storage.createConfiguration(data);
      res.status(201).json(config);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  });

  app.patch("/api/configurations/:id", async (req, res) => {
    try {
      const updates = req.body;
      const config = await storage.updateConfiguration(req.params.id, updates);
      if (!config) {
        return res.status(404).json({ error: 'Configuration not found' });
      }
      res.json(config);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  });

  app.delete("/api/configurations/:id", async (req, res) => {
    try {
      const deleted = await storage.deleteConfiguration(req.params.id);
      if (!deleted) {
        return res.status(404).json({ error: 'Configuration not found' });
      }
      res.status(204).send();
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // Template endpoints
  app.get("/api/templates", async (req, res) => {
    try {
      const category = req.query.category as string | undefined;
      const templates = category 
        ? await storage.getTemplatesByCategory(category)
        : await storage.getAllTemplates();
      res.json(templates);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.get("/api/templates/:id", async (req, res) => {
    try {
      const template = await storage.getTemplate(req.params.id);
      if (!template) {
        return res.status(404).json({ error: 'Template not found' });
      }
      res.json(template);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.post("/api/templates", async (req, res) => {
    try {
      const data = insertTemplateSchema.parse(req.body);
      const template = await storage.createTemplate(data);
      res.status(201).json(template);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  });

  // Topology endpoints
  app.get("/api/topology/nodes", async (req, res) => {
    try {
      const nodes = await storage.getAllTopologyNodes();
      res.json(nodes);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.post("/api/topology/nodes", async (req, res) => {
    try {
      const data = insertTopologyNodeSchema.parse(req.body);
      const node = await storage.createTopologyNode(data);
      res.status(201).json(node);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  });

  app.patch("/api/topology/nodes/:id", async (req, res) => {
    try {
      const updates = req.body;
      const node = await storage.updateTopologyNode(req.params.id, updates);
      if (!node) {
        return res.status(404).json({ error: 'Node not found' });
      }
      res.json(node);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  });

  app.delete("/api/topology/nodes/:id", async (req, res) => {
    try {
      const deleted = await storage.deleteTopologyNode(req.params.id);
      if (!deleted) {
        return res.status(404).json({ error: 'Node not found' });
      }
      res.status(204).send();
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.get("/api/topology/connections", async (req, res) => {
    try {
      const connections = await storage.getAllTopologyConnections();
      res.json(connections);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.post("/api/topology/connections", async (req, res) => {
    try {
      const data = insertTopologyConnectionSchema.parse(req.body);
      const connection = await storage.createTopologyConnection(data);
      res.status(201).json(connection);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  });

  app.delete("/api/topology/connections/:id", async (req, res) => {
    try {
      const deleted = await storage.deleteTopologyConnection(req.params.id);
      if (!deleted) {
        return res.status(404).json({ error: 'Connection not found' });
      }
      res.status(204).send();
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // Intent history endpoints
  app.get("/api/history", async (req, res) => {
    try {
      const history = await storage.getAllIntentHistory();
      res.json(history);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.get("/api/history/:id", async (req, res) => {
    try {
      const item = await storage.getIntentHistory(req.params.id);
      if (!item) {
        return res.status(404).json({ error: 'History item not found' });
      }
      res.json(item);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.post("/api/history", async (req, res) => {
    try {
      const data = insertIntentHistorySchema.parse(req.body);
      const item = await storage.createIntentHistory(data);
      res.status(201).json(item);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  });

  // Router apply endpoint
  app.post("/api/routers/apply", async (req, res) => {
    try {
      const input = routerApplyRequestSchema.parse(req.body);
      // Try native first; if auth fails, fallback to netmiko
      try {
        const result = await applyVyOSConfig(input);
        return res.json(result);
      } catch (nativeErr: any) {
        // Fallback with Python netmiko
        const py = spawn("python3", ["server/py_apply.py"], { stdio: ["pipe", "pipe", "pipe"] });
        py.stdin.write(JSON.stringify(input));
        py.stdin.end();
        let out = "", err = "";
        py.stdout.on("data", (d) => (out += d.toString()));
        py.stderr.on("data", (d) => (err += d.toString()));
        py.on("close", (code) => {
          if (!out && err) {
            return res.status(500).json({ error: err || 'netmiko failed' });
          }
          try {
            const parsed = JSON.parse(out);
            if (parsed.ok) {
              return res.json({ applied: !!parsed.applied, commit: !!parsed.commit, saved: !!parsed.saved, dryRun: !!parsed.dryRun, logs: parsed.logs || [] });
            }
            return res.status(400).json({ error: parsed.error || 'apply failed', logs: parsed.logs || [] });
          } catch (e: any) {
            return res.status(500).json({ error: 'invalid netmiko output', detail: out || err });
          }
        });
      }
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  });

  // Router reachability check (TCP)
  app.get("/api/routers/check", async (req, res) => {
    const host = (req.query.host as string) || "";
    const port = parseInt((req.query.port as string) || "22", 10);
    const timeoutMs = 3000;
    if (!host) return res.status(400).json({ ok: false, error: "host required" });
    const started = Date.now();
    const socket = new net.Socket();
    socket.setTimeout(timeoutMs);
    socket.once("connect", () => {
      const ms = Date.now() - started;
      socket.destroy();
      res.json({ ok: true, ms });
    });
    socket.once("timeout", () => {
      socket.destroy();
      res.status(408).json({ ok: false, error: "timeout" });
    });
    socket.once("error", (err) => {
      socket.destroy();
      res.status(502).json({ ok: false, error: err.message });
    });
    socket.connect(port, host);
  });

  // Router SSH simple command test
  app.post("/api/routers/test", async (req, res) => {
    try {
      const { host, port, username, password, privateKey, command } = req.body || {};
      if (!host || !username) return res.status(400).json({ ok: false, error: 'host and username required' });
      const out = await testSshCommand({ host, port, username, password, privateKey, command });
      res.json(out);
    } catch (e: any) {
      res.status(500).json({ ok: false, error: e.message });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
