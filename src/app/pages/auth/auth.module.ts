import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { LayoutWidgetsModule } from '../../layout/admin-layout/layout-widgets.module';
import { AuthLayoutComponent } from '../../layout/auth-layout/auth-layout.component';
import { SharedModule } from '../../shared/shared.module';
import { ChangePasswordComponent } from './change-password/change-password.component';
import { LoginComponent } from './login/login.component';

const routes: Routes = [
  {
    path: '',
    component: AuthLayoutComponent,
    children: [
      { path: '', redirectTo: 'login', pathMatch: 'full' },
      { path: 'login', component: LoginComponent, title: 'Đăng nhập' },
      { path: 'change-password', component: ChangePasswordComponent, title: 'Đổi mật khẩu' },
    ],
  },
];

@NgModule({
  declarations: [LoginComponent, AuthLayoutComponent, ChangePasswordComponent],
  imports: [SharedModule, LayoutWidgetsModule, RouterModule.forChild(routes)],
})
export class AuthModule {}
