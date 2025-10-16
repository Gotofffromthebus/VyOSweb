import { 
  type Configuration, 
  type InsertConfiguration,
  type Template,
  type InsertTemplate,
  type TopologyNode,
  type InsertTopologyNode,
  type TopologyConnection,
  type InsertTopologyConnection,
  type IntentHistory,
  type InsertIntentHistory
} from "@shared/schema";
import { randomUUID } from "crypto";

export interface IStorage {
  // Configuration methods
  getConfiguration(id: string): Promise<Configuration | undefined>;
  getAllConfigurations(): Promise<Configuration[]>;
  createConfiguration(config: InsertConfiguration): Promise<Configuration>;
  updateConfiguration(id: string, config: Partial<InsertConfiguration>): Promise<Configuration | undefined>;
  deleteConfiguration(id: string): Promise<boolean>;

  // Template methods
  getTemplate(id: string): Promise<Template | undefined>;
  getAllTemplates(): Promise<Template[]>;
  getTemplatesByCategory(category: string): Promise<Template[]>;
  createTemplate(template: InsertTemplate): Promise<Template>;

  // Topology methods
  getTopologyNode(id: string): Promise<TopologyNode | undefined>;
  getAllTopologyNodes(): Promise<TopologyNode[]>;
  createTopologyNode(node: InsertTopologyNode): Promise<TopologyNode>;
  updateTopologyNode(id: string, updates: Partial<InsertTopologyNode>): Promise<TopologyNode | undefined>;
  deleteTopologyNode(id: string): Promise<boolean>;

  getTopologyConnection(id: string): Promise<TopologyConnection | undefined>;
  getAllTopologyConnections(): Promise<TopologyConnection[]>;
  createTopologyConnection(connection: InsertTopologyConnection): Promise<TopologyConnection>;
  deleteTopologyConnection(id: string): Promise<boolean>;

  // Intent history methods
  getIntentHistory(id: string): Promise<IntentHistory | undefined>;
  getAllIntentHistory(): Promise<IntentHistory[]>;
  createIntentHistory(intent: InsertIntentHistory): Promise<IntentHistory>;
}

export class MemStorage implements IStorage {
  private configurations: Map<string, Configuration>;
  private templates: Map<string, Template>;
  private topologyNodes: Map<string, TopologyNode>;
  private topologyConnections: Map<string, TopologyConnection>;
  private intentHistory: Map<string, IntentHistory>;

  constructor() {
    this.configurations = new Map();
    this.templates = new Map();
    this.topologyNodes = new Map();
    this.topologyConnections = new Map();
    this.intentHistory = new Map();
    this.seedTemplates();
  }

  private seedTemplates() {
    const templates: InsertTemplate[] = [
      {
        name: 'Basic Firewall Rules',
        description: 'Essential firewall configuration with allow/deny rules for common services',
        category: 'firewall',
        icon: 'shield',
        tags: ['security', 'firewall', 'basic'],
        content: `set firewall name WAN_LOCAL default-action 'drop'
set firewall name WAN_LOCAL rule 10 action 'accept'
set firewall name WAN_LOCAL rule 10 state established 'enable'
set firewall name WAN_LOCAL rule 10 state related 'enable'
set firewall name WAN_LOCAL rule 20 action 'drop'
set firewall name WAN_LOCAL rule 20 state invalid 'enable'`
      },
      {
        name: 'Site-to-Site VPN',
        description: 'IPsec VPN tunnel configuration for secure site-to-site connectivity',
        category: 'vpn',
        icon: 'lock',
        tags: ['vpn', 'ipsec', 'security'],
        content: `set vpn ipsec ike-group IKE-SITE lifetime '28800'
set vpn ipsec ike-group IKE-SITE proposal 1 dh-group '14'
set vpn ipsec ike-group IKE-SITE proposal 1 encryption 'aes256'
set vpn ipsec ike-group IKE-SITE proposal 1 hash 'sha256'`
      },
    ];

    templates.forEach(t => {
      const id = randomUUID();
      this.templates.set(id, { ...t, id });
    });
  }

