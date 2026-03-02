import { Module } from '@nestjs/common';

import { PrismaModule } from './infra/prisma/prisma.module';
import { SpacesModule } from './modules/spaces/spaces.module';

@Module({
  imports: [PrismaModule, SpacesModule],
})

export class AppModule {}
