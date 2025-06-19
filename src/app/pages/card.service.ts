import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';

// ✅ Définition du modèle Card ici
export interface Card {
  id?: number;
  label: string;
  description?: string;
  value: string;
  created_at?: string;
  updated_at?: string;
}

@Injectable({
  providedIn: 'root'
})
export class CardService {
  private apiUrl = 'http://localhost:8000/api/cards'; // adapte selon ton backend

  constructor(private http: HttpClient) {}

  getCards(): Observable<Card[]> {
    return this.http.get<Card[]>(this.apiUrl);
  }

  addCard(card: Card): Observable<Card> {
    return this.http.post<Card>(this.apiUrl, card);
  }
  updateCard(card: any) {
  return this.http.put(`${this.apiUrl}/${card.id}`, card);
}

deleteCard(id: number) {
  return this.http.delete(`${this.apiUrl}/${id}`);
}

}
