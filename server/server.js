const express = require("express");
const cors = require("cors");
const { Readability } = require("@mozilla/readability");
const { JSDOM } = require("jsdom");

const app = express();

app.use(cors());
app.use(express.json());


// =========================
// HEALTH CHECK
// =========================

app.get("/", (req, res) => {
    res.json({
        message: "NewsCheck backend is running!"
    });
});


// =========================
// SOURCE FETCH + READABILITY
// =========================

app.post("/api/source", async (req, res) => {

    try {

        const { url } = req.body;

        if (!url) {
            return res.status(400).json({
                error: "URL is required."
            });
        }

        console.log("SOURCE URL RECEIVED:", url);


        // Fetch webpage
        const response = await fetch(url);

        if (!response.ok) {
            throw new Error(
                `Could not fetch source. Status: ${response.status}`
            );
        }

        const html = await response.text();


        // Create DOM from webpage
        const dom = new JSDOM(html, {
            url: url
        });


        // Run Mozilla Readability
        const reader = new Readability(
            dom.window.document
        );

        const article = reader.parse();


        if (!article) {

            return res.status(422).json({
                success: false,
                error: "Could not extract an article from this page."
            });

        }


        // Send clean article data
        res.json({

            success: true,

            title: article.title || "",

            text: article.textContent || "",

            excerpt: article.excerpt || "",

            byline: article.byline || "",

            siteName: article.siteName || "",

            url: url

        });


    } catch (error) {

        console.error(
            "SOURCE FETCH ERROR:",
            error
        );

        res.status(500).json({

            success: false,

            error: error.message

        });

    }

});


// =========================
// START SERVER
// =========================

const PORT = 3000;

app.listen(PORT, () => {

    console.log(
        `NewsCheck server running on http://localhost:${PORT}`
    );

});