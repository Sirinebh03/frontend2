import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { ErrorHandler } from '@angular/core';
import { HttpErrorResponse } from '@angular/common/http';
import { throwError } from 'rxjs';
import { FormGroup } from '@angular/forms';

@Injectable({
  providedIn: 'root'
})
export class FormService {
  private apiUrl = 'http://localhost:8000/api/forms';

  constructor(private http: HttpClient) {}

  // ---------------------- Form CRUD ----------------------

  // Créer un formulaire
 // In your FormService
saveForm(formData: any): Observable<any> {
  return this.http.post(`${this.apiUrl}`, formData);
  // Let browser set Content-Type with boundary
}

updateForm(id: number, formData: any): Observable<any> {
  // Envoyer en JSON directement, pas en FormData
  return this.http.put(`${this.apiUrl}/${id}`, formData).pipe(
    catchError(this.handleError)
  );
}
  
  saveFieldOptions(formId: number, fieldName: string, options: any[]): Observable<any> {
    return this.http.post(`${this.apiUrl}/${formId}/field-options`, {
        field_name: fieldName,
        options: options
    });
}

  // Récupérer tous les formulaires
  getForms(): Observable<any[]> {
    return this.http.get<any[]>(this.apiUrl);
  }

  // Récupérer un formulaire par son ID
  getFormById(id: string): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}/${id}`);
  }

  // Mettre à jour un formulaire
 

  // Supprimer un formulaire
  deleteForm(id: string): Observable<any> {
    return this.http.delete<any>(`${this.apiUrl}/${id}`);
  }

  // Récupérer la configuration d’un formulaire (champs, etc.)
  getFormConfig(id: number): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}/${id}/config`);
  }

  // ---------------------- Données d’entrée ----------------------

  // Envoyer les données d’un formulaire rempli
  submitFormData(id: string, data: any): Observable<any> {
    return this.http.post<any>(`${this.apiUrl}/${id}/submit`, data, {
      headers: new HttpHeaders({ 'Content-Type': 'application/json' })
    });
  }

  // Récupérer les données remplies pour un formulaire (entrées utilisateurs)
  getFormDataWithEntries(id: number): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}/${id}/data`);
  }

  // Mettre à jour une entrée spécifique d’un formulaire
  updateFormData(formId: any, itemId: number, data: any): Observable<any> {
    return this.http.put(`${this.apiUrl}/${formId}/entries/${itemId}/update`, data, {
      headers: new HttpHeaders({ 'Content-Type': 'application/json' })
    });
  }
  // Supprimer une entrée spécifique d’un formulaire
  deleteFormData(formId: any, itemId: number): Observable<any> {
    return this.http.delete(`${this.apiUrl}/${formId}/entries/${itemId}/delete`);
  }

  // ---------------------- Options dynamiques depuis la base ----------------------
  


 
  // Dans votre FormService
getDynamicOptions(table: string, keyColumn: string, valueColumn: string): Observable<{[key: string]: string}> {
  return this.http.get<{[key: string]: string}>(
      `${this.apiUrl}/tables/${table}/options?key_column=${keyColumn}&value_column=${valueColumn}`
  );
}


getTableFields(tableName: string): Observable<string[]> {
  return this.http.get<string[]>(`${this.apiUrl}/tables/${tableName}/columns`);
}

  // Récupérer les tables disponibles
  getAvailableTables(): Observable<string[]> {
    return this.http.get<string[]>(`${this.apiUrl}/table`);
  }

  // Récupérer les champs d'une table
  getFieldsFromTable(table: string): Observable<string[]> {
    return this.http.get<string[]>(`${this.apiUrl}/tables/${table}/fields`);
  }

  // Récupérer les options clé-valeur d'une table
  getTableFieldOptions(table: string, keyColumn: string, valueColumn: string): Observable<any[]> {
    return this.http.get<any[]>(`/api/table-options`, { params: { table, keyColumn, valueColumn } });
  }

  // Récupérer les valeurs d'une colonne
  getColumnValues(table: string, column: string): Observable<string[]> {
    return this.http.get<string[]>(`${this.apiUrl}/get-column-values/${table}/${column}`);
  }
  // Récupérer les options d'un champ spécifique
  getFieldOptions(table: string, field: string): Observable<any[]> {
    return this.http.get<any[]>(`${this.apiUrl}/tables/${table}/fields/${field}/options`);
  }

  private handleError(error: HttpErrorResponse): Observable<never> {
    let errorMessage = 'An unknown error occurred!';
    if (error.error instanceof ErrorEvent) {
      // Client-side or network error
      errorMessage = `Error: ${error.error.message}`;
    } else {
      // Backend error
      errorMessage = `Error Code: ${error.status}\nMessage: ${error.message}`;
    }
    console.error(errorMessage);
    return throwError(() => new Error(errorMessage));
  }
}
