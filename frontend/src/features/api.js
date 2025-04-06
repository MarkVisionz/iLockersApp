export const url = "http://localhost:5001/api";

export const setHeaders = () => {
  const token = localStorage.getItem("token");

  return {
    headers: {
      ...(token && { "x-auth-token": token }),
    },
  };
};

