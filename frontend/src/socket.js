// src/socket.js
import { io } from 'socket.io-client';

const socket = io('http://localhost:5000'); // Adjust the URL if your backend is hosted elsewhere

export default socket;
