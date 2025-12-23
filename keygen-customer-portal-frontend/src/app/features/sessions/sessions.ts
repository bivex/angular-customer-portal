/**
 * Copyright (c) 2025 Bivex
 *
 * Author: Bivex
 * Available for contact via email: support@b-b.top
 * For up-to-date contact information:
 * https://github.com/bivex
 *
 * Created: 2025-12-21T23:12:00
 * Last Updated: 2025-12-23T02:28:40
 *
 * Licensed under the MIT License.
 * Commercial licensing available upon request.
 */

import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AuthService, SessionInfo } from '../../application/services/auth';
import { LoggingService } from '../../core/services/logging';

@Component({
  selector: 'app-sessions',
  standalone: true,
  templateUrl: './sessions.html',
  imports: [CommonModule],
})
export class SessionsComponent implements OnInit {
  sessions: SessionInfo[] = [];
  isLoading = false;
  errorMessage = '';
  revokingSessionId: string | null = null;

  constructor(
    private authService: AuthService,
    private loggingService: LoggingService
  ) {}

  ngOnInit(): void {
    this.loadSessions();
  }

  async loadSessions(): Promise<void> {
    this.isLoading = true;
    this.errorMessage = '';

    try {
      console.log('[Sessions Component] Starting to load sessions...');
      const sessions = await this.authService.getActiveSessions();

      this.sessions = sessions;
      this.isLoading = false;
      console.log('[Sessions Component] Sessions loaded:', this.sessions.length, 'sessions');
      console.log('[Sessions Component] First session:', this.sessions[0]);
      this.loggingService.logAuthEvent('sessions_loaded', this.sessions.length.toString());
    } catch (error) {
      console.log('[Sessions Component] Error loading sessions:', error);
      this.isLoading = false;
      this.errorMessage = error instanceof Error ? error.message : 'Failed to load sessions';
      this.loggingService.error('Failed to load sessions', error as Error, 'sessions');
    }
  }

  async revokeSession(sessionId: string): Promise<void> {
    this.revokingSessionId = sessionId;
    this.errorMessage = '';

    try {
      console.log('[Sessions Component] Starting to revoke session:', sessionId);
      await this.authService.revokeSession(sessionId);
      console.log('[Sessions Component] Session revoked successfully:', sessionId);
      this.loggingService.logAuthEvent('session_revoked_ui', sessionId);

      // Reload sessions after revocation
      console.log('[Sessions Component] Reloading sessions after revoke...');
      await this.loadSessions();
      console.log('[Sessions Component] Sessions reloaded successfully after revoke');
    } catch (error) {
      console.error('[Sessions Component] Error revoking session:', error);
      this.errorMessage = error instanceof Error ? error.message : 'Failed to revoke session';
      this.loggingService.error('Failed to revoke session', error as Error, 'sessions');

      // Try to reload sessions even on error to keep UI in sync
      try {
        console.log('[Sessions Component] Attempting to reload sessions after revoke error...');
        await this.loadSessions();
      } catch (reloadError) {
        console.error(
          '[Sessions Component] Failed to reload sessions after revoke error:',
          reloadError
        );
      }
    } finally {
      // Always clear the revoking state
      this.revokingSessionId = null;
    }
  }

  async revokeAllSessions(): Promise<void> {
    if (
      confirm(
        'Are you sure you want to revoke all other sessions? This will log you out of all other devices.'
      )
    ) {
      this.isLoading = true;

      try {
        await this.authService.logout(undefined, true);
        this.loggingService.logAuthEvent('logout_all_devices');
        // After revoking all sessions, user will be logged out
        // No need to reload sessions as user will be redirected
      } catch (error) {
        this.isLoading = false;
        this.errorMessage =
          error instanceof Error ? error.message : 'Failed to revoke all sessions';
        this.loggingService.error('Failed to revoke all sessions', error as Error, 'sessions');
      }
    }
  }

  getRiskLevel(session: SessionInfo): string {
    if (session.riskScore >= 80) return 'Very High';
    if (session.riskScore >= 60) return 'High';
    if (session.riskScore >= 40) return 'Medium';
    if (session.riskScore >= 20) return 'Low';
    return 'Very Low';
  }

  getRiskColor(riskLevel: string): string {
    switch (riskLevel) {
      case 'Very High':
        return 'text-red-600 bg-red-50 border-red-200';
      case 'High':
        return 'text-orange-600 bg-orange-50 border-orange-200';
      case 'Medium':
        return 'text-yellow-600 bg-yellow-50 border-yellow-200';
      case 'Low':
        return 'text-blue-600 bg-blue-50 border-blue-200';
      default:
        return 'text-green-600 bg-green-50 border-green-200';
    }
  }

  getDeviceIcon(userAgent: string): string {
    const ua = userAgent.toLowerCase();
    if (ua.includes('mobile') || ua.includes('android') || ua.includes('iphone')) {
      return '📱';
    }
    if (ua.includes('tablet') || ua.includes('ipad')) {
      return '📱';
    }
    return '💻';
  }

  isSessionBeingRevoked(sessionId: string): boolean {
    return this.revokingSessionId === sessionId;
  }

  formatLastActivity(lastActivity: string): string {
    if (!lastActivity) return 'Never';
    const date = new Date(lastActivity);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / (1000 * 60));
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins} minutes ago`;
    if (diffHours < 24) return `${diffHours} hours ago`;
    if (diffDays < 7) return `${diffDays} days ago`;

    return date.toLocaleDateString();
  }
}
