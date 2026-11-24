import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { NgxEchartsDirective, provideEchartsCore } from 'ngx-echarts';
import { echarts } from '../../shared/echarts';
import { SharedModule } from '../../shared/shared.module';
import { HomeComponent } from './home/home.component';

const routes: Routes = [
  { path: '', component: HomeComponent, title: 'Tổng quan' },
  {
    path: 'mdm',
    loadChildren: () => import('./mdm/mdm.module').then((m) => m.MdmModule),
  },
  {
    path: 'config',
    loadChildren: () => import('./config/config.module').then((m) => m.ConfigModule),
  },
];

@NgModule({
  declarations: [HomeComponent],
  imports: [SharedModule, RouterModule.forChild(routes), NgxEchartsDirective],
  providers: [provideEchartsCore({ echarts })],
})
export class MainModule {}
