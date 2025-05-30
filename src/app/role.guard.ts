import { Injectable } from '@angular/core';
import { CanActivate, ActivatedRouteSnapshot, RouterStateSnapshot, Router } from '@angular/router';
import { AuthService } from './auth.service';

@Injectable({
  providedIn: 'root'
})
export class RoleGuard implements CanActivate {
  constructor(private authService: AuthService, private router: Router) {}

  canActivate(
    next: ActivatedRouteSnapshot,
    state: RouterStateSnapshot): boolean {
    
    // Récupère les rôles nécessaires depuis la route
    const requiredRoles = next.data['roles'] as Array<string>;
    
    // Si aucun rôle requis, autoriser l'accès
    if (!requiredRoles || requiredRoles.length === 0) {
      return true;
    }

    // Vérifie si l'utilisateur a au moins un des rôles requis
    const hasRole = this.authService.hasAnyRole(requiredRoles);
    
    if (!hasRole) {
      // Redirige vers la page d'accès refusé si l'utilisateur n'a pas les droits
      this.router.navigate(['/accessdenied']);
      return false;
    }

    return true;
  }
}