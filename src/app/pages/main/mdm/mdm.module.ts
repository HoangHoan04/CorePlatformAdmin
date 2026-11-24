import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { SharedModule } from '../../../shared/shared.module';
import { AddOrUpdateAdministrativeUnitMappingComponent } from './geography/administrative-unit-mapping-manager/add-or-update-administrative-unit-mapping/add-or-update-administrative-unit-mapping.component';
import { AdministrativeUnitMappingDetailComponent } from './geography/administrative-unit-mapping-manager/administrative-unit-mapping-detail/administrative-unit-mapping-detail.component';
import { AdministrativeUnitMappingManagerComponent } from './geography/administrative-unit-mapping-manager/administrative-unit-mapping-manager.component';
import { AddOrUpdateAdministrativeUnitComponent } from './geography/administrative-unit-manager/add-or-update-administrative-unit/add-or-update-administrative-unit.component';
import { AdministrativeUnitDetailComponent } from './geography/administrative-unit-manager/administrative-unit-detail/administrative-unit-detail.component';
import { AdministrativeUnitManagerComponent } from './geography/administrative-unit-manager/administrative-unit-manager.component';
import { AddOrUpdateBankComponent } from './currency/bank-manager/add-or-update-bank/add-or-update-bank.component';
import { BankDetailComponent } from './currency/bank-manager/bank-detail/bank-detail.component';
import { BankManagerComponent } from './currency/bank-manager/bank-manager.component';
import { AddOrUpdateCurrencyComponent } from './currency/currency-manager/add-or-update-currency/add-or-update-currency.component';
import { CurrencyDetailComponent } from './currency/currency-manager/currency-detail/currency-detail.component';
import { CurrencyManagerComponent } from './currency/currency-manager/currency-manager.component';
import { AddOrUpdateExchangeRateComponent } from './currency/exchange-rate-manager/add-or-update-exchange-rate/add-or-update-exchange-rate.component';
import { ExchangeRateDetailComponent } from './currency/exchange-rate-manager/exchange-rate-detail/exchange-rate-detail.component';
import { ExchangeRateManagerComponent } from './currency/exchange-rate-manager/exchange-rate-manager.component';
import { AddOrUpdateCountryComponent } from './geography/country-manager/add-or-update-country/add-or-update-country.component';
import { CountryDetailComponent } from './geography/country-manager/country-detail/country-detail.component';
import { CountryManagerComponent } from './geography/country-manager/country-manager.component';

/**
 * Phân hệ Danh mục dùng chung (MDM). URL theo ROUTES_CONFIG.MDM (quyền xem kiểm tra ở PermissionGuard).
 */
const routes: Routes = [
  // ── Quốc gia & địa giới hành chính ──
  { path: 'geography', redirectTo: 'geography/countries', pathMatch: 'full' },
  { path: 'geography/countries', component: CountryManagerComponent },
  { path: 'geography/administrative_units', component: AdministrativeUnitManagerComponent },
  { path: 'geography/administrative_unit_mappings', component: AdministrativeUnitMappingManagerComponent },

  // ── Tiền tệ & ngân hàng ──
  { path: 'currency', redirectTo: 'currency/currencies', pathMatch: 'full' },
  { path: 'currency/currencies', component: CurrencyManagerComponent },
  { path: 'currency/exchange_rates', component: ExchangeRateManagerComponent },
  { path: 'currency/banks', component: BankManagerComponent },
];

@NgModule({
  declarations: [
    // Quốc gia
    CountryManagerComponent,
    AddOrUpdateCountryComponent,
    CountryDetailComponent,
    // Đơn vị hành chính
    AdministrativeUnitManagerComponent,
    AddOrUpdateAdministrativeUnitComponent,
    AdministrativeUnitDetailComponent,
    // Ánh xạ sáp nhập
    AdministrativeUnitMappingManagerComponent,
    AddOrUpdateAdministrativeUnitMappingComponent,
    AdministrativeUnitMappingDetailComponent,
    // Tiền tệ
    CurrencyManagerComponent,
    AddOrUpdateCurrencyComponent,
    CurrencyDetailComponent,
    // Tỷ giá
    ExchangeRateManagerComponent,
    AddOrUpdateExchangeRateComponent,
    ExchangeRateDetailComponent,
    // Ngân hàng
    BankManagerComponent,
    AddOrUpdateBankComponent,
    BankDetailComponent,
  ],
  imports: [SharedModule, RouterModule.forChild(routes)],
})
export class MdmModule {}
