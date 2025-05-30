import { Component, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { FormService } from '../form.service';
import { AuthService } from '../auth.service';
import { Observable } from 'rxjs';
import { map, catchError } from 'rxjs/operators';
import { of } from 'rxjs';
import { Router } from '@angular/router';

@Component({
  selector: 'app-user-forms',
  templateUrl: './user-forms.component.html',
  styleUrls: ['./user-forms.component.scss']
})
export class UserFormsComponent implements OnInit {
  userId: string;
  userForms: any[] = [];
  loading = false;
  userInfo: any;

  constructor(
    private route: ActivatedRoute,
    private formService: FormService,
    private authService: AuthService,
    private router: Router
  ) { }

  ngOnInit(): void {
    this.userId = this.route.snapshot.paramMap.get('userId');
    this.loadUserInfo();
    this.loadUserForms();
  }

  async loadUserInfo(): Promise<void> {
    try {
      this.userInfo = await this.authService.getUserById(this.userId);
    } catch (error) {
      console.error('Error loading user info', error);
      this.userInfo = null;
    }
  }

  async loadUserForms() {
  this.loading = true;
  try {
    const forms = await this.formService.getForms().toPromise();
    this.userForms = forms || []; 
  } catch (error) {
    console.error('Error loading user forms', error);
    this.userForms = [];
  } finally {
    this.loading = false;
  }
}
viewFormDetails(formId: string): void {
  const userId = this.route.snapshot.paramMap.get('id');
  this.router.navigate(['/admin/users', userId, 'forms', formId]);
}

}