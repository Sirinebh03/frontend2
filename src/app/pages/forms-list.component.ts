import { Component, OnInit } from '@angular/core';
import { FormService } from '../form.service';
import { Router } from '@angular/router';
import { MessageService } from 'primeng/api';


@Component({
  selector: 'app-forms-list',
  templateUrl: './forms-list.component.html'
  
})
export class FormsListComponent implements OnInit {
  forms: any[] = [];
  isLoading = false; // Pour gérer le chargement

  constructor(private formService: FormService, private router: Router
              , private messageService: MessageService
              // Ajout de MessageService pour les notifications
  ) {}
  

  ngOnInit(): void {
    this.loadForms();
  }

  loadForms(): void {
    this.formService.getForms().subscribe({
      next: (forms) => this.forms = forms,
      error: (error) => console.error('Erreur chargement formulaires:', error)
    });
  }

  editForm(formId: number): void {
    // Redirection vers le form-builder avec l'ID en paramètre
    this.router.navigate(['/form-builder'], { 
      queryParams: { edit: formId } 
    });
  }

  deleteForm(id: any): void {
    this.isLoading = true;
    
    this.formService.deleteForm(id).subscribe({
      next: () => {
        this.messageService.add({
          severity: 'success',
          summary: 'Succès',
          detail: 'Formulaire supprimé avec succès',
          life: 5000
        });
        this.loadForms(); // Recharger la liste
        this.isLoading = false;
      },
      error: (error) => {
        console.error('Erreur suppression:', error);
        let errorMessage = error.error?.message || 'Erreur lors de la suppression';
        
        if (error.error?.error) {
          errorMessage += ` (${error.error.error})`;
        }
        
        this.messageService.add({
          severity: 'error',
          summary: 'Erreur',
          detail: errorMessage,
          life: 10000
        });
        this.isLoading = false;
      }
    });
  }
  
  
  viewForm(id: string): void {
    this.router.navigate([`/forms/${id}`]);  // ✅ Utilise '/forms/:id' au lieu de '/form-detail/:id'
  }

  
  
}
