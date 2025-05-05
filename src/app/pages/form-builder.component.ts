import { Component, OnInit, OnDestroy, ChangeDetectorRef, ViewChild } from '@angular/core';
import { FormBuilder, FormGroup, Validators, FormArray } from '@angular/forms';
import { CdkDragDrop, moveItemInArray } from '@angular/cdk/drag-drop';
import { saveAs } from 'file-saver';
import { Subscription } from 'rxjs';
import { FormService } from '../form.service';
import { ActivatedRoute, Router } from '@angular/router';
import { MessageService } from 'primeng/api';
import { Table } from 'primeng/table';

interface Option {
  key: string;
  value: string;
}

interface FormElement {
  id: string;
  label: string;
  type: string;
  placeholder?: string;
  maxLength?: number;
  min?: number;
  max?: number;
  required?: boolean;
  pattern?: string;
  rows?: number;
  name?: string;
  options: Option[];
  sourceTable?: string;
  keyColumn?: string;
  valueColumn?: string;
  dynamic?: boolean;
  selectedOption?: any;
  selectedOptions?: any[];
  accept?: string;
  multiple?: boolean;
  previewUrl?: string;
}

@Component({
  selector: 'app-form-builder',
  templateUrl: './form-builder.component.html',
  styleUrls: ['./form-builder.component.scss'],
  providers: [MessageService]
})
export class FormBuilderComponent implements OnInit, OnDestroy {
  @ViewChild('dt') dt!: Table;
  
  form!: FormGroup;
  formElements: FormElement[] = [];
  availableTables: string[] = [];
  subscriptions: Subscription[] = [];
  sourceTableFields: string[] = [];
  sourceColumnFields: string[] = [];
  existingForms: any[] = [];
  selectedFiles: File[] = [];
  
  mode: 'builder' | 'editor' = 'builder';
  selectedFormId: any;
  isFormListVisible = false;
  isEditMode = false;
  currentFormId: any;
  isLoading = false;

  elements: FormElement[] = [
    { id: '1', name: 'Texte', label: 'Texte', type: 'text', placeholder: 'Entrez du texte...', maxLength: 255, required: true, options: [] },
    { id: '2', name: 'nombre', label: 'Nombre', type: 'number', min: 0, max: 1000, options: [] },
    { id: '3', name: 'mot_de_passe', label: 'Mot de passe', type: 'password', placeholder: 'Mot de passe...', options: [] },
    { id: '4', name: 'Date', label: 'Date', type: 'date', required: true, options: [] },
    { id: '5', name: 'Email', label: 'Email', type: 'email', placeholder: 'Entrez un email...', pattern: '', options: [] },
    { id: '6', name: 'Textarea', label: 'Textarea', type: 'textarea', placeholder: 'Entrez du texte...', maxLength: 500, rows: 5, options: [] },
    { id: '7', name: 'selection', label: 'Sélection', type: 'select', options: [] },
    { id: '8', name: 'Radio', label: 'Radio', type: 'radio', options: [{ key: 'Oui', value: 'Oui' }, { key: 'Non', value: 'Non' }] },
    { id: '9', name: 'checkbox', label: 'Checkbox', type: 'checkbox', options: [] },
    { id: '10', name: 'multiselect', label: 'Multisélection', type: 'multiselect', options: [{ key: 'Option 1', value: 'Option 1' }, { key: 'Option 2', value: 'Option 2' }, { key: 'Option 3', value: 'Option 3' }] },
    { id: '11', name: 'fichier', label: 'Fichier', type: 'file', options: [] },
    { id: '12', name: 'image', label: 'Image', type: 'image', accept: 'image/*', options: [] },
    { id: '13', name: 'fichiers_multiple', label: 'Fichiers multiples', type: 'file', multiple: true, options: [] },
    { id: '14', name: 'couleur', label: 'Couleur', type: 'color', options: [] },
    { id: '15', name: 'range', label: 'Plage', type: 'range', min: 0, max: 100, options: [] },
    { id: '16', name: 'time', label: 'Heure', type: 'time', required: true, options: [] }   

  ];

  selectedElement: FormElement | null = null;
  selectedElementForm!: FormGroup;
  showModal = false;

  constructor(
    private fb: FormBuilder,
    private formService: FormService,
    private route: ActivatedRoute,
    private cdr: ChangeDetectorRef,
    private messageService: MessageService,
    private router: Router
  ) {
    this.initSelectedElementForm();
  }

  ngOnInit(): void {
    this.initMainForm();
    this.loadAvailableTables();
    this.loadExistingForms();
    this.route.queryParams.subscribe(params => {
      if (params['edit']) {
        this.isEditMode = true;
        this.currentFormId = params['edit'];
        this.loadFormForEditing(params['edit']);
      }
    });
  }