  // Configuration methods
  async getConfiguration(id: string): Promise<Configuration | undefined> {
    return this.configurations.get(id);
  }

  async getAllConfigurations(): Promise<Configuration[]> {
    return Array.from(this.configurations.values());
  }

  async createConfiguration(insertConfig: InsertConfiguration): Promise<Configuration> {
    const id = randomUUID();
    const config: Configuration = { 
      ...insertConfig, 
      id,
      createdAt: new Date()
    };
    this.configurations.set(id, config);
    return config;
  }

  async updateConfiguration(id: string, updates: Partial<InsertConfiguration>): Promise<Configuration | undefined> {
    const config = this.configurations.get(id);
    if (!config) return undefined;
    
    const updated = { ...config, ...updates };
    this.configurations.set(id, updated);
    return updated;
  }

  async deleteConfiguration(id: string): Promise<boolean> {
    return this.configurations.delete(id);
  }

  // Template methods
  async getTemplate(id: string): Promise<Template | undefined> {
    return this.templates.get(id);
  }

  async getAllTemplates(): Promise<Template[]> {
    return Array.from(this.templates.values());
  }

  async getTemplatesByCategory(category: string): Promise<Template[]> {
    return Array.from(this.templates.values()).filter(t => t.category === category);
  }

  async createTemplate(insertTemplate: InsertTemplate): Promise<Template> {
    const id = randomUUID();
    const template: Template = { ...insertTemplate, id };
    this.templates.set(id, template);
    return template;
  }

  // Topology methods
  async getTopologyNode(id: string): Promise<TopologyNode | undefined> {
    return this.topologyNodes.get(id);
  }

  async getAllTopologyNodes(): Promise<TopologyNode[]> {
    return Array.from(this.topologyNodes.values());
  }

  async createTopologyNode(insertNode: InsertTopologyNode): Promise<TopologyNode> {
    const id = randomUUID();
    const node: TopologyNode = { ...insertNode, id };
    this.topologyNodes.set(id, node);
    return node;
  }

  async updateTopologyNode(id: string, updates: Partial<InsertTopologyNode>): Promise<TopologyNode | undefined> {
    const node = this.topologyNodes.get(id);
    if (!node) return undefined;
    
    const updated = { ...node, ...updates };
    this.topologyNodes.set(id, updated);
    return updated;
  }

  async deleteTopologyNode(id: string): Promise<boolean> {
    return this.topologyNodes.delete(id);
  }

  async getTopologyConnection(id: string): Promise<TopologyConnection | undefined> {
    return this.topologyConnections.get(id);
  }

  async getAllTopologyConnections(): Promise<TopologyConnection[]> {
    return Array.from(this.topologyConnections.values());
  }

  async createTopologyConnection(insertConnection: InsertTopologyConnection): Promise<TopologyConnection> {
    const id = randomUUID();
    const connection: TopologyConnection = { ...insertConnection, id };
    this.topologyConnections.set(id, connection);
    return connection;
  }

  async deleteTopologyConnection(id: string): Promise<boolean> {
    return this.topologyConnections.delete(id);
  }

  // Intent history methods
  async getIntentHistory(id: string): Promise<IntentHistory | undefined> {
    return this.intentHistory.get(id);
  }

  async getAllIntentHistory(): Promise<IntentHistory[]> {
    return Array.from(this.intentHistory.values()).sort((a, b) => 
      b.createdAt.getTime() - a.createdAt.getTime()
    );
  }

  async createIntentHistory(insertIntent: InsertIntentHistory): Promise<IntentHistory> {
    const id = randomUUID();
    const intent: IntentHistory = { 
      ...insertIntent, 
      id,
      createdAt: new Date()
    };
    this.intentHistory.set(id, intent);
    return intent;
  }
}

export const storage = new MemStorage();
