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

module.exports = router;
