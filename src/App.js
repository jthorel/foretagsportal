import React, { useEffect, useState } from "react";
import "./App.css";
import UserList from "./components/List";
import Form from "./components/Form";

function App() {
    const [users, setUsers] = useState([]);

    async function getUsers() {
        const res = await fetch("/api/user", {
            method: "GET"
        });
        const users = await res.json();
        console.log(users);
        setUsers(users);
    }

    useEffect(() => {
        getUsers();
        return () => {};
    }, []);

    return (
        <div className="App">
            <Form reload={getUsers} />
            <UserList users={users} reload={getUsers} />
        </div>
    );
}

export default App;
