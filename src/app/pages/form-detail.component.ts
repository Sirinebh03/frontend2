import { Component, OnInit, ViewChild } from '@angular/core';
import { FormBuilder, FormGroup, Validators, FormArray } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { FormService } from '../form.service';
import { MessageService } from 'primeng/api';
import { Table } from 'primeng/table';
import { saveAs } from 'file-saver';
import { HttpClient } from '@angular/common/http';
import { environment } from 'src/environments/environment';
import { FormGroupDirective } from '@angular/forms';
import { FormControl } from '@angular/forms';

interface FieldOption {
  label: any;
  value: any;
  [key: string]: any;
}

interface DynamicField {
  name?: string;
  label: string;
  type: string;
  required?: boolean;
  options?: any;
  placeholder?: string;
  dynamic?: boolean;
  sourceTable?: string;
  keyColumn?: string;
  valueColumn?: string;
  validation?: {
    min?: number;
    max?: number;
    minLength?: number;
    maxLength?: number;
    pattern?: string;
  };
  // Ajout des propriétés pour les fichiers
  accept?: string;
  multiple?: boolean;
  // Autres propriétés spécifiques
  rows?: number; // Pour textarea
  cols?: number; // Pour textarea
}

interface FormResponse {
  entries: any[];
  form_data: DynamicField[];
}

@Component({
  selector: 'app-form-detail',
  templateUrl: './form-detail.component.html',
  
  providers: [MessageService]
})
export class FormDetailComponent implements OnInit {
  @ViewChild('dt') dt!: Table;

  formDataList: any[] = [];
  dynamicFields: DynamicField[] = [];
  selectedItems: any[] = [];
  formDialog = false;
  isLoading = false;

  formId!: any;
  formConfig: any[] = [];
  formName = '';
  formDescription = '';

  dynamicForm: FormGroup = this.fb.group({});
  currentItemId: number | null = null;
  currentItem: any = null;
  uploadUrl: string = '/api/forms/upload'; // Adaptez à votre endpoint
uploadError: string | null = null;
uploadedFiles: {[key: string]: string} = {};

  constructor(
    private route: ActivatedRoute,
    private formService: FormService,
    private fb: FormBuilder,
    private messageService: MessageService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.route.paramMap.subscribe((params) => {
      this.formId = params.get('id');
      if (this.formId) {
        this.loadData();
      }
    });
  }

  loadData(): void {
    if (!this.formId) return;
  
    this.isLoading = true;
    
    this.formService.getFormDataWithEntries(this.formId).subscribe({
      next: (res: FormResponse) => {
        this.formDataList = res.entries || [];
        this.dynamicFields = this.processFormFields(res.form_data || []);
  
        this.buildForm();
        this.isLoading = false;
      },
      error: (err) => {
        this.handleError('Erreur lors du chargement des données', err);
        this.isLoading = false;
      }
    });

    // Load form metadata
    this.formService.getFormById(this.formId).subscribe({
      next: (form) => {
        this.formName = form.name;
        this.formDescription = form.description;
      },
      error: (err) => {
        this.handleError('Erreur lors du chargement des métadonnées du formulaire', err);
      }
    });
  }
  
  private processFormFields(fields: any[]): DynamicField[] {
    return fields.map(field => {
      // Ensure field has a name
      if (!field.name) {
        field.name = this.slugify(field.label);
      }
      
      // Normalize options
      if (field.options) {
        field.options = this.normalizeOptions(field.options);
      }
      
      // Set default validation
      if (!field.validation) {
        field.validation = {};
        if (field.required) {
          field.validation.required = true;
        }
      }
      
      return field;
    });
  }
  
