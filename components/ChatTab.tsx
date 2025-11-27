
import { useState, useEffect } from 'react';
import { getBinancePrices, getPopularPrices, formatPricesForAI } from '../utils/binance';

interface ChatTabProps {
  broker: any;
  selectedProvider: any;
  message: string;
  setMessage: (message: string) => void;
}

export default function ChatTab({ 
  broker, 
  selectedProvider, 
  message, 
  setMessage 
}: ChatTabProps) {

  const [messages, setMessages] = useState<any[]>([]);
  const [inputMessage, setInputMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [verifyingMessageId, setVerifyingMessageId] = useState<string | null>(null);
  const [fetchingPrices, setFetchingPrices] = useState(false);

  // 重置消息历史
  useEffect(() => {
    if (selectedProvider) {
      setMessages([]);
    }
  }, [selectedProvider]);

  // 检测是否为交易相关问题
  const isTradingRelated = (text: string): boolean => {
    const tradingKeywords = [
      '交易', '价格', '币安', 'binance', 'btc', 'eth', '买入', '卖出', 
      '做多', '做空', '建议', '分析', '行情', '市场', '加密货币', 
      'crypto', 'trading', 'price', 'buy', 'sell', 'long', 'short'
    ];
    const lowerText = text.toLowerCase();
    return tradingKeywords.some(keyword => lowerText.includes(keyword.toLowerCase()));
  };

  // 从消息中提取交易对符号
  const extractSymbol = (text: string): string | null => {
    const symbolPattern = /([A-Z]{2,10}USDT)/gi;
    const match = text.match(symbolPattern);
    return match ? match[0].toUpperCase() : null;
  };

  // 发送消息（集成交易功能）
  const sendMessage = async () => {
    if (!broker || !selectedProvider || !inputMessage.trim()) return;

    const userMsg = { role: "user", content: inputMessage };
    setMessages((prev) => [...prev, userMsg]);
    const currentInput = inputMessage;
    setInputMessage("");
    setLoading(true);

    try {
      // 首先检查服务是否已验证
      try {
        const isAcknowledged = await broker.inference.userAcknowledged(selectedProvider.address);
        if (!isAcknowledged) {
          setMessage("请先在服务页面验证该服务");
          setMessages((prev) => [...prev, { 
            role: "assistant", 
            content: "错误: 请先在'服务'标签页验证该服务提供者，然后再进行对话。"
          }]);
          setLoading(false);
          return;
        }
      } catch (ackError) {
        console.error("检查服务验证状态失败:", ackError);
        // 继续执行，让后续的错误处理来处理
      }

      // 获取价格数据（如果需要）
      let priceDataText = "";
      if (isTradingRelated(currentInput)) {
        setFetchingPrices(true);
        try {
          const symbol = extractSymbol(currentInput);
          let prices;
          
          if (symbol) {
            prices = await getBinancePrices(symbol);
          } else {
            prices = await getPopularPrices();
          }
          
          priceDataText = formatPricesForAI(prices);
        } catch (priceError) {
          console.error('获取价格数据失败:', priceError);
          setMessage('获取价格数据失败，但将继续对话');
        } finally {
          setFetchingPrices(false);
        }
      }

      // 构建用户消息内容（包含价格数据）
      let userMessageContent = currentInput;
      if (priceDataText) {
        userMessageContent = `${currentInput}\n\n[实时价格数据]\n${priceDataText}`;
      }

      // 构建发送给 AI 的消息（只包含用户消息，价格数据已包含在用户消息中）
      const messagesToSend = [{ role: "user", content: userMessageContent }];

      // 获取服务元数据
      const metadata = await broker.inference.getServiceMetadata(selectedProvider.address);
      
      // 获取请求头（使用原始用户消息，不包含系统消息）
      const headers = await broker.inference.getRequestHeaders(
        selectedProvider.address,
        JSON.stringify([{ role: "user", content: currentInput }])
      );

      // 检查并确保账户余额充足
      let account;
      try {
        account = await broker.inference.getAccount(selectedProvider.address);
      } catch (error) {
        console.log("账户不存在，正在创建并转账...");
        try {
          await broker.ledger.transferFund(
            selectedProvider.address,
            "inference",
            BigInt(2e18)
          );
          // 转账后重新获取账户
          account = await broker.inference.getAccount(selectedProvider.address);
        } catch (transferError) {
          console.error("转账失败:", transferError);
          throw new Error("账户创建失败，请检查主账本余额是否充足");
        }
      }

      // 检查账户余额
      if (account && account.balance <= BigInt(1.5e18)) {
        console.log("子账户余额不足，正在充值...");
        try {
          await broker.ledger.transferFund(
            selectedProvider.address,
            "inference",
            BigInt(2e18)
          );
        } catch (transferError) {
          console.error("充值失败:", transferError);
          throw new Error("账户余额不足，请先在账户页面充值");
        }
      }

      // 发送请求到 AI 服务
      const response = await fetch(`${metadata.endpoint}/chat/completions`, {
        method: "POST",
        headers: { "Content-Type": "application/json", ...headers },
        body: JSON.stringify({
          messages: messagesToSend,
          model: metadata.model,
          stream: false,
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`AI 服务请求失败: ${response.status} - ${errorText}`);
      }

      const result = await response.json();
      
      if (!result.choices || !result.choices[0] || !result.choices[0].message) {
        throw new Error("AI 服务返回格式错误");
      }

      const aiMsg = {
        role: "assistant",
        content: result.choices[0].message.content,
        id: result.id,
        verified: false,
      };
      
      setMessages((prev) => [...prev, aiMsg]);

      // 处理验证和计费
      if (result.id) {
        setVerifyingMessageId(result.id);
        setMessage("正在验证响应...");
        
        try {
          await broker.inference.processResponse(
            selectedProvider.address,
            aiMsg.content,
            result.id
          );
          
          setMessages((prev) => 
            prev.map(msg => 
              msg.id === result.id 
                ? { ...msg, verified: true }
                : msg
            )
          );
          setMessage("响应验证成功");
        } catch (verifyErr) {
          console.error("验证失败:", verifyErr);
          setMessage("响应验证失败");
          // 标记验证失败
          setMessages((prev) => 
            prev.map(msg => 
              msg.id === result.id 
                ? { ...msg, verified: false, verifyError: true }
                : msg
            )
          );
        } finally {
          setVerifyingMessageId(null);
          setTimeout(() => setMessage(""), 3000);
        }
      }
    } catch (err) {
      console.error("发送消息失败:", err);
      const errorMessage = err instanceof Error ? err.message : String(err);
      
      // 提供更友好的错误提示
      let friendlyMessage = errorMessage;
      if (errorMessage.includes("missing revert data")) {
        friendlyMessage = "智能合约调用失败。请确保：1) 服务已验证 2) 账户余额充足 3) 网络连接正常";
      } else if (errorMessage.includes("余额")) {
        friendlyMessage = "账户余额不足，请先在'账户'标签页充值 A0GI 代币";
      } else if (errorMessage.includes("验证")) {
        friendlyMessage = "请先在'服务'标签页验证该服务提供者";
      }
      
      setMessages((prev) => [...prev, { 
        role: "assistant", 
        content: `❌ 错误: ${friendlyMessage}`
      }]);
      setMessage(`错误: ${friendlyMessage}`);
      setTimeout(() => setMessage(""), 5000);
    }
    setLoading(false);
  };

  if (!selectedProvider) {
    return (
      <div>
        <h2>0G Brave Trader</h2>
        <p>请先选择并验证服务</p>
      </div>
    );
  }

  return (
    <div>
      <h2>0G Brave Trader 🚀</h2>
      <div style={{ marginBottom: "10px", fontSize: "14px", color: "#666" }}>
        当前服务: {selectedProvider.name} - {selectedProvider.model}
      </div>
      {fetchingPrices && (
        <div style={{ marginBottom: "10px", fontSize: "12px", color: "#007bff" }}>
          📊 正在获取实时价格数据...
        </div>
      )}
      
      <div
        style={{
          height: "300px",
          overflowY: "auto",
          border: "1px solid #ddd",
          padding: "10px",
          marginBottom: "10px",
        }}
      >
        {messages.length === 0 ? (
          <div style={{ color: "#666", fontStyle: "italic" }}>
            <p>💡 提示：你可以询问交易相关问题，例如：</p>
            <ul style={{ marginTop: "10px", paddingLeft: "20px" }}>
              <li>"BTC 现在的价格是多少？"</li>
              <li>"给我一些交易建议"</li>
              <li>"分析一下 ETH 的行情"</li>
              <li>"现在适合买入还是卖出？"</li>
            </ul>
          </div>
        ) : (
          messages.map((msg, i) => (
            <div key={i} style={{ marginBottom: "10px" }}>
              <strong>{msg.role === "user" ? "你" : "AI"}:</strong> {msg.content}
              {msg.role === "assistant" && msg.id && (
                <span style={{ 
                  marginLeft: "10px", 
                  fontSize: "12px",
                  color: msg.verifyError ? "#dc3545" : 
                         msg.verified ? "#28a745" : 
                         verifyingMessageId === msg.id ? "#ffc107" : "#6c757d"
                }}>
                  {msg.verifyError ? "❌ 验证失败" :
                   msg.verified ? "✓ 已验证" : 
                   verifyingMessageId === msg.id ? "⏳ 验证中..." : "⚠️ 未验证"}
                </span>
              )}
            </div>
          ))
        )}
      </div>

      <div style={{ display: "flex" }}>
        <input
          type="text"
          value={inputMessage}
          onChange={(e) => setInputMessage(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && !loading && sendMessage()}
          placeholder="输入消息或交易问题..."
          style={{ flex: 1, padding: "5px", marginRight: "10px" }}
          disabled={loading || fetchingPrices}
        />
        <button
          onClick={sendMessage}
          disabled={loading || !inputMessage.trim() || fetchingPrices}
          style={{ padding: "5px 15px" }}
        >
          {loading ? "发送中..." : fetchingPrices ? "获取数据..." : "发送"}
        </button>
      </div>
    </div>
  );
}