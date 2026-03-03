import { Body, Controller, Get, Param, ParseUUIDPipe, Patch, Post, Put } from '@nestjs/common';
import { ClientsService } from './clients.service';
import { CreateClientDto } from './dto/create-client.dto';
import { UpdateClientDto } from './dto/update-client.dto';

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

  @Post()
  register(@Body() createParams: CreateClientDto) {
    return this.clientsService.register(createParams);
  }

  @Post()
  login(@Body() createParams: CreateClientDto) {
    return this.clientsService.login(createParams);
  }

  @Put(':clientId')
  update(
    @Param('clientId', new ParseUUIDPipe()) clientId: string,
    @Body() updateParams: UpdateClientDto,
  ) {
    return this.clientsService.update(clientId, updateParams);
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
