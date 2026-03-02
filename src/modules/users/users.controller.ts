import { Body, Controller, Delete, Get, Param, ParseUUIDPipe, Patch, Post, Put } from '@nestjs/common';
import { UsersService } from './users.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { AddUserMembershipDto } from './dto/add-user-membership.dto';
import { SetPrimaryMembershipDto } from './dto/set-primary-membership.dto';

@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get(':condominiumId')
  listAll(@Param('condominiumId', new ParseUUIDPipe()) condominiumId: string) {
    return this.usersService.listAll(condominiumId);
  }

  @Get('details/:userId')
  listById(@Param('userId', new ParseUUIDPipe()) userId: string) {
    return this.usersService.listById(userId);
  }

  @Get(':condominiumId/trash')
  listAllSoftDeleted(
    @Param('condominiumId', new ParseUUIDPipe()) condominiumId: string,
  ) {
    return this.usersService.listAllSoftDeleted(condominiumId);
  }

  @Post()
  create(@Body() createParams: CreateUserDto) {
    return this.usersService.create(createParams);
  }

  @Post(':userId/memberships')
  addMembership(
    @Param('userId', new ParseUUIDPipe()) userId: string,
    @Body() params: AddUserMembershipDto,
  ) {
    return this.usersService.addMembership(userId, params);
  }

  @Put(':userId')
  update(
    @Param('userId', new ParseUUIDPipe()) userId: string,
    @Body() updateParams: UpdateUserDto,
  ) {
    return this.usersService.update(userId, updateParams);
  }

  @Delete(':userId')
  softDelete(@Param('userId', new ParseUUIDPipe()) userId: string) {
    return this.usersService.softDelete(userId);
  }

  @Delete(':userId/memberships/:condominiumId/:unitId')
  removeMembership(
    @Param('userId', new ParseUUIDPipe()) userId: string,
    @Param('condominiumId', new ParseUUIDPipe()) condominiumId: string,
    @Param('unitId', new ParseUUIDPipe()) unitId: string,
  ) {
    return this.usersService.removeMembership(userId, condominiumId, unitId);
  }

  @Delete(':condominiumId/trash')
  clearTrash(@Param('condominiumId', new ParseUUIDPipe()) condominiumId: string) {
    return this.usersService.clearTrash(condominiumId);
  }

  @Patch(':userId/restore')
  restore(@Param('userId', new ParseUUIDPipe()) userId: string) {
    return this.usersService.restore(userId);
  }

  @Patch(':userId/memberships/primary')
  setPrimaryMembership(
    @Param('userId', new ParseUUIDPipe()) userId: string,
    @Body() params: SetPrimaryMembershipDto,
  ) {
    return this.usersService.setPrimaryMembership(userId, params);
  }
}
