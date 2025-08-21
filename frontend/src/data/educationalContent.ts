export interface FAQItem {
  question: string;
  answer: string;
  category: "general" | "defi" | "risk" | "technical" | "security";
}

export interface GlossaryTerm {
  term: string;
  definition: string;
  example?: string;
  relatedTerms?: string[];
}

export interface Tutorial {
  id: string;
  title: string;
  description: string;
  difficulty: "beginner" | "intermediate" | "advanced";
  duration: string;
  steps: TutorialStep[];
}

export interface TutorialStep {
  title: string;
  content: string;
  tip?: string;
  warning?: string;
}

export const faqData: FAQItem[] = [
  // General Questions
  {
    question: "What is a Personal DeFi Wealth Manager?",
    answer:
      "A Personal DeFi Wealth Manager is an AI-powered platform that helps you optimize your cryptocurrency investments across various DeFi (Decentralized Finance) protocols on the Avalanche blockchain. It automatically allocates your funds based on your risk profile to maximize returns while managing risk.",
    category: "general",
  },
  {
    question: "How does the AI determine my investment strategy?",
    answer:
      "Our AI analyzes multiple factors including your age, income, expenses, investment goals, risk tolerance, and market conditions. It uses this data to calculate a risk score (0-100) and recommends an allocation strategy across three protocols: Aave (lending), TraderJoe (liquidity provision), and YieldYak (yield farming).",
    category: "general",
  },
  {
    question: "Is my money safe?",
    answer:
      "Your funds are held in smart contracts on the Avalanche blockchain, not by us. However, as with all DeFi investments, there are risks including smart contract bugs, market volatility, and impermanent loss. Never invest more than you can afford to lose.",
    category: "security",
  },

  // DeFi Questions
  {
    question: "What is Aave?",
    answer:
      "Aave is a decentralized lending and borrowing protocol on multiple chains including Avalanche. When you deposit funds into Aave through our platform, you earn interest from borrowers who use your funds. It's generally considered the lowest-risk option among our three protocols, offering stable but moderate returns.",
    category: "defi",
  },
  {
    question: "What is TraderJoe?",
    answer:
      "TraderJoe is Avalanche's leading decentralized exchange (DEX). Through our platform, your funds are used to provide liquidity to trading pairs, earning you a share of trading fees. This offers moderate risk and returns, with the possibility of impermanent loss if token prices diverge significantly.",
    category: "defi",
  },
  {
    question: "What is YieldYak?",
    answer:
      "YieldYak is an auto-compounding yield optimizer that automatically reinvests your earnings to maximize returns. It employs various yield farming strategies across multiple protocols. This is our highest-risk, highest-reward option, suitable for aggressive investors.",
    category: "defi",
  },
  {
    question: "What is APY?",
    answer:
      "APY (Annual Percentage Yield) represents the real rate of return on your investment, taking into account the effect of compounding interest. Unlike simple interest, APY includes the interest you earn on your interest, giving you a more accurate picture of potential earnings.",
    category: "defi",
  },

  // Risk Questions
  {
    question: "What are the risk profiles?",
    answer:
      "We offer three risk profiles: Conservative (0-33 score) allocates 70% to Aave and 30% to TraderJoe for stable returns. Balanced (34-66 score) spreads funds 40% Aave, 40% TraderJoe, 20% YieldYak for moderate growth. Aggressive (67-100 score) focuses on high yields with 20% Aave, 30% TraderJoe, 50% YieldYak.",
    category: "risk",
  },
  {
    question: "What is impermanent loss?",
    answer:
      "Impermanent loss occurs when providing liquidity to a trading pair whose tokens change in price relative to each other. The greater the price divergence, the greater the impermanent loss. It's called 'impermanent' because the loss only becomes permanent when you withdraw your liquidity.",
    category: "risk",
  },
  {
    question: "How often should I rebalance?",
    answer:
      "Rebalancing frequency depends on your risk profile and market conditions. Conservative investors typically rebalance monthly, balanced investors bi-weekly, and aggressive investors weekly. Our AI monitors your portfolio continuously and recommends rebalancing when your allocation drifts more than 10% from target.",
    category: "risk",
  },

  // Technical Questions
  {
    question: "What wallet do I need?",
    answer:
      "You need a Web3 wallet that supports the Avalanche C-Chain network, such as MetaMask, Core, or Rabby. The wallet must be configured for Avalanche and contain AVAX tokens for gas fees. We provide easy wallet connection through WalletConnect.",
    category: "technical",
  },
  {
    question: "What are gas fees?",
    answer:
      "Gas fees are transaction costs paid to validators for processing your transactions on the Avalanche blockchain. These fees vary based on network congestion but are typically much lower on Avalanche compared to Ethereum. Expect to pay $0.10-$1.00 per transaction.",
    category: "technical",
  },
  {
    question: "Can I withdraw my funds anytime?",
    answer:
      "Yes, you can withdraw your funds at any time through the emergency withdraw function. However, frequent withdrawals and deposits may impact your returns due to gas fees. Some protocols may have small exit fees or timelock periods.",
    category: "technical",
  },

  // Security Questions
  {
    question: "Who has access to my funds?",
    answer:
      "Only you have access to your funds through your wallet's private keys. Our smart contracts are non-custodial, meaning we never hold or control your assets. Always keep your private keys and seed phrases secure and never share them with anyone.",
    category: "security",
  },
  {
    question: "What happens if the website goes down?",
    answer:
      "Your funds remain safe in the smart contracts on the blockchain. You can always interact directly with the contracts using tools like Snowtrace (Avalanche's blockchain explorer) to withdraw your funds, even if our website is unavailable.",
    category: "security",
  },
];

