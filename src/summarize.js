import Anthropic from "@anthropic-ai/sdk";

const MODEL = "claude-sonnet-5";
const FALLBACK_LENGTH = 80;

let client = null;
function getClient() {
  if (!client) client = new Anthropic(); // reads ANTHROPIC_API_KEY from env
  return client;
}

function fallbackSummary(description) {
  const text = (description || "").replace(/\s+/g, " ").trim();
  return text.length > FALLBACK_LENGTH ? `${text.slice(0, FALLBACK_LENGTH)}…` : text;
}

async function summarizeOne(article) {
  try {
    const response = await getClient().messages.create({
      model: MODEL,
      max_tokens: 200,
      messages: [
        {
          role: "user",
          content: `请用一句中文话(不超过 50 字)总结下面这篇 AI 相关新闻,不要加多余的开场白,直接给总结内容。\n\n标题: ${article.title}\n描述: ${article.description}`,
        },
      ],
    });
    const text = response.content
      .filter((block) => block.type === "text")
      .map((block) => block.text)
      .join("")
      .trim();
    return text || fallbackSummary(article.description);
  } catch (err) {
    console.warn(`[summarize] 摘要失败,使用兜底截断: ${article.title} - ${err.message}`);
    return fallbackSummary(article.description);
  }
}

export async function summarizeAll(articles) {
  return Promise.all(
    articles.map(async (article) => ({
      ...article,
      summary: await summarizeOne(article),
    }))
  );
}
