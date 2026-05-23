export type EventType =
  | "agent.init"
  | "agent.tick"
  | "agent.task"
  | "block.new"
  | "block.invalid"
  | "glyph.pattern"
  | "drive.changed"
  | "hmn.post"
  | "hmn.feed"
  | "crossref.insight";

export interface SwarmEvent {
  type: EventType;
  timestamp: number;
  source: string;
  payload: Record<string, unknown>;
}

export type EventHandler = (event: SwarmEvent) => void;

export class EventBus {
  private listeners: Map<EventType, Set<EventHandler>> = new Map();
  private eventLog: SwarmEvent[] = [];
  private stats: Map<EventType, number> = new Map();

  subscribe(type: EventType, handler: EventHandler): () => void {
    if (!this.listeners.has(type)) {
      this.listeners.set(type, new Set());
    }
    this.listeners.get(type)!.add(handler);
    return () => this.listeners.get(type)?.delete(handler);
  }

  publish(event: SwarmEvent): void {
    this.eventLog.push(event);
    this.stats.set(event.type, (this.stats.get(event.type) || 0) + 1);

    const handlers = this.listeners.get(event.type);
    if (handlers) {
      handlers.forEach((h) => {
        try {
          h(event);
        } catch (err) {
          console.error(`[EventBus] Handler error for ${event.type}:`, err);
        }
      });
    }
  }

  getStats(): Record<string, number> {
    const result: Record<string, number> = {};
    this.stats.forEach((count, type) => {
      result[type] = count;
    });
    return result;
  }

  getEvents(type?: EventType, limit = 100): SwarmEvent[] {
    const filtered = type
      ? this.eventLog.filter((e) => e.type === type)
      : [...this.eventLog];
    return filtered.slice(-limit);
  }
}

export const bus = new EventBus();