  private normalizeOptions(options: any[]): FieldOption[] {
    return options.map(opt => {
      if (typeof opt === 'string') {
        return { label: opt, value: opt };
      }
      return {
        label: opt.label || opt.value || opt.name || 'Option',
        value: opt.value || opt.id || opt
      };
    });
  }


  
// Ajoutez cette méthode pour supprimer un fichier
removeFile(field: DynamicField): void {
  const key = this.getFieldKey(field);
  delete this.uploadedFiles[key];
  this.dynamicForm.get(key)?.setValue(null);
}

// Modifiez la méthode onUpload
onUpload(event: any, field: DynamicField) {
  if (event.originalEvent?.status === 200) {
    const response = event.originalEvent.body;
    if (response && response.filePath) {
      const key = this.getFieldKey(field);
      this.uploadedFiles[key] = response.filePath;
      this.dynamicForm.get(key)?.setValue(response.filePath);
      this.uploadError = null;
    }
  } else {
    this.uploadError = 'Upload failed';
  }
}

// Modifiez prepareFormData pour gérer correctement les fichiers
private prepareFormData(): any {
  const rawData = this.dynamicForm.value;
  const mappedData: any = {};

  this.dynamicFields.forEach((field) => {
    const key = this.getFieldKey(field);
    const value = rawData[key];

    // Gestion des fichiers
    if (field.type === 'file' || field.type === 'image') {
      // Utilise le fichier uploadé ou conserve l'existant
      mappedData[key] = this.uploadedFiles[key] || 
                       (this.currentItem ? this.currentItem[key] : null);
      return;
    }

    // Reste du traitement des autres types de champs...
    switch (field.type) {
      case 'date':
      case 'datetime':
     
        mappedData[key] = value ? new Date(value).toISOString() : null;
        break;
        case 'time':
        if (value instanceof Date) {
          // Format as HH:MM:SS
          mappedData[key] = 
            `${this.padZero(value.getHours())}:${this.padZero(value.getMinutes())}:${this.padZero(value.getSeconds())}`;
        } else if (value) {
          // If it's already a string, ensure proper format
          mappedData[key] = value.length === 5 ? `${value}:00` : value;
        } else {
          mappedData[key] = null;
        }
        break;
      case 'checkbox':
        mappedData[key] = value ? 1 : 0;
        break;
      case 'multiselect':
        mappedData[key] = JSON.stringify(Array.isArray(value) ? value : []);
        break;
      case 'range':
        mappedData[key] = parseFloat(value);
        break;
      default:
        mappedData[key] = value;
    }
  });

  return mappedData;
}

// Modifiez editItem pour initialiser uploadedFiles
editItem(item: any): void {
  this.currentItemId = item.id;
  this.currentItem = { ...item };
  this.uploadedFiles = {};
  
  // Initialiser les fichiers existants
  this.dynamicFields.forEach(field => {
    const key = this.getFieldKey(field);

    if (field.type === 'checkbox') {
      item[key] = item[key] === 1 || item[key] === '1' || item[key] === true;
    }
    else if ((field.type === 'file' || field.type === 'image') && item[key]) {
      this.uploadedFiles[key] = item[key];
    }
    else if (field.type === 'multiselect' && item[key]) {
      try {
        item[key] = JSON.parse(item[key]);
      } catch {
        item[key] = [];
      }
    }
    else if (field.type === 'date' && item[key]) {
      const date = new Date(item[key]);
      item[key] = date.toISOString().split('T')[0];
    }
    else if (field.type === 'datetime' && item[key]) {
      const date = new Date(item[key]);
      item[key] = date.toISOString();
    }
    else if (field.type === 'time' && item[key]) {
      // Conversion du temps stocké (HH:MM:SS) en Date object
      const timeParts = item[key].split(':');
      const date = new Date();
      date.setHours(parseInt(timeParts[0], 10));
      date.setMinutes(parseInt(timeParts[1], 10));
      date.setSeconds(timeParts[2] ? parseInt(timeParts[2], 10) : 0);
      item[key] = date;
    }
  });
  
  this.buildForm(item);
  this.formDialog = true;
}

  buildForm(item: any = {}): void {
    const group: { [key: string]: any } = {};
  
    this.dynamicFields.forEach(field => {
      const key = this.getFieldKey(field);
      let value = item[key] ?? null;
      
      // Convert data based on field type
      switch (field.type) {
        case 'date':
          if (value) {
            const date = new Date(value);
            value = date.toISOString().split('T')[0];
          }
          break;
          
        case 'datetime':
          if (value) {
            const date = new Date(value);
            value = date.toISOString().split('T')[0] + ' ' + date.toTimeString().split(' ')[0];
          }
          break;
          
          case 'time':
            if (value) {
              // Si c'est déjà un objet Date, le conserver
              if (value instanceof Date) {
                value = value;
              }
              // Si c'est une string (HH:MM:SS), convertir en Date
              else if (typeof value === 'string') {
                const timeParts = value.split(':');
                const date = new Date();
                date.setHours(parseInt(timeParts[0], 10));
                date.setMinutes(parseInt(timeParts[1], 10));
                date.setSeconds(timeParts[2] ? parseInt(timeParts[2], 10) : 0);
                value = date;
              }
            }
            break;
          
        case 'checkbox':
          value = value === 1 || value === '1' || value === true || value === 'true';
          break;
          
        case 'multiselect':
          if (typeof value === 'string') {
            try {
              value = JSON.parse(value);
            } catch {
              value = [];


            }
          }
          value = Array.isArray(value) ? value : [];
          break;
      }
  
      const validators = this.getValidatorsForField(field);
      group[key] = [value, validators];
    });
  
    this.dynamicForm = this.fb.group(group);
  }

  private getValidatorsForField(field: DynamicField): any[] {
    const validators = [];
    
    if (field.required) {
      validators.push(Validators.required);
    }
    
    if (field.validation) {
      if (field.validation.minLength) {
        validators.push(Validators.minLength(field.validation.minLength));
      }
      if (field.validation.maxLength) {
        validators.push(Validators.maxLength(field.validation.maxLength));
      }
      if (field.validation.pattern) {
        validators.push(Validators.pattern(field.validation.pattern));
      }
      if (field.type === 'number' || field.type === 'range') {
        if (field.validation.min !== undefined) {
          validators.push(Validators.min(field.validation.min));
        }
        if (field.validation.max !== undefined) {
          validators.push(Validators.max(field.validation.max));
        }
        if (field.type === 'range' && field.validation) {
          if (field.validation.min !== undefined) {
            validators.push(Validators.min(field.validation.min));
          }
          if (field.validation.max !== undefined) {
            validators.push(Validators.max(field.validation.max));
          }
        }
      }
      
      if (field.type === 'file' || field.type === 'image') {
        // Validateur pour les types de fichiers si nécessaire
      }
    }
    
    return validators;
  }

