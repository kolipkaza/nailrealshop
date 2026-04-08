# Nail_Researcher Agent Configuration

## 🎯 Agent Profile
**Name:** Nail_Researcher
**Model:** zai/glm-5 (main session) | sub-agent default
**Purpose:** Research nail salon themes, fashion websites, and nail art trends

## 🔍 Search Method
- **Tool:** DuckDuckGo HTML search
- **URL Format:** `https://duckduckgo.com/html/?q=YOUR+SEARCH+QUERY`
- **Extract:** Use `web_fetch` tool with `extractMode: markdown`

## 📝 Output Requirements
- **Format:** Markdown (`.md`)
- **Location:** `/Users/v2ruz/Desktop/AI_Project/AI_Research/`
- **Filename:** `YYYY-MM-DD_topic-name.md`
- **Structure:**
  - Title and date
  - Key findings
  - Examples with URLs
  - Color palettes (if applicable)
  - Actionable insights

## 🎨 Research Topics

### 1. Website Themes
- Nail salon website designs
- Fashion portfolio websites
- Beauty industry landing pages
- Minimalist/luxury design examples

### 2. Color Trends
- Seasonal nail polish colors
- Fashion color palettes
- Website color schemes for beauty brands

### 3. UX/UI Patterns
- Booking system designs
- Gallery layouts for nail art
- Mobile-responsive beauty sites

### 4. Inspiration
- Award-winning nail salon websites
- Trendy fashion blogs
- Social media integration examples

## 🚀 How to Use

### Spawn Agent:
```javascript
sessions_spawn({
  label: "Nail_Researcher",
  mode: "run",  // One-shot execution
  runtime: "subagent",
  task: "Research [TOPIC] and save to /Users/v2ruz/Desktop/AI_Project/AI_Research/ as markdown file"
})
```

### Example Tasks:
- "Research modern nail salon website themes and save findings"
- "Find 2026 nail color trends and create color palette guide"
- "Compile list of top 10 nail salon websites with design analysis"

## 📂 Example Output File

```markdown
# Nail Salon Website Themes - Spring 2026
Date: 2026-04-02

## 🎨 Top Themes

### 1. Minimalist Luxury
- Clean white backgrounds
- Gold accents
- High-quality nail art photography
- Example: [Website URL]

### 2. Bold & Vibrant
- Bright color gradients
- Playful animations
- Instagram-style galleries
- Example: [Website URL]

## 🎨 Color Palettes
- **Palette 1:** Rose Gold + Blush + White
- **Palette 2:** Purple + Pink + Gold

## 📊 Key Insights
- Mobile-first design is crucial (70% traffic)
- Booking systems increase conversions by 40%
- High-quality photos are essential

## 🔗 Sources
- [Source 1]
- [Source 2]
```

## 📌 Notes
- Agent runs in one-shot mode (spawn per task)
- Results announced when complete
- Files saved automatically to AI_Research folder
- Use for all nail/fashion related research requests

---

**Status:** ✅ Ready to spawn
**Created:** 2026-04-02
**Location:** `/Users/v2ruz/Desktop/AI_Project/NailReal_Shop/docs/nail_researcher_agent.md`
