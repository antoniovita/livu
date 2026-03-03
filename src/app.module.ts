import { Module } from '@nestjs/common';

import { PrismaModule } from './infra/prisma/prisma.module';
import { BookingsModule } from './modules/bookings/bookings.module';
import { ClientsModule } from './modules/clients/clients.module';
import { PackagesModule } from './modules/packages/packages.module';
import { SpacesModule } from './modules/spaces/spaces.module';
import { UsersModule } from './modules/users/users.module';
import { WhatsappModule } from './modules/whatsapp/whatsapp.module';

@Module({
  imports: [PrismaModule, BookingsModule, ClientsModule, PackagesModule, SpacesModule, UsersModule, WhatsappModule],
})

export class AppModule {}
