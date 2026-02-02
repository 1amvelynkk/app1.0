/// <reference types="vite/client" />
import { GoogleGenAI } from "@google/genai";

const apiKey = import.meta.env.VITE_GEMINI_API_KEY;

if (!apiKey || apiKey === 'PLACEHOLDER_API_KEY') {
    console.warn("AI Service: VITE_GEMINI_API_KEY is missing or is the placeholder value.");
}

const ai = new GoogleGenAI({
    apiKey: apiKey || '',
});

// Rate limiting and caching to prevent Quota Exceeded (429) errors on Free tier
let lastRequestTime = 0;
const MIN_REQUEST_INTERVAL = 3000; // Minimum 3 seconds between requests
const responseCache = new Map<string, { response: string; timestamp: number }>();
const CACHE_TTL = 5 * 60 * 1000; // 5 minute cache TTL

// Helper function to enforce rate limiting
const waitForRateLimit = async (): Promise<void> => {
    const now = Date.now();
    const timeSinceLastRequest = now - lastRequestTime;
    if (timeSinceLastRequest < MIN_REQUEST_INTERVAL) {
        const waitTime = MIN_REQUEST_INTERVAL - timeSinceLastRequest;
        console.log(`AI Rate Limit: Waiting ${waitTime}ms before next request...`);
        await new Promise(resolve => setTimeout(resolve, waitTime));
    }
    lastRequestTime = Date.now();
};

// Helper function to get cached response
const getCachedResponse = (key: string): string | null => {
    const cached = responseCache.get(key);
    if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
        console.log('AI Cache: Using cached response');
        return cached.response;
    }
    responseCache.delete(key);
    return null;
};

// Helper function to cache response
const cacheResponse = (key: string, response: string) => {
    responseCache.set(key, { response, timestamp: Date.now() });
};

