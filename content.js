(() => {
    const documentClone = document.cloneNode(true);

    const reader = new Readability(documentClone);
    const article = reader.parse();

    if (!article) {
        return {
            success: false,
            error: "Could not extract an article from this page."
        };
    }

    return {
        success: true,
        title: article.title || "",
        text: article.textContent || "",
        excerpt: article.excerpt || "",
        byline: article.byline || "",
        siteName: article.siteName || "",
        url: window.location.href
    };
})();