import { Controller, Get, Post, Body, Patch, Param, Delete } from '@nestjs/common';
import { DirectMessagService } from './direct-messag.service';
import { CreateDirectMessagDto } from './dto/create-direct-messag.dto';
import { UpdateDirectMessagDto } from './dto/update-direct-messag.dto';

@Controller('direct-messag')
export class DirectMessagController {
  constructor(private readonly directMessagService: DirectMessagService) {}

  @Post()
  create(@Body() createDirectMessagDto: CreateDirectMessagDto) {
    return this.directMessagService.create(createDirectMessagDto);
  }

  @Get()
  findAll() {
    return this.directMessagService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.directMessagService.findOne(+id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() updateDirectMessagDto: UpdateDirectMessagDto) {
    return this.directMessagService.update(+id, updateDirectMessagDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.directMessagService.remove(+id);
  }
}
