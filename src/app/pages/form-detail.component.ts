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

interface FormEntry {
  id: number;
    user_id?: string;
  user_info?: {
    username?: string;
    email?: string;
    firstName?: string;
    lastName?: string;
  };
  [key: string]: any;
  filePreviews?: {
    [fieldName: string]: {
      url: string;
      type: 'image' | 'file';
      name: string;
    }
  };
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
  accept?: string;
  multiple?: boolean;
  rows?: number;
  cols?: number;
}

interface FormResponse {
  form_data: DynamicField[];
  entries: {
    data: any[];
    current_page: number;
  };
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
  name: string = '';
  formConfig: any[] = [];
  formName = '';
  formDescription = '';

  dynamicForm: FormGroup = this.fb.group({});
  currentItemId: number | null = null;
  currentItem: any = null;
  uploadUrl: string = '/api/forms/upload';
  uploadError: string | null = null;
uploadedFiles: { [key: string]: File | string } = {};
  imagePreviewVisible: boolean = false;
  previewImageUrl: string = '';

  constructor(
    private route: ActivatedRoute,
    private formService: FormService,
    private fb: FormBuilder,
    private messageService: MessageService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.route.paramMap.subscribe(params => {
      this.name = params.get('name') || '';
      
      // Récupérez l'ID correspondant au nom
      this.formService.getFormIdByName(this.name).subscribe({
        next: (id) => {
          this.formId = id;
          this.loadData();
        },
        error: (err) => {
          this.handleError('Form not found', err);
          this.router.navigate(['/forms']);
        }
      });
    });
  }

 // Dans form-detail.component.ts
showImagePreview(imageUrl: string): void {
  if (!imageUrl) return;
  
  // Si c'est déjà une URL complète
  if (imageUrl.startsWith('http') || imageUrl.startsWith('/')) {
    this.previewImageUrl = imageUrl;
  } 
  // Si c'est un chemin relatif
  else {
    this.previewImageUrl = this.formService.getFormSpecificFileUrl(this.formId, imageUrl);
  }
  
  this.imagePreviewVisible = true;
}

handleImageError(event: any, item: any, field: DynamicField): void {
  const fieldKey = this.getFieldKey(field);
  if (item.filePreviews && item.filePreviews[fieldKey]) {
    item.filePreviews[fieldKey].url = 'assets/images/placeholder.png';
  }
}
  downloadFile(fileUrl: string): void {
    window.open(fileUrl, '_blank');
  }

  getUploadUrl(field: DynamicField): string {
    return this.formService.getUploadUrl(this.formId);
  }

  deleteFile(item: any, field: DynamicField): void {
    const fieldName = this.getFieldKey(field);
    const filename = item[fieldName]?.split('/').pop();
    
    if (!filename) return;
  
    this.isLoading = true;
    this.formService.deleteFormFile(this.formId, filename).subscribe({
      next: () => {
        item[fieldName] = null;
        if (item.filePreviews && item.filePreviews[fieldName]) {
          delete item.filePreviews[fieldName];
        }
        
        this.messageService.add({
          severity: 'success',
          summary: 'Fichier supprimé',
          detail: 'Le fichier a été supprimé avec succès',
          life: 5000
        });
        this.isLoading = false;
      },
      error: (err) => {
        this.handleError('Erreur lors de la suppression du fichier', err);
        this.isLoading = false;
      }
    });
  }

loadData(): Promise<void> {
  return new Promise((resolve, reject) => {
    if (!this.formId) {
      reject('No form ID');
      return;
    }

    this.isLoading = true;
    
    this.formService.getFormDataWithEntries(this.formId).subscribe({
      next: (res: FormResponse) => {
        // Correction ici: accédez à res.entries.data au lieu de res.entries
        const entries = Array.isArray(res.entries?.data) ? res.entries.data : [];
        
        this.formDataList = entries.map(entry => {
          const processedEntry: any = { ...entry };

          (res.form_data || []).forEach(field => {
            const fieldName = field.name || this.formService.slugify(field.label);
            
            if ((field.type === 'file' || field.type === 'image') && entry[fieldName]) {
              processedEntry.filePreviews = processedEntry.filePreviews || {};
              
              processedEntry.filePreviews[fieldName] = {
                url: this.formService.getFormSpecificFileUrl(this.formId, entry[fieldName]),
                type: field.type,
                name: entry[fieldName].split('/').pop(),
                extension: entry[fieldName].split('.').pop()?.toLowerCase()
              };
            }
          });

          return processedEntry;
        });

        this.dynamicFields = this.processFormFields(res.form_data || []);
        this.buildForm();
        this.loadFormMetadata();
        this.isLoading = false;
        resolve();
      },
      error: (err) => {
        this.handleError('Erreur lors du chargement des données', err);
        this.isLoading = false;
        reject(err);
      }
    });
  });
}

