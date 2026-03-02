import { Body, Controller, Delete, Get, Param, ParseUUIDPipe, Patch, Post, Put } from '@nestjs/common';
import { SpacesService } from './spaces.service';

import { CreateSpaceDto } from './dto/create-space.dto';
import { UpdateSpaceDto } from './dto/update-space.dto';

@Controller('spaces')
export class SpacesController {
  constructor(private readonly spacesService: SpacesService) {}

  @Get(':condominiumId')
  listAll(@Param('condominiumId', new ParseUUIDPipe()) condominiumId: string) {
    return this.spacesService.listAll(condominiumId);
  }

  @Get('details/:spaceId')
  listById(@Param('spaceId', new ParseUUIDPipe()) spaceId: string) {
    return this.spacesService.listById(spaceId);
  }

  @Get(':condominiumId/trash')
  listAllSoftDeleted(
    @Param('condominiumId', new ParseUUIDPipe()) condominiumId: string,
  ) {
    return this.spacesService.listAllSoftDeleted(condominiumId);
  }

  @Post()
  create(@Body() createParams: CreateSpaceDto) {
    return this.spacesService.create(createParams);
  }

  @Put(':spaceId')
  update(
    @Param('spaceId', new ParseUUIDPipe()) spaceId: string,
    @Body() updateParams: UpdateSpaceDto,
  ) {
    return this.spacesService.update(spaceId, updateParams);
  }

  @Delete(':spaceId')
  softDelete(@Param('spaceId', new ParseUUIDPipe()) spaceId: string) {
    return this.spacesService.softDelete(spaceId);
  }

  @Delete(':spaceId/permanent')
  permanentlyDelete(@Param('spaceId', new ParseUUIDPipe()) spaceId: string) {
    return this.spacesService.permanentlyDelete(spaceId);
  }

  @Delete(':condominiumId/trash')
  clearTrash(@Param('condominiumId', new ParseUUIDPipe()) condominiumId: string) {
    return this.spacesService.clearTrash(condominiumId);
  }

  @Patch(':spaceId/restore')
  restore(@Param('spaceId', new ParseUUIDPipe()) spaceId: string) {
    return this.spacesService.restore(spaceId);
  }
}