  ngOnDestroy(): void {
    this.subscriptions.forEach(sub => sub.unsubscribe());
  }

  initMainForm(): void {
    this.form = this.fb.group({
      formName: ['', [Validators.required, Validators.maxLength(255), Validators.pattern(/^[a-zA-Z0-9_\- ]+$/)]],
      formDescription: ['']
    });
  }

  initSelectedElementForm(): void {
    this.selectedElementForm = this.fb.group({
      name: ['', [Validators.required, Validators.pattern(/^[a-zA-Z][a-zA-Z0-9_]*$/)]],
      label: ['', Validators.required],
      placeholder: [''],
      maxLength: [null, [Validators.min(1), Validators.max(65535)]],
      type: ['', Validators.required],
      min: [null],
      max: [null],
      required: [false],
      pattern: [''],
      rows: [null, [Validators.min(1), Validators.max(20)]],
      options: this.fb.array([]),
      newOptionKey: [''],
      newOptionValue: [''],
      sourceTable: [''],
      keyColumn: [''],
      valueColumn: [''],
      dynamic: [false],
      accept: [''],
      multiple: [false],
      validation: this.fb.group({
        minLength: [null],
        maxLength: [null],
        pattern: [''],
        required: [false]
      })
    });
  }

  loadAvailableTables(): void {
    this.isLoading = true;
    this.subscriptions.push(
      this.formService.getAvailableTables().subscribe({
        next: (tables) => {
          this.availableTables = tables;
          this.isLoading = false;
        },
        error: (error) => {
          this.messageService.add({
            severity: 'error',
            summary: 'Erreur',
            detail: 'Erreur lors du chargement des tables',
            life: 5000
          });
          this.isLoading = false;
        }
      })
    );
  }

  loadExistingForms(): void {
    this.isLoading = true;
    this.subscriptions.push(
      this.formService.getForms().subscribe({
        next: (forms) => {
          this.existingForms = forms;
          this.isLoading = false;
        },
        error: (error) => {
          this.messageService.add({
            severity: 'error',
            summary: 'Erreur',
            detail: 'Erreur lors du chargement des formulaires',
            life: 5000
          });
          this.isLoading = false;
        }
      })
    );
  }

  loadFormForEditing(formId: any): void {
    this.mode = 'editor';
    this.selectedFormId = formId;
    this.isFormListVisible = false;
    this.isLoading = true;
    
    this.subscriptions.push(
      this.formService.getFormById(formId).subscribe({
        next: (form) => {
          this.form.patchValue({ 
            formName: form.name,
            formDescription: form.description 
          });
          
          try {
            this.formElements = JSON.parse(form.form_data);
            this.validateFormElements();
          } catch (e) {
            this.messageService.add({
              severity: 'error',
              summary: 'Erreur',
              detail: 'Format de données invalide',
              life: 5000
            });
            this.formElements = [];
          }
          this.isLoading = false;
        },
        error: (error) => {
          this.messageService.add({
            severity: 'error',
            summary: 'Erreur',
            detail: 'Erreur lors du chargement du formulaire',
            life: 5000
          });
          this.isLoading = false;
        }
      })
    );
  }

  private validateFormElements(): void {
    this.formElements = this.formElements.map(element => {
      if (!element.name || !/^[a-zA-Z][a-zA-Z0-9_]*$/.test(element.name)) {
        element.name = this.generateUniqueName(element.type);
      }
      
      if (element.options) {
        element.options = element.options.map(opt => {
          if (typeof opt === 'string') {
            return { key: opt, value: opt };
          }
          return opt;
        });
      }
      
      return element;
    });
  }

  switchToBuilderMode(): void {
    this.mode = 'builder';
    this.selectedFormId = null;
    this.resetForm();
  }

  toggleFormList(): void {
    this.isFormListVisible = !this.isFormListVisible;
  }

  loadFieldsForSelectedTable(table: string): void {
    if (!table) return;
    
    this.isLoading = true;
    this.subscriptions.push(
      this.formService.getTableFields(table).subscribe({
        next: (fields) => {
          this.sourceTableFields = fields;
          this.sourceColumnFields = fields;
          this.cdr.detectChanges();
          this.isLoading = false;
        },
        error: (error) => {
          this.messageService.add({
            severity: 'error',
            summary: 'Erreur',
            detail: 'Erreur lors du chargement des colonnes',
            life: 5000
          });
          this.isLoading = false;
        }
      })
    );
  }

