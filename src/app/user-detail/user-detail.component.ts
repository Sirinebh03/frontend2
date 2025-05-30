import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { FormService } from  '../form.service';
import { AuthService } from  '../auth.service';


@Component({
  selector: 'app-user-detail',
  templateUrl: './user-detail.component.html',
  styleUrls: ['./user-detail.component.css']
})
export class UserDetailComponent implements OnInit {
  formDetails: any;
  userInfo: any;
  loading = true;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private formService: FormService,
    private authService: AuthService
  ) { }

  ngOnInit(): void {
    const userId = this.route.snapshot.paramMap.get('userId');
    const formId = this.route.snapshot.paramMap.get('formId');

    this.loadUserInfo(userId);
    this.loadFormDetails(userId, formId);
  }

  loadUserInfo(userId: string): void {
    this.authService.getUserById(userId).then((user) => this.userInfo = user)
      .catch((err) => console.error('Erreur chargement utilisateur', err));
  }

loadFormDetails(userId: string, formId: string): void {
  this.formService.getUserFormDetails(userId, formId).subscribe({
    next: (details) => {
      this.formDetails = details;
      this.loading = false;
    },
    error: (err) => {
      console.error('Erreur chargement formulaire', err);
      this.loading = false;
    }
  });
}

  goBack(): void {
    const userId = this.route.snapshot.paramMap.get('userId');
    this.router.navigate(['/admin/users', userId, 'forms']);
  }
}