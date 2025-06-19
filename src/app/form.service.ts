 import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders, HttpErrorResponse, HttpEvent } from '@angular/common/http';
import { Observable, throwError, of } from 'rxjs';
import { catchError, map } from 'rxjs/operators';
import { FormGroup } from '@angular/forms';
import { AuthService } from './auth.service'; // Service d'authentification à créer

@Injectable({
  providedIn: 'root'
})
export class FormService {
  private apiUrl = 'http://localhost:8000/api';

  constructor(private http: HttpClient, private authService: AuthService) {}

  // ---------------------- Méthodes Helper ----------------------

  private getAuthHeaders(): HttpHeaders {
    const token = this.authService.getToken();
    return new HttpHeaders({
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    });
  }

  private getAuthHeadersForFiles(): HttpHeaders {
    const token = this.authService.getToken();
    return new HttpHeaders({
      'Authorization': `Bearer ${token}`
    });
  }

  private handleError(error: HttpErrorResponse): Observable<never> {
    if (error.status === 401) {
      // Gérer l'expiration du token ou la déconnexion
      this.authService.logout();
      return throwError(() => new Error('Session expirée. Veuillez vous reconnecter.'));
    }
    
    let errorMessage = 'Une erreur est survenue';
    if (error.error instanceof ErrorEvent) {
      errorMessage = `Erreur client: ${error.error.message}`;
    } else {
      errorMessage = `Erreur serveur: ${error.status}\nMessage: ${error.message}`;
      if (error.error?.message) {
        errorMessage += `\nDétails: ${error.error.message}`;
      }
    }
    return throwError(() => new Error(errorMessage));
  }

  // ---------------------- Gestion des Formulaires ----------------------

  getForms(): Observable<any[]> {
    return this.http.get<any[]>(`${this.apiUrl}/forms`).pipe(
      catchError(this.handleError)
    );
  }

  getFormById(id: string): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}/forms/${id}`).pipe(
      catchError(this.handleError)
    );
  }

  getFormByName(name: string): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}/forms/${name}`).pipe(
      catchError(this.handleError)
    );
  }

getFormsWithPermissions() {
  return this.http.get(`${this.apiUrl}/forms/with-permissions`);
}

  getFormIdByName(name: string): Observable<number> {
    return this.http.get<{id: number}>(`${this.apiUrl}/forms/id-by-name/${name}`).pipe(
      map(response => response.id),
      catchError(this.handleError)
    );
  }

  saveForm(formData: any): Observable<any> {
    return this.http.post(`${this.apiUrl}/forms`, formData, {
      headers: this.getAuthHeaders()
    }).pipe(
      catchError(this.handleError)
    );
  }

  updateForm(id: number, formData: any): Observable<any> {
    return this.http.put(`${this.apiUrl}/forms/${id}`, formData, {
      headers: this.getAuthHeaders()
    }).pipe(
      catchError(this.handleError)
    );
  }

  deleteForm(id: string): Observable<any> {
    return this.http.delete(`${this.apiUrl}/forms/${id}`, {
      headers: this.getAuthHeaders()
    }).pipe(
      catchError(this.handleError)
    );
  }

