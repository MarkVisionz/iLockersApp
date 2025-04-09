// src/utils/checkFirebaseUser.js
import { fetchSignInMethodsForEmail } from "firebase/auth";
import { auth } from "../features/firebase-config";

export const isFirebaseUser = async (email) => {
  const methods = await fetchSignInMethodsForEmail(auth, email);
  return methods.length > 0;
};
