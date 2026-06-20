import {
  Controller, Get, Post, Patch, Delete, Param, Body,
  Query, UseGuards, HttpCode, HttpStatus,
} from '@nestjs/common';
import { AdminService } from './admin.service';
import { OphimService } from '../ophim/ophim.service';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { Role } from '../common/types/enums';

@Controller('admin')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(Role.ADMIN)
export class AdminController {
  constructor(
    private adminService: AdminService,
    private ophimService: OphimService,
  ) {}

  // Dashboard
  @Get('dashboard')
  getDashboard() {
    return this.adminService.getDashboardStats();
  }

  // User Management
  @Get('users')
  getUsers(@Query('page') page = 1, @Query('limit') limit = 20) {
    return this.adminService.getAllUsers(Number(page), Number(limit));
  }

  @Patch('users/:id/role')
  updateRole(@Param('id') id: string, @Body('role') role: Role) {
    return this.adminService.updateUserRole(id, role);
  }

  @Patch('users/:id/toggle-status')
  @HttpCode(HttpStatus.OK)
  toggleUserStatus(@Param('id') id: string) {
    return this.adminService.toggleUserStatus(id);
  }

  // Movie Management
  @Get('movies')
  getMovies(
    @Query('page') page = 1,
    @Query('limit') limit = 10,
    @Query('q') q?: string,
    @Query('isFeatured') isFeatured?: string,
  ) {
    const featuredFlag = isFeatured === 'true' ? true : isFeatured === 'false' ? false : undefined;
    return this.adminService.getAllMovies(Number(page), Number(limit), q, featuredFlag);
  }

  @Post('movies/sync')
  syncMovie(@Body('slug') slug: string) {
    return this.ophimService.syncMovie(slug);
  }

  @Post('movies/sync-latest')
  syncLatest(@Body('pages') pages = 3) {
    return this.ophimService.syncLatestMovies(Number(pages));
  }

  @Patch('movies/:id/featured')
  setFeatured(@Param('id') id: string, @Body('isFeatured') isFeatured: boolean) {
    return this.adminService.setFeatured(id, isFeatured);
  }

  @Patch('movies/:id/toggle-published')
  @HttpCode(HttpStatus.OK)
  togglePublished(@Param('id') id: string) {
    return this.adminService.toggleMoviePublished(id);
  }

  @Delete('movies/:id')
  deleteMovie(@Param('id') id: string) {
    return this.adminService.deleteMovie(id);
  }

  // Comment Management
  @Get('comments')
  getComments(
    @Query('page') page = 1,
    @Query('limit') limit = 20,
    @Query('showHidden') showHidden = false,
  ) {
    return this.adminService.getAllComments(Number(page), Number(limit), String(showHidden) === 'true');
  }

  @Patch('comments/:id/hide')
  @HttpCode(HttpStatus.OK)
  hideComment(@Param('id') id: string) {
    return this.adminService.hideComment(id);
  }

  @Delete('comments/:id')
  deleteComment(@Param('id') id: string) {
    return this.adminService.deleteComment(id);
  }

  // Reports
  @Get('reports')
  getReports(@Query('page') page = 1, @Query('limit') limit = 20) {
    return this.adminService.getReports(Number(page), Number(limit));
  }

  @Patch('reports/:id/handle')
  @HttpCode(HttpStatus.OK)
  handleReport(@Param('id') id: string) {
    return this.adminService.handleReport(id);
  }
}
