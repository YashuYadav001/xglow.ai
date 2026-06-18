import {
  createContext,
  useContext,
  useEffect,
  useState,
} from "react";

import { onAuthStateChanged } from "firebase/auth";
import { doc, getDoc } from "firebase/firestore";

import { auth, db } from "../firebase";

const AuthContext = createContext();

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [userData, setUserData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(
      auth,
      async (firebaseUser) => {
        setLoading(true);

        try {
          setUser(firebaseUser);

          if (firebaseUser) {
            const userRef = doc(
              db,
              "users",
              firebaseUser.uid
            );

            const userSnap = await getDoc(userRef);

            if (userSnap.exists()) {
              setUserData(userSnap.data());
            } else {
              setUserData(null);
            }
          } else {
            setUserData(null);
          }
        } catch (error) {
          console.error(
            "Failed to load user data:",
            error
          );
          setUserData(null);
        } finally {
          setLoading(false);
        }
      }
    );

    return unsubscribe;
  }, []);

  return (
    <AuthContext.Provider
      value={{
        user,
        userData,
        loading,
      }}
    >
      {!loading && children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}