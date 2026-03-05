import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { ClientsController } from './clients.controller';
import { ClientsService } from './clients.service';
import { MailModule } from '../mail/mail.module';

@Module({
  imports: [
    MailModule,
    JwtModule.register({
      secret: process.env.JWT_SECRET,
      signOptions: { expiresIn: '7d' },
    }),
  ],
  controllers: [ClientsController],
  providers: [ClientsService],
  exports: [ClientsService],
})
export class ClientsModule {}
