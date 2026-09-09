# AI 新闻日报 - 设计文档(MVP)

## 1. 目标

每天自动生成一份 AI 领域新闻摘要,先跑通"抓取 → 摘要 → 输出"最小链路,验证内容质量,再迭代分发方式和个性化能力。

## 2. MVP 范围

**做:**
- 从 1~2 个信息源抓取当天/近 24 小时的 AI 相关新闻
- 用 LLM 对每条新闻做摘要(中文,1~3 句话)
- 去重(标题/链接层面简单去重即可)
- 生成一份当天的日报文件(Markdown 或静态 HTML),按固定模板排版
- 手动运行 / 定时任务触发一次生成一份

**不做(留到后续版本):**
- 多信息源聚合与权重排序
- 分类/标签体系
- 个性化订阅、用户偏好
- 自动推送渠道(邮件、群消息、App 通知)
- 历史归档检索、搜索
- 网页交互(评论、点赞等)

## 3. 数据流

```
信息源(RSS / API)
   → 抓取原始条目(标题、链接、发布时间、原文摘要)
   → 去重 & 按时间过滤(近 24 小时)
   → LLM 摘要/翻译
   → 按模板渲染成日报(Markdown/HTML)
   → 落盘 / 输出
```

## 4. 关键模块

| 模块 | 职责 | 备注 |
|---|---|---|
| 抓取(fetch) | 从信息源拉取原始新闻条目 | 优先用现成 RSS,减少反爬/API key 依赖 |
| 处理(process) | 去重、过滤时间范围 | 逻辑简单,先不做复杂排序 |
| 摘要(summarize) | 调用 LLM 生成中文摘要 | 单条新闻独立摘要即可,不用生成"总览" |
| 渲染(render) | 套模板输出日报 | Markdown 优先,方便后续转 HTML/发布 |

## 5. 信息源(已确定)

| 来源 | RSS 地址 | 备注 |
|---|---|---|
| TechCrunch AI | https://techcrunch.com/category/artificial-intelligence/feed/ | 标准 RSS 2.0 |
| The Verge AI | https://www.theverge.com/rss/ai-artificial-intelligence/index.xml | 标准 RSS/Atom |
| Hacker News (关键词 AI) | https://hnrss.org/newest?q=AI&count=30 | 已按关键词过滤,但仍需按时间再过滤;count=30 是硬上限,不代表 30 条都在 24 小时内 |

## 5.1 抓取模块实现方案

**技术选型:** Node.js + `rss-parser` 库(已从 Python 改为 Node.js,统一技术栈,方便用 `node-cron` 做定时)。三个源格式略有差异(标准 RSS / Atom),`rss-parser` 能统一解析并生成规范化字段,避免自己写 XML 解析。

**统一数据结构(每篇文章):**

```json
{
  "title": "文章标题",
  "link": "https://...",
  "published_at": "2026-09-09T08:00:00Z",
  "source": "TechCrunch AI"
}
```

- `published_at`:统一转成 UTC ISO8601 字符串,用 `rss-parser` 解析出的 `isoDate`/`pubDate` 转成 `Date` 再 `toISOString()`,避免各源时区格式不一致的问题。
- `source`:写死为信息源的固定标签(如 "TechCrunch AI" / "The Verge AI" / "Hacker News"),不用原始 feed 里的字段,保证展示一致。

**处理步骤:**

1. 逐个请求三个 RSS 地址(设置超时,如 10s),单个源失败(超时/解析出错)只记录日志、跳过,不影响其他源出结果。
2. 用 `feedparser.parse()` 解析每个源,提取 `title`、`link`、`published_parsed`、来源标签,组装成统一结构。
3. **时间过滤**:只保留 `published_at` 在“当前时间 - 24 小时”之内的条目(用 UTC 时间比较,避免时区坑)。
4. **去重**:以 `link` 为主键去重(先做简单归一化,比如去掉 URL 末尾的 `?utm_xxx` 之类追踪参数);Hacker News 条目可能是外部链接也可能是 HN 讨论页链接,暂按原始 link 直接去重,不做标题相似度匹配(留到后续版本)。
5. 三个源的结果合并成一个列表,按 `published_at` 倒序排列。
6. 输出为中间产物 `data/articles-YYYY-MM-DD.json`,作为下一步"摘要"模块的输入,方便调试时跳过重复抓取。

**本阶段先不做:** 重试机制、代理/反爬处理、增量抓取(每次都是全量拉 24 小时)。

## 5.2 摘要 / 去重 / 定时实现方案

**AI 摘要:**
- 对每篇文章的 `标题 + description(RSS 原文摘要字段)`,调用 Claude API 生成一句话中文总结。
- API Key 从环境变量 `ANTHROPIC_API_KEY` 读取,代码里不写死、不落盘。
- 单篇文章独立调用,互不依赖;某一篇摘要失败(超时/报错)不影响其他文章,失败时降级用原始 description 截断作为兜底。

**去重(基于 URL):**
- 抓取阶段先做 URL 归一化(去掉常见追踪参数如 `utm_*`、末尾多余斜杠),再以归一化后的 URL 作为 key 去重,后出现的重复项直接丢弃。
- 这是 5.1 节里"以 link 为主键去重"的具体落地,不是新增逻辑。

**定时运行:**
- 用 `node-cron` 注册一个每天 8:00 触发一次的任务(时区 Asia/Shanghai),调用完整的"抓取→去重→摘要→渲染"流程。
- 同时保留手动单次运行的入口(不进 cron 模式,直接执行一次就退出),方便本地调试。

## 6. 输出形式

- 首选:`reports/YYYY-MM-DD.md`,每天一份文件
- 后续可选:转成静态 HTML 页面发布(参考已有的 [my-blog](https://github.com/labixiaoxinbaby8-del/my-blog) 发布方式)

## 7. 技术选型

- 语言:Node.js
- 抓取:`rss-parser`
- 定时:`node-cron`,每天 8:00(Asia/Shanghai)触发
- LLM:`@anthropic-ai/sdk` 调用 Claude API 做摘要,Key 来自环境变量 `ANTHROPIC_API_KEY`

## 8. 开放问题

- 日报是否需要中英对照,还是直接中文摘要?
- 是否需要保留原文链接供跳转?
- 去重目前只按 `link` 判断,不同来源报道同一事件(不同链接)会重复出现,是否需要处理?(可留到后续版本)
- `data/articles-*.json` 中间产物要不要保留归档,还是每次跑完可以丢弃?