  private loadFormMetadata(): void {
    this.formService.getFormMetadata(this.formId).subscribe({
      next: (form) => {
        this.formName = form.name;
        this.formDescription = form.description;
        this.uploadUrl = this.formService.getUploadUrl(this.formId);
      },
      error: (err) => this.handleError('Erreur métadonnées', err)
    });
  }

  private processFormFields(fields: any[]): DynamicField[] {
    return fields.map(field => {
      if (!field.name && !field.label) {
        console.warn('Field has neither name nor label:', field);
        field.name = 'unnamed_field_' + Math.random().toString(36).substring(2);
      } else if (!field.name) {
        field.name = this.slugify(field.label);
      }
      
      if (field.options) {
        field.options = this.normalizeOptions(field.options);
      }
      
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
  removeFile(field: DynamicField): void {
    const key = this.getFieldKey(field);
    delete this.uploadedFiles[key];
    this.dynamicForm.get(key)?.setValue(null);
  }

 onUpload(event: any, field: DynamicField): void {
  console.log(event)
   console.log('Selected files:', this.dynamicForm.value);
    const files = event.currentFiles;
    this.dynamicForm.get(field.name)?.setValue(files);
    console.log('Selected files:', this.dynamicForm.value);
  }
/*
  onUpload(event: any, field: DynamicField): void {



    if (event.originalEvent?.status === 200) {
      const response = event.originalEvent.body;
      if (response && response.filePath) {
        const key = this.getFieldKey(field);
        this.uploadedFiles[key] = response.filePath;
        this.dynamicForm.get(key)?.setValue(response.filePath);
        this.uploadError = null;
        this.messageService.add({
          severity: 'success',
          summary: 'Upload réussi',
          detail: 'Fichier téléversé avec succès'
        });
      }
    } else {
      const error = event.originalEvent?.error;
      this.uploadError = error?.message || 'Échec du téléversement';
      
      if (error?.errors) {
        const errorMessages = Object.values(error.errors).join(', ');
        this.messageService.add({
          severity: 'error',
          summary: 'Erreur de validation',
          detail: errorMessages,
          life: 10000
        });
      }
    }
   
  }
   */
  private prepareFormData(): any {
    const rawData = this.dynamicForm.value;
    const mappedData: any = {};

    this.dynamicFields.forEach((field) => {
      const key = this.getFieldKey(field);
      const value = rawData[key];

        if (field.type === 'file' || field.type === 'image') {
            if (this.uploadedFiles[key] && !(this.uploadedFiles[key] instanceof File)) {
                mappedData[key] = this.uploadedFiles[key];
            }
            return;
        }
      switch (field.type) {
        case 'date':
        case 'datetime':
          mappedData[key] = value ? new Date(value).toISOString() : null;
          break;
        case 'time':
          if (value instanceof Date) {
            mappedData[key] = 
              `${this.padZero(value.getHours())}:${this.padZero(value.getMinutes())}:${this.padZero(value.getSeconds())}`;
          } else if (value) {
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

  editItem(item: any): void {
    this.currentItemId = item.id;
    this.currentItem = { ...item };
    this.uploadedFiles = {};
    
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
          item[key] = (item[key]);
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
    if (this.dynamicFields.length === 0) {
      console.warn('Cannot build form - no fields available');
      this.dynamicForm = this.fb.group({});
      return;
    }

    const group: { [key: string]: any } = {};

    this.dynamicFields.forEach(field => {
      const key = this.getFieldKey(field);
      let value = item[key] ?? null;
        
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
            if (value instanceof Date) {
              value = value;
            }
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
    this.isLoading = true;
    if (this.dynamicFields.length === 0) {
      this.loadData().finally(() => {
        this.isLoading = false;
        this.showFormDialog();
      });
    } else {
      this.isLoading = false;
      this.showFormDialog();
    }
  }

  private showFormDialog(): void {
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

    // Préparer les fichiers pour l'envoi
    const filesToUpload: {[key: string]: File} = {};
    Object.keys(this.uploadedFiles).forEach(key => {
        if (this.uploadedFiles[key] instanceof File) {
            filesToUpload[key] = this.uploadedFiles[key] as File;
        }
    });

    // Fusionner les données avec les fichiers
    const submissionData = {...formData, ...filesToUpload};

    const request$ = this.currentItemId
        ? this.formService.updateFormData(this.formId, this.currentItemId, submissionData)
        : this.formService.submitFormData(this.formId, submissionData);

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
    let errorMessage = error.message || 'Unknown error occurred';
    
    if (error.error?.message) {
      errorMessage = error.error.message;
    } else if (error.statusText) {
      errorMessage += ` (${error.statusText})`;
    }

    this.messageService.add({
      severity: 'error',
      summary: 'Erreur',
      detail: `${message}: ${errorMessage}`,
      life: 10000
    });
  }
}