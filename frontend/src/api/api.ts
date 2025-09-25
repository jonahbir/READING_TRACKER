import axios from 'axios';

const API_URL = 'http://localhost:8080';

const api = axios.create({
  baseURL: API_URL,
  headers: { 'Content-Type': 'application/json' },
});

export const login = async (credentials: { email: string; password: string }) => {
  const response = await api.post('/login', credentials);
  return response.data;
};


export const register = async (userData: { username: string; email: string; password: string; insa_batch: string; dorm_number: string; educational_status: string }) => {
  const response = await api.post('/register', userData);
  if (response.data === 'Email pending approval') {
    return { message: 'Email pending approval' };
  }
  return response.data;
};

export const getBooks = async () => {
  const response = await api.get('/books');
  return response.data.map((book: any) => ({
    id: book.ID,
    title: book.Title,
    author: book.Author,
    isbn: book.ISBN,
  }));
};