  loadDynamicOptions(table: string, keyColumn: string, valueColumn: string, element: FormElement): void {
    if (!table || !keyColumn || !valueColumn) return;
    
    this.isLoading = true;
    this.subscriptions.push(
      this.formService.getTableFieldOptions(table, keyColumn, valueColumn).subscribe({
        next: (options: any[]) => {
          element.options = options.map((opt: any) => ({
            key: opt.value?.toString() || '', // Explicit conversion to string
            value: opt.label?.toString() || '' // Explicit conversion to string
          }));
          this.isLoading = false;
        },
        error: (error) => {
          this.messageService.add({
            severity: 'error',
            summary: 'Erreur',
            detail: 'Erreur lors du chargement des options',
            life: 5000
          });
          this.isLoading = false;
        }
      })
    );
  }

  generateUniqueName(base = 'field'): string {
    let index = 1;
    let name = `${base}_${index}`;
    const existingNames = this.formElements.map(e => e.name);
    while (existingNames.includes(name)) {
      index++;
      name = `${base}_${index}`;
    }
    return name;
  }

  deepCloneElement(element: FormElement): FormElement {
    return {
      ...element,
      id: Math.random().toString(36).substring(2, 9),
      name: this.generateUniqueName(element.type),
      options: element.options ? [...element.options] : []
    };
  }

  drop(event: CdkDragDrop<FormElement[]>): void {
    if (event.previousContainer === event.container) {
      moveItemInArray(event.container.data, event.previousIndex, event.currentIndex);
    } else {
      const copiedElement = this.deepCloneElement(event.previousContainer.data[event.previousIndex]);
      this.formElements.splice(event.currentIndex, 0, copiedElement);
      this.openModal(copiedElement);
    }
  }

  openModal(element: FormElement): void {
    this.selectedElement = element;
    
    const optionsFormArray = this.initOptionsFormArray(element.options);
    
    this.selectedElementForm = this.fb.group({
      name: [element.name || '', Validators.required],
      label: [element.label || '', Validators.required],
      type: [element.type || '', Validators.required],
      placeholder: [element.placeholder || ''],
      maxLength: [element.maxLength ?? null],
      min: [element.min ?? null],
      max: [element.max ?? null],
      required: [element.required ?? false],
      pattern: [element.pattern || ''],
      rows: [element.rows ?? null],
      options: optionsFormArray,
      newOptionKey: [''],
      newOptionValue: [''],
      sourceTable: [element.sourceTable || ''],
      keyColumn: [element.keyColumn || ''],
      valueColumn: [element.valueColumn || ''],
      dynamic: [element.dynamic ?? false],
      accept: [element.accept || ''],
      multiple: [element.multiple ?? false],
      validation: this.fb.group({
       
        maxLength: [element?.maxLength ?? null],
        pattern: [element?.pattern ?? ''],
        required: [element?.required ?? false]
      })
    });
  
    this.showModal = true;
    this.cdr.detectChanges();
  
    if (['select', 'multiselect', 'radio'].includes(element.type)) {
      if (element.dynamic && element.sourceTable) {
        this.loadFieldsForSelectedTable(element.sourceTable);
      }
    }
  }

  closeModal(): void {
    this.showModal = false;
    this.selectedElement = null;
    this.selectedElementForm.reset();
    this.initSelectedElementForm();
  }

  saveElement(): void {
    if (!this.selectedElement || this.selectedElementForm.invalid) {
      this.markAllFormControlsAsTouched(this.selectedElementForm);
      this.messageService.add({
        severity: 'warn',
        summary: 'Validation',
        detail: 'Veuillez remplir tous les champs obligatoires',
        life: 5000
      });
      return;
    }

    const formValues = this.selectedElementForm.value;
    
    Object.assign(this.selectedElement, {
      name: formValues.name,
      label: formValues.label,
      placeholder: formValues.placeholder,
      maxLength: formValues.maxLength,
      min: formValues.min,
      max: formValues.max,
      required: formValues.required,
      pattern: formValues.pattern,
      rows: formValues.rows,
      sourceTable: formValues.sourceTable,
      keyColumn: formValues.keyColumn,
      valueColumn: formValues.valueColumn,
      dynamic: formValues.dynamic,
      accept: formValues.accept,
      multiple: formValues.multiple,
      validation: formValues.validation
    });

    if (formValues.dynamic && formValues.sourceTable && formValues.keyColumn && formValues.valueColumn) {
      // Les options seront chargées dynamiquement
      this.selectedElement.options = [];
    } 
    else if (!formValues.dynamic && ['select', 'radio', 'checkbox', 'multiselect'].includes(formValues.type)) {
      const optionsArray = this.selectedElementForm.get('options') as FormArray;
      this.selectedElement.options = optionsArray.controls.map(control => ({
        key: control.value.key,
        value: control.value.value
      }));
    }
    
    this.closeModal();
  }

  private markAllFormControlsAsTouched(formGroup: FormGroup | FormArray): void {
    Object.values(formGroup.controls).forEach(control => {
      control.markAsTouched();
      
      if (control instanceof FormGroup || control instanceof FormArray) {
        this.markAllFormControlsAsTouched(control);
      }
    });
  }

