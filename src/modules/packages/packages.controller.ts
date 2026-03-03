import { Body, Controller, Delete, Get, Param, ParseUUIDPipe, Patch, Post, Put } from '@nestjs/common';
import { PackagesService } from './packages.service';
import { CreatePackageDto } from './dto/create-package.dto';
import { UpdatePackageDto } from './dto/update-package.dto';

@Controller('packages')
export class PackagesController {
  constructor(private readonly packagesService: PackagesService) {}

  @Get(':condominiumId')
  listAll(@Param('condominiumId', new ParseUUIDPipe()) condominiumId: string) {
    return this.packagesService.listAll(condominiumId);
  }

  @Get('details/:packageId')
  listById(@Param('packageId', new ParseUUIDPipe()) packageId: string) {
    return this.packagesService.listById(packageId);
  }

  @Get(':condominiumId/trash')
  listAllSoftDeleted(
    @Param('condominiumId', new ParseUUIDPipe()) condominiumId: string,
  ) {
    return this.packagesService.listAllSoftDeleted(condominiumId);
  }

  @Post()
  create(@Body() createParams: CreatePackageDto) {
    return this.packagesService.create(createParams);
  }

  @Put(':packageId')
  update(
    @Param('packageId', new ParseUUIDPipe()) packageId: string,
    @Body() updateParams: UpdatePackageDto,
  ) {
    return this.packagesService.update(packageId, updateParams);
  }

  @Delete(':packageId')
  softDelete(@Param('packageId', new ParseUUIDPipe()) packageId: string) {
    return this.packagesService.softDelete(packageId);
  }

  @Delete(':packageId/permanent')
  permanentlyDelete(@Param('packageId', new ParseUUIDPipe()) packageId: string) {
    return this.packagesService.permanentlyDelete(packageId);
  }

  @Delete(':condominiumId/trash')
  clearTrash(@Param('condominiumId', new ParseUUIDPipe()) condominiumId: string) {
    return this.packagesService.clearTrash(condominiumId);
  }

  @Patch(':packageId/restore')
  restore(@Param('packageId', new ParseUUIDPipe()) packageId: string) {
    return this.packagesService.restore(packageId);
  }
}
