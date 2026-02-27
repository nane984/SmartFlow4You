import axios from "axios"                           // Uvozi Axios biblioteku, koja služi za pravljenje HTTP zahteva

const API = axios.create({                          // kreiranje instace axiosa (create)
    baseURL: "http://localhost:8000/api/",          // baseURL je URL koji će se automatski dodavati svim zahtevima.
});

// interceptors.request.use() → svaki zahtev koji šalješ prolazi kroz ovu funkciju pre nego što ode na server.
API.interceptors.request.use((config) => {                          // ključna stvar za JWT autentifikaciju
    const token = localStorage.getItem("access");                   //localStorage.getItem("access") → koristi JWT token iz browser lokalne memorije.
    if (token) config.headers.Authorization = `Bearer ${token}`;    // dodaje Authorization header sa tokenom.
    return config;
});
export default API;