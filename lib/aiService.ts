/// <reference types="vite/client" />

const apiKey = import.meta.env.VITE_DEEPSEEK_API_KEY;
const baseUrl = import.meta.env.VITE_DEEPSEEK_BASE_URL || 'https://api.deepseek.com/v1';

if (!apiKey || apiKey === 'PLACEHOLDER_DEEPSEEK_API_KEY') {
    console.warn("AI Service: VITE_DEEPSEEK_API_KEY is missing or is the placeholder value.");
}

// Rate limiting and caching to prevent Quota Exceeded (429) errors
let lastRequestTime = 0;
const MIN_REQUEST_INTERVAL = 2000; // DeepSeek handles higher throughput, but let's be safe
const responseCache = new Map<string, { response: string; timestamp: number }>();
const CACHE_TTL = 5 * 60 * 1000; // 5 minute cache TTL

// Helper function to enforce rate limiting
const waitForRateLimit = async (): Promise<void> => {
    const now = Date.now();
    const timeSinceLastRequest = now - lastRequestTime;
    if (timeSinceLastRequest < MIN_REQUEST_INTERVAL) {
        const waitTime = MIN_REQUEST_INTERVAL - timeSinceLastRequest;
        await new Promise(resolve => setTimeout(resolve, waitTime));
    }
    lastRequestTime = Date.now();
};

// Helper function to get cached response
const getCachedResponse = (key: string): string | null => {
    const cached = responseCache.get(key);
    if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
        return cached.response;
    }
    responseCache.delete(key);
    return null;
};

// Helper function to cache response
const cacheResponse = (key: string, response: string) => {
    responseCache.set(key, { response, timestamp: Date.now() });
};