getUserFormDetails(formId: string, userId: string): Observable<any> {
  return this.http.get(`${this.apiUrl}/forms/users/${formId}/${userId}`);
}

  getFormConfig(id: number): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}/forms/${id}/config`).pipe(
      catchError(this.handleError)
    );
  }
getuserforms(userId: string) {
  return this.http.get<{forms: any[]}>(`${this.apiUrl}/forms/userform/${userId}`)
  }

  // ---------------------- Gestion des Données de Formulaire ----------------------

submitFormData(formId: any, data: any): Observable<any> {
    const url = `${this.apiUrl}/forms/${formId}/submit`;
    const token = this.authService.getToken();
    
    // Convertir les données en FormData si des fichiers sont présents
    const hasFiles = Object.values(data).some(val => val instanceof File);
    
    if (hasFiles) {
        const formData = new FormData();
        
        // Ajouter tous les champs au FormData
        Object.keys(data).forEach(key => {
            if (data[key] instanceof File) {
                formData.append(key, data[key]);
            } else if (typeof data[key] === 'object') {
                formData.append(key, JSON.stringify(data[key]));
            } else {
                formData.append(key, data[key]);
            }
        });
        
        return this.http.post(url, formData, {
            headers: new HttpHeaders({
                'Authorization': `Bearer ${token}`
                // Ne pas mettre 'Content-Type' pour FormData, il sera automatiquement défini
            })
        }).pipe(
            catchError(this.handleError)
        );
    } else {
        // Cas normal sans fichiers
        return this.http.post(url, data, {
            headers: new HttpHeaders({
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            })
        }).pipe(
            catchError(this.handleError)
        );
    }
}
  updateFormData(formId: any, entryId: number, data: any): Observable<any> {
    return this.http.put(`${this.apiUrl}/forms/${formId}/entries/${entryId}`, data, {
      headers: this.getAuthHeaders()
    }).pipe(
      catchError(this.handleError)
    );
  }

  deleteFormData(formId: any, entryId: number): Observable<any> {
    return this.http.delete(`${this.apiUrl}/forms/${formId}/entries/${entryId}`, {
      headers: this.getAuthHeaders()
    }).pipe(
      catchError(this.handleError)
    );
  }

  getUserFormEntries(formId: string): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}/forms/user/${formId}/entries`, {
      headers: this.getAuthHeaders()
    }).pipe(
      catchError(this.handleError)
    );
  }

 getFormDataWithEntries(formId: number): Observable<any> {
  return this.http.get<any>(`${this.apiUrl}/forms/${formId}/data`).pipe(
    catchError(error => {
      console.error('Error fetching form data:', error);
      // Retourner un objet avec un tableau vide si erreur
      return of({ entries: [], form_data: [] });
    })
  );
}

  // ---------------------- Gestion des Fichiers ----------------------

  uploadFile(formId: string, file: File): Observable<any> {
    const formData = new FormData();
    formData.append('file', file);
    
    return this.http.post(`${this.apiUrl}/forms/${formId}/upload`, formData, {
      headers: this.getAuthHeadersForFiles(),
      reportProgress: true
    }).pipe(
      catchError(this.handleError)
    );
  }

  deleteFormFile(formId: string, filename: string): Observable<any> {
    return this.http.delete(`${this.apiUrl}/forms/${formId}/files/${filename}`, {
      headers: this.getAuthHeaders()
    }).pipe(
      catchError(this.handleError)
    );
  }

  getFileUrl(formId: number, filename: string): string {
    return `${this.apiUrl}/forms/${formId}/files/${filename}`;
  }

  isFormFileImage(filename: string): boolean {
    const imageExtensions = ['jpg', 'jpeg', 'png', 'gif', 'webp', 'bmp', 'svg'];
    const extension = filename.split('.').pop()?.toLowerCase();
    return extension ? imageExtensions.includes(extension) : false;
  }

  // ---------------------- Options Dynamiques ----------------------

  getAvailableTables(): Observable<string[]> {
    return this.http.get<string[]>(`${this.apiUrl}/forms/table`).pipe(
      catchError(this.handleError)
    );
  }

  getTableFields(tableName: string): Observable<string[]> {
    return this.http.get<string[]>(`${this.apiUrl}/forms/tables/${tableName}/fields`).pipe(
      catchError(this.handleError)
    );
  }

  getColumnValues(table: string, column: string): Observable<string[]> {
    return this.http.get<string[]>(`${this.apiUrl}/forms/get-column-values/${table}/${column}`).pipe(
      catchError(this.handleError)
    );
  }

  
// Nouvelle méthode optimisée pour les options dynamiques
getDynamicFieldOptions(table: string, keyColumn: string, valueColumn: string, whereClause?: string): Observable<any[]> {
  const params: any = {
    key_column: keyColumn,
    value_column: valueColumn
  };
  
  if (whereClause) {
    params.where = whereClause;
  }

  return this.http.get<any[]>(
    `${this.apiUrl}/forms/tables/${table}/options`,
    { params }
  ).pipe(
    map(options => options.map(opt => ({
      key: opt.key?.toString() || '',
      value: opt.value?.toString() || opt.label?.toString() || ''
    }))),
    catchError(this.handleError)
  );
}

  getFieldOptions(formId: number, fieldName: string): Observable<any[]> {
    return this.http.get<any[]>(`${this.apiUrl}/forms/options/${formId}/${fieldName}`).pipe(
      catchError(this.handleError)
    );
  }

  saveFieldOptions(formId: number, fieldName: string, options: any[]): Observable<any> {
    return this.http.post(`${this.apiUrl}/forms/${formId}/field-options`, {
      field_name: fieldName,
      options: options
    }, {
      headers: this.getAuthHeaders()
    }).pipe(
      catchError(this.handleError)
    );
  }

  // ---------------------- Métadonnées ----------------------

  getFormMetadata(formId: number): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}/forms/${formId}/metadata`).pipe(
      catchError(this.handleError)
    );
  }
  // For table field options
getTableFieldOptions(table: string, keyColumn: string, valueColumn: string): Observable<any> {
  return this.http.get<any>(
    `${this.apiUrl}/forms/tables/${table}/options`,
    { params: { key_column: keyColumn, value_column: valueColumn } }
  ).pipe(
    catchError(this.handleError)
  );
}

// For form-specific file URLs
// Dans form.service.ts
getFormSpecificFileUrl(formId: any, filenameOrPath: string): string {
  if (!filenameOrPath) return '';
  
  // Si c'est déjà une URL complète
  if (filenameOrPath.startsWith('http') || filenameOrPath.startsWith('/')) {
    return filenameOrPath;
  }
  
  // Extraire le nom de fichier si c'est un chemin
  const filename = filenameOrPath.split('/').pop();
  
  return `http://localhost:8000/storage/uploads/forms/${formId}/${filename}`;
}

// For upload URLs
getUploadUrl(formId: string | number): string {
  return `${this.apiUrl}/forms/${formId}/upload`;
}

// Slugify helper method
slugify(text: string): string {
  return text.toString().toLowerCase()
    .replace(/\s+/g, '-')           // Replace spaces with -
    .replace(/[^\w\-]+/g, '')       // Remove all non-word chars
    .replace(/\-\-+/g, '-')         // Replace multiple - with single -
    .replace(/^-+/, '')             // Trim - from start of text
    .replace(/-+$/, '');            // Trim - from end of text
}
}