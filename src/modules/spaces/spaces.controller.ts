import { Body, Controller, Get, Post } from '@nestjs/common';
import { SpacesService } from './spaces.service';

@Controller('spaces')
export class SpacesController {
  constructor(private readonly spacesService: SpacesService) {}

  @Get()
  list() {
    return this.spacesService.findAll();
  }

  @Post()
  create(@Body() body: { name: string }) {
    return this.spacesService.create();
  }
}