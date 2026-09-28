import { useState } from "react";
import { supabase } from "../lib/supabase";

function Signup({ onSignup, onBackToLogin }) {

    const [username, setUsername] = useState("");
    const [name, setName] = useState("");
    const [age, setAge] = useState("");
    const [phone, setPhone] = useState("");
    const [password, setPassword] = useState("");

    const [error, setError] = useState("");
    const [success, setSuccess] = useState("");
    const [loading, setLoading] = useState(false);

    const handleSignup = async (e) => {

        e.preventDefault();

        setError("");
        setSuccess("");
        setLoading(true);

        try {

            if (!username.trim()) {
                setError("Please enter a username.");
                setLoading(false);
                return;
            }

            if (!password) {
                setError("Please enter a password.");
                setLoading(false);
                return;
            }

            // Internal email used only by Supabase Auth
            const internalEmail =
                `${username.trim().toLowerCase()}@aerohealth.local`;

            // Create Supabase Auth account
            const { data, error: signupError } =
                await supabase.auth.signUp({
                    email: internalEmail,
                    password: password,
                });

            if (signupError) {
                setError(signupError.message);
                setLoading(false);
                return;
            }

            if (!data.user) {
                setError("Unable to create account.");
                setLoading(false);
                return;
            }

            // Create profile
            const { error: profileError } =
                await supabase
                    .from("profiles")
                    .insert({
                        id: data.user.id,
                        username: username.trim().toLowerCase(),
                        name: name.trim(),
                        age: age ? Number(age) : null,
                        phone: phone.trim() || null,
                    });

            if (profileError) {
                setError(profileError.message);
                setLoading(false);
                return;
            }

            setSuccess("Account created successfully!");

            if (onSignup) {
                onSignup(data.user);
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
                        Create your account
                    </p>

                </div>

                <form
                    onSubmit={handleSignup}
                    className="space-y-4"
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
                            placeholder="Choose a username"
                            required
                            className="w-full px-4 py-3 border border-slate-300 rounded-lg outline-none focus:ring-2 focus:ring-blue-500"
                        />

                    </div>


                    {/* Full Name */}

                    <div>

                        <label className="block text-sm font-medium text-slate-700 mb-1">
                            Full Name
                        </label>

                        <input
                            type="text"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            placeholder="Enter your name"
                            required
                            className="w-full px-4 py-3 border border-slate-300 rounded-lg outline-none focus:ring-2 focus:ring-blue-500"
                        />

                    </div>


                    {/* Age */}

                    <div>

                        <label className="block text-sm font-medium text-slate-700 mb-1">
                            Age
                        </label>

                        <input
                            type="number"
                            value={age}
                            onChange={(e) => setAge(e.target.value)}
                            placeholder="Enter your age"
                            min="1"
                            max="120"
                            required
                            className="w-full px-4 py-3 border border-slate-300 rounded-lg outline-none focus:ring-2 focus:ring-blue-500"
                        />

                    </div>


                    {/* Phone */}

                    <div>

                        <label className="block text-sm font-medium text-slate-700 mb-1">
                            Phone Number
                        </label>

                        <input
                            type="tel"
                            value={phone}
                            onChange={(e) => setPhone(e.target.value)}
                            placeholder="Enter phone number"
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
                            placeholder="Create a password"
                            minLength="6"
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


                    {/* Success */}

                    {success && (
                        <div className="bg-green-50 text-green-600 text-sm p-3 rounded-lg">
                            {success}
                        </div>
                    )}


                    {/* Create Account */}

                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full py-3 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 disabled:opacity-50"
                    >

                        {loading
                            ? "Creating Account..."
                            : "Create Account"
                        }

                    </button>

                </form>


                <div className="text-center mt-6 text-sm text-slate-500">

                    Already have an account?{" "}

                    <button
                        type="button"
                        onClick={onBackToLogin}
                        className="text-blue-600 font-semibold hover:underline"
                    >
                        Sign In
                    </button>

                </div>

            </div>

        </div>
    );
}

export default Signup;