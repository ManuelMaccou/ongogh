'use client';

import { FunctionComponent } from 'react';
import { usePrivy, useWallets } from '@privy-io/react-auth';
import Web3 from 'web3';
import { useSearchParams } from 'next/navigation';
import { Suspense } from 'react'
import LoginWithCoinbaseButton from '@/components/LoginWithCoinbaseButton';

interface CustomTransactionReceipt {
    blockHash: string;
    blockNumber: bigint;
    cumulativeGasUsed: bigint;
    effectiveGasPrice: bigint;
    from: string;
    gasUsed: bigint;
    logs: any[];
    logsBloom: string;
    status: boolean | bigint;
    to: string;
    transactionHash: string;
    transactionIndex: bigint;
    type: bigint;
    contractAddress: string | null | undefined;
}

interface PaymentContentProps {
    ready: boolean;
    authenticated: boolean;
    login: () => void;
    logout: () => void;
    wallets: any[];
}

function PaymentPage() {
    const { ready, authenticated, login, logout } = usePrivy();
    const { wallets } = useWallets();

    return (
        <Suspense fallback={<div>Loading...</div>}>
            <PaymentContent ready={ready} authenticated={authenticated} login={login} logout={logout} wallets={wallets} />
        </Suspense>
    );
}


const PaymentContent: FunctionComponent<PaymentContentProps> = ({ ready, authenticated, login, logout, wallets }) => {
    const searchParams = useSearchParams();

    const walletAddress = searchParams.get('address') || "0xCA430AD5C04Afe38A4388e88A67Ca35fd405b773";
    const price = searchParams.get('price') || "10";
    const description = searchParams.get('description') || "Necklace";

    const handleLogout = () => {
        logout();
    };

    const handleLogin = () => {
        login();
    };

    const handlePayment = async () => {
        if (!ready || !authenticated) {
            login();
            return;
        }
        
        if (wallets.length === 0) {
            console.error('No wallets available');
            return;
        }

        if (!walletAddress || !price || !description) {
            console.error('Missing wallet address, description, or price');
            return;
        }

        const usdcAddress = '0x036CbD53842c5426634e7929541eC2318f3dCF7e';
        const usdcAbi = [
            {
                inputs: [
                { internalType: 'address', name: 'to', type: 'address' },
                { internalType: 'uint256', name: 'value', type: 'uint256' },
                ],
                name: 'transfer',
                outputs: [{ internalType: 'bool', name: '', type: 'bool' }],
                stateMutability: 'nonpayable',
                type: 'function',
            },
            {
                inputs: [{ internalType: 'address', name: 'account', type: 'address' }],
                name: 'balanceOf',
                outputs: [{ internalType: 'uint256', name: '', type: 'uint256' }],
                stateMutability: 'view',
                type: 'function',
            },
            {
                inputs: [],
                name: 'decimals',
                outputs: [{ internalType: 'uint8', name: '', type: 'uint8' }],
                stateMutability: 'view',
                type: 'function',
            },
            ];

        try {
            const provider = new Web3(await wallets[0].getEthereumProvider());
            const contract = new provider.eth.Contract(usdcAbi, usdcAddress);
            const usdcAmount = provider.utils.toWei(price, 'mwei');
            
            contract.methods.transfer(walletAddress, usdcAmount).send({ from: wallets[0].address })
            .on('transactionHash', (hash: string) => {
                console.log('Transaction Hash:', hash);
            })
            .on('receipt', async (receipt: any) => {
                console.log('Receipt:', receipt as CustomTransactionReceipt);
            })
            .on('error', (error: Error) => {
                console.error('Error:', error);
            });
        } catch (error: unknown) {
            console.error('An error occurred:', error);
        }
    };

    return (
        <div>
        {authenticated ? (
            <>
            <button onClick={handleLogout}>Logout</button>
            <h1>Confirm Payment</h1>
            <p>Description: {description}</p>
            <p>Price: {price} USDC</p>
            {wallets.length > 0 ? (
                <>
                <button onClick={handlePayment}>Pay</button>
                <p>Connected address: {wallets[0].address}</p>
                </>
            ) : (
                <p>No wallet connected. Please connect a wallet.</p>
            )}
            </>
        ) : (
            <>
            <button onClick={handleLogin}>Log in to Continue</button>
            <LoginWithCoinbaseButton />
            </>
        )}
        </div>
    );
}

export default PaymentPage;