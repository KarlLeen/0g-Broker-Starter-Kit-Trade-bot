# 0G Brave Trader 🚀

基于 **0G Broker Starter Kit** 构建的智能交易机器人，集成币安交易所实时价格数据，提供 AI 驱动的交易建议和分析。

## 项目简介

本项目在 [0G Broker Starter Kit](https://github.com/0glabs/0g-broker-starter-kit) 基础上扩展，添加了以下核心功能：

- **实时价格数据获取** - 从币安期货 API (`https://fapi.binance.com/fapi/v1/ticker/price`) 获取加密货币实时价格
- **智能交易建议** - 基于实时市场数据的 AI 交易分析和建议
- **自动数据注入** - 自动检测交易相关问题并获取相关价格数据
- **去中心化 AI 验证** - 利用 0G Broker 的内容验证机制确保 AI 建议的可信度

## 功能概览

本项目实现了以下功能：

### 0G Broker 核心功能
1. **Broker 实例构建** - 创建和初始化 broker 连接
2. **账户充值** - 管理账本和充值 A0GI 代币
3. **服务验证** - 验证 AI 服务提供者
4. **Chat 对话** - 与 AI 模型进行交互
5. **内容验证** - 验证 AI 回复的真实性

### 交易机器人扩展功能
6. **币安价格数据集成** - 实时获取币安期货市场价格
7. **智能交易分析** - AI 基于实时数据提供交易建议
8. **自动数据获取** - 自动识别交易相关问题并获取相关价格
9. **多交易对支持** - 支持 BTC、ETH、BNB 等主流加密货币分析

## 核心概念

### 1. Broker 实例
```typescript
import { createZGComputeNetworkBroker } from '@0glabs/0g-serving-broker';

// 使用钱包签名者创建 broker
const broker = await createZGComputeNetworkBroker(signer);
```

### 2. 账本管理
```typescript
// 创建账本并充值
await broker.ledger.addLedger(amount);

// 为已有账本充值
await broker.ledger.depositFund(amount);

// 查询账本信息
const { ledgerInfo } = await broker.ledger.ledger.getLedgerWithDetail();
```

### 3. 服务验证
```typescript
// 获取服务元数据
const metadata = await broker.inference.getServiceMetadata(providerAddress);

// 验证服务（acknowledge）
await broker.inference.acknowledge(providerAddress);

// 检查是否已验证
const isAcknowledged = await broker.inference.userAcknowledged(providerAddress);
```

### 4. Chat 对话
```typescript
// 获取请求头（包含认证信息）
const headers = await broker.inference.getRequestHeaders(
  providerAddress,
  JSON.stringify(messages)
);

// 发送请求到 AI 服务
const response = await fetch(`${endpoint}/chat/completions`, {
  method: 'POST',
  headers: { ...headers },
  body: JSON.stringify({ messages, model, stream: true })
});
```

### 5. 内容验证
```typescript
// 处理响应并验证内容
const isValid = await broker.inference.processResponse(
  providerAddress,
  responseContent,
  chatId
);
```

### 6. 币安价格数据获取
```typescript
import { getBinancePrices, getPopularPrices, formatPricesForAI } from './utils/binance';

// 获取指定交易对价格
const prices = await getBinancePrices('BTCUSDT');

// 获取热门交易对价格
const popularPrices = await getPopularPrices();

// 格式化价格数据供 AI 使用
const priceData = formatPricesForAI(prices);
```

### 7. 交易建议生成
系统会自动检测用户消息中的交易相关关键词，自动获取实时价格数据，并将数据注入 AI 对话上下文，让 AI 能够基于实时市场数据提供专业的交易建议。

## 快速开始

### 安装依赖
```bash
pnpm install
```

### 配置项目

1. 在 `pages/_app.tsx` 中设置 WalletConnect Project ID：
```typescript
const config = getDefaultConfig({
  appName: '0G Broker Starter Kit',
  projectId: 'YOUR_PROJECT_ID', // 从 https://cloud.walletconnect.com 获取
  chains: [zgTestnet], // 0G 测试网
  ssr: true,
});
```

### 运行项目
```bash
pnpm run dev
```

访问 http://localhost:3000

## 使用流程

1. **连接钱包** - 使用 MetaMask 或其他钱包连接到 0G 测试网
2. **创建账本** - 在"账户"标签页创建账本并充值 A0GI 代币
3. **验证服务** - 在"服务"标签页选择并验证 AI 服务提供者
4. **开始交易对话** - 在"交易助手"标签页与 AI 进行交互
5. **获取交易建议** - 询问交易相关问题，系统会自动获取实时价格数据并给出建议

### 交易对话示例

你可以询问以下类型的问题：

- **价格查询**: "BTC 现在的价格是多少？"
- **交易建议**: "给我一些交易建议"
- **行情分析**: "分析一下 ETH 的行情"
- **买卖建议**: "BTCUSDT 现在适合买入吗？"
- **市场趋势**: "现在适合买入还是卖出？"

系统会自动：
1. 检测问题中的交易相关关键词
2. 从币安 API 获取实时价格数据
3. 将数据注入 AI 对话上下文
4. AI 基于实时数据提供专业建议
5. 验证 AI 回复的真实性（通过 0G Broker）

## 项目结构

```
0g-broker-starter-kit-trade-bot/
├── components/           # React 组件
│   ├── AccountTab.tsx      # 账户管理组件
│   ├── ServiceTab.tsx       # 服务验证组件
│   └── ChatTab.tsx         # 交易助手组件（集成交易功能）
├── utils/               # 工具函数
│   └── binance.ts          # 币安 API 集成工具
├── pages/               # Next.js 页面
│   ├── _app.tsx            # 应用配置（WalletConnect）
│   └── index.tsx           # 主页（标签页导航）
└── styles/              # 样式文件
    └── globals.css         # 全局样式
```

## 技术栈

- **框架**: Next.js 14
- **区块链**: 0G Testnet
- **钱包连接**: RainbowKit + Wagmi
- **0G Broker**: @0glabs/0g-serving-broker
- **价格数据**: 币安期货 API (fapi.binance.com)
- **AI 服务**: 通过 0G Broker 连接的去中心化 AI 服务

## 核心特性

### 🔄 自动价格数据获取
- 自动检测交易相关问题
- 智能提取交易对符号（如 BTCUSDT, ETHUSDT）
- 实时从币安期货 API 获取价格数据
- 支持单个交易对或热门交易对批量查询

### 🤖 AI 驱动的交易建议
- 基于实时市场数据的专业分析
- 市场趋势分析
- 买入/卖出建议
- 风险提示和技术分析要点

### ✅ 去中心化验证
- 利用 0G Broker 验证 AI 回复真实性
- 确保交易建议的可信度
- 透明的计费和验证机制

## API 集成

### 币安期货 API
本项目使用币安期货 API 获取实时价格数据：

- **端点**: `https://fapi.binance.com/fapi/v1/ticker/price`
- **支持**: 单个交易对查询或批量查询
- **数据格式**: JSON
- **更新频率**: 实时

示例请求：
```bash
# 获取单个交易对价格
GET https://fapi.binance.com/fapi/v1/ticker/price?symbol=BTCUSDT

# 获取所有交易对价格
GET https://fapi.binance.com/fapi/v1/ticker/price
```

## 相关资源

- [0G Labs 文档](https://docs.0g.ai)
- [0G Serving Broker NPM](https://www.npmjs.com/package/@0glabs/0g-serving-broker)
- [0G Broker Starter Kit](https://github.com/0glabs/0g-broker-starter-kit) - 基础项目
- [币安期货 API 文档](https://binance-docs.github.io/apidocs/futures/cn/)
- [WalletConnect](https://cloud.walletconnect.com)

## 注意事项

⚠️ **风险提示**: 
- 本项目仅用于演示和教育目的
- AI 提供的交易建议仅供参考，不构成投资建议
- 加密货币交易存在高风险，请谨慎决策
- 建议在充分了解风险的情况下使用

## License

MIT
