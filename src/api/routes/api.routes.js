const express = require("express");
const apiService = require("../services/api.service");
const {
    validationResult,
    matchedData,
    header,
    body
} = require("express-validator");

const validate = method => {
    switch (method) {
        case "getGroups": {
            return [
                header("Content-Type")
                    .exists()
                    .matches(
                        new RegExp(
                            "^(application/json*?)(?:;\\s?charset=utf-8)?$"
                        )
                    ),
                body("objectId", "specify type")
                    .exists()
                    .isUUID()
            ];
        }
        case "delete": {
            return [
                header("Content-Type")
                    .exists()
                    .matches(
                        new RegExp(
                            "^(application/json*?)(?:;\\s?charset=utf-8)?$"
                        )
                    ),
                body("aad_oid", "hmm")
                    .exists()
                    .isUUID()
            ];
        }
        case "signup": {
            return [
                header("Content-Type")
                    .exists()
                    .equals("application/json"),
                body("user", "user doesn't exists").exists(),
                body("user.givenName").exists(),
                body("user.surname").exists(),
                body("user.email", "Invalid email")
                    .exists()
                    .isEmail(),
                body("user.uid").exists(),
                body("user.admin")
                    .exists()
                    .isBoolean()
                // body("user.address").exists(),
                // body("user.zip")
                //     .exists()
                //     .isPostalCode("SE"),
            ];
        }
        default:
            return [];
    }
};

const errorValidator = req => {
    const errors = validationResult(req);

    if (!errors.isEmpty()) {
        console.log(errors);
        throw new Error("Invalid input");
    }
    req.matchedData = matchedData(req);
};

const router = express.Router();

router.post("/groups", validate("getGroups"), async (req, res) => {
    try {
        errorValidator(req);
        const groups = await apiService.getGroups(req);
        res.status(200).send(groups);
    } catch (err) {
        res.status(400).send(err.message);
    }
});

router.post("/user", validate("signup"), async (req, res) => {
    try {
        errorValidator(req);
        const newUser = await apiService.createUser(req);
        res.status(200).send(newUser);
    } catch (err) {
        res.status(400).send(err.message);
    }
});

router.delete("/user", validate("delete"), async (req, res) => {
    try {
        errorValidator(req);
        const msg = await apiService.deleteUserFromAD(req);
        res.status(200).send(msg);
    } catch (err) {
        res.status(400).send(err.message);
    }
});

router.get("/user", async (req, res) => {
    try {
        const users = await apiService.getUsers(req);
        res.status(200).send(users);
    } catch (err) {
        res.status(400).send(err.message);
    }
});

module.exports = router;
