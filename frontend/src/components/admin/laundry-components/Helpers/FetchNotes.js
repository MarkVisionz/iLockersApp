// hooks/useFetchNotes.js
import { useEffect, useState } from "react";
import axios from "axios";
import { setHeaders, url } from "../../../../features/api";

export const useFetchNotes = () => {
  const [notes, setNotes] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null); // Estado para manejar errores

  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      setError(null); // Reiniciar el error antes de la nueva llamada
      try {
        const res = await axios.get(`${url}/notes`, setHeaders());
        setNotes(res.data);
      } catch (error) {
        console.error("Error fetching notes:", error);
        setError("Error al obtener las notas. Por favor, intenta de nuevo más tarde."); // Establecer el mensaje de error
      } finally {
        setIsLoading(false); // Asegurarse de que isLoading se establezca en false
      }
    };
    fetchData();
  }, []);

  return { notes, isLoading, error }; // Devolver el estado de error
};