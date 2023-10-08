import { OnGatewayConnection, OnGatewayDisconnect, SubscribeMessage, WebSocketGateway, WebSocketServer } from '@nestjs/websockets';

import { Server,Socket} from 'socket.io';
import { AuthService } from 'src/auth/services/auth.service';
import { ConversationService } from '../services/conversation.service';
import { OnModuleInit, UseGuards } from '@nestjs/common';
import { Subscription, of, take, tap } from 'rxjs';
import { JwtGuard } from 'src/auth/guards/jwt.guard';
import { User } from 'src/auth/models/user.class';
import { ActiveConversation } from '../models/active-conversation.interface';
import { Message } from '../models/message.interface';

@WebSocketGateway({cors:{origin:['http://localhost:8100']}})
export class ChatGateway implements OnGatewayConnection,OnGatewayDisconnect,OnModuleInit {
   
  constructor(private authService:AuthService,private conversationService:ConversationService){}
 

  //Note:Runs when server starts -remove in productions
  onModuleInit(){
     this.conversationService.removeActiveConversations().pipe(take(1)).subscribe();
     this.conversationService.removeMessages().pipe(take(1)).subscribe();
     this.conversationService.removeConversations().pipe(take(1)).subscribe();
  }

    
   @WebSocketServer()
   server:Server

   @UseGuards(JwtGuard)
   handleConnection(socket:Socket) {
     console.log('HANDLE CONNECTİON');
     const jwt=socket.handshake.headers.authorization || null;
     this.authService.getJwtUser(jwt).subscribe((user:User)=>{
      if(!user) {
        console.log('No User')
        this.handleDisconnect(socket);
      }else{
        socket.data.user=user;
        this.getConversations(socket,user.id);
      }
     })
    }
    getConversations(socket:Socket,userId:number):Subscription {
      return this.conversationService.getConversationsWithUsers(userId)
      .subscribe((conversations)=>{
        this.server.to(socket.id).emit('conversations',conversations);
      });
    }



   handleDisconnect(socket:Socket) {
     console.log('HANDLE DİSCONNECT');
     this.conversationService.leaveConversation(socket.id).pipe((take(1))).subscribe();
   }

   @SubscribeMessage('createConversation')
   createConversations(socket:Socket,friend:User){
    this.conversationService.createConversation(socket.data.user,friend)
    .pipe(take(1)).subscribe(()=>{
      this.getConversations(socket,socket.data.user.id);
    });
   }  
     

   @SubscribeMessage('sendMessage')
   handleMessage(socket:Socket,newMesage:Message){
     if(!newMesage.conversation) return of(null);
    
      const {user}=socket.data
      newMesage.user=user;

      if(newMesage.conversation.id){
        this.conversationService
        .createMessage(newMesage)
        .pipe(take(1)).subscribe((message:Message)=>{
          newMesage.id =message.id 

          this.conversationService.getActiveUsers(newMesage.conversation.id).pipe(take(1))
          .subscribe((activeConversations:ActiveConversation[])=>{
            activeConversations.forEach((activeConversation:ActiveConversation)=>{
              this.server.to(activeConversation.socketId).emit('newMessage',newMesage); 
            },);
          });
        });
      }
   }    

   @SubscribeMessage('joinConversation')
   joinConversation(socket:Socket,friendId:number){
    this.conversationService.joinConversation(friendId,socket.data.user.id,socket.id)
    .pipe(
      tap((activeConversation:ActiveConversation)=>{
        this.conversationService.getMessages(activeConversation.conversationId)
        .pipe(take(1))
        .subscribe((messages:Message[])=>{
          this.server.to(socket.id).emit('messages',messages);
        })
      })
    )
    .pipe(take(1)).subscribe();
   }

   @SubscribeMessage('leaveConversation')
   leaveConversation(socket:Socket){
    this.conversationService.leaveConversation(socket.id).pipe(take(1)).subscribe();
   }


}