export const glossaryTerms: GlossaryTerm[] = [
  {
    term: "DeFi",
    definition:
      "Decentralized Finance - Financial services built on blockchain technology that operate without traditional intermediaries like banks.",
    example: "Lending, borrowing, and trading cryptocurrencies without a bank.",
    relatedTerms: ["Smart Contract", "Yield Farming", "Liquidity Pool"],
  },
  {
    term: "Smart Contract",
    definition:
      "Self-executing contracts with terms directly written into code that automatically execute when conditions are met.",
    example:
      "A smart contract that automatically pays interest to lenders every month.",
    relatedTerms: ["DeFi", "Blockchain", "Gas Fees"],
  },
  {
    term: "APY",
    definition:
      "Annual Percentage Yield - The real rate of return earned on an investment, taking into account compounding interest.",
    example:
      "A 10% APY means $1,000 would grow to $1,100 after one year with compounding.",
    relatedTerms: ["APR", "Yield Farming", "Compound Interest"],
  },
  {
    term: "Liquidity Pool",
    definition:
      "A collection of funds locked in a smart contract used to facilitate decentralized trading and lending.",
    example: "An AVAX-USDC pool where traders can swap between these tokens.",
    relatedTerms: ["DEX", "Impermanent Loss", "LP Token"],
  },
  {
    term: "Yield Farming",
    definition:
      "The practice of staking or lending crypto assets to generate returns or rewards in the form of additional cryptocurrency.",
    example: "Depositing USDC to earn 15% APY in protocol rewards.",
    relatedTerms: ["APY", "Staking", "Liquidity Mining"],
  },
  {
    term: "Impermanent Loss",
    definition:
      "Temporary loss experienced by liquidity providers due to price divergence between paired assets.",
    example:
      "If AVAX price doubles while USDC stays stable, LP providers face impermanent loss.",
    relatedTerms: ["Liquidity Pool", "DEX", "TraderJoe"],
  },
  {
    term: "Gas Fees",
    definition:
      "Transaction fees paid to blockchain validators for processing and validating transactions.",
    example: "Paying 0.05 AVAX to execute a smart contract transaction.",
    relatedTerms: ["Blockchain", "Transaction", "Validator"],
  },
  {
    term: "Rebalancing",
    definition:
      "Adjusting portfolio allocations back to target percentages to maintain desired risk level.",
    example:
      "Moving funds from YieldYak to Aave when aggressive allocation exceeds 60%.",
    relatedTerms: ["Portfolio", "Risk Management", "Allocation"],
  },
  {
    term: "Slippage",
    definition:
      "The difference between expected and actual transaction prices due to market movement.",
    example:
      "Expecting to swap at $40 but executing at $39.50 due to price change.",
    relatedTerms: ["DEX", "Liquidity", "Trading"],
  },
  {
    term: "TVL",
    definition:
      "Total Value Locked - The total value of assets deposited in a DeFi protocol.",
    example: "Aave has $10B+ TVL, indicating strong user trust and liquidity.",
    relatedTerms: ["DeFi", "Liquidity", "Protocol"],
  },
  {
    term: "Avalanche",
    definition:
      "A high-performance blockchain platform supporting smart contracts and decentralized applications.",
    example:
      "Avalanche processes transactions in under 2 seconds with low fees.",
    relatedTerms: ["Blockchain", "AVAX", "C-Chain"],
  },
  {
    term: "AVAX",
    definition:
      "The native cryptocurrency of the Avalanche blockchain, used for transactions and staking.",
    example: "Using AVAX to pay for gas fees on Avalanche network.",
    relatedTerms: ["Avalanche", "Gas Fees", "Cryptocurrency"],
  },
];

