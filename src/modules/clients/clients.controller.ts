import { Body, Controller, Get, Param, ParseUUIDPipe, Patch, Post } from '@nestjs/common';
import { ClientsService } from './clients.service';
import { LoginClientDto } from './dto/login-client.dto';
import { RegisterClientDto } from './dto/register-client.dto';
import { UpdateClientProfileDto } from './dto/update-client-profile.dto';
import { ChangeClientPasswordDto } from './dto/change-client-password.dto';
import { RequestClientEmailChangeDto } from './dto/request-client-email-change.dto';
import { ConfirmClientEmailChangeDto } from './dto/confirm-client-email-change.dto';
import { ResendClientEmailChangeDto } from './dto/resend-client-email-change.dto';

@Controller('clients')
export class ClientsController {
  constructor(private readonly clientsService: ClientsService) {}

  @Get()
  listAll() {
    return this.clientsService.listAll();
  }

  @Get('details/:clientId')
  listById(@Param('clientId', new ParseUUIDPipe()) clientId: string) {
    return this.clientsService.listById(clientId);
  }

  @Get('inactive')
  listAllInactive() {
    return this.clientsService.listAllInactive();
  }

  @Post('register')
  register(@Body() createParams: RegisterClientDto) {
    return this.clientsService.register(createParams);
  }

  @Post('login')
  login(@Body() createParams: LoginClientDto) {
    return this.clientsService.login(createParams);
  }

  @Patch(':clientId/profile')
  updateProfile(
    @Param('clientId', new ParseUUIDPipe()) clientId: string,
    @Body() updateParams: UpdateClientProfileDto,
  ) {
    return this.clientsService.updateProfile(clientId, updateParams);
  }

  @Post(':clientId/password/change')
  changePassword(
    @Param('clientId', new ParseUUIDPipe()) clientId: string,
    @Body() changePasswordDto: ChangeClientPasswordDto,
  ) {
    return this.clientsService.changePassword(clientId, changePasswordDto);
  }

  @Post(':clientId/email/change-request')
  requestEmailChange(
    @Param('clientId', new ParseUUIDPipe()) clientId: string,
    @Body() requestDto: RequestClientEmailChangeDto,
  ) {
    return this.clientsService.requestEmailChange(clientId, requestDto);
  }

  @Post(':clientId/email/confirm')
  confirmEmailChange(
    @Param('clientId', new ParseUUIDPipe()) clientId: string,
    @Body() confirmDto: ConfirmClientEmailChangeDto,
  ) {
    return this.clientsService.confirmEmailChange(clientId, confirmDto);
  }

  @Post(':clientId/email/resend')
  resendEmailChangeCode(
    @Param('clientId', new ParseUUIDPipe()) clientId: string,
    @Body() resendDto: ResendClientEmailChangeDto,
  ) {
    return this.clientsService.resendEmailChangeCode(clientId, resendDto);
  }

  @Patch(':clientId/deactivate')
  deactivateAccount(@Param('clientId', new ParseUUIDPipe()) clientId: string) {
    return this.clientsService.deactivateAccount(clientId);
  }

  @Patch(':clientId/reactivate')
  reactivateAccount(@Param('clientId', new ParseUUIDPipe()) clientId: string) {
    return this.clientsService.reactivateAccount(clientId);
  }
}
