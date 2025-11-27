
import { ConnectButton } from "@rainbow-me/rainbowkit";
import { useAccount, useWalletClient } from "wagmi";
import { useState, useEffect } from "react";
import { createZGComputeNetworkBroker } from "@0glabs/0g-serving-broker";
import { BrowserProvider } from "ethers";
import AccountTab from "../components/AccountTab";
import ServiceTab from "../components/ServiceTab";
import ChatTab from "../components/ChatTab";

export default function Home() {
  const { isConnected } = useAccount();
  const { data: walletClient } = useWalletClient();

  // 基础状态
  const [broker, setBroker] = useState<any>(null);
  const [activeTab, setActiveTab] = useState("account");
  const [message, setMessage] = useState("");
  const [selectedProvider, setSelectedProvider] = useState<any>(null);

  // 初始化 Broker
  useEffect(() => {
    if (!isConnected || !walletClient || broker) return;

    const initBroker = async () => {
      try {
        const provider = new BrowserProvider(walletClient);
        const signer = await provider.getSigner();
        const instance = await createZGComputeNetworkBroker(signer);
        setBroker(instance);
        console.log("Broker 初始化成功");
      } catch (err) {
        console.error("Broker 初始化失败:", err);
      }
    };

    initBroker();
  }, [isConnected, walletClient, broker]);

  
  if (!isConnected) {
    return (
      <div style={{ padding: "20px", textAlign: "center" }}>
        <h1>0G Brave Trader 🚀</h1>
        <p>智能交易助手 - 基于 0G Broker 的去中心化 AI 交易顾问</p>
        <p>请先连接钱包</p>
        <div style={{ marginTop: "20px" }}>
          <ConnectButton />
        </div>
      </div>
    );
  }

  return (
    <div style={{ padding: "20px", maxWidth: "800px", margin: "0 auto" }}>
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          marginBottom: "20px",
        }}
      >
        <div>
          <h1>0G Brave Trader 🚀</h1>
          <p style={{ fontSize: "14px", color: "#666", marginTop: "-10px" }}>
            智能交易助手 - 基于实时市场数据的 AI 交易建议
          </p>
        </div>
        <ConnectButton />
      </div>

      {/* 标签导航 */}
      <div style={{ marginBottom: "20px" }}>
        <button
          onClick={() => setActiveTab("account")}
          style={{
            padding: "10px 20px",
            marginRight: "10px",
            background: activeTab === "account" ? "#007bff" : "#f0f0f0",
            color: activeTab === "account" ? "white" : "black",
            border: "none",
            cursor: "pointer",
          }}
        >
          账户
        </button>
        <button
          onClick={() => setActiveTab("service")}
          style={{
            padding: "10px 20px",
            marginRight: "10px",
            background: activeTab === "service" ? "#007bff" : "#f0f0f0",
            color: activeTab === "service" ? "white" : "black",
            border: "none",
            cursor: "pointer",
          }}
        >
          服务
        </button>
        <button
          onClick={() => setActiveTab("chat")}
          style={{
            padding: "10px 20px",
            background: activeTab === "chat" ? "#007bff" : "#f0f0f0",
            color: activeTab === "chat" ? "white" : "black",
            border: "none",
            cursor: "pointer",
          }}
        >
          交易助手
        </button>
      </div>

      {/* 内容区域 */}
      <div
        style={{
          border: "1px solid #ddd",
          padding: "20px",
          minHeight: "400px",
        }}
      >
        {!broker ? (
          <div>正在初始化...</div>
        ) : (
          <>
            {activeTab === "account" && (
              <AccountTab
                broker={broker}
                message={message}
                setMessage={setMessage}
              />
            )}
            
                        {activeTab === "service" && (
              <ServiceTab
                broker={broker}
                selectedProvider={selectedProvider}
                setSelectedProvider={setSelectedProvider}
                message={message}
                setMessage={setMessage}
              />
            )}
            
            {activeTab === "chat" && (
              <ChatTab
                broker={broker}
                selectedProvider={selectedProvider}
                message={message}
                setMessage={setMessage}
              />
            )}
            
            {activeTab !== "account" && activeTab !== "service" && activeTab !== "chat" && (
              <div>
                <p>当前标签: {activeTab}</p>
                <p>其他功能待添加...</p>
              </div>
            )}
          </>
        )}

        {/* 消息提示 */}
        {message && (
          <div
            style={{
              marginTop: "20px",
              padding: "10px",
              background: message.includes("成功") ? "#d4edda" : "#f8d7da",
              color: message.includes("成功") ? "#155724" : "#721c24",
            }}
          >
            {message}
          </div>
        )}
      </div>
    </div>
  );
}