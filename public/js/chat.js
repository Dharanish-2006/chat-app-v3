const chatNamespace = io("/chat", {
  auth: {
    token: 123456,
  },
});

// Query DOM
const messageInput = document.getElementById("messageInput");
const chatForm = document.getElementById("chatForm");
const chatBox = document.getElementById("chat-box");
const feedback = document.getElementById("feedback");
const onlineUsers = document.getElementById("online-users-list");
const chatContainer = document.getElementById("chatContainer");
const pvChatForm = document.getElementById("pvChatForm");
const pvMessageInput = document.getElementById("pvMessageInput");
const modalTitle = document.getElementById("modalTitle");
const pvChatMessage = document.getElementById("pvChatMessage");
const logoutbtn = document.getElementById('logout')
const roomname = document.getElementById('roomname')
console.log(roomname);
const nickname = localStorage.getItem("nickname");
const roomNumber = localStorage.getItem("chatroom");
let socketId;



// Emit Events
chatNamespace.emit("login", { nickname, roomNumber });

chatForm.addEventListener("submit", (e) => {
  e.preventDefault();
  if (messageInput.value) {
    chatNamespace.emit("chat message", {
      message: messageInput.value,
      nickname,
      roomNumber,
    });
    messageInput.value = "";
  }
});

pvChatForm.addEventListener("submit", (e) => {
  e.preventDefault();

  chatNamespace.emit("pvChat", {
    message: pvMessageInput.value,
    name: nickname,
    to: socketId,
    from: chatNamespace.id,
  });

  $("#pvChat").modal("hide");
  pvMessageInput.value = "";
});




// Listen for received image and display it in chat
document.getElementById('imageInput').addEventListener('change', function (e) {
  const file = e.target.files[0];
  if (file) {
    
    const reader = new FileReader();
    reader.onloadend = function () {
      // Sending the image data to the server
      chatNamespace.emit("send-image", {
        imageData: reader.result,
        nickname: nickname,
        roomNumber: roomNumber
      });
    };
    reader.readAsDataURL(file);
  }
});

// Listening
chatNamespace.on("chat message", (data) => {
  feedback.innerHTML = "";
  chatBox.innerHTML += `<li class="alert alert-light">
                            <span
                                class="text-light font-weight-normal"
                                style="font-size: 13pt"
                                >${data.nickname}
                                
                            <span
                                class="
                                    font-italic font-weight-light
                                    m-2
                                "
                                style="font-size: 9pt"
                                >${data.date} hours</span
                            >
                            <p
                                class="alert alert-info mt-2"
                                style="font-family: persian01"
                            >
                            ${data.message}
                            </p>
                            </li>`;
  chatContainer.scrollTop =
    chatContainer.scrollHeight - chatContainer.clientHeight;
});
chatNamespace.on("receive-image", (data) => {
  chatBox.innerHTML += `
    <li class="alert alert-light">
      <span class="text-light font-weight-normal" style="font-size: 13pt">${data.nickname}</span>
      <p class="alert alert-info mt-2">
        <img src="${data.imageData}" alt="Received Image" style="max-width: 100%; max-height: 200px;">
      </p>
    </li>`;
  chatContainer.scrollTop = chatContainer.scrollHeight - chatContainer.clientHeight;
});

messageInput.addEventListener("keypress", (e) => {
  chatNamespace.emit("typing", { name: nickname, roomNumber });
});

chatNamespace.on("typing", (data) => {
  if (roomNumber == data.roomNumber) {
    feedback.innerHTML = data;
  }
});

chatNamespace.on("pvChat", (data) => {
  $("#pvChat").modal("show");
  socketId = data.from;
  modalTitle.innerHTML = "Received message from " + data.name;
  pvChatMessage.style.display = "block";
  pvChatMessage.innerHTML = data.name + " : " + data.message;
});

chatNamespace.on("online", (data) => {
  onlineUsers.innerHTML = "";
  data.forEach((user) => {
    if (roomNumber == user.roomNumber) {
      onlineUsers.innerHTML += `
            <li>
            <button type="button" class="btn btn-light mx-2 p-2" data-toggle="modal" data-target="#pvChat" data-id=${
              user.id
            } data-client=${user.name}
            ${user.id === chatNamespace.id ? "disabled" : ""}>
            ${user.name}
            <span class="badge badge-success"> </span>
            </buton>
            </li>
        `;
    }
  });
});

// jQuery
$("#pvChat").on("show.bs.modal", function (e) {
  var button = $(e.relatedTarget);
  var user = button.data("client");
  socketId = button.data("id");

  modalTitle.innerHTML = "Send message to " + user;
  pvChatMessage.style.display = "none";
});

logoutbtn.addEventListener('click',()=>{
  window.location.replace('/')
})