import React from "react";
import { useForm } from "react-hook-form";

const styles = {
    container: {
        flex: "1 1 0px"
    },
    form: {
        display: "flex",
        flexDirection: "column",
        width: "50%",
        margin: "0 auto"
    },
    error: {
        color: "red",
        fontSize: "0.5rem"
    }
};

export default function Form(props) {
    const { reload } = props;
    const { register, handleSubmit, errors, reset } = useForm();
    const onSubmit = async data => {
        const res = await fetch("/api/user", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ user: data })
        });
        reset();
        reload();
    };
    console.log(errors);

    return (
        <div style={styles.container}>
            <form onSubmit={handleSubmit(onSubmit)} style={styles.form}>
                <input
                    type="text"
                    placeholder="First name"
                    name="givenName"
                    ref={register({ required: true, maxLength: 80 })}
                />
                {errors.givenName && (
                    <small style={styles.error}>Fyll i!</small>
                )}
                <input
                    type="text"
                    placeholder="Last name"
                    name="surname"
                    ref={register({ required: true, maxLength: 100 })}
                />
                {errors.surname && <small style={styles.error}>Fyll i!</small>}
                <input
                    type="text"
                    placeholder="Email"
                    name="email"
                    ref={register({ required: true, pattern: /^\S+@\S+$/i })}
                />
                {errors.email && (
                    <small style={styles.error}>Måste va email!</small>
                )}
                <input
                    type="text"
                    placeholder="Personnummer (12 siffror)"
                    name="uid"
                    ref={register({
                        required: true,
                        minLength: 12,
                        maxLength: 12
                    })}
                />
                {errors.uid && <small style={styles.error}>wtf</small>}
                <div>
                    <input
                        id="adminCheckbox"
                        type="checkbox"
                        placeholder="admin"
                        name="admin"
                        ref={register}
                    />
                    <label for="adminCheckbox">Admin</label>
                </div>
                <input type="submit" style={{ maxWidth: "20%" }} />
            </form>

            <a
                href="https://folksamforetag.b2clogin.com/folksamforetag.onmicrosoft.com/oauth2/v2.0/authorize?p=B2C_1A_signup_signin_cgi&client_id=d80ce3d6-6729-47a0-a636-82e1429d93c2&nonce=defaultNonce&redirect_uri=https%3A%2F%2Fjwt.ms&scope=openid%20https%3A%2F%2Ffolksamforetag.onmicrosoft.com%2Fapi%2Fdemo&response_type=id_token%20token&prompt=login"
                target="_blank"
            >
                Testa inloggning
            </a>
        </div>
    );
}
