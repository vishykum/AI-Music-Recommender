import axios from "axios";
import React from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

const Home = () => {

    return (
        <div className="h-full w-full bg-blue-100 flex items-center justify-center">
            <div id="chat-area" className="flex flex-col h-[400px] w-200 max-h-full bg-neutral-300 rounded-lg shadow-lg p-5 overflow-y-scroll">
                <div id="chat-box1" className="h-[900px] w-full bg-red-200 shrink-0"></div>
                <div id="chat-box2" className="h-[900px] w-full bg-blue-200 shrink-0"></div>
            </div>
            <div className="bottom-0 fixed m-5">
                <form>
                    <div id="chatbot-bar" className="flex flex-row justify-center items-center h-20 w-200 bg-blue-200 rounded-lg p-1">
                        <textarea id="text-bar" className="flex-grow h-full bg-amber-200 overflow-y-scroll" />
                        <button type="submit" id="submit-button" className=" ml-1 h-full w-20 bg-red-300 rounded-lg"></button>
                    </div>
                </form>
            </div>

        </div>
    );
}

export default Home;