import React from "react";
import delicon from "../delete_icon.svg";

const styles = {
    list: {
        display: "flex",
        flexDirection: "column",
        alignItems: "flex-start",
        flex: "1 1 0px",
        width: "80%",
        margin: "0 auto"
    },
    item: {
        display: "flex",
        flexDirection: "row",
        height: 50,
        width: "50%",
        justifyContent: "space-between",
        alignItems: "center"
    },
    delicon: {
        height: "20px",
        cursor: "pointer"
    }
};
export default function UserList(props) {
    const { users, reload } = props;
    const deleteUser = async aad_oid => {
        const res = await fetch("/api/user", {
            method: "DELETE",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ aad_oid })
        });
        reload();
    };
    const listItems = users.map((user, index) => (
        <div style={styles.item} key={user.displayName + index}>
            <span>{user.displayName} </span>
            <img
                src={delicon}
                style={styles.delicon}
                alt="delete user"
                onClick={() => deleteUser(user.objectId)}
            />
        </div>
    ));
    return <div style={styles.list}>{listItems}</div>;
}
