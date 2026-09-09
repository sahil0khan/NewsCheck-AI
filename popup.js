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
        articleElement.textContent = article.text || "No article text found.";

        result.classList.remove("hidden");

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
    analyzeButton.addEventListener("click", async () => {

    analyzeButton.textContent = "Analyzing...";
    analyzeButton.disabled = true;

    const text = articleElement.textContent;

    const sentences = text
        .split(/(?<=[.!?])\s+/)
        .map(sentence => sentence.trim())
        .filter(sentence => sentence.length > 60)
        .filter(sentence => sentence.length < 500);

    const claims = sentences.slice(0, 5);
    sourcesList.innerHTML = "";

if (claims.length > 0) {

    try {

        const allSources = [];

for (const claim of claims) {

    try {

        const sources = await searchSources(claim);

        allSources.push({
            claim: claim,
            sources: sources
        });

    } catch (error) {

        console.error("Source search failed:", error);

    }
}

     allSources.forEach(item => {

    const claimHeading = document.createElement("li");

    claimHeading.innerHTML =
        "<strong>Claim:</strong> " + item.claim;

    sourcesList.appendChild(claimHeading);

    item.sources.forEach(source => {

        const sourceItem = document.createElement("li");

        const link = document.createElement("a");

        link.textContent = source.title;
        link.href = source.link;
        link.target = "_blank";
        link.rel = "noopener noreferrer";

        sourceItem.appendChild(link);
        sourcesList.appendChild(sourceItem);
    });
});

    } catch (error) {

        console.error(error);

        const li = document.createElement("li");
        li.textContent = "Could not find sources.";
        sourcesList.appendChild(li);
    }
}

    claimsList.innerHTML = "";

    claims.forEach(claim => {

        const li = document.createElement("li");
        li.textContent = claim;

        claimsList.appendChild(li);

    });

    setTimeout(() => {

        analysisResult.classList.remove("hidden");

        analyzeButton.textContent = "Analysis Complete";
        analyzeButton.disabled = false;

    }, 1500);
});
});
async function searchSources(query) {

    const url =
        "https://news.google.com/rss/search?q=" +
        encodeURIComponent(query) +
        "&hl=en-IN&gl=IN&ceid=IN:en";

    const response = await fetch(url);

    if (!response.ok) {
        throw new Error("Source search failed.");
    }

    const xmlText = await response.text();

    const parser = new DOMParser();
    const xml = parser.parseFromString(xmlText, "text/xml");

    const items = [...xml.querySelectorAll("item")];

    return items.slice(0, 5).map(item => ({
        title: item.querySelector("title")?.textContent || "Untitled",
        link: item.querySelector("link")?.textContent || ""
    }));
}