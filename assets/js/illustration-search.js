document.addEventListener("DOMContentLoaded", async () => {
  const input = document.getElementById(
    "illustration-search-input"
  );

  const resultsContainer = document.getElementById(
    "search-results"
  );

  const resultCount = document.getElementById(
    "search-result-count"
  );

  const paginationContainer = document.getElementById(
    "search-pagination"
  );

  const noResults = document.getElementById(
    "search-no-results"
  );

  if (!resultsContainer) return;

  const params = new URLSearchParams(window.location.search);

  const keyword = params.get("q") || "";

  if (input) {
    input.value = keyword;
  }

  const PER_PAGE = 18;

  let currentPage = 1;
  let allResults = [];

  // 搜尋同義詞
  const synonyms = {
    coffee: ["コーヒー", "咖啡"],
    cup: ["マグカップ", "カップ", "杯子"],
    dog: ["犬", "いぬ", "狗"],
    cat: ["猫", "ねこ", "貓"],
    bread: ["パン", "麵包"],
    flower: ["花", "フラワー"],
    candle: ["キャンドル", "蠟燭"],
    apple: ["りんご", "蘋果"]
  };

  // 統一大小寫及部分字元形式
  function normalize(text) {
    return String(text || "")
      .normalize("NFKC")
      .toLowerCase()
      .trim();
  }

  // 建立搜尋文字
  function getSearchText(item) {
    const title = [
      item.title,
      item.title_zh,
      item.title_ja
    ];

    const tags = Array.isArray(item.tags)
      ? item.tags
      : [];

    const categories = Array.isArray(item.category)
      ? item.category
      : [];

    return normalize(
      [
        ...title,
        ...tags,
        ...categories
      ].join(" ")
    );
  }

  // 將輸入的關鍵字擴充為同義詞
  function expandKeyword(keyword) {
    const normalized = normalize(keyword);

    const expanded = [normalized];

    Object.entries(synonyms).forEach(
      ([key, values]) => {
        const group = [
          key,
          ...values
        ].map(normalize);

        if (
          group.some(value =>
            normalized.includes(value)
          )
        ) {
          expanded.push(...group);
        }
      }
    );

    return [...new Set(expanded)];
  }

  // 搜尋比對
  function searchItems(items, keyword) {
    const keywords = normalize(keyword)
      .split(/\s+/)
      .filter(Boolean);

    if (!keywords.length) {
      return [];
    }

    return items.filter(item => {
      const text = getSearchText(item);

      return keywords.every(word => {
        const expanded = expandKeyword(word);

        return expanded.some(
          value => text.includes(value)
        );
      });
    });
  }

  // 建立插圖卡片
  function createCard(item) {
    const article = document.createElement("article");

    article.className = "illustration-card";

    const link = document.createElement("a");

    link.href = item.url;
    link.className = "card-link";

    const sampleArea = document.createElement("div");

    sampleArea.className = "sample-area";

    const image = document.createElement("img");

    image.src =
      `/assets/images/illustrations/thumbnail/${item.image}-thumbnail.png`;

    image.alt = `${item.title} thumbnail - SunnyDraws`;

    sampleArea.appendChild(image);

    const infoArea = document.createElement("div");

    infoArea.className = "info-area";

    const title = document.createElement("h3");

    title.textContent = item.title;

    infoArea.appendChild(title);

    link.appendChild(sampleArea);
    link.appendChild(infoArea);

    article.appendChild(link);

    return article;
  }

  // 顯示搜尋結果
  function renderResults() {
    resultsContainer.innerHTML = "";

    const totalItems = allResults.length;

    const totalPages = Math.ceil(
      totalItems / PER_PAGE
    );

    const start = (currentPage - 1) * PER_PAGE;

    const end = start + PER_PAGE;

    const pageItems = allResults.slice(
      start,
      end
    );

    pageItems.forEach(item => {
      resultsContainer.appendChild(
        createCard(item)
      );
    });

    resultCount.textContent =
      `Search results: ${totalItems} items`;

    noResults.hidden = totalItems > 0;

    renderPagination(totalPages);
  }

  // 分頁
  function renderPagination(totalPages) {
  paginationContainer.innerHTML = "";

  if (totalPages <= 1) return;

  // 1. 建立上一頁 / 下一頁按鈕
  function createDirectButton(label, page) {
    const button = document.createElement("button");

    button.type = "button";
    button.textContent = label;
    button.className = "page-direct";

    button.addEventListener("click", () => {
      currentPage = page;
      renderResults();

      window.scrollTo({
        top: 0,
        behavior: "smooth"
      });
    });

    return button;
  }

  // 2. 建立頁碼
  function createPageNumber(page) {
    if (page === currentPage) {
      const span = document.createElement("span");

      span.className = "page-num current";

      const bold = document.createElement("b");

      bold.textContent = page;

      span.appendChild(bold);

      return span;
    }

    const button = document.createElement("button");

    button.type = "button";
    button.className = "page-num";
    button.textContent = page;

    button.addEventListener("click", () => {
      currentPage = page;
      renderResults();

      window.scrollTo({
        top: 0,
        behavior: "smooth"
      });
    });

    return button;
  }

  // 3. 建立分頁容器
  const wrapper = document.createElement("nav");

  wrapper.className = "pagination-wrapper";

  wrapper.setAttribute(
    "aria-label",
    "Search result pages"
  );

  // 4. 上一頁
  if (currentPage > 1) {
    wrapper.appendChild(
      createDirectButton("← Prev", currentPage - 1)
    );
  }

  // 5. 頁碼清單
  const pageList = document.createElement("div");

  pageList.className = "page-numbers-list";

  for (let page = 1; page <= totalPages; page++) {
    pageList.appendChild(
      createPageNumber(page)
    );

    // 頁碼之間加入 | 分隔符號
    if (page < totalPages) {
      pageList.appendChild(
        document.createTextNode(" | ")
      );
    }
  }

  wrapper.appendChild(pageList);

  // 6. 下一頁
  if (currentPage < totalPages) {
    wrapper.appendChild(
      createDirectButton("Next →", currentPage + 1)
    );
  }

  paginationContainer.appendChild(wrapper);
}

  // 讀取搜尋索引
  try {
    const response = await fetch(
      window.searchIndexUrl
    );

    if (!response.ok) {
      throw new Error("Failed to load search index");
    }

    const items = await response.json();

    allResults = searchItems(items, keyword);

    renderResults();

  } catch (error) {
    console.error(error);

    resultCount.textContent =
      "Unable to load search results.";
  }
});