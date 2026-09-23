import { chromium, Browser, BrowserContext, Page as PlaywrightPage } from 'playwright';
import { BrowserSessionStatus } from '../../shared/types';
import path from 'path';
import { app } from 'electron';
import fs from 'fs';

export interface BrowserHubStatus {
  status: BrowserSessionStatus;
  currentUrl: string | null;
  activeTabsCount: number;
  waitingForHuman: boolean;
  humanReason: string | null;
  lastActivity: string;
}

export class BrowserHub {
  private static instance: BrowserHub;
  private browser: Browser | null = null;
  private context: BrowserContext | null = null;
  private activePage: PlaywrightPage | null = null;
  private status: BrowserSessionStatus = 'disconnected';
  private waitingForHuman = false;
  private humanReason: string | null = null;
  private lastActivity: string = new Date().toISOString();

  private constructor() {}

  public static getInstance(): BrowserHub {
    if (!BrowserHub.instance) {
      BrowserHub.instance = new BrowserHub();
    }
    return BrowserHub.instance;
  }

  /**
   * Connects to a running Chrome session via CDP (e.g. http://127.0.0.1:9222) or launches controlled browser
   */
  public async connect(endpoint: string = 'http://127.0.0.1:9222'): Promise<BrowserHubStatus> {
    try {
      this.status = 'busy';
      this.lastActivity = new Date().toISOString();

      // Attempt 1: Connect to user's authorized running Chrome CDP
      try {
        this.browser = await chromium.connectOverCDP(endpoint, { timeout: 4000 });
        const contexts = this.browser.contexts();
        this.context = contexts.length > 0 ? contexts[0] : await this.browser.newContext();
      } catch (cdpErr) {
        // Attempt 2: Launch local browser if CDP connection refused
        console.log('Connecting to existing CDP failed, launching controlled Chromium session...');
        this.browser = await chromium.launch({
          headless: false,
          args: ['--disable-blink-features=AutomationControlled'],
        });
        this.context = await this.browser.newContext();
      }

      const pages = this.context.pages();
      this.activePage = pages.length > 0 ? pages[0] : await this.context.newPage();

      this.status = 'connected';
      this.waitingForHuman = false;
      this.humanReason = null;
      this.lastActivity = new Date().toISOString();

      return this.getStatus();
    } catch (error: any) {
      this.status = 'error';
      this.lastActivity = new Date().toISOString();
      throw new Error(`Failed to initialize Chrome Hub: ${error.message}`);
    }
  }

  public async disconnect(): Promise<BrowserHubStatus> {
    try {
      if (this.browser) {
        await this.browser.close();
      }
    } catch {
      // ignore
    } finally {
      this.browser = null;
      this.context = null;
      this.activePage = null;
      this.status = 'disconnected';
      this.waitingForHuman = false;
      this.humanReason = null;
      this.lastActivity = new Date().toISOString();
    }
    return this.getStatus();
  }

  public getStatus(): BrowserHubStatus {
    const tabsCount = this.context ? this.context.pages().length : 0;
    return {
      status: this.status,
      currentUrl: this.activePage ? this.activePage.url() : null,
      activeTabsCount: tabsCount,
      waitingForHuman: this.waitingForHuman,
      humanReason: this.humanReason,
      lastActivity: this.lastActivity,
    };
  }

  public async openUrl(url: string): Promise<{ url: string; title: string }> {
    if (!this.activePage) {
      await this.connect();
    }

    if (!this.activePage) {
      throw new Error('No active browser tab available');
    }

    this.status = 'busy';
    this.lastActivity = new Date().toISOString();

    try {
      await this.activePage.goto(url, { waitUntil: 'domcontentloaded', timeout: 30000 });
      const currentUrl = this.activePage.url();
      const title = await this.activePage.title();

      // Check if page displays CAPTCHA or Cloudflare challenge
      const content = await this.activePage.content();
      if (this.detectSecurityChallenge(content)) {
        this.triggerHumanHandoff('Security verification / CAPTCHA detected on page. Please complete challenge in Chrome.');
      } else {
        this.status = 'connected';
      }

      return { url: currentUrl, title };
    } catch (err: any) {
      this.status = 'connected';
      throw err;
    }
  }

  public async captureScreenshot(fileName?: string): Promise<string> {
    if (!this.activePage) {
      throw new Error('No active page to capture screenshot');
    }

    let screenshotsDir: string;
    try {
      screenshotsDir = path.join(app.getPath('userData'), 'screenshots');
    } catch {
      screenshotsDir = path.join(process.cwd(), 'screenshots');
    }

    fs.mkdirSync(screenshotsDir, { recursive: true });

    const safeName = fileName || `screenshot_${Date.now()}.png`;
    const fullPath = path.join(screenshotsDir, safeName);

    await this.activePage.screenshot({ path: fullPath, fullPage: false });
    return fullPath;
  }

  public triggerHumanHandoff(reason: string): void {
    this.waitingForHuman = true;
    this.humanReason = reason;
    this.status = 'connected';
    this.lastActivity = new Date().toISOString();
  }

  public resumeAfterHuman(): void {
    this.waitingForHuman = false;
    this.humanReason = null;
    this.lastActivity = new Date().toISOString();
  }

  private detectSecurityChallenge(html: string): boolean {
    const lower = html.toLowerCase();
    return (
      lower.includes('cf-browser-verification') ||
      lower.includes('g-recaptcha') ||
      lower.includes('hcaptcha') ||
      lower.includes('cloudflare-static') ||
      lower.includes('please verify you are a human') ||
      lower.includes('turnstile')
    );
  }
}
