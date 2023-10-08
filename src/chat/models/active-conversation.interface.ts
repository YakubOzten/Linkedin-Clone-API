import { User } from "src/auth/models/user.class";
import { Conversation } from "./conversation.interface";

export interface ActiveConversation{
    id?:number;
    socketId?:string;
    userId?:number;
    conversationId?:number  ;

}