export const aiService = {
    /**
     * General chat with AI
     */
    async chatWithAI(userMessage: string, history: any[] = []) {
        console.log("AI Chat: Sending message...", { message: userMessage, historyLength: history.length });

        if (!apiKey || apiKey === 'PLACEHOLDER_API_KEY') {
            return "检测到 API Key 未配置或为占位符。请在 .env.local 中配置真实的 VITE_GEMINI_API_KEY 并重启服务。";
        }

        // Apply rate limiting to prevent 429 errors
        await waitForRateLimit();

        try {
            const response = await ai.models.generateContent({
                model: 'gemini-2.0-flash-001',
                contents: [
                    ...history.map(h => ({
                        role: h.role === 'model' ? 'model' : 'user',
                        parts: [{ text: typeof h.text === 'string' ? h.text : (h.parts?.[0]?.text || '') }]
                    })),
                    { role: 'user', parts: [{ text: userMessage }] }
                ]
            });

            console.log("AI Chat: Received response", response);

            const text = (response as any).candidates?.[0]?.content?.parts?.[0]?.text || (response as any).text;
            return text || "AI 返回了空内容，请稍后再试。";
        } catch (error: any) {
            console.error("AI Chat Error Details:", error);

            let errorMsg = "抱歉，AI 助手请求失败。";
            if (error.status === 401 || error.message?.includes('401')) {
                errorMsg += " API Key 无效，请检查配置。";
            } else if (error.status === 403 || error.message?.includes('403')) {
                errorMsg += " 访问被拒绝（可能由于地理位置限制或 API 权限未开启）。";
            } else if (error.status === 429 || error.message?.includes('429') || error.message?.includes('Quota')) {
                errorMsg = "⏳ API 请求配额已用完（Free tier 限制）。请等待约 1 分钟后再试，或升级到付费计划。";
            } else if (error.status === 404 || error.message?.includes('404')) {
                errorMsg += " 模型未找到（404）。请尝试更换模型或检查 API Key 权限。";
            } else {
                errorMsg += " 请检查网络连接或浏览器控制台查看详细错误信息。";
            }

            return errorMsg;
        }
    },

    /**
     * Get member assignment suggestions with analysis of selected members
     * Now includes skills matching, workload analysis, and removal recommendations
     */
    async getMemberSuggestions(projectDesc: string, members: any[], selectedMembers: any[] = []) {
        console.log("AI Member Suggestions: Analyzing team composition...", {
            projectDesc: projectDesc?.substring(0, 50),
            availableMembers: members.length,
            selectedMembers: selectedMembers.length
        });

        if (!projectDesc) return "请输入项目描述以获取智能建议。";

        // Create intelligent fallback based on workload analysis (always prepared)
        const overloadedMembers = selectedMembers.filter(m =>
            parseInt(m.load) > 70 || m.status === '繁忙'
        );
        const lowLoadMembers = members.filter(m =>
            parseInt(m.load || '0') < 30 && !selectedMembers.some(s => s.id === m.id)
        );

        let fallbackSuggestion = "";
        if (overloadedMembers.length > 0) {
            fallbackSuggestion += `⚠️ 注意：${overloadedMembers.map(m => m.name).join('、')} 当前负载较高，建议考虑移除或替换。`;
        }
        if (lowLoadMembers.length > 0 && lowLoadMembers[0]) {
            fallbackSuggestion += ` 推荐添加 ${lowLoadMembers[0].name}（负载${lowLoadMembers[0].load}），专业匹配度高。`;
        }
        fallbackSuggestion = fallbackSuggestion || "基于多维度综合分析，建议优选领域经验丰富且当前负载较低的成员配合执行。";

        // Check if API key is configured
        if (!apiKey || apiKey === 'PLACEHOLDER_API_KEY') {
            return fallbackSuggestion;
        }

        // Check cache first
        const cacheKey = `member_${projectDesc.substring(0, 30)}_${selectedMembers.map(m => m.id).join(',')}`;
        const cached = getCachedResponse(cacheKey);
        if (cached) return cached;

        try {
            // Apply rate limiting
            await waitForRateLimit();

            const prompt = `
你是一个智能项目管理助手。请根据以下信息分析团队组成并给出优化建议。

## 项目描述
${projectDesc}

## 可用成员列表（按负载排序）
${members.slice(0, 10).map(m => `- ${m.name} (${m.dept} · ${m.title}), 负载: ${m.load || '未知'}`).join('\n')}

## 当前已选成员
${selectedMembers.length > 0
                    ? selectedMembers.map(m => `- ${m.name}: ${m.role || m.title}, 负载: ${m.load}, 状态: ${m.status}`).join('\n')
                    : '暂无'}

## 分析要求
1. 评估当前已选成员是否合适（技能匹配度、负载情况）
2. 如果有成员不合适，明确建议移除并说明理由
3. 推荐增加的成员（从可用列表中选择负载低且技能匹配的）
4. 保持建议简洁（80字以内）

直接返回建议，不要前导语。
`;

            const response = await ai.models.generateContent({
                model: 'gemini-2.0-flash-001',
                contents: [{ role: 'user', parts: [{ text: prompt }] }]
            });
            const text = (response as any).candidates?.[0]?.content?.parts?.[0]?.text || (response as any).text;
            console.log("AI Member Suggestions: Response received", text?.substring(0, 100));

            const result = text || fallbackSuggestion;
            cacheResponse(cacheKey, result);
            return result;
        } catch (error: any) {
            console.error("AI Suggestion Error Details:", error);
            // Return intelligent fallback on any error (including quota exceeded)
            return fallbackSuggestion;
        }
    },

    /**
     * Get project insights
     */
    async getProjectInsights(projectTitle: string, progress: number, milestones: any[]) {
        const fallback = "建议加强跨部门沟通，确保核心节点如期交付，关注项目潜在风险点。";

        // Generate default insight based on progress
        let defaultInsight = fallback;
        if (progress < 30) {
            defaultInsight = "项目处于起步阶段，建议明确目标和里程碑，确保团队对齐方向。";
        } else if (progress > 70) {
            defaultInsight = "项目进入收尾阶段，建议加强质量把控，确保按时交付。";
        }

        if (!apiKey || apiKey === 'PLACEHOLDER_API_KEY') {
            return defaultInsight;
        }

        // Check cache first
        const cacheKey = `insight_${projectTitle}_${progress}`;
        const cached = getCachedResponse(cacheKey);
        if (cached) return cached;

        try {
            // Apply rate limiting
            await waitForRateLimit();

            const prompt = `
你是一个项目管理专家。请针对以下项目状态提供一条核心建议：

项目名称: ${projectTitle}
当前进度: ${progress}%
当前里程碑: ${milestones.find(m => m.status === 'active')?.title || '无'}

建议要求：极其简短（一句话），针对性强，语气专业。
`;

            const response = await ai.models.generateContent({
                model: 'gemini-2.0-flash-001',
                contents: [{ role: 'user', parts: [{ text: prompt }] }]
            });
            const text = (response as any).candidates?.[0]?.content?.parts?.[0]?.text || (response as any).text;

            const result = text || defaultInsight;
            cacheResponse(cacheKey, result);
            return result;
        } catch (error) {
            console.error("AI Insight Error Details:", error);
            return defaultInsight;
        }
    },

    /**
     * Generate AI suggestions based on organization members and project data
     */
    async generateAISuggestions(projects: any[], members: any[], currentUserName: string) {
        console.log("AI Suggestions: Generating insights...", { projectCount: projects.length, memberCount: members.length });

        if (!apiKey || apiKey === 'PLACEHOLDER_API_KEY') {
            console.warn("AI Service: API Key not configured, returning default suggestions");
            return [
                { action: '发现', target: `${members[0]?.name || '成员'}最近完成了类似项目，可以邀请协作`, projectTitle: projects[0]?.title || '项目', projectId: projects[0]?.id || 'proj-1' },
                { action: '建议', target: '提前安排下周的评审会议', projectTitle: projects[1]?.title || '项目', projectId: projects[1]?.id || 'proj-1' },
                { action: '预警', target: '部分项目进度可能延期，建议增加资源', projectTitle: projects[2]?.title || '项目', projectId: projects[2]?.id || 'proj-1' }
            ];
        }

        try {
            const projectData = projects.slice(0, 5).map(p => ({
                title: p.title,
                progress: p.progress,
                status: p.status,
                deadline: p.deadline,
                milestones: p.milestones?.slice(0, 2)
            }));

            const memberData = members.slice(0, 10).map(m => ({
                name: m.name,
                dept: m.dept,
                title: m.title,
                projectCount: m.projectCount || 0
            }));

            const prompt = `
你是一个智能项目管理AI助手。基于以下项目和成员数据，生成3条有价值的智能洞察建议。

当前用户: ${currentUserName}

项目数据:
${JSON.stringify(projectData, null, 2)}

组织成员数据:
${JSON.stringify(memberData, null, 2)}

请生成3条建议，以JSON数组格式返回，每条包含:
- action: "发现" 或 "建议" 或 "预警"
- target: 具体建议内容（20-40字）
- projectTitle: 相关项目名称
- projectId: 相关项目ID

只返回JSON数组，不要其他文字。
`;

            const response = await ai.models.generateContent({
                model: 'gemini-2.0-flash-001',
                contents: [{ role: 'user', parts: [{ text: prompt }] }]
            });

            const text = (response as any).candidates?.[0]?.content?.parts?.[0]?.text || (response as any).text || '';

            // Parse JSON from response
            const jsonMatch = text.match(/\[[\s\S]*\]/);
            if (jsonMatch) {
                const suggestions = JSON.parse(jsonMatch[0]);
                console.log("AI Suggestions: Generated", suggestions);
                return suggestions;
            }

            // Fallback if parsing fails
            return [
                { action: '发现', target: `基于分析，发现有成员可以提升协作效率`, projectTitle: projects[0]?.title, projectId: projects[0]?.id },
                { action: '建议', target: '建议优化资源分配，提高项目执行效率', projectTitle: projects[1]?.title, projectId: projects[1]?.id },
                { action: '预警', target: '监测到潜在风险，建议关注项目进度', projectTitle: projects[2]?.title, projectId: projects[2]?.id }
            ];
        } catch (error) {
            console.error("AI Suggestions Error:", error);
            return [
                { action: '发现', target: `${members[0]?.name || '成员'}最近完成了类似项目`, projectTitle: projects[0]?.title, projectId: projects[0]?.id },
                { action: '建议', target: '提前安排资源和评审会议', projectTitle: projects[1]?.title, projectId: projects[1]?.id },
                { action: '预警', target: '关注项目进度，避免潜在延期风险', projectTitle: projects[2]?.title, projectId: projects[2]?.id }
            ];
        }
    }
};
