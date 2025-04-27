import axios from "axios";
import React from "react";
import { useState } from "react";
import { useAuth } from "../context/AuthContext";
import {PaperAirplaneIcon} from "@heroicons/react/24/outline";
import './page_styles/Home.css';

const Home = () => {

    //Is authenticated state from AuthContext
    const { user } = useAuth();

    interface ChatMessage {
        sender: string;
        message: string;
        response: string;
    }

    //Local states and effects
    const [chatHistory, setChatHistory] = useState<ChatMessage[]>([]);
    const [userInput, setUserInput] = useState("");
    const chatAreaRef = React.useRef<HTMLDivElement>(null);

    function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
        e.preventDefault();

        let chat: ChatMessage = { sender: (user) ? user : "anonymous", message: userInput, response: "asdfjkasndfkjashviluaefiuaw4egfiuawefgkjadsbcvjalwefjkagewkljcbkjecbaskljdbec" }

        // Add the user input to the chat history
        setChatHistory((prevHistory: ChatMessage[]) => [...prevHistory, chat]);

        //Send chat message to the backend
        try {
            // const apiUrl = import.meta.env.VITE_BACKEND_API_URL + "/chatbot/chat";

        } catch(error) {
            console.error("Error sending chat message to backend:", error);
        }
        
        setUserInput(""); // Clear the input field after submission
    }

    function handleKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
        if (e.key === "Enter" && !e.shiftKey) {
            e.preventDefault(); // Prevent the default behavior of Enter key
            const form = e.currentTarget.form;
            if (form) {
                form.requestSubmit(); // Trigger the form submission programmatically
            }
        }
    }

    React.useEffect(() => {
        console.log("Chat history updated:", chatHistory);

        chatAreaRef.current?.scrollTo({top: chatAreaRef.current.scrollHeight, behavior: "smooth"}); // Scroll to the bottom of the chat area when new messages are added
    }, [chatHistory]);

    return (
        <div className="home-container">
            <div className="chat-card">
                <div id="chat-area" ref={chatAreaRef} className="chat-area">
                    {chatHistory.map((chat, index) => (
                        <div key={index} className="message-flex">
                            <div className="bg-neutral-500 p-1 rounded-lg self-start max-w-[80%] flex-grow">
                                {chat.message.split('\n').map((line, index) => (
                                    <p key={index} className="break-words">{line}</p>
                                ))}
                            </div>
                            <div className="text-white p-1 rounded-lg self-center max-w-[90%] my-2 flex-grow">
                                {chat.response.split('\n').map((line, index) => (
                                    <p key={index} className="break-words">{line}</p>
                                ))}
                            </div>
                            {(index !== chatHistory.length-1) && <hr className="border-t border-neutral-700 w-full my-4"></hr>}
                        </div>
                    ))}
                
                    <div id="padding" className="w-full flex flex-col items-center bg-none p-2"></div>
                </div>
                <div>
                    <form onSubmit={handleSubmit}>
                        <div id="chatbot-bar" className="chat-input">
                            <textarea id="text-bar" name="text-bar" className="chat-textarea" onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setUserInput(e.target.value)}
                            value={userInput} placeholder="Type your message here..." maxLength={1000} required autoComplete="off" autoCorrect="off" spellCheck="false"  onKeyDown={handleKeyDown} />
                            <button type="submit" id="submit-button" className="chat-submit-button"><PaperAirplaneIcon className="p-5" /></button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
}

export default Home;