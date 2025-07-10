import { useEffect, useState } from "react";
import axios from "axios";
import { setHeaders, url } from "../../../../features/api";

export const useFetchNotes = (businessId) => {
  const [notes, setNotes] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const res = await axios.get(
          `${url}/notes?businessId=${businessId}`,
          setHeaders()
        );
        setNotes(res.data);
      } catch (error) {
        console.error("Error fetching notes:", error);
        setError("Error al obtener las notas. Por favor, intenta de nuevo.");
      } finally {
        setIsLoading(false);
      }
    };
    if (businessId) fetchData();
  }, [businessId]);

  return { notes, isLoading, error };
};