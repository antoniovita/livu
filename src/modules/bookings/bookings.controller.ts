import { Body, Controller, Delete, Get, Param, ParseUUIDPipe, Patch, Post, Put } from '@nestjs/common';
import { BookingsService } from './bookings.service';
import { CreateBookingDto } from './dto/create-booking.dto';
import { UpdateBookingDto } from './dto/update-booking.dto';

@Controller('bookings')
export class BookingsController {
  constructor(private readonly bookingsService: BookingsService) {}

  @Get(':condominiumId')
  listAll(@Param('condominiumId', new ParseUUIDPipe()) condominiumId: string) {
    return this.bookingsService.listAll(condominiumId);
  }

  @Get('details/:bookingId')
  listById(@Param('bookingId', new ParseUUIDPipe()) bookingId: string) {
    return this.bookingsService.listById(bookingId);
  }

  @Get('unit/:unitId')
  listByUnit(@Param('unitId', new ParseUUIDPipe()) unitId: string) {
    return this.bookingsService.listByUnit(unitId);
  }

  @Get(':condominiumId/trash')
  listAllSoftDeleted(
    @Param('condominiumId', new ParseUUIDPipe()) condominiumId: string,
  ) {
    return this.bookingsService.listAllSoftDeleted(condominiumId);
  }

  @Post()
  create(@Body() createParams: CreateBookingDto) {
    return this.bookingsService.create(createParams);
  }

  @Put(':bookingId')
  update(
    @Param('bookingId', new ParseUUIDPipe()) bookingId: string,
    @Body() updateParams: UpdateBookingDto,
  ) {
    return this.bookingsService.update(bookingId, updateParams);
  }

  @Delete(':bookingId')
  softDelete(@Param('bookingId', new ParseUUIDPipe()) bookingId: string) {
    return this.bookingsService.softDelete(bookingId);
  }

  @Delete(':bookingId/permanent')
  permanentlyDelete(@Param('bookingId', new ParseUUIDPipe()) bookingId: string) {
    return this.bookingsService.permanentlyDelete(bookingId);
  }

  @Delete(':condominiumId/trash')
  clearTrash(@Param('condominiumId', new ParseUUIDPipe()) condominiumId: string) {
    return this.bookingsService.clearTrash(condominiumId);
  }

  @Patch(':bookingId/restore')
  restore(@Param('bookingId', new ParseUUIDPipe()) bookingId: string) {
    return this.bookingsService.restore(bookingId);
  }
}
