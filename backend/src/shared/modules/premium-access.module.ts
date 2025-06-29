import { Global, Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { PremiumAccessGuard } from '../guards/premium-access.guard';
import { UserAcessoPremium, UserAcessoPremiumSchema } from '../schemas/user-acesso-premium.schema';
import { User, UserSchema } from '../schemas/user.schema';
import { PremiumAccessService } from '../services/premium-access.service';

@Global()
@Module({
  imports: [
    MongooseModule.forFeature([
      { name: User.name, schema: UserSchema },
      { name: UserAcessoPremium.name, schema: UserAcessoPremiumSchema },
    ]),
  ],
  providers: [PremiumAccessService, PremiumAccessGuard],
  exports: [PremiumAccessService, PremiumAccessGuard, MongooseModule],
})
export class PremiumAccessModule {}
