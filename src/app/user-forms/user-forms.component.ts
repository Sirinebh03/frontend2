import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { FormService } from '../form.service';
import { AuthService } from '../auth.service';
import { firstValueFrom } from 'rxjs';

@Component({
  selector: 'app-user-forms',
  templateUrl: './user-forms.component.html',
  styleUrls: ['./user-forms.component.scss']
})
export class UserFormsComponent implements OnInit {
  userId: string = '';
  userForms: any[] = [];
  loading = false;
  userInfo: any;

  constructor(
    private route: ActivatedRoute,
    private formService: FormService,
    private authService: AuthService,
    private router: Router
  ) {}

  ngOnInit(): void {
    const param = this.route.snapshot.paramMap.get('userId');
    if (param) {
      this.userId = param;
      this.loadUserInfo();
      this.loadUserForms();
    } else {
      console.error('userId is missing from route parameters.');
    }
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
    const forms = await this.formService.getuserforms(this.userId).toPromise();
    console.log('Réponse forms:', forms);
    this.userForms = forms.forms || [];
  } catch (error) {
    console.error('Error loading user forms', error);
    this.userForms = [];
  } finally {
    this.loading = false;
  }
}



  viewFormDetails(formId: string): void {
    if (!this.userId || !formId) {
      console.error('Missing userId or formId');
      return;
    }
    this.router.navigate(['/admin/users', this.userId, 'forms', formId]);
  }
}
