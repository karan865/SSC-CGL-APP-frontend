import { API_BASE_URL, LIVE_BACKEND_URL } from '../constants/config';

type ServerStatus = 'IDLE' | 'WAKING_UP' | 'READY';
type Listener = (status: ServerStatus) => void;

class ServerWakeupService {
  private status: ServerStatus = 'IDLE';
  private listeners: Set<Listener> = new Set();
  private pingInterval: ReturnType<typeof setInterval> | null = null;
  private hasStarted = false;

  public getStatus(): ServerStatus {
    return this.status;
  }

  public isReady(): boolean {
    return this.status === 'READY';
  }

  public addListener(listener: Listener): () => void {
    this.listeners.add(listener);
    listener(this.status);
    return () => this.listeners.delete(listener);
  }

  private notify() {
    this.listeners.forEach((listener) => {
      try {
        listener(this.status);
      } catch (err) {
        console.warn('Listener error in ServerWakeupService:', err);
      }
    });
  }

  /**
   * Starts non-blocking background ping to wake up the cloud backend (Render).
   */
  public startWakeup(): void {
    if (this.hasStarted && this.status === 'READY') return;
    if (this.hasStarted && this.status === 'WAKING_UP') return;

    this.hasStarted = true;
    this.status = 'WAKING_UP';
    this.notify();

    const doPing = async () => {
      if (this.status === 'READY') return;

      try {
        const candidateUrl = API_BASE_URL || LIVE_BACKEND_URL;
        const healthUrl = candidateUrl.endsWith('/api')
          ? `${candidateUrl}/health`
          : `${candidateUrl}/api/health`;

        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 8000);

        const res = await fetch(healthUrl, {
          method: 'GET',
          headers: { Accept: 'application/json' },
          signal: controller.signal,
        });

        clearTimeout(timeoutId);

        if (res.ok) {
          this.status = 'READY';
          if (this.pingInterval) {
            clearInterval(this.pingInterval);
            this.pingInterval = null;
          }
          this.notify();
        }
      } catch {
        // Still waking up, continue background polling
      }
    };

    // Immediate initial probe
    doPing();

    // Poll every 3 seconds until server responds
    this.pingInterval = setInterval(doPing, 3000);

    // Stop polling after 90 seconds to prevent infinite battery drain
    setTimeout(() => {
      if (this.pingInterval) {
        clearInterval(this.pingInterval);
        this.pingInterval = null;
      }
    }, 90000);
  }

  /**
   * Waits until the server responds or until timeout expires.
   */
  public async waitForServer(timeoutMs = 60000): Promise<boolean> {
    if (this.status === 'READY') return true;

    return new Promise((resolve) => {
      let timer: ReturnType<typeof setTimeout> | null = null;

      const unsubscribe = this.addListener((status) => {
        if (status === 'READY') {
          if (timer) clearTimeout(timer);
          unsubscribe();
          resolve(true);
        }
      });

      timer = setTimeout(() => {
        unsubscribe();
        resolve(this.status === 'READY');
      }, timeoutMs);

      // In case wakeup wasn't started yet
      if (!this.hasStarted) {
        this.startWakeup();
      }
    });
  }
}

export const serverWakeupService = new ServerWakeupService();