// Generic DeepSeek API Caller
const callDeepSeek = async (messages: any[], jsonMode = false) => {
    if (!apiKey || apiKey === 'PLACEHOLDER_DEEPSEEK_API_KEY') {
        throw new Error("MISSING_API_KEY");
    }

    await waitForRateLimit();

    const response = await fetch(`${baseUrl}/chat/completions`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${apiKey}`
        },
        body: JSON.stringify({
            model: "deepseek-chat",
            messages: messages,
            response_format: jsonMode ? { type: "json_object" } : { type: "text" },
            temperature: 0.7,
            max_tokens: 1024
        })
    });

    if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw { status: response.status, message: errorData.error?.message || response.statusText };
    }

    const data = await response.json();
    return data.choices[0].message.content;
};

export const aiService = {
    /**
     * General chat with AI
     */
    async chatWithAI(userMessage: string, history: any[] = [], context: { members?: any[], projects?: any[] } = {}) {
        console.log("AI Chat (DeepSeek): Sending message with context...");

        try {
            let systemContext = "你是一个专业的项目管理助手，名叫 IntelliWork AI。请用简洁、专业且富有逻辑的语言回答用户。";

            if (context.members && context.members.length > 0) {
                systemContext += `\n\n## 组织成员信息（仅基于此回答人员相关问题）：\n${context.members.map(m => `- ${m.name} (${m.dept} · ${m.title || m.role})`).join('\n')}`;
            }

            if (context.projects && context.projects.length > 0) {
                systemContext += `\n\n## 当前项目信息（仅基于此回答项目相关问题）：\n${context.projects.map(p => `- ${p.title} (进度: ${p.progress}%, 负责人: ${p.manager || '未知'})`).join('\n')}`;
            }

            systemContext += "\n\n注意：如果用户询问的人员或项目不在上述列表中，请礼貌地告知您目前只掌握系统内已录入的信息。";

            const messages = [
                { role: "system", content: systemContext },
                ...history.map(h => ({
                    role: h.role === 'model' || h.role === 'assistant' ? 'assistant' : 'user',
                    content: typeof h.text === 'string' ? h.text : (h.parts?.[0]?.text || '')
                })),
                { role: "user", content: userMessage }
            ];

            const text = await callDeepSeek(messages);
            return text || "AI 返回了空内容，请稍后再试。";
        } catch (error: any) {
            console.error("AI Chat Error Details:", error);
            if (error.message === "MISSING_API_KEY") {
                return "检测到 DeepSeek API Key 未配置。请在 .env.local 中配置真实的 VITE_DEEPSEEK_API_KEY 并重启服务。";
            }

            let errorMsg = "抱歉，AI 助手请求失败。";
            if (error.status === 401) errorMsg += " API Key 无效，请检查配置。";
            else if (error.status === 429) errorMsg = "⏳ 请求太频繁，请稍后再试。";
            else errorMsg += ` 错误信息: ${error.message || "请检查网络连接"}`;

            return errorMsg;
        }
    },

    /**
     * Get member assignment suggestions
     */
    async getMemberSuggestions(projectDesc: string, members: any[], selectedMembers: any[] = []) {
        if (!projectDesc) return "请输入项目描述以获取智能建议。";

        const overloadedMembers = selectedMembers.filter(m => parseInt(m.load) > 70 || m.status === '繁忙');
        const lowLoadMembers = members.filter(m => parseInt(m.load || '0') < 30 && !selectedMembers.some(s => s.id === m.id));

        let fallbackSuggestion = overloadedMembers.length > 0 ? `⚠️ 注意：${overloadedMembers.map(m => m.name).join('、')} 负载较高。` : "";
        if (lowLoadMembers.length > 0) fallbackSuggestion += ` 推荐添加 ${lowLoadMembers[0].name}，专业匹配度高。`;
        fallbackSuggestion = fallbackSuggestion || "建议优选领域经验丰富且负载较低的成员。";

        const cacheKey = `member_${projectDesc.substring(0, 30)}_${selectedMembers.map(m => m.id).join(',')}`;
        const cached = getCachedResponse(cacheKey);
        if (cached) return cached;

        try {
            const prompt = `
你是一个智能项目管理助手。分析以下团队并给出优化建议。
项目描述: ${projectDesc}
可用成员: ${members.slice(0, 10).map(m => `${m.name}(${m.dept},负载:${m.load})`).join(',')}
当前已选: ${selectedMembers.map(m => m.name).join(',')}
要求: 80字以内，直接给出最终建议。
`;
            const text = await callDeepSeek([{ role: "user", content: prompt }]);
            const result = text || fallbackSuggestion;
            cacheResponse(cacheKey, result);
            return result;
        } catch (error) {
            console.error("AI Suggestion Error:", error);
            return fallbackSuggestion;
        }
    },

    /**
     * Get project insights
     */
    async getProjectInsights(projectTitle: string, progress: number, milestones: any[]) {
        const defaultInsight = "建议加强进度管理，确保核心节点交付。";

        const cacheKey = `insight_${projectTitle}_${progress}`;
        const cached = getCachedResponse(cacheKey);
        if (cached) return cached;

        try {
            const prompt = `项目: ${projectTitle}, 进度: ${progress}%, 里程碑: ${milestones.find(m => m.status === 'active')?.title || '无'}。请给出一句极其简短且专业的项目管理建议。`;
            const text = await callDeepSeek([{ role: "user", content: prompt }]);
            const result = text || defaultInsight;
            cacheResponse(cacheKey, result);
            return result;
        } catch (error) {
            console.error("AI Insight Error:", error);
            return defaultInsight;
        }
    },

    /**
     * Generate AI suggestions for dashboard
     */
    async generateAISuggestions(projects: any[], members: any[], currentUserName: string) {
        try {
            const projectData = projects.slice(0, 3).map(p => ({ title: p.title, progress: p.progress, id: p.id }));
            const memberData = members.slice(0, 5).map(m => ({ name: m.name, dept: m.dept }));

            const prompt = `
作为 AI 项目管理助手，为用户 ${currentUserName} 生成 3 条关于这些项目或成员的智能反馈（action: 发现/建议/预警）。
项目: ${JSON.stringify(projectData)}
成员: ${JSON.stringify(memberData)}
按 JSON 数组格式返回: [{action, target, projectTitle, projectId}]。只返回 JSON。
`;
            const text = await callDeepSeek([{ role: "user", content: prompt }], true);
            const jsonMatch = text.match(/\[[\s\S]*\]/);
            if (jsonMatch) return JSON.parse(jsonMatch[0]);

            throw new Error("JSON_PARSE_FAILED");
        } catch (error) {
            console.error("AI Suggestions Error:", error);
            return [
                { action: '发现', target: `${members[0]?.name || '相关成员'}近期贡献度较高，建议关注`, projectTitle: projects[0]?.title || '进行中项目', projectId: projects[0]?.id || 'p1' },
                { action: '建议', target: '建议组织一次项目进度同步会议', projectTitle: projects[1]?.title || '各项目', projectId: projects[1]?.id || 'p2' },
                { action: '预警', target: '部分项目关键路径存在延期模型，请注意', projectTitle: projects[2]?.title || '核心任务', projectId: projects[2]?.id || 'p3' }
            ];
        }
    }
};
