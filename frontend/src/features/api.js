import { store } from '../index';

export const url = 'http://localhost:5001/api';

export const setHeaders = () => {
  const token = store.getState().auth.token || localStorage.getItem('token');
  console.log('Token en setHeaders:', token ? `Presente (${token.substring(0, 20)}...)` : 'Ausente', new Date().toISOString());
  console.log('Origen del token:', store.getState().auth.token ? 'Redux store' : 'localStorage');
  if (!token) {
    console.warn('No se encontró token en setHeaders');
    return { headers: { 'Content-Type': 'application/json' } };
  }
  return {
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
  };
};