import React, { createContext, useContext, useState, ReactNode, useEffect } from "react";

// Définir le type de l'utilisateur
interface User {
    id: string;
    name: string;
    email: string;
}

interface AuthContextType {
    user: User | null; // Changement: stocke les informations utilisateur
    login: (user: User) => void; // La fonction login accepte un argument utilisateur
    logout: () => void;
}

const AuthContext = createContext<AuthContextType | null>(null);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
    const [user, setUser] = useState<User | null>(null); // Utilisation d'un objet utilisateur

    // Vérifier le token au chargement de l'application
    useEffect(() => {
        const token = localStorage.getItem("token");
        const userData = localStorage.getItem("user"); // Récupère les informations utilisateur
        if (token && userData) {
            setUser(JSON.parse(userData)); // Parse l'utilisateur depuis le localStorage
        }
    }, []);

    // Stocke l'utilisateur dans le state et dans le localStorage
    const login = (user: User) => {
        console.log("Login triggered");
        setUser(user);
        localStorage.setItem("user", JSON.stringify(user)); // Stocke les informations utilisateur
        localStorage.setItem("token", user.email); // Stocke le token ou une donnée appropriée
    };

    const logout = () => {
        setUser(null);
        console.log("Logout triggered");
        localStorage.removeItem("user"); // Supprime l'utilisateur du localStorage
        localStorage.removeItem("token"); // Supprime le token
    };

    return (
        <AuthContext.Provider value={{ user, login, logout }}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (!context) throw new Error("useAuth must be used within AuthProvider");
    return context;
};
