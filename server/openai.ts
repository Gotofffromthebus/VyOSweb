import OpenAI from "openai";

// the newest OpenAI model is "gpt-5" which was released August 7, 2025. do not change this unless explicitly requested by the user
let cachedOpenAI: OpenAI | null = null;
function getOpenAIClient(): OpenAI {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    throw new Error("OpenAI API key not configured. Set OPENAI_API_KEY to use AI features.");
  }
  if (!cachedOpenAI) {
    cachedOpenAI = new OpenAI({ apiKey });
  }
  return cachedOpenAI;
}

export async function generateVyOSConfiguration(intent: string): Promise<{ configuration: string; explanation: string }> {
  try {
    const client = getOpenAIClient();
    const response = await client.chat.completions.create({
      model: "gpt-5",
      messages: [
        {
          role: "system",
          content: `You are an expert VyOS network engineer. Generate VyOS configuration commands based on user intents. 
          
Rules:
- Use VyOS 1.4+ syntax (set commands)
- Include all necessary configuration lines
- Add comments with # for clarity
- Ensure configurations are production-ready
- Follow VyOS best practices
- Return JSON with 'configuration' (the VyOS commands) and 'explanation' (brief description) fields`
        },
        {
          role: "user",
          content: `Generate VyOS configuration for: ${intent}\n\nRespond with JSON containing 'configuration' and 'explanation' fields.`
        },
      ],
      response_format: { type: "json_object" },
      max_completion_tokens: 2048,
    });

    const result = JSON.parse(response.choices[0].message.content || '{}');
    
    return {
      configuration: result.configuration || '',
      explanation: result.explanation || 'Configuration generated successfully',
    };
  } catch (error) {
    console.error('OpenAI API error:', error);
    const message = (error as any)?.message || '';
    // Fallback for quota exceeded or rate limit
    if (typeof message === 'string' && (message.includes('429') || message.toLowerCase().includes('quota'))) {
      return {
        configuration: [
          "# Fallback configuration (AI quota exceeded)",
          "set system host-name 'vyos'",
          "set service ssh port '22'",
          "# Allow SSH from local LAN (example)",
          "set firewall name LAN_LOCAL default-action 'drop'",
          "set firewall name LAN_LOCAL rule 10 action 'accept'",
          "set firewall name LAN_LOCAL rule 10 protocol 'tcp'",
          "set firewall name LAN_LOCAL rule 10 destination port '22'",
          "set firewall name LAN_LOCAL rule 10 source address '192.168.0.0/24'",
        ].join('\n'),
        explanation: 'AI quota exceeded. Returned a basic SSH allow example configuration.',
      };
    }
    throw new Error('Failed to generate configuration: ' + message);
  }
}

export async function validateVyOSConfiguration(config: string): Promise<{
  valid: boolean;
  errors: Array<{ line: number; message: string; severity: 'error' | 'warning' | 'info' }>;
  warnings: Array<{ line: number; message: string }>;
}> {
  const errors: Array<{ line: number; message: string; severity: 'error' | 'warning' | 'info' }> = [];
  const warnings: Array<{ line: number; message: string }> = [];
  
  const lines = config.split('\n');
  
  lines.forEach((line, index) => {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) return;
    
    // Basic VyOS syntax validation
    if (!trimmed.startsWith('set ') && !trimmed.startsWith('delete ')) {
      errors.push({
        line: index + 1,
        message: 'VyOS commands must start with "set" or "delete"',
        severity: 'error'
      });
    }
    
    // Check for common issues
    if (trimmed.includes('  ')) {
      warnings.push({
        line: index + 1,
        message: 'Multiple spaces detected, may cause parsing issues'
      });
    }
    
    // Check for unquoted values with spaces
    const parts = trimmed.split(' ');
    for (let i = 0; i < parts.length; i++) {
      if (parts[i].includes('/') && !parts[i].match(/^'.*'$/)) {
        if (parts[i].match(/^\d+\.\d+\.\d+\.\d+\/\d+$/)) {
          continue;
        }
      }
    }
  });
  
  return {
    valid: errors.filter(e => e.severity === 'error').length === 0,
    errors,
    warnings
  };
}

export async function suggestCommands(partial: string): Promise<Array<{
  command: string;
  description: string;
  syntax: string;
  category: string;
}>> {
  const commonCommands = [
    { command: 'set interfaces ethernet', description: 'Configure Ethernet interface', syntax: 'set interfaces ethernet <interface> <parameter>', category: 'interfaces' },
    { command: 'set firewall name', description: 'Create firewall rule set', syntax: 'set firewall name <name> rule <number>', category: 'firewall' },
    { command: 'set protocols bgp', description: 'Configure BGP routing', syntax: 'set protocols bgp <parameter>', category: 'routing' },
    { command: 'set vpn ipsec', description: 'Configure IPsec VPN', syntax: 'set vpn ipsec <parameter>', category: 'vpn' },
    { command: 'set nat source', description: 'Configure source NAT', syntax: 'set nat source rule <number>', category: 'nat' },
    { command: 'set system', description: 'System configuration', syntax: 'set system <parameter>', category: 'system' },
    { command: 'set protocols ospf', description: 'Configure OSPF routing', syntax: 'set protocols ospf <parameter>', category: 'routing' },
    { command: 'set protocols static', description: 'Configure static routes', syntax: 'set protocols static route <network>', category: 'routing' },
  ];
  
  if (!partial) return commonCommands;
  
  return commonCommands.filter(cmd => 
    cmd.command.toLowerCase().includes(partial.toLowerCase()) ||
    cmd.description.toLowerCase().includes(partial.toLowerCase())
  );
}
