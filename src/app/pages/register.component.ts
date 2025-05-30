import { Component } from '@angular/core';
import { FormBuilder, Validators, FormGroup, AbstractControl, AsyncValidatorFn } from '@angular/forms';
import { UserService } from '../user.service';
import { Router } from '@angular/router';
import { MessageService } from 'primeng/api';
import { debounceTime, distinctUntilChanged, switchMap, map, catchError } from 'rxjs/operators';
import { of } from 'rxjs';

@Component({
  selector: 'app-register',
  templateUrl: './register.component.html',
  styleUrls: ['./register.component.scss'],
  providers: [MessageService]
})
export class RegisterComponent {
  registerForm: FormGroup;
  loading = false;
  currentStep = 1;

  constructor(
    private fb: FormBuilder,
    private userService: UserService,
    private router: Router,
    private messageService: MessageService
  ) {
    this.createForm();
  }

  createForm() {
    this.registerForm = this.fb.group({
      personalInfo: this.fb.group({
        firstName: ['', [Validators.required, Validators.minLength(2)]],
        lastName: ['', [Validators.required, Validators.minLength(2)]],
        email: ['', [Validators.required, Validators.email]]
      }),
      accountInfo: this.fb.group({
        username: ['', 
          [Validators.required, Validators.minLength(3)],
          [this.usernameAvailabilityValidator()]
        ],
        password: ['', [
          Validators.required,
          Validators.minLength(8),
          Validators.pattern(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).*$/)
        ]],
        confirmPassword: ['', Validators.required]
      }, { validators: this.passwordMatchValidator })
    });
  }

  usernameAvailabilityValidator(): AsyncValidatorFn {
    return (control: AbstractControl) => {
      if (!control.value) {
        return of(null);
      }
      return this.userService.checkUsernameAvailability(control.value).pipe(
        map(response => {
          return response.available ? null : { notAvailable: true };
        }),
        catchError(() => of(null)) // Ne bloque pas si une erreur survient
      );
    };
  }

  passwordMatchValidator(group: FormGroup) {
    const pass = group.get('password')?.value;
    const confirmPass = group.get('confirmPassword')?.value;
    return pass === confirmPass ? null : { mismatch: true };
  }

  get personalInfo() {
    return this.registerForm.get('personalInfo') as FormGroup;
  }

  get accountInfo() {
    return this.registerForm.get('accountInfo') as FormGroup;
  }

  nextStep() {
    if (this.currentStep === 1 && this.personalInfo.valid) {
      this.currentStep++;
    }
  }

  prevStep() {
    this.currentStep--;
  }

  onSubmit() {
    if (this.registerForm.invalid) {
      this.markAllAsTouched();
      return;
    }

    this.loading = true;
    const formValue = this.registerForm.value;
    const userData = {
      ...formValue.personalInfo,
      ...formValue.accountInfo
    };

    this.userService.createUser(userData).subscribe({
      next: () => {
        this.messageService.add({
          severity: 'success',
          summary: 'Succès',
          detail: 'Compte créé avec succès!'
        });
        setTimeout(() => this.router.navigate(['/forms']), 2000);
      },
      error: (err) => {
        this.loading = false;
        const errorMessage = err.error?.error || 'Échec de la création du compte';
        this.messageService.add({
          severity: 'error',
          summary: 'Erreur',
          detail: errorMessage
        });
      }
    });
  }

  private markAllAsTouched() {
    Object.values(this.personalInfo.controls).forEach(control => {
      control.markAsTouched();
    });
    Object.values(this.accountInfo.controls).forEach(control => {
      control.markAsTouched();
    });
  }
}
