// src/app/services/auth.service.ts
import { Injectable } from '@angular/core';
import { KeycloakService } from 'keycloak-angular';
import { HttpClient } from '@angular/common/http';
import { environment } from '../environments/environment';
import { Observable, from, of } from 'rxjs';
import { switchMap, catchError } from 'rxjs/operators';
import { HttpHeaders } from '@angular/common/http';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  constructor(
    private keycloakService: KeycloakService,
    private http: HttpClient
  ) {}

  getLoggedUser() {
    try {
      return this.keycloakService.getKeycloakInstance().idTokenParsed;
    } catch (e) {
      return null;
    }
  }

  async logout() {
    // 1. Appeler le endpoint de déconnexion du backend si nécessaire
    try {
      await this.http.post(`${environment.apiUrl}/logout`, {}).toPromise();
    } catch (e) {
      console.warn('Backend logout failed', e);
    }
    
    // 2. Déconnexion Keycloak
    await this.keycloakService.logout(window.location.origin);
  }
async login() {
  await this.keycloakService.login({ redirectUri: window.location.origin });
  const token = await this.keycloakService.getToken();
  localStorage.setItem('token', token); // Stockage du token
}

getToken(): Promise<string | null> {
  const token = localStorage.getItem('token'); // au lieu de 'access_token'
  return Promise.resolve(token);
}


// Ajoutez ces méthodes à votre AuthService existant

async hasFormAccessForUser(userId: any, formName: string): Promise<boolean> {
  const roleName = `form_${this.slugify(formName)}`;
  const token = await this.getToken();
  
  const response = await this.http.get<{hasRole: boolean}>(
    `${environment.apiUrl}/auth/has-role`,
    { 
      params: { userId, roleName },
      headers: { Authorization: `Bearer ${token}` }
    }
  ).toPromise();

  return response?.hasRole || false;
}
  async getCurrentUserId(): Promise<any> {
    const user = this.getLoggedUser();
    return user ? user.sub : null;
  }

  async getUserById(userId: string): Promise<any> {
    const token = await this.getToken();
    return this.http.get<any>(`${environment.apiUrl}/keycloak/users/${userId}`, {
      headers: { Authorization: `Bearer ${token}` }
    }).toPromise();
  }
async getUsersWithFormAccess(formName: string): Promise<any[]> {
  const roleName = `form_${this.slugify(formName)}`;
  const token = await this.getToken();
  
  return this.http.get<any[]>(
    `${environment.apiUrl}/auth/users-with-role`,
    { 
      params: { roleName },
      headers: { Authorization: `Bearer ${token}` }
    }
  ).toPromise();
}
  getAvailableRoles() {
    return this.http.get<any[]>('/api/keycloak/roles');
  }

getUsers(): Observable<any[]> {
 
  const token = localStorage.getItem('token'); // Récupérer le token depuis le stockage local
  
      return this.http.get<any[]>(`${environment.apiUrl}/api/keycloak/users`, {
        headers: new HttpHeaders({
          'Authorization': `Bearer ${token}`
        })
      }).pipe(
        catchError(error => {
          console.error('Error fetching users:', error);
          return of([]); // Retourne un Observable vide en cas d'erreur
        })
      );
    
   
}


  getUserRoles(userId: string) {
    return this.http.get<any[]>(`/api/keycloak/users/${userId}/roles`);
  }

  assignRoles(userId: string, roles: string[]) {
    const token = localStorage.getItem('token'); // Récupérer le token depuis le stockage local
    return this.http.post<any[]>(`${environment.apiUrl}/api/keycloak/users/${userId}/roles`, { roles }, {
      headers: new HttpHeaders({
        'Authorization': `Bearer ${token}`
      })
    });
  }

  revokeRoles(userId: string, roles: string[]) {
    return this.http.delete(`/api/keycloak/users/${userId}/roles`, {
      body: { roles }
    });
  }




  isLoggedIn() {
    return this.keycloakService.isLoggedIn();
  }
    async isAdmin(): Promise<boolean> {
    return this.keycloakService.isUserInRole('admin');
  }



  async assignFormRole(userId: string, formName: string): Promise<boolean> {
    const roleName = `form_${this.slugify(formName)}`;
    const token = await this.getToken();
    
    try {
      await this.http.post(`${environment.apiUrl}/keycloak/assign-role`, {
        userId,
        roleName
      }, {
        headers: { Authorization: `Bearer ${token}` }
      }).toPromise();
      return true;
    } catch (e) {
      console.error('Failed to assign role', e);
      return false;
    }
  }
  slugify(text: string): string {
  return text.toString().toLowerCase()
    .replace(/\s+/g, '-')           // Replace spaces with -
    .replace(/[^\w\-]+/g, '')       // Remove all non-word chars
    .replace(/\-\-+/g, '-')         // Replace multiple - with single -
    .replace(/^-+/, '')             // Trim - from start of text
    .replace(/-+$/, '');            // Trim - from end of text
}
  async revokeFormRole(userId: string, formName: string): Promise<boolean> {
    const roleName = `form_${this.slugify(formName)}`;
    const token = await this.getToken();
    
    try {
      await this.http.post(`${environment.apiUrl}/keycloak/revoke-role`, {
        userId,
        roleName
      }, {
        headers: { Authorization: `Bearer ${token}` }
      }).toPromise();
      return true;
    } catch (e) {
      console.error('Failed to revoke role', e);
      return false;
    }
  }

  async getUserRole(userId: string): Promise<string[]> {
    const token = await this.getToken();
    return this.http.get<string[]>(`${environment.apiUrl}/keycloak/users/${userId}/roles`, {
      headers: { Authorization: `Bearer ${token}` }
    }).toPromise();
  }
    hasRole(roleName: string): boolean {
    const user = this.getCurrentUser();
    return user?.roles?.includes(roleName) || false;
  }

  // Vérifie si l'utilisateur a au moins un des rôles demandés
  hasAnyRole(requiredRoles: string[]): boolean {
    if (!requiredRoles || requiredRoles.length === 0) {
      return true;
    }

    const user = this.getCurrentUser();
    return requiredRoles.some(role => user?.roles?.includes(role));
  }

  // Récupère l'utilisateur courant (à adapter selon votre implémentation)
  getCurrentUser(): any {
    // Implémentez cette méthode selon comment vous stockez les infos utilisateur
    // Par exemple :
    return JSON.parse(localStorage.getItem('currentUser') )|| null;
  }
}