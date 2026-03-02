import { Module } from '@nestjs/common';

import { PrismaModule } from './infra/prisma/prisma.module';
import { SpacesModule } from './modules/spaces/spaces.module';
import { UsersModule } from './modules/users/users.module';
import { WhatsappModule } from './modules/whatsapp/whatsapp.module';

@Module({
  imports: [PrismaModule, SpacesModule, UsersModule, WhatsappModule],
})

export class AppModule {}
