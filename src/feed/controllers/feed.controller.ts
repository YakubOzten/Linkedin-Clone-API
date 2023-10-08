import { Body, Controller, Delete, Get, Param, Post, Put, Query,UseGuards,Request, Res } from '@nestjs/common';
// import { Roles } from 'src/auth/decorators/roles.decorator';
// import { Role } from 'src/auth/models/role.enum';
import { Observable } from 'rxjs';
import { DeleteResult, UpdateResult } from 'typeorm';

import { JwtGuard } from '../../auth/guards/jwt.guard';

import { FeedPost } from '../models/post.interface';
import { FeedService } from '../services/feed.service';

import { IsCreatorGuard } from '../guards/is-creator.guard';
import { RolesGuard } from '../../auth/guards/roles.guard';
import { Role } from 'src/auth/models/role.enum';
import { Roles } from 'src/auth/decorators/roles.decorator';

@Controller('feed')
export class FeedController {

    constructor(private feedService:FeedService){   }

// @Roles(Role.ADMIN,Role.PREMIUM)    
@UseGuards(JwtGuard,RolesGuard)
@Post()
create(@Body()  feedPost:FeedPost,@Request() req):Observable<FeedPost>{
return (this.feedService.createPost(req.user,feedPost));
}

// @Get()
// findAll(): Observable<FeedPost[]>{
//     return this.feedService.findAllPosts();
// }
// @Roles(Role.ADMIN,Role.PREMIUM)    
// @UseGuards(JwtGuard,RolesGuard)
@Get()
findSelected(
    @Query('take') take:number = 1,
    @Query('skip') skip:number= 1,
    ): Observable<FeedPost[]>{
    take=take  > 20 ? 20:take; 
    return this.feedService.findPosts(take,skip);
}
 
@UseGuards(JwtGuard,IsCreatorGuard)
@Put(':id')
 update(@Param('id') id:number, @Body()  feedPost:FeedPost):Observable<UpdateResult>{
    return this.feedService.updatePost(id,feedPost);
 }
 @UseGuards(JwtGuard,IsCreatorGuard)
  @Delete(':id')
  delete(@Param('id')id:number):Observable<DeleteResult>{
   return this.feedService.deletePost(id);
  }

  @Get('image/:fileName')
  findImageByName(@Param('fileName') fileName: string, @Res() res) {
    if (!fileName || ['null', '[null]'].includes(fileName)) return;
    return res.sendFile(fileName, { root: './images' });
  }
  
  

}