  addOption(): void {
    const key = this.selectedElementForm.get('newOptionKey')?.value;
    const value = this.selectedElementForm.get('newOptionValue')?.value;

    if (key && value) {
      const options = this.selectedElementForm.get('options') as FormArray;
      options.push(this.fb.group({ 
        key: [key, Validators.required], 
        value: [value, Validators.required] 
      }));
      this.selectedElementForm.get('newOptionKey')?.reset();
      this.selectedElementForm.get('newOptionValue')?.reset();
    }
  }

  removeOption(index: number): void {
    const options = this.selectedElementForm.get('options') as FormArray;
    options.removeAt(index);
  }

  initOptionsFormArray(options: Option[] = []): FormArray {
    return this.fb.array(
      options.map(opt => this.fb.group({
        key: [opt.key, Validators.required],
        value: [opt.value, Validators.required]
      }))
    );
  }

  handleFileInput(event: any, fieldName: string): void {
    const files: FileList = event.target.files;
    const field = this.formElements.find(f => f.name === fieldName);
    
    if (field && files.length > 0) {
      if (field.type === 'image') {
        const reader = new FileReader();
        reader.onload = (e: any) => {
          field.previewUrl = e.target.result;
          this.cdr.detectChanges();
        };
        reader.readAsDataURL(files[0]);
      }
      
      this.selectedFiles = Array.from(files);
    }
  }

async saveForm(): Promise<void> {
  if (!this.form.valid) {
    this.markAllFormControlsAsTouched(this.form);
    this.messageService.add({
      severity: 'error',
      summary: 'Erreur',
      detail: 'Veuillez donner un nom valide au formulaire',
      life: 5000
    });
    return;
  }

  if (this.formElements.length === 0) {
    this.messageService.add({
      severity: 'error',
      summary: 'Erreur',
      detail: 'Veuillez ajouter au moins un champ au formulaire',
      life: 5000
    });
    return;
  }

  this.isLoading = true;
  
  try {
    // Modifié ici - envoyer directement le tableau de fields
    const formData = {
      name: this.form.get('formName')?.value,
      form_data: this.formElements.map(element => ({
        name: element.name,
        type: element.type,
        label: element.label,
        placeholder: element.placeholder,
        required: element.required,
        options: element.options,
        // Include all other necessary fields
        ...element
      })),
      description: this.form.get('formDescription')?.value
    };

    const saveObservable = this.mode === 'editor' && this.selectedFormId
      ? this.formService.updateForm(this.selectedFormId, formData)
      : this.formService.saveForm(formData);

    this.subscriptions.push(
      saveObservable.subscribe({
        next: (response) => {
          this.messageService.add({
            severity: 'success',
            summary: 'Succès',
            detail: 'Formulaire sauvegardé avec succès!',
            life: 5000
          });
          this.resetForm();
          this.loadExistingForms();
          this.router.navigate(['/forms']);
          this.isLoading = false;
        },
        error: (error) => {
          console.error('Full error:', error);
          let errorMessage = 'Une erreur est survenue';
          
          if (error.error?.errors) {
            const errors = Object.values(error.error.errors).flat();
            errorMessage = errors.join('\n');
          } else if (error.message) {
            errorMessage = error.message;
          }
          
          this.messageService.add({
            severity: 'error',
            summary: 'Erreur',
            detail: errorMessage,
            life: 10000
          });
          this.isLoading = false;
        }
      })
    );
  } catch (e) {
    this.handleSaveError(e);
    this.isLoading = false;
  }
}
  private handleSaveError(error: any): void {
    this.isLoading = false;
    let errorMessage = 'Erreur lors de la sauvegarde';
    
    if (error?.error?.message) {
      errorMessage = error.error.message;
    } else if (error?.message) {
      errorMessage = error.message;
    }
  
    this.messageService.add({
      severity: 'error',
      summary: 'Erreur',
      detail: errorMessage,
      life: 10000
    });
  }

  resetForm(): void {
    this.form.reset();
    this.formElements = [];
    this.selectedFiles = [];
    this.selectedFormId = null;
    this.isEditMode = false;
    this.currentFormId = null;
  }

  exportForm(): void {
    const exportData = {
      form: this.form.value,
      elements: this.formElements,
      files: this.selectedFiles.map(f => f.name)
    };
    
    const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
    saveAs(blob, `form_${this.form.value.formName || 'template'}_${new Date().toISOString()}.json`);
  }

  removeElement(index: number): void {
    this.formElements.splice(index, 1);
  }

  get optionsArray(): FormArray {
    return this.selectedElementForm.get('options') as FormArray;
  }

  getOptionsForField(field: FormElement): Option[] {
    return field.options || [];
  }
}