import { Component, OnInit } from '@angular/core';
import { FormService } from '../form.service';
import { AuthService } from '../auth.service';
import { MessageService } from 'primeng/api';

@Component({
  selector: 'app-form-permissions',
  templateUrl: './form-permissions.component.html',
  providers: [MessageService]
})
export class FormPermissionsComponent implements OnInit {
  forms: any[] = [];
  users: any[] = [];
  roles: any[] = [];
  loading = true;
  selectedUser: any = null;
  userRoles: any[] = [];

  constructor(
    private formService: FormService,
    private authService: AuthService,
    private messageService: MessageService
  ) {}

  async ngOnInit() {
    try {
      [this.forms, this.roles,this.users] = await Promise.all([
        this.formService.getForms().toPromise(),
        this.authService.getAvailableRoles().toPromise(),
        this.authService.getUsers().toPromise()
      ]);
    } catch (error) {
      console.error('Error loading data', error);
      this.messageService.add({
        severity: 'error',
        summary: 'Error',
        detail: 'Failed to load data'
      });
    } finally {
      this.loading = false;
    }
  }

  async onUserSelect(user: any) {
    try {
      this.selectedUser = user;
      this.userRoles = await this.authService.getUserRoles(user.id).toPromise();
    } catch (error) {
      console.error('Error loading user roles', error);
      this.messageService.add({
        severity: 'error',
        summary: 'Error',
        detail: 'Failed to load user roles'
      });
    }
  }

  async toggleRole(role: any) {
    
    if (!this.selectedUser) return;

    try {
      const hasRole = this.userRoles.some(r => r.name === role.name);
      
      if (hasRole) {
        await this.authService.revokeRoles(this.selectedUser.id, [role.name]).toPromise();
        this.userRoles = this.userRoles.filter(r => r.name !== role.name);
        this.messageService.add({
          severity: 'success',
          summary: 'Success',
          detail: 'Role removed successfully'
        });
      } else {
        await this.authService.assignRoles(this.selectedUser.id, [role.name]).toPromise();
        this.userRoles.push(role);
        this.messageService.add({
          severity: 'success',
          summary: 'Success',
          detail: 'Role assigned successfully'
        });
      }
    } catch (error) {
      console.error('Error updating roles', error);
      this.messageService.add({
        severity: 'error',
        summary: 'Error',
        detail: 'Failed to update roles'
      });
    }
  }
  isRoleAssigned(role: any): boolean {
  return this.userRoles.some(r => r.name === role.name);
}
}