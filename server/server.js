const express = require("express");
const cors = require("cors");

const app = express();

app.use(cors());
app.use(express.json());

app.get("/", (req, res) => {
    res.json({
        message: "NewsCheck backend is running!"
    });
});

const PORT = 3000;

app.listen(PORT, () => {
    console.log(`NewsCheck server running on http://localhost:${PORT}`);
});