export const tutorials: Tutorial[] = [
  {
    id: "getting-started",
    title: "Getting Started with DeFi Wealth Management",
    description:
      "Learn the basics of DeFi investing and how to set up your portfolio",
    difficulty: "beginner",
    duration: "10 minutes",
    steps: [
      {
        title: "Understanding DeFi",
        content:
          "DeFi (Decentralized Finance) allows you to earn yields on your cryptocurrency without traditional banks. Through smart contracts, you can lend, borrow, and provide liquidity to earn returns.",
        tip: "Start with small amounts to familiarize yourself with the process.",
        warning: "Never invest more than you can afford to lose.",
      },
      {
        title: "Connect Your Wallet",
        content:
          "Click the 'Connect Wallet' button and select your Web3 wallet. Make sure you're on the Avalanche network and have some AVAX for gas fees.",
        tip: "Keep at least 1 AVAX in your wallet for transaction fees.",
      },
      {
        title: "Complete Risk Assessment",
        content:
          "Answer questions about your financial situation and goals. This helps our AI determine the best investment strategy for you.",
        tip: "Be honest about your risk tolerance - it's better to be conservative when starting.",
      },
      {
        title: "Make Your First Deposit",
        content:
          "Start with a small deposit to test the system. Enter the amount, review the allocation strategy, and confirm the transaction.",
        tip: "Your first transaction may take a bit longer as the smart contract initializes your position.",
      },
      {
        title: "Monitor Your Portfolio",
        content:
          "Check your dashboard regularly to track performance. The AI will notify you when rebalancing is recommended.",
        tip: "Don't panic during market volatility - DeFi yields tend to be more stable than token prices.",
      },
    ],
  },
  {
    id: "understanding-risk",
    title: "Understanding and Managing Risk",
    description:
      "Learn about different types of risks in DeFi and how to manage them",
    difficulty: "intermediate",
    duration: "15 minutes",
    steps: [
      {
        title: "Smart Contract Risk",
        content:
          "Smart contracts can have bugs or vulnerabilities. We mitigate this by using established protocols and implementing security best practices.",
        tip: "Diversification across protocols helps reduce single-point-of-failure risk.",
      },
      {
        title: "Market Risk",
        content:
          "Cryptocurrency prices are volatile. Your portfolio value will fluctuate with market conditions, though yield farming provides some buffer through continuous earnings.",
        warning: "Past performance doesn't guarantee future results.",
      },
      {
        title: "Impermanent Loss",
        content:
          "When providing liquidity, price divergence between paired assets can cause temporary losses. This risk is highest in volatile pairs.",
        tip: "Stable pairs like USDC-USDT have minimal impermanent loss risk.",
      },
      {
        title: "Liquidity Risk",
        content:
          "Some protocols may have withdrawal limits or delays during high demand. Always maintain some liquid assets for emergencies.",
        tip: "Check protocol TVL - higher TVL generally means better liquidity.",
      },
      {
        title: "Risk Management Strategies",
        content:
          "Diversify across protocols, maintain an emergency fund, rebalance regularly, and never invest borrowed money.",
        tip: "Set stop-loss levels mentally and stick to them.",
      },
    ],
  },
  {
    id: "maximizing-yields",
    title: "Advanced Yield Optimization Strategies",
    description: "Learn advanced techniques to maximize your DeFi returns",
    difficulty: "advanced",
    duration: "20 minutes",
    steps: [
      {
        title: "Understanding Yield Sources",
        content:
          "DeFi yields come from lending interest, trading fees, liquidity incentives, and protocol rewards. Each source has different risk-return profiles.",
        tip: "Protocol rewards (governance tokens) can significantly boost APY but may be volatile.",
      },
      {
        title: "Timing Your Deposits",
        content:
          "Gas fees are lowest during off-peak hours (weekends, early morning UTC). Large deposits during high-yield periods can maximize returns.",
        tip: "Monitor protocol APYs - they often spike during high trading volume periods.",
      },
      {
        title: "Strategic Rebalancing",
        content:
          "Rebalance when allocation drift exceeds 10% or when APY differentials exceed 2%. Consider tax implications of frequent rebalancing.",
        tip: "Set up alerts for significant APY changes across protocols.",
      },
      {
        title: "Compound Strategies",
        content:
          "YieldYak auto-compounds earnings, but for other protocols, regular claiming and reinvesting can significantly boost long-term returns.",
        tip: "Calculate if gas fees justify manual compounding based on position size.",
      },
      {
        title: "Risk-Adjusted Optimization",
        content:
          "Higher yields often mean higher risk. Use Sharpe ratio (return per unit of risk) to evaluate if extra yield justifies additional risk.",
        tip: "A Sharpe ratio above 1.5 indicates good risk-adjusted returns.",
      },
    ],
  },
];

