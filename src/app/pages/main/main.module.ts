import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { NgxEchartsDirective, provideEchartsCore } from 'ngx-echarts';
import { echarts } from '../../shared/echarts';
import { SharedModule } from '../../shared/shared.module';

const getPath = (p: string) => (p.startsWith('/') ? p.substring(1) : p);

const routes: Routes = [{ path: '', component: HomeComponent }];

@NgModule({
  declarations: [HomeComponent],
  imports: [SharedModule, RouterModule.forChild(routes), NgxEchartsDirective],
  providers: [provideEchartsCore({ echarts })],
})
export class MainModule {}