  getFieldKey(field: DynamicField): string {
    return field.name || field.label.toLowerCase().trim().replace(/\s+/g, '_');
  }

  slugify(text: string): string {
    return text.toLowerCase().trim().replace(/\s+/g, '_').replace(/[^\w]/g, '');
  }

  private padZero(value: number): string {
    return value < 10 ? `0${value}` : `${value}`;
  }

  openNew(): void {
    this.currentItemId = null;
    this.currentItem = null;
    this.buildForm();
    this.formDialog = true;
  }


  hideDialog(): void {
    this.formDialog = false;
    this.currentItemId = null;
    this.currentItem = null;
    this.dynamicForm.reset();
  }

  saveItem(): void {
    if (this.dynamicForm.invalid) {
        this.markFormGroupTouched(this.dynamicForm);
        this.messageService.add({
            severity: 'warn',
            summary: 'Validation',
            detail: 'Veuillez remplir tous les champs obligatoires correctement.',
            life: 5000
        });
        return;
    }

    this.isLoading = true;
    const formData = this.prepareFormData();

    const request$ = this.currentItemId
        ? this.formService.updateFormData(this.formId, this.currentItemId, formData)
        : this.formService.submitFormData(this.formId, formData);

    request$.subscribe({
        next: () => {
            const message = this.currentItemId 
                ? 'Données mises à jour avec succès.' 
                : 'Données enregistrées avec succès.';
            
            this.messageService.add({
                severity: 'success',
                summary: 'Succès',
                detail: message,
                life: 5000
            });
            
            this.formDialog = false;
            this.loadData();
            this.isLoading = false;
        },
        error: (err) => {
            this.handleError('Erreur lors de la sauvegarde', err);
            this.isLoading = false;
        }
    });
}
  

  deleteItem(item: any): void {
    if (!this.formId || !item?.id) return;

    this.isLoading = true;
    this.formService.deleteFormData(this.formId, item.id).subscribe({
      next: () => {
        this.messageService.add({
          severity: 'success',
          summary: 'Supprimé',
          detail: 'Élément supprimé avec succès.',
          life: 5000
        });
        this.loadData();
        this.isLoading = false;
      },
      error: (err) => {
        this.handleError('Erreur lors de la suppression', err);
        this.isLoading = false;
      }
    });
  }

  deleteSelectedItems(): void {
    if (this.selectedItems.length === 0) return;

    this.isLoading = true;
    const deleteRequests = this.selectedItems.map(item => 
      this.formService.deleteFormData(this.formId, item.id)
    );

    Promise.all(deleteRequests).then(() => {
      this.messageService.add({
        severity: 'success',
        summary: 'Suppression',
        detail: `${this.selectedItems.length} éléments supprimés avec succès`,
        life: 5000
      });
      this.selectedItems = [];
      this.loadData();
      this.isLoading = false;
    }).catch(err => {
      this.handleError('Erreur lors de la suppression multiple', err);
      this.isLoading = false;
    });
  }

  exportData(): void {
    const exportData = {
      form: {
        id: this.formId,
        name: this.formName,
        description: this.formDescription
      },
      fields: this.dynamicFields,
      data: this.formDataList
    };
    
    const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
    saveAs(blob, `form_data_${this.formName}_${new Date().toISOString()}.json`);
  }

  backToList(): void {
    this.router.navigate(['/forms']);
  }

  private markFormGroupTouched(formGroup: FormGroup | FormArray): void {
    Object.values(formGroup.controls).forEach(control => {
      control.markAsTouched();
      
      if (control instanceof FormGroup || control instanceof FormArray) {
        this.markFormGroupTouched(control);
      }
    });
  }

  getOptionLabel(field: DynamicField, value: any): string {
    if (!field.options || value === null || value === undefined) return String(value);
    
    const option = field.options.find(opt => opt.value === value);
    return option ? option.label : String(value);
  }

  getMultiOptionLabels(field: DynamicField, values: any[] | string): string {
    if (!field.options || !values) return '';
    
    let valueArray: any[] = [];
    if (typeof values === 'string') {
      try {
        valueArray = JSON.parse(values);
      } catch {
        valueArray = [];
      }
    } else {
      valueArray = Array.isArray(values) ? values : [];
    }
    
    return field.options
      .filter(opt => valueArray.includes(opt.value))
      .map(opt => opt.label)
      .join(', ');
  }

  isInvalid(fieldKey: string): boolean {
    const control = this.dynamicForm.get(fieldKey);
    return !!control && control.invalid && (control.dirty || control.touched);
  }

  private handleError(message: string, error: any): void {
    console.error(message, error);
    this.messageService.add({
      severity: 'error',
      summary: 'Erreur',
      detail: `${message}: ${error.message || 'Voir la console pour plus de détails'}`,
      life: 10000
    });
  }
}