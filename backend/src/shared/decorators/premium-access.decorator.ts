import { SetMetadata } from '@nestjs/common';
import { TipoAcesso } from '../schemas/user-acesso-premium.schema';

export const PREMIUM_ACCESS_KEY = 'premiumAccess';

export interface PremiumAccessRequirement {
  tipoAcesso: TipoAcesso;
  allowOwnCityOnly?: boolean; // Se true, permite apenas cidade própria sem pagamento
  allowPremiumSubscription?: boolean; // Se true, assinatura premium bypassa a restrição
  specificState?: string; // Estado específico necessário
  specificCity?: string; // Cidade específica necessária
}

export const PremiumAccess = (requirement: PremiumAccessRequirement) =>
  SetMetadata(PREMIUM_ACCESS_KEY, requirement);

// Decorators específicos para facilitar o uso
export const RequireCityAccess = (
  allowOwnCityOnly = true,
  allowPremiumSubscription = true,
  specificCity?: string,
  specificState?: string
) =>
  PremiumAccess({
    tipoAcesso: TipoAcesso.CIDADE,
    allowOwnCityOnly,
    allowPremiumSubscription,
    specificCity,
    specificState,
  });

export const RequireStateAccess = (allowPremiumSubscription = true, specificState?: string) =>
  PremiumAccess({
    tipoAcesso: TipoAcesso.ESTADO,
    allowOwnCityOnly: false,
    allowPremiumSubscription,
    specificState,
  });

export const RequireNationalAccess = (allowPremiumSubscription = true) =>
  PremiumAccess({
    tipoAcesso: TipoAcesso.NACIONAL,
    allowOwnCityOnly: false,
    allowPremiumSubscription,
  });
