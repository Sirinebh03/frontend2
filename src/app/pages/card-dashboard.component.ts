import { Component, OnInit } from '@angular/core';
import { CardService } from './card.service';
import { AuthService } from '../auth.service'; // Assurez-vous que le chemin est correct

// ✅ Modèle de carte
interface Card {
  id?: number;
  label: string;
  description?: string;
  value: string;
  created_at?: string;
  updated_at?: string;
}

@Component({
  selector: 'app-card-dashboard',
  templateUrl: '../demo/view/dashboard.component.html' // ou le bon chemin vers le template
})
export class CardDashboardComponent implements OnInit {
  cards: Card[] = [];
  newCard: Card = { label: '', value: '', description: '' };
  showModal: boolean = false;
 selectedCard: Card | null = null;
isAdmin: boolean = false;

  // ✅ Contrôle d'affichage du p-dialog PrimeNG
  displayModal: boolean = false;

  constructor(private cardService: CardService
, private authService: AuthService
  ) {}

  ngOnInit(): void {
  this.loadCards();

  this.authService.isAdmin().then((result) => {
    this.isAdmin = result;
  });
}


  loadCards() {
    this.cardService.getCards().subscribe(data => {
      this.cards = data;
    });
  }

  // ✅ Ouvre le modal PrimeNG
  openModal() {
    this.displayModal = true;
  }

  // ✅ Ajout d'une carte et fermeture du modal
  submitForm() {
    this.cardService.addCard(this.newCard).subscribe(() => {
      this.loadCards();
      this.newCard = { label: '', value: '', description: '' };
      this.displayModal = false;
    });
  }
 

editCard(card: Card) {
  this.selectedCard = { ...card }; // clone
  this.showModal = true; // modal PrimeNG
}

deleteCard(card: Card) {
  if (card.id && confirm('Voulez-vous vraiment supprimer cette carte ?')) {
    this.cardService.deleteCard(card.id).subscribe(() => {
      this.loadCards();
    });
  }
}


saveCard() {
  if (this.selectedCard?.id) {
    this.cardService.updateCard(this.selectedCard).subscribe(() => {
      this.loadCards();
      this.showModal = false;
      this.selectedCard = null;
    });
  }
}

}
