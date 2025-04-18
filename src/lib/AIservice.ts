import { getApiKey } from './settingsManager';

/**
 * AI生成选项接口
 */
interface GenerateOptions {
  model: string;
  temperature?: number;
  maxTokens?: number;
  stream?: boolean;
  onStream?: (content: string) => void;
}

/**
 * 默认生成选项
 */
const DEFAULT_OPTIONS: GenerateOptions = {
  model: 'gemini-2.5-pro-exp-03-25', // 默认模型
  temperature: 0.7,
  maxTokens: 64000,
  stream: false,
};

/**
 * 解析SSE流数据
 * @param chunk 数据块
 * @returns 解析后的JSON对象
 */
const parseSSEResponse = (chunk: string): any => {
  // 移除"data: "前缀
  const jsonStr = chunk.replace(/^data: /, '').trim();
  
  // 处理结束标记
  if (jsonStr === '[DONE]') {
    return { done: true };
  }
  
  try {
    return JSON.parse(jsonStr);
  } catch (error) {
    console.error("无法解析SSE响应:", error);
    console.debug("原始响应:", jsonStr);
    return null;
  }
};

/**
 * AI生成服务
 */
export const AIGenerator = {
  /**
   * 生成文本内容
   * @param prompt 提示词
   * @param options 生成选项
   * @returns 生成的内容
   */
  generate: async (prompt: string, options?: Partial<GenerateOptions>): Promise<string> => {
    try {
      // 获取API密钥
      const apiKey = await getApiKey();
      if (!apiKey) {
        throw new Error('未找到API密钥，请先在设置中配置API密钥');
      }

      // 合并选项
      const finalOptions: GenerateOptions = {
        ...DEFAULT_OPTIONS,
        ...options,
      };

      // 构建请求数据
      const data = {
        model: finalOptions.model,
        messages: [
          { role: "system", content: prompt },
          { role: "user", content: "none" }
        ],
        stream: finalOptions.stream,
        temperature: finalOptions.temperature,
        max_tokens: finalOptions.maxTokens,
      };

      // 如果是流式请求
      if (finalOptions.stream && finalOptions.onStream) {
        let fullContent = "";
        
        // 发送流式请求
        const response = await fetch('https://generativelanguage.googleapis.com/v1beta/openai/chat/completions', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${apiKey}`,
          },
          body: JSON.stringify(data),
        });
        
        if (!response.ok) {
          const errorText = await response.text();
          throw new Error(`API请求失败: ${response.status} ${errorText}`);
        }
        
        if (!response.body) {
          throw new Error('响应体为空');
        }
        
        // 创建读取器和解码器处理流
        const reader = response.body.getReader();
        const decoder = new TextDecoder('utf-8');
        
        while (true) {
          const { value, done } = await reader.read();
          if (done) break;
          
          // 解码并拆分数据块
          const chunk = decoder.decode(value, { stream: true });
          const lines = chunk.split('\n');
          
          for (const line of lines) {
            if (!line.trim()) continue;
            
            // 解析SSE响应
            const parsed = parseSSEResponse(line);
            
            if (!parsed || parsed.done) continue;
            
            // 提取内容并更新
            if (parsed.choices && parsed.choices.length > 0) {
              const content = parsed.choices[0].delta?.content || '';
              if (content) {
                fullContent += content;
                finalOptions.onStream(fullContent);
              }
            }
          }
        }
        
        return fullContent;
      } else {
        // 发送普通请求
        const response = await fetch('https://generativelanguage.googleapis.com/v1beta/openai/chat/completions', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${apiKey}`,
          },
          body: JSON.stringify(data),
        });

        // 处理响应
        if (!response.ok) {
          const errorText = await response.text();
          throw new Error(`API请求失败: ${response.status} ${errorText}`);
        }

        const result = await response.json();
        
        // 提取生成内容
        if (result.choices && result.choices.length > 0 && result.choices[0].message) {
          return result.choices[0].message.content.trim();
        } else {
          throw new Error('无法获取生成内容');
        }
      }
    } catch (error) {
      console.error('AI生成错误:', error);
      throw error;
    }
  },

  /**
   * 获取可用的模型列表
   */
  getAvailableModels: () => {
    return [
      { id: 'gemini-2.5-flash-preview-04-17', name: 'Gemini 2.5 Flash' },
      { id: 'gemini-2.5-pro-exp-03-25', name: 'Gemini 2.5 Pro' },
    ];
  },
};
