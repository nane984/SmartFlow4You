import { useNavigate } from "react-router-dom"
import api from "../services/api"
import React, { useState } from "react";

interface RegisterForm {
    username: String;
    email: string;
    password: string;
    password2: string;
    first_name: string;
    last_name: string;
    role: string;
}

const Register = () => {
    const navigate = useNavigate();
    
    const [form, setForm] = useState<RegisterForm>({
        username: "",
        email: "",
        password: "",
        password2: "",
        first_name: "",
        last_name: "",
        role: "employee",
    });


    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        // Frontend password match provera (UX)
        if(form.password !== form.password2){
            alert("Password do not mach");
            return;
        }

        // Izbacujemo password2 pre slanja na backend
        const { password2, ...dataToSend } = form;

        try{
            await api.post("core/register/", dataToSend);
            alert ("Registration successfful");
            navigate("/login");

        }catch(error: any){
            console.error(error.response?.data)
            alert("Registration failed");
        }
    }

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        setForm({
            ...form,                            //kopira sve vrednosti iz objekta form
            [e.target.name] : e.target.value,   //dodeljuje vrednosti name: value
        });
    };
    

    return(
        <div className="auth-container">
            <h2>Register</h2>
            <form onSubmit={handleSubmit}>
                <input  type="text"
                        name="first_name"
                        placeholder="First name"
                        onChange={handleChange}
                        required
                />
                <input  type="text"
                        name="last_name"
                        placeholder="Last name"
                        onChange={handleChange}
                        required
                />
                <input  type="text"
                        name="username"
                        placeholder="Username"
                        onChange={handleChange}
                        required
                />
                <input  type="email"
                        name="email"
                        placeholder="Email"
                        onChange={handleChange}
                        required
                />
                <input  type="password"
                        name="password"
                        placeholder="Password"
                        onChange={handleChange}
                        required
                />
                <input  type="password"
                        name="password2"
                        placeholder="Repet password"
                        onChange={handleChange}
                        required
                />
                <select name="role" onChange={handleChange}>
                    <option value ="employee">Employee</option>
                    <option value ="manager">Manager</option>
                </select>
                <button type="submit">Register</button>
            </form>
        </div>
    );
};

export default Register;