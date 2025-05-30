import { Component, OnInit } from '@angular/core';
import { FormService } from '../form.service';
import { AuthService } from '../auth.service';

@Component({
  selector: 'app-admin',
  templateUrl: './admin.component.html',

})
export class AdminComponent implements OnInit {
  forms: any[] = [];
  users: any[] = [];
  userRoles: {[key: string]: string[]} = {};
  loading = false;

  constructor(
    private formService: FormService,
    private authService: AuthService
  ) {}

  async ngOnInit() {
    this.loading = true;
    try {
    
      this.users = await this.authService.getUsers().toPromise();
      
   
     
    } catch (e) {
      console.error('Failed to load data', e);
    } finally {
      this.loading = false;
    }
  }



}