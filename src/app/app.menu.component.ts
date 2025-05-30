import { Component, OnInit } from '@angular/core';
import { AppMainComponent } from './app.main.component';
import { FormService } from './form.service';
import { AuthService } from './auth.service';

@Component({
    selector: 'app-menu',
    templateUrl: './app.menu.component.html'
})
export class AppMenuComponent implements OnInit {
    model: any[];
    isAdmin: boolean = false;

    constructor(
        public appMain: AppMainComponent,
        private formService: FormService,
        private authService: AuthService
    ) {}

    async ngOnInit() {
        this.isAdmin = await this.authService.isAdmin();
        
        this.formService.getForms().subscribe((formulaires: any[]) => {
            const formulaireItems = (formulaires || []).map(f => ({
                label: f.name || `Formulaire ${f.name}`,
                icon: 'pi pi-fw pi-file',
                routerLink: [`/form/${f.name}`]
            }));

            this.model = [
                { label: 'Dashboard', icon: 'pi pi-fw pi-home', routerLink: ['/'] },
               
                ...(this.isAdmin ? [{
                    label: 'Pages', 
                    icon: 'pi pi-fw pi-copy', 
                    routerLink: ['/pages'],
                    items: [
                        { label: 'Form Builder', icon: 'pi pi-fw pi-plus', routerLink: ['/form-builder'] },
                        { label: 'Forms List', icon: 'pi pi-fw pi-list', routerLink: ['/forms'] },
                        { label: 'Permissions', icon: 'pi pi-fw pi-lock', routerLink: ['/permission'] },
                        { label: 'Register', icon: 'pi pi-fw pi-user-plus', routerLink: ['/register'] },
                        { label: 'users', icon: 'pi pi-fw pi-cog', routerLink: ['/admin'] }
                    ]
                }] : []),
                
                {
                    label: 'Les formulaires',
                    icon: 'pi pi-fw pi-file',
                    items: formulaireItems
                },
            ];
        });
    }

    onMenuClick() {
        this.appMain.menuClick = true;
    }
}