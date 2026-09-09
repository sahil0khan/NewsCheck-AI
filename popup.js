const scanButton = document.getElementById("scanButton");
const analyzeButton = document.getElementById("analyzeButton");
const result = document.getElementById("result");
const titleElement = document.getElementById("title");
const siteElement = document.getElementById("site");
const authorElement = document.getElementById("author");
const articleElement = document.getElementById("article");
const analysisResult = document.getElementById("analysisResult");
const claimsList = document.getElementById("claimsList");
const sourcesList = document.getElementById("sourcesList");

const BACKEND_URL = "http://localhost:3000";


// =========================
// SCAN ARTICLE
// =========================

scanButton.addEventListener("click", async () => {

    const tabs = await chrome.tabs.query({
        active: true,
        currentWindow: true
    });

    const currentTab = tabs[0];

    if (!currentTab || !currentTab.id) {
        alert("No active tab found.");
        return;
    }

    try {

        scanButton.textContent = "Scanning...";
        scanButton.disabled = true;

        const results = await chrome.scripting.executeScript({
            target: {
                tabId: currentTab.id
            },
            files: ["Readability.js", "content.js"]
        });

        const article = results[results.length - 1].result;

        if (!article.success) {
            alert(article.error);
            return;
        }

        result.classList.remove("hidden");
        analyzeButton.classList.remove("hidden");

        titleElement.textContent = article.title || "Not available";
        siteElement.textContent = article.siteName || "Not available";
        authorElement.textContent = article.byline || "Not available";
        articleElement.textContent =
            article.text || "No article text found.";

    } catch (error) {

        console.error(error);

        alert(
            "Could not read this page.\n\n" +
            error.message
        );

    } finally {

        scanButton.textContent = "Scan Article";
        scanButton.disabled = false;

    }
});


// =========================
// ANALYZE ARTICLE
// =========================

analyzeButton.addEventListener("click", async () => {

    console.log("ANALYZE BUTTON CLICKED");

    analyzeButton.textContent = "Analyzing...";
    analyzeButton.disabled = true;

    try {

        // Test backend connection
        const backendResponse = await fetch(BACKEND_URL);
        const backendData = await backendResponse.json();

        console.log("BACKEND RESPONSE:", backendData);


        // Get article text
        const text = articleElement.textContent;


        // Extract possible claims
        const sentences = text
            .split(/(?<=[.!?])\s+/)
            .map(sentence => sentence.trim())
            .filter(sentence => sentence.length > 60)
            .filter(sentence => sentence.length < 500);

        const claims = sentences.slice(0, 5);


        // Clear old results
        claimsList.innerHTML = "";
        sourcesList.innerHTML = "";


        // Display claims
        claims.forEach(claim => {

            const li = document.createElement("li");

            li.textContent = claim;

            claimsList.appendChild(li);

        });


        if (claims.length > 0) {

            const allSources = [];


            // Search sources for every claim
            for (const claim of claims) {

                try {

                    const sources = await searchSources(claim);

                    console.log("CLAIM:", claim);
                    console.log("SOURCES FOUND:", sources);

                    allSources.push({
                        claim: claim,

                        sources: sources.map(source => ({
                            title: source.title,
                            link: source.link,
                            evidence: ""
                        }))
                    });

                } catch (error) {

                    console.error(
                        "Source search failed:",
                        error
                    );

                }
            }


            // Display sources
            allSources.forEach(item => {

                const claimHeading =
                    document.createElement("li");

                claimHeading.innerHTML =
                    "<strong>Claim:</strong> " +
                    item.claim;

                sourcesList.appendChild(claimHeading);


                item.sources.forEach(async source => {

                    const sourceItem =
                        document.createElement("li");

                    const link =
                        document.createElement("a");

                    link.textContent = source.title;
                    link.href = source.link;
                    link.target = "_blank";
                    link.rel = "noopener noreferrer";

                    sourceItem.appendChild(link);

                    sourcesList.appendChild(sourceItem);


                    console.log(
                        "Source URL:",
                        source.link
                    );


                    // Try to fetch source article
                    const sourceText =
                        await fetchSourceText(source.link);

                    source.evidence = sourceText;


                    if (sourceText) {

                        const evidence =
                            document.createElement("p");

                        evidence.textContent =
                            "Evidence found: " +
                            sourceText.slice(0, 500) +
                            "...";

                        sourceItem.appendChild(evidence);

                    } else {

                        const evidence =
                            document.createElement("p");

                        evidence.textContent =
                            "Could not retrieve source content.";

                        sourceItem.appendChild(evidence);

                    }

                });

            });

        }


        // Show analysis result
        setTimeout(() => {

            analysisResult.classList.remove("hidden");

            analyzeButton.textContent =
                "Analysis Complete";

            analyzeButton.disabled = false;

        }, 1500);


    } catch (error) {

        console.error(error);

        analyzeButton.textContent =
            "Analyze Article";

        analyzeButton.disabled = false;

    }

});


// =========================
// GOOGLE NEWS SOURCE SEARCH
// =========================

async function searchSources(query) {

    const shortQuery = query
        .split(/\s+/)
        .slice(0, 12)
        .join(" ");

    const url =
        "https://news.google.com/rss/search?q=" +
        encodeURIComponent(shortQuery) +
        "&hl=en-IN&gl=IN&ceid=IN:en";


    const response = await fetch(url);

    if (!response.ok) {
        throw new Error("Source search failed.");
    }


    const xmlText = await response.text();

    const parser = new DOMParser();

    const xml =
        parser.parseFromString(xmlText, "text/xml");


    const items =
        [...xml.querySelectorAll("item")];


    return items.slice(0, 5).map(item => ({

        title:
            item.querySelector("title")?.textContent ||
            "Untitled",

        link:
            item.querySelector("link")?.textContent ||
            ""

    }));

}


// =========================
// FETCH SOURCE ARTICLE
// =========================

async function fetchSourceText(url) {

    try {

        const response = await fetch(url);

        if (!response.ok) {
            throw new Error(
                "Could not fetch source."
            );
        }


        const html =
            await response.text();


        const parser =
            new DOMParser();

        const doc =
            parser.parseFromString(
                html,
                "text/html"
            );


        const paragraphs =
            [...doc.querySelectorAll("p")];


        const text =
            paragraphs
                .map(p => p.textContent.trim())
                .filter(text => text.length > 40)
                .join(" ");


        return text;


    } catch (error) {

        console.error(
            "Source fetch failed:",
            error
        );

        return "";

    }

}