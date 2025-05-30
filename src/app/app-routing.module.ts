import { NgModule } from '@angular/core';
import { RouterModule } from '@angular/router';

import { AppMainComponent } from './app.main.component';
import { AppNotfoundComponent } from './pages/app.notfound.component';
import { AppErrorComponent } from './pages/app.error.component';
import { AppAccessdeniedComponent } from './pages/app.accessdenied.component';
import { AppLoginComponent } from './pages/app.login.component';

import { DashboardDemoComponent } from './demo/view/dashboarddemo.component';

import { FormBuilderComponent } from './pages/form-builder.component';
import { FormsListComponent } from './pages/forms-list.component';
import { FormDetailComponent } from './pages/form-detail.component';
import { FormComponent } from './pages/form.component';

import { AuthGuard } from './auth.guard';
import { RegisterComponent } from './pages/register.component';
import { AdminGuard } from './admin.guard';
import { FormAccessGuard } from './form-access.guard';

import { AdminComponent } from './pages/admin.component';
import { FormPermissionsComponent } from './pages/form-permissions.component';
import { UserFormsComponent } from './user-forms/user-forms.component';
import { UserDetailComponent } from './user-detail/user-detail.component';
@NgModule({
  imports: [
    RouterModule.forRoot([
      {
        path: '',
        component: AppMainComponent,
        canActivate: [AuthGuard],
        children: [
          { path: '', component: DashboardDemoComponent },
         
          {
            path: 'uikit/menu',
            loadChildren: () =>
              import('./demo/view/menus/menus.module').then((m) => m.MenusModule),
          },
          
          { 
            path: 'form-builder', 
            component: FormBuilderComponent,
            canActivate: [AdminGuard] 
          },
          { 
            path: 'forms', 
            component: FormsListComponent,
            canActivate: [AdminGuard] 
          },
          { 
            path: 'forms/:name', 
            component: FormDetailComponent,
            canActivate: [AdminGuard] 
          },
          {
            path: 'register', 
            component: RegisterComponent,
            canActivate: [AdminGuard] 
          },
          {
            path: 'form/:name', 
            component: FormComponent,
            canActivate: [FormAccessGuard]
          },
          {
            path: 'admin', 
            component: AdminComponent,
            canActivate: [AdminGuard]
          },
          {
            path: 'permission',
            component: FormPermissionsComponent,
            canActivate: [AdminGuard]
          },
          { path: 'user-forms/:userId', component: UserFormsComponent },
            { path: 'admin/users/:userId/forms/:formId', component: UserDetailComponent }

        ],
      },
      { path: 'login', component: AppLoginComponent },
      { path: 'error', component: AppErrorComponent },
      { path: 'accessdenied', component: AppAccessdeniedComponent },
      { path: 'notfound', component: AppNotfoundComponent },
      { path: '**', component: AppMainComponent },
    ],
    {
      scrollPositionRestoration: 'enabled',
    }),
  ],
  exports: [RouterModule],
})
export class AppRoutingModule {}