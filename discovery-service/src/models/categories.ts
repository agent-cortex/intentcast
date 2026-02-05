/**
 * Categories — Predefined service categories with metadata
 */

export interface Category {
  id: string;
  name: string;
  description: string;
  icon: string;
  inputExample: string;
  outputExample: string;
  pricingUnit: string;
  tags: string[];
}

export const CATEGORIES: Category[] = [
  {
    id: 'coding',
    name: 'Coding',
    description: 'Code generation, review, debugging, refactoring, and development tasks',
    icon: '💻',
    inputExample: '{"task": "review", "language": "typescript", "code": "..."}',
    outputExample: '{"review": "...", "suggestions": [...], "fixedCode": "..."}',
    pricingUnit: 'per task',
    tags: ['development', 'programming', 'software', 'debugging', 'review'],
  },
  {
    id: 'research',
    name: 'Research',
    description: 'Web research, market analysis, competitor intelligence, deep research',
    icon: '🔍',
    inputExample: '{"topic": "AI agent market", "depth": "comprehensive", "sources": 10}',
    outputExample: '{"summary": "...", "findings": [...], "sources": [...]}',
    pricingUnit: 'per report',
    tags: ['analysis', 'market', 'competitor', 'web', 'intelligence'],
  },
  {
    id: 'data_analysis',
    name: 'Data Analysis',
    description: 'Pattern detection, financial analysis, data processing, visualization',
    icon: '📊',
    inputExample: '{"dataUrl": "...", "analysisType": "trends", "format": "csv"}',
    outputExample: '{"insights": [...], "charts": [...], "recommendations": [...]}',
    pricingUnit: 'per dataset',
    tags: ['analytics', 'patterns', 'financial', 'processing', 'visualization'],
  },
  {
    id: 'content_writing',
    name: 'Content Writing',
    description: 'Blog posts, social media content, marketing copy, documentation',
    icon: '✍️',
    inputExample: '{"type": "blog", "topic": "...", "tone": "professional", "wordCount": 1500}',
    outputExample: '{"content": "...", "meta": {"title": "...", "description": "..."}}',
    pricingUnit: 'per piece',
    tags: ['writing', 'blog', 'social', 'marketing', 'copy'],
  },
  {
    id: 'translation',
    name: 'Translation',
    description: 'Multi-language translation with context awareness',
    icon: '🌐',
    inputExample: '{"text": "...", "from": "en", "to": "es", "context": "technical"}',
    outputExample: '{"translated": "...", "confidence": 0.95}',
    pricingUnit: 'per word',
    tags: ['language', 'localization', 'i18n', 'multilingual'],
  },
  {
    id: 'customer_support',
    name: 'Customer Support',
    description: 'Chatbot responses, ticket handling, FAQ generation',
    icon: '💬',
    inputExample: '{"query": "...", "context": {...}, "history": [...]}',
    outputExample: '{"response": "...", "suggestedActions": [...], "escalate": false}',
    pricingUnit: 'per conversation',
    tags: ['support', 'chat', 'helpdesk', 'tickets', 'faq'],
  },
  {
    id: 'lead_generation',
    name: 'Lead Generation',
    description: 'Prospecting, contact finding, outreach list building',
    icon: '🎯',
    inputExample: '{"industry": "SaaS", "role": "CTO", "region": "US", "count": 50}',
    outputExample: '{"leads": [...], "enrichedData": {...}}',
    pricingUnit: 'per lead',
    tags: ['sales', 'prospecting', 'outreach', 'contacts', 'b2b'],
  },
  {
    id: 'summarization',
    name: 'Summarization',
    description: 'Document summaries, meeting notes, report condensation',
    icon: '📝',
    inputExample: '{"content": "...", "format": "bullets", "maxLength": 500}',
    outputExample: '{"summary": "...", "keyPoints": [...], "wordCount": 450}',
    pricingUnit: 'per document',
    tags: ['summary', 'notes', 'condensation', 'extraction', 'tldr'],
  },
  {
    id: 'image_generation',
    name: 'Image Generation',
    description: 'Creating visuals, designs, illustrations, graphics',
    icon: '🎨',
    inputExample: '{"prompt": "...", "style": "photorealistic", "size": "1024x1024"}',
    outputExample: '{"imageUrl": "...", "revisedPrompt": "..."}',
    pricingUnit: 'per image',
    tags: ['design', 'graphics', 'art', 'visual', 'creative'],
  },
  {
    id: 'automation',
    name: 'Task Automation',
    description: 'Workflow automation, file management, scheduling, integrations',
    icon: '⚙️',
    inputExample: '{"workflow": "...", "trigger": "schedule", "actions": [...]}',
    outputExample: '{"status": "completed", "results": [...], "logs": [...]}',
    pricingUnit: 'per workflow',
    tags: ['workflow', 'integration', 'scheduling', 'rpa', 'scripts'],
  },
];

export function getCategoryById(id: string): Category | undefined {
  return CATEGORIES.find((c) => c.id === id);
}

export function getCategoryIds(): string[] {
  return CATEGORIES.map((c) => c.id);
}
