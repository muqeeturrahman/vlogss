import { io } from "./index.js";
import { findNotificationCount } from "./models/notificationModel.js";
import usersModel from "./models/users.js";
export const socketEventListner = (socket) => {
  // Get Socket ID of User

  console.log("New WS Connection...", socket.id);

  // add user to socket
//   socket.on("addUser", async (data) => {
//     if (data?.userId?.length == 24) {
//       await AuthModel.findOneAndUpdate({ profile: data.userId }, { socket: socket.id });
//     }yyy
//   });

  // get inbox
//   socket.on("ChatRoom", async (data) => {
//     console.log(data)
//     const chats = await getChatList(data);
//     console.log(chats)
//     // socket.join(data.userId)
//     io.to(socket.id).emit("ChatRoom", chats);
//   });
  socket.on("getNotifications", async (data) => {
    console.log(data)
    let userId
    const chats = await findNotificationCount(data.userId);
    console.log(chats)
    // socket.join(data.userId)
    io.to(socket.id).emit(`notification-${data.userId}`, chats);
  });
  // create chat list and get messages
//   socket.on("joinroom", async (data) => {
//   let converstaion;
//     if (data.receiverId) {
//     console.log('this is conversation',data)

//     converstaion = await createChatList(data);
//       if (converstaion._id) {
//         data.conversation = converstaion._id;
//       }
//     }
//     // socket.join(data.userId);

//     const body = await getMessages(converstaion);
//     console.log('this is conversation',body)
//     if (body.length == 0) {
//       io.to(socket.id).emit("joinroom", { conversation: data.conversation });
//     } else {
//       io.to(socket.id).emit("joinroom", body);
//     }
//   });

  //   socket.on("leaveroom", async (data) => {
  //     socket.leave(data.conversation);
  //     //     const body = await getMessages(data)
  //     // io.to(data.conversation).emit("joinroom",body)
  //   })

  // send message
//   socket.on("sendMessage", async (data) => {
//     console.log(data)
//     const body = await sendMessage(data);
//     io.emit(body.receiverId, {
//       type: "send",
//       body,
//     });

//     io.emit(data.senderId, {
//       type: "send",
//       body,
//     });
//     // io.emit("sendMessage"+body.receiverId, body);
//   });

  // socket.on("typing", async (data) => {
  //   const body = await checktyping(data)
  //   socket.join(body.user.fullName);
  //   io.to(body.user.fullName).emit("typing",body );
  // });

  // socket.on("online", async (data) => {
  //   const body = await checktyping(data)
  //   socket.join(data.conversation);
  //   io.to(data.conversation).emit("online",body );
  // });

  // disconnect user from socket
  socket.on("disconnect", async () => {
    await usersModel.findOneAndUpdate({ socket: socket.id }, { socket: "" });
  });
};
export const notificationCountIO = (count,userId) => io.emit(`notification-${userId}`, count);
let data={
  message:"your account is deleted"
}
export const delteAccountIo = (userId) => io.emit(`deleteAccount-${userId}`, data);


// export const createchatroom = async (event, data) => {
//   io?.emit(event, data)
// }
// export const MessageSend = async (event, data) => {
//   io?.emit(event, data)
// }