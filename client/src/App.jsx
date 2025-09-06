import { useEffect, useState, useRef } from "react";
import { io } from "socket.io-client";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Toaster, toast } from "react-hot-toast";

// Establishes a connection to the socket server.
const socket = io(import.meta.env.VITE_API_URL);

function App() {
  // State for login and UI control
  const [username, setUsername] = useState("");
  const [roomId, setRoomId] = useState("");
  const [isJoined, setIsJoined] = useState(false);

  // State for chat functionality
  const [currentMessage, setCurrentMessage] = useState("");
  const [messages, setMessages] = useState([]);
  
  // Ref for auto-scrolling to the latest message
  const messagesEndRef = useRef(null);

  // Function to automatically scroll to the bottom of the chat
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  // Effect to scroll whenever a new message is added
  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Handles the logic for joining a chat room
  const joinRoom = () => {
    if (username.trim() !== "" && roomId.trim() !== "") {
      socket.emit("joinRoom", { username, roomId });
    } else {
      toast.error("Username and Room ID cannot be empty.");
    }
  };

  // Handles sending a message to the server
  const sendMessage = () => {
    if (currentMessage.trim() !== "") {
      const messageData = {
        roomId,
        message: currentMessage,
        author: username,
      };
      socket.emit("send_message", messageData);
      setCurrentMessage(""); // Clear input after sending
    }
  };

  // Main effect for handling all socket event listeners
  useEffect(() => {
    const onJoinSuccess = () => setIsJoined(true);

    const handleUserEvent = (message) => {
        setMessages((prev) => [...prev, { type: 'notification', message }]);
    };
    
    const handleReceiveMessage = (data) => {
        setMessages((prev) => [...prev, { type: 'message', ...data }]);
    };

    socket.on("join_success", onJoinSuccess);
    socket.on("user_joined", (user) => handleUserEvent(`${user} joined the room`));
    socket.on("user_left", (user) => handleUserEvent(`${user} left the room`));
    socket.on("receive_message", handleReceiveMessage);

    // Cleanup function to remove listeners when the component unmounts
    return () => {
      socket.off("join_success", onJoinSuccess);
      socket.off("user_joined");
      socket.off("user_left");
      socket.off("receive_message", handleReceiveMessage);
    };
  }, []);

  // --- Render Logic ---
  if (!isJoined) {
    // LOGIN VIEW
    return (
      <div className="flex justify-center items-center h-screen bg-gray-900">
        <Toaster />
        <div className="flex flex-col w-full max-w-sm items-center gap-4 p-8 bg-gray-800 rounded-lg shadow-xl">
          <h1 className="text-white text-3xl font-bold">ChatZ</h1>
          <Input type="text" placeholder="Username" className="text-white bg-gray-700 border-gray-600" value={username} onChange={(e) => setUsername(e.target.value)} />
          <Input type="text" placeholder="Room Id" className="text-white bg-gray-700 border-gray-600" value={roomId} onChange={(e) => setRoomId(e.target.value)} />
          <Button variant="outline" onClick={joinRoom} className="w-full bg-blue-600 hover:bg-blue-700 text-white">Join Room</Button>
        </div>
      </div>
    );
  }

  // CHAT VIEW
  return (
    <div className="flex flex-col h-screen bg-gray-900 text-white font-sans">
      <Toaster />
      <header className="bg-gray-800 p-4 shadow-md">
        <h1 className="text-xl font-semibold">Room: <span className="font-bold text-blue-400">{roomId}</span></h1>
      </header>

      <main className="flex-grow p-4 overflow-y-auto">
        <div className="space-y-4">
          {messages.map((msg, index) => (
            <div key={index}>
              {msg.type === 'notification' ? (
                <p className="text-center text-gray-500 italic text-sm">{msg.message}</p>
              ) : (
                <div className={`flex ${msg.author === username ? 'justify-end' : 'justify-start'}`}>
                  <div className={`max-w-xs lg:max-w-md px-4 py-2 rounded-lg ${msg.author === username ? 'bg-blue-600 rounded-br-none' : 'bg-gray-700 rounded-bl-none'}`}>
                    <p className="text-xs text-gray-400 font-semibold">{msg.author === username ? 'You' : msg.author}</p>
                    <p className="text-base">{msg.message}</p>
                  </div>
                </div>
              )}
            </div>
          ))}
          <div ref={messagesEndRef} />
        </div>
      </main>

      <footer className="bg-gray-800 p-4">
        <div className="flex items-center gap-2">
          <Input
            type="text"
            placeholder="Type your message..."
            className="flex-grow text-white bg-gray-700 border-gray-600"
            value={currentMessage}
            onChange={(e) => setCurrentMessage(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && sendMessage()}
          />
          <Button onClick={sendMessage} className="bg-blue-600 hover:bg-blue-700">Send</Button>
        </div>
      </footer>
    </div>
  );
}

export default App;