export const protocolGuides = {
  aave: {
    name: "Aave",
    type: "Lending Protocol",
    description:
      "Aave is a decentralized lending and borrowing protocol on multiple chains including Avalanche. Users can supply assets to earn interest or borrow against collateral.",
    keyFeatures: [
      "Supply assets to earn passive interest",
      "Borrow against supplied collateral",
      "No lock-up periods - withdraw anytime",
      "Interest rates adjust based on supply and demand",
    ],
    risks: [
      "Smart contract risk",
      "Liquidation risk for borrowers",
      "Variable interest rates",
    ],
    bestFor:
      "Conservative investors seeking stable, predictable yields with low risk.",
  },
  traderjoe: {
    name: "TraderJoe",
    type: "DEX & Liquidity Provision",
    description:
      "TraderJoe is Avalanche's premier decentralized exchange where users can swap tokens and provide liquidity to earn trading fees.",
    keyFeatures: [
      "Earn trading fees by providing liquidity",
      "Additional JOE token rewards for select pairs",
      "Instant swaps with low slippage",
      "Wide variety of trading pairs",
    ],
    risks: [
      "Impermanent loss risk",
      "Smart contract risk",
      "Trading volume dependency",
    ],
    bestFor:
      "Balanced investors comfortable with moderate risk for higher returns than pure lending.",
  },
  yieldyak: {
    name: "YieldYak",
    type: "Yield Optimizer",
    description:
      "YieldYak automatically compounds yields across various Avalanche protocols, maximizing returns through efficient reinvestment strategies.",
    keyFeatures: [
      "Auto-compounding for maximum returns",
      "Gas cost socialization across users",
      "Multiple strategy vaults",
      "No deposit or withdrawal fees",
    ],
    risks: [
      "Smart contract risk (multiple protocols)",
      "Strategy risk",
      "Higher complexity",
    ],
    bestFor:
      "Aggressive investors seeking maximum yields and comfortable with higher complexity and risk.",
  },
};
