import { useState } from "react";
import { supabase } from "../lib/supabase";

function Login({ onLogin, onCreateAccount }) {

    const [username, setUsername] = useState("");
    const [password, setPassword] = useState("");

    const [error, setError] = useState("");
    const [loading, setLoading] = useState(false);


    const handleLogin = async (e) => {

        e.preventDefault();

        setError("");
        setLoading(true);

        try {

            if (!username.trim()) {
                setError("Please enter your username.");
                setLoading(false);
                return;
            }

            if (!password) {
                setError("Please enter your password.");
                setLoading(false);
                return;
            }


            // Find the user's profile using username
            const { data: profile, error: profileError } =
                await supabase
                    .from("profiles")
                    .select("id, username, name, age, phone")
                    .eq("username", username.trim().toLowerCase())
                    .single();


            if (profileError || !profile) {
                setError("Invalid username or password.");
                setLoading(false);
                return;
            }


            // Supabase Auth internally uses this email
            const internalEmail =
                `${username.trim().toLowerCase()}@aerohealth.local`;


            // Verify password
            const { data, error: loginError } =
                await supabase.auth.signInWithPassword({
                    email: internalEmail,
                    password: password,
                });


            if (loginError) {
                setError("Invalid username or password.");
                setLoading(false);
                return;
            }


            // Successful login
            if (onLogin) {
                onLogin(data.user, profile);
            }

        } catch (err) {

            console.error(err);
            setError("Something went wrong. Please try again.");

        } finally {

            setLoading(false);

        }
    };


    return (

        <div className="min-h-screen flex items-center justify-center bg-slate-100 px-4">

            <div className="w-full max-w-md bg-white rounded-2xl shadow-lg p-8">

                <div className="text-center mb-7">

                    <h1 className="text-3xl font-bold text-slate-800">
                        AeroHealth AI
                    </h1>

                    <p className="text-slate-500 mt-2">
                        AI Hospital Receptionist
                    </p>

                </div>


                <form
                    onSubmit={handleLogin}
                    className="space-y-5"
                >

                    {/* Username */}

                    <div>

                        <label className="block text-sm font-medium text-slate-700 mb-1">
                            Username
                        </label>

                        <input
                            type="text"
                            value={username}
                            onChange={(e) => setUsername(e.target.value)}
                            placeholder="Enter username"
                            required
                            className="w-full px-4 py-3 border border-slate-300 rounded-lg outline-none focus:ring-2 focus:ring-blue-500"
                        />

                    </div>


                    {/* Password */}

                    <div>

                        <label className="block text-sm font-medium text-slate-700 mb-1">
                            Password
                        </label>

                        <input
                            type="password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            placeholder="Enter password"
                            required
                            className="w-full px-4 py-3 border border-slate-300 rounded-lg outline-none focus:ring-2 focus:ring-blue-500"
                        />

                    </div>


                    {/* Error */}

                    {error && (

                        <div className="bg-red-50 text-red-600 text-sm p-3 rounded-lg">
                            {error}
                        </div>

                    )}


                    {/* Login */}

                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full py-3 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 disabled:opacity-50"
                    >

                        {loading
                            ? "Signing In..."
                            : "Sign In"
                        }

                    </button>

                </form>


                <div className="text-center mt-6 text-sm text-slate-500">

                    Don't have an account?{" "}

                    <button
                        type="button"
                        onClick={onCreateAccount}
                        className="text-blue-600 font-semibold hover:underline"
                    >
                        Create Account
                    </button>

                </div>

            </div>

        </div>
    );
}

export default Login;