

import NextAuth from "next-auth"
import Coinbase from "next-auth/providers/coinbase"
import { JWT } from "next-auth/jwt";
import { Account } from "next-auth";

// Extending the Token and Account interfaces for explicit typing
interface ExtendedToken extends JWT {
    accessToken?: string;
    refreshToken?: string;
    accessTokenExpires?: number;
    error?: string;
}

interface ExtendedAccount extends Account {
    access_token?: string;
    refresh_token?: string;
    expires_in?: number;
}

async function refreshAccessToken(token: ExtendedToken): Promise<ExtendedToken> {
    const url = 'https://login.coinbase.com/oauth2/token';
    const body = new URLSearchParams({
        grant_type: 'refresh_token',
        refresh_token: token.refreshToken!,
        client_id: process.env.COINBASE_CLIENT_ID!,
        client_secret: process.env.COINBASE_CLIENT_SECRET!,
    });
  
    const response = await fetch(url, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: body.toString(),
    });

    const refreshedTokens = await response.json();

    if (!response.ok) {
        console.error('Failed to refresh token:', refreshedTokens);
        throw new Error(refreshedTokens.error_description || 'Failed to refresh access token');
    }
  
    return {
        accessToken: refreshedTokens.access_token,
        refreshToken: refreshedTokens.refresh_token || token.refreshToken,
        accessTokenExpires: Date.now() + refreshedTokens.expires_in * 1000,
    };
}

console.log("next auth url:", process.env.NEXTAUTH_URL);


export const { handlers, signIn, signOut, auth } = NextAuth({
    providers: [
        Coinbase({
            clientId: process.env.COINBASE_CLIENT_ID || '',
            clientSecret: process.env.COINBASE_CLIENT_SECRET || '',
            authorization: { 
                params: { 
                    scope: "wallet:user:read,wallet:accounts:read,wallet:transactions:send"
                }
            },
        }),
    ],
    debug: true,
    callbacks: {
        async jwt({ token, account }) {
            console.log("JWT callback - account:", account);
            console.log("JWT callback - initial token state:", token);
    
            const safeAccount = account as ExtendedAccount | undefined;
            const currentToken = token as ExtendedToken;
    
            if (safeAccount && safeAccount.access_token) {
                const updatedToken = {
                    ...currentToken,
                    accessToken: safeAccount.access_token,
                    refreshToken: safeAccount.refresh_token,
                    accessTokenExpires: Date.now() + (safeAccount.expires_in ? safeAccount.expires_in * 1000 : 0),
                };
                console.log("JWT callback - updated token from account info:", updatedToken);
                return updatedToken;
            } else if (currentToken.accessTokenExpires && Date.now() > currentToken.accessTokenExpires) {
                console.log("JWT callback - token expired, refreshing...");
                const refreshedToken = await refreshAccessToken(currentToken);
                console.log("JWT callback - refreshed token:", refreshedToken);
                return refreshedToken;
            }
            console.log("JWT callback - returning current token:", currentToken);
            return currentToken;
        },
        async session({ session, token }) {
            console.log("Session callback - token passed to session:", token);
            const currentToken = token as ExtendedToken;
    
            if (currentToken.accessToken) {
                session.accessToken = currentToken.accessToken;
                session.error = currentToken.error;
            }
            console.log("Session callback - modified session:", session);
            return session;
        }
    },
});
