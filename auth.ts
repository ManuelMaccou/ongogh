import NextAuth from "next-auth"
import Coinbase from "next-auth/providers/coinbase"
 
export const { handlers, signIn, signOut, auth } = NextAuth({
    providers: [
        Coinbase({
            authorization: { 
                params: { 
                    scope: "wallet:user:read,wallet:accounts:read,wallet:transactions:send"
                }
            },
        })
    ],
    debug: true,
    cookies: {
        pkceCodeVerifier: {
            name: "next-auth.pkce.code_verifier",
            options: {
            httpOnly: true,
            sameSite: "none",
            path: "/",
            secure: true,
            },
        },
    },
})