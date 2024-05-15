import { signIn } from "next-auth/react";

function LoginWithCoinbaseButton() {
    const handleLogin = () => {
        signIn('coinbase', { callbackUrl: `${process.env.NEXT_PUBLIC_BASE_URL}/api/auth/callback/coinbase` })
            .catch(error => {
                console.error('Failed to start OAuth process', error);
                alert('Login failed! Please try again.');
            });
    };

    return (
        <button onClick={handleLogin}>Log in with Coinbase</button>
    );
}

export default LoginWithCoinbaseButton;
