import { Injectable } from '@angular/core';
import { CanActivate, Router } from '@angular/router';
import { KeycloakService } from 'keycloak-angular';
import { AuthService } from './auth.service';

@Injectable({ providedIn: 'root' })
export class AuthGuard implements CanActivate {
  constructor(
    private keycloakService: KeycloakService,
    private router: Router,
    private authService: AuthService // Inject AuthService here
  ) {}

  async canActivate(): Promise<boolean> {
    const isAuthenticated = await this.keycloakService.isLoggedIn();

    if (!isAuthenticated) {
      await this.authService.logout(); // Use the injected authService
      return false;
    }

    return true;
  }
}