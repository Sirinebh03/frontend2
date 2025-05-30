import { Injectable } from '@angular/core';
import { ActivatedRouteSnapshot, RouterStateSnapshot, Router } from '@angular/router';
import { AuthService } from './auth.service';

@Injectable({
  providedIn: 'root'
})
export class FormAccessGuard {
  constructor(
    private authService: AuthService,
    private router: Router
  ) {}

  async canActivate(
    next: ActivatedRouteSnapshot,
    state: RouterStateSnapshot
  ): Promise<boolean> {
    const formName = next.paramMap.get('name');
    if (!formName) {
      this.router.navigate(['/notfound']);
      return false;
    }

    // Les admins ont toujours accès
    if (await this.authService.isAdmin()) {
      return true;
    }

    // Pour les autres utilisateurs, vérifiez les permissions
    const userId = await this.authService.getCurrentUserId();
    const hasAccess = await this.authService.hasFormAccessForUser(formName, userId);
    
    if (!hasAccess) {
      this.router.navigate(['/accessdenied']);
      return false;
    }
    
    return true;
  }
}