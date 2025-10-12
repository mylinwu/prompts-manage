import { getCollection } from '@/lib/db';
import { MarketPrompt } from '@/types/prompt';
import agentsData from '@/data/agents.json';

async function initMarket() {
  try {
    console.log('开始初始化市场数据...');

    const collection = await getCollection<MarketPrompt>('market_prompts');

    // 清空现有数据
    await collection.deleteMany({});
    console.log('已清空现有市场数据');

    // 转换数据格式
    const marketPrompts: Omit<MarketPrompt, '_id'>[] = agentsData.map((agent: { name: string; prompt: string; emoji?: string; description?: string; group?: string[] }) => ({
      name: agent.name,
      prompt: agent.prompt,
      emoji: agent.emoji || '',
      description: agent.description || '',
      groups: agent.group || [],
      publishedAt: new Date(),
      favoriteCount: 0,
    }));

    // 批量插入
    const result = await collection.insertMany(marketPrompts as MarketPrompt[]);
    console.log(`成功导入 ${result.insertedCount} 个市场提示词`);

    console.log('市场数据初始化完成！');
    process.exit(0);
  } catch (error) {
    console.error('初始化失败:', error);
    process.exit(1);
  }
}

initMarket();

