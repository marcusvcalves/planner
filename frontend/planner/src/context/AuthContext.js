import { createContext, useState, useContext, useEffect } from 'react';
import jwt_decode from 'jwt-decode';
import { useNavigate } from "react-router-dom";

export const AuthContext = createContext();

export const AuthProvider = ({children}) => {

    let [authTokens, setAuthTokens] = useState(() => localStorage.getItem('authTokens') ? JSON.parse(localStorage.getItem('authTokens')) : null);
    let [user, setUser] = useState(() => localStorage.getItem('authTokens') ? jwt_decode(localStorage.getItem('authTokens')) : null);
    let [loading, setLoading] = useState(true);
    const refresh = () => window.location.reload(true);
    const navigate = useNavigate();
    const [error, setError] = useState(null);
    

    let handleLogin = async (e) => {
        e.preventDefault();
        
        let response = await fetch('http://127.0.0.1:8000/api/token/', {
            method: 'POST',
            headers: {
                'Content-Type':'application/json'
            },
            body: JSON.stringify({'email':  e.target.email.value, 'password': e.target.password.value})
        })
        let data = await response.json();
        
        
        if(response.status === 200){
            setAuthTokens(data);
            setUser(jwt_decode(data.access));
            localStorage.setItem('authTokens', JSON.stringify(data));
            navigate('/');
        } else if (response.status === 400 || response.status === 401) {
            setError('Email e/ou senha inválido(s)');
        } else {
            setError('Erro ao fazer login');
        }
    }

    let handleLogout = async () => {
        setAuthTokens(null);
        setUser(null);
        localStorage.removeItem('authTokens');
        refresh();
    }
    
    let updateToken = async () => {
        let response = await fetch('http://127.0.0.1:8000/api/token/refresh/', {
            method: 'POST',
            headers: {
                'Content-Type':'application/json'
            },
            body: JSON.stringify({'refresh': authTokens.refresh})
        })
        let data = await response.json();

        if (response.status === 200) {
            setAuthTokens(data);
            setUser(jwt_decode(data.access));
            localStorage.setItem('authTokens', JSON.stringify(data));
        } else {
            handleLogout();
        }
    }

    let contextData = {
        user:user,
        handleLogin:handleLogin,
        handleLogout:handleLogout,
        error:error
    }

    useEffect(() => {
        let fourMinutes = 1000 * 60 * 4
        let interval = setInterval(() => {
            if(authTokens){
                updateToken();
            }
        }, fourMinutes)
        return () => clearInterval(interval);
    }, [authTokens, loading]);

    return (
        <AuthContext.Provider value={contextData}>
            {children}
        </AuthContext.Provider>
    )
}

export function useAuth() {
    return useContext(AuthContext);
  }

