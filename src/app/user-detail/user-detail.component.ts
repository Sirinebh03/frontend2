import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { FormService } from '../form.service';
import { MessageService } from 'primeng/api';
import { KeycloakService } from 'keycloak-angular';

interface DynamicField {
  name?: string;
  label: string;
  type: string;
}

interface FormEntry {
  id: number;
  [key: string]: any;
  filePreviews?: {
    [fieldName: string]: {
      url: string;
      type: 'image' | 'file';
      name: string;
    }
  };
}

@Component({
  selector: 'app-user-detail',
  templateUrl: './user-detail.component.html',
  providers: [MessageService]
})
export class UserDetailComponent implements OnInit {
  formData: FormEntry | null = null;
  dynamicFields: DynamicField[] = [];
  isLoading = true;
  formId!: string;
  userId!: string;
  formName = '';
  formDescription = '';

  constructor(
    private route: ActivatedRoute,
    private formService: FormService,
    private messageService: MessageService,
    private router: Router,
    private keycloakService: KeycloakService
  ) {}

  async ngOnInit(): Promise<void> {
    this.userId = this.route.snapshot.paramMap.get('userId') || '';
this.formId = this.route.snapshot.paramMap.get('formId') || '';


    if (!this.formId || !this.userId) {
      this.messageService.add({
        severity: 'error',
        summary: 'Erreur',
        detail: 'ID de formulaire ou utilisateur manquant',
        life: 5000
      });
      this.router.navigate(['/']);
      return;
    }

    this.loadData();
  }

  loadData(): void {
    this.isLoading = true;
    
    this.formService.getUserFormDetails(this.formId, this.userId).subscribe({
      next: (response: any) => {
        if (response.message === "Formulaire non trouvé") {
          throw new Error('FORM_NOT_FOUND');
        }

        // Process the single entry
        this.formData = {
          ...response.entry,
          filePreviews: this.createFilePreviews(response.entry, response.form_data)
        };

        this.dynamicFields = response.form_data.map((field: any) => ({
          name: field.name,
          label: field.label,
          type: field.type
        }));

        this.formName = response.form?.name || '';
        this.formDescription = response.form?.description || '';
        this.isLoading = false;
      },
      error: (err) => {
        console.error('Error loading data', err);
        this.isLoading = false;
        this.messageService.add({
          severity: 'error',
          summary: 'Erreur',
          detail: err.message === 'FORM_NOT_FOUND' 
            ? 'Formulaire non trouvé' 
            : 'Erreur lors du chargement des données',
          life: 5000
        });
      }
    });
  }

  private createFilePreviews(entry: any, formFields: any[]): any {
    const previews: any = {};
    
    formFields.forEach((field: any) => {
      const fieldName = field.name || this.slugify(field.label);
      if ((field.type === 'file' || field.type === 'image') && entry[fieldName]) {
        previews[fieldName] = {
          url: this.formService.getFormSpecificFileUrl(this.formId, entry[fieldName]),
          type: field.type,
          name: entry[fieldName].split('/').pop()
        };
      }
    });

    return previews;
  }

  private slugify(text: string): string {
    return text.toLowerCase().trim().replace(/\s+/g, '_').replace(/[^\w]/g, '');
  }

  showImagePreview(imageUrl: string): void {
    window.open(imageUrl, '_blank');
  }

  goBack(): void {
    this.router.navigate(['/user-forms', this.userId]);
  }
}